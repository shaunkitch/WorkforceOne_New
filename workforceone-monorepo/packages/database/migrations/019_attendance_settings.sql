-- Migration 019: Attendance Settings
-- Add attendance-related settings to organization_settings table

-- Add attendance settings columns
ALTER TABLE organization_settings ADD COLUMN IF NOT EXISTS work_start_time TIME DEFAULT '09:00:00';
ALTER TABLE organization_settings ADD COLUMN IF NOT EXISTS work_end_time TIME DEFAULT '17:00:00';
ALTER TABLE organization_settings ADD COLUMN IF NOT EXISTS manager_work_start_time TIME DEFAULT '08:30:00';
ALTER TABLE organization_settings ADD COLUMN IF NOT EXISTS manager_work_end_time TIME DEFAULT '17:30:00';
ALTER TABLE organization_settings ADD COLUMN IF NOT EXISTS break_duration_minutes INTEGER DEFAULT 60;
ALTER TABLE organization_settings ADD COLUMN IF NOT EXISTS allow_adhoc_times BOOLEAN DEFAULT FALSE;
ALTER TABLE organization_settings ADD COLUMN IF NOT EXISTS require_approval_for_adhoc BOOLEAN DEFAULT TRUE;
ALTER TABLE organization_settings ADD COLUMN IF NOT EXISTS late_threshold_minutes INTEGER DEFAULT 15;
ALTER TABLE organization_settings ADD COLUMN IF NOT EXISTS early_leave_threshold_minutes INTEGER DEFAULT 30;
ALTER TABLE organization_settings ADD COLUMN IF NOT EXISTS auto_checkout_enabled BOOLEAN DEFAULT FALSE;
ALTER TABLE organization_settings ADD COLUMN IF NOT EXISTS auto_checkout_time TIME DEFAULT '18:00:00';

-- Update existing organization settings with default values
UPDATE organization_settings 
SET 
  work_start_time = '09:00:00',
  work_end_time = '17:00:00',
  manager_work_start_time = '08:30:00',
  manager_work_end_time = '17:30:00',
  break_duration_minutes = 60,
  allow_adhoc_times = FALSE,
  require_approval_for_adhoc = TRUE,
  late_threshold_minutes = 15,
  early_leave_threshold_minutes = 30,
  auto_checkout_enabled = FALSE,
  auto_checkout_time = '18:00:00'
WHERE 
  work_start_time IS NULL OR 
  work_end_time IS NULL OR 
  manager_work_start_time IS NULL OR 
  manager_work_end_time IS NULL;