import Link from "next/link";
import { Compass } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-xl items-center justify-center px-6 py-16">
      <Card className="w-full">
        <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-teal-50 ring-1 ring-teal-200/60">
            <Compass className="h-5 w-5 text-teal-700" />
          </span>
          <div className="space-y-1">
            <h1 className="font-display text-xl font-semibold">
              This page isn&apos;t in the Memory Library.
            </h1>
            <p className="max-w-sm text-sm text-muted-foreground">
              The URL didn&apos;t match any workspace, memory, or route.
              Head back and pick up where you left off.
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            <Button asChild>
              <Link href="/">Back to home</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/workspaces">Open a workspace</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
