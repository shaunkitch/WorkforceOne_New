-- Migration 074: Add Security Feature Flag (Fixed)
-- This migration adds the security feature flag to enable/disable the security guard patrol system

-- First, add security feature flag to all existing organizations (disabled by default for safety)
UPDATE public.organizations 
SET feature_flags = feature_flags || '{"security": false}'::jsonb
WHERE feature_flags IS NOT NULL 
AND NOT feature_flags ? 'security';

-- Handle organizations where feature_flags is null - set complete default
UPDATE public.organizations 
SET feature_flags = '{
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
    "security": false,
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
}'::jsonb
WHERE feature_flags IS NULL;

-- Update the default for new organizations (with complete feature set including security)
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
    "security": false,
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

-- Update the column comment to include security information
COMMENT ON COLUMN public.organizations.feature_flags IS 'JSON object containing feature flags for the organization. Includes: dashboard, time_tracking, attendance, maps, teams, projects, tasks, forms, leave, outlets, security (patrol system), settings, analytics, reports, automation, integrations. Mobile-specific flags: mobile_clock_in (attendance), mobile_daily_visits (location tracking), mobile_tasks (task management), mobile_forms (form completion), mobile_leave (leave requests), mobile_payslips (payslip viewing), mobile_offline_mode (offline functionality), mobile_push_notifications (push notifications)';

-- Verify security feature flag has been added to all organizations
SELECT 
    name,
    feature_flags->'security' as security_enabled,
    feature_flags->'dashboard' as dashboard_enabled,
    feature_flags->'mobile_clock_in' as mobile_clock_in_enabled
FROM public.organizations
ORDER BY name;