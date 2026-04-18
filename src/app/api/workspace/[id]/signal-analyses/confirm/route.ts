import { after } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { generateSignalAnalysisEmbedding } from "@/lib/ai/embedding-pipeline";

const requestSchema = z.object({
  signal_id: z.string().min(1),
  confirmed_summary: z.string().min(1),
  founder_notes: z.string().optional(),
  pain_points: z.array(z.string()).optional(),
  objections: z.array(z.string()).optional(),
  requests: z.array(z.string()).optional(),
  urgency: z.enum(["low", "medium", "high"]).optional(),
  likely_segment: z.string().optional(),
  quotes: z.array(z.string()).optional(),
  confidence: z.string().optional(),
});

export async function POST(
  request: Request,
  { params }: RouteContext<"/api/workspace/[id]/signal-analyses/confirm">,
) {
  const { id: workspaceId } = await params;
  const body = requestSchema.safeParse(await request.json());

  if (!body.success) {
    return Response.json(
      {
        success: false,
        error: "Invalid request payload",
        details: body.error.flatten(),
      },
      { status: 400 },
    );
  }

  const supabase = db();
  const payload = body.data;

  const { data: signal, error: signalError } = await supabase
    .from("signals")
    .select("id, workspace_id")
    .eq("id", payload.signal_id)
    .maybeSingle();

  if (signalError || !signal) {
    return Response.json(
      { success: false, error: "Signal not found" },
      { status: 404 },
    );
  }

  if (signal.workspace_id !== workspaceId) {
    return Response.json(
      { success: false, error: "Signal does not belong to workspace" },
      { status: 400 },
    );
  }

  const upsertPayload = {
    signal_id: payload.signal_id,
    confirmed_summary: payload.confirmed_summary,
    founder_notes: payload.founder_notes ?? null,
    pain_points: payload.pain_points ?? null,
    objections: payload.objections ?? null,
    requests: payload.requests ?? null,
    urgency: payload.urgency ?? null,
    likely_segment: payload.likely_segment ?? null,
    quotes: payload.quotes ?? null,
    confidence: payload.confidence ?? null,
    confirmed_at: new Date().toISOString(),
  };

  const { data: saved, error: saveError } = await supabase
    .from("signal_analyses")
    .upsert(upsertPayload, { onConflict: "signal_id" })
    .select("id")
    .single();

  if (saveError || !saved) {
    return Response.json(
      { success: false, error: "Failed to save canonical memory" },
      { status: 500 },
    );
  }

  after(async () => {
    try {
      await generateSignalAnalysisEmbedding({
        signalAnalysisId: saved.id,
        confirmedSummary: upsertPayload.confirmed_summary,
        likelySegment: upsertPayload.likely_segment,
        painPoints: upsertPayload.pain_points,
        objections: upsertPayload.objections,
        requests: upsertPayload.requests,
        quotes: upsertPayload.quotes,
      });
    } catch (error) {
      console.error("[embedding] signal_analyses embedding failed", {
        signalAnalysisId: saved.id,
        error,
      });
    }
  });

  return Response.json({
    success: true,
    data: {
      signal_analysis_id: saved.id,
      embedding_status: "queued",
    },
  });
}
