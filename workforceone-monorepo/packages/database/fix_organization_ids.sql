-- ===================================
-- Fix Organization IDs for Existing Users
-- This fixes the "organization_id cannot be null" error
-- ===================================

-- 1. Ensure we have a default organization
INSERT INTO organizations (name, slug, settings)
SELECT 'Default Organization', 'default-org', '{}'
WHERE NOT EXISTS (SELECT 1 FROM organizations WHERE slug = 'default-org');

-- 2. Get the default organization ID
DO $$
DECLARE
    default_org_id UUID;
    users_updated INTEGER := 0;
BEGIN
    -- Get default organization ID
    SELECT id INTO default_org_id FROM organizations WHERE slug = 'default-org' LIMIT 1;
    
    IF default_org_id IS NULL THEN
        RAISE EXCEPTION 'Could not find or create default organization';
    END IF;
    
    -- Update all profiles without organization_id
    UPDATE profiles 
    SET organization_id = default_org_id 
    WHERE organization_id IS NULL;
    
    GET DIAGNOSTICS users_updated = ROW_COUNT;
    
    RAISE NOTICE 'Updated % users with default organization ID: %', users_updated, default_org_id;
END $$;

-- 3. Make sure all future profiles get an organization_id
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    default_org_id UUID;
BEGIN
    -- Get default organization
    SELECT id INTO default_org_id FROM organizations WHERE slug = 'default-org' LIMIT 1;
    
    -- If no default org, create one
    IF default_org_id IS NULL THEN
        INSERT INTO organizations (name, slug, settings, feature_flags)
        VALUES ('Default Organization', 'default-org', '{}', '{
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
        }'::jsonb)
        RETURNING id INTO default_org_id;
    END IF;
    
    -- Insert new profile with organization
    INSERT INTO public.profiles (
        id, 
        email, 
        full_name, 
        avatar_url,
        organization_id,
        is_active
    )
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        NEW.raw_user_meta_data->>'avatar_url',
        default_org_id,
        true
    );
    RETURN NEW;
EXCEPTION
    WHEN others THEN
        -- Log error but don't fail the trigger
        RAISE WARNING 'Failed to create profile for user %: %', NEW.id, SQLERRM;
        RETURN NEW;
END;
$$ language 'plpgsql' security definer;

-- 4. Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE handle_new_user();

-- 5. Verify all profiles have organization_id
DO $$
DECLARE
    profiles_without_org INTEGER;
BEGIN
    SELECT COUNT(*) INTO profiles_without_org 
    FROM profiles 
    WHERE organization_id IS NULL;
    
    IF profiles_without_org > 0 THEN
        RAISE WARNING '% profiles still without organization_id', profiles_without_org;
    ELSE
        RAISE NOTICE 'SUCCESS: All profiles now have organization_id';
    END IF;
END $$;

-- 6. Create sample teams for the default organization
DO $$
DECLARE
    default_org_id UUID;
    sample_user_id UUID;
    dev_team_id UUID;
BEGIN
    -- Get default organization
    SELECT id INTO default_org_id FROM organizations WHERE slug = 'default-org' LIMIT 1;
    
    -- Get a sample user
    SELECT id INTO sample_user_id FROM profiles WHERE organization_id = default_org_id LIMIT 1;
    
    IF sample_user_id IS NOT NULL THEN
        -- Create development team if it doesn't exist
        INSERT INTO teams (organization_id, name, description, team_lead_id, department)
        VALUES (default_org_id, 'Development Team', 'Main development team', sample_user_id, 'Engineering')
        ON CONFLICT DO NOTHING
        RETURNING id INTO dev_team_id;
        
        -- Add sample user to team
        INSERT INTO team_members (team_id, user_id, role)
        VALUES (COALESCE(dev_team_id, (SELECT id FROM teams WHERE name = 'Development Team' LIMIT 1)), sample_user_id, 'lead')
        ON CONFLICT (team_id, user_id) DO NOTHING;
        
        RAISE NOTICE 'Created sample team and added user';
    ELSE
        RAISE NOTICE 'No users found for creating sample team';
    END IF;
END $$;

-- 7. Final verification and success message
DO $$ 
DECLARE
    org_count INTEGER;
    profile_count INTEGER;
    profiles_with_org INTEGER;
BEGIN
    SELECT COUNT(*) INTO org_count FROM organizations;
    SELECT COUNT(*) INTO profile_count FROM profiles;
    SELECT COUNT(*) INTO profiles_with_org FROM profiles WHERE organization_id IS NOT NULL;
    
    RAISE NOTICE '==============================================';
    RAISE NOTICE 'ORGANIZATION FIX COMPLETED!';
    RAISE NOTICE '';
    RAISE NOTICE 'Organizations: %', org_count;
    RAISE NOTICE 'Total Profiles: %', profile_count;
    RAISE NOTICE 'Profiles with Organization: %', profiles_with_org;
    RAISE NOTICE '';
    
    IF profiles_with_org = profile_count AND profile_count > 0 THEN
        RAISE NOTICE '✅ All profiles have organization_id';
        RAISE NOTICE '✅ Projects and tasks should now create successfully';
    ELSIF profile_count = 0 THEN
        RAISE NOTICE '⚠️  No user profiles found - they will be created automatically on next login';
    ELSE
        RAISE NOTICE '⚠️  Some profiles still missing organization_id';
    END IF;
    RAISE NOTICE '==============================================';
END $$;