-- Dalil · FROM-SCRATCH reset + schema + seed (paste into Supabase SQL Editor)
-- WARNING: drops the entire `public` schema and rebuilds it.
-- Order: 1) drop/recreate schema -> 2) migration -> 3) stage-zero add-on -> 4) seed.

drop schema if exists public cascade;
create schema public;
grant usage on schema public to anon, authenticated, service_role;

-- Dalil · initial schema (demo-mode policies)
-- Apply with: supabase db push
--
-- DEMO MODE: RLS is enabled with permissive policies so the anon role can
-- read/write. Tighten these when auth is added.

create extension if not exists "pgcrypto";
create extension if not exists "vector";

-- ---------- Workspaces ----------
create table if not exists workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  owner uuid,
  created_at timestamptz not null default now()
);

create index if not exists workspaces_owner_idx on workspaces(owner);
create index if not exists workspaces_created_idx on workspaces(created_at desc);

-- ---------- Signals (raw customer input) ----------
create table if not exists signals (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  title text,
  source_type text,
  raw_text text not null,
  created_at timestamptz not null default now()
);

create index if not exists signals_workspace_idx on signals(workspace_id, created_at desc);

-- ---------- Signal analyses ----------
create table if not exists signal_analyses (
  id uuid primary key default gen_random_uuid(),
  signal_id uuid not null unique references signals(id) on delete cascade,
  ai_summary text,
  founder_notes text,
  confirmed_summary text,
  pain_points text[],
  objections text[],
  requests text[],
  urgency text,
  likely_segment text,
  quotes text[],
  confidence text,
  embedding vector(1536),
  created_at timestamptz not null default now(),
  confirmed_at timestamptz
);

create index if not exists signal_analyses_embedding_idx
  on signal_analyses
  using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);

-- ---------- Decisions ----------
create table if not exists decisions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references workspaces(id) on delete cascade,
  title text not null,
  category text,
  rationale text,
  expected_outcome text,
  embedding vector(1536),
  created_at timestamptz not null default now()
);

create index if not exists decisions_workspace_idx on decisions(workspace_id, created_at desc);
create index if not exists decisions_embedding_idx
  on decisions
  using ivfflat (embedding vector_cosine_ops)
  with (lists = 50);

-- ---------- Decision evidence ----------
create table if not exists decision_evidence (
  decision_id uuid not null references decisions(id) on delete cascade,
  signal_id uuid not null references signals(id) on delete cascade,
  snippet text,
  primary key (decision_id, signal_id)
);

-- ---------- Outcomes ----------
do $$ begin
  create type outcome_status as enum ('improved', 'failed', 'inconclusive', 'pending');
exception
  when duplicate_object then null;
end $$;

create table if not exists outcomes (
  id uuid primary key default gen_random_uuid(),
  decision_id uuid not null references decisions(id) on delete cascade,
  status outcome_status not null default 'pending',
  notes text,
  updated_at timestamptz not null default now()
);

create index if not exists outcomes_decision_idx on outcomes(decision_id);

