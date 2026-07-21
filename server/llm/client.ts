import "dotenv/config";
import OpenAI from "openai";
import { zodResponseFormat } from "openai/helpers/zod";
import type { ZodType } from "zod";

export type ReasoningEffort = "low" | "medium" | "high";
export type LlmProvider = "openai" | "gemini";
export interface HaqSetuLlmOptions { model?: string; reasoningEffort?: ReasoningEffort; provider?: LlmProvider; }

/**
 * Thin edge-only wrapper; eligibility decisions must remain in server/engine.
 *
 * Provider is selected by LLM_PROVIDER ("openai" | "gemini"). Both are driven
 * through the OpenAI SDK's chat.completions API — Gemini exposes an
 * OpenAI-compatible endpoint — so the four public methods stay identical and
 * the agents never need to know which model is behind them.
 *
 * NOTE FOR SUBMISSION: the Hackathon requires GPT-5.6. Set LLM_PROVIDER=openai
 * for the version you demo and hand to judges. Gemini is a free dev/fallback.
 */
export class HaqSetuLlmClient {
  private readonly client: OpenAI;
  private readonly model: string;
  private readonly reasoningEffort: ReasoningEffort;
  private readonly provider: LlmProvider;

  constructor(options: HaqSetuLlmOptions = {}) {
    this.provider = options.provider ?? (process.env.LLM_PROVIDER as LlmProvider | undefined) ?? "openai";
    this.reasoningEffort = options.reasoningEffort ?? (process.env.OPENAI_REASONING_EFFORT as ReasoningEffort | undefined) ?? "medium";

    if (this.provider === "gemini") {
      if (!process.env.GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is required when LLM_PROVIDER=gemini; get a free key at https://aistudio.google.com/apikey");
      this.client = new OpenAI({
        apiKey: process.env.GEMINI_API_KEY,
        baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/"
      });
      this.model = options.model ?? process.env.GEMINI_MODEL ?? "gemini-2.5-flash";
    } else {
      if (!process.env.OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is required; copy .env.example to .env.");
      this.client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      this.model = options.model ?? process.env.OPENAI_MODEL ?? "gpt-5.6-terra";
    }
  }

  /** reasoning_effort is an OpenAI-only knob; Gemini ignores it, so we omit it there. */
  private reasoningParams(): Record<string, unknown> {
    return this.provider === "openai" ? { reasoning_effort: this.reasoningEffort } : {};
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
