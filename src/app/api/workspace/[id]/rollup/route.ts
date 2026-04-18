import { AIWrapperError } from "@/lib/ai/wrapper";
import {
  rollupWorkspace,
  EMPTY_ROLLUP,
  type MemoryPayload,
} from "@/lib/ai/workspace-rollup";
import { db } from "@/lib/db";
import { isSchemaMissingError } from "@/lib/queries/health";
import { demoSignals } from "@/lib/data/demo";

export async function GET(
  _request: Request,
  { params }: RouteContext<"/api/workspace/[id]/rollup">,
) {
  const { id: workspaceId } = await params;
  const memoryPayload = await loadMemoryPayload(workspaceId);

  if (memoryPayload.length === 0) {
    return Response.json({ success: true, data: EMPTY_ROLLUP });
  }

  try {
    const data = await rollupWorkspace(memoryPayload);
    return Response.json({ success: true, data });
  } catch (error) {
    if (error instanceof AIWrapperError) {
      const statusByCode: Partial<Record<AIWrapperError["code"], number>> = {
        MISSING_API_KEY: 500,
        PROVIDER_HTTP_ERROR: 502,
        EMPTY_PROVIDER_RESPONSE: 502,
        EMPTY_EMBEDDING_RESPONSE: 502,
        INVALID_JSON: 502,
        SCHEMA_VALIDATION_FAILED: 422,
        UNSUPPORTED_PROVIDER: 400,
      };
      return Response.json(
        {
          success: false,
          error: "Workspace rollup generation failed",
          code: error.code,
          message: error.message,
        },
        { status: statusByCode[error.code] ?? 500 },
      );
    }
    return Response.json(
      { success: false, error: "Workspace rollup generation failed" },
      { status: 500 },
    );
  }
}

async function loadMemoryPayload(workspaceId: string): Promise<MemoryPayload[]> {
  try {
    const supabase = db();

    const { data: signals, error: signalsError } = await supabase
      .from("signals")
      .select("id")
      .eq("workspace_id", workspaceId);
    if (signalsError) throw signalsError;

    const signalIds = signals?.map((signal) => signal.id) ?? [];
    if (signalIds.length === 0) return fallbackPayload(workspaceId);

    const { data: memories, error: memoryError } = await supabase
      .from("signal_analyses")
      .select(
        "confirmed_summary, likely_segment, pain_points, objections, requests, quotes",
      )
      .not("confirmed_at", "is", null)
      .not("confirmed_summary", "is", null)
      .in("signal_id", signalIds);
    if (memoryError) throw memoryError;

    if (!memories || memories.length === 0) {
      return fallbackPayload(workspaceId);
    }

    return memories.map((memory) => ({
      confirmed_summary: memory.confirmed_summary,
      likely_segment: memory.likely_segment,
      pain_points: memory.pain_points,
      objections: memory.objections,
      requests: memory.requests,
      quotes: memory.quotes,
    }));
  } catch (e) {
    if (isSchemaMissingError(e)) return fallbackPayload(workspaceId);
    throw e;
  }
}

function fallbackPayload(workspaceId: string): MemoryPayload[] {
  return demoSignals(workspaceId)
    .filter((s) => s.analysis?.confirmed_at)
    .map((s) => ({
      confirmed_summary: s.analysis?.confirmed_summary ?? null,
      likely_segment: s.analysis?.likely_segment ?? null,
      pain_points: s.analysis?.pain_points ?? null,
      objections: s.analysis?.objections ?? null,
      requests: s.analysis?.requests ?? null,
      quotes: s.analysis?.quotes ?? null,
    }));
}
