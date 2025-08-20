-- Migration 013: Workflow Automation System
-- Comprehensive workflow automation with triggers, actions, and conditions

-- Workflow Templates table - reusable workflow definitions
CREATE TABLE IF NOT EXISTS workflow_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100) DEFAULT 'general', -- 'attendance', 'leave', 'tasks', 'forms', 'general'
  is_active BOOLEAN DEFAULT true,
  is_system_template BOOLEAN DEFAULT false, -- System-provided templates
  trigger_type VARCHAR(100) NOT NULL, -- 'time_based', 'event_based', 'manual'
  trigger_config JSONB NOT NULL, -- Configuration for the trigger
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Workflow Instances table - actual running workflows
CREATE TABLE IF NOT EXISTS workflow_instances (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  template_id UUID REFERENCES workflow_templates(id) ON DELETE CASCADE NOT NULL,
  name VARCHAR(255) NOT NULL,
  status VARCHAR(50) DEFAULT 'active', -- 'active', 'paused', 'completed', 'failed'
  trigger_data JSONB, -- Data that triggered this instance
  context_data JSONB, -- Runtime context and variables
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Workflow Steps table - individual steps in a workflow
CREATE TABLE IF NOT EXISTS workflow_steps (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  template_id UUID REFERENCES workflow_templates(id) ON DELETE CASCADE NOT NULL,
  step_order INTEGER NOT NULL,
  step_type VARCHAR(100) NOT NULL, -- 'condition', 'action', 'delay', 'approval'
  name VARCHAR(255) NOT NULL,
  description TEXT,
  config JSONB NOT NULL, -- Step-specific configuration
  conditions JSONB, -- Conditions for this step to execute
  is_parallel BOOLEAN DEFAULT false, -- Can run in parallel with other steps
  timeout_minutes INTEGER, -- Step timeout
  retry_attempts INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Workflow Step Executions table - track individual step runs
CREATE TABLE IF NOT EXISTS workflow_step_executions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  instance_id UUID REFERENCES workflow_instances(id) ON DELETE CASCADE NOT NULL,
  step_id UUID REFERENCES workflow_steps(id) ON DELETE CASCADE NOT NULL,
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'running', 'completed', 'failed', 'skipped'
  input_data JSONB,
  output_data JSONB,
  error_message TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  retry_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Workflow Actions table - predefined actions that can be used in workflows
CREATE TABLE IF NOT EXISTS workflow_actions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL, -- 'notification', 'data', 'approval', 'integration'
  description TEXT,
  action_type VARCHAR(100) NOT NULL, -- 'send_notification', 'update_record', 'create_task', etc.
  config_schema JSONB, -- JSON schema for configuration
  is_system_action BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Workflow Approvals table - track approval steps
CREATE TABLE IF NOT EXISTS workflow_approvals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  instance_id UUID REFERENCES workflow_instances(id) ON DELETE CASCADE NOT NULL,
  step_execution_id UUID REFERENCES workflow_step_executions(id) ON DELETE CASCADE NOT NULL,
  approver_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  approver_role VARCHAR(100), -- Required role for approval
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'expired'
  approval_message TEXT,
  approved_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Workflow Logs table - detailed execution logs
CREATE TABLE IF NOT EXISTS workflow_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  instance_id UUID REFERENCES workflow_instances(id) ON DELETE CASCADE NOT NULL,
  step_execution_id UUID REFERENCES workflow_step_executions(id) ON DELETE SET NULL,
  log_level VARCHAR(20) DEFAULT 'info', -- 'debug', 'info', 'warning', 'error'
  message TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Workflow Triggers table - track trigger events
CREATE TABLE IF NOT EXISTS workflow_triggers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  trigger_type VARCHAR(100) NOT NULL, -- 'attendance_late', 'leave_request', 'task_overdue', etc.
  trigger_name VARCHAR(255) NOT NULL,
  description TEXT,
  event_source VARCHAR(100) NOT NULL, -- 'attendance', 'leave_requests', 'tasks', 'forms'
  conditions JSONB, -- When this trigger should fire
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert system workflow actions
INSERT INTO workflow_actions (name, category, description, action_type, config_schema, is_system_action) VALUES
-- Notification Actions
('Send Email Notification', 'notification', 'Send an email to specified recipients', 'send_email', 
 '{"type":"object","properties":{"to":{"type":"array","items":{"type":"string"}},"subject":{"type":"string"},"template":{"type":"string"},"variables":{"type":"object"}}}', true),

('Send SMS Notification', 'notification', 'Send SMS to specified phone numbers', 'send_sms',
 '{"type":"object","properties":{"to":{"type":"array","items":{"type":"string"}},"message":{"type":"string"},"variables":{"type":"object"}}}', true),

('Send In-App Notification', 'notification', 'Send notification within the app', 'send_notification',
 '{"type":"object","properties":{"recipients":{"type":"array","items":{"type":"string"}},"title":{"type":"string"},"message":{"type":"string"},"priority":{"type":"string","enum":["low","normal","high","urgent"]}}}', true),

('Send Slack Message', 'notification', 'Send message to Slack channel or user', 'send_slack',
 '{"type":"object","properties":{"channel":{"type":"string"},"user":{"type":"string"},"message":{"type":"string"},"attachments":{"type":"array"}}}', true),

-- Data Actions
('Update Record', 'data', 'Update a database record', 'update_record',
 '{"type":"object","properties":{"table":{"type":"string"},"record_id":{"type":"string"},"fields":{"type":"object"},"conditions":{"type":"object"}}}', true),

('Create Record', 'data', 'Create a new database record', 'create_record',
 '{"type":"object","properties":{"table":{"type":"string"},"data":{"type":"object"}}}', true),

('Delete Record', 'data', 'Delete a database record', 'delete_record',
 '{"type":"object","properties":{"table":{"type":"string"},"record_id":{"type":"string"},"conditions":{"type":"object"}}}', true),

-- Task Actions
('Create Task', 'task', 'Create a new task assignment', 'create_task',
 '{"type":"object","properties":{"title":{"type":"string"},"description":{"type":"string"},"assignee_id":{"type":"string"},"due_date":{"type":"string"},"priority":{"type":"string"}}}', true),

('Assign Task', 'task', 'Assign existing task to user', 'assign_task',
 '{"type":"object","properties":{"task_id":{"type":"string"},"assignee_id":{"type":"string"},"message":{"type":"string"}}}', true),

-- Approval Actions
('Request Approval', 'approval', 'Request approval from specified approvers', 'request_approval',
 '{"type":"object","properties":{"approvers":{"type":"array","items":{"type":"string"}},"approval_type":{"type":"string"},"message":{"type":"string"},"timeout_hours":{"type":"number"}}}', true),

-- Integration Actions
('Webhook Call', 'integration', 'Make HTTP request to external service', 'webhook',
 '{"type":"object","properties":{"url":{"type":"string"},"method":{"type":"string","enum":["GET","POST","PUT","DELETE"]},"headers":{"type":"object"},"body":{"type":"object"}}}', true),

('Export Data', 'integration', 'Export data to external system', 'export_data',
 '{"type":"object","properties":{"format":{"type":"string","enum":["json","csv","xml"]},"destination":{"type":"string"},"filters":{"type":"object"}}}', true);

-- Insert system workflow triggers
INSERT INTO workflow_triggers (trigger_type, trigger_name, description, event_source, conditions, organization_id) 
SELECT 
  trigger_type, trigger_name, description, event_source, conditions, id
FROM (VALUES
  ('attendance_late', 'Employee Late Check-in', 'Triggered when employee checks in late', 'attendance', '{"delay_minutes": 15}'),
  ('attendance_missing', 'Missing Check-in', 'Triggered when employee fails to check in', 'attendance', '{"grace_period_minutes": 30}'),
  ('leave_request_submitted', 'Leave Request Submitted', 'Triggered when new leave request is submitted', 'leave_requests', '{}'),
  ('leave_request_approved', 'Leave Request Approved', 'Triggered when leave request is approved', 'leave_requests', '{}'),
  ('task_overdue', 'Task Overdue', 'Triggered when task becomes overdue', 'tasks', '{"check_interval_hours": 1}'),
  ('form_submitted', 'Form Submitted', 'Triggered when form is submitted', 'forms', '{}'),
  ('employee_inactive', 'Employee Inactive', 'Triggered when employee has been inactive', 'attendance', '{"inactive_days": 3}')
) AS t(trigger_type, trigger_name, description, event_source, conditions)
CROSS JOIN organizations;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_workflow_templates_org_active ON workflow_templates(organization_id, is_active);
CREATE INDEX IF NOT EXISTS idx_workflow_instances_org_status ON workflow_instances(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_workflow_steps_template ON workflow_steps(template_id, step_order);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_instance ON workflow_step_executions(instance_id, status);
CREATE INDEX IF NOT EXISTS idx_workflow_approvals_approver ON workflow_approvals(approver_id, status);
CREATE INDEX IF NOT EXISTS idx_workflow_logs_instance ON workflow_logs(instance_id, created_at);
CREATE INDEX IF NOT EXISTS idx_workflow_triggers_org_active ON workflow_triggers(organization_id, is_active);

-- Enable RLS
ALTER TABLE workflow_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_step_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_triggers ENABLE ROW LEVEL SECURITY;

-- RLS Policies for workflow_templates
CREATE POLICY "Organizations can view their workflow templates" ON workflow_templates
  FOR SELECT USING (organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid()) OR is_system_template = true);

CREATE POLICY "Managers can manage workflow templates" ON workflow_templates
  FOR ALL USING (organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid()) AND 
                 (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'manager'));

-- RLS Policies for workflow_instances
CREATE POLICY "Organizations can view their workflow instances" ON workflow_instances
  FOR SELECT USING (organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Managers can manage workflow instances" ON workflow_instances
  FOR ALL USING (organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid()) AND 
                 (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'manager'));

-- RLS Policies for workflow_steps
CREATE POLICY "Organizations can view workflow steps" ON workflow_steps
  FOR SELECT USING (EXISTS (SELECT 1 FROM workflow_templates wt WHERE wt.id = template_id AND 
                           (wt.organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid()) OR wt.is_system_template = true)));

