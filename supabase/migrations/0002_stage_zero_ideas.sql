-- Stage-Zero idea workflow fields

alter table ideas
  add column if not exists chat_transcript_summary text,
  add column if not exists convert_to_workspace_flag boolean not null default false;
