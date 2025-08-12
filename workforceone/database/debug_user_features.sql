-- Debug specific user features
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
WHERE p.full_name ILIKE '%jordan%' OR p.full_name ILIKE '%lika%'
ORDER BY p.full_name;