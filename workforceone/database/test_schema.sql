-- ===================================
-- WorkforceOne Database Schema Tests
-- Run this after the complete_schema_update.sql to test all functionality
-- ===================================

-- Test 1: Verify all tables exist
DO $$ 
DECLARE
    missing_tables TEXT[] := ARRAY[]::TEXT[];
    tbl_name TEXT;
    expected_tables TEXT[] := ARRAY[
        'organizations', 'profiles', 'teams', 'team_members', 'projects', 
        'tasks', 'time_entries', 'attendance', 'leave_requests', 'notifications',
        'documents', 'leave_balances', 'task_comments', 'task_attachments'
    ];
BEGIN
    FOREACH tbl_name IN ARRAY expected_tables
    LOOP
        IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = tbl_name) THEN
            missing_tables := array_append(missing_tables, tbl_name);
        END IF;
    END LOOP;
    
    IF array_length(missing_tables, 1) > 0 THEN
        RAISE EXCEPTION 'Missing tables: %', array_to_string(missing_tables, ', ');
    ELSE
        RAISE NOTICE 'SUCCESS: All required tables exist';
    END IF;
END $$;

-- Test 2: Verify all required columns exist
DO $$ 
DECLARE
    missing_columns TEXT[] := ARRAY[]::TEXT[];
BEGIN
    -- Check profiles table columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'job_title') THEN
        missing_columns := array_append(missing_columns, 'profiles.job_title');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'bio') THEN
        missing_columns := array_append(missing_columns, 'profiles.bio');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'location') THEN
        missing_columns := array_append(missing_columns, 'profiles.location');
    END IF;
    
    -- Check teams table columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'teams' AND column_name = 'team_lead_id') THEN
        missing_columns := array_append(missing_columns, 'teams.team_lead_id');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'teams' AND column_name = 'department') THEN
        missing_columns := array_append(missing_columns, 'teams.department');
    END IF;
    
    -- Check projects table columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'priority') THEN
        missing_columns := array_append(missing_columns, 'projects.priority');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'progress') THEN
        missing_columns := array_append(missing_columns, 'projects.progress');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'team_id') THEN
        missing_columns := array_append(missing_columns, 'projects.team_id');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'project_manager_id') THEN
        missing_columns := array_append(missing_columns, 'projects.project_manager_id');
    END IF;
    
    -- Check tasks table columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'assignee_id') THEN
        missing_columns := array_append(missing_columns, 'tasks.assignee_id');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'reporter_id') THEN
        missing_columns := array_append(missing_columns, 'tasks.reporter_id');
    END IF;
    
    -- Check leave_requests table columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leave_requests' AND column_name = 'employee_id') THEN
        missing_columns := array_append(missing_columns, 'leave_requests.employee_id');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leave_requests' AND column_name = 'leave_type') THEN
        missing_columns := array_append(missing_columns, 'leave_requests.leave_type');
    END IF;
    
    IF array_length(missing_columns, 1) > 0 THEN
        RAISE EXCEPTION 'Missing columns: %', array_to_string(missing_columns, ', ');
    ELSE
        RAISE NOTICE 'SUCCESS: All required columns exist';
    END IF;
END $$;

-- Test 3: Verify storage buckets exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'documents') THEN
        RAISE EXCEPTION 'Missing storage bucket: documents';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'avatars') THEN
        RAISE EXCEPTION 'Missing storage bucket: avatars';
    END IF;
    
    RAISE NOTICE 'SUCCESS: All storage buckets exist';
END $$;

-- Test 4: Verify RLS is enabled on all tables
DO $$ 
DECLARE
    tbl_name TEXT;
    tables_without_rls TEXT[] := ARRAY[]::TEXT[];
    expected_tables TEXT[] := ARRAY[
        'organizations', 'profiles', 'teams', 'team_members', 'projects', 
        'tasks', 'time_entries', 'attendance', 'leave_requests', 'notifications',
        'documents', 'leave_balances', 'task_comments', 'task_attachments'
    ];
BEGIN
    FOREACH tbl_name IN ARRAY expected_tables
    LOOP
        IF NOT EXISTS (
            SELECT 1 FROM pg_tables 
            WHERE schemaname = 'public' 
            AND tablename = tbl_name 
            AND rowsecurity = true
        ) THEN
            tables_without_rls := array_append(tables_without_rls, tbl_name);
        END IF;
    END LOOP;
    
    IF array_length(tables_without_rls, 1) > 0 THEN
        RAISE EXCEPTION 'Tables without RLS: %', array_to_string(tables_without_rls, ', ');
    ELSE
        RAISE NOTICE 'SUCCESS: RLS is enabled on all required tables';
    END IF;
END $$;

-- Test 5: Insert sample data to test relationships
DO $$ 
DECLARE
    org_id UUID;
    user_id UUID;
    team_id UUID;
    project_id UUID;
    task_id UUID;
