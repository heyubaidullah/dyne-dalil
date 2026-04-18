import "server-only";
import { db } from "@/lib/db";
import { isSchemaMissingError } from "@/lib/queries/health";
import { DEMO_IDEAS } from "@/lib/data/demo";

export type IdeaRow = {
  id: string;
  approved_idea: string | null;
  audience: string | null;
  problem_statement: string | null;
  converted_workspace_id: string | null;
  created_at: string;
};

export async function listIdeas(): Promise<IdeaRow[]> {
  try {
    const sb = db();
    const { data, error } = await sb
      .from("ideas")
      .select(
        "id, approved_idea, audience, problem_statement, converted_workspace_id, created_at",
      )
      .order("created_at", { ascending: false });
    if (error) throw error;
    if (!data || data.length === 0) return DEMO_IDEAS;
    return data as IdeaRow[];
  } catch (e) {
    if (isSchemaMissingError(e)) return DEMO_IDEAS;
    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.warn(
        `[demo-fallback] listIdeas: ${e instanceof Error ? e.message : e}`,
      );
    }
    return DEMO_IDEAS;
  }
}
