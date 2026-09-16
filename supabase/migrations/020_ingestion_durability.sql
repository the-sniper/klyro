-- Make document ingestion recoverable.
--
-- processDocument() runs fire-and-forget inside the request that created the
-- document. On Vercel the function can be frozen or killed mid-run, which
-- leaves the row in 'processing' with nothing scheduled to ever revisit it, so
-- the document is stranded and the user sees a permanent spinner.
--
-- These columns let a reaper find stalled rows, bound how many times one is
-- retried, and skip re-embedding content that has not changed.

alter table documents add column if not exists processing_started_at timestamptz;
alter table documents add column if not exists attempts integer not null default 0;

-- SHA-256 of the content that produced the current chunks.
alter table documents add column if not exists content_hash text;

-- The reaper scans for rows stuck in processing, oldest first.
create index if not exists idx_documents_processing_started_at
  on documents (processing_started_at)
  where status = 'processing';

-- PostgREST caches the schema; without this it can keep serving the old column
-- set (a new column reads back as null through select('*')) until it restarts.
notify pgrst, 'reload schema';
