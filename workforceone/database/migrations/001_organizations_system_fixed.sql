-- Migration 001: Organizations System (Fixed)
-- Create organizations table and basic structure
-- This version handles existing tables gracefully

-- organizations table
CREATE TABLE IF NOT EXISTS organizations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name character varying NOT NULL,
  description text,
  website character varying,
  logo_url character varying,
  address character varying,
  city character varying,
  state character varying,
  country character varying,
  postal_code character varying,
  phone character varying,
  email character varying,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Add any missing columns to organizations table
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS name character varying;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS website character varying;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS logo_url character varying;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS address character varying;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS city character varying;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS state character varying;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS country character varying;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS postal_code character varying;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS phone character varying;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS email character varying;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS created_at timestamp with time zone DEFAULT now();
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();

-- organization_settings table
CREATE TABLE IF NOT EXISTS organization_settings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Add unique constraint if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'organization_settings_organization_id_key'
    ) THEN
        ALTER TABLE organization_settings 
        ADD CONSTRAINT organization_settings_organization_id_key UNIQUE (organization_id);
    END IF;
END $$;

-- Add all columns to organization_settings (if they don't exist)
ALTER TABLE organization_settings ADD COLUMN IF NOT EXISTS currency_symbol character varying DEFAULT '$';
ALTER TABLE organization_settings ADD COLUMN IF NOT EXISTS currency_code character varying DEFAULT 'USD';
ALTER TABLE organization_settings ADD COLUMN IF NOT EXISTS date_format character varying DEFAULT 'MM/DD/YYYY';
ALTER TABLE organization_settings ADD COLUMN IF NOT EXISTS time_format character varying DEFAULT '12';
ALTER TABLE organization_settings ADD COLUMN IF NOT EXISTS timezone character varying DEFAULT 'UTC';
ALTER TABLE organization_settings ADD COLUMN IF NOT EXISTS language character varying DEFAULT 'en';
ALTER TABLE organization_settings ADD COLUMN IF NOT EXISTS week_start integer DEFAULT 1;

-- Add check constraint for week_start if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'organization_settings_week_start_check'
    ) THEN
        ALTER TABLE organization_settings 
        ADD CONSTRAINT organization_settings_week_start_check 
        CHECK (week_start >= 0 AND week_start <= 6);
    END IF;
END $$;

-- RLS policies for organizations
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Organization members can view their organization" ON organizations;
DROP POLICY IF EXISTS "Admins can manage organizations" ON organizations;

-- Create RLS policies for organizations
CREATE POLICY "Organization members can view their organization" ON organizations
  FOR SELECT USING (
    id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Admins can manage organizations" ON organizations
  FOR ALL USING (
    id IN (
      SELECT organization_id FROM profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- RLS policies for organization_settings
ALTER TABLE organization_settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Organization members can view settings" ON organization_settings;
DROP POLICY IF EXISTS "Admins can manage settings" ON organization_settings;

-- Create RLS policies for organization_settings
CREATE POLICY "Organization members can view settings" ON organization_settings
  FOR SELECT USING (
    organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Admins can manage settings" ON organization_settings
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'manager')
    )
  );

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_organizations_name ON organizations(name);
CREATE INDEX IF NOT EXISTS idx_organization_settings_organization_id ON organization_settings(organization_id);

-- Add comments
COMMENT ON TABLE organizations IS 'Main organizations table for multi-tenant system';
COMMENT ON TABLE organization_settings IS 'Organization-specific settings and preferences';
COMMENT ON COLUMN organization_settings.week_start IS 'Day of week start (0=Sunday, 1=Monday, etc.)';