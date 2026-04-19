import { notFound } from "next/navigation";
import { PageStub } from "@/components/layout/page-stub";
import { NewDecisionForm } from "@/components/decisions/new-decision-form";
import { getWorkspace } from "@/lib/queries/workspaces";
import { listSignalsForWorkspace } from "@/lib/queries/signals";
import { listDecisionsForWorkspace } from "@/lib/queries/decisions";
import { rollupWorkspace } from "@/lib/ai/workspace-rollup";

export default async function NewDecisionPage(
  props: PageProps<"/w/[id]/decisions/new">,
) {
  const { id } = await props.params;
  const searchParams = await props.searchParams;
  const preselected =
    typeof searchParams?.signal === "string" ? searchParams.signal : undefined;
  const preselectedTheme =
    typeof searchParams?.theme === "string" ? searchParams.theme : undefined;

  const [workspace, signals, decisions] = await Promise.all([
    getWorkspace(id),
    listSignalsForWorkspace(id),
    listDecisionsForWorkspace(id),
  ]);
  if (!workspace) notFound();

  const usedThemeKeys = new Set(
    decisions
      .map((d) => d.category?.trim().toLowerCase())
      .filter((c): c is string => Boolean(c)),
  );

  const signalOptions = signals.map((s) => ({
    id: s.id,
    title: s.title,
    created_at: s.created_at,
    category: s.category ?? null,
    confirmed_summary: s.analysis?.confirmed_summary ?? null,
    segment: s.analysis?.likely_segment ?? null,
  }));

  // Build category-derived themes — one "theme" per category, ordered by
  // frequency. This is what the Log-a-Decision form surfaces above Link
  // Evidence so the founder can one-click pivot a theme into a decision.
  type ThemeSeed = {
    key: string;
    label: string;
    count: number;
    managed: boolean;
    rationaleHint: string;
    descriptionHint: string;
    expectedOutcomeHint: string;
    evidenceIds: string[];
  };
  const byCategory = new Map<string, ThemeSeed>();
  for (const s of signals) {
    const key = s.category?.trim();
    if (!key) continue;
    const seed =
      byCategory.get(key) ?? {
        key,
        label: key,
        count: 0,
        managed: usedThemeKeys.has(key.toLowerCase()),
        rationaleHint: "",
        descriptionHint: "",
        expectedOutcomeHint: "",
        evidenceIds: [],
      };
    seed.count += 1;
    if (s.analysis?.confirmed_summary && seed.rationaleHint.length < 500) {
      seed.rationaleHint = seed.rationaleHint
        ? `${seed.rationaleHint}\n- ${s.analysis.confirmed_summary}`
        : `- ${s.analysis.confirmed_summary}`;
    }
    if (s.analysis?.confirmed_summary && seed.descriptionHint.length < 300) {
      seed.descriptionHint = seed.descriptionHint
        ? `${seed.descriptionHint} ${s.analysis.confirmed_summary}`
        : s.analysis.confirmed_summary;
    }
    if (seed.expectedOutcomeHint.length < 300) {
      const segment = s.analysis?.likely_segment?.trim();
      if (segment) {
        seed.expectedOutcomeHint = seed.expectedOutcomeHint
          ? `${seed.expectedOutcomeHint}; ${segment}`
          : segment;
      }
    }
    seed.evidenceIds.push(s.id);
    byCategory.set(key, seed);
  }

  let recurringThemes = Array.from(byCategory.values()).sort(
    (a, b) => b.count - a.count,
  );

  // If the workspace has memories but no categories yet (legacy workspaces,
  // pre-category seed), fall back to the AI rollup's recurring_themes.
  if (recurringThemes.length === 0) {
    const memories = signals
      .map((s) => s.analysis)
      .filter((a): a is NonNullable<typeof a> => Boolean(a?.confirmed_at))
      .map((a) => ({
        confirmed_summary: a.confirmed_summary ?? a.ai_summary ?? "",
        likely_segment: a.likely_segment,
        pain_points: a.pain_points,
        objections:
          a.negative_feedback && a.negative_feedback.length > 0
            ? a.negative_feedback
            : a.objections,
        requests: a.requests,
        quotes: a.quotes,
      }));
    if (memories.length > 0) {
      try {
        const roll = await rollupWorkspace(memories);
        recurringThemes = roll.recurring_themes.slice(0, 6).map((t) => ({
          key: t,
          label: t,
          count: 0,
          managed: usedThemeKeys.has(t.toLowerCase()),
          rationaleHint: "",
          descriptionHint: "",
          expectedOutcomeHint: "",
          evidenceIds: [],
        }));
      } catch {
        // Non-fatal — themes picker just stays empty.
      }
    }
  }

  return (
    <PageStub
      eyebrow={`${workspace.name} · Log a Decision`}
      title="Log a decision."
      description="Pick a recurring theme to auto-draft the decision, link supporting feedback, and let the embedded Dalil Assistant refine the form as you go."
    >
      <NewDecisionForm
        workspaceId={id}
        signals={signalOptions}
        preselectedSignalId={preselected}
        preselectedTheme={preselectedTheme}
        recurringThemes={recurringThemes}
      />
    </PageStub>
  );
}
