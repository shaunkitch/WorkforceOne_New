-- Fix Organization Setup Issues
-- Run this script to resolve common problems with new organizations

-- 1. Ensure all organizations have required columns with proper defaults
UPDATE public.organizations 
SET 
    name = COALESCE(name, 'My Organization'),
    feature_flags = COALESCE(feature_flags, '{
        "time_tracking": true,
        "attendance": true,
        "maps": true,
        "teams": true,
        "projects": true,
        "tasks": true,
        "forms": true,
        "leave": true,
        "outlets": true
    }'::jsonb),
    logo_url = COALESCE(logo_url, NULL)
WHERE name IS NULL OR name = '' OR feature_flags IS NULL;

-- 2. Fix profiles without organization_id (assign to first organization)
UPDATE public.profiles 
SET organization_id = (
    SELECT id FROM public.organizations 
    ORDER BY created_at ASC 
    LIMIT 1
)
WHERE organization_id IS NULL
AND EXISTS (SELECT 1 FROM public.organizations);

-- 3. Ensure every organization has at least one admin
DO $$
DECLARE
    org_record RECORD;
    first_user_id UUID;
BEGIN
    -- Loop through each organization
    FOR org_record IN SELECT id, name FROM public.organizations
    LOOP
        -- Check if organization has any admin users
        IF NOT EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE organization_id = org_record.id AND role = 'admin'
        ) THEN
            -- Get the first user in this organization
            SELECT id INTO first_user_id
            FROM public.profiles 
            WHERE organization_id = org_record.id
            ORDER BY created_at ASC 
            LIMIT 1;
            
            -- If we found a user, make them admin
            IF first_user_id IS NOT NULL THEN
                UPDATE public.profiles 
                SET role = 'admin'
                WHERE id = first_user_id;
                
                RAISE NOTICE 'Made user % admin for organization %', first_user_id, org_record.name;
            END IF;
        END IF;
    END LOOP;
END $$;

-- 4. Fix user feature_flags (ensure column exists and has default value)
UPDATE public.profiles 
SET feature_flags = COALESCE(feature_flags, '{}'::jsonb)
WHERE feature_flags IS NULL;

-- 5. Ensure profiles have proper defaults
UPDATE public.profiles 
SET 
    role = COALESCE(role, 'member'),
    is_active = COALESCE(is_active, true),
    full_name = COALESCE(full_name, split_part(email, '@', 1))
WHERE role IS NULL OR is_active IS NULL OR full_name IS NULL OR full_name = '';

-- 6. Create missing indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_profiles_organization_id ON public.profiles(organization_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_organizations_name ON public.organizations(name);

-- 7. Update any invalid role values
UPDATE public.profiles 
SET role = 'member' 
WHERE role NOT IN ('admin', 'manager', 'member');

-- 8. Fix team_members roles if they exist
UPDATE public.team_members 
SET role = 'member' 
WHERE role NOT IN ('manager', 'member');

-- Show summary after fixes
SELECT 
    'Organizations' as table_name,
    COUNT(*) as total_count,
    COUNT(CASE WHEN name IS NOT NULL AND name != '' THEN 1 END) as with_name,
    COUNT(CASE WHEN feature_flags IS NOT NULL THEN 1 END) as with_features
FROM public.organizations
UNION ALL
SELECT 
    'Profiles' as table_name,
    COUNT(*) as total_count,
    COUNT(CASE WHEN organization_id IS NOT NULL THEN 1 END) as with_org,
    COUNT(CASE WHEN role IN ('admin', 'manager', 'member') THEN 1 END) as valid_roles
FROM public.profiles;