-- Migration 001: Organizations System
-- Create organizations table and basic structure

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

-- organization_settings table
CREATE TABLE IF NOT EXISTS organization_settings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE NOT NULL UNIQUE,
  currency_symbol character varying DEFAULT '$',
  currency_code character varying DEFAULT 'USD',
  date_format character varying DEFAULT 'MM/DD/YYYY',
  time_format character varying DEFAULT '12',
  timezone character varying DEFAULT 'UTC',
  language character varying DEFAULT 'en',
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Add week_start column if it doesn't exist
ALTER TABLE organization_settings ADD COLUMN IF NOT EXISTS week_start integer DEFAULT 1 CHECK (week_start >= 0 AND week_start <= 6);

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