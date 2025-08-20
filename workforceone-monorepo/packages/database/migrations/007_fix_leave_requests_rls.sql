-- Fix Row Level Security policies for leave_requests table

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view leave requests in their organization" ON public.leave_requests;
DROP POLICY IF EXISTS "Users can insert their own leave requests" ON public.leave_requests;
DROP POLICY IF EXISTS "Users can update their own leave requests" ON public.leave_requests;
DROP POLICY IF EXISTS "Managers can update leave requests in their organization" ON public.leave_requests;
DROP POLICY IF EXISTS "Users can delete their own leave requests" ON public.leave_requests;

-- Enable RLS on leave_requests table
ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;

-- Policy for viewing leave requests
-- Users can see their own requests and managers/admins can see all requests in their organization
CREATE POLICY "Users can view leave requests in their organization" ON public.leave_requests
FOR SELECT
TO authenticated
USING (
  -- Users can see their own requests
  employee_id = auth.uid()
  OR
  -- Managers and admins can see all requests in their organization
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.organization_id = leave_requests.organization_id
    AND profiles.role IN ('admin', 'manager')
  )
);

-- Policy for inserting leave requests
-- Users can only create requests for themselves in their organization
CREATE POLICY "Users can insert their own leave requests" ON public.leave_requests
FOR INSERT
TO authenticated
WITH CHECK (
  employee_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.organization_id = leave_requests.organization_id
  )
);

-- Policy for updating leave requests
-- Users can update their own pending requests
CREATE POLICY "Users can update their own leave requests" ON public.leave_requests
FOR UPDATE
TO authenticated
USING (
  employee_id = auth.uid()
  AND status = 'pending'
);

-- Policy for managers to approve/reject leave requests
-- Managers and admins can update requests in their organization
CREATE POLICY "Managers can update leave requests in their organization" ON public.leave_requests
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.organization_id = leave_requests.organization_id
    AND profiles.role IN ('admin', 'manager')
  )
);

-- Policy for deleting leave requests
-- Users can delete their own pending requests, managers can delete any requests in their org
CREATE POLICY "Users can delete their own leave requests" ON public.leave_requests
FOR DELETE
TO authenticated
USING (
  (employee_id = auth.uid() AND status = 'pending')
  OR
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.organization_id = leave_requests.organization_id
    AND profiles.role IN ('admin', 'manager')
  )
);

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.leave_requests TO authenticated;