-- ---------- Ideas (stage-zero chat) ----------
create table if not exists ideas (
  id uuid primary key default gen_random_uuid(),
  owner uuid,
  transcript_summary text,
  approved_idea text,
  audience text,
  problem_statement text,
  converted_workspace_id uuid references workspaces(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists ideas_owner_idx on ideas(owner);

-- ---------- Semantic recall RPCs ----------
create or replace function match_signal_analyses(
  query_embedding vector(1536),
  workspace_filter uuid,
  match_count int default 5
)
returns table (
  id uuid,
  signal_id uuid,
  confirmed_summary text,
  similarity float
)
language sql stable as $$
  select
    sa.id,
    sa.signal_id,
    sa.confirmed_summary,
    1 - (sa.embedding <=> query_embedding) as similarity
  from signal_analyses sa
  join signals s on s.id = sa.signal_id
  where s.workspace_id = workspace_filter
    and sa.embedding is not null
    and sa.confirmed_at is not null
  order by sa.embedding <=> query_embedding
  limit match_count;
$$;

create or replace function match_decisions(
  query_embedding vector(1536),
  workspace_filter uuid,
  match_count int default 5
)
returns table (
  id uuid,
  title text,
  rationale text,
  similarity float
)
language sql stable as $$
  select
    d.id,
    d.title,
    d.rationale,
    1 - (d.embedding <=> query_embedding) as similarity
  from decisions d
  where d.workspace_id = workspace_filter
    and d.embedding is not null
  order by d.embedding <=> query_embedding
  limit match_count;
$$;

-- ---------- Row-level security (DEMO MODE: permissive) ----------
alter table workspaces enable row level security;
alter table signals enable row level security;
alter table signal_analyses enable row level security;
alter table decisions enable row level security;
alter table decision_evidence enable row level security;
alter table outcomes enable row level security;
alter table ideas enable row level security;

do $$ declare
  tbl text;
begin
  foreach tbl in array array[
    'workspaces','signals','signal_analyses','decisions',
    'decision_evidence','outcomes','ideas'
  ] loop
    execute format(
      'drop policy if exists %I on %I',
      tbl || '_demo_all',
      tbl
    );
    execute format(
      'create policy %I on %I for all to anon, authenticated using (true) with check (true)',
      tbl || '_demo_all',
      tbl
    );
  end loop;
end $$;

-- ---------- Grants ----------
grant usage on schema public to anon, authenticated, service_role;
grant all on all tables in schema public to anon, authenticated, service_role;
grant all on all sequences in schema public to anon, authenticated, service_role;
grant execute on all functions in schema public to anon, authenticated, service_role;

-- Stage-Zero idea fields
-- Adds the fields Dalil Start writes after the /api/idea-extract call.

alter table ideas
  add column if not exists chat_transcript_summary text,
  add column if not exists convert_to_workspace_flag boolean default false;

-- Backfill legacy rows that used `transcript_summary` before this migration.
update ideas
set chat_transcript_summary = transcript_summary
where chat_transcript_summary is null
  and transcript_summary is not null;

-- Dalil · demo seed
-- Five workspaces, each a well-known product's documented 0→1 GTM moment.
-- Signals are plausible personas grounded in public record (not verbatim quotes
-- from named real individuals). Decisions and outcomes reference the actual
-- choices those companies made and the publicly-known results.
-- Idempotent: re-running this file will not duplicate rows.

begin;

-- ============================================================
-- Workspaces
-- ============================================================

insert into workspaces (id, name, description) values
  ('6f2b4a18-9c3d-41e7-8fa5-b7d2e0c94812',
   'Notion · the 2017 rebuild',
   'Near-death repositioning from a block-editor notes app into an "all-in-one workspace." Captures the conversations that drove the V1→V2 rewrite and the new ICP.'),
  ('1a5c8e72-4d9f-4063-aab1-3e7fc0d28954',
   'Superhuman · PMF engine',
   'Rahul Vohra''s 40%-very-disappointed methodology applied to keyboard-first email. Tracks survey cohorts, ICP tightening, and pricing experiments.'),
  ('3d8f1c45-7b92-4e05-9cd6-8a1e4f5067b3',
   'Linear · dev-first positioning',
   'Early-2020 GTM: position against Jira/Asana, target engineers as the buyer (not PMs), ship offline-first client, price at $8/seat.'),
  ('e4a2b9c1-6f87-4d30-b5ea-9c76f1e04523',
   'Stripe · 7-lines-of-JS launch',
   'Collison brothers''  early GTM: developer-first positioning, flat transparent pricing, skipping the CFO sale in favor of the engineer integrating the API.'),
  ('5c7d0e93-8a14-46f2-bb3e-4f9a2c1e8706',
   'Figma · cloud multiplayer bet',
   'Dylan Field''s contrarian 2016 bet on browser-based design with real-time multiplayer as a core differentiator, not a feature.')
on conflict (id) do update
  set name = excluded.name,
      description = excluded.description;

-- ============================================================
-- 1) Notion · the 2017 rebuild
-- ============================================================

insert into signals (id, workspace_id, title, source_type, raw_text, created_at) values
  ('6f2b0001-9c3d-41e7-8fa5-b7d2e0c94812',
   '6f2b4a18-9c3d-41e7-8fa5-b7d2e0c94812',
   'Interview with a product lead at an early-adopter SaaS',
   'interview',
   'Power user at a 40-person SaaS. "Your block editor is clever but it crashes on any doc over a page. I came from Evernote, I came from Quip, I want this to be the last notes app — but if it keeps breaking I am going back to Google Docs. Also: please stop calling yourselves a notes app. You are either trying to be a workspace or you are not."',
   now() - interval '16 days'),
  ('6f2b0002-9c3d-41e7-8fa5-b7d2e0c94812',
   '6f2b4a18-9c3d-41e7-8fa5-b7d2e0c94812',
   'Digest of r/productivity threads on Notion V1 (June 2016)',
   'notes',
   'Aggregated 6 threads, 400+ comments: positive: block model "feels right", beautiful typography, cross-linking. Negative: unreliable under load, no mobile parity, positioning confusion ("is this Evernote 2 or Quip 2?"), pricing ambiguity. Recurring ask: databases as first-class primitives, not just rich text.',
   now() - interval '15 days'),
  ('6f2b0003-9c3d-41e7-8fa5-b7d2e0c94812',
   '6f2b4a18-9c3d-41e7-8fa5-b7d2e0c94812',
   'Call with an engineering lead at a Y Combinator startup',
   'call',
   'YC-backed founder, 12-person team. "We use Dropbox Paper for docs, Trello for tasks, Airtable for databases, Slack for ops. If you gave me one tool that replaced three of those and didn''t force me to pick a primitive (doc vs table vs board), I would pay per seat. But right now you are just Dropbox Paper with fancier blocks."',
   now() - interval '13 days'),
  ('6f2b0004-9c3d-41e7-8fa5-b7d2e0c94812',
   '6f2b4a18-9c3d-41e7-8fa5-b7d2e0c94812',
   'Advisor call with a former Evernote PM',
   'call',
   'Ex-Evernote PM: "The mistake Evernote made was trying to be everything at the end. The mistake you are making is trying to be a lighter Evernote at the beginning. Pick a wedge — databases-as-documents is yours, nobody else is shipping that — and make your marketing say it out loud. You are shipping the right product but describing it wrong."',
   now() - interval '11 days'),
  ('6f2b0005-9c3d-41e7-8fa5-b7d2e0c94812',
   '6f2b4a18-9c3d-41e7-8fa5-b7d2e0c94812',
   'Private beta cohort feedback (n=120)',
   'notes',
   'Post-rebuild private beta: 86% said the new databases-as-pages primitive clicked immediately; 71% described the product as a "workspace" unprompted (vs. 14% who said "notes app"). 9% churn risk flagged around mobile parity. Strongest-pain quote: "this is what I thought Evernote was supposed to be."',
   now() - interval '4 days')
on conflict (id) do nothing;

insert into signal_analyses
  (signal_id, ai_summary, confirmed_summary, pain_points, objections, requests,
   urgency, likely_segment, quotes, confidence, confirmed_at)
values
  ('6f2b0001-9c3d-41e7-8fa5-b7d2e0c94812',
   'Power user loves the block editor but churn-risk on reliability and positioning.',
   'Block editor clicks but V1 crashes on long docs. User frames Notion as a workspace, not a notes app, and wants the marketing to stop calling it the latter. Reliability is the hard blocker; positioning is the soft one.',
   array['Editor crashes on long docs','"Notes app" framing confuses power users'],
   array['Reliability is worse than Google Docs','Positioning as a notes app caps the ceiling'],
   array['Fix the editor under load','Reposition as a workspace, not a notes app'],
   'high', 'SaaS product lead (40–200 person company)',
   array['If it keeps breaking I am going back to Google Docs.','Stop calling yourselves a notes app.'],
   'high', now() - interval '16 days'),
  ('6f2b0002-9c3d-41e7-8fa5-b7d2e0c94812',
   'Community digest: block model loved, reliability and positioning hated, databases wanted.',
   'Public sentiment summary: the block model and typography are the top-praised features; reliability under load and positioning ambiguity are the top-hated. Databases-as-first-class is the dominant request.',
   array['Unreliable under load','Positioning ambiguity','Mobile parity lag'],
   array['"Is this Evernote 2 or Quip 2?"'],
   array['Databases as first-class primitives','Clearer positioning','Mobile parity'],
   'high', 'Early-adopter productivity crowd',
   array['Block model feels right.','Is this Evernote 2 or Quip 2?'],
   'high', now() - interval '15 days'),
  ('6f2b0003-9c3d-41e7-8fa5-b7d2e0c94812',
   'YC founder describes a multi-tool stack Notion could collapse.',
   'Prospect is ready to replace 3+ tools (Dropbox Paper + Trello + Airtable) with Notion if Notion stops forcing a primitive (doc vs. table vs. board) and leans into mixed-mode pages.',
   array['Tool sprawl across ops','Primitive lock-in forces context switching'],
   array['Currently "just Dropbox Paper with fancier blocks"'],
   array['Mixed-mode pages (doc + db + board)','Per-seat pricing model'],
   'high', 'Early-stage startup founder',
   array['One tool that replaces three and doesn''t force me to pick a primitive.'],
   'high', now() - interval '13 days'),
  ('6f2b0004-9c3d-41e7-8fa5-b7d2e0c94812',
   'Ex-Evernote PM advisor: the wedge is already shipped, marketing is wrong.',
   'Advisor confirms Notion has a real wedge in databases-as-documents but is under-selling it. Not a product problem — a messaging and positioning problem.',
   array['Wedge exists but marketing undersells it'],
   array['Positioning as "lighter Evernote" is a ceiling'],
   array['Make "databases-as-documents" the public positioning','Audit homepage and onboarding copy'],
   'medium', 'Advisor / ex-Evernote',
   array['You are shipping the right product but describing it wrong.'],
   'high', now() - interval '11 days'),
  ('6f2b0005-9c3d-41e7-8fa5-b7d2e0c94812',
   'Private beta (n=120) confirms the new framing lands and databases-as-pages clicks.',
   '86% immediate comprehension of databases-as-pages; 71% of users volunteered the word "workspace" before seeing it in marketing. Residual churn risk around mobile parity.',
   array['Mobile parity still a gap'],
   array['Need a credible mobile story to avoid power-user churn'],
   array['Ship a credible mobile client','Use the word "workspace" in homepage and pricing'],
   'high', 'Private beta (mixed roles)',
   array['This is what I thought Evernote was supposed to be.','86% said the new databases-as-pages primitive clicked immediately.'],
   'high', now() - interval '4 days')
on conflict (signal_id) do nothing;

insert into decisions (id, workspace_id, title, category, rationale, expected_outcome, created_at) values
  ('6f2bd001-9c3d-41e7-8fa5-b7d2e0c94812',
   '6f2b4a18-9c3d-41e7-8fa5-b7d2e0c94812',
   'Rebuild V2 from scratch around a single block-and-database primitive',
   'Product',
   'Five independent signals converge on the same root cause: V1''s primitive model forces users to pick doc-vs-table and breaks at scale. Every other issue (reliability, positioning, multi-tool replacement) downstream of this. Rewrite is terminal-debt fix, not a feature.',
   'One engine; ship a workspace instead of a notes app. Private beta reception confirms the direction.',
   now() - interval '14 days'),
  ('6f2bd002-9c3d-41e7-8fa5-b7d2e0c94812',
   '6f2b4a18-9c3d-41e7-8fa5-b7d2e0c94812',
   'Reposition the homepage from "notes app" to "all-in-one workspace"',
   'Positioning',
   'Four of five memories explicitly flag the "notes app" framing as a ceiling. Private beta users spontaneously use the word "workspace". Cost is low (copy + hero); blast radius is large (SEO, pricing, sales).',
   'Word-of-mouth and press descriptions shift from "Evernote alternative" to "all-in-one workspace".',
   now() - interval '10 days'),
  ('6f2bd003-9c3d-41e7-8fa5-b7d2e0c94812',
   '6f2b4a18-9c3d-41e7-8fa5-b7d2e0c94812',
   'Defer mobile parity to Q4; ship desktop-first V2',
   'Roadmap',
   'Power-user cohort churns on desktop reliability, not mobile. Shipping a half-working mobile app in parallel risks splitting engineering focus during the rewrite. Accept a known churn risk in exchange for a sharper V2.',
   'Desktop V2 lands on time; mobile follows one quarter later with a credible story.',
   now() - interval '8 days')
on conflict (id) do nothing;

insert into decision_evidence (decision_id, signal_id, snippet) values
  ('6f2bd001-9c3d-41e7-8fa5-b7d2e0c94812','6f2b0001-9c3d-41e7-8fa5-b7d2e0c94812','Block editor is clever but it crashes on any doc over a page.'),
  ('6f2bd001-9c3d-41e7-8fa5-b7d2e0c94812','6f2b0003-9c3d-41e7-8fa5-b7d2e0c94812','One tool that replaces three and doesn''t force me to pick a primitive.'),
  ('6f2bd001-9c3d-41e7-8fa5-b7d2e0c94812','6f2b0005-9c3d-41e7-8fa5-b7d2e0c94812','86% said the new databases-as-pages primitive clicked immediately.'),
  ('6f2bd002-9c3d-41e7-8fa5-b7d2e0c94812','6f2b0001-9c3d-41e7-8fa5-b7d2e0c94812','Stop calling yourselves a notes app.'),
  ('6f2bd002-9c3d-41e7-8fa5-b7d2e0c94812','6f2b0004-9c3d-41e7-8fa5-b7d2e0c94812','You are shipping the right product but describing it wrong.'),
  ('6f2bd002-9c3d-41e7-8fa5-b7d2e0c94812','6f2b0005-9c3d-41e7-8fa5-b7d2e0c94812','71% of users volunteered the word "workspace" before seeing it in marketing.'),
  ('6f2bd003-9c3d-41e7-8fa5-b7d2e0c94812','6f2b0002-9c3d-41e7-8fa5-b7d2e0c94812','Mobile parity lag flagged but desktop reliability is the larger issue.')
on conflict (decision_id, signal_id) do nothing;

insert into outcomes (id, decision_id, status, notes, updated_at) values
  ('6f2b0a01-9c3d-41e7-8fa5-b7d2e0c94812',
   '6f2bd001-9c3d-41e7-8fa5-b7d2e0c94812',
   'improved',
   'V2 rewrite shipped March 2018. Product Hunt #1 Product of the Day. Crash rate on docs >10 pages dropped from 18% to 0.4%. Retention among private-beta cohort held above 70% at 90 days.',
   now() - interval '2 days'),
  ('6f2b0a02-9c3d-41e7-8fa5-b7d2e0c94812',
   '6f2bd002-9c3d-41e7-8fa5-b7d2e0c94812',
   'improved',
   'Post-rebrand press coverage shifted: TechCrunch and The Verge both led with "all-in-one workspace" (previously "Evernote alternative"). Branded search for "notion workspace" overtook "notion notes" within 8 weeks.',
   now() - interval '3 days'),
  ('6f2b0a03-9c3d-41e7-8fa5-b7d2e0c94812',
   '6f2bd003-9c3d-41e7-8fa5-b7d2e0c94812',
   'pending',
   'Desktop V2 landed on schedule. Mobile parity is tracking for next quarter; reviewing cohort churn data to size the delay cost.',
   now() - interval '4 days')
on conflict (id) do nothing;

-- ============================================================
-- 2) Superhuman · PMF engine
-- ============================================================

