import "dotenv/config";
import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import type { ZodType } from "zod";

export type ReasoningEffort = "low" | "medium" | "high";
export interface HaqSetuLlmOptions { model?: string; reasoningEffort?: ReasoningEffort; }

/**
 * Thin edge-only wrapper around OpenAI GPT-5.6. Eligibility decisions must remain in server/engine;
 * this client only does the messy-input / plain-language work at the edges of the pipeline.
 *
 * Uses the OpenAI SDK's chat.completions API with schema-enforced structured output, vision, and
 * programmatic tool calling. The default model is the GPT-5.6 "terra" tier, with configurable
 * reasoning effort.
 */
export class HaqSetuLlmClient {
  private readonly client: OpenAI;
  private readonly model: string;
  private readonly reasoningEffort: ReasoningEffort;

  constructor(options: HaqSetuLlmOptions = {}) {
    this.reasoningEffort = options.reasoningEffort ?? (process.env.OPENAI_REASONING_EFFORT as ReasoningEffort | undefined) ?? "medium";
    if (!process.env.OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is required; copy .env.example to .env and set your key.");
    this.client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    this.model = options.model ?? process.env.OPENAI_MODEL ?? "gpt-5.6-terra";
  }

  private reasoningParams(): Record<string, unknown> {
    return { reasoning_effort: this.reasoningEffort };
  }

  async respond(input: string): Promise<string> {
    const response = await this.client.chat.completions.create({
      model: this.model,
      messages: [{ role: "user", content: input }],
      ...this.reasoningParams()
    });
    return response.choices[0]?.message?.content ?? "";
  }

  async parse<T>(input: string, instructions: string, schema: ZodType<T>, schemaName: string): Promise<T> {
    const response = await this.client.chat.completions.parse({
      model: this.model,
      messages: [
        { role: "system", content: instructions },
        { role: "user", content: input }
      ],
      response_format: zodResponseFormat(schema, schemaName),
      ...this.reasoningParams()
    });
    const parsed = response.choices[0]?.message?.parsed;
    if (!parsed) throw new Error("The model returned no structured intake result.");
    return schema.parse(parsed);
  }

  async parseVision<T>(imageBase64: string, instructions: string, schema: ZodType<T>, schemaName: string): Promise<T> {
    const imageUrl = imageBase64.startsWith("data:") ? imageBase64 : `data:image/jpeg;base64,${imageBase64}`;
    const response = await this.client.chat.completions.parse({
      model: this.model,
      messages: [{
        role: "user",
        content: [
          { type: "text", text: instructions },
          { type: "image_url", image_url: { url: imageUrl, detail: "high" } }
        ]
      }],
      response_format: zodResponseFormat(schema, schemaName),
      ...this.reasoningParams()
    });
    const parsed = response.choices[0]?.message?.parsed;
    if (!parsed) throw new Error("The model returned no structured document result.");
    return schema.parse(parsed);
  }

  async callPdfMappingTool(input: string): Promise<string[]> {
    const response = await this.client.chat.completions.create({
      model: this.model,
      messages: [{ role: "user", content: input }],
      tools: [{
        type: "function",
        function: {
          name: "map_pdf_fields",
          description: "Select PDF fields that have a source fact. Never provide a value.",
          strict: true,
          parameters: {
            type: "object", additionalProperties: false,
            properties: { pdf_fields: { type: "array", items: { type: "string" } } },
            required: ["pdf_fields"]
          }
        }
      }],
      tool_choice: { type: "function", function: { name: "map_pdf_fields" } },
      ...this.reasoningParams()
    });
    const call = response.choices[0]?.message?.tool_calls?.find((item) => item.type === "function" && item.function.name === "map_pdf_fields");
    if (!call || call.type !== "function") return [];
    const parsed = JSON.parse(call.function.arguments) as { pdf_fields?: unknown };
    return Array.isArray(parsed.pdf_fields) && parsed.pdf_fields.every((field) => typeof field === "string") ? parsed.pdf_fields : [];
  }
}
