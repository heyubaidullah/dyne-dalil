"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { extractSignal, type Extraction } from "@/lib/ai/extract";
import { embedText, buildMemoryEmbeddingText } from "@/lib/ai/embed";

const ingestSchema = z.object({
  workspace_id: z.string().uuid(),
  title: z.string().trim().max(160).optional().or(z.literal("")),
  source_type: z.string().trim().max(40).optional().or(z.literal("")),
  raw_text: z
    .string()
    .trim()
    .min(20, "Paste at least a sentence or two — otherwise extraction won't be useful."),
});

export type IngestResult =
  | {
      ok: true;
      signal_id: string;
      extraction: Extraction;
    }
  | {
      ok: false;
      error: string;
    };

/**
 * Create a raw signal and immediately run Claude extraction. The extracted
 * fields are saved to `signal_analyses` with `confirmed_at = null` so the
 * founder-review UI can show them for editing.
 */
export async function ingestSignalAction(input: {
  workspace_id: string;
  title?: string;
  source_type?: string;
  raw_text: string;
}): Promise<IngestResult> {
  const parsed = ingestSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const sb = db();
  const { data: signal, error: signalErr } = await sb
    .from("signals")
    .insert({
      workspace_id: parsed.data.workspace_id,
      title: parsed.data.title?.length ? parsed.data.title : null,
      source_type: parsed.data.source_type?.length ? parsed.data.source_type : null,
      raw_text: parsed.data.raw_text,
    })
    .select("id")
    .single();

  if (signalErr || !signal) {
    return { ok: false, error: signalErr?.message ?? "Could not save signal." };
  }

  let extraction: Extraction;
  try {
    extraction = await extractSignal(parsed.data.raw_text);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Extraction failed.";
    return { ok: false, error: message };
  }

  const { error: analysisErr } = await sb.from("signal_analyses").insert({
    signal_id: signal.id,
    ai_summary: extraction.summary,
    confirmed_summary: extraction.summary,
    pain_points: extraction.pain_points,
    objections: extraction.objections,
    requests: extraction.requests,
    urgency: extraction.urgency,
    likely_segment: extraction.likely_segment,
    quotes: extraction.quotes,
    confidence: extraction.confidence,
  });

  if (analysisErr) {
    return { ok: false, error: analysisErr.message };
  }

  revalidatePath(`/w/${parsed.data.workspace_id}`);
  revalidatePath(`/w/${parsed.data.workspace_id}/memory`);
  revalidatePath(`/w/${parsed.data.workspace_id}/timeline`);

  return { ok: true, signal_id: signal.id, extraction };
}

const confirmSchema = z.object({
  signal_id: z.string().uuid(),
  workspace_id: z.string().uuid(),
  confirmed_summary: z.string().trim().min(5),
  founder_notes: z.string().trim().optional().or(z.literal("")),
  pain_points: z.array(z.string().trim().min(1)),
  objections: z.array(z.string().trim().min(1)),
  requests: z.array(z.string().trim().min(1)),
  quotes: z.array(z.string().trim().min(1)),
  urgency: z.enum(["low", "medium", "high"]),
  likely_segment: z.string().trim().min(1),
  confidence: z.enum(["low", "medium", "high"]),
});

export type ConfirmResult =
  | {
      ok: true;
      similar: Array<{
        id: string;
        signal_id: string;
        confirmed_summary: string | null;
        similarity: number;
      }>;
    }
  | { ok: false; error: string };

/**
 * Save the founder-confirmed extraction, generate an embedding, and return
 * semantically similar past memories so the UI can surface "we've seen this
 * before" in the same motion.
 */
export async function confirmAnalysisAction(
  input: z.infer<typeof confirmSchema>,
): Promise<ConfirmResult> {
  const parsed = confirmSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const p = parsed.data;
  const sb = db();

  const embeddingText = buildMemoryEmbeddingText({
    confirmed_summary: p.confirmed_summary,
    pain_points: p.pain_points,
    objections: p.objections,
    quotes: p.quotes,
  });

  let embedding: number[];
  try {
    embedding = await embedText(embeddingText);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Embedding failed.";
    return { ok: false, error: message };
  }

  const { error: updateErr } = await sb
    .from("signal_analyses")
    .update({
      confirmed_summary: p.confirmed_summary,
      founder_notes: p.founder_notes?.length ? p.founder_notes : null,
      pain_points: p.pain_points,
      objections: p.objections,
      requests: p.requests,
      quotes: p.quotes,
      urgency: p.urgency,
      likely_segment: p.likely_segment,
      confidence: p.confidence,
      confirmed_at: new Date().toISOString(),
      embedding,
    })
    .eq("signal_id", p.signal_id);

  if (updateErr) return { ok: false, error: updateErr.message };

  // Similar-Issue Recall: find other confirmed memories in this workspace
  // closest to the one we just saved (excluding itself).
  const { data: similar, error: matchErr } = await sb.rpc(
    "match_signal_analyses",
    {
      query_embedding: embedding,
      workspace_filter: p.workspace_id,
      match_count: 6,
    },
  );
  if (matchErr) {
    return { ok: true, similar: [] };
  }

  revalidatePath(`/w/${p.workspace_id}`);
  revalidatePath(`/w/${p.workspace_id}/memory`);
  revalidatePath(`/w/${p.workspace_id}/timeline`);

  return {
    ok: true,
    similar: (similar ?? []).filter((r) => r.signal_id !== p.signal_id).slice(0, 5),
  };
}
