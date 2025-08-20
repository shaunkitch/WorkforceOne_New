-- =============================================
-- DIAGNOSTIC: Test individual SQL statements to isolate user_id error
-- =============================================

-- Test 1: Most basic possible table creation
DO $$
BEGIN
    RAISE NOTICE '🔍 TEST 1: Creating simplest possible table...';
END $$;

CREATE TABLE IF NOT EXISTS test_basic (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4()
);

DO $$
BEGIN
    RAISE NOTICE '✅ TEST 1 PASSED: Basic table created successfully';
END $$;

-- Test 2: Add user_id column to see if the column name itself is the issue
DO $$
BEGIN
    RAISE NOTICE '🔍 TEST 2: Adding user_id column to existing table...';
END $$;

ALTER TABLE test_basic ADD COLUMN IF NOT EXISTS user_id UUID;

DO $$
BEGIN
    RAISE NOTICE '✅ TEST 2 PASSED: user_id column added successfully';
END $$;

-- Test 3: Create table with user_id in definition
DO $$
BEGIN
    RAISE NOTICE '🔍 TEST 3: Creating table with user_id in initial definition...';
END $$;

CREATE TABLE IF NOT EXISTS test_with_user_id (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID
);

DO $$
BEGIN
    RAISE NOTICE '✅ TEST 3 PASSED: Table with user_id created successfully';
END $$;

-- Test 4: Create table with user_id NOT NULL
DO $$
BEGIN
    RAISE NOTICE '🔍 TEST 4: Creating table with user_id NOT NULL...';
END $$;

CREATE TABLE IF NOT EXISTS test_user_id_not_null (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL
);

DO $$
BEGIN
    RAISE NOTICE '✅ TEST 4 PASSED: Table with user_id NOT NULL created successfully';
END $$;

-- Test 5: Check if any triggers exist that might interfere
DO $$
BEGIN
    RAISE NOTICE '🔍 TEST 5: Checking for existing triggers on user_id...';
    
    -- Check for any triggers that might be causing issues
    IF EXISTS (
        SELECT 1 FROM information_schema.triggers 
        WHERE trigger_name LIKE '%user_id%'
    ) THEN
        RAISE NOTICE '⚠️ WARNING: Found triggers related to user_id';
    ELSE
        RAISE NOTICE '✅ No user_id related triggers found';
    END IF;
END $$;

-- Test 6: Check current database version and extensions
DO $$
BEGIN
    RAISE NOTICE '🔍 TEST 6: Database environment check...';
    RAISE NOTICE 'PostgreSQL Version: %', version();
    
    -- Check if uuid-ossp extension is available
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'uuid-ossp') THEN
        RAISE NOTICE '✅ uuid-ossp extension is installed';
    ELSE
        RAISE NOTICE '⚠️ uuid-ossp extension not found';
    END IF;
END $$;

-- Cleanup test tables
DROP TABLE IF EXISTS test_basic;
DROP TABLE IF EXISTS test_with_user_id;
DROP TABLE IF EXISTS test_user_id_not_null;

DO $$
BEGIN
    RAISE NOTICE '🎯 DIAGNOSTIC COMPLETE';
    RAISE NOTICE 'If all tests passed, the user_id error is NOT in basic table creation';
    RAISE NOTICE 'The error must be in more complex parts of the migration';
END $$;