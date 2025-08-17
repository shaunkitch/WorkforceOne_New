-- =============================================
-- SINGLE TABLE TEST: Isolate user_id error source
-- =============================================

-- This is the absolute minimal test case
-- If this fails, we know the issue is environmental
-- If this succeeds, the issue is in our complex migrations

CREATE TABLE IF NOT EXISTS simple_test (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Success message if we reach this point
DO $$
BEGIN
    RAISE NOTICE '🎉 SUCCESS: Simple table with user_id created without error!';
    RAISE NOTICE '📋 This proves user_id is NOT the problem in basic CREATE TABLE';
    RAISE NOTICE '🔍 The error must be in indexes, policies, or other complex statements';
END $$;