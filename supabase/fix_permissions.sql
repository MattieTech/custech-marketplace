-- ====================================================================
-- CUSTECH MARKETPLACE - GRANT ALL TABLE & STORAGE PERMISSIONS
-- Run this in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/flozbereqrooyqmqalnu/sql
-- ====================================================================

-- 1. Grant public schema access to standard Supabase roles
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;

-- 2. Grant permissions on all current tables in public schema
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;

-- 3. Grant permissions on all sequences (auto-incrementing IDs)
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;

-- 4. Grant permissions on all functions and routines
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO postgres, anon, authenticated, service_role;

-- 5. Set default permissions for any new tables created in future
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON ROUTINES TO postgres, anon, authenticated, service_role;

-- 6. Ensure Storage Buckets Exist & Are Accessible
INSERT INTO storage.buckets (id, name, public) VALUES
('listings', 'listings', true),
('listing-images', 'listing-images', true),
('avatars', 'avatars', true),
('verification-documents', 'verification-documents', false),
('dispute-evidence', 'dispute-evidence', false)
ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public;

-- 7. Storage RLS Policies
DROP POLICY IF EXISTS "Public can view listing images" ON storage.objects;
CREATE POLICY "Public can view listing images" ON storage.objects FOR SELECT USING (bucket_id IN ('listings', 'listing-images', 'avatars'));

DROP POLICY IF EXISTS "Authenticated users can upload images" ON storage.objects;
CREATE POLICY "Authenticated users can upload images" ON storage.objects FOR INSERT WITH CHECK (
  auth.role() = 'authenticated' AND bucket_id IN ('listings', 'listing-images', 'avatars', 'verification-documents', 'dispute-evidence')
);

DROP POLICY IF EXISTS "Users can update own uploaded objects" ON storage.objects;
CREATE POLICY "Users can update own uploaded objects" ON storage.objects FOR UPDATE USING (
  auth.role() = 'authenticated'
);
