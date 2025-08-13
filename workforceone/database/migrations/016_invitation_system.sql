-- Migration 016: Company Invitation System
-- Redesign user registration to use invitation-based company access

-- Company Invitations table
CREATE TABLE IF NOT EXISTS company_invitations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  invited_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  email VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'member' CHECK (role IN ('admin', 'manager', 'member')),
  department VARCHAR(100),
  invitation_token UUID DEFAULT gen_random_uuid() UNIQUE NOT NULL,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled')),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days'),
  accepted_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  personal_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Organization Signup Settings table
CREATE TABLE IF NOT EXISTS organization_signup_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL UNIQUE,
  allow_open_signup BOOLEAN DEFAULT FALSE,
  require_email_domain BOOLEAN DEFAULT FALSE,
  allowed_email_domains TEXT[], -- Array of allowed domains like ['company.com', 'subsidiary.org']
  auto_approve_domains TEXT[], -- Domains that get auto-approved
  default_role VARCHAR(50) DEFAULT 'member' CHECK (default_role IN ('admin', 'manager', 'member')),
  require_admin_approval BOOLEAN DEFAULT TRUE,
  invitation_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Signup Requests table (for open signup scenarios)
CREATE TABLE IF NOT EXISTS signup_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  company_name VARCHAR(255) NOT NULL,
  company_size VARCHAR(50), -- 'small', 'medium', 'large', 'enterprise'
  phone_number VARCHAR(20),
  job_title VARCHAR(100),
  use_case TEXT,
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  notes TEXT,
  reviewed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  trial_expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '14 days'),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_company_invitations_token ON company_invitations(invitation_token);
CREATE INDEX IF NOT EXISTS idx_company_invitations_email ON company_invitations(email);
CREATE INDEX IF NOT EXISTS idx_company_invitations_org_status ON company_invitations(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_company_invitations_expires ON company_invitations(expires_at) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_signup_requests_email ON signup_requests(email);
CREATE INDEX IF NOT EXISTS idx_signup_requests_status ON signup_requests(status);

-- Enable RLS
ALTER TABLE company_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_signup_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE signup_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies for company_invitations
CREATE POLICY "Organization members can view their invitations" ON company_invitations
  FOR SELECT USING (
    organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid()) OR
    email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

CREATE POLICY "Admins and managers can manage invitations" ON company_invitations
  FOR ALL USING (
    organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid()) AND
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'manager')
  );

-- RLS Policies for organization_signup_settings
CREATE POLICY "Organization admins can manage signup settings" ON organization_signup_settings
  FOR ALL USING (
    organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid()) AND
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

-- RLS Policies for signup_requests (system admins only)
CREATE POLICY "System access for signup requests" ON signup_requests
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'system_admin')
  );

-- Function to automatically expire old invitations
CREATE OR REPLACE FUNCTION expire_old_invitations()
RETURNS void AS $$
BEGIN
  UPDATE company_invitations 
  SET status = 'expired', updated_at = NOW()
  WHERE status = 'pending' 
    AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if email domain is allowed for organization
CREATE OR REPLACE FUNCTION is_email_domain_allowed(
  p_email VARCHAR(255),
  p_organization_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
  email_domain TEXT;
  settings_rec RECORD;
BEGIN
  -- Extract domain from email
  email_domain := LOWER(SPLIT_PART(p_email, '@', 2));
  
  -- Get organization signup settings
  SELECT * INTO settings_rec 
  FROM organization_signup_settings 
  WHERE organization_id = p_organization_id;
  
  -- If no settings, default to not allowed
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- If email domain restriction is disabled, allow all
  IF NOT settings_rec.require_email_domain THEN
    RETURN TRUE;
  END IF;
  
  -- Check if domain is in allowed list
  RETURN email_domain = ANY(settings_rec.allowed_email_domains);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to send invitation email (placeholder for external email service)
CREATE OR REPLACE FUNCTION send_invitation_email(
  p_invitation_id UUID
) RETURNS BOOLEAN AS $$
DECLARE
  invitation_rec RECORD;
  org_rec RECORD;
  inviter_rec RECORD;
BEGIN
  -- Get invitation details
  SELECT ci.*, o.name as org_name, o.logo_url
  INTO invitation_rec
  FROM company_invitations ci
  JOIN organizations o ON ci.organization_id = o.id
  WHERE ci.id = p_invitation_id;
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- Get inviter details
  SELECT full_name, email INTO inviter_rec
  FROM profiles 
  WHERE id = invitation_rec.invited_by;
  
  -- Log the email sending (in real implementation, this would call an external email service)
  INSERT INTO system_logs (
    log_type, 
    message, 
    metadata,
    created_at
  ) VALUES (
    'invitation_email',
    'Invitation email sent',
    jsonb_build_object(
      'invitation_id', p_invitation_id,
      'recipient_email', invitation_rec.email,
      'organization_name', invitation_rec.org_name,
      'inviter_name', inviter_rec.full_name,
      'role', invitation_rec.role,
      'token', invitation_rec.invitation_token
    ),
    NOW()
  );
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create user from invitation
CREATE OR REPLACE FUNCTION accept_invitation(
  p_token UUID,
  p_user_id UUID,
  p_full_name VARCHAR(255)
) RETURNS BOOLEAN AS $$
DECLARE
  invitation_rec RECORD;
BEGIN
  -- Get and validate invitation
  SELECT * INTO invitation_rec
  FROM company_invitations
  WHERE invitation_token = p_token
    AND status = 'pending'
    AND expires_at > NOW();
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- Create user profile
  INSERT INTO profiles (
    id,
    email,
    full_name,
    role,
    department,
    organization_id,
    is_active,
    created_at
  ) VALUES (
    p_user_id,
    invitation_rec.email,
    p_full_name,
    invitation_rec.role,
    invitation_rec.department,
    invitation_rec.organization_id,
    TRUE,
    NOW()
  );
  
  -- Mark invitation as accepted
  UPDATE company_invitations
  SET 
    status = 'accepted',
    accepted_at = NOW(),
    updated_at = NOW()
  WHERE id = invitation_rec.id;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create system_logs table if it doesn't exist (for tracking invitation emails)
CREATE TABLE IF NOT EXISTS system_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  log_type VARCHAR(100) NOT NULL,
  message TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default signup settings for existing organizations
INSERT INTO organization_signup_settings (organization_id)
SELECT id FROM organizations
WHERE id NOT IN (SELECT organization_id FROM organization_signup_settings)
ON CONFLICT (organization_id) DO NOTHING;

-- Create trigger to automatically send invitation emails
CREATE OR REPLACE FUNCTION trigger_send_invitation_email()
RETURNS TRIGGER AS $$
BEGIN
  -- Only send email for new pending invitations
  IF NEW.status = 'pending' AND (OLD IS NULL OR OLD.status != 'pending') THEN
    PERFORM send_invitation_email(NEW.id);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_invitation_email
  AFTER INSERT OR UPDATE ON company_invitations
  FOR EACH ROW EXECUTE FUNCTION trigger_send_invitation_email();

-- Grant permissions
GRANT EXECUTE ON FUNCTION expire_old_invitations TO authenticated;
GRANT EXECUTE ON FUNCTION is_email_domain_allowed TO authenticated;
GRANT EXECUTE ON FUNCTION send_invitation_email TO authenticated;
GRANT EXECUTE ON FUNCTION accept_invitation TO authenticated;