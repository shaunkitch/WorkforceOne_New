-- Migration: 081_unified_product_system.sql
-- Purpose: Create unified product system for one app supporting multiple products
-- Date: 2025-01-20

-- Create product_invitations table for QR code invitations
CREATE TABLE IF NOT EXISTS product_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invitation_code TEXT UNIQUE NOT NULL,
    invited_name TEXT NOT NULL,
    invited_email TEXT,
    invited_phone TEXT,
    products TEXT[] NOT NULL, -- Array of product IDs user will get access to
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'revoked')),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
    accepted_at TIMESTAMP WITH TIME ZONE,
    accepted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    metadata JSONB DEFAULT '{}', -- Store additional invitation data (site assignment, access level, etc.)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_product_invitations_code ON product_invitations(invitation_code);
CREATE INDEX IF NOT EXISTS idx_product_invitations_status ON product_invitations(status);
CREATE INDEX IF NOT EXISTS idx_product_invitations_org ON product_invitations(organization_id);
CREATE INDEX IF NOT EXISTS idx_product_invitations_expires ON product_invitations(expires_at);

-- Add products column to profiles table if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'products') THEN
        ALTER TABLE profiles ADD COLUMN products TEXT[] DEFAULT '{}';
    END IF;
END $$;

-- Add app_preferences column for storing user app preferences
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'profiles' AND column_name = 'app_preferences') THEN
        ALTER TABLE profiles ADD COLUMN app_preferences JSONB DEFAULT '{}';
    END IF;
END $$;

-- Create product_access_logs table for tracking product usage
CREATE TABLE IF NOT EXISTS product_access_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    product_id TEXT NOT NULL,
    action TEXT NOT NULL, -- 'login', 'feature_access', 'logout', etc.
    session_id TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for product access logs
CREATE INDEX IF NOT EXISTS idx_product_access_logs_user ON product_access_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_product_access_logs_org ON product_access_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_product_access_logs_product ON product_access_logs(product_id);
CREATE INDEX IF NOT EXISTS idx_product_access_logs_created ON product_access_logs(created_at);

-- RLS policies for product_invitations
ALTER TABLE product_invitations ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view invitations for their organization
CREATE POLICY "Users can view organization invitations" ON product_invitations
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id FROM profiles WHERE user_id = auth.uid()
        )
        OR accepted_by = auth.uid()
    );

-- Policy: Admins can create invitations
CREATE POLICY "Admins can create invitations" ON product_invitations
    FOR INSERT WITH CHECK (
        organization_id IN (
            SELECT organization_id FROM profiles 
            WHERE user_id = auth.uid() 
            AND (role = 'admin' OR role = 'manager')
        )
    );

-- Policy: Admins can update invitations
CREATE POLICY "Admins can update invitations" ON product_invitations
    FOR UPDATE USING (
        organization_id IN (
            SELECT organization_id FROM profiles 
            WHERE user_id = auth.uid() 
            AND (role = 'admin' OR role = 'manager')
        )
        OR accepted_by = auth.uid()
    );

-- RLS policies for product_access_logs
ALTER TABLE product_access_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own access logs
CREATE POLICY "Users can view own access logs" ON product_access_logs
    FOR SELECT USING (user_id = auth.uid());

-- Policy: System can insert access logs
CREATE POLICY "System can insert access logs" ON product_access_logs
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- Function to accept product invitation
CREATE OR REPLACE FUNCTION accept_product_invitation(invitation_code_param TEXT, user_email_param TEXT)
RETURNS JSON AS $$
DECLARE
    invitation_record product_invitations;
    user_record auth.users;
    result JSON;
BEGIN
    -- Get the invitation
    SELECT * INTO invitation_record 
    FROM product_invitations 
    WHERE invitation_code = invitation_code_param 
    AND status = 'pending' 
    AND expires_at > NOW();
    
    IF NOT FOUND THEN
        RETURN JSON_BUILD_OBJECT('success', false, 'error', 'Invalid or expired invitation');
    END IF;
    
    -- Get the user by email
    SELECT * INTO user_record 
    FROM auth.users 
    WHERE email = user_email_param;
    
    IF NOT FOUND THEN
        RETURN JSON_BUILD_OBJECT('success', false, 'error', 'User not found');
    END IF;
    
    -- Update user profile with new products
    UPDATE profiles 
    SET 
        products = array_cat(
            COALESCE(products, '{}'), 
            invitation_record.products
        ),
        organization_id = COALESCE(organization_id, invitation_record.organization_id),
        updated_at = NOW()
    WHERE user_id = user_record.id;
    
    -- Mark invitation as accepted
    UPDATE product_invitations 
    SET 
        status = 'accepted',
        accepted_at = NOW(),
        accepted_by = user_record.id,
        updated_at = NOW()
    WHERE id = invitation_record.id;
    
    -- Log the access
    INSERT INTO product_access_logs (user_id, organization_id, product_id, action, metadata)
    SELECT 
        user_record.id,
        invitation_record.organization_id,
        unnest(invitation_record.products),
        'invitation_accepted',
        JSON_BUILD_OBJECT('invitation_id', invitation_record.id, 'invitation_code', invitation_code_param);
    
    RETURN JSON_BUILD_OBJECT(
        'success', true, 
        'products', invitation_record.products,
        'organization_id', invitation_record.organization_id,
        'metadata', invitation_record.metadata
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check user product access
CREATE OR REPLACE FUNCTION check_user_product_access(product_id_param TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    has_access BOOLEAN DEFAULT FALSE;
BEGIN
    SELECT 
        CASE 
            WHEN product_id_param = ANY(products) THEN TRUE
            ELSE FALSE
        END INTO has_access
    FROM profiles 
    WHERE user_id = auth.uid();
    
    RETURN COALESCE(has_access, FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user products
CREATE OR REPLACE FUNCTION get_user_products()
RETURNS TEXT[] AS $$
DECLARE
    user_products TEXT[];
BEGIN
    SELECT COALESCE(products, '{}') INTO user_products
    FROM profiles 
    WHERE user_id = auth.uid();
    
    RETURN user_products;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_product_invitations_updated_at 
    BEFORE UPDATE ON product_invitations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON product_invitations TO authenticated;
GRANT ALL ON product_access_logs TO authenticated;
GRANT EXECUTE ON FUNCTION accept_product_invitation(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION check_user_product_access(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_products() TO authenticated;

-- Insert some sample product types
INSERT INTO product_invitations (invitation_code, invited_name, invited_email, products, organization_id, created_by, metadata, status)
VALUES 
    ('DEMO-MAIN-001', 'Demo Admin User', 'admin@demo.com', '{"workforce-management"}', null, null, 
     '{"role": "admin", "access_level": "full"}', 'accepted'),
    ('DEMO-TIME-001', 'Demo Time User', 'time@demo.com', '{"time-tracker"}', null, null,
     '{"role": "employee", "department": "operations"}', 'accepted'),
    ('DEMO-GUARD-001', 'Demo Guard User', 'guard@demo.com', '{"guard-management"}', null, null,
     '{"role": "guard", "site": "Demo Site", "access_level": "basic"}', 'accepted'),
    ('DEMO-ALL-001', 'Demo Super User', 'super@demo.com', '{"workforce-management", "time-tracker", "guard-management"}', null, null,
     '{"role": "super_admin", "access_level": "full"}', 'accepted')
ON CONFLICT (invitation_code) DO NOTHING;