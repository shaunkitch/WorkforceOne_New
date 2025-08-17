-- =============================================
-- DEBUG USER_ID ERROR - Create one table at a time
-- =============================================

-- Test 1: Create simple table with user_id column
CREATE TABLE IF NOT EXISTS test_device_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    organization_id UUID NOT NULL,
    token TEXT NOT NULL,
    platform VARCHAR(20) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- If the above succeeds, the error is NOT in basic table creation

-- Test 2: Add unique constraint with user_id
-- ALTER TABLE test_device_tokens ADD CONSTRAINT test_unique_user_token UNIQUE(user_id, token);

-- Test 3: Create index with user_id  
-- CREATE INDEX IF NOT EXISTS test_idx_user_org ON test_device_tokens(user_id, organization_id);

-- Test 4: Enable RLS
-- ALTER TABLE test_device_tokens ENABLE ROW LEVEL SECURITY;

-- Test 5: Create basic policy (this might be where the error occurs)
-- CREATE POLICY test_policy ON test_device_tokens FOR ALL USING (true);

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Test table created successfully - user_id column works fine';
    RAISE NOTICE '🔍 If you see this message, the error is NOT in basic table creation';
    RAISE NOTICE '🔍 The error must be in constraints, indexes, policies, or functions';
END $$;