insert into signals (id, workspace_id, title, source_type, raw_text, created_at) values
  ('1a5c0001-4d9f-4063-aab1-3e7fc0d28954',
   '1a5c8e72-4d9f-4063-aab1-3e7fc0d28954',
   '"How disappointed would you be?" survey (n=152)',
   'notes',
   'First Sean Ellis-style survey round. 22% answered "very disappointed" if Superhuman disappeared tomorrow — below the 40% PMF threshold. Breakdown: founders/VCs/execs skew 41%, salespeople skew 28%, students skew 4%. Clear ICP signal by role, not by company size.',
   now() - interval '21 days'),
  ('1a5c0002-4d9f-4063-aab1-3e7fc0d28954',
   '1a5c8e72-4d9f-4063-aab1-3e7fc0d28954',
   'Interview cluster: "somewhat disappointed" users (n=9)',
   'interview',
   'Nine 30-minute calls with "somewhat disappointed" users to understand what blocks them from "very disappointed". Top blockers: mobile client (7/9), search speed on long threads (5/9), missing calendar integration (4/9). None mentioned pricing as an issue.',
   now() - interval '18 days'),
  ('1a5c0003-4d9f-4063-aab1-3e7fc0d28954',
   '1a5c8e72-4d9f-4063-aab1-3e7fc0d28954',
   'VIP-cohort feedback from a Series B-stage founder',
   'call',
   'Series B founder, hundreds of emails per day. "The keyboard-first flow is the single thing that has given me back an hour a day. If you ever slow down or try to be ''everyone''s email'' I will know, and I will leave. Don''t lose what makes you weird." Offered to refer two other founders.',
   now() - interval '12 days'),
  ('1a5c0004-4d9f-4063-aab1-3e7fc0d28954',
   '1a5c8e72-4d9f-4063-aab1-3e7fc0d28954',
   'Customer success call with a user at a large tech company',
   'call',
   'Senior IC at a 5000-person company. Wants shared-inbox and delegation features "like Front has". Acknowledged this is outside the keyboard-first founder ICP but worth considering for expansion. Low-urgency ask; would not churn if unmet.',
   now() - interval '10 days'),
  ('1a5c0005-4d9f-4063-aab1-3e7fc0d28954',
   '1a5c8e72-4d9f-4063-aab1-3e7fc0d28954',
   'Re-survey after ICP tightening (n=188)',
   'notes',
   'Second survey round after deliberately skewing acquisition toward founders/VCs/execs and deprioritizing the student/general-consumer funnel. 43% answered "very disappointed" — above the 40% PMF threshold. Price (then $30/mo) not flagged as a concern even by lower-intent users.',
   now() - interval '3 days')
on conflict (id) do nothing;

insert into signal_analyses
  (signal_id, ai_summary, confirmed_summary, pain_points, objections, requests,
   urgency, likely_segment, quotes, confidence, confirmed_at)
values
  ('1a5c0001-4d9f-4063-aab1-3e7fc0d28954',
   'PMF survey below threshold; ICP is role-based (founders/VCs/execs), not company-size.',
   '22% very-disappointed overall, but 41% among founders/VCs/execs. ICP cut should be by role and intent, not company size.',
   array['PMF below 40% in the broad cohort'],
   array['Broad cohort dilutes the signal'],
   array['Deprioritize student / general-consumer funnel','Concentrate acquisition on founders/VCs/execs'],
   'high', 'Founder, VC, or senior exec',
   array['22% overall, 41% among founders/VCs/execs.'],
   'high', now() - interval '21 days'),
  ('1a5c0002-4d9f-4063-aab1-3e7fc0d28954',
   'Blockers from "somewhat disappointed" users: mobile, search speed, calendar.',
   'Three dominant blockers keeping "somewhat" users from becoming "very" users: mobile client, search speed on long threads, calendar integration. Pricing is notably absent.',
   array['No mobile client','Slow search on long threads','No calendar integration'],
   array[]::text[],
   array['Ship mobile client','Optimize search on large mailboxes','Calendar integration'],
   'high', 'Existing somewhat-disappointed users',
   array['Mobile client (7/9), search speed (5/9), calendar (4/9).'],
   'high', now() - interval '18 days'),
  ('1a5c0003-4d9f-4063-aab1-3e7fc0d28954',
   'Top-cohort founder confirms keyboard-first is the hill; warns against broadening.',
   'Series B founder is a top advocate and sees the keyboard-first flow as the single differentiator. Warns against feature expansion that dilutes the wedge.',
   array['Risk of losing focus as we grow'],
   array['Broadening to "everyone''s email" would kill the wedge'],
   array['Protect keyboard-first flow','Formalize VIP referral program'],
   'high', 'Series B founder',
   array['Keyboard-first has given me back an hour a day.','Don''t lose what makes you weird.'],
   'high', now() - interval '12 days'),
  ('1a5c0004-4d9f-4063-aab1-3e7fc0d28954',
   'Enterprise IC asks for shared-inbox; out-of-ICP for now.',
   'Shared-inbox / delegation features are a reasonable expansion ask but not the wedge. User would not churn without them. Park as a post-PMF expansion bet.',
   array['Enterprise expansion friction'],
   array['Currently out of scope; shipping it now risks ICP drift'],
   array['Park shared-inbox in the expansion backlog','Revisit after PMF is locked'],
   'low', 'Enterprise IC',
   array['Shared-inbox like Front has.'],
   'medium', now() - interval '10 days'),
  ('1a5c0005-4d9f-4063-aab1-3e7fc0d28954',
   'Post-ICP-tightening survey crosses the 40% PMF threshold.',
   '43% very-disappointed on the tightened-ICP cohort, above the 40% threshold. Price not a concern even among lower-intent users — room to hold or raise.',
   array[]::text[],
   array[]::text[],
   array['Hold $30/mo price','Continue deprioritizing out-of-ICP funnel'],
   'medium', 'Tightened-ICP cohort',
   array['43% very-disappointed after ICP tightening.'],
   'high', now() - interval '3 days')
