-- =============================================
-- DATABASE SCHEMA & RLS POLICY EXTRACTION SCRIPT
-- Run this in Supabase SQL Editor to get complete database info
-- =============================================

DO $$
BEGIN
    RAISE NOTICE '📊 WORKFORCEONE DATABASE SCHEMA EXTRACTION';
    RAISE NOTICE '=====================================================';
    RAISE NOTICE 'Generated: %', NOW();
    RAISE NOTICE '';
END $$;

-- =============================================
-- 1. DATABASE OVERVIEW
-- =============================================
DO $$
BEGIN
    RAISE NOTICE '🗄️  DATABASE OVERVIEW';
    RAISE NOTICE '---------------------';
    RAISE NOTICE 'PostgreSQL Version: %', version();
    RAISE NOTICE 'Current Database: %', current_database();
    RAISE NOTICE 'Current Schema: %', current_schema();
    RAISE NOTICE 'Search Path: %', current_setting('search_path');
    RAISE NOTICE '';
END $$;

-- =============================================
-- 2. INSTALLED EXTENSIONS
-- =============================================
DO $$
DECLARE
    ext_record RECORD;
BEGIN
    RAISE NOTICE '🔧 INSTALLED EXTENSIONS';
    RAISE NOTICE '-----------------------';
    
    FOR ext_record IN 
        SELECT extname, extversion 
        FROM pg_extension 
        ORDER BY extname
    LOOP
        RAISE NOTICE '  - % (version: %)', ext_record.extname, ext_record.extversion;
    END LOOP;
    
    RAISE NOTICE '';
END $$;

-- =============================================
-- 3. ALL SCHEMAS
-- =============================================
DO $$
DECLARE
    schema_record RECORD;
BEGIN
    RAISE NOTICE '📁 DATABASE SCHEMAS';
    RAISE NOTICE '-------------------';
    
    FOR schema_record IN 
        SELECT schema_name, schema_owner
        FROM information_schema.schemata 
        WHERE schema_name NOT IN ('information_schema', 'pg_catalog', 'pg_toast')
        ORDER BY schema_name
    LOOP
        RAISE NOTICE '  - % (owner: %)', schema_record.schema_name, schema_record.schema_owner;
    END LOOP;
    
    RAISE NOTICE '';
END $$;

-- =============================================
-- 4. ALL TABLES WITH DETAILS
-- =============================================
DO $$
DECLARE
    table_record RECORD;
    column_record RECORD;
    column_count INTEGER;
BEGIN
    RAISE NOTICE '📋 ALL TABLES AND COLUMNS';
    RAISE NOTICE '-------------------------';
    
    FOR table_record IN 
        SELECT table_schema, table_name, table_type
        FROM information_schema.tables 
        WHERE table_schema IN ('public', 'auth', 'storage')
        ORDER BY table_schema, table_name
    LOOP
        -- Get column count
        SELECT COUNT(*) INTO column_count
        FROM information_schema.columns
        WHERE table_schema = table_record.table_schema 
        AND table_name = table_record.table_name;
        
        RAISE NOTICE '';
        RAISE NOTICE '📊 TABLE: %.% (% columns)', 
            table_record.table_schema, table_record.table_name, column_count;
        RAISE NOTICE '   Type: %', table_record.table_type;
        
        -- List all columns for this table
        FOR column_record IN
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns
            WHERE table_schema = table_record.table_schema 
            AND table_name = table_record.table_name
            ORDER BY ordinal_position
        LOOP
            RAISE NOTICE '   └─ % (%) %% DEFAULT: %', 
                column_record.column_name,
                column_record.data_type,
                CASE WHEN column_record.is_nullable = 'YES' THEN 'NULL' ELSE 'NOT NULL' END,
                COALESCE(column_record.column_default, 'none');
        END LOOP;
    END LOOP;
    
    RAISE NOTICE '';
END $$;

