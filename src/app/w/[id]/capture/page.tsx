import { notFound } from "next/navigation";
import { PageStub } from "@/components/layout/page-stub";
import { CaptureFlow } from "@/components/capture/capture-flow";
import { getWorkspace } from "@/lib/queries/workspaces";

export default async function CapturePage(props: PageProps<"/w/[id]/capture">) {
  const { id } = await props.params;
  const workspace = await getWorkspace(id);
  if (!workspace) notFound();

  return (
    <PageStub
      eyebrow={`${workspace.name} · Add Feedback`}
      title="From messy notes to confirmed memory."
      description="Paste a transcript, a note, a DM, a review, or drop a file. Dalil AI extracts positive feedback, negative feedback, pain points, requests, and a reusable category. You confirm — the final version becomes your canonical memory."
    >
      <CaptureFlow workspaceId={id} />
    </PageStub>
  );
}
