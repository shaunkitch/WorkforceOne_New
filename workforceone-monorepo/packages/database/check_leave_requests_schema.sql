-- Check current leave_requests table schema
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'leave_requests' 
ORDER BY ordinal_position;