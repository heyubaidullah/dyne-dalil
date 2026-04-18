import "server-only";
import { db } from "@/lib/db";

export type WorkspaceRow = {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
};

export type WorkspaceSummary = WorkspaceRow & {
  signal_count: number;
  decision_count: number;
  last_activity: string | null;
};

export async function listWorkspaceSummaries(): Promise<WorkspaceSummary[]> {
  const sb = db();

  const { data: workspaces, error } = await sb
    .from("workspaces")
    .select("id, name, description, created_at")
    .order("created_at", { ascending: false });

  if (error) throw error;
  if (!workspaces || workspaces.length === 0) return [];

  const ids = workspaces.map((w) => w.id);

  const [{ data: signals, error: sigErr }, { data: decisions, error: decErr }] =
    await Promise.all([
      sb
        .from("signals")
        .select("id, workspace_id, created_at")
        .in("workspace_id", ids),
      sb
        .from("decisions")
        .select("id, workspace_id, created_at")
        .in("workspace_id", ids),
    ]);

  if (sigErr) throw sigErr;
  if (decErr) throw decErr;

  const signalsByWs = new Map<string, { count: number; latest: string | null }>();
  const decisionsByWs = new Map<string, { count: number; latest: string | null }>();

  for (const s of signals ?? []) {
    const bucket = signalsByWs.get(s.workspace_id) ?? { count: 0, latest: null };
    bucket.count += 1;
    if (!bucket.latest || s.created_at > bucket.latest) bucket.latest = s.created_at;
    signalsByWs.set(s.workspace_id, bucket);
  }
  for (const d of decisions ?? []) {
    const bucket = decisionsByWs.get(d.workspace_id) ?? { count: 0, latest: null };
    bucket.count += 1;
    if (!bucket.latest || d.created_at > bucket.latest) bucket.latest = d.created_at;
    decisionsByWs.set(d.workspace_id, bucket);
  }

  return workspaces.map((w) => {
    const s = signalsByWs.get(w.id);
    const d = decisionsByWs.get(w.id);
    const latest = [s?.latest, d?.latest, w.created_at]
      .filter((x): x is string => Boolean(x))
      .sort()
      .at(-1) ?? null;
    return {
      ...w,
      signal_count: s?.count ?? 0,
      decision_count: d?.count ?? 0,
      last_activity: latest,
    };
  });
}

export async function getWorkspace(id: string): Promise<WorkspaceRow | null> {
  const sb = db();
  const { data, error } = await sb
    .from("workspaces")
    .select("id, name, description, created_at")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data ?? null;
}

export async function globalStats(): Promise<{
  signals: number;
  decisions: number;
  outcomes: number;
  similar_recalls: number;
}> {
  const sb = db();
  const [{ count: signals }, { count: decisions }, { count: outcomes }] =
    await Promise.all([
      sb.from("signals").select("*", { count: "exact", head: true }),
      sb.from("decisions").select("*", { count: "exact", head: true }),
      sb.from("outcomes").select("*", { count: "exact", head: true }),
    ]);

  // `similar_recalls` is not yet tracked as an event, so we approximate it
  // as "memories that are indexed and therefore recallable".
  const { count: memoriesIndexed } = await sb
    .from("signal_analyses")
    .select("*", { count: "exact", head: true })
    .not("embedding", "is", null)
    .not("confirmed_at", "is", null);

  return {
    signals: signals ?? 0,
    decisions: decisions ?? 0,
    outcomes: outcomes ?? 0,
    similar_recalls: memoriesIndexed ?? 0,
  };
}
