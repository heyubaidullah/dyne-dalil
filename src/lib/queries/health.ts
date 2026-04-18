import "server-only";

/**
 * Centralizes detection of the "Supabase tables don't exist yet" situation.
 * PGRST205 is the PostgREST error code for "relation not found in schema
 * cache" — what you get before the migration has been applied.
 */

export function isSchemaMissingError(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const e = err as { code?: string; message?: string };
  if (e.code === "PGRST205" || e.code === "42P01") return true;
  const msg = e.message?.toLowerCase() ?? "";
  return (
    msg.includes("does not exist") ||
    msg.includes("could not find the table") ||
    msg.includes("schema cache")
  );
}

export type SchemaStatus =
  | { ready: true }
  | { ready: false; error: string };

export async function schemaStatus(): Promise<SchemaStatus> {
  try {
    const { db } = await import("@/lib/db");
    const sb = db();
    const { error } = await sb.from("workspaces").select("id").limit(1);
    if (error) {
      if (isSchemaMissingError(error)) {
        return { ready: false, error: "Schema not applied yet." };
      }
      return { ready: false, error: error.message };
    }
    return { ready: true };
  } catch (e) {
    return {
      ready: false,
      error: e instanceof Error ? e.message : "Unknown Supabase error.",
    };
  }
}
