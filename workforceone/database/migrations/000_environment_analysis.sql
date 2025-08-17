-- =============================================
-- ENVIRONMENT ANALYSIS: Check for user_id conflicts
-- =============================================

-- Check 1: Look for any existing triggers that might affect user_id
DO $$
DECLARE
    trigger_record RECORD;
BEGIN
    RAISE NOTICE '🔍 CHECKING DATABASE TRIGGERS...';
    
    FOR trigger_record IN 
        SELECT schemaname, tablename, triggername, triggerdef 
        FROM pg_trigger_depends() 
        WHERE triggerdef ILIKE '%user_id%'
    LOOP
        RAISE NOTICE '⚠️ FOUND TRIGGER affecting user_id: % on %.%', 
            trigger_record.triggername, trigger_record.schemaname, trigger_record.tablename;
    END LOOP;
    
    -- Alternative check using information_schema
    FOR trigger_record IN
        SELECT trigger_name, event_object_table, action_statement
        FROM information_schema.triggers
        WHERE action_statement ILIKE '%user_id%'
    LOOP
        RAISE NOTICE '⚠️ FOUND TRIGGER in info schema: % on %', 
            trigger_record.trigger_name, trigger_record.event_object_table;
    END LOOP;
    
    RAISE NOTICE '✅ Trigger check complete';
END $$;

-- Check 2: Look for any rules that might affect user_id
DO $$
DECLARE
    rule_record RECORD;
BEGIN
    RAISE NOTICE '🔍 CHECKING DATABASE RULES...';
    
    FOR rule_record IN 
        SELECT schemaname, tablename, rulename, definition
        FROM pg_rules
        WHERE definition ILIKE '%user_id%'
    LOOP
        RAISE NOTICE '⚠️ FOUND RULE affecting user_id: % on %.%', 
            rule_record.rulename, rule_record.schemaname, rule_record.tablename;
    END LOOP;
    
    RAISE NOTICE '✅ Rule check complete';
END $$;

-- Check 3: Look for any check constraints mentioning user_id
DO $$
DECLARE
    constraint_record RECORD;
BEGIN
    RAISE NOTICE '🔍 CHECKING CONSTRAINTS...';
    
    FOR constraint_record IN
        SELECT table_name, constraint_name, check_clause
        FROM information_schema.check_constraints
        WHERE check_clause ILIKE '%user_id%'
    LOOP
        RAISE NOTICE '⚠️ FOUND CHECK CONSTRAINT affecting user_id: % on %', 
            constraint_record.constraint_name, constraint_record.table_name;
    END LOOP;
    
    RAISE NOTICE '✅ Constraint check complete';
END $$;

-- Check 4: Look for any foreign key constraints referencing user_id
DO $$
DECLARE
    fk_record RECORD;
BEGIN
    RAISE NOTICE '🔍 CHECKING FOREIGN KEY CONSTRAINTS...';
    
    FOR fk_record IN
        SELECT 
            tc.table_name, 
            tc.constraint_name, 
            kcu.column_name,
            ccu.table_name AS foreign_table_name,
            ccu.column_name AS foreign_column_name
        FROM information_schema.table_constraints AS tc 
        JOIN information_schema.key_column_usage AS kcu
            ON tc.constraint_name = kcu.constraint_name
            AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage AS ccu
            ON ccu.constraint_name = tc.constraint_name
            AND ccu.table_schema = tc.table_schema
        WHERE tc.constraint_type = 'FOREIGN KEY' 
        AND (kcu.column_name = 'user_id' OR ccu.column_name = 'user_id')
    LOOP
        RAISE NOTICE '⚠️ FOUND FK CONSTRAINT: %.% -> %.%', 
            fk_record.table_name, fk_record.column_name,
            fk_record.foreign_table_name, fk_record.foreign_column_name;
    END LOOP;
    
    RAISE NOTICE '✅ Foreign key check complete';
END $$;

-- Check 5: Verify auth.users table exists (user_id typically references this)
DO $$
BEGIN
    RAISE NOTICE '🔍 CHECKING AUTH SCHEMA...';
    
    IF EXISTS (SELECT 1 FROM information_schema.tables 
               WHERE table_schema = 'auth' AND table_name = 'users') THEN
        RAISE NOTICE '✅ auth.users table exists';
        
        -- Check if auth.users has an id column
        IF EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'auth' AND table_name = 'users' AND column_name = 'id') THEN
            RAISE NOTICE '✅ auth.users.id column exists';
        ELSE
            RAISE NOTICE '❌ auth.users.id column MISSING - this could be the problem!';
        END IF;
    ELSE
        RAISE NOTICE '❌ auth.users table MISSING - this could be the problem!';
    END IF;
    
    RAISE NOTICE '✅ Auth schema check complete';
END $$;

-- Check 6: Database version and extensions
DO $$
BEGIN
    RAISE NOTICE '🔍 ENVIRONMENT INFO...';
    RAISE NOTICE 'PostgreSQL Version: %', version();
    
    -- List all installed extensions
    RAISE NOTICE 'Installed Extensions:';
    FOR ext IN SELECT extname FROM pg_extension ORDER BY extname
    LOOP
        RAISE NOTICE '  - %', ext.extname;
    END LOOP;
    
    RAISE NOTICE '✅ Environment check complete';
END $$;

-- Check 7: Current search path
DO $$
BEGIN
    RAISE NOTICE '🔍 SEARCH PATH: %', current_setting('search_path');
END $$;

DO $$
BEGIN
    RAISE NOTICE '🎯 ENVIRONMENT ANALYSIS COMPLETE';
    RAISE NOTICE '📋 If no issues found above, user_id error is likely in migration syntax';
END $$;