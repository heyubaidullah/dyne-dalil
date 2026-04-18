import { z } from "zod";
import { Type } from "@google/genai";
import { getGemini, EXTRACTION_MODEL } from "./gemini";

/**
 * Gemini-powered signal extraction.
 *
 * Stage 1 of the Dalil AI pipeline: take raw customer text (a call
 * transcript, rough notes, a DM thread) and return a structured JSON
 * object with the founder-facing fields we care about.
 *
 * We use `responseSchema` to force strict JSON output so the result
 * validates cleanly against our zod schema.
 */

export const ExtractionSchema = z.object({
  summary: z.string(),
  pain_points: z.array(z.string()),
  objections: z.array(z.string()),
  requests: z.array(z.string()),
  urgency: z.enum(["low", "medium", "high"]),
  likely_segment: z.string(),
  quotes: z.array(z.string()),
  confidence: z.enum(["low", "medium", "high"]),
});

export type Extraction = z.infer<typeof ExtractionSchema>;

const RESPONSE_SCHEMA = {
  type: Type.OBJECT,
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
    summary: {
      type: Type.STRING,
      description: "One-sentence summary of the signal, founder-readable.",
    },
    pain_points: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Concrete pains named or implied by the customer.",
    },
    objections: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Reasons the customer said no, or would say no.",
    },
    requests: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "What the customer explicitly asked for.",
    },
    urgency: {
      type: Type.STRING,
      enum: ["low", "medium", "high"],
      description: "How urgent this pain feels to the customer.",
    },
    likely_segment: {
      type: Type.STRING,
      description:
        "Best-guess narrow customer segment (e.g. 'Campus Muslim student').",
    },
    quotes: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Exact verbatim quotes worth remembering.",
    },
    confidence: {
      type: Type.STRING,
      enum: ["low", "medium", "high"],
      description: "How confident you are in this extraction.",
    },
  },
};

const SYSTEM_PROMPT = `You are Dalil's extraction engine. Your job is to turn raw founder-gathered customer text — call transcripts, rough notes, DMs, survey snippets — into structured, founder-readable evidence.

Style rules:
- Be conservative. If something isn't clearly stated, don't invent it.
- Keep the customer's voice in quotes. Lightly clean filler words only if a sentence is unreadable.
- Pain points = real problems named or implied, not vibes. Prefer specific over abstract.
- Objections = things that would make this person say no.
- Requests = what they explicitly asked for.
- Confidence should reflect how much raw data you have. One short note → at most "medium".
- Segment should be the narrowest honest description (e.g. "Campus Muslim student" > "Student").

Return only the structured JSON object.`;

export async function extractSignal(rawText: string): Promise<Extraction> {
  const client = getGemini();
  const response = await client.models.generateContent({
    model: EXTRACTION_MODEL,
    contents: [
      {
        role: "user",
        parts: [
          {
            text: `Extract structure from this signal.\n\n<signal>\n${rawText.trim()}\n</signal>`,
          },
        ],
      },
    ],
    config: {
      systemInstruction: SYSTEM_PROMPT,
      temperature: 0.2,
      responseMimeType: "application/json",
      responseSchema: RESPONSE_SCHEMA,
      maxOutputTokens: 2048,
    },
  });

  const text = response.text;
  if (!text) {
    throw new Error(
      "Gemini returned no text. Try shortening the input or retrying.",
    );
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch (e) {
    throw new Error(
      `Gemini returned non-JSON text: ${e instanceof Error ? e.message : e}`,
    );
  }

  const validated = ExtractionSchema.safeParse(parsed);
  if (!validated.success) {
    throw new Error(
      `Extraction shape invalid: ${validated.error.message}`,
    );
  }
  return validated.data;
}
