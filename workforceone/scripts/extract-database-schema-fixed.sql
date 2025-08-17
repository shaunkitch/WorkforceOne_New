-- =============================================
-- FIXED DATABASE SCHEMA EXTRACTION
-- Compatible with Supabase SQL Editor
-- =============================================

-- 1. DATABASE OVERVIEW
SELECT 'DATABASE OVERVIEW' as section;
SELECT version() as postgresql_version;
SELECT current_database() as current_database;
SELECT current_schema() as current_schema;
SELECT current_setting('search_path') as search_path;

-- 2. INSTALLED EXTENSIONS
SELECT 'INSTALLED EXTENSIONS' as section;
SELECT extname as extension_name, extversion as version 
FROM pg_extension 
ORDER BY extname;

-- 3. ALL SCHEMAS
SELECT 'DATABASE SCHEMAS' as section;
SELECT schema_name, schema_owner
FROM information_schema.schemata 
WHERE schema_name NOT IN ('information_schema', 'pg_catalog', 'pg_toast')
ORDER BY schema_name;

-- 4. ALL TABLES
SELECT 'ALL TABLES' as section;
SELECT table_schema, table_name, table_type
FROM information_schema.tables 
WHERE table_schema IN ('public', 'auth', 'storage')
ORDER BY table_schema, table_name;

-- 5. ALL COLUMNS
SELECT 'TABLE COLUMNS' as section;
SELECT 
    table_schema,
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default,
    ordinal_position
FROM information_schema.columns
WHERE table_schema IN ('public', 'auth', 'storage')
ORDER BY table_schema, table_name, ordinal_position;

-- 6. ALL RLS POLICIES
SELECT 'RLS POLICIES' as section;
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
ORDER BY schemaname, tablename, policyname;

-- 7. FOREIGN KEY CONSTRAINTS
SELECT 'FOREIGN KEY CONSTRAINTS' as section;
SELECT 
    tc.table_schema,
    tc.table_name, 
    tc.constraint_name, 
    kcu.column_name,
    ccu.table_schema AS foreign_table_schema,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    rc.update_rule,
    rc.delete_rule
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
JOIN information_schema.referential_constraints AS rc
    ON tc.constraint_name = rc.constraint_name
    AND tc.table_schema = rc.constraint_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
ORDER BY tc.table_schema, tc.table_name, tc.constraint_name;

-- 8. INDEXES
SELECT 'DATABASE INDEXES' as section;
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname IN ('public', 'auth', 'storage')
ORDER BY schemaname, tablename, indexname;

-- 9. TRIGGERS
SELECT 'DATABASE TRIGGERS' as section;
SELECT 
    trigger_schema,
    trigger_name,
    event_object_table,
    action_timing,
    event_manipulation,
    action_statement
FROM information_schema.triggers
WHERE trigger_schema IN ('public', 'auth', 'storage')
ORDER BY trigger_schema, event_object_table, trigger_name;

-- 10. FUNCTIONS
SELECT 'FUNCTIONS AND PROCEDURES' as section;
SELECT 
    routine_schema,
    routine_name,
    routine_type,
    data_type
FROM information_schema.routines
WHERE routine_schema IN ('public', 'auth', 'storage')
ORDER BY routine_schema, routine_name;

-- 11. TABLE PERMISSIONS
SELECT 'TABLE PERMISSIONS' as section;
SELECT 
    table_schema,
    table_name,
    grantee,
    privilege_type,
    is_grantable
FROM information_schema.table_privileges
WHERE table_schema IN ('public', 'auth', 'storage')
AND grantee NOT IN ('postgres', 'supabase_admin')
ORDER BY table_schema, table_name, grantee;

-- 12. CHECK CONSTRAINTS
SELECT 'CHECK CONSTRAINTS' as section;
SELECT 
    tc.table_schema,
    tc.table_name,
    cc.constraint_name,
    cc.check_clause
FROM information_schema.check_constraints cc
JOIN information_schema.table_constraints tc 
    ON cc.constraint_name = tc.constraint_name
WHERE tc.table_schema IN ('public', 'auth', 'storage')
ORDER BY tc.table_schema, tc.table_name, cc.constraint_name;

-- 13. UNIQUE CONSTRAINTS
SELECT 'UNIQUE CONSTRAINTS' as section;
SELECT 
    tc.table_schema,
    tc.table_name,
    tc.constraint_name,
    kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
WHERE tc.constraint_type = 'UNIQUE'
AND tc.table_schema IN ('public', 'auth', 'storage')
ORDER BY tc.table_schema, tc.table_name, tc.constraint_name;

-- 14. PRIMARY KEYS
SELECT 'PRIMARY KEYS' as section;
SELECT 
    tc.table_schema,
    tc.table_name,
    tc.constraint_name,
    kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
WHERE tc.constraint_type = 'PRIMARY KEY'
AND tc.table_schema IN ('public', 'auth', 'storage')
ORDER BY tc.table_schema, tc.table_name, kcu.ordinal_position;

-- 15. SUMMARY COUNTS
SELECT 'SUMMARY' as section;
SELECT 
    'Tables' as item,
    COUNT(*) as count
FROM information_schema.tables 
WHERE table_schema IN ('public', 'auth', 'storage')
UNION ALL
SELECT 
    'RLS Policies' as item,
    COUNT(*) as count
FROM pg_policies 
WHERE schemaname IN ('public', 'auth', 'storage')
UNION ALL
SELECT 
    'Indexes' as item,
    COUNT(*) as count
FROM pg_indexes
WHERE schemaname IN ('public', 'auth', 'storage')
UNION ALL
SELECT 
    'Triggers' as item,
    COUNT(*) as count
FROM information_schema.triggers
WHERE trigger_schema IN ('public', 'auth', 'storage');

-- Final message
SELECT '✅ Schema extraction complete! Copy all results above.' as message;