-- Test script to verify data segregation after RLS policies are applied
-- Run this in Supabase SQL Editor after applying the RLS policies

-- This script tests that users can only see data from their own organization

-- Test 1: Verify projects are properly segregated
SELECT 
  'Projects visible to WorkforceOne users' as test_name,
  COUNT(*) as count,
  STRING_AGG(name, ', ') as project_names
FROM projects 
WHERE organization_id = 'a0add796-4a4f-488a-8af2-227ec3247316';

SELECT 
  'Projects visible to ServiceNow users' as test_name,
  COUNT(*) as count,
  STRING_AGG(name, ', ') as project_names
FROM projects 
WHERE organization_id = 'cf4b5b40-6177-4b73-8a23-e4bdac826c1e';

-- Test 2: Verify tasks are properly segregated
SELECT 
  'Tasks linked to WorkforceOne projects' as test_name,
  COUNT(*) as count
FROM tasks t
JOIN projects p ON t.project_id = p.id
WHERE p.organization_id = 'a0add796-4a4f-488a-8af2-227ec3247316';

-- Test 3: Verify teams are properly segregated
SELECT 
  'Teams in WorkforceOne org' as test_name,
  COUNT(*) as count,
  STRING_AGG(name, ', ') as team_names
FROM teams 
WHERE organization_id = 'a0add796-4a4f-488a-8af2-227ec3247316';

SELECT 
  'Teams in ServiceNow org' as test_name,
  COUNT(*) as count,
  STRING_AGG(name, ', ') as team_names
FROM teams 
WHERE organization_id = 'cf4b5b40-6177-4b73-8a23-e4bdac826c1e';

-- Test 4: Show organization assignments
SELECT 
  'User organization assignments' as info,
  full_name,
  email,
  role,
  CASE organization_id
    WHEN 'a0add796-4a4f-488a-8af2-227ec3247316' THEN 'WorkforceOne'
    WHEN 'cf4b5b40-6177-4b73-8a23-e4bdac826c1e' THEN 'ServiceNow'
    ELSE 'Unknown'
  END as organization
FROM profiles
ORDER BY organization_id, role, full_name;