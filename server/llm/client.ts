import "dotenv/config";
import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import type { ZodType } from "zod";

export type ReasoningEffort = "low" | "medium" | "high";
export interface HaqSetuLlmOptions { model?: string; reasoningEffort?: ReasoningEffort; }

/** Thin edge-only wrapper; eligibility decisions must remain in server/engine. */
export class HaqSetuLlmClient {
  private readonly client: OpenAI;
  private readonly model: string;
  private readonly reasoningEffort: ReasoningEffort;
  constructor(options: HaqSetuLlmOptions = {}) {
    if (!process.env.OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is required; copy .env.example to .env.");
    this.client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    this.model = options.model ?? process.env.OPENAI_MODEL ?? "gpt-5.6-terra";
    this.reasoningEffort = options.reasoningEffort ?? (process.env.OPENAI_REASONING_EFFORT as ReasoningEffort | undefined) ?? "medium";
  }
  respond(input: string) {
    return this.client.responses.create({ model: this.model, input, reasoning: { effort: this.reasoningEffort } });
  }

  async parse<T>(input: string, instructions: string, schema: ZodType<T>, schemaName: string): Promise<T> {
    const response = await this.client.responses.parse({
      model: this.model,
      input: [
        { role: "system", content: instructions },
        { role: "user", content: input }
      ],
      reasoning: { effort: this.reasoningEffort },
      text: { format: zodTextFormat(schema, schemaName) }
    });
    if (!response.output_parsed) throw new Error("The model returned no structured intake result.");
    return schema.parse(response.output_parsed);
  }

  async parseVision<T>(imageBase64: string, instructions: string, schema: ZodType<T>, schemaName: string): Promise<T> {
    const imageUrl = imageBase64.startsWith("data:") ? imageBase64 : `data:image/jpeg;base64,${imageBase64}`;
    const response = await this.client.responses.parse({
      model: this.model,
      input: [{ role: "user", content: [{ type: "input_text", text: instructions }, { type: "input_image", image_url: imageUrl, detail: "high" }] }],
      reasoning: { effort: this.reasoningEffort },
      text: { format: zodTextFormat(schema, schemaName) }
    });
    if (!response.output_parsed) throw new Error("The model returned no structured document result.");
    return schema.parse(response.output_parsed);
  }

  async callPdfMappingTool(input: string): Promise<string[]> {
    const response = await this.client.responses.create({
      model: this.model,
      input,
      reasoning: { effort: this.reasoningEffort },
      tools: [{
        type: "function",
        name: "map_pdf_fields",
        description: "Select PDF fields that have a source fact. Never provide a value.",
        strict: true,
        parameters: {
          type: "object", additionalProperties: false,
          properties: { pdf_fields: { type: "array", items: { type: "string" } } },
          required: ["pdf_fields"]
        }
      }],
      tool_choice: { type: "function", name: "map_pdf_fields" }
    });
    const call = response.output.find((item) => item.type === "function_call" && item.name === "map_pdf_fields");
    if (!call || call.type !== "function_call") return [];
    const parsed = JSON.parse(call.arguments) as { pdf_fields?: unknown };
    return Array.isArray(parsed.pdf_fields) && parsed.pdf_fields.every((field) => typeof field === "string") ? parsed.pdf_fields : [];
  }
}
