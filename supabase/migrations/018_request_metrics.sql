-- Per-request observability for the chat endpoint.
--
-- Nothing recorded token usage, cost or latency, so there was no way to answer
-- "what does a conversation cost?" or "how slow is the slow path?" without
-- reading logs. chat_sessions also had no record of which customer domain a
-- session came from, so distinct embedding sites were not countable.

create table if not exists request_metrics (
  id                uuid primary key default gen_random_uuid(),
  widget_key        text,
  user_id           uuid,
  session_id        uuid references chat_sessions(id) on delete set null,
  message_id        uuid references chat_messages(id) on delete set null,
  model             text,
  prompt_tokens     integer not null default 0,
  completion_tokens integer not null default 0,
  embedding_tokens  integer not null default 0,
  total_cost_usd    numeric(12, 8) not null default 0,
  ttfb_ms           integer,
  total_ms          integer,
  retrieved_chunks  integer not null default 0,
  tool_calls        integer not null default 0,
  created_at        timestamptz not null default now()
);

-- The admin rollups filter by widget over a trailing window.
create index if not exists idx_request_metrics_widget_created
  on request_metrics (widget_key, created_at desc);

create index if not exists idx_request_metrics_user_created
  on request_metrics (user_id, created_at desc);

-- Where the session was embedded, so distinct customer domains are countable.
alter table chat_sessions add column if not exists origin text;

create index if not exists idx_chat_sessions_origin
  on chat_sessions (origin);

-- PostgREST caches the schema; without this it can keep serving the old column
-- set (a new column reads back as null through select('*')) until it restarts.
notify pgrst, 'reload schema';
