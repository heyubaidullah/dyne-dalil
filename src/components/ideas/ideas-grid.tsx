"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowUpRight, Edit2, Loader2, Trash2 } from "lucide-react";
import { EditIdeaDialog } from "@/components/ideas/edit-idea-dialog";
import { deleteIdeaAction } from "@/app/actions/ideas";
import type { IdeaRow } from "@/lib/queries/ideas";

interface IdeasGridProps {
  ideas: IdeaRow[];
}

export function IdeasGrid({ ideas }: IdeasGridProps) {
  const router = useRouter();
  const [deleting, startDelete] = useTransition();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingIdea, setEditingIdea] = useState<IdeaRow | null>(null);

  function handleDeleteIdea(idea: IdeaRow) {
    if (idea.converted_workspace_id) return;
    const confirmed = window.confirm(
      "Delete this idea from the vault? This cannot be undone.",
    );
    if (!confirmed) return;

    setDeletingId(idea.id);
    startDelete(async () => {
      try {
        const result = await deleteIdeaAction({ idea_id: idea.id });
        if (!result.ok) {
          toast.error(result.error);
          return;
        }
        toast.success("Idea deleted.");
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Delete failed.");
      } finally {
        setDeletingId(null);
      }
    });
  }

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2">
        {ideas.map((idea) => {
          const isConverted =
            typeof idea.converted_workspace_id === "string" &&
            idea.converted_workspace_id.trim().length > 0;
          const status = isConverted
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
                  Saved {new Date(idea.created_at).toLocaleDateString()}
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
                <div className="flex flex-wrap justify-end gap-2 pt-1">
                  {isConverted ? (
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/w/${idea.converted_workspace_id as string}`}>
                        Open workspace
                        <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
                      </Link>
                    </Button>
                  ) : (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingIdea(idea)}
                        className="gap-1.5"
                        disabled={deleting && deletingId === idea.id}
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                        Edit Idea
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteIdea(idea)}
                        className="gap-1.5"
                        disabled={deleting && deletingId === idea.id}
                      >
                        {deleting && deletingId === idea.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5" />
                        )}
                        Delete Idea
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {editingIdea && (
        <EditIdeaDialog
          open={!!editingIdea}
          onOpenChange={(open) => {
            if (!open) setEditingIdea(null);
          }}
          idea={editingIdea}
        />
      )}
    </>
  );
}
