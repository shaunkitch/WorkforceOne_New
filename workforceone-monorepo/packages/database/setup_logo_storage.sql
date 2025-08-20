-- Setup Logo Storage for WorkforceOne
-- This script creates the necessary storage bucket and policies for company logos

-- Create the logos storage bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('logos', 'logos', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies for logos bucket

-- Policy: Allow authenticated users to view logos
CREATE POLICY "Public logos are viewable by everyone" ON storage.objects
FOR SELECT USING (bucket_id = 'logos');

-- Policy: Allow admin users to upload logos for their organization
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

-- Policy: Allow admin users to update logos for their organization
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

-- Policy: Allow admin users to delete logos for their organization
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

-- Make sure organizations table RLS allows updates to logo_url by admins
DROP POLICY IF EXISTS "Admin users can update organization logo" ON public.organizations;
CREATE POLICY "Admin users can update organization logo" ON public.organizations
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