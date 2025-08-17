-- =============================================
-- ULTRA SIMPLE FINAL TEST
-- Just create ONE table with user_id - nothing else
-- =============================================

CREATE TABLE test_final (
    id UUID DEFAULT uuid_generate_v4(),
    user_id UUID,
    name TEXT
);

-- If this fails with user_id error, the problem is environmental
-- If this succeeds, the problem is in our complex migration syntax