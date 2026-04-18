import Link from "next/link";
import { PageStub } from "@/components/layout/page-stub";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sparkles, ArrowUpRight, Lightbulb } from "lucide-react";
import { listIdeas } from "@/lib/queries/ideas";
import { formatDateLong } from "@/lib/format";

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
        <div className="grid gap-4 md:grid-cols-2">
          {ideas.map((idea) => {
            const status = idea.converted_workspace_id
              ? "Converted"
              : idea.approved_idea
                ? "Validated"
                : "Exploring";
            const variant: "default" | "secondary" | "outline" =
              status === "Converted"
                ? "default"
                : status === "Validated"
                  ? "secondary"
                  : "outline";
            return (
              <Card key={idea.id}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="font-display text-lg leading-tight">
                      {idea.approved_idea ?? "Untitled idea"}
                    </CardTitle>
                    <Badge variant={variant}>{status}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Saved {formatDateLong(idea.created_at)}
                  </p>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  {idea.audience && (
                    <div>
                      <p className="mb-0.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Audience
                      </p>
                      <p>{idea.audience}</p>
                    </div>
                  )}
                  {idea.problem_statement && (
                    <div>
                      <p className="mb-0.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Problem
                      </p>
                      <p className="text-muted-foreground">
                        {idea.problem_statement}
                      </p>
                    </div>
                  )}
                  <div className="flex justify-end pt-1">
                    {idea.converted_workspace_id ? (
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/w/${idea.converted_workspace_id}`}>
                          Open workspace
                          <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
                        </Link>
                      </Button>
                    ) : (
                      <Button asChild variant="outline" size="sm">
                        <Link href="/workspaces/new">Convert to workspace</Link>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </PageStub>
  );
}

function EmptyIdeas() {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-teal-50 ring-1 ring-teal-200/60">
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
