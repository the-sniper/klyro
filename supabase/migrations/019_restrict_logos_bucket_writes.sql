-- Take anon write access away from the logos bucket.
--
-- Migration 015 granted INSERT, UPDATE and DELETE on storage.objects to both
-- `authenticated` and `anon`, with the comment "or anon for now to ensure it
-- works" and "We use a broader policy to ensure the RLS isn't the blocker".
-- The anon key ships in the browser bundle of every page that loads Supabase,
-- so in practice anyone could upload into the bucket, overwrite any customer's
-- logo, or delete all of them.
--
-- Note this app does not use Supabase Auth: sessions are a custom signed
-- cookie, so the browser client is always the `anon` role and never
-- `authenticated`. Granting writes to `authenticated` instead would therefore
-- have broken uploads without securing anything. Uploads now go through
-- POST /api/widget/logo, which checks the session and writes with the service
-- role, so the bucket needs no client-side write access at all.

-- Replace the permissive policies from 015.
DROP POLICY IF EXISTS "Public Read" ON storage.objects;
DROP POLICY IF EXISTS "Enable Upload" ON storage.objects;
DROP POLICY IF EXISTS "Enable Update" ON storage.objects;
DROP POLICY IF EXISTS "Enable Delete" ON storage.objects;

-- Logos stay publicly readable: they render in the widget on customer sites.
CREATE POLICY "logos_public_read"
ON storage.objects FOR SELECT
USING (bucket_id = 'logos');

-- Writes are service-role only. service_role bypasses RLS in Supabase, so
-- these are belt and braces; the security comes from no anon or authenticated
-- write policy existing on this bucket.
CREATE POLICY "logos_service_role_insert"
ON storage.objects FOR INSERT
TO service_role
WITH CHECK (bucket_id = 'logos');

CREATE POLICY "logos_service_role_update"
ON storage.objects FOR UPDATE
TO service_role
USING (bucket_id = 'logos')
WITH CHECK (bucket_id = 'logos');

CREATE POLICY "logos_service_role_delete"
ON storage.objects FOR DELETE
TO service_role
USING (bucket_id = 'logos');
