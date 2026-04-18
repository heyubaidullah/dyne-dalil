import { GoogleGenAI } from "@google/genai";
import { requireEnv } from "@/lib/env";

/**
 * Lazy Gemini client. Using the Gemini API (not Vertex) so the apiKey is
 * the only credential we need.
 */
let cached: GoogleGenAI | null = null;

export function getGemini(): GoogleGenAI {
  if (!cached) {
    cached = new GoogleGenAI({ apiKey: requireEnv("GEMINI_API_KEY") });
  }
  return cached;
}

export const EXTRACTION_MODEL = "gemini-2.5-flash";
export const ROLLUP_MODEL = "gemini-2.5-flash";
export const EMBEDDING_MODEL = "text-embedding-004";
export const EMBEDDING_DIMENSIONS = 768;
