import { db } from "@/lib/db";
import { generateEmbedding } from "@/lib/ai/wrapper";

export async function GET(
  _request: Request,
  {
    params,
  }: RouteContext<"/api/workspace/[id]/signals/[signalId]/similar">,
) {
  const { id: workspaceId, signalId } = await params;
  const supabase = db();

  const { data: signal, error: signalError } = await supabase
    .from("signals")
    .select("id, workspace_id")
    .eq("id", signalId)
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

  const { data: analysis } = await supabase
    .from("signal_analyses")
    .select(
      "confirmed_summary, likely_segment, pain_points, objections, requests, quotes",
    )
    .eq("signal_id", signalId)
    .maybeSingle();

  if (!analysis?.confirmed_summary) {
    return Response.json({
      success: true,
      data: { ready: false, similar: [] },
    });
  }

  const text = [
    analysis.confirmed_summary,
    analysis.likely_segment
      ? `Likely segment: ${analysis.likely_segment}`
      : null,
    analysis.pain_points?.length
      ? `Pain points: ${analysis.pain_points.join("; ")}`
      : null,
    analysis.objections?.length
      ? `Objections: ${analysis.objections.join("; ")}`
      : null,
    analysis.requests?.length
      ? `Requests: ${analysis.requests.join("; ")}`
      : null,
    analysis.quotes?.length ? `Quotes: ${analysis.quotes.join("; ")}` : null,
  ]
    .filter(Boolean)
    .join("\n\n");

  let embedding: number[];
  try {
    embedding = await generateEmbedding({ provider: "gemini", input: text });
  } catch (error) {
    console.error("[similar] embedding failed", error);
    return Response.json(
      { success: false, error: "Embedding failed" },
      { status: 502 },
    );
  }

  const { data: matches, error: rpcError } = await supabase.rpc(
    "match_signal_analyses",
    {
      query_embedding: embedding,
      workspace_filter: workspaceId,
      match_count: 6,
    },
  );

  if (rpcError) {
    console.error("[similar] rpc failed", rpcError);
    return Response.json({
      success: true,
      data: { ready: true, similar: [] },
    });
  }

  const similar = (matches ?? [])
    .filter(
      (m: { signal_id: string }) => m.signal_id !== signalId,
    )
    .slice(0, 5);

  return Response.json({
    success: true,
    data: { ready: true, similar },
  });
}
