-- Fix Organization Default Feature Flags
-- This migration ensures new organizations get proper default feature flags

-- 1. Update the organizations table to have a proper default for feature_flags
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
    "settings": true
}'::jsonb;

-- 2. Update any existing organizations that have null or empty feature_flags
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
    "settings": true
}'::jsonb
WHERE feature_flags IS NULL OR feature_flags = '{}'::jsonb;

-- 3. Add a constraint to ensure feature_flags is never null
ALTER TABLE public.organizations 
ALTER COLUMN feature_flags SET NOT NULL;

-- 4. Verify all organizations now have proper feature flags
SELECT name, feature_flags FROM public.organizations;