import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-12">
      <div className="mb-10 space-y-3">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-10 w-2/3 max-w-xl" />
        <Skeleton className="h-4 w-full max-w-2xl" />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="space-y-3 rounded-xl border border-border bg-card p-5 shadow-sm"
          >
            <Skeleton className="h-5 w-3/5" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
            <div className="flex gap-2 pt-2">
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-5 w-24" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
