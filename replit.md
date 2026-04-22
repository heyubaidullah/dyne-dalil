# Dalil — Replit Setup

## Overview
Next.js 16 app (React 19, TypeScript, Tailwind v4) migrated from Vercel.
Uses Supabase for auth/database, Stripe for payments, and multiple AI providers (Gemini, OpenAI, Anthropic).

## Running the App
The "Start application" workflow runs `npm run dev` on port 5000.

## Key Configuration

### Port
Dev and start scripts use `-p 5000 -H 0.0.0.0` (required for Replit's preview pane).

### Environment Variables
Secrets are stored in Replit Secrets and mirrored to `.env.local` at the project root so Next.js edge middleware can read `NEXT_PUBLIC_*` variables.

Required secrets:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `GEMINI_API_KEY`
- `OPENAI_API_KEY`
- `ANTHROPIC_API_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_PRICE_ID`
- `STRIPE_WEBHOOK_SECRET`

If secrets are updated in Replit, re-run the shell command that writes `.env.local` and restart the workflow.

### next.config.ts
`allowedDevOrigins` is set dynamically from `REPLIT_DEV_DOMAIN` so Replit's preview iframe can access hot-reload resources.

## Project Structure
- `src/app/` — Next.js App Router pages and API routes
- `src/components/` — Shared UI components
- `src/lib/` — Utilities, Supabase client, env validation
- `src/middleware.ts` — Supabase session refresh middleware
- `supabase/` — Supabase migrations/config
- `scripts/` — One-off scripts
