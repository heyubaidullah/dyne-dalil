"use server";

import { z } from "zod";
import { Type } from "@google/genai";
import { getGemini, EXTRACTION_MODEL } from "@/lib/ai/gemini";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { isSchemaMissingError } from "@/lib/queries/health";

const DALIL_START_SYSTEM = `You are Dalil Start — a stage-zero idea sharpener for founders, PMs, and early GTM operators. Your job is to help the user go from a vague spark to a validated idea they can save and convert into a workspace.

You sharpen along five axes, in order:
1. The idea, in one crisp sentence.
2. The narrowest honest audience (e.g. "Muslim college students at large public universities" — not "students").
3. A specific pain point that audience has today.
4. The value the idea creates, pressure-tested. Why would this audience care enough to pay / switch / adopt?
5. What to test first — a concrete next step.

Style rules:
- Ask ONE focused question at a time. Never ask multi-part or multi-sentence questions.
- Be direct. No "great idea!", no fluff, no emojis.
- Prefer the user's exact words over your abstractions. If they said "halal students study late", keep "halal students study late" in your phrasing.
- Pressure-test: if something is vague, ask for a specific example, not a definition.
- When you have enough on all five axes to write a one-paragraph idea summary, offer: "I think we have enough to save this as an idea. Want to save it to your Idea Vault?" Do NOT save automatically.
- If the user's idea is already in great shape, don't drag out the conversation — say so and offer to save.
- Plain text responses. Short paragraphs. No markdown headings.

You are grounded in the values of evidence, trust, and calm. Dalil's tagline: "Evidence for every next move."`;

const chatSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        text: z.string().max(10000),
      }),
    )
    .min(1)
    .max(60),
});

export type ChatResult =
  | { ok: true; reply: string }
  | { ok: false; error: string };

export async function sendDalilStartMessage(input: {
  messages: Array<{ role: "user" | "assistant"; text: string }>;
}): Promise<ChatResult> {
  const parsed = chatSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Invalid conversation payload." };
  }
  const history = parsed.data.messages;
  const lastUser = [...history].reverse().find((m) => m.role === "user");
  if (!lastUser) {
    return { ok: false, error: "Send a message to get started." };
  }

  try {
    const client = getGemini();

    // Gemini's chat requires alternating user/model turns. Our "assistant" role
    // maps to "model"; collapse consecutive user messages if any.
    const contents = history.map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.text }],
    }));

    const res = await client.models.generateContent({
      model: EXTRACTION_MODEL,
      contents,
      config: {
        systemInstruction: DALIL_START_SYSTEM,
        temperature: 0.5,
        maxOutputTokens: 1024,
      },
    });

    const text = res.text?.trim();
    if (!text) {
      return { ok: false, error: "Gemini returned no reply. Try again." };
    }
    return { ok: true, reply: text };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Gemini call failed.";
    return { ok: false, error: msg };
  }
}

// ---- Save as idea ------------------------------------------------------

const IDEA_SUMMARY_TOOL_SCHEMA = {
  type: Type.OBJECT,
  required: ["approved_idea", "audience", "problem_statement", "ready"],
  properties: {
    approved_idea: {
      type: Type.STRING,
      description: "One-sentence crisp idea statement in the founder's voice.",
    },
    audience: {
      type: Type.STRING,
      description: "Narrowest honest audience description.",
    },
    problem_statement: {
      type: Type.STRING,
      description:
        "The specific pain point this audience has today, stated in concrete terms.",
    },
    ready: {
      type: Type.BOOLEAN,
      description:
        "Whether the conversation has produced enough signal to save this as a validated idea. False if any of the three fields are vague or missing.",
    },
    transcript_summary: {
      type: Type.STRING,
      description: "Two-sentence summary of what was covered in the conversation.",
    },
  },
};

