-- =============================================
-- ADD PRODUCT COLUMNS TO EXISTING TABLES
-- Adds product_id columns to all product-specific tables
-- =============================================

-- First, let's get the product IDs to use in our updates
DO $$
DECLARE
  remote_product_id UUID;
  time_product_id UUID;
  guard_product_id UUID;
BEGIN
  -- Get product IDs
  SELECT id INTO remote_product_id FROM products WHERE code = 'remote';
  SELECT id INTO time_product_id FROM products WHERE code = 'time';
  SELECT id INTO guard_product_id FROM products WHERE code = 'guard';
  
  -- Store in temporary table for use in the migration
  CREATE TEMP TABLE temp_product_ids (
    product_code TEXT,
    product_id UUID
  );
  
  INSERT INTO temp_product_ids VALUES 
    ('remote', remote_product_id),
    ('time', time_product_id),
    ('guard', guard_product_id);
    
  RAISE NOTICE 'Product IDs stored: Remote=%, Time=%, Guard=%', remote_product_id, time_product_id, guard_product_id;
END $$;

-- ===== WORKFORCEONE REMOTE™ TABLES =====

-- Teams & Team Management
ALTER TABLE teams ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES products(id);
ALTER TABLE team_members ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES products(id);

-- Tasks & Project Management  
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES products(id);
ALTER TABLE task_assignments ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES products(id);
ALTER TABLE task_comments ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES products(id);
ALTER TABLE task_attachments ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES products(id);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES products(id);

-- Forms System
ALTER TABLE forms ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES products(id);
ALTER TABLE form_templates ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES products(id);
ALTER TABLE form_responses ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES products(id);
ALTER TABLE form_assignments ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES products(id);
ALTER TABLE form_notifications ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES products(id);
ALTER TABLE form_analytics ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES products(id);
ALTER TABLE form_field_types ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES products(id);
ALTER TABLE form_file_uploads ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES products(id);

-- Communication
ALTER TABLE company_invitations ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES products(id);
ALTER TABLE in_app_messages ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES products(id);
ALTER TABLE message_participants ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES products(id);

-- Routes & Field Work
ALTER TABLE routes ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES products(id);
ALTER TABLE route_stops ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES products(id);
ALTER TABLE route_assignments ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES products(id);
ALTER TABLE route_tracking ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES products(id);
ALTER TABLE route_optimization_settings ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES products(id);
ALTER TABLE daily_calls ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES products(id);

-- Outlets (shared - will be populated based on context)
ALTER TABLE outlets ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES products(id);
ALTER TABLE outlet_users ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES products(id);
ALTER TABLE outlet_teams ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES products(id);
ALTER TABLE outlet_visits ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES products(id);
ALTER TABLE outlet_group_forms ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES products(id);

-- Workflow System (all Remote)
ALTER TABLE workflow_templates ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES products(id);
ALTER TABLE workflow_instances ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES products(id);
ALTER TABLE workflow_steps ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES products(id);
ALTER TABLE workflow_step_executions ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES products(id);
ALTER TABLE workflow_conditions ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES products(id);
ALTER TABLE workflow_approvals ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES products(id);
ALTER TABLE workflow_logs ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES products(id);
ALTER TABLE workflow_action_queue ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES products(id);
ALTER TABLE workflow_actions ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES products(id);
ALTER TABLE workflow_triggers ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES products(id);
ALTER TABLE workflow_trigger_config ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES products(id);
ALTER TABLE workflow_trigger_events ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES products(id);

-- ===== WORKFORCEONE TIME™ TABLES =====

-- Time Tracking
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES products(id);
ALTER TABLE time_entries ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES products(id);
ALTER TABLE attendance_reminders ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES products(id);

-- Leave Management
ALTER TABLE leave_requests ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES products(id);
ALTER TABLE leave_balances ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES products(id);

-- Payroll
ALTER TABLE payslips ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES products(id);
ALTER TABLE user_tier_pricing ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES products(id);

-- Email System (Time-related)
ALTER TABLE email_integrations ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES products(id);
ALTER TABLE email_templates ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES products(id);
ALTER TABLE email_logs ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES products(id);

-- Notifications (will be populated based on template type)
ALTER TABLE notification_templates ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES products(id);

