-- ===================================
-- WorkforceOne Simple Database Verification
-- Quick checks to ensure everything is working
-- ===================================

-- 1. Check all tables exist (simple approach)
SELECT 
    CASE 
        WHEN COUNT(*) = 14 THEN 'SUCCESS: All 14 required tables exist'
        ELSE 'ERROR: Missing tables. Found ' || COUNT(*) || ' of 14 tables'
    END as table_check
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
    'organizations', 'profiles', 'teams', 'team_members', 'projects', 
    'tasks', 'time_entries', 'attendance', 'leave_requests', 'notifications',
    'documents', 'leave_balances', 'task_comments', 'task_attachments'
);

-- 2. Check key columns exist
SELECT 
    table_name,
    column_name,
    data_type,
    'EXISTS' as status
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND (
    (table_name = 'profiles' AND column_name IN ('job_title', 'bio', 'location')) OR
    (table_name = 'teams' AND column_name IN ('team_lead_id', 'department')) OR
    (table_name = 'projects' AND column_name IN ('priority', 'progress', 'team_id', 'project_manager_id')) OR
    (table_name = 'tasks' AND column_name IN ('assignee_id', 'reporter_id', 'team_id')) OR
    (table_name = 'leave_requests' AND column_name IN ('employee_id', 'leave_type'))
)
ORDER BY table_name, column_name;

-- 3. Check storage buckets
SELECT 
    id as bucket_name,
    name,
    public,
    'EXISTS' as status
FROM storage.buckets 
WHERE id IN ('documents', 'avatars');

-- 4. Check RLS is enabled
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN (
    'organizations', 'profiles', 'teams', 'team_members', 'projects', 
    'tasks', 'time_entries', 'attendance', 'leave_requests', 'notifications',
    'documents', 'leave_balances', 'task_comments', 'task_attachments'
)
ORDER BY tablename;

-- 5. Check some key policies exist
SELECT 
    schemaname,
    tablename,
    policyname,
    'EXISTS' as status
FROM pg_policies 
WHERE schemaname = 'public'
AND tablename IN ('notifications', 'documents', 'leave_balances', 'task_comments')
ORDER BY tablename, policyname;

-- 6. Sample data test - try to insert and delete a test record
DO $$
DECLARE
    test_org_id UUID;
BEGIN
    -- Insert test organization
    INSERT INTO organizations (name, slug) 
    VALUES ('Test Verification Org', 'test-verification-' || extract(epoch from now())::text) 
    RETURNING id INTO test_org_id;
    
    -- Clean up
    DELETE FROM organizations WHERE id = test_org_id;
    
    RAISE NOTICE 'SUCCESS: Basic insert/delete operations work correctly';
EXCEPTION
    WHEN others THEN
        RAISE NOTICE 'WARNING: Database operations may have issues: %', SQLERRM;
END $$;

-- 7. Final summary
SELECT 'Database verification completed. Check results above.' as summary;