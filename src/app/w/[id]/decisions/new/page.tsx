import { notFound } from "next/navigation";
import { PageStub } from "@/components/layout/page-stub";
import { NewDecisionForm } from "@/components/decisions/new-decision-form";
import { getWorkspace } from "@/lib/queries/workspaces";
import { listSignalsForWorkspace } from "@/lib/queries/signals";

export default async function NewDecisionPage(
  props: PageProps<"/w/[id]/decisions/new">,
) {
  const { id } = await props.params;
  const searchParams = await props.searchParams;
  const preselected =
    typeof searchParams?.signal === "string" ? searchParams.signal : undefined;

  const [workspace, signals] = await Promise.all([
    getWorkspace(id),
    listSignalsForWorkspace(id),
  ]);
  if (!workspace) notFound();

  const signalOptions = signals.map((s) => ({
    id: s.id,
    title: s.title,
    created_at: s.created_at,
    confirmed_summary: s.analysis?.confirmed_summary ?? null,
    segment: s.analysis?.likely_segment ?? null,
  }));

  return (
    <PageStub
      eyebrow={workspace.name}
      title="Log a decision."
      description="Write down what you decided, why, and the evidence that justified it. Dalil will track the outcome and close the learning loop."
    >
      <NewDecisionForm
        workspaceId={id}
        signals={signalOptions}
        preselectedSignalId={preselected}
      />
    </PageStub>
  );
}
