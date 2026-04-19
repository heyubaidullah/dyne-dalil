"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { updateIdeaAction } from "@/app/actions/ideas";
import type { IdeaRow } from "@/lib/queries/ideas";

interface EditIdeaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  idea: IdeaRow;
}

export function EditIdeaDialog({
  open,
  onOpenChange,
  idea,
}: EditIdeaDialogProps) {
  const router = useRouter();
  const [saving, startSave] = useTransition();
  const [approvedIdea, setApprovedIdea] = useState(idea.approved_idea || "");
  const [audience, setAudience] = useState(idea.audience || "");
  const [problemStatement, setProblemStatement] = useState(idea.problem_statement || "");

  function handleSave() {
    startSave(async () => {
      try {
        const result = await updateIdeaAction({
          idea_id: idea.id,
          approved_idea: approvedIdea,
          audience: audience,
          problem_statement: problemStatement,
          convert_to_workspace: false,
        });

        if (!result.ok) {
          toast.error(result.error);
          return;
        }

        toast.success("Idea saved.");
        onOpenChange(false);
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Save failed.");
      }
    });
  }

  function handleConvert() {
    startSave(async () => {
      try {
        const result = await updateIdeaAction({
          idea_id: idea.id,
          approved_idea: approvedIdea,
          audience: audience,
          problem_statement: problemStatement,
          convert_to_workspace: true,
        });

        if (!result.ok) {
          toast.error(result.error);
          return;
        }

        toast.success("Idea saved and workspace created.");
        onOpenChange(false);
        if (result.workspace_id) {
          router.push(`/w/${result.workspace_id}`);
        } else {
          router.refresh();
        }
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Save failed.");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogTitle>Edit Idea</DialogTitle>
        <DialogDescription>
          Update your idea details. You can save the changes or convert this idea into a new workspace.
        </DialogDescription>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="idea" className="text-sm font-medium">
              The Idea
            </Label>
            <Input
              id="idea"
              placeholder="One-sentence description of your idea"
              value={approvedIdea}
              onChange={(e) => setApprovedIdea(e.target.value)}
              disabled={saving}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="audience" className="text-sm font-medium">
              Target Audience
            </Label>
            <Input
              id="audience"
              placeholder="The narrowest honest audience"
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
              disabled={saving}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="problem" className="text-sm font-medium">
              Problem Statement
            </Label>
            <Textarea
              id="problem"
              placeholder="The specific pain point you're solving"
              value={problemStatement}
              onChange={(e) => setProblemStatement(e.target.value)}
              disabled={saving}
              rows={4}
            />
          </div>
        </div>

        <div className="flex gap-2 pt-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            variant="secondary"
            onClick={handleSave}
            disabled={saving}
          >
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save
          </Button>
          <Button
            onClick={handleConvert}
            disabled={saving}
          >
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Convert to Workspace
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
