-- Test User Feature Flags
-- This script helps test and debug individual user feature overrides

-- 1. Show all users with their feature settings
SELECT 
    p.full_name,
    p.email,
    p.role,
    o.name as organization,
    o.feature_flags as org_features,
    p.feature_flags as user_overrides,
    get_user_effective_features(p.id) as effective_features
FROM profiles p
JOIN organizations o ON p.organization_id = o.id
ORDER BY p.full_name;

-- 2. Test specific user (replace with Jordan's user ID if known)
-- Find Jordan's user ID first:
SELECT id, full_name, email 
FROM profiles 
WHERE full_name ILIKE '%jordan%' OR email ILIKE '%jordan%';

-- 3. Test the effective features function for a specific user
-- (Uncomment and replace USER_ID with actual ID)
-- SELECT get_user_effective_features('USER_ID_HERE');

-- 4. Check if Jordan has any user-specific overrides
SELECT 
    full_name,
    email,
    feature_flags as user_overrides
FROM profiles 
WHERE (full_name ILIKE '%jordan%' OR email ILIKE '%jordan%')
AND feature_flags != '{}'::jsonb;

-- 5. Show organization default features
SELECT name, feature_flags as org_defaults 
FROM organizations;