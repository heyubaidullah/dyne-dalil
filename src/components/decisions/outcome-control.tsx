"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";
import { updateOutcomeAction } from "@/app/actions/decisions";

type Status = "improved" | "failed" | "inconclusive" | "pending";

export function OutcomeControl({
  decisionId,
  workspaceId,
  currentStatus,
  currentNotes,
}: {
  decisionId: string;
  workspaceId: string;
  currentStatus: Status;
  currentNotes: string;
}) {
  const [status, setStatus] = useState<Status>(currentStatus);
  const [notes, setNotes] = useState(currentNotes);
  const [editing, setEditing] = useState(false);
  const [pending, startTransition] = useTransition();

  const dirty = status !== currentStatus || notes !== currentNotes;

  function save() {
    startTransition(async () => {
      const res = await updateOutcomeAction({
        decision_id: decisionId,
        workspace_id: workspaceId,
        status,
        notes,
      });
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success("Outcome updated.");
      setEditing(false);
    });
  }

  if (!editing) {
    return (
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">
          {currentNotes ? currentNotes : "No outcome notes yet."}
        </p>
        <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
          Update outcome
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-[1fr_2fr]">
        <div className="space-y-1.5">
          <Label className="text-xs">Status</Label>
          <Select value={status} onValueChange={(v) => setStatus((v ?? "pending") as Status)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="improved">Improved</SelectItem>
              <SelectItem value="inconclusive">Inconclusive</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Notes</Label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="What actually happened? Numbers if you have them."
          />
        </div>
      </div>
      <div className="flex items-center justify-end gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setStatus(currentStatus);
            setNotes(currentNotes);
            setEditing(false);
          }}
        >
          Cancel
        </Button>
        <Button
          size="sm"
          onClick={save}
          disabled={pending || !dirty}
          className="gap-1.5"
        >
          <CheckCircle2 className="h-3.5 w-3.5" />
          Save outcome
        </Button>
      </div>
    </div>
  );
}
