import "server-only";
import { db } from "@/lib/db";
import { isSchemaMissingError } from "@/lib/queries/health";
import {
  DEMO_WORKSPACES,
  demoWorkspace,
  demoGlobalStats,
} from "@/lib/data/demo";

export type WorkspaceRow = {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  audience_group?: string | null;
  product_category?: string | null;
  main_goal?: string | null;
  preferred_focus?: string | null;
  team_size?: number | null;
  company_notes?: string | null;
  onboarding_completed_at?: string | null;
};

export type WorkspaceSummary = WorkspaceRow & {
  signal_count: number;
  decision_count: number;
  last_activity: string | null;
};

export async function listWorkspaceSummaries(): Promise<WorkspaceSummary[]> {
  try {
    const sb = db();
    const { data: workspaces, error } = await sb
      .from("workspaces")
      .select("id, name, description, created_at")
      .order("created_at", { ascending: false });

    if (error) throw error;
    if (!workspaces || workspaces.length === 0) return DEMO_WORKSPACES;

    const ids = workspaces.map((w) => w.id);

    const [
      { data: signals, error: sigErr },
      { data: decisions, error: decErr },
    ] = await Promise.all([
      sb.from("signals").select("id, workspace_id, created_at").in("workspace_id", ids),
      sb.from("decisions").select("id, workspace_id, created_at").in("workspace_id", ids),
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
  } catch (e) {
    if (isSchemaMissingError(e)) return DEMO_WORKSPACES;
    logFallback("listWorkspaceSummaries", e);
    return DEMO_WORKSPACES;
  }
}

export async function getWorkspace(id: string): Promise<WorkspaceRow | null> {
  try {
    const sb = db();
    const { data, error } = await sb
      .from("workspaces")
      .select("id, name, description, created_at")
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    if (data) return data;
    // Found nothing in the real DB — fall back to demo if this is a known demo id.
    return demoWorkspace(id);
  } catch (e) {
    if (isSchemaMissingError(e)) return demoWorkspace(id);
    logFallback(`getWorkspace(${id})`, e);
    return demoWorkspace(id);
  }
}

export async function globalStats(): Promise<{
  signals: number;
  decisions: number;
  outcomes: number;
  similar_recalls: number;
}> {
  try {
    const sb = db();
    const [
      { count: signals, error: sErr },
      { count: decisions, error: dErr },
      { count: outcomes, error: oErr },
    ] = await Promise.all([
      sb.from("signals").select("*", { count: "exact", head: true }),
      sb.from("decisions").select("*", { count: "exact", head: true }),
      sb.from("outcomes").select("*", { count: "exact", head: true }),
    ]);
    for (const err of [sErr, dErr, oErr]) if (err) throw err;

    const { count: memoriesIndexed, error: mErr } = await sb
      .from("signal_analyses")
      .select("*", { count: "exact", head: true })
      .not("embedding", "is", null)
      .not("confirmed_at", "is", null);
    if (mErr) throw mErr;

    const s = signals ?? 0;
    const d = decisions ?? 0;
    const o = outcomes ?? 0;
    const m = memoriesIndexed ?? 0;
    if (s + d + o + m === 0) return demoGlobalStats();
    return {
      signals: s,
      decisions: d,
      outcomes: o,
      similar_recalls: m,
    };
  } catch (e) {
    if (isSchemaMissingError(e)) return demoGlobalStats();
    logFallback("globalStats", e);
    return demoGlobalStats();
  }
}

function logFallback(source: string, err: unknown) {
  if (process.env.NODE_ENV !== "production") {
    const msg = err instanceof Error ? err.message : String(err);
    // eslint-disable-next-line no-console
    console.warn(`[demo-fallback] ${source}: ${msg}`);
  }
}
