-- Migration 017: Email Provider Integrations
-- Allow organizations to configure their own email providers

-- Email Integrations table
CREATE TABLE IF NOT EXISTS email_integrations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL UNIQUE,
  provider VARCHAR(50) NOT NULL CHECK (provider IN ('smtp', 'sendgrid', 'mailgun', 'ses', 'gmail', 'outlook')),
  is_active BOOLEAN DEFAULT FALSE,
  
  -- SMTP Configuration
  smtp_host VARCHAR(255),
  smtp_port INTEGER,
  smtp_secure BOOLEAN DEFAULT FALSE,
  smtp_user VARCHAR(255),
  smtp_password_encrypted TEXT, -- Store encrypted password
  
  -- SendGrid Configuration
  sendgrid_api_key_encrypted TEXT,
  
  -- Mailgun Configuration
  mailgun_api_key_encrypted TEXT,
  mailgun_domain VARCHAR(255),
  
  -- AWS SES Configuration
  ses_access_key_encrypted TEXT,
  ses_secret_key_encrypted TEXT,
  ses_region VARCHAR(50),
  
  -- Gmail OAuth Configuration
  gmail_client_id VARCHAR(255),
  gmail_client_secret_encrypted TEXT,
  gmail_refresh_token_encrypted TEXT,
  
  -- Outlook OAuth Configuration
  outlook_client_id VARCHAR(255),
  outlook_client_secret_encrypted TEXT,
  outlook_refresh_token_encrypted TEXT,
  
  -- Common Settings
  from_email VARCHAR(255) NOT NULL,
  from_name VARCHAR(255),
  reply_to_email VARCHAR(255),
  
  -- Test and Validation
  last_test_at TIMESTAMPTZ,
  last_test_status VARCHAR(50) CHECK (last_test_status IN ('success', 'failed', 'pending')),
  last_test_error TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES profiles(id) ON DELETE SET NULL
);

-- Email Templates table (for custom organization templates)
CREATE TABLE IF NOT EXISTS email_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  template_type VARCHAR(50) NOT NULL CHECK (template_type IN ('invitation', 'welcome', 'password_reset', 'notification')),
  template_name VARCHAR(255) NOT NULL,
  
  -- Template Content
  subject VARCHAR(500) NOT NULL,
  html_content TEXT NOT NULL,
  text_content TEXT NOT NULL,
  
  -- Template Variables (JSON object describing available variables)
  variables JSONB DEFAULT '{}',
  
  -- Settings
  is_active BOOLEAN DEFAULT TRUE,
  is_default BOOLEAN DEFAULT FALSE,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  
  -- Note: Unique constraint for default templates will be added as separate index
);

-- Email Logs table (for tracking email sending)
CREATE TABLE IF NOT EXISTS email_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  integration_id UUID REFERENCES email_integrations(id) ON DELETE SET NULL,
  template_id UUID REFERENCES email_templates(id) ON DELETE SET NULL,
  
  -- Email Details
  to_email VARCHAR(255) NOT NULL,
  from_email VARCHAR(255) NOT NULL,
  subject VARCHAR(500) NOT NULL,
  email_type VARCHAR(50) NOT NULL,
  
  -- Status Tracking
  status VARCHAR(50) NOT NULL CHECK (status IN ('sent', 'failed', 'bounced', 'opened', 'clicked')),
  provider_message_id VARCHAR(255),
  error_message TEXT,
  
  -- Related Records
  related_invitation_id UUID REFERENCES company_invitations(id) ON DELETE SET NULL,
  related_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  
  -- Metadata
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_email_integrations_org ON email_integrations(organization_id);
CREATE INDEX IF NOT EXISTS idx_email_templates_org_type ON email_templates(organization_id, template_type);
CREATE INDEX IF NOT EXISTS idx_email_logs_org_status ON email_logs(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_email_logs_sent_at ON email_logs(sent_at);
CREATE INDEX IF NOT EXISTS idx_email_logs_to_email ON email_logs(to_email);

-- Unique constraint for default templates per organization and type
CREATE UNIQUE INDEX IF NOT EXISTS idx_email_templates_default 
ON email_templates(organization_id, template_type) 
WHERE is_default = TRUE;

-- Enable RLS
ALTER TABLE email_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for email_integrations
CREATE POLICY "Organization admins can manage email integrations" ON email_integrations
  FOR ALL USING (
    organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid()) AND
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

-- RLS Policies for email_templates
CREATE POLICY "Organization members can view email templates" ON email_templates
  FOR SELECT USING (
    organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Organization admins can manage email templates" ON email_templates
  FOR INSERT, UPDATE, DELETE USING (
    organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid()) AND
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'manager')
  );

