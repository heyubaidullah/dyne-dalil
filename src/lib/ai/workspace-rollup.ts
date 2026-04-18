import "server-only";
import { z } from "zod";
import { generateStructuredOutput } from "@/lib/ai/wrapper";

export const RollupSchema = z.object({
  recurring_themes: z.array(z.string()),
  strongest_objections: z.array(z.string()),
  most_likely_segment: z.string(),
  contradictions: z.array(z.string()),
  suggested_next_tests: z.array(z.string()),
});

export type Rollup = z.infer<typeof RollupSchema>;

export const EMPTY_ROLLUP: Rollup = {
  recurring_themes: [],
  strongest_objections: [],
  most_likely_segment: "Insufficient confirmed memories",
  contradictions: [],
  suggested_next_tests: [],
};

const SYSTEM_PROMPT = `You are a fractional product manager for an early-stage startup. Analyze the historical customer signals and synthesize high-level market intelligence. Return only valid JSON matching the exact schema provided. Surface contradictions explicitly when customer requests are mutually exclusive.`;

export type MemoryPayload = {
  confirmed_summary: string | null;
  likely_segment: string | null;
  pain_points: string[] | null;
  objections: string[] | null;
  requests: string[] | null;
  quotes: string[] | null;
};

export async function rollupWorkspace(
  memories: MemoryPayload[],
): Promise<Rollup> {
  if (memories.length === 0) return EMPTY_ROLLUP;

  const payload = memories.map((memory, index) => ({
    index: index + 1,
    confirmed_summary: memory.confirmed_summary,
    likely_segment: memory.likely_segment,
    pain_points: memory.pain_points,
    objections: memory.objections,
    requests: memory.requests,
    quotes: memory.quotes,
  }));

  return generateStructuredOutput({
    provider: "gemini",
    model: "gemini-2.5-flash",
    systemInstruction: SYSTEM_PROMPT,
    userPrompt: [
      "Analyze this array of canonical customer signals and produce a workspace rollup.",
      "Return only JSON that matches the requested schema.",
      JSON.stringify(payload),
    ].join("\n\n"),
    schema: RollupSchema,
    temperature: 0.1,
  });
}