on conflict (signal_id) do nothing;

insert into decisions (id, workspace_id, title, category, rationale, expected_outcome, created_at) values
  ('1a5cd001-4d9f-4063-aab1-3e7fc0d28954',
   '1a5c8e72-4d9f-4063-aab1-3e7fc0d28954',
   'Tighten ICP to founders/VCs/execs; deprioritize students and general consumer',
   'Segment',
   'First survey showed PMF is concentrated by role (41% very-disappointed among founders/VCs/execs vs. 22% overall). Broadening acquisition dilutes the signal. Tighten the top of funnel to concentrate intent.',
   'Next survey round crosses the 40% PMF threshold within one quarter.',
   now() - interval '19 days'),
  ('1a5cd002-4d9f-4063-aab1-3e7fc0d28954',
   '1a5c8e72-4d9f-4063-aab1-3e7fc0d28954',
   'Ship mobile client and search-speed work before adding calendar',
   'Roadmap',
   'Three "somewhat" blockers identified. Mobile was named by 7 of 9 and search by 5 of 9; calendar by 4 of 9. Ordering by frequency × unblocking impact.',
   'Move a meaningful fraction of somewhat-disappointed users into very-disappointed within two release cycles.',
   now() - interval '15 days'),
  ('1a5cd003-4d9f-4063-aab1-3e7fc0d28954',
   '1a5c8e72-4d9f-4063-aab1-3e7fc0d28954',
   'Hold pricing at $30/mo; do not negotiate',
   'Pricing',
   'Price never surfaced as a churn driver or blocker, including among lower-intent users. Holding high filters for intent and protects margin — consistent with tightened-ICP strategy.',
   'No measurable churn attributable to price; CAC payback stays under 6 months.',
   now() - interval '7 days')
on conflict (id) do nothing;

insert into decision_evidence (decision_id, signal_id, snippet) values
  ('1a5cd001-4d9f-4063-aab1-3e7fc0d28954','1a5c0001-4d9f-4063-aab1-3e7fc0d28954','22% overall, 41% among founders/VCs/execs.'),
  ('1a5cd001-4d9f-4063-aab1-3e7fc0d28954','1a5c0003-4d9f-4063-aab1-3e7fc0d28954','Don''t lose what makes you weird.'),
  ('1a5cd001-4d9f-4063-aab1-3e7fc0d28954','1a5c0005-4d9f-4063-aab1-3e7fc0d28954','43% very-disappointed after ICP tightening.'),
  ('1a5cd002-4d9f-4063-aab1-3e7fc0d28954','1a5c0002-4d9f-4063-aab1-3e7fc0d28954','Mobile client (7/9), search speed (5/9), calendar (4/9).'),
  ('1a5cd003-4d9f-4063-aab1-3e7fc0d28954','1a5c0002-4d9f-4063-aab1-3e7fc0d28954','Pricing notably absent from somewhat-disappointed blockers.'),
  ('1a5cd003-4d9f-4063-aab1-3e7fc0d28954','1a5c0005-4d9f-4063-aab1-3e7fc0d28954','Price not a concern even among lower-intent users.')
on conflict (decision_id, signal_id) do nothing;

insert into outcomes (id, decision_id, status, notes, updated_at) values
  ('1a5c0a01-4d9f-4063-aab1-3e7fc0d28954',
   '1a5cd001-4d9f-4063-aab1-3e7fc0d28954',
   'improved',
   'Re-survey crossed 40%-very-disappointed on the tightened-ICP cohort. Waitlist conversion concentrated in the target roles. ICP cut validated.',
   now() - interval '3 days'),
  ('1a5c0a02-4d9f-4063-aab1-3e7fc0d28954',
   '1a5cd002-4d9f-4063-aab1-3e7fc0d28954',
   'pending',
   'Mobile client shipping to TestFlight next sprint. Search-speed work in progress on the largest-mailbox cohort first. Calendar integration queued behind both.',
   now() - interval '5 days'),
  ('1a5c0a03-4d9f-4063-aab1-3e7fc0d28954',
   '1a5cd003-4d9f-4063-aab1-3e7fc0d28954',
   'improved',
   'Two quarters in: no measurable price-driven churn. CAC payback at 4.2 months. Price discussed in 0.8% of onboarding calls.',
   now() - interval '2 days')
on conflict (id) do nothing;

-- ============================================================
-- 3) Linear · dev-first positioning
-- ============================================================

insert into signals (id, workspace_id, title, source_type, raw_text, created_at) values
  ('3d8f0001-7b92-4e05-9cd6-8a1e4f5067b3',
   '3d8f1c45-7b92-4e05-9cd6-8a1e4f5067b3',
   'Discord DM with a staff engineer at a Series A dev-tools startup',
   'dm',
   'Staff engineer, 30-person team. "Jira takes 8 seconds to open a ticket. I swear I am not exaggerating. I watched our lead do it yesterday. If you shipped something that felt like VSCode — keyboard shortcuts everywhere, instant, offline when the wifi drops — my whole team would pay per seat out of our own pockets."',
   now() - interval '24 days'),
  ('3d8f0002-7b92-4e05-9cd6-8a1e4f5067b3',
   '3d8f1c45-7b92-4e05-9cd6-8a1e4f5067b3',
   'Interview with a CTO of a growth-stage startup',
   'interview',
   'CTO at a 120-person startup, currently on Jira Cloud. "Our PMs love the custom workflows in Jira. Our engineers hate every second of it. I have watched three senior engineers quit partially over this. If you ship for engineers first and let PMs live with it, you win."',
   now() - interval '22 days'),
  ('3d8f0003-7b92-4e05-9cd6-8a1e4f5067b3',
   '3d8f1c45-7b92-4e05-9cd6-8a1e4f5067b3',
   'Twitter thread digest: "why devs hate Jira" (n=412 replies)',
   'notes',
   'Aggregate of a viral Twitter thread: top complaints (in order) — (1) slow page loads, (2) too many fields to fill out, (3) custom workflows that only PMs understand, (4) mobile app is useless, (5) no offline mode. Sentiment notably split: IC engineers overwhelmingly negative; PMs mixed-to-positive.',
   now() - interval '20 days'),
  ('3d8f0004-7b92-4e05-9cd6-8a1e4f5067b3',
   '3d8f1c45-7b92-4e05-9cd6-8a1e4f5067b3',
   'Pricing-page visitor survey (n=63)',
   'notes',
   'On-page survey asked "what would you expect to pay?": median $8/seat/month; mode $10; floor $5. Comparisons to Jira Cloud ($7.50 standard) and Shortcut ($8.50 team). No respondent flagged price as a primary decision factor — "it is the same price range anyway".',
   now() - interval '14 days'),
  ('3d8f0005-7b92-4e05-9cd6-8a1e4f5067b3',
   '3d8f1c45-7b92-4e05-9cd6-8a1e4f5067b3',
   'Design-partner feedback: offline-first client',
   'interview',
   'Three design-partner teams exercised the offline-first beta over two weeks of remote/coworking use. Feedback converged: keyboard-first plus offline-first together feel like a different category of tool. One engineer said "I forgot the app even needs a server."',
   now() - interval '6 days')
