import Link from "next/link";
import { PageStub } from "@/components/layout/page-stub";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sparkles, ArrowUpRight, Lightbulb } from "lucide-react";
import { listIdeas } from "@/lib/queries/ideas";
import { formatDateLong } from "@/lib/format";
import { IdeasGrid } from "@/components/ideas/ideas-grid";

export const revalidate = 0;

export default async function IdeaVaultPage() {
  const ideas = await listIdeas().catch(() => []);

  return (
    <PageStub
      eyebrow="Idea Vault"
      title="Every stage-zero idea, saved and sharpened."
      description="Ideas approved through the homepage 'What do you want to do today?' chat. Convert one to a workspace when you're ready to start capturing evidence."
    >
      <div className="mb-4 flex items-center justify-end">
        <Button asChild className="gap-1.5">
          <Link href="/start">
            <Sparkles className="h-4 w-4" />
            Start a new idea
          </Link>
        </Button>
      </div>

      {ideas.length === 0 ? (
        <EmptyIdeas />
      ) : (
        <IdeasGrid ideas={ideas} />
      )}
    </PageStub>
  );
}

function EmptyIdeas() {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-teal-50 ring-1 ring-teal-200/60 dark:bg-teal-950/30 dark:ring-teal-800/40">
          <Lightbulb className="h-5 w-5 text-teal-700" />
        </span>
        <div className="space-y-1">
          <h3 className="font-display text-lg font-semibold">
            No ideas saved yet.
          </h3>
          <p className="max-w-sm text-sm text-muted-foreground">
            Use Dalil Start to sharpen a stage-zero idea. Approved ideas land
            here for later conversion into a workspace.
          </p>
        </div>
        <Button asChild>
          <Link href="/start">
            <Sparkles className="mr-1 h-4 w-4" />
            Start a new idea
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
