"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { embedText } from "@/lib/ai/embed";

const createDecisionSchema = z.object({
  workspace_id: z.string().uuid(),
  title: z.string().trim().min(3).max(200),
  category: z.string().trim().max(40).optional().or(z.literal("")),
  rationale: z.string().trim().min(10).max(4000),
  expected_outcome: z.string().trim().max(2000).optional().or(z.literal("")),
  signal_ids: z.array(z.string().uuid()).max(20).default([]),
});

export type CreateDecisionResult =
  | { ok: true; decision_id: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

export async function createDecisionAction(input: {
  workspace_id: string;
  title: string;
  category?: string;
  rationale: string;
  expected_outcome?: string;
  signal_ids: string[];
}): Promise<CreateDecisionResult> {
  const parsed = createDecisionSchema.safeParse(input);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (typeof key === "string") fieldErrors[key] = issue.message;
    }
    return { ok: false, error: "Please fix the highlighted fields.", fieldErrors };
  }

  const p = parsed.data;
  const sb = db();

  const embeddingText = [
    p.title,
    p.rationale,
    p.expected_outcome ?? "",
    p.category ?? "",
  ]
    .filter(Boolean)
    .join("\n");

  let embedding: number[] | null = null;
  try {
    embedding = await embedText(embeddingText);
  } catch {
    // If Gemini isn't available, still allow the decision — embedding can be
    // back-filled later. Recall for this decision just won't work yet.
    embedding = null;
  }

  const { data: decision, error: decErr } = await sb
    .from("decisions")
    .insert({
      workspace_id: p.workspace_id,
      title: p.title,
      category: p.category?.length ? p.category : null,
      rationale: p.rationale,
      expected_outcome: p.expected_outcome?.length ? p.expected_outcome : null,
      embedding,
    })
    .select("id")
    .single();

  if (decErr || !decision) {
    return { ok: false, error: decErr?.message ?? "Could not save decision." };
  }

  if (p.signal_ids.length > 0) {
    const { error: evErr } = await sb.from("decision_evidence").insert(
      p.signal_ids.map((sid) => ({
        decision_id: decision.id,
        signal_id: sid,
        snippet: null,
      })),
    );
    if (evErr) {
      // Non-fatal: decision exists but evidence failed to link.
      console.error("decision_evidence insert failed", evErr);
    }
  }

  // Seed a Pending outcome so the timeline shows the decision tracking.
  await sb.from("outcomes").insert({
    decision_id: decision.id,
    status: "pending",
    notes: null,
  });

  revalidatePath(`/w/${p.workspace_id}`);
  revalidatePath(`/w/${p.workspace_id}/decisions`);
  revalidatePath(`/w/${p.workspace_id}/timeline`);

  return { ok: true, decision_id: decision.id };
}

const outcomeSchema = z.object({
  decision_id: z.string().uuid(),
  workspace_id: z.string().uuid(),
  status: z.enum(["improved", "failed", "inconclusive", "pending"]),
  notes: z.string().trim().max(2000).optional().or(z.literal("")),
});

export async function updateOutcomeAction(input: {
  decision_id: string;
  workspace_id: string;
  status: "improved" | "failed" | "inconclusive" | "pending";
  notes?: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const parsed = outcomeSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const sb = db();

  // Update the latest outcome row if one exists, else insert.
  const { data: existing } = await sb
    .from("outcomes")
    .select("id")
    .eq("decision_id", parsed.data.decision_id)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing) {
    const { error } = await sb
      .from("outcomes")
      .update({
        status: parsed.data.status,
        notes: parsed.data.notes?.length ? parsed.data.notes : null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id);
    if (error) return { ok: false, error: error.message };
  } else {
    const { error } = await sb.from("outcomes").insert({
      decision_id: parsed.data.decision_id,
      status: parsed.data.status,
      notes: parsed.data.notes?.length ? parsed.data.notes : null,
    });
    if (error) return { ok: false, error: error.message };
  }

  revalidatePath(`/w/${parsed.data.workspace_id}`);
  revalidatePath(`/w/${parsed.data.workspace_id}/decisions`);
  revalidatePath(`/w/${parsed.data.workspace_id}/timeline`);
  return { ok: true };
}

export async function redirectToNewDecision(workspaceId: string) {
  redirect(`/w/${workspaceId}/decisions/new`);
}
