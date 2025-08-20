-- Logo and Branding Setup Migration
-- Ensures organizations table has the necessary columns for logo functionality

-- Add logo_url column if it doesn't exist
ALTER TABLE public.organizations 
ADD COLUMN IF NOT EXISTS logo_url TEXT;

-- Add feature_flags column if it doesn't exist
ALTER TABLE public.organizations
ADD COLUMN IF NOT EXISTS feature_flags JSONB DEFAULT '{}'::jsonb;

-- Add name column if it doesn't exist (for custom organization names)
ALTER TABLE public.organizations
ADD COLUMN IF NOT EXISTS name VARCHAR(255);

-- Update any existing organizations without names
UPDATE public.organizations 
SET name = 'WorkforceOne Organization' 
WHERE name IS NULL OR name = '';

-- Make name required going forward
ALTER TABLE public.organizations 
ALTER COLUMN name SET NOT NULL;

-- Ensure we have proper indexes
CREATE INDEX IF NOT EXISTS idx_organizations_logo_url ON public.organizations(logo_url);
CREATE INDEX IF NOT EXISTS idx_organizations_name ON public.organizations(name);

-- Add helpful comment
COMMENT ON COLUMN public.organizations.logo_url IS 'URL to the organization logo stored in Supabase Storage';
COMMENT ON COLUMN public.organizations.feature_flags IS 'JSON object containing feature flags for the organization';
COMMENT ON COLUMN public.organizations.name IS 'Display name for the organization';