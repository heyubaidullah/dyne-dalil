import { getGemini, EMBEDDING_MODEL, EMBEDDING_DIMENSIONS } from "./gemini";

/**
 * Generate an embedding vector for a single piece of text.
 * Uses Gemini `text-embedding-004` (768 dims) — matches the vector column
 * size on signal_analyses / decisions after the 768-dim migration.
 */
export async function embedText(text: string): Promise<number[]> {
  const trimmed = text.trim();
  if (!trimmed) {
    throw new Error("embedText called with empty text");
  }

  const client = getGemini();
  const res = await client.models.embedContent({
    model: EMBEDDING_MODEL,
    contents: [trimmed],
  });

  const vec = res.embeddings?.[0]?.values;
  if (!vec || vec.length !== EMBEDDING_DIMENSIONS) {
    throw new Error(
      `Unexpected embedding shape from Gemini: got ${vec?.length ?? 0} dims, expected ${EMBEDDING_DIMENSIONS}`,
    );
  }

  return vec;
}

/**
 * Build the best text representation of a confirmed memory for embedding.
 * We concatenate the confirmed summary with pain points and quotes to give
 * recall a stable signal regardless of which axis a future query hits.
 */
export function buildMemoryEmbeddingText(fields: {
  confirmed_summary: string | null;
  pain_points?: string[] | null;
  objections?: string[] | null;
  quotes?: string[] | null;
}): string {
  const parts = [
    fields.confirmed_summary?.trim(),
    fields.pain_points?.length ? `Pain: ${fields.pain_points.join("; ")}` : "",
    fields.objections?.length
      ? `Objections: ${fields.objections.join("; ")}`
      : "",
    fields.quotes?.length ? `Quotes: ${fields.quotes.join(" / ")}` : "",
  ].filter(Boolean);
  return parts.join("\n");
}
