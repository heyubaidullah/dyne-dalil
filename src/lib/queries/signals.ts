import "server-only";
import { db } from "@/lib/db";
import { isSchemaMissingError } from "@/lib/queries/health";

export type SignalRow = {
  id: string;
  workspace_id: string;
  title: string | null;
  source_type: string | null;
  raw_text: string;
  created_at: string;
};

export type SignalAnalysisRow = {
  id: string;
  signal_id: string;
  ai_summary: string | null;
  founder_notes: string | null;
  confirmed_summary: string | null;
  pain_points: string[] | null;
  objections: string[] | null;
  requests: string[] | null;
  urgency: string | null;
  likely_segment: string | null;
  quotes: string[] | null;
  confidence: string | null;
  confirmed_at: string | null;
  created_at: string;
};

export type SignalWithAnalysis = SignalRow & {
  analysis: SignalAnalysisRow | null;
};

export async function listSignalsForWorkspace(
  workspaceId: string,
): Promise<SignalWithAnalysis[]> {
  const sb = db();
  const { data, error } = await sb
    .from("signals")
    .select(
      `id, workspace_id, title, source_type, raw_text, created_at,
       signal_analyses(id, signal_id, ai_summary, founder_notes, confirmed_summary,
                       pain_points, objections, requests, urgency, likely_segment,
                       quotes, confidence, confirmed_at, created_at)`,
    )
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false });

  if (error) {
    if (isSchemaMissingError(error)) return [];
    throw error;
  }
  if (!data) return [];

  return data.map((row) => {
    const rawAnalysis = row.signal_analyses;
    const analysis = Array.isArray(rawAnalysis) ? rawAnalysis[0] : rawAnalysis;
    const { signal_analyses: _dropped, ...signal } = row as typeof row & {
      signal_analyses: unknown;
    };
    return { ...(signal as SignalRow), analysis: (analysis as SignalAnalysisRow) ?? null };
  });
}

export async function getSignal(id: string): Promise<SignalWithAnalysis | null> {
  const sb = db();
  const { data, error } = await sb
    .from("signals")
    .select(
      `id, workspace_id, title, source_type, raw_text, created_at,
       signal_analyses(id, signal_id, ai_summary, founder_notes, confirmed_summary,
                       pain_points, objections, requests, urgency, likely_segment,
                       quotes, confidence, confirmed_at, created_at)`,
    )
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const rawAnalysis = (data as { signal_analyses?: unknown }).signal_analyses;
  const analysis = Array.isArray(rawAnalysis) ? rawAnalysis[0] : rawAnalysis;
  const { signal_analyses: _dropped, ...signal } = data as typeof data & {
    signal_analyses: unknown;
  };
  return { ...(signal as SignalRow), analysis: (analysis as SignalAnalysisRow) ?? null };
}

export async function matchSimilarSignals(
  workspaceId: string,
  queryEmbedding: number[],
  matchCount = 5,
): Promise<Array<{ id: string; signal_id: string; confirmed_summary: string | null; similarity: number }>> {
  const sb = db();
  const { data, error } = await sb.rpc("match_signal_analyses", {
    query_embedding: queryEmbedding,
    workspace_filter: workspaceId,
    match_count: matchCount,
  });
  if (error) throw error;
  return data ?? [];
}
