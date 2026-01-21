-- Rename profiles table to users
ALTER TABLE public.profiles RENAME TO users;

-- Update the handle_new_user function to insert into users instead of profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, avatar_url)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Rename policies on the users table (previously profiles) to reflect the new table name
-- Note: Policies themselves are attached to the table, but their names might be confusing if they say "profile"
-- We will drop and recreate them to be clean.

DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.users;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;

create policy "Public users are viewable by everyone"
  on public.users for select
  using ( true );

create policy "Users can insert their own user record"
  on public.users for insert
  with check ( auth.uid() = id );

create policy "Users can update their own user record"
  on public.users for update
  using ( auth.uid() = id );