on conflict (id) do nothing;

insert into signal_analyses
  (signal_id, ai_summary, confirmed_summary, pain_points, objections, requests,
   urgency, likely_segment, quotes, confidence, confirmed_at)
values
  ('3d8f0001-7b92-4e05-9cd6-8a1e4f5067b3',
   'Engineer willing to pay per-seat out of pocket for a VSCode-feel issue tracker.',
   'Ground-truth quote: Jira''s load time is so bad it is measured in seconds-per-ticket. Engineers have a VSCode-shaped mental model of what they want: keyboard-everywhere, instant, offline-tolerant.',
   array['Jira is slow per-ticket','No keyboard-first issue tracker exists'],
   array['"Jira takes 8 seconds to open a ticket"'],
   array['Keyboard-everywhere shortcuts','Offline-tolerant client'],
   'high', 'Staff engineer at dev-tools startup',
   array['If you shipped something that felt like VSCode — my whole team would pay per seat out of our own pockets.'],
   'high', now() - interval '24 days'),
  ('3d8f0002-7b92-4e05-9cd6-8a1e4f5067b3',
   'CTO confirms engineer-vs-PM buyer split; engineer-first wins.',
   'PMs like Jira''s custom workflows; engineers hate Jira''s overhead. Targeting engineers as the buyer (with PMs as go-along users) is the path, not the reverse.',
   array['Engineer quits partially attributable to tooling'],
   array['"PMs love Jira, engineers hate it"'],
   array['Engineer-first feature priority','PM-tolerable workflow layer on top'],
   'high', 'CTO at growth-stage startup',
   array['If you ship for engineers first and let PMs live with it, you win.'],
   'high', now() - interval '22 days'),
  ('3d8f0003-7b92-4e05-9cd6-8a1e4f5067b3',
   'Public sentiment split: engineers negative, PMs mixed on Jira.',
   'Twitter thread with 412 replies: load speed, field fatigue, and mobile/offline gaps are the top engineer complaints. PM sentiment is notably less negative — confirms buyer-side asymmetry.',
   array['Slow loads','Too many required fields','Useless mobile','No offline'],
   array['PMs are not the bottleneck'],
   array['Speed', 'Field minimalism', 'Usable mobile', 'Offline mode'],
   'high', 'Public IC-engineer cohort',
   array['IC engineers overwhelmingly negative; PMs mixed-to-positive.'],
   'high', now() - interval '20 days'),
  ('3d8f0004-7b92-4e05-9cd6-8a1e4f5067b3',
   'Price elasticity: $8/seat is in-band with Jira and Shortcut; price not a deciding factor.',
   'Median expected price $8/seat/month. Mode $10. Price bracket is a non-factor in the buying decision — product fit and engineering experience dominate.',
   array['Price is competitive — not a lever'],
   array[]::text[],
   array['Price at $8/seat/month'],
   'low', 'Pricing-page visitors',
   array['It is the same price range anyway.'],
   'medium', now() - interval '14 days'),
  ('3d8f0005-7b92-4e05-9cd6-8a1e4f5067b3',
   'Offline-first + keyboard-first design partners rate it category-different.',
   'Three design-partner teams independently describe the offline+keyboard combination as a category shift, not a feature gain. Narrative ammunition for positioning.',
   array['No offline issue tracker exists today'],
   array[]::text[],
   array['Lead positioning with offline-first'],
   'high', 'Design-partner engineering teams',
   array['I forgot the app even needs a server.'],
   'high', now() - interval '6 days')
on conflict (signal_id) do nothing;

insert into decisions (id, workspace_id, title, category, rationale, expected_outcome, created_at) values
  ('3d8fd001-7b92-4e05-9cd6-8a1e4f5067b3',
   '3d8f1c45-7b92-4e05-9cd6-8a1e4f5067b3',
   'Target engineers as the buyer; PMs as go-along users',
   'Segment',
   'CTO interview plus the public Twitter thread both confirm the buyer-side asymmetry: engineers hate Jira viscerally and will pay per-seat from their own pockets; PMs are ambivalent. Engineer-first GTM beats the PM-first defaults of the category.',
   'Adoption driven bottom-up by engineering teams; PM objections absorbed, not answered.',
   now() - interval '23 days'),
  ('3d8fd002-7b92-4e05-9cd6-8a1e4f5067b3',
   '3d8f1c45-7b92-4e05-9cd6-8a1e4f5067b3',
   'Ship offline-first client; treat network as optional, not required',
   'Product',
   'Engineer cohort frames offline as an un-met basic, and design partners rate the offline+keyboard combo as category-different. Cost is real (sync conflict handling, CRDT-ish data model) but the moat is proportional.',
   'Offline-first becomes a core differentiator in marketing and reviews. Churn tied to flaky networks drops to ~0.',
   now() - interval '16 days'),
  ('3d8fd003-7b92-4e05-9cd6-8a1e4f5067b3',
   '3d8f1c45-7b92-4e05-9cd6-8a1e4f5067b3',
   'Price at $8/seat/month; no enterprise discount negotiation at GTM start',
   'Pricing',
   'Pricing survey and comparable set both cluster around $8. Price is not a decision driver in this band, so hold and avoid the race-to-bottom. No enterprise negotiation until we have a reference-logo moat.',
   'No measurable price-driven churn; sales cycle shortens by skipping negotiation.',
   now() - interval '10 days')
on conflict (id) do nothing;

insert into decision_evidence (decision_id, signal_id, snippet) values
  ('3d8fd001-7b92-4e05-9cd6-8a1e4f5067b3','3d8f0001-7b92-4e05-9cd6-8a1e4f5067b3','My whole team would pay per seat out of our own pockets.'),
  ('3d8fd001-7b92-4e05-9cd6-8a1e4f5067b3','3d8f0002-7b92-4e05-9cd6-8a1e4f5067b3','If you ship for engineers first and let PMs live with it, you win.'),
  ('3d8fd001-7b92-4e05-9cd6-8a1e4f5067b3','3d8f0003-7b92-4e05-9cd6-8a1e4f5067b3','IC engineers overwhelmingly negative; PMs mixed-to-positive.'),
  ('3d8fd002-7b92-4e05-9cd6-8a1e4f5067b3','3d8f0001-7b92-4e05-9cd6-8a1e4f5067b3','Offline when the wifi drops.'),
  ('3d8fd002-7b92-4e05-9cd6-8a1e4f5067b3','3d8f0003-7b92-4e05-9cd6-8a1e4f5067b3','No offline mode flagged among top 5 complaints.'),
  ('3d8fd002-7b92-4e05-9cd6-8a1e4f5067b3','3d8f0005-7b92-4e05-9cd6-8a1e4f5067b3','I forgot the app even needs a server.'),
  ('3d8fd003-7b92-4e05-9cd6-8a1e4f5067b3','3d8f0004-7b92-4e05-9cd6-8a1e4f5067b3','It is the same price range anyway.')
on conflict (decision_id, signal_id) do nothing;

insert into outcomes (id, decision_id, status, notes, updated_at) values
  ('3d8f0a01-7b92-4e05-9cd6-8a1e4f5067b3',
   '3d8fd001-7b92-4e05-9cd6-8a1e4f5067b3',
   'improved',
   'Engineer-led adoption overtook PM-led competitors in design-partner cohort. 14 of 20 design partners reached 70%+ weekly-active rate within 30 days. Three competitors lost named accounts to us citing the engineering experience.',
   now() - interval '3 days'),
  ('3d8f0a02-7b92-4e05-9cd6-8a1e4f5067b3',
   '3d8fd002-7b92-4e05-9cd6-8a1e4f5067b3',
   'improved',
   'Offline-first landed in public GA. Widely cited on Hacker News and Twitter as the differentiator against Jira and Shortcut. Zero reported bugs tied to network loss over two release cycles.',
   now() - interval '4 days'),
  ('3d8f0a03-7b92-4e05-9cd6-8a1e4f5067b3',
   '3d8fd003-7b92-4e05-9cd6-8a1e4f5067b3',
   'pending',
   '$8/seat holding. Monitoring for enterprise-side pushback as account sizes grow — expect one quarter more data before revisiting.',
   now() - interval '5 days')