-- Signup Management (Time-related)
ALTER TABLE signup_requests ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES products(id);
ALTER TABLE organization_signup_settings ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES products(id);

-- ===== WORKFORCEONE GUARD™ TABLES =====

-- Patrol Management
ALTER TABLE patrol_routes ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES products(id);
ALTER TABLE patrol_checkpoints ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES products(id);
ALTER TABLE patrol_sessions ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES products(id);
ALTER TABLE patrol_locations ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES products(id);
ALTER TABLE checkpoint_scans ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES products(id);

-- Guard Management
ALTER TABLE guard_assignments ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES products(id);
ALTER TABLE guard_invitations ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES products(id);
ALTER TABLE security_guard_invitations ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES products(id);

-- Incident Management
ALTER TABLE incidents ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES products(id);
ALTER TABLE incident_attachments ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES products(id);
ALTER TABLE incident_witnesses ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES products(id);

-- System Monitoring (Guard-specific)
ALTER TABLE system_metrics ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES products(id);
ALTER TABLE system_alerts ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES products(id);
ALTER TABLE system_health_snapshots ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES products(id);
ALTER TABLE alert_rules ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES products(id);
ALTER TABLE admin_activity_log ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES products(id);

-- Features & Usage (Guard-specific)
ALTER TABLE features ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES products(id);
ALTER TABLE feature_usage ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES products(id);
ALTER TABLE subscription_features ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES products(id);

-- Color Schemes (Guard branding)
ALTER TABLE branding_color_schemes ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES products(id);

-- ===== UPDATE COLUMNS WITH CORRECT PRODUCT IDs =====

-- REMOTE PRODUCT UPDATES
UPDATE teams SET product_id = (SELECT product_id FROM temp_product_ids WHERE product_code = 'remote') WHERE product_id IS NULL;
UPDATE team_members SET product_id = (SELECT product_id FROM temp_product_ids WHERE product_code = 'remote') WHERE product_id IS NULL;
UPDATE tasks SET product_id = (SELECT product_id FROM temp_product_ids WHERE product_code = 'remote') WHERE product_id IS NULL;
UPDATE task_assignments SET product_id = (SELECT product_id FROM temp_product_ids WHERE product_code = 'remote') WHERE product_id IS NULL;
UPDATE task_comments SET product_id = (SELECT product_id FROM temp_product_ids WHERE product_code = 'remote') WHERE product_id IS NULL;
UPDATE task_attachments SET product_id = (SELECT product_id FROM temp_product_ids WHERE product_code = 'remote') WHERE product_id IS NULL;
UPDATE projects SET product_id = (SELECT product_id FROM temp_product_ids WHERE product_code = 'remote') WHERE product_id IS NULL;
UPDATE forms SET product_id = (SELECT product_id FROM temp_product_ids WHERE product_code = 'remote') WHERE product_id IS NULL;
UPDATE form_templates SET product_id = (SELECT product_id FROM temp_product_ids WHERE product_code = 'remote') WHERE product_id IS NULL;
UPDATE form_responses SET product_id = (SELECT product_id FROM temp_product_ids WHERE product_code = 'remote') WHERE product_id IS NULL;
UPDATE form_assignments SET product_id = (SELECT product_id FROM temp_product_ids WHERE product_code = 'remote') WHERE product_id IS NULL;
UPDATE form_notifications SET product_id = (SELECT product_id FROM temp_product_ids WHERE product_code = 'remote') WHERE product_id IS NULL;
UPDATE form_analytics SET product_id = (SELECT product_id FROM temp_product_ids WHERE product_code = 'remote') WHERE product_id IS NULL;
UPDATE form_field_types SET product_id = (SELECT product_id FROM temp_product_ids WHERE product_code = 'remote') WHERE product_id IS NULL;
UPDATE form_file_uploads SET product_id = (SELECT product_id FROM temp_product_ids WHERE product_code = 'remote') WHERE product_id IS NULL;
UPDATE company_invitations SET product_id = (SELECT product_id FROM temp_product_ids WHERE product_code = 'remote') WHERE product_id IS NULL;
UPDATE in_app_messages SET product_id = (SELECT product_id FROM temp_product_ids WHERE product_code = 'remote') WHERE product_id IS NULL;
UPDATE message_participants SET product_id = (SELECT product_id FROM temp_product_ids WHERE product_code = 'remote') WHERE product_id IS NULL;
UPDATE routes SET product_id = (SELECT product_id FROM temp_product_ids WHERE product_code = 'remote') WHERE product_id IS NULL;
UPDATE route_stops SET product_id = (SELECT product_id FROM temp_product_ids WHERE product_code = 'remote') WHERE product_id IS NULL;
UPDATE route_assignments SET product_id = (SELECT product_id FROM temp_product_ids WHERE product_code = 'remote') WHERE product_id IS NULL;
UPDATE route_tracking SET product_id = (SELECT product_id FROM temp_product_ids WHERE product_code = 'remote') WHERE product_id IS NULL;
UPDATE route_optimization_settings SET product_id = (SELECT product_id FROM temp_product_ids WHERE product_code = 'remote') WHERE product_id IS NULL;
UPDATE daily_calls SET product_id = (SELECT product_id FROM temp_product_ids WHERE product_code = 'remote') WHERE product_id IS NULL;
UPDATE outlet_visits SET product_id = (SELECT product_id FROM temp_product_ids WHERE product_code = 'remote') WHERE product_id IS NULL;
UPDATE outlet_group_forms SET product_id = (SELECT product_id FROM temp_product_ids WHERE product_code = 'remote') WHERE product_id IS NULL;

