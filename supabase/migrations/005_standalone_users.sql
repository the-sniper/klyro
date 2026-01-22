-- Remove dependency on auth.users and add password field for standalone auth

-- Drop ALL foreign key constraints that might reference auth.users
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_id_fkey;
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- Add password_hash column for storing hashed passwords
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS password_hash text;

-- Make id auto-generate if not provided (for standalone auth)
ALTER TABLE public.users ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- Create unique constraint on email (drop first if exists)
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_email_unique;
ALTER TABLE public.users ADD CONSTRAINT users_email_unique UNIQUE (email);

-- Update RLS policies to allow service role to insert any user
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert their own user record" ON public.users;

-- Allow inserts via service role (admin client bypasses RLS anyway)
DROP POLICY IF EXISTS "Service role can insert users" ON public.users;
CREATE POLICY "Service role can insert users"
  ON public.users FOR INSERT
  WITH CHECK (true);

-- Drop the trigger that depends on auth.users since we're going standalone
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;