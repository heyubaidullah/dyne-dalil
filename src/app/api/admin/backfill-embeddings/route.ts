import { createServiceClient } from "@/lib/supabase/server";
import {
  generateSignalAnalysisEmbedding,
  generateDecisionEmbedding,
} from "@/lib/ai/embedding-pipeline";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST() {
  const supabase = createServiceClient();

  const { data: analyses, error: aErr } = await supabase
    .from("signal_analyses")
    .select(
      "id, confirmed_summary, likely_segment, pain_points, objections, requests, quotes, embedding",
    )
    .is("embedding", null)
    .not("confirmed_summary", "is", null);

  if (aErr) {
    return Response.json(
      { success: false, error: aErr.message },
      { status: 500 },
    );
  }

  let analysesOk = 0;
  const analysesFailed: Array<{ id: string; error: string }> = [];
  for (const a of analyses ?? []) {
    try {
      await generateSignalAnalysisEmbedding({
        signalAnalysisId: a.id,
        confirmedSummary: a.confirmed_summary,
        likelySegment: a.likely_segment,
        painPoints: a.pain_points,
        objections: a.objections,
        requests: a.requests,
        quotes: a.quotes,
      });
      analysesOk += 1;
    } catch (e) {
      analysesFailed.push({
        id: a.id,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  }

  const { data: decisions, error: dErr } = await supabase
    .from("decisions")
    .select("id, title, category, rationale, expected_outcome, embedding")
    .is("embedding", null);

  if (dErr) {
    return Response.json(
      {
        success: false,
        error: dErr.message,
        partial: { analyses_ok: analysesOk, analyses_failed: analysesFailed },
      },
      { status: 500 },
    );
  }

  let decisionsOk = 0;
  const decisionsFailed: Array<{ id: string; error: string }> = [];
  for (const d of decisions ?? []) {
    try {
      await generateDecisionEmbedding({
        decisionId: d.id,
        title: d.title,
        category: d.category,
        rationale: d.rationale,
        expectedOutcome: d.expected_outcome,
      });
      decisionsOk += 1;
    } catch (e) {
      decisionsFailed.push({
        id: d.id,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  }

  return Response.json({
    success: true,
    data: {
      analyses: {
        processed: (analyses ?? []).length,
        ok: analysesOk,
        failed: analysesFailed,
      },
      decisions: {
        processed: (decisions ?? []).length,
        ok: decisionsOk,
        failed: decisionsFailed,
      },
    },
  });
}
