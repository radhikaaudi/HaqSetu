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
}