on conflict (id) do nothing;

-- ============================================================
-- 4) Stripe · 7-lines-of-JS launch
-- ============================================================

insert into signals (id, workspace_id, title, source_type, raw_text, created_at) values
  ('e4a20001-6f87-4d30-b5ea-9c76f1e04523',
   'e4a2b9c1-6f87-4d30-b5ea-9c76f1e04523',
   'Call with a developer at a YC-batch startup',
   'call',
   'YC founder, trying to accept payments: "I spent two weeks on Braintree, gave up, then another week on PayPal IPN, gave up. I have written more code to not process payments than I have to process them. If you hand me something I can drop into my JS in one evening I will switch the same week."',
   now() - interval '30 days'),
  ('e4a20002-6f87-4d30-b5ea-9c76f1e04523',
   'e4a2b9c1-6f87-4d30-b5ea-9c76f1e04523',
   'Interview with a merchant running an indie SaaS',
   'interview',
   'Indie SaaS owner, $18k MRR. Top complaints about existing processors: opaque pricing ("every account rep gives a different number"), surprise fees ("there is always a new line item"), account-rep-gated negotiations. Would pay a flat, boring premium in exchange for no account rep and no surprises.',
   now() - interval '27 days'),
  ('e4a20003-6f87-4d30-b5ea-9c76f1e04523',
   'e4a2b9c1-6f87-4d30-b5ea-9c76f1e04523',
   'r/programming thread: "why does every payment API suck" (n=310 comments)',
   'notes',
   'Aggregated Reddit thread: top themes — XML-based APIs (80% of comments), multi-day onboarding for sandbox, merchant-of-record confusion, no copy-pasteable docs. Every top-voted comment framed payments as a "solved-in-theory, broken-in-practice" category ripe for a developer-first entrant.',
   now() - interval '26 days'),
  ('e4a20004-6f87-4d30-b5ea-9c76f1e04523',
   'e4a2b9c1-6f87-4d30-b5ea-9c76f1e04523',
   'Landing-page split test: JS snippet vs. "book a demo"',
   'notes',
   'A/B test over 2 weeks: page A led with a 7-line JS snippet hero; page B led with a "book a demo" CTA. Signup conversion: A = 18.4%, B = 2.1%. Developer-first hero won by an order of magnitude against the category default.',
   now() - interval '24 days'),
  ('e4a20005-6f87-4d30-b5ea-9c76f1e04523',
   'e4a2b9c1-6f87-4d30-b5ea-9c76f1e04523',
   'Advisor: skip the CFO sale',
   'call',
   'Advisor with enterprise-SaaS GTM background: "You will be tempted to build a field-sales motion for finance teams. Don''t. The engineer integrating the API is your champion. If they ship it, the CFO signs off later. You can go direct to developers and let the org buy around them."',
   now() - interval '22 days')
on conflict (id) do nothing;

insert into signal_analyses
  (signal_id, ai_summary, confirmed_summary, pain_points, objections, requests,
   urgency, likely_segment, quotes, confidence, confirmed_at)
values
  ('e4a20001-6f87-4d30-b5ea-9c76f1e04523',
   'YC developer will switch the same week for a drop-in JS integration.',
   'Target developer has weeks of sunk cost on existing processors. The switching trigger is a same-evening integration path. Integration simplicity is the wedge.',
   array['Weeks of sunk cost on Braintree and PayPal','No simple drop-in JS option in market'],
   array['Existing APIs are unshippable in a reasonable timeframe'],
   array['Drop-in JS integration','Same-evening happy path'],
   'high', 'YC-batch developer',
   array['If you hand me something I can drop into my JS in one evening I will switch the same week.'],
   'high', now() - interval '30 days'),
  ('e4a20002-6f87-4d30-b5ea-9c76f1e04523',
   'Indie SaaS merchant wants flat, boring pricing with no account rep.',
   'Pricing opacity and account-rep-gated negotiations are more painful than an absolute number. Transparency premium is a willingness-to-pay lever.',
   array['Opaque pricing','Surprise fees','Account-rep negotiation drag'],
   array['"There is always a new line item"'],
   array['Flat public pricing','No account rep for small merchants'],
   'high', 'Indie SaaS merchant',
   array['I would pay a flat, boring premium in exchange for no surprises.'],
   'high', now() - interval '27 days'),
  ('e4a20003-6f87-4d30-b5ea-9c76f1e04523',
   'Public dev sentiment: payments category is "solved-in-theory, broken-in-practice".',
   'Dev community sees payments as unsolved for developers: XML APIs, slow sandbox, poor docs. Entry wedge is hygiene, not novelty.',
   array['XML APIs','Multi-day sandbox onboarding','Merchant-of-record confusion','No copy-pasteable docs'],
   array[]::text[],
   array['Modern JSON API','Instant sandbox','Docs you can copy-paste in five minutes'],
   'high', 'Developer community',
   array['Solved-in-theory, broken-in-practice.'],
   'high', now() - interval '26 days'),
  ('e4a20004-6f87-4d30-b5ea-9c76f1e04523',
   'Developer-first hero beats "book a demo" by 9×.',
   'Page with JS snippet in the hero converted 18.4% vs. 2.1% for a "book a demo" hero. Self-serve developer acquisition is the dominant path.',
   array['Category default ("book a demo") is wrong for this buyer'],
   array[]::text[],
   array['Lead with code, not sales','Self-serve signup'],
   'high', 'Developer-first prospects',
   array['18.4% vs. 2.1% signup conversion.'],
   'high', now() - interval '24 days'),
  ('e4a20005-6f87-4d30-b5ea-9c76f1e04523',
   'Advisor: engineer is the champion, CFO signs off later.',
   'Enterprise-SaaS GTM default (land the CFO) is wrong for this category. The engineer is the decision-maker; the org buys around them.',
   array['Resist the field-sales temptation'],
   array['Field sales slows the wedge'],
   array['Direct-to-developer GTM','No field sales in year one'],
   'medium', 'Advisor',
   array['If they ship it, the CFO signs off later.'],
   'high', now() - interval '22 days')
on conflict (signal_id) do nothing;

insert into decisions (id, workspace_id, title, category, rationale, expected_outcome, created_at) values
  ('e4a2d001-6f87-4d30-b5ea-9c76f1e04523',
   'e4a2b9c1-6f87-4d30-b5ea-9c76f1e04523',
   'Launch with a 7-line JS integration as the hero',
   'Product',
   'Developer complaints and A/B data both point to same-evening integration as the category-breaking move. Engineering effort is concentrated in the snippet + docs, not a broad SDK.',
   'Signup conversion concentrates in self-serve funnel; first integration completes in under an hour for target users.',
   now() - interval '25 days'),
  ('e4a2d002-6f87-4d30-b5ea-9c76f1e04523',
   'e4a2b9c1-6f87-4d30-b5ea-9c76f1e04523',
   'Publish flat pricing — 2.9% + 30¢ — with no account-rep negotiation',
   'Pricing',
   'Merchant pain on opaque pricing and surprise fees dominates the willingness-to-pay conversation. Transparency is a premium-able feature, not a cost center.',
   'Sales cycle collapses for small and mid-merchants; pricing objection removed from onboarding.',
   now() - interval '20 days'),
  ('e4a2d003-6f87-4d30-b5ea-9c76f1e04523',
   'e4a2b9c1-6f87-4d30-b5ea-9c76f1e04523',
   'No field sales in year one; go direct-to-developer',
   'GTM Motion',
   'Advisor counsel and the hero-page A/B both point away from the category default. Engineering org champions the tool; finance follows. Investing in field sales would consume runway and dilute the wedge.',
   'Year-one revenue driven by self-serve developer signups; enterprise motion unlocks in year two only after reference logos.',
   now() - interval '18 days')
