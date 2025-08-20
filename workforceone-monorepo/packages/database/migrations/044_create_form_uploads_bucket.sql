-- Create storage bucket for form uploads
-- This migration creates a public bucket for storing form files like signatures, photos, and documents

-- Enable the storage extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- IMPORTANT: Storage bucket must be created manually in Supabase Dashboard
-- Instructions:
-- 1. Go to Storage section in Supabase Dashboard
-- 2. Click "New Bucket"
-- 3. Create bucket with these settings:
--    - Name: form-uploads
--    - Public: Yes (for easier access to uploaded files)
--    - File size limit: 50MB
--    - Allowed MIME types: image/*, application/pdf, text/plain, text/csv

-- Create a table to track form file uploads (optional, for better tracking)
CREATE TABLE IF NOT EXISTS public.form_file_uploads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    form_response_id UUID REFERENCES form_responses(id) ON DELETE CASCADE,
    field_id TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    file_size BIGINT,
    file_type TEXT,
    uploaded_by UUID REFERENCES auth.users(id),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_form_file_uploads_response ON public.form_file_uploads(form_response_id);
CREATE INDEX IF NOT EXISTS idx_form_file_uploads_user ON public.form_file_uploads(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_form_file_uploads_org ON public.form_file_uploads(organization_id);

-- Enable RLS
ALTER TABLE public.form_file_uploads ENABLE ROW LEVEL SECURITY;

-- RLS Policies for form_file_uploads table
-- Users can view files from their organization
CREATE POLICY "Users can view organization files"
ON public.form_file_uploads FOR SELECT
TO authenticated
USING (
    organization_id IN (
        SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
);

-- Users can upload files to their organization
CREATE POLICY "Users can upload files"
ON public.form_file_uploads FOR INSERT
TO authenticated
WITH CHECK (
    organization_id IN (
        SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
);

-- Users can delete their own uploads
CREATE POLICY "Users can delete own uploads"
ON public.form_file_uploads FOR DELETE
TO authenticated
USING (uploaded_by = auth.uid());

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_form_file_uploads_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_form_file_uploads_updated_at
BEFORE UPDATE ON public.form_file_uploads
FOR EACH ROW
EXECUTE FUNCTION update_form_file_uploads_updated_at();

-- Add comment for documentation
COMMENT ON TABLE public.form_file_uploads IS 'Tracks file uploads associated with form responses including signatures, photos, and documents';

-- Storage bucket must be created manually in Supabase Dashboard
-- After creating the bucket, you can set storage policies through the Supabase UI