import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./supabase/types";
import { env } from "./env";

/**
 * Server-side Supabase client used by RSC loaders and server actions.
 *
 * Demo mode: RLS is permissive for `anon`, so the anon key is enough to
 * read and write everything. For production (auth + strict RLS), prefer
 * the service-role client for trusted server operations.
 */
let _cached: ReturnType<typeof createSupabaseClient<Database>> | null = null;

export function db() {
  if (_cached) return _cached;
  _cached = createSupabaseClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
      db: { schema: "public" },
    },
  );
  return _cached;
}
