import { PageStub } from "@/components/layout/page-stub";
import { NewWorkspaceForm } from "@/components/workspaces/new-workspace-form";

export default function NewWorkspacePage() {
  return (
    <PageStub
      eyebrow="New workspace"
      title="Name your next 0→1 bet."
      description="A workspace is the home for one product or one market. Signals, decisions, and outcomes live here together."
    >
      <NewWorkspaceForm />
    </PageStub>
  );
}