-- =============================================
-- 5. ALL RLS POLICIES
-- =============================================
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    RAISE NOTICE '🔒 ROW LEVEL SECURITY POLICIES';
    RAISE NOTICE '------------------------------';
    
    FOR policy_record IN 
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
        ORDER BY schemaname, tablename, policyname
    LOOP
        RAISE NOTICE '';
        RAISE NOTICE '🛡️  POLICY: %', policy_record.policyname;
        RAISE NOTICE '   Table: %.%', policy_record.schemaname, policy_record.tablename;
        RAISE NOTICE '   Type: %', policy_record.permissive;
        RAISE NOTICE '   Command: %', policy_record.cmd;
        RAISE NOTICE '   Roles: %', policy_record.roles;
        RAISE NOTICE '   Using: %', COALESCE(policy_record.qual, 'true');
        RAISE NOTICE '   With Check: %', COALESCE(policy_record.with_check, 'none');
    END LOOP;
    
    RAISE NOTICE '';
END $$;

-- =============================================
-- 6. FOREIGN KEY CONSTRAINTS
-- =============================================
DO $$
DECLARE
    fk_record RECORD;
BEGIN
    RAISE NOTICE '🔗 FOREIGN KEY CONSTRAINTS';
    RAISE NOTICE '--------------------------';
    
    FOR fk_record IN
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
        ORDER BY tc.table_schema, tc.table_name, tc.constraint_name
    LOOP
        RAISE NOTICE '';
        RAISE NOTICE '🔗 FK: %', fk_record.constraint_name;
        RAISE NOTICE '   From: %.%.%', fk_record.table_schema, fk_record.table_name, fk_record.column_name;
        RAISE NOTICE '   To: %.%.%', fk_record.foreign_table_schema, fk_record.foreign_table_name, fk_record.foreign_column_name;
        RAISE NOTICE '   On Update: % | On Delete: %', fk_record.update_rule, fk_record.delete_rule;
    END LOOP;
    
    RAISE NOTICE '';
END $$;

-- =============================================
-- 7. INDEXES
-- =============================================
DO $$
DECLARE
    index_record RECORD;
BEGIN
    RAISE NOTICE '📇 DATABASE INDEXES';
    RAISE NOTICE '------------------';
    
    FOR index_record IN
        SELECT 
            schemaname,
            tablename,
            indexname,
            indexdef
        FROM pg_indexes
        WHERE schemaname IN ('public', 'auth', 'storage')
        ORDER BY schemaname, tablename, indexname
    LOOP
        RAISE NOTICE '';
        RAISE NOTICE '📇 INDEX: %', index_record.indexname;
        RAISE NOTICE '   Table: %.%', index_record.schemaname, index_record.tablename;
        RAISE NOTICE '   Definition: %', index_record.indexdef;
    END LOOP;
    
    RAISE NOTICE '';
END $$;

-- =============================================
-- 8. TRIGGERS
-- =============================================
DO $$
DECLARE
    trigger_record RECORD;
BEGIN
    RAISE NOTICE '⚡ DATABASE TRIGGERS';
    RAISE NOTICE '-------------------';
    
    FOR trigger_record IN
        SELECT 
            trigger_schema,
            trigger_name,
            event_object_table,
            action_timing,
            event_manipulation,
            action_statement
        FROM information_schema.triggers
        WHERE trigger_schema IN ('public', 'auth', 'storage')
        ORDER BY trigger_schema, event_object_table, trigger_name
    LOOP
        RAISE NOTICE '';
        RAISE NOTICE '⚡ TRIGGER: %', trigger_record.trigger_name;
        RAISE NOTICE '   Table: %.%', trigger_record.trigger_schema, trigger_record.event_object_table;
        RAISE NOTICE '   Timing: % %', trigger_record.action_timing, trigger_record.event_manipulation;
        RAISE NOTICE '   Action: %', trigger_record.action_statement;
    END LOOP;
    
    RAISE NOTICE '';
END $$;

-- =============================================
-- 9. FUNCTIONS AND PROCEDURES
-- =============================================
DO $$
DECLARE
    func_record RECORD;
