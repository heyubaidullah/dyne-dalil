import "server-only";
import { db } from "@/lib/db";
import { isSchemaMissingError } from "@/lib/queries/health";
import { demoRecentActivity } from "@/lib/data/demo";

export type RecentEntry = {
  kind: "signal" | "decision" | "outcome";
  id: string;
  workspace_id: string;
  workspace_name: string | null;
  title: string;
  body: string;
  quote: string | null;
  segment: string | null;
  category: string | null;
  when: string;
  outcome_status?: "improved" | "failed" | "inconclusive" | "pending";
};

/**
 * Fetch recent activity across all workspaces for the homepage.
 * Returns a mix of signals, decisions, and outcomes sorted newest-first.
 */
export async function listRecentActivity(limit = 6): Promise<RecentEntry[]> {
  const sampleLimit = Math.max(limit * 2, 6);
  try {
    const result = await fetchRecent(sampleLimit, limit);
    if (result.length === 0) return demoRecentActivity(limit);
    return result;
  } catch (e) {
    if (isSchemaMissingError(e)) return demoRecentActivity(limit);
    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.warn(
        `[demo-fallback] listRecentActivity: ${e instanceof Error ? e.message : e}`,
      );
    }
    return demoRecentActivity(limit);
  }
}

async function fetchRecent(
  sampleLimit: number,
  limit: number,
): Promise<RecentEntry[]> {
  const sb = db();
  const [signals, decisions, outcomes] = await Promise.all([
    sb
      .from("signals")
      .select(
        `id, workspace_id, title, category, created_at,
         workspaces(name),
         signal_analyses(confirmed_summary, ai_summary, likely_segment, quotes)`,
      )
      .order("created_at", { ascending: false })
      .limit(sampleLimit),
    sb
      .from("decisions")
      .select(
        `id, workspace_id, title, category, rationale, created_at,
         workspaces(name)`,
      )
      .order("created_at", { ascending: false })
      .limit(sampleLimit),
    sb
      .from("outcomes")
      .select(
        `id, decision_id, status, notes, updated_at,
         decisions(workspace_id, title, category, workspaces(name))`,
      )
      .order("updated_at", { ascending: false })
      .limit(sampleLimit),
  ]);

  for (const err of [signals.error, decisions.error, outcomes.error]) {
    if (err) throw err;
  }

  const entries: RecentEntry[] = [];

  for (const s of signals.data ?? []) {
    const wsName =
      (s as { workspaces?: { name?: string | null } | null }).workspaces?.name ??
      null;
    const rawA = (s as { signal_analyses?: unknown }).signal_analyses;
    const a = Array.isArray(rawA) ? rawA[0] : rawA;
    const summary =
      (a as { confirmed_summary?: string | null })?.confirmed_summary ??
      (a as { ai_summary?: string | null })?.ai_summary ??
      "Signal captured.";
    entries.push({
      kind: "signal",
      id: s.id,
      workspace_id: s.workspace_id,
      workspace_name: wsName,
      title: s.title ?? "Untitled input",
      body: summary,
      quote: (a as { quotes?: string[] | null })?.quotes?.[0] ?? null,
      segment:
        (a as { likely_segment?: string | null })?.likely_segment ?? null,
      category: (s as { category?: string | null }).category ?? null,
      when: s.created_at,
    });
  }

  for (const d of decisions.data ?? []) {
    const wsName =
      (d as { workspaces?: { name?: string | null } | null }).workspaces?.name ??
      null;
    entries.push({
      kind: "decision",
      id: d.id,
      workspace_id: d.workspace_id,
      workspace_name: wsName,
      title: d.title,
      body: d.rationale ?? d.category ?? "Decision logged.",
      quote: null,
      segment: d.category,
      category: d.category ?? null,
      when: d.created_at,
    });
  }

  for (const o of outcomes.data ?? []) {
    const decRef = (
      o as {
        decisions?: {
          workspace_id?: string;
          title?: string | null;
          category?: string | null;
          workspaces?: { name?: string | null } | null;
        } | null;
      }
    ).decisions;
    if (!decRef?.workspace_id) continue;
    entries.push({
      kind: "outcome",
      id: o.id,
      workspace_id: decRef.workspace_id,
      workspace_name: decRef.workspaces?.name ?? null,
      title: `${formatStatus(o.status)}: ${decRef.title ?? "decision"}`,
      body: o.notes ?? "Outcome logged.",
      quote: null,
      segment: decRef.workspaces?.name ?? null,
      category: decRef.category ?? null,
      when: o.updated_at,
      outcome_status: o.status,
    });
  }

  entries.sort((a, b) => (a.when < b.when ? 1 : -1));
  return entries.slice(0, limit);
}

function formatStatus(s: string): string {
  switch (s) {
    case "improved":
      return "Improved";
    case "failed":
      return "Failed";
    case "inconclusive":
      return "Inconclusive";
    default:
      return "Pending";
  }
}
