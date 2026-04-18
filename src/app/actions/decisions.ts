"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";

/**
 * Decision creation now lives at /api/workspace/[id]/decisions (see
 * src/app/api/workspace/[id]/decisions/route.ts) — the client posts there
 * directly so the AI embedding can be enqueued with `after()` on the same
 * request. This file retains only the outcome-update action, which is a
 * pure CRUD path with no AI involvement.
 */

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
