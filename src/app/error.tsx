"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error("[dalil:error-boundary]", error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-[70vh] w-full max-w-xl items-center justify-center px-6 py-16">
      <Card className="w-full">
        <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-gold-100 ring-1 ring-gold-300/60">
            <AlertTriangle className="h-5 w-5 text-gold-700" />
          </span>
          <div className="space-y-1">
            <h1 className="font-display text-xl font-semibold">
              Something went sideways.
            </h1>
            <p className="max-w-sm text-sm text-muted-foreground">
              {error.message.length > 0 && error.message.length < 200
                ? error.message
                : "An unexpected error happened while rendering this page. The seed narrative is still available — try a refresh or head home."}
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            <Button onClick={reset} className="gap-1.5">
              <RotateCcw className="h-4 w-4" />
              Try again
            </Button>
            <Button asChild variant="outline">
              <Link href="/">Back to home</Link>
            </Button>
          </div>
          {error.digest && (
            <p className="pt-2 font-mono text-[10px] text-muted-foreground">
              digest · {error.digest}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
