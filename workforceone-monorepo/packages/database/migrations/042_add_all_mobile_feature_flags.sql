-- Migration 042: Add All Mobile Feature Flags
-- This migration adds comprehensive mobile-specific feature flags to the organizations table
-- Allows granular control over mobile app features from the admin portal

-- Update the default feature_flags to include all mobile features
ALTER TABLE public.organizations 
ALTER COLUMN feature_flags SET DEFAULT '{
    "dashboard": true,
    "time_tracking": true,
    "attendance": true,
    "maps": true,
    "teams": true,
    "projects": true,
    "tasks": true,
    "forms": true,
    "leave": true,
    "outlets": true,
    "settings": true,
    "analytics": true,
    "reports": true,
    "automation": true,
    "integrations": true,
    "mobile_daily_visits": true,
    "mobile_offline_mode": true,
    "mobile_push_notifications": true,
    "mobile_clock_in": true,
    "mobile_tasks": true,
    "mobile_forms": true,
    "mobile_leave": true,
    "mobile_payslips": true
}'::jsonb;

-- Update all existing organizations to include all mobile feature flags
UPDATE public.organizations 
SET feature_flags = feature_flags || '{
    "mobile_daily_visits": true,
    "mobile_offline_mode": true,
    "mobile_push_notifications": true,
    "mobile_clock_in": true,
    "mobile_tasks": true,
    "mobile_forms": true,
    "mobile_leave": true,
    "mobile_payslips": true
}'::jsonb
WHERE feature_flags IS NOT NULL;

-- Add helpful comments about the mobile features
COMMENT ON COLUMN public.organizations.feature_flags IS 'JSON object containing feature flags for the organization. Mobile-specific flags: mobile_clock_in (attendance), mobile_daily_visits (location tracking), mobile_tasks (task management), mobile_forms (form completion), mobile_leave (leave requests), mobile_payslips (payslip viewing), mobile_offline_mode (offline functionality), mobile_push_notifications (push notifications)';

-- Verify all organizations have the new mobile feature flags
SELECT 
    name,
    feature_flags->'mobile_clock_in' as mobile_clock_in,
    feature_flags->'mobile_daily_visits' as mobile_daily_visits,
    feature_flags->'mobile_tasks' as mobile_tasks,
    feature_flags->'mobile_forms' as mobile_forms,
    feature_flags->'mobile_leave' as mobile_leave,
    feature_flags->'mobile_payslips' as mobile_payslips,
    feature_flags->'mobile_offline_mode' as mobile_offline_mode,
    feature_flags->'mobile_push_notifications' as mobile_push_notifications
FROM public.organizations
ORDER BY name;