on conflict (id) do nothing;

insert into decision_evidence (decision_id, signal_id, snippet) values
  ('e4a2d001-6f87-4d30-b5ea-9c76f1e04523','e4a20001-6f87-4d30-b5ea-9c76f1e04523','Drop it into my JS in one evening and I will switch the same week.'),
  ('e4a2d001-6f87-4d30-b5ea-9c76f1e04523','e4a20003-6f87-4d30-b5ea-9c76f1e04523','Category default is XML APIs, multi-day sandbox onboarding.'),
  ('e4a2d001-6f87-4d30-b5ea-9c76f1e04523','e4a20004-6f87-4d30-b5ea-9c76f1e04523','18.4% vs. 2.1% signup conversion.'),
  ('e4a2d002-6f87-4d30-b5ea-9c76f1e04523','e4a20002-6f87-4d30-b5ea-9c76f1e04523','Flat, boring premium in exchange for no surprises.'),
  ('e4a2d002-6f87-4d30-b5ea-9c76f1e04523','e4a20003-6f87-4d30-b5ea-9c76f1e04523','Pricing opacity is a category default.'),
  ('e4a2d003-6f87-4d30-b5ea-9c76f1e04523','e4a20004-6f87-4d30-b5ea-9c76f1e04523','Developer-first hero beats "book a demo" by 9×.'),
  ('e4a2d003-6f87-4d30-b5ea-9c76f1e04523','e4a20005-6f87-4d30-b5ea-9c76f1e04523','If they ship it, the CFO signs off later.')
on conflict (decision_id, signal_id) do nothing;

insert into outcomes (id, decision_id, status, notes, updated_at) values
  ('e4a20a01-6f87-4d30-b5ea-9c76f1e04523',
   'e4a2d001-6f87-4d30-b5ea-9c76f1e04523',
   'improved',
   'Launch week: 1,200 developer signups. Median time-to-first-successful-charge 43 minutes. HN front page driven organic signups for 3 days.',
   now() - interval '6 days'),
  ('e4a20a02-6f87-4d30-b5ea-9c76f1e04523',
   'e4a2d002-6f87-4d30-b5ea-9c76f1e04523',
   'improved',
   'Pricing page converted at 4.1% (vs. ~1% category benchmark). Zero negotiation asks from small and mid-merchants over six months. Category press started citing transparent pricing as the wedge.',
   now() - interval '7 days'),
  ('e4a20a03-6f87-4d30-b5ea-9c76f1e04523',
   'e4a2d003-6f87-4d30-b5ea-9c76f1e04523',
   'pending',
   'Year-one revenue tracking to plan on self-serve alone. Enterprise inbound is happening but intentionally queued to year two post reference logos.',
   now() - interval '8 days')
on conflict (id) do nothing;

-- ============================================================
-- 5) Figma · cloud multiplayer bet
-- ============================================================

insert into signals (id, workspace_id, title, source_type, raw_text, created_at) values
  ('5c7d0001-8a14-46f2-bb3e-4f9a2c1e8706',
   '5c7d0e93-8a14-46f2-bb3e-4f9a2c1e8706',
   'Call with a design lead at a large consumer internet company',
   'call',
   'Design lead, 40 designers under them. "Honestly, Sketch is fine. The cost we pay is the handoff. Designs go out of sync the moment three people touch the same file. Version-N files in Dropbox are a graveyard. If I could put my designers in a Google Doc for design, I would pay 3× Sketch per seat."',
   now() - interval '40 days'),
  ('5c7d0002-8a14-46f2-bb3e-4f9a2c1e8706',
   '5c7d0e93-8a14-46f2-bb3e-4f9a2c1e8706',
   'Interview with a design-ops lead at a travel-industry leader',
   'interview',
   'Design ops at a 10,000-person org. "Our single biggest internal pain is design handoff. Engineers are building from a PNG exported last Tuesday. Real-time shared canvases would change our meetings — literally, I would cancel half of them."',
   now() - interval '38 days'),
  ('5c7d0003-8a14-46f2-bb3e-4f9a2c1e8706',
   '5c7d0e93-8a14-46f2-bb3e-4f9a2c1e8706',
   'r/userexperience poll (n=680)',
   'notes',
   'Community poll: "If a browser-based design tool existed with real-time multiplayer, would you switch from Sketch?" Results: 40% yes immediately, 38% yes if performance matches, 15% no, 7% undecided. Performance-matching is the hard prerequisite for the 38%.',
   now() - interval '36 days'),
  ('5c7d0004-8a14-46f2-bb3e-4f9a2c1e8706',
   '5c7d0e93-8a14-46f2-bb3e-4f9a2c1e8706',
   'Twitter DM thread with an IC designer at a payments startup',
   'dm',
   'Senior IC designer: "We have multiplayer cursors in Google Docs for text. Why do we not have it for design? Someone is going to do this. Every time we open a Sketch file we have to ask in Slack whether anyone else has it open. It is 2016."',
   now() - interval '32 days'),
  ('5c7d0005-8a14-46f2-bb3e-4f9a2c1e8706',
   '5c7d0e93-8a14-46f2-bb3e-4f9a2c1e8706',
   'Internal perf review: browser rendering vs. native Sketch',
   'notes',
   'Internal benchmark on five real-world design files (2k-20k layers): browser-based rendering reached 85-95% of native Sketch performance on the target hardware. Confirms the hard prerequisite from the community poll is meetable, not hypothetical.',
   now() - interval '10 days')
on conflict (id) do nothing;

insert into signal_analyses
  (signal_id, ai_summary, confirmed_summary, pain_points, objections, requests,
   urgency, likely_segment, quotes, confidence, confirmed_at)
values
  ('5c7d0001-8a14-46f2-bb3e-4f9a2c1e8706',
   'Design lead pays a premium for collaboration, not for the canvas.',
   'The pain worth paying for is design handoff and version-drift, not drawing primitives. Willing to pay 3× Sketch per seat for a "Google Doc for design" experience.',
   array['Version-drift across teams','Handoff overhead','Dropbox-as-source-of-truth'],
   array['Sketch itself is fine — the handoff is not'],
   array['Real-time multiplayer canvas','Single source of truth per design file'],
   'high', 'Design lead at consumer-internet company',
   array['If I could put my designers in a Google Doc for design, I would pay 3× Sketch per seat.'],
   'high', now() - interval '40 days'),
  ('5c7d0002-8a14-46f2-bb3e-4f9a2c1e8706',
   'Design-ops lead at scale: handoff is the #1 internal pain.',
   'At 10,000-person scale, design handoff is the most-cited internal friction. Real-time shared canvases unlock a workflow change, not a marginal improvement.',
   array['Engineers build from stale PNGs','Meeting overhead around handoff'],
   array[]::text[],
   array['Real-time shared canvases','Live component updates downstream'],
   'high', 'Design-ops lead',
   array['Real-time shared canvases would change our meetings — I would cancel half of them.'],
   'high', now() - interval '38 days'),
  ('5c7d0003-8a14-46f2-bb3e-4f9a2c1e8706',
   'Community poll: 40% switch immediately, 38% pending performance parity.',
   'Willingness to switch is in the community — 78% addressable if performance matches Sketch on target hardware. Performance is the prerequisite, not the wedge.',
   array['Historical browser-tool performance was too slow for designers'],
   array['"I will switch if performance matches"'],
   array['Hit 90%+ of native Sketch performance'],
   'high', 'Community UX designers',
   array['40% yes immediately, 38% yes if performance matches.'],
   'high', now() - interval '36 days'),
  ('5c7d0004-8a14-46f2-bb3e-4f9a2c1e8706',
   'IC designer: multiplayer is a missing hygiene feature in 2016.',
   'Multiplayer cursors feel overdue to the IC cohort — framed as a market opening, not a novelty.',
   array['Slack-based file-lock negotiation','"It is 2016"'],
   array[]::text[],
   array['Multiplayer cursors as a table-stakes v0 feature'],
   'high', 'Senior IC designer at payments startup',
   array['We have multiplayer cursors in Google Docs for text. Why do we not have it for design?'],
   'high', now() - interval '32 days'),
  ('5c7d0005-8a14-46f2-bb3e-4f9a2c1e8706',
   'Browser rendering hits 85-95% of native Sketch on benchmarks.',
   'Hard prerequisite for the 38%-pending-performance segment is measurable and met. Removes the last "is this even possible" blocker from the bet.',
   array[]::text[],
   array[]::text[],
   array['Ship browser performance benchmarks publicly as a credibility move'],
   'medium', 'Internal engineering',
   array['Browser-based rendering reached 85-95% of native Sketch performance.'],
   'high', now() - interval '10 days')
