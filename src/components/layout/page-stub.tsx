import { Badge } from "@/components/ui/badge";

export function PageStub({
  eyebrow,
  title,
  description,
  phase,
  children,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  phase?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="dalil-page-enter mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      <div className="mb-10 flex flex-col gap-3">
        {eyebrow && (
          <p className="text-sm font-medium text-teal-700">{eyebrow}</p>
        )}
        <div className="flex items-start justify-between gap-4">
          <h1 className="font-display text-3xl font-semibold tracking-tight text-ink-950 dark:text-ink-50 sm:text-4xl">
            {title}
          </h1>
          {phase && (
            <Badge variant="outline" className="shrink-0">
              {phase}
            </Badge>
          )}
        </div>
        <p className="max-w-2xl text-base text-muted-foreground">
          {description}
        </p>
      </div>
      {children}
    </div>
  );
}
