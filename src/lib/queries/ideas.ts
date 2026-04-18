import "server-only";
import { db } from "@/lib/db";
import { isSchemaMissingError } from "@/lib/queries/health";

export type IdeaRow = {
  id: string;
  approved_idea: string | null;
  audience: string | null;
  problem_statement: string | null;
  converted_workspace_id: string | null;
  created_at: string;
};

export async function listIdeas(): Promise<IdeaRow[]> {
  const sb = db();
  const { data, error } = await sb
    .from("ideas")
    .select(
      "id, approved_idea, audience, problem_statement, converted_workspace_id, created_at",
    )
    .order("created_at", { ascending: false });
  if (error) {
    if (isSchemaMissingError(error)) return [];
    throw error;
  }
  return data ?? [];
}
