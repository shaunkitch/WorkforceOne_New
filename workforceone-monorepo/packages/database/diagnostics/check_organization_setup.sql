-- Diagnostic Script for Organization Setup Issues
-- Run this to identify differences between organizations and fix data issues

-- 1. Check all organizations
SELECT 
    id,
    name,
    slug,
    logo_url,
    feature_flags,
    created_at
FROM public.organizations
ORDER BY created_at;

-- 2. Check profiles by organization
SELECT 
    o.name as org_name,
    p.id as profile_id,
    p.full_name,
    p.email,
    p.role,
    p.organization_id,
    p.is_active,
    p.feature_flags,
    p.created_at
FROM public.organizations o
LEFT JOIN public.profiles p ON o.id = p.organization_id
ORDER BY o.name, p.created_at;

-- 3. Identify profiles without organization_id
SELECT 
    id,
    full_name,
    email,
    role,
    organization_id,
    created_at
FROM public.profiles
WHERE organization_id IS NULL;

-- 4. Check for duplicate emails across organizations
SELECT 
    email,
    COUNT(*) as count,
    array_agg(organization_id) as org_ids,
    array_agg(full_name) as names
FROM public.profiles
GROUP BY email
HAVING COUNT(*) > 1;

-- 5. Check organization settings consistency
SELECT 
    o.id,
    o.name,
    o.feature_flags,
    COUNT(p.id) as user_count,
    COUNT(CASE WHEN p.role = 'admin' THEN 1 END) as admin_count,
    COUNT(CASE WHEN p.role = 'manager' THEN 1 END) as manager_count,
    COUNT(CASE WHEN p.role = 'member' THEN 1 END) as member_count
FROM public.organizations o
LEFT JOIN public.profiles p ON o.id = p.organization_id
GROUP BY o.id, o.name, o.feature_flags
ORDER BY o.created_at;

-- 6. Check for missing required data
SELECT 
    'Missing organization name' as issue,
    COUNT(*) as count
FROM public.organizations
WHERE name IS NULL OR name = ''
UNION ALL
SELECT 
    'Profiles without organization_id' as issue,
    COUNT(*) as count
FROM public.profiles
WHERE organization_id IS NULL
UNION ALL
SELECT 
    'Organizations without feature_flags' as issue,
    COUNT(*) as count
FROM public.organizations
WHERE feature_flags IS NULL
UNION ALL
SELECT 
    'Organizations without any users' as issue,
    COUNT(*) as count
FROM public.organizations o
WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.organization_id = o.id);