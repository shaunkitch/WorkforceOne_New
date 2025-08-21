-- Corrected Email Integration Migration
-- Execute these SQL statements in Supabase SQL Editor

-- 1. Email Templates table (for custom organization templates)
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
  updated_by UUID REFERENCES profiles(id) ON DELETE SET NULL
);

-- 2. Email Logs table (for tracking email sending)
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

-- 3. Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_email_templates_org_type ON email_templates(organization_id, template_type);
CREATE INDEX IF NOT EXISTS idx_email_logs_org_status ON email_logs(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_email_logs_sent_at ON email_logs(sent_at);
CREATE INDEX IF NOT EXISTS idx_email_logs_to_email ON email_logs(to_email);

-- 4. Unique constraint for default templates per organization and type
CREATE UNIQUE INDEX IF NOT EXISTS idx_email_templates_default 
ON email_templates(organization_id, template_type) 
WHERE is_default = TRUE;

-- 5. Enable RLS
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies for email_templates
CREATE POLICY "Organization members can view email templates" ON email_templates
  FOR SELECT USING (
    organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Organization admins can insert email templates" ON email_templates
  FOR INSERT WITH CHECK (
    organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid()) AND
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'manager')
  );

CREATE POLICY "Organization admins can update email templates" ON email_templates
  FOR UPDATE USING (
    organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid()) AND
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'manager')
  );

CREATE POLICY "Organization admins can delete email templates" ON email_templates
  FOR DELETE USING (
    organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid()) AND
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'manager')
  );

-- 7. RLS Policies for email_logs
CREATE POLICY "Organization members can view email logs" ON email_logs
  FOR SELECT USING (
    organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid()) AND
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'manager')
  );

-- 8. Insert default email templates for existing organizations
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