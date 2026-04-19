-- Dalil · feedback model overhaul
-- Adds:
--   - signal_analyses.positive_feedback / negative_feedback (replace the UI
--     surface for objections + likely_segment, while keeping the old columns
--     so existing reads don't break mid-migration).
--   - signals.feedback_type (qualitative | quantitative).
--   - signals.category (AI-assigned, used for Dashboard category boxes).
--   - workspaces.* onboarding fields (company profile captured at first run).

alter table signal_analyses
  add column if not exists positive_feedback text[],
  add column if not exists negative_feedback text[];

alter table signals
  add column if not exists feedback_type text default 'qualitative',
  add column if not exists category text;

create index if not exists signals_category_idx
  on signals(workspace_id, category)
  where category is not null;

alter table workspaces
  add column if not exists audience_group text,
  add column if not exists product_category text,
  add column if not exists main_goal text,
  add column if not exists preferred_focus text,
  add column if not exists team_size integer,
  add column if not exists company_notes text,
  add column if not exists onboarding_completed_at timestamptz;
