-- Temporarily disable RLS on leave_requests for testing
-- This should be run in Supabase SQL Editor as an admin

ALTER TABLE public.leave_requests DISABLE ROW LEVEL SECURITY;

-- Insert a test leave request for Jordan
INSERT INTO public.leave_requests (
  employee_id,
  organization_id,
  leave_type,
  start_date,
  end_date,
  days_requested,
  reason,
  status,
  created_at,
  updated_at
) VALUES (
  '208c187e-8d60-4930-8a88-ca78d4a00e6a', -- Jordan's ID
  'cf4b5b40-6177-4b73-8a23-e4bdac826c1e', -- ServiceNow org ID
  'vacation',
  '2025-08-20',
  '2025-08-22',
  3,
  'Family vacation to Cape Town',
  'pending',
  NOW(),
  NOW()
);

-- Insert another test leave request
INSERT INTO public.leave_requests (
  employee_id,
  organization_id,
  leave_type,
  start_date,
  end_date,
  days_requested,
  reason,
  status,
  created_at,
  updated_at
) VALUES (
  '208c187e-8d60-4930-8a88-ca78d4a00e6a', -- Jordan's ID
  'cf4b5b40-6177-4b73-8a23-e4bdac826c1e', -- ServiceNow org ID
  'sick',
  '2025-08-15',
  '2025-08-16',
  2,
  'Doctor appointment and recovery',
  'pending',
  NOW(),
  NOW()
);

-- Re-enable RLS after testing
-- ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;