const EXTRACT_SYSTEM = `You are summarizing a Dalil Start conversation into an Idea Vault entry. Read the transcript and produce the cleanest possible structured summary.

Rules:
- approved_idea: one sentence, the founder's voice, no marketing fluff.
- audience: narrowest honest description, not "users" or "people".
- problem_statement: one or two sentences, concrete and specific.
- ready=true only if all three are specific enough to act on. If the audience is still "everyone" or the problem is still "things are hard", set ready=false.

Return only the structured JSON.`;

const IdeaSummarySchema = z.object({
  approved_idea: z.string().min(3),
  audience: z.string().min(3),
  problem_statement: z.string().min(3),
  ready: z.boolean(),
  transcript_summary: z.string().optional(),
});

export type SaveIdeaResult =
  | { ok: true; idea_id: string; workspace_id?: string | null }
  | { ok: false; error: string; notReady?: boolean };

export async function saveDalilStartIdea(input: {
  messages: Array<{ role: "user" | "assistant"; text: string }>;
  convertToWorkspace?: boolean;
}): Promise<SaveIdeaResult> {
  const parsed = chatSchema.safeParse({ messages: input.messages });
  if (!parsed.success) {
    return { ok: false, error: "No conversation to save yet." };
  }

  const transcript = parsed.data.messages
    .map((m) => `<${m.role}>${m.text}</${m.role}>`)
    .join("\n\n");

  let summary: z.infer<typeof IdeaSummarySchema>;
  try {
    const client = getGemini();
    const res = await client.models.generateContent({
      model: EXTRACTION_MODEL,
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `Summarize this conversation into an Idea Vault entry.\n\n${transcript}`,
            },
          ],
        },
      ],
      config: {
        systemInstruction: EXTRACT_SYSTEM,
        temperature: 0.2,
        responseMimeType: "application/json",
        responseSchema: IDEA_SUMMARY_TOOL_SCHEMA,
        maxOutputTokens: 1024,
      },
    });
    const text = res.text;
    if (!text) return { ok: false, error: "Gemini returned no summary." };
    const parsedJson = IdeaSummarySchema.safeParse(JSON.parse(text));
    if (!parsedJson.success) {
      return { ok: false, error: `Invalid summary shape: ${parsedJson.error.message}` };
    }
    summary = parsedJson.data;
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Summary failed.";
    return { ok: false, error: msg };
  }

  if (!summary.ready) {
    return {
      ok: false,
      notReady: true,
      error:
        "We don't have enough yet — keep sharpening the audience and pain before saving.",
    };
  }

  // Try to persist. If Supabase is unreachable / schema missing, still return ok
  // with a synthetic id so the UI can proceed — the user can retry later.
  try {
    const sb = db();
    const insertPayload = {
      approved_idea: summary.approved_idea,
      audience: summary.audience,
      problem_statement: summary.problem_statement,
      transcript_summary: summary.transcript_summary ?? null,
    };
    const { data: idea, error } = await sb
      .from("ideas")
      .insert(insertPayload)
      .select("id")
      .single();
    if (error) throw error;

    let workspaceId: string | null = null;
    if (input.convertToWorkspace) {
      const { data: ws, error: wsErr } = await sb
        .from("workspaces")
        .insert({
          name: summary.approved_idea,
          description: summary.problem_statement,
        })
        .select("id")
        .single();
      if (!wsErr && ws) {
        workspaceId = ws.id;
        await sb
          .from("ideas")
          .update({ converted_workspace_id: ws.id })
          .eq("id", idea.id);
      }
    }

    revalidatePath("/ideas");
    revalidatePath("/workspaces");
    revalidatePath("/");
    return { ok: true, idea_id: idea.id, workspace_id: workspaceId };
  } catch (e) {
    if (isSchemaMissingError(e)) {
      return {
        ok: false,
        error:
          "Saved summary, but Supabase tables aren't available yet. Apply the migration and try again.",
      };
    }
    const msg = e instanceof Error ? e.message : "Save failed.";
    return { ok: false, error: msg };
  }
}
