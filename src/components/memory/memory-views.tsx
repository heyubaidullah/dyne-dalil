"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { PageStub } from "@/components/layout/page-stub";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Inbox, Quote, X } from "lucide-react";
import type { RecentEntry } from "@/lib/queries/recent";
import { formatDateLong } from "@/lib/format";
import { cn } from "@/lib/utils";

interface MemoryViewsProps {
  memories: RecentEntry[];
  workspaceCount: number;
}

export function MemoryViews({ memories, workspaceCount }: MemoryViewsProps) {
  const [selectedWorkspaces, setSelectedWorkspaces] = useState<Set<string>>(
    new Set(),
  );

  // Extract unique workspaces from memories.
  const availableWorkspaces = useMemo(() => {
    const workspaces = new Map<
      string,
      { id: string; name: string; count: number }
    >();
    for (const memory of memories) {
      const key = memory.workspace_id;
      const name = memory.workspace_name ?? "Unnamed";
      if (!workspaces.has(key)) {
        workspaces.set(key, { id: key, name, count: 0 });
      }
      const ws = workspaces.get(key)!;
      ws.count += 1;
    }
    return Array.from(workspaces.values()).sort((a, b) =>
      a.name.localeCompare(b.name),
    );
  }, [memories]);

  // Filter memories by selected workspaces (or all if none selected).
  const filteredMemories = useMemo(() => {
    if (selectedWorkspaces.size === 0) return memories;
    return memories.filter((m) => selectedWorkspaces.has(m.workspace_id));
  }, [memories, selectedWorkspaces]);

  function toggleWorkspace(workspaceId: string) {
    setSelectedWorkspaces((prev) => {
      const next = new Set(prev);
      if (next.has(workspaceId)) {
        next.delete(workspaceId);
      } else {
        next.add(workspaceId);
      }
      return next;
    });
  }

  function clearFilter() {
    setSelectedWorkspaces(new Set());
  }

  return (
    <PageStub
      eyebrow="Memory"
      title="All confirmed memories, across every Dashboard."
      description="Canonical customer signals from every GTM dashboard. Click any memory for the full source and its linked decisions."
    >
      {memories.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-teal-50 ring-1 ring-teal-200/60 dark:bg-teal-950/30 dark:ring-teal-800/40">
              <Inbox className="h-5 w-5 text-teal-700" />
            </span>
            <p className="max-w-sm text-sm text-muted-foreground">
              No confirmed memories yet. Add feedback in any Dashboard and
              confirm the AI extraction to see it surface here.
            </p>
            <Button asChild>
              <Link href="/workspaces">
                Open a dashboard
                <ArrowRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Dashboard Filter */}
          <div className="mb-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                <span>{filteredMemories.length} memories</span>
                <span>·</span>
                <span>{workspaceCount} dashboards</span>
              </div>
              {selectedWorkspaces.size > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilter}
                  className="gap-1 text-xs"
                >
                  <X className="h-3 w-3" />
                  Clear
                </Button>
              )}
            </div>

            <div>
              <h3 className="mb-2 text-sm font-medium">Filter by Dashboard</h3>
              <div className="flex flex-wrap gap-2">
                {availableWorkspaces.map((ws) => {
                  const isSelected = selectedWorkspaces.has(ws.id);
                  return (
                    <button
                      key={ws.id}
                      onClick={() => toggleWorkspace(ws.id)}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                        isSelected
                          ? "bg-teal-700 text-white shadow-sm"
                          : "border border-border bg-background text-foreground hover:bg-secondary",
                      )}
                    >
                      {ws.name}
                      <span className="text-xs opacity-75">({ws.count})</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Memories Grid */}
          <div className="grid gap-4 md:grid-cols-2">
            {filteredMemories.map((m) => (
              <Link key={m.id} href={`/w/${m.workspace_id}/memory`}>
                <Card className="h-full transition-shadow hover:shadow-md">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="font-display text-base leading-tight">
                        {m.title}
                      </CardTitle>
                      {m.workspace_name && (
                        <Badge variant="outline" className="shrink-0">
                          {m.workspace_name}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {formatDateLong(m.when)}
                      {m.segment ? ` · ${m.segment}` : ""}
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-ink-700 dark:text-ink-200">
                      {m.body}
                    </p>
                    {m.quote && (
                      <blockquote className="flex gap-2 border-l-2 border-teal-500 pl-3 text-sm italic text-ink-700 dark:text-ink-200">
                        <Quote className="mt-0.5 h-3.5 w-3.5 shrink-0 text-teal-500" />
                        <span>{m.quote}</span>
                      </blockquote>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </>
      )}
    </PageStub>
  );
}
