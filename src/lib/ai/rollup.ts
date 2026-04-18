import { z } from "zod";
import { Type } from "@google/genai";
import { getGemini, ROLLUP_MODEL } from "./gemini";

/**
 * Gemini-powered workspace rollup.
 *
 * Takes every confirmed memory for a workspace and distills them into
 * recurring themes, top objections, strongest segment, and suggested next
 * tests — the payload behind the workspace dashboard.
 */

export const RollupSchema = z.object({
  recurring_themes: z
    .array(
      z.object({
        label: z.string(),
        mentions: z.number().int().min(1),
        signals: z.number().int().min(1),
        trend: z.enum(["rising", "stable", "falling"]),
      }),
    )
    .min(0)
    .max(6),
  top_objections: z.array(z.string()).max(6),
  strongest_segment: z.string(),
  contradictions: z.array(z.string()).max(6),
  next_tests: z
    .array(
      z.object({
        title: z.string(),
        why: z.string(),
      }),
    )
    .max(5),
});

export type Rollup = z.infer<typeof RollupSchema>;

const RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  required: [
    "recurring_themes",
    "top_objections",
    "strongest_segment",
    "contradictions",
    "next_tests",
  ],
  properties: {
    recurring_themes: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        required: ["label", "mentions", "signals", "trend"],
        properties: {
          label: { type: Type.STRING },
          mentions: { type: Type.INTEGER },
          signals: { type: Type.INTEGER },
          trend: { type: Type.STRING, enum: ["rising", "stable", "falling"] },
        },
      },
    },
    top_objections: { type: Type.ARRAY, items: { type: Type.STRING } },
    strongest_segment: { type: Type.STRING },
    contradictions: { type: Type.ARRAY, items: { type: Type.STRING } },
    next_tests: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        required: ["title", "why"],
        properties: {
          title: { type: Type.STRING },
          why: { type: Type.STRING },
        },
      },
    },
  },
};

const SYSTEM_PROMPT = `You are Dalil's workspace rollup engine. Given every confirmed memory in a workspace, produce the honest signal: what keeps showing up, what keeps blocking conversion, who shows up most, where memories disagree, and what the team should test next.

Style rules:
- Prefer fewer, stronger themes over a long list. 3-5 themes is the sweet spot.
- mentions = how many times the theme is referenced across all memories; signals = how many distinct memories it appears in.
- trend = rising if more recent memories mention it, falling if mostly older, stable otherwise.
- next_tests should be concrete and falsifiable ("Ship a late-night landing variant"), not vague ("Explore late-night options").
- contradictions = where memories disagree (e.g., one says "fees don't matter", another says "fees are the #1 blocker").
- If the input is thin, return empty arrays — do not invent.

Return only the structured JSON object.`;

export async function rollupWorkspace(
  memories: Array<{
    summary: string;
    segment: string | null;
    pain_points: string[] | null;
    objections: string[] | null;
    quotes: string[] | null;
    created_at: string;
  }>,
): Promise<Rollup> {
  if (memories.length === 0) {
    return {
      recurring_themes: [],
      top_objections: [],
      strongest_segment: "",
      contradictions: [],
      next_tests: [],
    };
  }

  const body = memories
    .map((m, i) => {
      const painLine = m.pain_points?.length
        ? `  pain: ${m.pain_points.join("; ")}`
        : "";
      const objLine = m.objections?.length
        ? `  objections: ${m.objections.join("; ")}`
        : "";
      const quoteLine = m.quotes?.length
        ? `  quote: ${m.quotes.slice(0, 2).join(" / ")}`
        : "";
      return [
        `<memory n="${i + 1}" date="${m.created_at}" segment="${m.segment ?? "unknown"}">`,
        `  summary: ${m.summary}`,
        painLine,
        objLine,
        quoteLine,
        `</memory>`,
      ]
        .filter(Boolean)
        .join("\n");
    })
    .join("\n\n");

  const client = getGemini();
  const response = await client.models.generateContent({
    model: ROLLUP_MODEL,
    contents: [
      {
        role: "user",
        parts: [{ text: `Aggregate these ${memories.length} memories.\n\n${body}` }],
      },
    ],
    config: {
      systemInstruction: SYSTEM_PROMPT,
      temperature: 0.3,
      responseMimeType: "application/json",
      responseSchema: RESPONSE_SCHEMA,
      maxOutputTokens: 2048,
    },
  });

  const text = response.text;
  if (!text) throw new Error("Gemini returned no rollup text.");

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch (e) {
    throw new Error(`Rollup JSON parse failed: ${e instanceof Error ? e.message : e}`);
  }

  const validated = RollupSchema.safeParse(parsed);
  if (!validated.success) {
    throw new Error(`Invalid rollup shape: ${validated.error.message}`);
  }
  return validated.data;
}
