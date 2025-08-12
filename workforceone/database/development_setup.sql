-- ===================================
-- WorkforceOne Development Setup
-- Run this to set up the app for smooth development
-- ===================================

-- 1. Disable RLS for development (prevents 403 errors)
ALTER TABLE organizations DISABLE ROW LEVEL SECURITY;
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE teams DISABLE ROW LEVEL SECURITY;
ALTER TABLE team_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE time_entries DISABLE ROW LEVEL SECURITY;
ALTER TABLE attendance DISABLE ROW LEVEL SECURITY;
ALTER TABLE leave_requests DISABLE ROW LEVEL SECURITY;
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE documents DISABLE ROW LEVEL SECURITY;
ALTER TABLE leave_balances DISABLE ROW LEVEL SECURITY;
ALTER TABLE task_comments DISABLE ROW LEVEL SECURITY;
ALTER TABLE task_attachments DISABLE ROW LEVEL SECURITY;

-- 2. Grant full permissions to authenticated users for development
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- 3. Create a default organization if none exists
INSERT INTO organizations (name, slug, settings, feature_flags)
SELECT 'Default Organization', 'default-org', '{}', '{
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
WHERE NOT EXISTS (SELECT 1 FROM organizations WHERE slug = 'default-org');

-- 4. Create the profile creation trigger if it doesn't exist
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    default_org_id UUID;
BEGIN
    -- Get default organization
    SELECT id INTO default_org_id FROM organizations WHERE slug = 'default-org' LIMIT 1;
    
    -- Insert new profile
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

-- Drop and recreate trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE handle_new_user();

-- 5. Create profiles for any existing users without profiles
INSERT INTO profiles (id, email, full_name, organization_id, is_active)
SELECT 
    au.id,
    au.email,
    COALESCE(au.raw_user_meta_data->>'full_name', split_part(au.email, '@', 1)),
    (SELECT id FROM organizations WHERE slug = 'default-org' LIMIT 1),
    true
FROM auth.users au
WHERE au.id NOT IN (SELECT id FROM profiles WHERE id IS NOT NULL)
ON CONFLICT (id) DO NOTHING;

-- 6. Ensure storage buckets exist with proper permissions
INSERT INTO storage.buckets (id, name, public)
VALUES 
    ('documents', 'documents', true),
    ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- 7. Create permissive storage policies for development
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;
DROP POLICY IF EXISTS "Users can manage their files" ON storage.objects;

CREATE POLICY "Public Access" ON storage.objects
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can upload" ON storage.objects
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update" ON storage.objects
    FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete" ON storage.objects
    FOR DELETE USING (auth.uid() IS NOT NULL);

-- 8. Create some sample data for development
DO $$
DECLARE
    sample_user_id UUID;
    sample_org_id UUID;
    sample_team_id UUID;
    sample_project_id UUID;
BEGIN
    -- Get or use first organization
    SELECT id INTO sample_org_id FROM organizations LIMIT 1;
    
    -- Get or use first user
    SELECT id INTO sample_user_id FROM profiles LIMIT 1;
    
    -- Only create sample data if we have a user
    IF sample_user_id IS NOT NULL THEN
        -- Create sample team
        INSERT INTO teams (organization_id, name, description, team_lead_id, department)
        VALUES (sample_org_id, 'Development Team', 'Main development team', sample_user_id, 'Engineering')
        ON CONFLICT DO NOTHING
        RETURNING id INTO sample_team_id;
        
        -- Add user to team
        INSERT INTO team_members (team_id, user_id, role)
        VALUES (sample_team_id, sample_user_id, 'lead')
        ON CONFLICT DO NOTHING;
        
        -- Create sample project
        INSERT INTO projects (
            organization_id, name, description, status, priority, 
            progress, team_id, project_manager_id, start_date, budget
        )
        VALUES (
            sample_org_id, 'WorkforceOne Development', 'Main project development', 
            'active', 'high', 75, sample_team_id, sample_user_id, 
            CURRENT_DATE, 50000.00
        )
        ON CONFLICT DO NOTHING
        RETURNING id INTO sample_project_id;
        
        -- Create sample tasks
        INSERT INTO tasks (
            project_id, assignee_id, reporter_id, team_id, title, 
            description, status, priority, estimated_hours
        )
        VALUES 
            (sample_project_id, sample_user_id, sample_user_id, sample_team_id, 
             'Setup Database Schema', 'Create and configure database tables', 
             'completed', 'high', 8),
            (sample_project_id, sample_user_id, sample_user_id, sample_team_id, 
             'Implement Authentication', 'Setup user authentication system', 
             'in_progress', 'high', 12),
            (sample_project_id, sample_user_id, sample_user_id, sample_team_id, 
             'Create Dashboard UI', 'Build main dashboard interface', 
             'todo', 'medium', 16)
        ON CONFLICT DO NOTHING;
        
        RAISE NOTICE 'Sample data created successfully';
    ELSE
        RAISE NOTICE 'No users found - sample data not created';
    END IF;
    
EXCEPTION
    WHEN others THEN
        RAISE NOTICE 'Error creating sample data: %', SQLERRM;
END $$;

-- 9. Final success message
DO $$ 
BEGIN
    RAISE NOTICE '==============================================';
    RAISE NOTICE 'DEVELOPMENT SETUP COMPLETE!';
    RAISE NOTICE '';
    RAISE NOTICE '✅ RLS disabled for easy development';
    RAISE NOTICE '✅ Permissions granted to authenticated users';
    RAISE NOTICE '✅ Profile creation trigger installed';
    RAISE NOTICE '✅ Storage buckets configured';
    RAISE NOTICE '✅ Sample data created (if users exist)';
    RAISE NOTICE '';
    RAISE NOTICE 'Your app should now work without 403/401 errors!';
    RAISE NOTICE 'Remember to run production setup before deploying.';
    RAISE NOTICE '==============================================';
END $$;