CREATE POLICY "Managers can manage workflow steps" ON workflow_steps
  FOR ALL USING (EXISTS (SELECT 1 FROM workflow_templates wt WHERE wt.id = template_id AND 
                        wt.organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid()) AND 
                        (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'manager')));

-- RLS Policies for workflow_step_executions
CREATE POLICY "Organizations can view their workflow executions" ON workflow_step_executions
  FOR SELECT USING (EXISTS (SELECT 1 FROM workflow_instances wi WHERE wi.id = instance_id AND 
                           wi.organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid())));

-- RLS Policies for workflow_approvals
CREATE POLICY "Users can view their approval requests" ON workflow_approvals
  FOR SELECT USING (approver_id = auth.uid() OR 
                   organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can manage their approvals" ON workflow_approvals
  FOR UPDATE USING (approver_id = auth.uid());

-- RLS Policies for workflow_logs
CREATE POLICY "Organizations can view their workflow logs" ON workflow_logs
  FOR SELECT USING (EXISTS (SELECT 1 FROM workflow_instances wi WHERE wi.id = instance_id AND 
                           wi.organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid())));

-- RLS Policies for workflow_triggers
CREATE POLICY "Organizations can view their workflow triggers" ON workflow_triggers
  FOR SELECT USING (organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Managers can manage workflow triggers" ON workflow_triggers
  FOR ALL USING (organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid()) AND 
                 (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'manager'));

-- Create functions for workflow execution
CREATE OR REPLACE FUNCTION trigger_workflow(
  p_trigger_type VARCHAR,
  p_trigger_data JSONB,
  p_organization_id UUID
) RETURNS TABLE(instance_id UUID, template_id UUID) AS $$
DECLARE
  template_rec RECORD;
  new_instance_id UUID;
BEGIN
  -- Find active workflow templates for this trigger type
  FOR template_rec IN 
    SELECT wt.* FROM workflow_templates wt
    WHERE wt.organization_id = p_organization_id 
      AND wt.is_active = true
      AND wt.trigger_config->>'trigger_type' = p_trigger_type
  LOOP
    -- Create new workflow instance
    INSERT INTO workflow_instances (
      organization_id, template_id, name, trigger_data, context_data
    ) VALUES (
      p_organization_id, template_rec.id, template_rec.name, p_trigger_data, '{}'::jsonb
    ) RETURNING id INTO new_instance_id;
    
    -- Return the created instance
    instance_id := new_instance_id;
    template_id := template_rec.id;
    RETURN NEXT;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION trigger_workflow TO authenticated;