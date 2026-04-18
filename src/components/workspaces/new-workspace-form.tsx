"use client";

import { useActionState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  createWorkspaceAction,
  type CreateWorkspaceState,
} from "@/app/actions/workspaces";

const INITIAL: CreateWorkspaceState = {};

export function NewWorkspaceForm() {
  const [state, formAction, isPending] = useActionState(
    createWorkspaceAction,
    INITIAL,
  );

  return (
    <Card className="max-w-2xl">
      <CardContent className="pt-6">
        <form action={formAction} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="name">Workspace name</Label>
            <Input
              id="name"
              name="name"
              placeholder="e.g. Halal Delivery 0→1"
              aria-invalid={Boolean(state.fieldErrors?.name)}
              required
            />
            {state.fieldErrors?.name && (
              <p className="text-xs text-destructive">
                {state.fieldErrors.name}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">
              One-line description
              <span className="ml-1 text-xs font-normal text-muted-foreground">
                optional
              </span>
            </Label>
            <Textarea
              id="description"
              name="description"
              rows={3}
              placeholder="What are you trying to learn? Who's the early target?"
              aria-invalid={Boolean(state.fieldErrors?.description)}
            />
            {state.fieldErrors?.description && (
              <p className="text-xs text-destructive">
                {state.fieldErrors.description}
              </p>
            )}
          </div>

          {state.error && (
            <p className="text-sm text-destructive">{state.error}</p>
          )}

          <div className="flex items-center justify-end gap-2">
            <Button type="submit" disabled={isPending}>
              {isPending ? "Creating…" : "Create workspace"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
