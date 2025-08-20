-- Mobile App Support Migration
-- This creates tables and functions needed for the mobile app

-- Create user_products table for multi-product access
CREATE TABLE IF NOT EXISTS user_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  granted_by UUID REFERENCES profiles(id),
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create product_invitations table if it doesn't exist
CREATE TABLE IF NOT EXISTS product_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invitation_code TEXT UNIQUE NOT NULL,
  products TEXT[] NOT NULL,
  created_by UUID REFERENCES profiles(id),
  user_email TEXT,
  organization_id UUID REFERENCES organizations(id),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'revoked')),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
  accepted_at TIMESTAMP WITH TIME ZONE,
  accepted_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create mobile check-ins table for guard management
CREATE TABLE IF NOT EXISTS mobile_checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  site_id TEXT NOT NULL,
  site_name TEXT NOT NULL,
  check_type TEXT NOT NULL CHECK (check_type IN ('check-in', 'check-out')),
  location_lat DECIMAL(10, 8),
  location_lng DECIMAL(11, 8),
  location_address TEXT,
  qr_code_data JSONB,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create incident_reports table for mobile incident reporting
CREATE TABLE IF NOT EXISTS incident_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id),
  incident_type TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  location_lat DECIMAL(10, 8),
  location_lng DECIMAL(11, 8),
  location_address TEXT,
  photos TEXT[], -- Array of photo URLs/paths
  status TEXT DEFAULT 'submitted' CHECK (status IN ('draft', 'submitted', 'investigating', 'resolved')),
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create time_entries table for mobile time tracking
CREATE TABLE IF NOT EXISTS mobile_time_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id),
  project_id TEXT NOT NULL,
  project_name TEXT NOT NULL,
  task_name TEXT NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE,
  duration_seconds INTEGER,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create RLS policies for user_products
ALTER TABLE user_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own products" ON user_products
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own products" ON user_products
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for mobile_checkins
ALTER TABLE mobile_checkins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own checkins" ON mobile_checkins
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own checkins" ON mobile_checkins
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for incident_reports
ALTER TABLE incident_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own incident reports" ON incident_reports
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own incident reports" ON incident_reports
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own incident reports" ON incident_reports
  FOR UPDATE USING (auth.uid() = user_id);

-- Create RLS policies for mobile_time_entries
ALTER TABLE mobile_time_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own time entries" ON mobile_time_entries
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own time entries" ON mobile_time_entries
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own time entries" ON mobile_time_entries
  FOR UPDATE USING (auth.uid() = user_id);

-- Create RLS policies for product_invitations
ALTER TABLE product_invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view invitations for their email" ON product_invitations
  FOR SELECT USING (
    user_email = auth.email() OR 
    created_by = auth.uid()
  );

-- Function to accept product invitation
CREATE OR REPLACE FUNCTION accept_product_invitation(
  invitation_code_param TEXT,
  user_email_param TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  invitation_record RECORD;
  user_profile RECORD;
  product_id TEXT;
  result JSONB;
BEGIN
  -- Get the invitation
  SELECT * INTO invitation_record
  FROM product_invitations
  WHERE invitation_code = invitation_code_param
    AND status = 'pending'
    AND expires_at > NOW();

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid or expired invitation code');
  END IF;

  -- Get the user profile
  SELECT * INTO user_profile
  FROM profiles
  WHERE id = auth.uid();

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'User not found');
  END IF;

  -- Grant access to each product in the invitation
  FOREACH product_id IN ARRAY invitation_record.products
  LOOP
    INSERT INTO user_products (user_id, product_id, granted_by, organization_id)
    VALUES (user_profile.id, product_id, invitation_record.created_by, invitation_record.organization_id)
    ON CONFLICT (user_id, product_id) DO NOTHING;
  END LOOP;

  -- Mark invitation as accepted
  UPDATE product_invitations
  SET status = 'accepted',
      accepted_at = NOW(),
      accepted_by = user_profile.id
  WHERE id = invitation_record.id;

  RETURN jsonb_build_object(
    'success', true,
    'products', invitation_record.products,
    'message', 'Successfully joined ' || array_to_string(invitation_record.products, ', ')
  );
END;
$$;

-- Add unique constraint to prevent duplicate product access
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_products_unique 
ON user_products(user_id, product_id) 
WHERE is_active = true;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_mobile_checkins_user_date ON mobile_checkins(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_incident_reports_user_date ON incident_reports(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_mobile_time_entries_user_date ON mobile_time_entries(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_product_invitations_code ON product_invitations(invitation_code);

-- Insert default products for existing users (optional)
INSERT INTO user_products (user_id, product_id)
SELECT id, 'workforce-management'
FROM profiles
WHERE NOT EXISTS (
  SELECT 1 FROM user_products WHERE user_id = profiles.id AND product_id = 'workforce-management'
);

COMMENT ON TABLE user_products IS 'Tracks which products each user has access to';
COMMENT ON TABLE product_invitations IS 'QR code invitations for product access';
COMMENT ON TABLE mobile_checkins IS 'Guard check-ins from mobile app';
COMMENT ON TABLE incident_reports IS 'Security incident reports from mobile app';
COMMENT ON TABLE mobile_time_entries IS 'Time tracking entries from mobile app';