import { z } from "zod";
import { getAnthropic, EXTRACTION_MODEL } from "./anthropic";

/**
 * Claude-powered signal extraction.
 *
 * Stage 1 of the Dalil AI pipeline: take raw customer text (a call
 * transcript, rough notes, a DM thread) and return a structured JSON
 * object with the founder-facing fields we care about.
 *
 * We force Claude into `tool_use` with a strict `input_schema` so the model
 * output validates cleanly instead of being free-form text.
 */

export const ExtractionSchema = z.object({
  summary: z
    .string()
    .describe("One-sentence summary of the signal, founder-readable."),
  pain_points: z
    .array(z.string())
    .describe("Concrete pains named or implied by the customer."),
  objections: z
    .array(z.string())
    .describe("Reasons the customer said no, or would say no."),
  requests: z
    .array(z.string())
    .describe("What the customer explicitly asked for."),
  urgency: z
    .enum(["low", "medium", "high"])
    .describe("How urgent this pain feels to the customer."),
  likely_segment: z
    .string()
    .describe(
      "Best-guess customer segment (e.g. 'Campus Muslim student', 'Halal restaurant operator').",
    ),
  quotes: z
    .array(z.string())
    .describe(
      "Exact verbatim quotes worth remembering. Keep the customer's voice.",
    ),
  confidence: z
    .enum(["low", "medium", "high"])
    .describe("How confident you are in this extraction."),
});

export type Extraction = z.infer<typeof ExtractionSchema>;

import type Anthropic from "@anthropic-ai/sdk";

const EXTRACTION_TOOL: Anthropic.Tool = {
  name: "record_signal_extraction",
  description:
    "Record the structured interpretation of a customer signal so Dalil can index it for semantic recall.",
  input_schema: {
    type: "object",
    required: [
      "summary",
      "pain_points",
      "objections",
      "requests",
      "urgency",
      "likely_segment",
      "quotes",
      "confidence",
    ],
    properties: {
      summary: { type: "string" },
      pain_points: { type: "array", items: { type: "string" } },
      objections: { type: "array", items: { type: "string" } },
      requests: { type: "array", items: { type: "string" } },
      urgency: { type: "string", enum: ["low", "medium", "high"] },
      likely_segment: { type: "string" },
      quotes: { type: "array", items: { type: "string" } },
      confidence: { type: "string", enum: ["low", "medium", "high"] },
    },
  },
};

const SYSTEM_PROMPT = `You are Dalil's extraction engine. Your job is to turn raw founder-gathered customer text — call transcripts, rough notes, DMs, survey snippets — into structured, founder-readable evidence.

Style rules:
- Be conservative. If something isn't clearly stated, don't invent it.
- Keep the customer's voice in quotes. Lightly clean filler words only if the sentence is unreadable.
- Pain points = real problems named or implied, not vibes. Prefer specific over abstract.
- Objections = things that would make this person say no.
- Requests = what they explicitly asked for.
- Confidence should reflect how much raw data you have. One short note → at most "medium".
- Segment should be the narrowest honest description (e.g. "Campus Muslim student" > "Student").

Respond only through the record_signal_extraction tool.`;

export async function extractSignal(rawText: string): Promise<Extraction> {
  const client = getAnthropic();

  const res = await client.messages.create({
    model: EXTRACTION_MODEL,
    max_tokens: 2048,
    system: SYSTEM_PROMPT,
    tools: [EXTRACTION_TOOL],
    tool_choice: { type: "tool", name: EXTRACTION_TOOL.name },
    messages: [
      {
        role: "user",
        content: `Extract structure from this signal. Return only the tool call.\n\n<signal>\n${rawText.trim()}\n</signal>`,
      },
    ],
  });

  const toolUse = res.content.find((block) => block.type === "tool_use");
  if (!toolUse || toolUse.type !== "tool_use") {
    throw new Error(
      "Claude did not return a tool_use block. Try shortening the input or retrying.",
    );
  }

  const parsed = ExtractionSchema.safeParse(toolUse.input);
  if (!parsed.success) {
    throw new Error(
      `Claude returned invalid extraction shape: ${parsed.error.message}`,
    );
  }

  return parsed.data;
}
