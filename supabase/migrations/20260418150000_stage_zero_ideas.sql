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
