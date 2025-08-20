-- Fix ServiceNow organization feature flags
-- Update the ServiceNow organization to have proper default features

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
WHERE name = 'ServiceNow';

-- Verify the update
SELECT name, feature_flags 
FROM public.organizations 
WHERE name = 'ServiceNow';

-- Show effective features for users in ServiceNow after the fix
SELECT 
    p.full_name,
    p.email,
    get_user_effective_features(p.id) as effective_features
FROM profiles p
JOIN organizations o ON p.organization_id = o.id
WHERE o.name = 'ServiceNow';