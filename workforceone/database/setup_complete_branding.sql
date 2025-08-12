-- Complete Branding Setup for WorkforceOne
-- Run this script to set up all necessary database changes for the logo upload feature

-- 1. Ensure organizations table has all required columns
ALTER TABLE public.organizations 
ADD COLUMN IF NOT EXISTS logo_url TEXT;

ALTER TABLE public.organizations
ADD COLUMN IF NOT EXISTS feature_flags JSONB DEFAULT '{}'::jsonb;

ALTER TABLE public.organizations
ADD COLUMN IF NOT EXISTS name VARCHAR(255);

-- Update any existing organizations without names
UPDATE public.organizations 
SET name = 'My Organization' 
WHERE name IS NULL OR name = '';

-- Make name required
ALTER TABLE public.organizations 
ALTER COLUMN name SET NOT NULL;

-- 2. Create storage bucket for logos (if not exists)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('logos', 'logos', true)
ON CONFLICT (id) DO NOTHING;

-- 3. Set up storage policies for logos bucket

-- Remove existing policies if they exist
DROP POLICY IF EXISTS "Public logos are viewable by everyone" ON storage.objects;
DROP POLICY IF EXISTS "Admin users can upload logos for their organization" ON storage.objects;
DROP POLICY IF EXISTS "Admin users can update logos for their organization" ON storage.objects;
DROP POLICY IF EXISTS "Admin users can delete logos for their organization" ON storage.objects;

-- Create new policies
CREATE POLICY "Public logos are viewable by everyone" ON storage.objects
FOR SELECT USING (bucket_id = 'logos');

CREATE POLICY "Admin users can upload logos for their organization" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'logos' AND
  auth.role() = 'authenticated' AND
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

CREATE POLICY "Admin users can update logos for their organization" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'logos' AND
  auth.role() = 'authenticated' AND
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

CREATE POLICY "Admin users can delete logos for their organization" ON storage.objects
FOR DELETE USING (
  bucket_id = 'logos' AND
  auth.role() = 'authenticated' AND
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- 4. Set up RLS policies for organizations table updates

-- Remove existing policy if it exists
DROP POLICY IF EXISTS "Admin users can update organization logo" ON public.organizations;
DROP POLICY IF EXISTS "Admin users can update organization" ON public.organizations;
DROP POLICY IF EXISTS "Users can view their organization" ON public.organizations;

-- Create comprehensive organization policies
CREATE POLICY "Users can view their organization" ON public.organizations
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.organization_id = organizations.id
  )
);

CREATE POLICY "Admin users can update organization" ON public.organizations
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.organization_id = organizations.id
    AND profiles.role = 'admin'
  )
) WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.organization_id = organizations.id
    AND profiles.role = 'admin'
  )
);

-- 5. Create helpful indexes
CREATE INDEX IF NOT EXISTS idx_organizations_logo_url ON public.organizations(logo_url);
CREATE INDEX IF NOT EXISTS idx_organizations_name ON public.organizations(name);

-- 6. Add comments for documentation
COMMENT ON COLUMN public.organizations.logo_url IS 'URL to the organization logo stored in Supabase Storage';
COMMENT ON COLUMN public.organizations.feature_flags IS 'JSON object containing feature flags for the organization';
COMMENT ON COLUMN public.organizations.name IS 'Display name for the organization';

-- 7. Verify setup by showing current structure
SELECT 
  column_name, 
  data_type, 
  is_nullable, 
  column_default
FROM information_schema.columns 
WHERE table_name = 'organizations' 
  AND table_schema = 'public'
ORDER BY ordinal_position;