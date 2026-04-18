import Link from "next/link";
import { PageStub } from "@/components/layout/page-stub";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export default function GlobalMemoryPage() {
  return (
    <PageStub
      eyebrow="Memory"
      title="All confirmed memories, across every workspace."
      description="Cross-workspace view. Pick a workspace for the scoped memory library with filters, themes, and similar-issue recall."
    >
      <Card>
        <CardContent className="flex flex-col items-start gap-3 py-10">
          <p className="text-muted-foreground">
            To see the canonical memory with semantic recall and quote
            snippets, open a workspace.
          </p>
          <Button asChild>
            <Link href="/workspaces">
              Pick a workspace
              <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    </PageStub>
  );
}
