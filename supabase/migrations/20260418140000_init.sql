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
  embedding vector(768),
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
  embedding vector(768),
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
  query_embedding vector(768),
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
  query_embedding vector(768),
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
grant usage on schema public to anon, authenticated;
grant all on all tables in schema public to anon, authenticated;
grant all on all sequences in schema public to anon, authenticated;
grant execute on all functions in schema public to anon, authenticated;