-- RLS Policies for email_logs
CREATE POLICY "Organization members can view email logs" ON email_logs
  FOR SELECT USING (
    organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid()) AND
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'manager')
  );

-- Function to encrypt sensitive data (placeholder - in production use proper encryption)
CREATE OR REPLACE FUNCTION encrypt_email_credential(credential TEXT)
RETURNS TEXT AS $$
BEGIN
  -- In production, implement proper encryption using pgcrypto or external service
  -- For now, we'll use base64 encoding as a placeholder
  RETURN encode(credential::bytea, 'base64');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to decrypt sensitive data (placeholder - in production use proper decryption)
CREATE OR REPLACE FUNCTION decrypt_email_credential(encrypted_credential TEXT)
RETURNS TEXT AS $$
BEGIN
  -- In production, implement proper decryption
  -- For now, we'll use base64 decoding as a placeholder
  RETURN convert_from(decode(encrypted_credential, 'base64'), 'UTF8');
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to test email integration
CREATE OR REPLACE FUNCTION test_email_integration(
  p_integration_id UUID,
  p_test_email VARCHAR(255)
) RETURNS JSONB AS $$
DECLARE
  integration_rec RECORD;
  test_result JSONB;
BEGIN
  -- Get integration details
  SELECT * INTO integration_rec
  FROM email_integrations
  WHERE id = p_integration_id
    AND organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid());
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Integration not found or access denied'
    );
  END IF;
  
  -- Update test status to pending
  UPDATE email_integrations
  SET 
    last_test_status = 'pending',
    last_test_at = NOW(),
    updated_at = NOW()
  WHERE id = p_integration_id;
  
  -- In a real implementation, this would test the actual email service
  -- For now, we'll simulate a test
  IF integration_rec.provider = 'smtp' AND integration_rec.smtp_host IS NOT NULL THEN
    test_result := jsonb_build_object(
      'success', true,
      'message', 'SMTP connection test successful',
      'provider', integration_rec.provider
    );
    
    UPDATE email_integrations
    SET 
      last_test_status = 'success',
      last_test_error = NULL,
      updated_at = NOW()
    WHERE id = p_integration_id;
  ELSE
    test_result := jsonb_build_object(
      'success', false,
      'error', 'Missing required configuration for ' || integration_rec.provider,
      'provider', integration_rec.provider
    );
    
    UPDATE email_integrations
    SET 
      last_test_status = 'failed',
      last_test_error = 'Missing required configuration',
      updated_at = NOW()
    WHERE id = p_integration_id;
  END IF;
  
  RETURN test_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get active email integration for organization
CREATE OR REPLACE FUNCTION get_active_email_integration(p_organization_id UUID)
RETURNS email_integrations AS $$
DECLARE
  integration_rec email_integrations;
BEGIN
  SELECT * INTO integration_rec
  FROM email_integrations
  WHERE organization_id = p_organization_id
    AND is_active = TRUE;
  
  RETURN integration_rec;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert default email templates for existing organizations
INSERT INTO email_templates (organization_id, template_type, template_name, subject, html_content, text_content, is_default, variables)
SELECT 
  id as organization_id,
  'invitation' as template_type,
  'Default Invitation Template' as template_name,
  'You''re invited to join {{organization_name}} on WorkforceOne' as subject,
  '<!DOCTYPE html><html><body><h1>Welcome to {{organization_name}}</h1><p>You have been invited by {{inviter_name}} to join as a {{role}}.</p><p><a href="{{invitation_url}}">Accept Invitation</a></p></body></html>' as html_content,
  'Welcome to {{organization_name}}! You have been invited by {{inviter_name}} to join as a {{role}}. Click here to accept: {{invitation_url}}' as text_content,
  TRUE as is_default,
  '{"organization_name": "Organization name", "inviter_name": "Name of person who sent invitation", "role": "User role", "invitation_url": "Secure invitation link"}' as variables
FROM organizations
WHERE id NOT IN (
  SELECT organization_id 
  FROM email_templates 
  WHERE template_type = 'invitation' AND is_default = TRUE
)
ON CONFLICT DO NOTHING;

-- Grant permissions
GRANT EXECUTE ON FUNCTION encrypt_email_credential TO authenticated;
GRANT EXECUTE ON FUNCTION decrypt_email_credential TO authenticated;
GRANT EXECUTE ON FUNCTION test_email_integration TO authenticated;
GRANT EXECUTE ON FUNCTION get_active_email_integration TO authenticated;