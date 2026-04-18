import { after } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { generateDecisionEmbedding } from "@/lib/ai/embedding-pipeline";

const requestSchema = z.object({
  title: z.string().min(1),
  category: z.string().optional(),
  rationale: z.string().optional(),
  expected_outcome: z.string().optional(),
});

export async function POST(
  request: Request,
  { params }: RouteContext<"/api/workspace/[id]/decisions">,
) {
  const { id: workspaceId } = await params;
  const body = requestSchema.safeParse(await request.json());

  if (!body.success) {
    return Response.json(
      { success: false, error: "Invalid request payload", details: body.error.flatten() },
      { status: 400 },
    );
  }

  const supabase = await createClient();
  const payload = body.data;

  const { data: workspace, error: workspaceError } = await supabase
    .from("workspaces")
    .select("id")
    .eq("id", workspaceId)
    .single();

  if (workspaceError || !workspace) {
    return Response.json({ success: false, error: "Workspace not found" }, { status: 404 });
  }

  const { data: saved, error: saveError } = await supabase
    .from("decisions")
    .insert({
      workspace_id: workspaceId,
      title: payload.title,
      category: payload.category ?? null,
      rationale: payload.rationale ?? null,
      expected_outcome: payload.expected_outcome ?? null,
    })
    .select("id")
    .single();

  if (saveError || !saved) {
    return Response.json({ success: false, error: "Failed to save decision" }, { status: 500 });
  }

  after(async () => {
    try {
      await generateDecisionEmbedding({
        decisionId: saved.id,
        title: payload.title,
        category: payload.category,
        rationale: payload.rationale,
        expectedOutcome: payload.expected_outcome,
      });
    } catch (error) {
      console.error("[embedding] decisions embedding failed", {
        decisionId: saved.id,
        error,
      });
    }
  });

  return Response.json({
    success: true,
    data: {
      decision_id: saved.id,
      embedding_status: "queued",
    },
  });
}
