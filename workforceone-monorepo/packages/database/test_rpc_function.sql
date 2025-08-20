-- Test the get_user_effective_features RPC function
-- Run this to verify the function works correctly

-- 1. Check if the function exists
SELECT 
    p.proname as function_name,
    p.prorettype::regtype as return_type,
    pg_get_function_identity_arguments(p.oid) as arguments
FROM pg_proc p
WHERE p.proname = 'get_user_effective_features';

-- 2. Test with a specific user (replace with Jordan's ID)
SELECT get_user_effective_features('208c187e-8d60-4930-8a88-ca78d4a00e6a');

-- 3. Check function permissions
SELECT 
    grantee,
    privilege_type,
    is_grantable
FROM information_schema.routine_privileges
WHERE routine_name = 'get_user_effective_features';

-- 4. Verify the function definition
SELECT pg_get_functiondef(oid)
FROM pg_proc 
WHERE proname = 'get_user_effective_features';