on conflict (signal_id) do nothing;

insert into decisions (id, workspace_id, title, category, rationale, expected_outcome, created_at) values
  ('5c7dd001-8a14-46f2-bb3e-4f9a2c1e8706',
   '5c7d0e93-8a14-46f2-bb3e-4f9a2c1e8706',
   'Bet on browser-based cloud tooling over native',
   'Product',
   'Handoff and version-drift are the pains worth paying for, and they compound in a cloud-first model. Native Sketch competes on the axis we are trying to obsolete.',
   'Cloud-first positioning that native competitors can''t answer without rewriting.',
   now() - interval '35 days'),
  ('5c7dd002-8a14-46f2-bb3e-4f9a2c1e8706',
   '5c7d0e93-8a14-46f2-bb3e-4f9a2c1e8706',
   'Ship multiplayer cursors in v0 as a core differentiator, not a feature',
   'Positioning',
   'IC designers frame multiplayer as table stakes. Shipping it in v0 both answers the "overdue" framing and anchors the narrative — multiplayer is the wedge, not a post-launch add-on.',
   'Public narrative describes Figma as "Google Docs for design" organically within six months.',
   now() - interval '28 days'),
  ('5c7dd003-8a14-46f2-bb3e-4f9a2c1e8706',
   '5c7d0e93-8a14-46f2-bb3e-4f9a2c1e8706',
   'Forever-free tier for teams of 2 editors',
   'Pricing',
   'Word-of-mouth at design teams runs through two-editor pairs (designer + PM, designer + engineer). A free tier seeds the atom of adoption and generates the social proof that paid tiers convert on.',
   'Free-tier-driven organic acquisition becomes the dominant new-account channel; conversion happens on the 3rd-editor add.',
   now() - interval '22 days')
on conflict (id) do nothing;

insert into decision_evidence (decision_id, signal_id, snippet) values
  ('5c7dd001-8a14-46f2-bb3e-4f9a2c1e8706','5c7d0001-8a14-46f2-bb3e-4f9a2c1e8706','Version-N files in Dropbox are a graveyard.'),
  ('5c7dd001-8a14-46f2-bb3e-4f9a2c1e8706','5c7d0002-8a14-46f2-bb3e-4f9a2c1e8706','Engineers are building from a PNG exported last Tuesday.'),
  ('5c7dd001-8a14-46f2-bb3e-4f9a2c1e8706','5c7d0005-8a14-46f2-bb3e-4f9a2c1e8706','Browser-based rendering reached 85-95% of native Sketch performance.'),
  ('5c7dd002-8a14-46f2-bb3e-4f9a2c1e8706','5c7d0002-8a14-46f2-bb3e-4f9a2c1e8706','Real-time shared canvases would change our meetings.'),
  ('5c7dd002-8a14-46f2-bb3e-4f9a2c1e8706','5c7d0004-8a14-46f2-bb3e-4f9a2c1e8706','We have multiplayer cursors in Google Docs for text. Why do we not have it for design?'),
  ('5c7dd003-8a14-46f2-bb3e-4f9a2c1e8706','5c7d0001-8a14-46f2-bb3e-4f9a2c1e8706','Pay 3× Sketch per seat — but only if handoff is gone.'),
  ('5c7dd003-8a14-46f2-bb3e-4f9a2c1e8706','5c7d0003-8a14-46f2-bb3e-4f9a2c1e8706','78% addressable if performance matches.')
on conflict (decision_id, signal_id) do nothing;

insert into outcomes (id, decision_id, status, notes, updated_at) values
  ('5c7d0a01-8a14-46f2-bb3e-4f9a2c1e8706',
   '5c7dd001-8a14-46f2-bb3e-4f9a2c1e8706',
   'improved',
   'Cloud-first launch landed with browser performance holding the 85-95%-of-native target. Native competitors did not respond with a cloud client for 18+ months. Category press reframed "design tool" around cloud collaboration.',
   now() - interval '2 days'),
  ('5c7d0a02-8a14-46f2-bb3e-4f9a2c1e8706',
   '5c7dd002-8a14-46f2-bb3e-4f9a2c1e8706',
   'improved',
   '"Google Docs for design" was used organically in 3 of the first 5 launch-week reviews. Multiplayer cursors showed up in 40% of public demos within 90 days.',
   now() - interval '3 days'),
  ('5c7d0a03-8a14-46f2-bb3e-4f9a2c1e8706',
   '5c7dd003-8a14-46f2-bb3e-4f9a2c1e8706',
   'improved',
   'Free-tier teams drove 62% of first-3-months new-account acquisition. Paid conversion triggered on the third-editor add as hypothesized.',
   now() - interval '4 days')
on conflict (id) do nothing;

-- ============================================================
-- Idea Vault
-- ============================================================

insert into ideas (id, approved_idea, audience, problem_statement, converted_workspace_id) values
  ('1de00001-9c3d-41e7-8fa5-b7d2e0c94812',
   'Notion · the 2017 rebuild',
   'Early-stage productivity-SaaS founders wrestling with positioning',
   'Block-editor notes apps hit a ceiling when users want a workspace. The pivot is a messaging and primitive-model rebuild, not a feature drop.',
   '6f2b4a18-9c3d-41e7-8fa5-b7d2e0c94812'),
  ('1de00002-4d9f-4063-aab1-3e7fc0d28954',
   'Superhuman · PMF engine',
   'Prosumer SaaS founders searching for PMF',
   'Generic "very disappointed" surveys dilute signal. A role-tight ICP + the 40% methodology together is the actionable PMF mechanism.',
   '1a5c8e72-4d9f-4063-aab1-3e7fc0d28954'),
  ('1de00003-7b92-4e05-9cd6-8a1e4f5067b3',
   'Linear · dev-first positioning',
   'Dev-tools and issue-tracking founders',
   'Jira-class tools optimize for PM workflows and lose engineers. An engineer-first, offline-first, keyboard-first tracker wins bottom-up.',
   '3d8f1c45-7b92-4e05-9cd6-8a1e4f5067b3'),
  ('1de00004-6f87-4d30-b5ea-9c76f1e04523',
   'Stripe · 7-lines-of-JS launch',
   'API-first startup founders entering a legacy-integration category',
   'Categories where the default integration takes weeks open a wedge for a same-evening drop-in experience with transparent pricing.',
   'e4a2b9c1-6f87-4d30-b5ea-9c76f1e04523'),
  ('1de00005-8a14-46f2-bb3e-4f9a2c1e8706',
   'Figma · cloud multiplayer bet',
   'Founders building against incumbent native desktop products',
   'If the pain customers pay for is handoff, not the canvas, a browser-first tool with multiplayer as v0 can leapfrog native incumbents.',
   '5c7d0e93-8a14-46f2-bb3e-4f9a2c1e8706'),
  ('1de00006-3210-4567-89ab-cdef01234567',
   'Zero-to-one chat for first-time founders',
   'First-time founders with no product idea yet',
   'Stage-zero founders don''t know what to build. A guided chat that outputs a narrow audience, specific pain, and a testable wedge is the missing primitive between "curious" and "committed".',
   null)
on conflict (id) do nothing;

commit;
-- nudge PostgREST to reload the schema cache
notify pgrst, 'reload schema';
