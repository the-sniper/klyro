-- Enable pgvector extension for embeddings
create extension if not exists vector;

-- Documents table (uploaded content sources)
create table documents (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  source_type text not null check (source_type in ('text', 'url', 'file')),
  content text,
  source_url text,
  status text default 'queued' check (status in ('queued', 'processing', 'ready', 'failed')),
  error_message text,
  category text check (category in ('experience', 'projects', 'skills', 'education', 'availability', 'contact', 'general')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Document chunks with vector embeddings
create table document_chunks (
  id uuid primary key default gen_random_uuid(),
  document_id uuid references documents(id) on delete cascade,
  content text not null,
  embedding vector(1536), -- OpenAI text-embedding-3-small dimension
  chunk_index integer not null,
  metadata jsonb default '{}',
  created_at timestamptz default now()
);

-- Chat sessions for tracking conversations
create table chat_sessions (
  id uuid primary key default gen_random_uuid(),
  widget_key text not null,
  visitor_id text,
  created_at timestamptz default now()
);

-- Chat messages with source citations
create table chat_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references chat_sessions(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  sources jsonb default '[]',
  created_at timestamptz default now()
);

-- Widget configurations
create table widgets (
  id uuid primary key default gen_random_uuid(),
  widget_key text unique not null,
  name text not null,
  position text default 'bottom-right' check (position in ('bottom-right', 'bottom-left')),
  theme text default 'auto' check (theme in ('light', 'dark', 'auto')),
  welcome_message text default 'Hi! How can I help you learn more about me?',
  allowed_domains text[] default '{}',
  primary_color text default '#6366f1',
  is_active boolean default true,
  -- Persona configuration for more natural AI responses
  owner_name text, -- The portfolio owner's name for first-person references
  personality_traits text[] default '{}', -- e.g., ['friendly', 'technical', 'enthusiastic']
  communication_style text default 'friendly' check (communication_style in ('formal', 'casual', 'friendly', 'professional', 'enthusiastic', 'calm')),
  custom_instructions text, -- Additional persona instructions from the user
  -- External links the bot can share
  external_links jsonb default '{}', -- {"github": "...", "linkedin": "...", "twitter": "...", "website": "..."}
  -- Permissions for what the bot can discuss/share
  access_permissions jsonb default '{"can_share_github": true, "can_share_linkedin": true, "can_share_twitter": true, "can_share_email": true, "can_discuss_salary": false, "can_schedule_calls": true}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);


-- Create indexes for performance
create index idx_document_chunks_document_id on document_chunks(document_id);
create index idx_chat_messages_session_id on chat_messages(session_id);
create index idx_chat_sessions_widget_key on chat_sessions(widget_key);
create index idx_documents_status on documents(status);

-- Create index for vector similarity search (IVFFlat)
create index idx_document_chunks_embedding on document_chunks 
  using ivfflat (embedding vector_cosine_ops) 
  with (lists = 100);

-- Function to update updated_at timestamp
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Triggers for updated_at
create trigger update_documents_updated_at
  before update on documents
  for each row execute function update_updated_at_column();

create trigger update_widgets_updated_at
  before update on widgets
  for each row execute function update_updated_at_column();

-- Function for vector similarity search
create or replace function match_document_chunks(
  query_embedding vector(1536),
  match_threshold float default 0.5,
  match_count int default 5
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
  where 1 - (document_chunks.embedding <=> query_embedding) > match_threshold
  order by document_chunks.embedding <=> query_embedding
  limit match_count;
$$;

-- Insert a default widget for testing
insert into widgets (widget_key, name, welcome_message)
values ('default', 'Default Widget', 'Hi! I''m an AI assistant. Ask me anything about this portfolio!');
