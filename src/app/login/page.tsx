import Link from "next/link";
import { LogoMark } from "@/components/layout/logo";
import { Card, CardContent } from "@/components/ui/card";
import { LoginForm } from "@/components/auth/login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const sp = await searchParams;
  return (
    <div className="relative mx-auto flex min-h-[calc(100vh-theme(spacing.16))] w-full items-center justify-center px-4 py-12 sm:px-6">
      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center text-center">
          <LogoMark size={52} priority className="mb-4" />
          <h1 className="font-display text-2xl font-semibold tracking-tight text-ink-950 dark:text-ink-50 sm:text-3xl">
            Welcome back to Dalil.
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Evidence for every next move.
          </p>
        </div>

        <Card>
          <CardContent className="pt-6">
            <LoginForm
              initialError={sp.error}
              next={sp.next}
            />
          </CardContent>
        </Card>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          New to Dalil?{" "}
          <Link
            href={
              sp.next ? `/signup?next=${encodeURIComponent(sp.next)}` : "/signup"
            }
            className="font-medium text-teal-700 hover:underline dark:text-teal-400"
          >
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
