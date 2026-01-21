-- Migration: Add user_id to document_chunks and update match_document_chunks function
-- This enables proper multi-tenancy isolation in vector search

-- Add user_id to document_chunks table for more efficient filtering
-- (Rather than joining with documents table on every vector search)
alter table public.document_chunks 
  add column if not exists user_id uuid references public.users(id) on delete cascade;

-- Backfill user_id in document_chunks from their parent documents
update public.document_chunks dc
set user_id = d.user_id
from public.documents d
where dc.document_id = d.id
and dc.user_id is null;

-- Create index for efficient user_id filtering on chunks
create index if not exists idx_document_chunks_user_id on document_chunks(user_id);

-- Update the RLS policy for document_chunks to use user_id directly
drop policy if exists "Users can view their own document chunks" on public.document_chunks;

create policy "Users can view their own document chunks"
  on public.document_chunks for select
  using ( user_id = auth.uid() );

create policy "Users can insert their own document chunks"
  on public.document_chunks for insert
  with check ( user_id = auth.uid() );

create policy "Users can delete their own document chunks"
  on public.document_chunks for delete
  using ( user_id = auth.uid() );

-- Update match_document_chunks function to accept and filter by user_id
create or replace function match_document_chunks(
  query_embedding vector(1536),
  match_threshold float default 0.5,
  match_count int default 5,
  filter_user_id uuid default null
)
returns table (
  id uuid,
  document_id uuid,
  content text,
  similarity float,
  metadata jsonb
)
language sql stable
as $$
  select
    document_chunks.id,
    document_chunks.document_id,
    document_chunks.content,
    1 - (document_chunks.embedding <=> query_embedding) as similarity,
    document_chunks.metadata
  from document_chunks
  where 
    1 - (document_chunks.embedding <=> query_embedding) > match_threshold
    and (filter_user_id is null or document_chunks.user_id = filter_user_id)
  order by document_chunks.embedding <=> query_embedding
  limit match_count;
$$;

-- Create a trigger to automatically set user_id on document_chunks from their parent document
create or replace function set_document_chunk_user_id()
returns trigger as $$
begin
  -- Get user_id from the parent document
  select user_id into new.user_id
  from documents
  where id = new.document_id;
  
  return new;
end;
$$ language plpgsql;

-- Drop the trigger if it exists and recreate
drop trigger if exists set_chunk_user_id on document_chunks;

create trigger set_chunk_user_id
  before insert on document_chunks
  for each row
  when (new.user_id is null)
  execute function set_document_chunk_user_id();
