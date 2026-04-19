"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";

const updateIdeaSchema = z.object({
  idea_id: z.string().uuid(),
  approved_idea: z.string().trim().min(1, "Idea is required").max(500),
  audience: z.string().trim().min(1, "Audience is required").max(500),
  problem_statement: z.string().trim().min(1, "Problem statement is required").max(1000),
  convert_to_workspace: z.boolean().optional(),
});

export type UpdateIdeaInput = z.input<typeof updateIdeaSchema>;

export type UpdateIdeaResult =
  | { ok: true; workspace_id?: string }
  | { ok: false; error: string };

const deleteIdeaSchema = z.object({
  idea_id: z.string().uuid(),
});

export type DeleteIdeaInput = z.input<typeof deleteIdeaSchema>;
export type DeleteIdeaResult = { ok: true } | { ok: false; error: string };

export async function updateIdeaAction(
  input: UpdateIdeaInput,
): Promise<UpdateIdeaResult> {
  const parsed = updateIdeaSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input.",
    };
  }

  const data = parsed.data;
  const sb = db();

  // Update the idea
  const { error: updateErr } = await sb
    .from("ideas")
    .update({
      approved_idea: data.approved_idea,
      audience: data.audience,
      problem_statement: data.problem_statement,
    })
    .eq("id", data.idea_id);

  if (updateErr) {
    return {
      ok: false,
      error: updateErr.message ?? "Could not update idea.",
    };
  }

  // Optionally convert to workspace
  if (data.convert_to_workspace) {
    const { data: ws, error: wsErr } = await sb
      .from("workspaces")
      .insert({
        name: data.approved_idea,
        description: data.problem_statement,
      })
      .select("id")
      .single();

    if (wsErr || !ws) {
      return {
        ok: false,
        error: wsErr?.message ?? "Could not create workspace.",
      };
    }

    // Link the workspace to the idea
    const { error: linkErr } = await sb
      .from("ideas")
      .update({ converted_workspace_id: ws.id })
      .eq("id", data.idea_id);

    if (linkErr) {
      return {
        ok: false,
        error: linkErr.message ?? "Could not link workspace to idea.",
      };
    }

    revalidatePath("/ideas");
    return { ok: true, workspace_id: ws.id };
  }

  revalidatePath("/ideas");
  return { ok: true };
}

export async function deleteIdeaAction(
  input: DeleteIdeaInput,
): Promise<DeleteIdeaResult> {
  const parsed = deleteIdeaSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid input.",
    };
  }

  const sb = db();

  const { data: existing, error: existingErr } = await sb
    .from("ideas")
    .select("converted_workspace_id")
    .eq("id", parsed.data.idea_id)
    .maybeSingle();

  if (existingErr) {
    return {
      ok: false,
      error: existingErr.message ?? "Could not load idea.",
    };
  }

  if (!existing) {
    return {
      ok: false,
      error: "Idea not found.",
    };
  }

  const isConverted =
    typeof existing.converted_workspace_id === "string" &&
    existing.converted_workspace_id.trim().length > 0;

  if (isConverted) {
    return {
      ok: false,
      error: "Converted ideas cannot be deleted.",
    };
  }

  const { error: deleteErr } = await sb
    .from("ideas")
    .delete()
    .eq("id", parsed.data.idea_id);

  if (deleteErr) {
    return {
      ok: false,
      error: deleteErr.message ?? "Could not delete idea.",
    };
  }

  revalidatePath("/ideas");
  return { ok: true };
}
