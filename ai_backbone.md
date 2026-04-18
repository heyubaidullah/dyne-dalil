# Dalil AI Backbone

This document maps the current AI prompting and workspace intelligence backbone in this repository.

It focuses on:
- all files that call or orchestrate LLM providers,
- all files involved in embeddings and rollups,
- the Supabase files/tables those flows rely on,
- the Stage-Zero and workspace APIs implemented in this session.

## 1) End-to-end architecture

### Stage-Zero idea validation flow
1. Homepage entry opens the large Stage-Zero dialog.
2. Dialog sends transcript messages to a streaming chat route.
3. Streaming chat route delegates provider calls to the shared AI wrapper.
4. User saves idea.
5. Save action calls structured extraction route.
6. Extraction route uses shared AI wrapper + Zod schema and returns validated payload.
7. Frontend inserts extracted idea fields into Supabase `ideas`.

### Workspace memory and decision intelligence flow
1. Canonical memory confirmation route upserts `signal_analyses`.
2. Decision route inserts `decisions`.
3. Both routes schedule non-blocking embedding generation.
4. Embedding pipeline writes vectors back to Postgres `vector` columns.
5. Rollup route fetches canonical memories for a workspace.
6. Rollup route prompts the LLM through the wrapper with strict Zod output.
7. Rollup response returns structured market intelligence for dashboard usage.

## 2) Prompting/provider core (single integration backbone)

### `src/lib/ai/wrapper.ts`
Primary AI integration layer.

Responsibilities:
- Provider abstraction: `gemini`, `openai`, `claude`, `local`.
- Structured extraction API: `generateStructuredOutput(...)` with Zod validation.
- Streaming text API: `streamTextOutput(...)` used by Stage-Zero chat.
- Embedding API: `generateEmbedding(...)` used by workspace embedding pipeline.
- Error normalization through `AIWrapperError` and `AIErrorCode`.
- Provider-specific HTTP calls are centralized here.

Important exported surfaces:
- `generateStructuredOutput`
- `streamTextOutput`
- `generateEmbedding`
- `AIWrapperError`

## 3) API routes that prompt LLM providers

### `src/app/api/stage-zero-chat/route.ts`
Streaming Stage-Zero conversation route.

Responsibilities:
- Validates incoming chat transcript payload.
- Applies Stage-Zero assistant system prompt.
- Calls `streamTextOutput(...)` from `src/lib/ai/wrapper.ts`.
- Streams assistant tokens back to frontend.

### `src/app/api/idea-extract/route.ts`
Structured extraction for finalized Stage-Zero transcript.

Responsibilities:
- Accepts chat transcript array.
- Enforces extraction schema:
  - `chat_transcript_summary`
  - `approved_idea`
  - `audience`
  - `problem_statement`
  - `convert_to_workspace_flag`
- Calls `generateStructuredOutput(...)` from wrapper.
- Returns validated payload to frontend for database insert.

### `src/app/api/extract/route.ts`
Existing transcript extraction route (customer-signal extraction).

Responsibilities:
- Uses `generateStructuredOutput(...)` for structured signal analysis.
- Uses route-level Zod schema for required output shape.

### `src/app/api/workspace/[id]/rollup/route.ts`
Workspace rollup generation route.

Responsibilities:
- Loads workspace signal IDs and confirmed canonical memories.
- Aggregates memory payload.
- Prompts LLM via `generateStructuredOutput(...)`.
- Enforces strict rollup schema:
  - `recurring_themes`
  - `strongest_objections`
  - `most_likely_segment`
  - `contradictions`
  - `suggested_next_tests`

## 4) Embeddings pipeline (Stage 3)

### `src/lib/ai/embedding-pipeline.ts`
Non-blocking embedding worker utilities.

Responsibilities:
- `generateSignalAnalysisEmbedding(...)`
  - Builds embedding text from canonical memory fields.
  - Calls wrapper `generateEmbedding(...)`.
  - Updates `signal_analyses.embedding`.
- `generateDecisionEmbedding(...)`
  - Builds embedding text from decision fields.
  - Calls wrapper `generateEmbedding(...)`.
  - Updates `decisions.embedding`.

Uses service-role Supabase client to ensure backend write capability.

### `src/app/api/workspace/[id]/signal-analyses/confirm/route.ts`
Canonical memory confirmation route.