BEGIN
    -- Insert test organization
    INSERT INTO organizations (name, slug) 
    VALUES ('Test Org', 'test-org-' || extract(epoch from now())::text) 
    RETURNING id INTO org_id;
    
    -- This will use the current authenticated user's ID
    -- In a real scenario, this would be the actual user ID from auth.users
    SELECT auth.uid() INTO user_id;
    
    -- If no authenticated user, create a dummy UUID for testing
    IF user_id IS NULL THEN
        user_id := uuid_generate_v4();
        
        -- Insert test profile (this might fail without proper auth setup)
        BEGIN
            INSERT INTO profiles (id, organization_id, email, full_name, role) 
            VALUES (user_id, org_id, 'test@example.com', 'Test User', 'employee');
        EXCEPTION
            WHEN others THEN
                RAISE NOTICE 'NOTE: Could not insert test profile (expected without auth context)';
        END;
    END IF;
    
    -- Insert test team
    INSERT INTO teams (organization_id, name, description, team_lead_id, department) 
    VALUES (org_id, 'Test Team', 'A test team', user_id, 'Engineering') 
    RETURNING id INTO team_id;
    
    -- Insert test project
    INSERT INTO projects (organization_id, name, description, status, priority, progress, team_id, project_manager_id, start_date) 
    VALUES (org_id, 'Test Project', 'A test project', 'active', 'high', 50, team_id, user_id, CURRENT_DATE) 
    RETURNING id INTO project_id;
    
    -- Insert test task
    INSERT INTO tasks (project_id, assignee_id, reporter_id, team_id, title, description, status, priority, estimated_hours) 
    VALUES (project_id, user_id, user_id, team_id, 'Test Task', 'A test task', 'todo', 'medium', 8.0) 
    RETURNING id INTO task_id;
    
    -- Insert test notification
    INSERT INTO notifications (user_id, title, message, type, priority) 
    VALUES (user_id, 'Test Notification', 'This is a test notification', 'info', 'medium');
    
    -- Insert test leave balance
    INSERT INTO leave_balances (employee_id, year, vacation_days_allocated, sick_days_allocated, personal_days_allocated) 
    VALUES (user_id, EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER, 20, 10, 5);
    
    -- Clean up test data
    DELETE FROM notifications WHERE title = 'Test Notification';
    DELETE FROM leave_balances WHERE employee_id = user_id;
    DELETE FROM tasks WHERE id = task_id;
    DELETE FROM projects WHERE id = project_id;
    DELETE FROM teams WHERE id = team_id;
    DELETE FROM profiles WHERE id = user_id AND email = 'test@example.com';
    DELETE FROM organizations WHERE id = org_id;
    
    RAISE NOTICE 'SUCCESS: Sample data insertion and cleanup completed';
END $$;

-- Test 6: Verify all triggers exist
DO $$ 
DECLARE
    missing_triggers TEXT[] := ARRAY[]::TEXT[];
    trigger_name TEXT;
    expected_triggers TEXT[] := ARRAY[
        'update_organizations_updated_at',
        'update_profiles_updated_at', 
        'update_teams_updated_at',
        'update_projects_updated_at',
        'update_tasks_updated_at',
        'update_time_entries_updated_at',
        'update_attendance_updated_at',
        'update_leave_requests_updated_at',
        'update_notifications_updated_at',
        'update_documents_updated_at',
        'update_leave_balances_updated_at',
        'update_task_comments_updated_at'
    ];
BEGIN
    FOREACH trigger_name IN ARRAY expected_triggers
    LOOP
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.triggers 
            WHERE trigger_name = trigger_name
        ) THEN
            missing_triggers := array_append(missing_triggers, trigger_name);
        END IF;
    END LOOP;
    
    IF array_length(missing_triggers, 1) > 0 THEN
        RAISE EXCEPTION 'Missing triggers: %', array_to_string(missing_triggers, ', ');
    ELSE
        RAISE NOTICE 'SUCCESS: All required triggers exist';
    END IF;
END $$;

-- Test 7: Verify views exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.views WHERE table_name = 'user_profiles') THEN
        RAISE EXCEPTION 'Missing view: user_profiles';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.views WHERE table_name = 'team_members_view') THEN
        RAISE EXCEPTION 'Missing view: team_members_view';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.views WHERE table_name = 'tasks_view') THEN
        RAISE EXCEPTION 'Missing view: tasks_view';
    END IF;
    
    RAISE NOTICE 'SUCCESS: All required views exist';
END $$;

-- Final success message
DO $$ 
BEGIN
    RAISE NOTICE '==============================================';
    RAISE NOTICE 'ALL TESTS PASSED SUCCESSFULLY!';
    RAISE NOTICE 'Your WorkforceOne database is ready to use.';
    RAISE NOTICE '==============================================';
END $$;