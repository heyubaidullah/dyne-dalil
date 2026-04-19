import "server-only";
import { db } from "@/lib/db";
import { isSchemaMissingError } from "@/lib/queries/health";
import { demoSignals } from "@/lib/data/demo";

export type SignalRow = {
  id: string;
  workspace_id: string;
  title: string | null;
  source_type: string | null;
  raw_text: string;
  created_at: string;
  feedback_type?: "qualitative" | "quantitative" | null;
  category?: string | null;
};

export type SignalAnalysisRow = {
  id: string;
  signal_id: string;
  ai_summary: string | null;
  founder_notes: string | null;
  confirmed_summary: string | null;
  positive_feedback?: string[] | null;
  negative_feedback?: string[] | null;
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
  try {
    const sb = db();
    const { data, error } = await sb
      .from("signals")
      .select(
        `id, workspace_id, title, source_type, raw_text, created_at, feedback_type, category,
         signal_analyses(id, signal_id, ai_summary, founder_notes, confirmed_summary,
                         positive_feedback, negative_feedback, pain_points, objections, requests,
                         urgency, likely_segment, quotes, confidence, confirmed_at, created_at)`,
      )
      .eq("workspace_id", workspaceId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    if (!data || data.length === 0) {
      // No real data in DB — fall back to demo signals if workspace is a demo id.
      return demoSignals(workspaceId);
    }

    return data.map((row) => {
      const rawAnalysis = row.signal_analyses;
      const analysis = Array.isArray(rawAnalysis) ? rawAnalysis[0] : rawAnalysis;
      const { signal_analyses: _dropped, ...signal } = row as typeof row & {
        signal_analyses: unknown;
      };
      return {
        ...(signal as SignalRow),
        analysis: (analysis as SignalAnalysisRow) ?? null,
      };
    });
  } catch (e) {
    if (isSchemaMissingError(e)) return demoSignals(workspaceId);
    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.warn(
        `[demo-fallback] listSignalsForWorkspace: ${e instanceof Error ? e.message : e}`,
      );
    }
    return demoSignals(workspaceId);
  }
}

export async function getSignal(id: string): Promise<SignalWithAnalysis | null> {
  try {
    const sb = db();
    const { data, error } = await sb
      .from("signals")
      .select(
        `id, workspace_id, title, source_type, raw_text, created_at, feedback_type, category,
         signal_analyses(id, signal_id, ai_summary, founder_notes, confirmed_summary,
                         positive_feedback, negative_feedback, pain_points, objections, requests,
                         urgency, likely_segment, quotes, confidence, confirmed_at, created_at)`,
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
  } catch {
    return null;
  }
}

export async function matchSimilarSignals(
  workspaceId: string,
  queryEmbedding: number[],
  matchCount = 5,
): Promise<
  Array<{
    id: string;
    signal_id: string;
    confirmed_summary: string | null;
    similarity: number;
  }>
> {
  try {
    const sb = db();
    const { data, error } = await sb.rpc("match_signal_analyses", {
      query_embedding: queryEmbedding,
      workspace_filter: workspaceId,
      match_count: matchCount,
    });
    if (error) throw error;
    return data ?? [];
  } catch {
    // Recall requires real embeddings — degrade gracefully to no matches.
    return [];
  }
}