-- Workflow System (all Remote)
UPDATE workflow_templates SET product_id = (SELECT product_id FROM temp_product_ids WHERE product_code = 'remote') WHERE product_id IS NULL;
UPDATE workflow_instances SET product_id = (SELECT product_id FROM temp_product_ids WHERE product_code = 'remote') WHERE product_id IS NULL;
UPDATE workflow_steps SET product_id = (SELECT product_id FROM temp_product_ids WHERE product_code = 'remote') WHERE product_id IS NULL;
UPDATE workflow_step_executions SET product_id = (SELECT product_id FROM temp_product_ids WHERE product_code = 'remote') WHERE product_id IS NULL;
UPDATE workflow_conditions SET product_id = (SELECT product_id FROM temp_product_ids WHERE product_code = 'remote') WHERE product_id IS NULL;
UPDATE workflow_approvals SET product_id = (SELECT product_id FROM temp_product_ids WHERE product_code = 'remote') WHERE product_id IS NULL;
UPDATE workflow_logs SET product_id = (SELECT product_id FROM temp_product_ids WHERE product_code = 'remote') WHERE product_id IS NULL;
UPDATE workflow_action_queue SET product_id = (SELECT product_id FROM temp_product_ids WHERE product_code = 'remote') WHERE product_id IS NULL;
UPDATE workflow_actions SET product_id = (SELECT product_id FROM temp_product_ids WHERE product_code = 'remote') WHERE product_id IS NULL;
UPDATE workflow_triggers SET product_id = (SELECT product_id FROM temp_product_ids WHERE product_code = 'remote') WHERE product_id IS NULL;
UPDATE workflow_trigger_config SET product_id = (SELECT product_id FROM temp_product_ids WHERE product_code = 'remote') WHERE product_id IS NULL;
UPDATE workflow_trigger_events SET product_id = (SELECT product_id FROM temp_product_ids WHERE product_code = 'remote') WHERE product_id IS NULL;

-- TIME PRODUCT UPDATES
UPDATE attendance SET product_id = (SELECT product_id FROM temp_product_ids WHERE product_code = 'time') WHERE product_id IS NULL;
UPDATE time_entries SET product_id = (SELECT product_id FROM temp_product_ids WHERE product_code = 'time') WHERE product_id IS NULL;
UPDATE attendance_reminders SET product_id = (SELECT product_id FROM temp_product_ids WHERE product_code = 'time') WHERE product_id IS NULL;
UPDATE leave_requests SET product_id = (SELECT product_id FROM temp_product_ids WHERE product_code = 'time') WHERE product_id IS NULL;
UPDATE leave_balances SET product_id = (SELECT product_id FROM temp_product_ids WHERE product_code = 'time') WHERE product_id IS NULL;
UPDATE payslips SET product_id = (SELECT product_id FROM temp_product_ids WHERE product_code = 'time') WHERE product_id IS NULL;
UPDATE user_tier_pricing SET product_id = (SELECT product_id FROM temp_product_ids WHERE product_code = 'time') WHERE product_id IS NULL;
UPDATE email_integrations SET product_id = (SELECT product_id FROM temp_product_ids WHERE product_code = 'time') WHERE product_id IS NULL;
UPDATE email_templates SET product_id = (SELECT product_id FROM temp_product_ids WHERE product_code = 'time') WHERE product_id IS NULL;
UPDATE email_logs SET product_id = (SELECT product_id FROM temp_product_ids WHERE product_code = 'time') WHERE product_id IS NULL;
UPDATE signup_requests SET product_id = (SELECT product_id FROM temp_product_ids WHERE product_code = 'time') WHERE product_id IS NULL;
UPDATE organization_signup_settings SET product_id = (SELECT product_id FROM temp_product_ids WHERE product_code = 'time') WHERE product_id IS NULL;

