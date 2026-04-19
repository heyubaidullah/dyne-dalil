import { listRecentActivity } from "@/lib/queries/recent";
import { listWorkspaceSummaries } from "@/lib/queries/workspaces";
import { MemoryViews } from "@/components/memory/memory-views";

export const revalidate = 0;

export default async function GlobalMemoryPage() {
  const [recent, workspaces] = await Promise.all([
    listRecentActivity(200).catch(() => []),
    listWorkspaceSummaries().catch(() => []),
  ]);
  const signalMemories = recent.filter((r) => r.kind === "signal");

  return (
    <MemoryViews
      memories={signalMemories}
      workspaceCount={workspaces.length}
    />
  );
}
