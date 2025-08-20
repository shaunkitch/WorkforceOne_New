-- Migration 014: Regional and Accounting Settings
-- Add regional settings and accounting configuration for organizations

-- Add regional and accounting settings to organizations table
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS regional_settings JSONB DEFAULT '{
  "region": "US",
  "currency": "USD",
  "currency_symbol": "$",
  "date_format": "MM/dd/yyyy",
  "time_format": "12h",
  "timezone": "America/New_York",
  "language": "en"
}'::jsonb;

ALTER TABLE organizations ADD COLUMN IF NOT EXISTS accounting_settings JSONB DEFAULT '{
  "default_hourly_rate": 15.00,
  "overtime_threshold": 40,
  "overtime_multiplier": 1.5,
  "roles": {
    "member": {
      "hourly_rate": 15.00,
      "overtime_rate": 22.50
    },
    "manager": {
      "hourly_rate": 25.00,
      "overtime_rate": 37.50
    },
    "admin": {
      "hourly_rate": 35.00,
      "overtime_rate": 52.50
    }
  },
  "deductions": {
    "tax_rate": 0.20,
    "benefits": 0.05,
    "other": 0.00
  },
  "payroll_frequency": "bi-weekly"
}'::jsonb;

-- Create organization_settings table for more structured settings management
CREATE TABLE IF NOT EXISTS organization_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL UNIQUE,
  
  -- Regional Settings
  region VARCHAR(10) DEFAULT 'US',
  currency_code VARCHAR(3) DEFAULT 'USD',
  currency_symbol VARCHAR(5) DEFAULT '$',
  date_format VARCHAR(20) DEFAULT 'MM/dd/yyyy',
  time_format VARCHAR(5) DEFAULT '12h',
  timezone VARCHAR(50) DEFAULT 'America/New_York',
  language VARCHAR(5) DEFAULT 'en',
  
  -- Accounting Settings
  default_hourly_rate DECIMAL(10,2) DEFAULT 15.00,
  overtime_threshold INTEGER DEFAULT 40,
  overtime_multiplier DECIMAL(3,2) DEFAULT 1.5,
  
  -- Role-based rates
  member_hourly_rate DECIMAL(10,2) DEFAULT 15.00,
  manager_hourly_rate DECIMAL(10,2) DEFAULT 25.00,
  admin_hourly_rate DECIMAL(10,2) DEFAULT 35.00,
  
  -- Deduction settings
  tax_rate DECIMAL(5,4) DEFAULT 0.2000,
  benefits_rate DECIMAL(5,4) DEFAULT 0.0500,
  other_deductions_rate DECIMAL(5,4) DEFAULT 0.0000,
  
  -- Payroll settings
  payroll_frequency VARCHAR(20) DEFAULT 'bi-weekly',
  pay_period_start_day INTEGER DEFAULT 1, -- Monday = 1
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default settings for existing organizations
INSERT INTO organization_settings (organization_id)
SELECT id FROM organizations
WHERE id NOT IN (SELECT organization_id FROM organization_settings);

-- Enable RLS
ALTER TABLE organization_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for organization_settings
CREATE POLICY "Organizations can view their settings" ON organization_settings
  FOR SELECT USING (organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Admins can manage organization settings" ON organization_settings
  FOR ALL USING (organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid()) AND 
                 (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_organization_settings_org_id ON organization_settings(organization_id);

-- Update function to automatically create settings for new organizations
CREATE OR REPLACE FUNCTION create_default_organization_settings()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO organization_settings (organization_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new organizations
DROP TRIGGER IF EXISTS trigger_create_organization_settings ON organizations;
CREATE TRIGGER trigger_create_organization_settings
  AFTER INSERT ON organizations
  FOR EACH ROW EXECUTE FUNCTION create_default_organization_settings();

-- Regional presets for common countries
CREATE TABLE IF NOT EXISTS regional_presets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  country_code VARCHAR(2) NOT NULL,
  country_name VARCHAR(100) NOT NULL,
  region VARCHAR(10) NOT NULL,
  currency_code VARCHAR(3) NOT NULL,
  currency_symbol VARCHAR(5) NOT NULL,
  date_format VARCHAR(20) NOT NULL,
  time_format VARCHAR(5) NOT NULL,
  timezone VARCHAR(50) NOT NULL,
  language VARCHAR(5) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert common regional presets
INSERT INTO regional_presets (country_code, country_name, region, currency_code, currency_symbol, date_format, time_format, timezone, language) VALUES
('US', 'United States', 'US', 'USD', '$', 'MM/dd/yyyy', '12h', 'America/New_York', 'en'),
('CA', 'Canada', 'CA', 'CAD', 'C$', 'dd/MM/yyyy', '12h', 'America/Toronto', 'en'),
('GB', 'United Kingdom', 'GB', 'GBP', '£', 'dd/MM/yyyy', '24h', 'Europe/London', 'en'),
('AU', 'Australia', 'AU', 'AUD', 'A$', 'dd/MM/yyyy', '12h', 'Australia/Sydney', 'en'),
('ZA', 'South Africa', 'ZA', 'ZAR', 'R', 'yyyy/MM/dd', '24h', 'Africa/Johannesburg', 'en'),
('DE', 'Germany', 'DE', 'EUR', '€', 'dd.MM.yyyy', '24h', 'Europe/Berlin', 'de'),
('FR', 'France', 'FR', 'EUR', '€', 'dd/MM/yyyy', '24h', 'Europe/Paris', 'fr'),
('IN', 'India', 'IN', 'INR', '₹', 'dd/MM/yyyy', '12h', 'Asia/Kolkata', 'en'),
('JP', 'Japan', 'JP', 'JPY', '¥', 'yyyy/MM/dd', '24h', 'Asia/Tokyo', 'ja'),
('BR', 'Brazil', 'BR', 'BRL', 'R$', 'dd/MM/yyyy', '24h', 'America/Sao_Paulo', 'pt'),
('MX', 'Mexico', 'MX', 'MXN', '$', 'dd/MM/yyyy', '12h', 'America/Mexico_City', 'es'),
('SG', 'Singapore', 'SG', 'SGD', 'S$', 'dd/MM/yyyy', '12h', 'Asia/Singapore', 'en'),
('NZ', 'New Zealand', 'NZ', 'NZD', 'NZ$', 'dd/MM/yyyy', '12h', 'Pacific/Auckland', 'en'),
('NL', 'Netherlands', 'NL', 'EUR', '€', 'dd-MM-yyyy', '24h', 'Europe/Amsterdam', 'nl'),
('SE', 'Sweden', 'SE', 'SEK', 'kr', 'yyyy-MM-dd', '24h', 'Europe/Stockholm', 'sv');

-- Grant permissions
GRANT SELECT ON regional_presets TO authenticated;
GRANT EXECUTE ON FUNCTION create_default_organization_settings TO authenticated;