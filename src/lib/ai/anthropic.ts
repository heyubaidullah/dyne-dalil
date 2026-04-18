import Anthropic from "@anthropic-ai/sdk";
import { requireEnv } from "@/lib/env";

let cached: Anthropic | null = null;

/**
 * Lazy-initialized Anthropic client. Throws a helpful error only when actually
 * called, so non-AI paths (e.g. marketing pages, build) don't require the key.
 */
export function getAnthropic(): Anthropic {
  if (!cached) {
    cached = new Anthropic({ apiKey: requireEnv("ANTHROPIC_API_KEY") });
  }
  return cached;
}

export const EXTRACTION_MODEL = "claude-sonnet-4-6";
