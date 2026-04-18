import "server-only";
import { db } from "@/lib/db";
import { isSchemaMissingError } from "@/lib/queries/health";
import { demoTimeline } from "@/lib/data/demo";

export type TimelineEntry =
  | {
      kind: "signal";
      id: string;
      date: string;
      title: string;
      body: string;
    }
  | {
      kind: "decision";
      id: string;
      date: string;
      title: string;
      body: string;
      category: string | null;
    }
  | {
      kind: "outcome";
      id: string;
      date: string;
      title: string;
      body: string;
      status: "improved" | "failed" | "inconclusive" | "pending";
    };

export async function listTimelineForWorkspace(
  workspaceId: string,
): Promise<TimelineEntry[]> {
  try {
    const sb = db();

    const [
      { data: signals, error: sErr },
      { data: decisions, error: dErr },
      { data: outcomes, error: oErr },
    ] = await Promise.all([
      sb
        .from("signals")
        .select(
          `id, created_at, title, source_type,
           signal_analyses(confirmed_summary, ai_summary)`,
        )
        .eq("workspace_id", workspaceId),
      sb
        .from("decisions")
        .select("id, created_at, title, category, rationale")
        .eq("workspace_id", workspaceId),
      sb
        .from("outcomes")
        .select(
          `id, updated_at, status, notes,
           decisions!inner(id, title, workspace_id)`,
        )
        .eq("decisions.workspace_id", workspaceId),
    ]);

    for (const err of [sErr, dErr, oErr]) if (err) throw err;

    const entries: TimelineEntry[] = [];

    for (const s of signals ?? []) {
      const rawAnalysis = (s as { signal_analyses?: unknown }).signal_analyses;
      const analysis = Array.isArray(rawAnalysis) ? rawAnalysis[0] : rawAnalysis;
      const body =
        (analysis as { confirmed_summary?: string | null })?.confirmed_summary ??
        (analysis as { ai_summary?: string | null })?.ai_summary ??
        "Raw signal pending review.";
      entries.push({
        kind: "signal",
        id: s.id,
        date: s.created_at,
        title: s.title ?? "Untitled signal",
        body,
      });
    }

    for (const d of decisions ?? []) {
      entries.push({
        kind: "decision",
        id: d.id,
        date: d.created_at,
        title: d.title,
        body: d.rationale ?? "Decision logged.",
        category: d.category,
      });
    }

    for (const o of outcomes ?? []) {
      const decRef = (o as { decisions?: { title?: string | null } | null }).decisions;
      const decisionTitle = decRef?.title ?? "Outcome";
      entries.push({
        kind: "outcome",
        id: o.id,
        date: o.updated_at,
        title: `${formatStatus(o.status)}: ${decisionTitle}`,
        body: o.notes ?? "",
        status: o.status,
      });
    }

    if (entries.length === 0) return demoTimeline(workspaceId);
    entries.sort((a, b) => (a.date < b.date ? 1 : -1));
    return entries;
  } catch (e) {
    if (isSchemaMissingError(e)) return demoTimeline(workspaceId);
    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.warn(
        `[demo-fallback] listTimelineForWorkspace: ${e instanceof Error ? e.message : e}`,
      );
    }
    return demoTimeline(workspaceId);
  }
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
