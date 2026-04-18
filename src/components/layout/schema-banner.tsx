import { AlertTriangle, Terminal } from "lucide-react";

export function SchemaBanner({ message }: { message?: string }) {
  return (
    <div className="mx-auto mb-6 max-w-6xl px-6">
      <div className="flex gap-3 rounded-xl border border-gold-300/60 bg-gold-100/60 p-4 text-sm">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-gold-700" />
        <div className="flex-1 space-y-2">
          <p className="font-medium text-ink-950">
            Supabase schema not applied yet.
          </p>
          <p className="text-muted-foreground">
            {message ??
              "The database tables Dalil needs haven't been created yet. Run the migration to unlock real workspaces, memory, decisions, and timeline."}
          </p>
          <div className="rounded-md bg-ink-950 p-3 font-mono text-xs text-ink-100">
            <div className="flex items-center gap-2 text-ink-300">
              <Terminal className="h-3 w-3" />
              <span>From the project root</span>
            </div>
            <div className="mt-2">supabase db push</div>
            <div className="mt-1 text-ink-400">
              # or paste supabase/migrations/20260418140000_init.sql into the
              # Supabase SQL editor, then paste supabase/seed.sql for demo data.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
