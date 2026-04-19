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
  STRIPE_SECRET_KEY: z.string().min(1).optional(),
  STRIPE_PRICE_ID: z.string().min(1).optional(),
  STRIPE_WEBHOOK_SECRET: z.string().min(1).optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  OPENAI_API_KEY: z.string().min(1).optional(),
  ANTHROPIC_API_KEY: z.string().min(1).optional(),
  GEMINI_API_KEY: z.string().min(1).optional(),
});

type EnvShape = z.infer<typeof schema>;

/**
 * Treat empty strings in .env as unset — otherwise a bare `GEMINI_API_KEY=`
 * would trip a `.min(1)` check and cascade the whole parse into a "missing"
 * state for every other var.
 */
const emptyToUndefined = (v: string | undefined) =>
  v !== undefined && v.trim().length === 0 ? undefined : v;

const rawInput: EnvShape = {
  NEXT_PUBLIC_SUPABASE_URL: emptyToUndefined(process.env.NEXT_PUBLIC_SUPABASE_URL),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: emptyToUndefined(
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  ),
  NEXT_PUBLIC_APP_URL: emptyToUndefined(process.env.NEXT_PUBLIC_APP_URL),
  STRIPE_SECRET_KEY: emptyToUndefined(process.env.STRIPE_SECRET_KEY),
  STRIPE_PRICE_ID: emptyToUndefined(process.env.STRIPE_PRICE_ID),
  STRIPE_WEBHOOK_SECRET: emptyToUndefined(process.env.STRIPE_WEBHOOK_SECRET),
  SUPABASE_SERVICE_ROLE_KEY: emptyToUndefined(process.env.SUPABASE_SERVICE_ROLE_KEY),
  OPENAI_API_KEY: emptyToUndefined(process.env.OPENAI_API_KEY),
  ANTHROPIC_API_KEY: emptyToUndefined(process.env.ANTHROPIC_API_KEY),
  GEMINI_API_KEY: emptyToUndefined(process.env.GEMINI_API_KEY),
};

const parsed = schema.safeParse(rawInput);

// On a schema failure for an optional key, fall back to the rawInput so one
// malformed value doesn't knock the rest offline. Required-at-runtime keys
// are still enforced by the Proxy below.
const raw: EnvShape = parsed.success ? parsed.data : rawInput;

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
        `Missing env var: ${prop}. Add it to .env (or .env.local) — see .env.example for the full list.`,
      );
    }
    return value as string;
  },
}) as Required<EnvShape>;

export function requireEnv(key: keyof EnvShape): string {
  const value = raw[key];
  if (!value) {
    throw new Error(
      `Missing env var: ${key}. Add it to .env (or .env.local) — see .env.example.`,
    );
  }
  return value;
}