-- GUARD PRODUCT UPDATES
UPDATE patrol_routes SET product_id = (SELECT product_id FROM temp_product_ids WHERE product_code = 'guard') WHERE product_id IS NULL;
UPDATE patrol_checkpoints SET product_id = (SELECT product_id FROM temp_product_ids WHERE product_code = 'guard') WHERE product_id IS NULL;
UPDATE patrol_sessions SET product_id = (SELECT product_id FROM temp_product_ids WHERE product_code = 'guard') WHERE product_id IS NULL;
UPDATE patrol_locations SET product_id = (SELECT product_id FROM temp_product_ids WHERE product_code = 'guard') WHERE product_id IS NULL;
UPDATE checkpoint_scans SET product_id = (SELECT product_id FROM temp_product_ids WHERE product_code = 'guard') WHERE product_id IS NULL;
UPDATE guard_assignments SET product_id = (SELECT product_id FROM temp_product_ids WHERE product_code = 'guard') WHERE product_id IS NULL;
UPDATE guard_invitations SET product_id = (SELECT product_id FROM temp_product_ids WHERE product_code = 'guard') WHERE product_id IS NULL;
UPDATE security_guard_invitations SET product_id = (SELECT product_id FROM temp_product_ids WHERE product_code = 'guard') WHERE product_id IS NULL;
UPDATE incidents SET product_id = (SELECT product_id FROM temp_product_ids WHERE product_code = 'guard') WHERE product_id IS NULL;
UPDATE incident_attachments SET product_id = (SELECT product_id FROM temp_product_ids WHERE product_code = 'guard') WHERE product_id IS NULL;
UPDATE incident_witnesses SET product_id = (SELECT product_id FROM temp_product_ids WHERE product_code = 'guard') WHERE product_id IS NULL;
UPDATE system_metrics SET product_id = (SELECT product_id FROM temp_product_ids WHERE product_code = 'guard') WHERE product_id IS NULL;
UPDATE system_alerts SET product_id = (SELECT product_id FROM temp_product_ids WHERE product_code = 'guard') WHERE product_id IS NULL;
UPDATE system_health_snapshots SET product_id = (SELECT product_id FROM temp_product_ids WHERE product_code = 'guard') WHERE product_id IS NULL;
UPDATE alert_rules SET product_id = (SELECT product_id FROM temp_product_ids WHERE product_code = 'guard') WHERE product_id IS NULL;
UPDATE admin_activity_log SET product_id = (SELECT product_id FROM temp_product_ids WHERE product_code = 'guard') WHERE product_id IS NULL;
UPDATE features SET product_id = (SELECT product_id FROM temp_product_ids WHERE product_code = 'guard') WHERE product_id IS NULL;
UPDATE feature_usage SET product_id = (SELECT product_id FROM temp_product_ids WHERE product_code = 'guard') WHERE product_id IS NULL;
UPDATE subscription_features SET product_id = (SELECT product_id FROM temp_product_ids WHERE product_code = 'guard') WHERE product_id IS NULL;
UPDATE branding_color_schemes SET product_id = (SELECT product_id FROM temp_product_ids WHERE product_code = 'guard') WHERE product_id IS NULL;

-- ===== CREATE INDEXES FOR NEW COLUMNS =====

-- Remote product indexes
CREATE INDEX idx_teams_product_id ON teams(product_id);
CREATE INDEX idx_tasks_product_id ON tasks(product_id);
CREATE INDEX idx_forms_product_id ON forms(product_id);
CREATE INDEX idx_projects_product_id ON projects(product_id);
CREATE INDEX idx_routes_product_id ON routes(product_id);
CREATE INDEX idx_workflow_templates_product_id ON workflow_templates(product_id);

