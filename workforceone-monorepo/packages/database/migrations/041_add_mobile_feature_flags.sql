-- Migration 041: Add Mobile Feature Flags
-- This migration adds mobile-specific feature flags to all existing organizations

-- Update the default feature_flags to include mobile features
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
    "mobile_push_notifications": true
}'::jsonb;

-- Update all existing organizations to include mobile feature flags
UPDATE public.organizations 
SET feature_flags = feature_flags || '{
    "mobile_daily_visits": true,
    "mobile_offline_mode": true,
    "mobile_push_notifications": true
}'::jsonb
WHERE feature_flags IS NOT NULL;

-- Verify the update
SELECT name, feature_flags->'mobile_daily_visits' as mobile_daily_visits,
       feature_flags->'mobile_offline_mode' as mobile_offline_mode,
       feature_flags->'mobile_push_notifications' as mobile_push_notifications
FROM public.organizations;