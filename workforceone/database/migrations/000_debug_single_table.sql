-- =============================================
-- DEBUG: Create ONE simple table to isolate user_id error
-- =============================================

-- Test creating the simplest possible table with user_id
CREATE TABLE IF NOT EXISTS test_simple_table (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- If this fails, the error is NOT in table creation syntax
-- If this succeeds, the error is in something else in the migration

DO $$
BEGIN
    RAISE NOTICE '✅ SUCCESS: Simple table with user_id created without error';
    RAISE NOTICE '🔍 This means the user_id error is NOT in basic CREATE TABLE syntax';
    RAISE NOTICE '🔍 The error must be in indexes, policies, or other statements';
END $$;