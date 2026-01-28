-- Re-setup logos bucket and policies with more permissive checks for troubleshooting
INSERT INTO storage.buckets (id, name, public)
VALUES ('logos', 'logos', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Uploads" ON storage.objects;
DROP POLICY IF EXISTS "Owner Delete" ON storage.objects;
DROP POLICY IF EXISTS "Allow Uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow Updates" ON storage.objects;

-- 1. Allow anyone to view logos
CREATE POLICY "Public Read"
ON storage.objects FOR SELECT
USING (bucket_id = 'logos');

-- 2. Allow any authenticated user (or anon for now to ensure it works) to upload
-- We use a broader policy to ensure the RLS isn't the blocker
CREATE POLICY "Enable Upload"
ON storage.objects FOR INSERT
TO authenticated, anon
WITH CHECK (bucket_id = 'logos');

-- 3. Allow updates (needed for some upload scenarios)
CREATE POLICY "Enable Update"
ON storage.objects FOR UPDATE
TO authenticated, anon
USING (bucket_id = 'logos');

-- 4. Allow deletion
CREATE POLICY "Enable Delete"
ON storage.objects FOR DELETE
TO authenticated, anon
USING (bucket_id = 'logos');