Responsibilities:
- Validates payload.
- Verifies signal belongs to workspace.
- Upserts canonical `signal_analyses` record with `confirmed_at`.
- Schedules embedding generation asynchronously using `after(...)`.

### `src/app/api/workspace/[id]/decisions/route.ts`
Decision logging route.

Responsibilities:
- Validates payload.
- Verifies workspace exists.
- Inserts decision.
- Schedules embedding generation asynchronously using `after(...)`.

## 5) Frontend files that trigger prompting flows

### `src/components/home/hero-chat.tsx`
Homepage entry bar with required prompt text: "What do you want to do today?".

Responsibilities:
- Opens dedicated large modal chat UI (not inline homepage chat).
- Seeds initial prompt text into dialog flow.

### `src/components/home/stage-zero-chat-dialog.tsx`
Primary Stage-Zero chat UI.

Responsibilities:
- Streams responses from `/api/stage-zero-chat`.
- Maintains transcript state.
- Calls `/api/idea-extract` when user saves.
- Inserts extracted idea fields into Supabase `ideas`.
- Routes user toward idea vault/workspace creation based on extraction output.

## 6) Supabase integration files

### `src/lib/supabase/client.ts`
Browser Supabase client using anon key.

Used by frontend (for example, Stage-Zero save-to-ideas insert).

### `src/lib/supabase/server.ts`
Server-side Supabase clients.

Exports:
- `createClient()` for cookie/session-scoped server operations.
- `createServiceClient()` for service-role backend operations (used by embedding pipeline).

### `src/lib/supabase/types.ts`
TypeScript schema for Supabase tables/functions.

Relevant typed entities:
- `signals`
- `signal_analyses` (includes `embedding`, `confirmed_summary`, `confirmed_at`)
- `decisions` (includes `embedding`)
- `ideas`
- RPCs: `match_signal_analyses`, `match_decisions`

## 7) Environment and provider support files

### `src/lib/env.ts`
Central env access and guardrails.

Tracks keys required by AI/Supabase layers:
- `OPENAI_API_KEY`
- `ANTHROPIC_API_KEY`
- `GEMINI_API_KEY`
- Supabase URL/keys

### `src/lib/ai/openai.ts`
Legacy OpenAI SDK helper currently oriented to embeddings context.

Note:
- HTTP provider prompting path is now centralized in `src/lib/ai/wrapper.ts`.

### `src/lib/ai/anthropic.ts`
Anthropic SDK helper.

Note:
- Structured prompting in routes currently runs via wrapper abstractions.

## 8) Database schema and migration files

### `supabase/migrations/0001_init.sql`
Base schema and pgvector setup.

Defines:
- `signal_analyses.embedding vector(1536)`
- `decisions.embedding vector(1536)`
- semantic match functions (`match_signal_analyses`, `match_decisions`)
- `ideas` table and RLS policies

### `supabase/migrations/0002_stage_zero_ideas.sql`
Adds Stage-Zero-specific idea fields:
- `chat_transcript_summary`
- `convert_to_workspace_flag`

## 9) Workspace dashboard status

### `src/app/w/[id]/page.tsx`
Current dashboard UI still shows static rollup cards.

New backend capability now exists at:
- `GET /api/workspace/[id]/rollup`

To complete dynamic dashboard rollups, this page should fetch that route and render returned schema fields.

## 10) Current contract summary

### Stage-Zero streaming chat
- Route: `POST /api/stage-zero-chat`
- Input: `messages[]` with `{ role, content }`
- Output: streamed plain text

### Stage-Zero extraction
- Route: `POST /api/idea-extract`
- Input: `transcript[]`
- Output: validated extraction object

### Confirm canonical memory + queue embedding
- Route: `POST /api/workspace/[id]/signal-analyses/confirm`
- Output includes `embedding_status: "queued"`

### Create decision + queue embedding
- Route: `POST /api/workspace/[id]/decisions`
- Output includes `embedding_status: "queued"`

### Workspace rollup
- Route: `GET /api/workspace/[id]/rollup`
- Output: strict rollup schema object

## 11) Design intent

- Keep provider HTTP calls centralized in `src/lib/ai/wrapper.ts`.
- Keep route handlers focused on orchestration, auth/data checks, and schema validation.
- Keep embedding generation asynchronous so primary write UX is fast.
- Keep Supabase access centralized in `src/lib/supabase/*`.
- Keep all structured LLM output guarded by Zod before storage/rendering.
