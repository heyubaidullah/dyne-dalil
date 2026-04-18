import "server-only";
import { db } from "@/lib/db";

export type DecisionRow = {
  id: string;
  workspace_id: string;
  title: string;
  category: string | null;
  rationale: string | null;
  expected_outcome: string | null;
  created_at: string;
};

export type OutcomeRow = {
  id: string;
  decision_id: string;
  status: "improved" | "failed" | "inconclusive" | "pending";
  notes: string | null;
  updated_at: string;
};

export type EvidenceRow = {
  decision_id: string;
  signal_id: string;
  snippet: string | null;
};

export type DecisionWithContext = DecisionRow & {
  evidence: Array<{ signal_id: string; snippet: string | null; signal_title: string | null }>;
  outcome: OutcomeRow | null;
};

export async function listDecisionsForWorkspace(
  workspaceId: string,
): Promise<DecisionWithContext[]> {
  const sb = db();

  const { data: decisions, error } = await sb
    .from("decisions")
    .select("id, workspace_id, title, category, rationale, expected_outcome, created_at")
    .eq("workspace_id", workspaceId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  if (!decisions || decisions.length === 0) return [];

  const ids = decisions.map((d) => d.id);

  const [{ data: evidence, error: evErr }, { data: outcomes, error: outErr }] =
    await Promise.all([
      sb
        .from("decision_evidence")
        .select("decision_id, signal_id, snippet, signals(title)")
        .in("decision_id", ids),
      sb
        .from("outcomes")
        .select("id, decision_id, status, notes, updated_at")
        .in("decision_id", ids)
        .order("updated_at", { ascending: false }),
    ]);

  if (evErr) throw evErr;
  if (outErr) throw outErr;

  const evByDecision = new Map<
    string,
    Array<{ signal_id: string; snippet: string | null; signal_title: string | null }>
  >();
  for (const e of evidence ?? []) {
    const title =
      (e as { signals?: { title?: string | null } | null }).signals?.title ?? null;
    const list = evByDecision.get(e.decision_id) ?? [];
    list.push({ signal_id: e.signal_id, snippet: e.snippet, signal_title: title });
    evByDecision.set(e.decision_id, list);
  }

  const latestOutcome = new Map<string, OutcomeRow>();
  for (const o of outcomes ?? []) {
    if (!latestOutcome.has(o.decision_id)) {
      latestOutcome.set(o.decision_id, o as OutcomeRow);
    }
  }

  return decisions.map((d) => ({
    ...d,
    evidence: evByDecision.get(d.id) ?? [],
    outcome: latestOutcome.get(d.id) ?? null,
  }));
}

export async function matchSimilarDecisions(
  workspaceId: string,
  queryEmbedding: number[],
  matchCount = 3,
): Promise<Array<{ id: string; title: string; rationale: string | null; similarity: number }>> {
  const sb = db();
  const { data, error } = await sb.rpc("match_decisions", {
    query_embedding: queryEmbedding,
    workspace_filter: workspaceId,
    match_count: matchCount,
  });
  if (error) throw error;
  return data ?? [];
}
