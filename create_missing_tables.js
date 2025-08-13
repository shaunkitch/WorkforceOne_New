const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './workforceone/.env' });

async function createMissingTables() {
  const supabase = createClient(
    'https://edeheyeloakiworbkfpg.supabase.co',
    process.env.SUPABASE_SERVICE_KEY
  );

  console.log('Creating missing email integration tables...');

  try {
    // Since we can't directly execute DDL, let's try using the REST API
    // or provide the SQL statements for manual execution

    const emailTemplatesSQL = `
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
  
  -- Ensure one default template per type per organization
  UNIQUE(organization_id, template_type, is_default) WHERE is_default = TRUE
);`;

    const emailLogsSQL = `
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
);`;

    const indexesSQL = `
-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_email_templates_org_type ON email_templates(organization_id, template_type);
CREATE INDEX IF NOT EXISTS idx_email_logs_org_status ON email_logs(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_email_logs_sent_at ON email_logs(sent_at);
CREATE INDEX IF NOT EXISTS idx_email_logs_to_email ON email_logs(to_email);`;

    const rlsSQL = `
-- Enable RLS
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;

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
  );`;

    console.log('📋 SQL statements to execute manually in Supabase SQL Editor:');
    console.log('='.repeat(80));
    console.log('1. EMAIL TEMPLATES TABLE:');
    console.log(emailTemplatesSQL);
    console.log('\n2. EMAIL LOGS TABLE:');
    console.log(emailLogsSQL);
    console.log('\n3. INDEXES:');
    console.log(indexesSQL);
    console.log('\n4. ROW LEVEL SECURITY:');
    console.log(rlsSQL);
    console.log('='.repeat(80));

    console.log('\n✅ Please copy and paste the above SQL statements into the Supabase SQL Editor and run them.');
    console.log('   Dashboard URL: https://supabase.com/dashboard/project/edeheyeloakiworbkfpg/sql');

  } catch (error) {
    console.error('Error:', error);
  }
}

createMissingTables();