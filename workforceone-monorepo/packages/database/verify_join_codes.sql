-- Verification script for join codes migration
-- Run this after applying migration 039_add_organization_join_codes.sql

-- Check if join_code column exists and is populated
SELECT 
    'Join Code Status' as check_type,
    COUNT(*) as total_organizations,
    COUNT(join_code) as organizations_with_codes,
    COUNT(DISTINCT join_code) as unique_codes
FROM organizations;

-- Show all organizations with their join codes
SELECT 
    id,
    name,
    join_code,
    created_at,
    updated_at
FROM organizations 
ORDER BY created_at;

-- Verify join_code constraints
SELECT 
    column_name,
    is_nullable,
    data_type,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'organizations' 
AND column_name = 'join_code';

-- Check if index exists
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'organizations' 
AND indexname LIKE '%join_code%';

-- Test join code uniqueness constraint
SELECT 
    join_code,
    COUNT(*) as count
FROM organizations 
GROUP BY join_code 
HAVING COUNT(*) > 1;