-- Create a public profiles table that mirrors auth.users
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  avatar_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS on profiles
alter table public.profiles enable row level security;

-- Create policies for profiles
create policy "Public profiles are viewable by everyone"
  on public.profiles for select
  using ( true );

create policy "Users can insert their own profile"
  on public.profiles for insert
  with check ( auth.uid() = id );

create policy "Users can update own profile"
  on public.profiles for update
  using ( auth.uid() = id );

-- Function to handle new user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to automatically create profile on signup
create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Add user_id to widgets table
alter table public.widgets 
  add column user_id uuid references public.profiles(id) on delete cascade;

-- Add user_id to documents table
alter table public.documents 
  add column user_id uuid references public.profiles(id) on delete cascade;

-- Enable RLS on widgets and documents
alter table public.widgets enable row level security;
alter table public.documents enable row level security;
alter table public.document_chunks enable row level security;
alter table public.chat_sessions enable row level security;
alter table public.chat_messages enable row level security;

-- Policies for Widgets
-- 1. Public can read widgets (needed for the chat widget to load on any site)
create policy "Widgets are viewable by everyone"
  on public.widgets for select
  using ( true );

-- 2. Users can create/update/delete ONLY their own widgets
create policy "Users can insert their own widgets"
  on public.widgets for insert
  with check ( auth.uid() = user_id );

create policy "Users can update their own widgets"
  on public.widgets for update
  using ( auth.uid() = user_id );

create policy "Users can delete their own widgets"
  on public.widgets for delete
  using ( auth.uid() = user_id );


-- Policies for Documents
-- 1. Documents are private to the user
create policy "Users can view their own documents"
  on public.documents for select
  using ( auth.uid() = user_id );

create policy "Users can insert their own documents"
  on public.documents for insert
  with check ( auth.uid() = user_id );

create policy "Users can update their own documents"
  on public.documents for update
  using ( auth.uid() = user_id );

create policy "Users can delete their own documents"
  on public.documents for delete
  using ( auth.uid() = user_id );

-- Policies for Document Chunks (inherit from documents preferably, but simple RLS here)
-- We need a join to check ownership, or just rely on the fact that they are managed via documents.
-- A simple way is to use a subquery using document_id.
create policy "Users can view their own document chunks"
  on public.document_chunks for select
  using ( exists (
    select 1 from public.documents 
    where documents.id = document_chunks.document_id 
    and documents.user_id = auth.uid()
  ));

-- Policies for Chat Sessions
-- 1. Anyone can create a chat session (visitors)
create policy "Anyone can insert chat sessions"
  on public.chat_sessions for insert
  with check ( true );

-- 2. Users (Admins) can view sessions for their widgets
create policy "Users can view sessions for their widgets"
  on public.chat_sessions for select
  using ( exists (
    select 1 from public.widgets
    where widgets.widget_key = chat_sessions.widget_key
    and widgets.user_id = auth.uid()
  ));
  
-- Policies for Chat Messages
-- 1. Anyone can insert messages (visitors)
create policy "Anyone can insert chat messages"
  on public.chat_messages for insert
  with check ( true );

-- 2. Users (Admins) can view messages for their sessions
create policy "Users can view messages for their sessions"
  on public.chat_messages for select
  using ( exists (
    select 1 from public.chat_sessions
    join public.widgets on widgets.widget_key = chat_sessions.widget_key
    where chat_sessions.id = chat_messages.session_id
    and widgets.user_id = auth.uid()
  ));
