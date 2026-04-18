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
      eyebrow={workspace.name}
      title="From messy notes to confirmed memory."
      description="Paste a transcript, notes, or a rough recap. Dalil extracts structure with Claude, you confirm the AI's reading, and the final version becomes your canonical memory — indexed for semantic recall."
    >
      <CaptureFlow workspaceId={id} />
    </PageStub>
  );
}