BEGIN
    RAISE NOTICE '⚙️  FUNCTIONS AND PROCEDURES';
    RAISE NOTICE '----------------------------';
    
    FOR func_record IN
        SELECT 
            routine_schema,
            routine_name,
            routine_type,
            data_type
        FROM information_schema.routines
        WHERE routine_schema IN ('public', 'auth', 'storage')
        ORDER BY routine_schema, routine_name
    LOOP
        RAISE NOTICE '';
        RAISE NOTICE '⚙️  %: %', func_record.routine_type, func_record.routine_name;
        RAISE NOTICE '   Schema: %', func_record.routine_schema;
        RAISE NOTICE '   Returns: %', func_record.data_type;
    END LOOP;
    
    RAISE NOTICE '';
END $$;

-- =============================================
-- 10. TABLE SIZES AND ROW COUNTS
-- =============================================
DO $$
DECLARE
    size_record RECORD;
BEGIN
    RAISE NOTICE '📊 TABLE SIZES AND ROW COUNTS';
    RAISE NOTICE '-----------------------------';
    
    FOR size_record IN
        SELECT 
            schemaname,
            tablename,
            pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size,
            pg_stat_get_tuples_returned(c.oid) as row_count
        FROM pg_tables pt
        JOIN pg_class c ON c.relname = pt.tablename
        WHERE schemaname IN ('public', 'auth', 'storage')
        ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
    LOOP
        RAISE NOTICE '📊 %.%: % (% rows)', 
            size_record.schemaname, 
            size_record.tablename,
            size_record.size,
            size_record.row_count;
    END LOOP;
    
    RAISE NOTICE '';
END $$;

-- =============================================
-- 11. PERMISSIONS SUMMARY
-- =============================================
DO $$
DECLARE
    perm_record RECORD;
BEGIN
    RAISE NOTICE '🔐 TABLE PERMISSIONS';
    RAISE NOTICE '--------------------';
    
    FOR perm_record IN
        SELECT 
            table_schema,
            table_name,
            grantee,
            privilege_type,
            is_grantable
        FROM information_schema.table_privileges
        WHERE table_schema IN ('public', 'auth', 'storage')
        AND grantee NOT IN ('postgres', 'supabase_admin')
        ORDER BY table_schema, table_name, grantee
    LOOP
        RAISE NOTICE '🔐 %.%: % has % (%)',
            perm_record.table_schema,
            perm_record.table_name,
            perm_record.grantee,
            perm_record.privilege_type,
            CASE WHEN perm_record.is_grantable = 'YES' THEN 'grantable' ELSE 'not grantable' END;
    END LOOP;
    
    RAISE NOTICE '';
END $$;

-- =============================================
-- SUMMARY
-- =============================================
DO $$
DECLARE
    table_count INTEGER;
    policy_count INTEGER;
    index_count INTEGER;
    trigger_count INTEGER;
BEGIN
    -- Count tables
    SELECT COUNT(*) INTO table_count
    FROM information_schema.tables 
    WHERE table_schema IN ('public', 'auth', 'storage');
    
    -- Count policies
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies 
    WHERE schemaname IN ('public', 'auth', 'storage');
    
    -- Count indexes
    SELECT COUNT(*) INTO index_count
    FROM pg_indexes
    WHERE schemaname IN ('public', 'auth', 'storage');
    
    -- Count triggers
    SELECT COUNT(*) INTO trigger_count
    FROM information_schema.triggers
    WHERE trigger_schema IN ('public', 'auth', 'storage');
    
    RAISE NOTICE '📈 DATABASE SUMMARY';
    RAISE NOTICE '==================';
    RAISE NOTICE 'Total Tables: %', table_count;
    RAISE NOTICE 'Total RLS Policies: %', policy_count;
    RAISE NOTICE 'Total Indexes: %', index_count;
    RAISE NOTICE 'Total Triggers: %', trigger_count;
    RAISE NOTICE '';
    RAISE NOTICE '✅ Schema extraction complete!';
    RAISE NOTICE 'Copy all output above and provide to Claude for analysis.';
END $$;