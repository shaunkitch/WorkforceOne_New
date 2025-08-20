-- Create product_invitations table manually
-- This is needed for the mobile app QR invitation system

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

-- Create RLS policies for product_invitations
ALTER TABLE product_invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view invitations for their email" ON product_invitations
  FOR SELECT USING (
    user_email = auth.email() OR 
    created_by = auth.uid()
  );

CREATE POLICY "Authenticated users can create invitations" ON product_invitations
  FOR INSERT WITH CHECK (auth.uid() = created_by);

-- Create RLS policies for user_products
ALTER TABLE user_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own products" ON user_products
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own products" ON user_products
  FOR INSERT WITH CHECK (auth.uid() = user_id);

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
    INSERT INTO user_products (user_id, product_id, granted_by)
    VALUES (user_profile.id, product_id, invitation_record.created_by)
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
CREATE INDEX IF NOT EXISTS idx_product_invitations_code ON product_invitations(invitation_code);
CREATE INDEX IF NOT EXISTS idx_user_products_user_date ON user_products(user_id, created_at DESC);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON product_invitations TO authenticated;
GRANT SELECT, INSERT, UPDATE ON user_products TO authenticated;

-- Insert default products for existing users (optional)
INSERT INTO user_products (user_id, product_id)
SELECT id, 'workforce-management'
FROM profiles
WHERE NOT EXISTS (
  SELECT 1 FROM user_products WHERE user_id = profiles.id AND product_id = 'workforce-management'
);