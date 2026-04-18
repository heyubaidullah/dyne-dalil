import { z } from "zod";
import { getAnthropic, EXTRACTION_MODEL } from "./anthropic";

/**
 * Claude-powered workspace rollup.
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

import type Anthropic from "@anthropic-ai/sdk";

const ROLLUP_TOOL: Anthropic.Tool = {
  name: "record_workspace_rollup",
  description:
    "Aggregate a workspace's confirmed memories into recurring themes, top objections, strongest segment, contradictions, and suggested next tests.",
  input_schema: {
    type: "object",
    required: [
      "recurring_themes",
      "top_objections",
      "strongest_segment",
      "contradictions",
      "next_tests",
    ],
    properties: {
      recurring_themes: {
        type: "array",
        items: {
          type: "object",
          required: ["label", "mentions", "signals", "trend"],
          properties: {
            label: { type: "string" },
            mentions: { type: "integer", minimum: 1 },
            signals: { type: "integer", minimum: 1 },
            trend: { type: "string", enum: ["rising", "stable", "falling"] },
          },
        },
      },
      top_objections: { type: "array", items: { type: "string" } },
      strongest_segment: { type: "string" },
      contradictions: { type: "array", items: { type: "string" } },
      next_tests: {
        type: "array",
        items: {
          type: "object",
          required: ["title", "why"],
          properties: {
            title: { type: "string" },
            why: { type: "string" },
          },
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

Respond only through the record_workspace_rollup tool.`;

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

  const client = getAnthropic();
  const res = await client.messages.create({
    model: EXTRACTION_MODEL,
    max_tokens: 2048,
    system: SYSTEM_PROMPT,
    tools: [ROLLUP_TOOL],
    tool_choice: { type: "tool", name: ROLLUP_TOOL.name },
    messages: [
      {
        role: "user",
        content: `Aggregate these ${memories.length} memories.\n\n${body}`,
      },
    ],
  });

  const toolUse = res.content.find((b) => b.type === "tool_use");
  if (!toolUse || toolUse.type !== "tool_use") {
    throw new Error("Claude did not return a rollup tool_use block.");
  }

  const parsed = RollupSchema.safeParse(toolUse.input);
  if (!parsed.success) {
    throw new Error(`Invalid rollup shape: ${parsed.error.message}`);
  }
  return parsed.data;
}