-- Time product indexes
CREATE INDEX idx_attendance_product_id ON attendance(product_id);
CREATE INDEX idx_time_entries_product_id ON time_entries(product_id);
CREATE INDEX idx_leave_requests_product_id ON leave_requests(product_id);
CREATE INDEX idx_payslips_product_id ON payslips(product_id);

-- Guard product indexes
CREATE INDEX idx_patrol_routes_product_id ON patrol_routes(product_id);
CREATE INDEX idx_patrol_sessions_product_id ON patrol_sessions(product_id);
CREATE INDEX idx_incidents_product_id ON incidents(product_id);
CREATE INDEX idx_checkpoint_scans_product_id ON checkpoint_scans(product_id);

-- Shared table indexes
CREATE INDEX idx_outlets_product_id ON outlets(product_id);
CREATE INDEX idx_notification_templates_product_id ON notification_templates(product_id);

-- ===== UPDATE NOT NULL CONSTRAINTS =====
-- After populating data, we may want to make some product_id columns NOT NULL

-- Core product-specific tables that MUST have a product_id
-- (Uncomment after data population and validation)
-- ALTER TABLE tasks ALTER COLUMN product_id SET NOT NULL;
-- ALTER TABLE forms ALTER COLUMN product_id SET NOT NULL;
-- ALTER TABLE attendance ALTER COLUMN product_id SET NOT NULL;
-- ALTER TABLE patrol_routes ALTER COLUMN product_id SET NOT NULL;
-- ALTER TABLE incidents ALTER COLUMN product_id SET NOT NULL;

-- ===== SPECIAL HANDLING FOR SHARED TABLES =====

-- Update outlets based on their usage context
-- Remote outlets: Used in route_stops (daily_calls doesn't have outlet_id)
UPDATE outlets SET product_id = (SELECT product_id FROM temp_product_ids WHERE product_code = 'remote') 
WHERE product_id IS NULL AND id IN (
    SELECT DISTINCT outlet_id FROM route_stops WHERE outlet_id IS NOT NULL
);

-- Since patrol_routes and daily_calls don't have outlet_id columns, 
-- we'll assign remaining outlets to Remote by default (most common use case)
UPDATE outlets SET product_id = (SELECT product_id FROM temp_product_ids WHERE product_code = 'remote') 
WHERE product_id IS NULL;

-- Update outlet_users and outlet_teams based on their outlet's product
UPDATE outlet_users SET product_id = o.product_id
FROM outlets o 
WHERE outlet_users.outlet_id = o.id AND outlet_users.product_id IS NULL;

UPDATE outlet_teams SET product_id = o.product_id
FROM outlets o 
WHERE outlet_teams.outlet_id = o.id AND outlet_teams.product_id IS NULL;

-- Notification templates based on content/purpose (using 'name' and 'type' columns)
UPDATE notification_templates SET product_id = (SELECT product_id FROM temp_product_ids WHERE product_code = 'time') 
WHERE product_id IS NULL AND (
   name ILIKE '%attendance%' 
   OR name ILIKE '%leave%' 
   OR name ILIKE '%timesheet%'
   OR name ILIKE '%clock%'
   OR type ILIKE '%attendance%'
   OR type ILIKE '%leave%'
   OR type ILIKE '%time%'
);

UPDATE notification_templates SET product_id = (SELECT product_id FROM temp_product_ids WHERE product_code = 'remote') 
WHERE product_id IS NULL AND (
   name ILIKE '%task%' 
   OR name ILIKE '%team%' 
   OR name ILIKE '%form%'
   OR name ILIKE '%project%'
   OR type ILIKE '%task%'
   OR type ILIKE '%team%'
   OR type ILIKE '%form%'
   OR type ILIKE '%project%'
);

UPDATE notification_templates SET product_id = (SELECT product_id FROM temp_product_ids WHERE product_code = 'guard') 
WHERE product_id IS NULL AND (
   name ILIKE '%patrol%' 
   OR name ILIKE '%incident%' 
   OR name ILIKE '%security%'
   OR name ILIKE '%checkpoint%'
   OR name ILIKE '%guard%'
   OR type ILIKE '%patrol%'
   OR type ILIKE '%incident%'
   OR type ILIKE '%security%'
   OR type ILIKE '%guard%'
);

-- Success message
SELECT 'Product columns added successfully to all tables!' as status;