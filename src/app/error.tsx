"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LogoMark } from "@/components/layout/logo";

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
          <div className="relative">
            <LogoMark size={56} />
            <span className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-gold-100 ring-2 ring-background">
              <AlertTriangle className="h-3.5 w-3.5 text-gold-700" />
            </span>
          </div>
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
