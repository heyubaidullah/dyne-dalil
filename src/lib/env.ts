import { z } from "zod";

/**
 * Centralized env. Values are lazily validated on first access so `next build`
 * doesn't fail before `.env.local` is populated. Missing values throw a clear,
 * traceable error at the call site that actually needs them.
 */

const schema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1).optional(),
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  ANTHROPIC_API_KEY: z.string().min(1).optional(),
  OPENAI_API_KEY: z.string().min(1).optional(),
  GEMINI_API_KEY: z.string().min(1).optional(),
});

type EnvShape = z.infer<typeof schema>;

const parsed = schema.safeParse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
});

const raw: EnvShape = parsed.success ? parsed.data : {};

const REQUIRED_FOR_RUNTIME: Array<keyof EnvShape> = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
];

export const env = new Proxy(raw, {
  get(target, prop: string) {
    const value = target[prop as keyof EnvShape];
    if (
      value == null &&
      REQUIRED_FOR_RUNTIME.includes(prop as keyof EnvShape)
    ) {
      throw new Error(
        `Missing env var: ${prop}. Add it to .env.local — see .env.example for the full list.`,
      );
    }
    return value as string;
  },
}) as Required<EnvShape>;

export function requireEnv(key: keyof EnvShape): string {
  const value = raw[key];
  if (!value) {
    throw new Error(
      `Missing env var: ${key}. Add it to .env.local — see .env.example.`,
    );
  }
  return value;
}
