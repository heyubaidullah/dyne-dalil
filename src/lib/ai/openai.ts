import OpenAI from "openai";
import { requireEnv } from "@/lib/env";

let cached: OpenAI | null = null;

/**
 * Lazy OpenAI client used for embeddings (text-embedding-3-small).
 * Extraction / rollups run on Claude; this client exists only for the vector pipeline.
 */
export function getOpenAI(): OpenAI {
  if (!cached) {
    cached = new OpenAI({ apiKey: requireEnv("OPENAI_API_KEY") });
  }
  return cached;
}

export const EMBEDDING_MODEL = "text-embedding-3-small";
export const EMBEDDING_DIMENSIONS = 1536;
