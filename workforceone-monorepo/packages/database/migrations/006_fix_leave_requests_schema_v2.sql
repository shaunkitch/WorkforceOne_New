-- Fix Leave Requests Schema (Corrected Version)
-- This migration fixes the leave_requests table to match the frontend expectations

-- First, let's check what columns actually exist
DO $$
DECLARE
    has_user_id BOOLEAN := FALSE;
    has_employee_id BOOLEAN := FALSE;
    has_days_requested BOOLEAN := FALSE;
BEGIN
    -- Check if user_id column exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'leave_requests' AND column_name = 'user_id'
    ) INTO has_user_id;

    -- Check if employee_id column exists  
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'leave_requests' AND column_name = 'employee_id'
    ) INTO has_employee_id;

    -- Check if days_requested column exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'leave_requests' AND column_name = 'days_requested'
    ) INTO has_days_requested;

    RAISE NOTICE 'Current schema - user_id: %, employee_id: %, days_requested: %', has_user_id, has_employee_id, has_days_requested;
END $$;

-- 1. Add the missing days_requested column
ALTER TABLE public.leave_requests 
ADD COLUMN IF NOT EXISTS days_requested INTEGER;

-- 2. Add employee_id column if it doesn't exist
ALTER TABLE public.leave_requests 
ADD COLUMN IF NOT EXISTS employee_id UUID;

-- 3. Update existing records to populate the new columns
-- Only update if we have existing data and the columns are empty
UPDATE public.leave_requests 
SET 
    employee_id = COALESCE(employee_id, user_id),
    days_requested = COALESCE(days_requested, (DATE_PART('day', end_date::timestamp - start_date::timestamp) + 1)::integer)
WHERE (employee_id IS NULL AND user_id IS NOT NULL) 
   OR (days_requested IS NULL);

-- 4. Add foreign key constraint for employee_id if it doesn't exist
DO $$ 
BEGIN
    -- Check if the foreign key constraint exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'leave_requests_employee_id_fkey'
        AND table_name = 'leave_requests'
    ) THEN
        -- Add foreign key constraint
        ALTER TABLE public.leave_requests 
        ADD CONSTRAINT leave_requests_employee_id_fkey 
        FOREIGN KEY (employee_id) REFERENCES profiles(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 5. Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_leave_requests_employee_id ON public.leave_requests(employee_id);
CREATE INDEX IF NOT EXISTS idx_leave_requests_status ON public.leave_requests(status);
CREATE INDEX IF NOT EXISTS idx_leave_requests_start_date ON public.leave_requests(start_date);

-- 6. Add RLS policies for leave_requests to ensure users can only see their own requests
ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;

-- Drop existing policies first
DROP POLICY IF EXISTS "Users can view own leave requests" ON public.leave_requests;
DROP POLICY IF EXISTS "Users can insert own leave requests" ON public.leave_requests;
DROP POLICY IF EXISTS "Users can update own leave requests" ON public.leave_requests;
DROP POLICY IF EXISTS "Managers can manage leave requests" ON public.leave_requests;

-- Users can view their own leave requests (check both user_id and employee_id for compatibility)
CREATE POLICY "Users can view own leave requests"
ON public.leave_requests FOR SELECT
TO authenticated
USING (
    auth.uid() = employee_id OR 
    (user_id IS NOT NULL AND auth.uid() = user_id)
);

-- Users can insert their own leave requests
CREATE POLICY "Users can insert own leave requests"
ON public.leave_requests FOR INSERT
TO authenticated
WITH CHECK (
    auth.uid() = employee_id OR 
    (user_id IS NOT NULL AND auth.uid() = user_id)
);

-- Users can update their own leave requests (for cancellation)
CREATE POLICY "Users can update own leave requests"
ON public.leave_requests FOR UPDATE
TO authenticated
USING (
    auth.uid() = employee_id OR 
    (user_id IS NOT NULL AND auth.uid() = user_id)
);

-- Managers can view and update leave requests for their organization
CREATE POLICY "Managers can manage leave requests"
ON public.leave_requests FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.organization_id = leave_requests.organization_id
        AND profiles.role IN ('admin', 'manager')
    )
);

-- 7. Create leave_balances table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.leave_balances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    year INTEGER NOT NULL,
    vacation_days_total INTEGER DEFAULT 20,
    vacation_days_used INTEGER DEFAULT 0,
    sick_days_total INTEGER DEFAULT 10,
    sick_days_used INTEGER DEFAULT 0,
    personal_days_total INTEGER DEFAULT 5,
    personal_days_used INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(employee_id, year)
);

-- 8. Add indexes for leave_balances
CREATE INDEX IF NOT EXISTS idx_leave_balances_employee_id ON public.leave_balances(employee_id);
CREATE INDEX IF NOT EXISTS idx_leave_balances_year ON public.leave_balances(year);

-- 9. Add RLS policies for leave_balances
ALTER TABLE public.leave_balances ENABLE ROW LEVEL SECURITY;

-- Drop existing policies first
DROP POLICY IF EXISTS "Users can view own leave balances" ON public.leave_balances;
DROP POLICY IF EXISTS "Users can update own leave balances" ON public.leave_balances;
DROP POLICY IF EXISTS "Users can insert own leave balances" ON public.leave_balances;

-- Users can view their own leave balances
CREATE POLICY "Users can view own leave balances"
ON public.leave_balances FOR SELECT
TO authenticated
USING (auth.uid() = employee_id);

-- Users can update their own leave balances (for tracking usage)
CREATE POLICY "Users can update own leave balances"
ON public.leave_balances FOR UPDATE
TO authenticated
USING (auth.uid() = employee_id);

-- Users can insert their own leave balances
CREATE POLICY "Users can insert own leave balances"
ON public.leave_balances FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = employee_id);

-- 10. Add helpful comments
COMMENT ON COLUMN public.leave_requests.employee_id IS 'Reference to the employee (profiles table) - matches frontend expectations';
COMMENT ON COLUMN public.leave_requests.days_requested IS 'Number of days requested for this leave';
COMMENT ON TABLE public.leave_balances IS 'Tracks yearly leave balances for employees';

-- 11. Show final schema
SELECT 
    'leave_requests' as table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'leave_requests' 
AND column_name IN ('user_id', 'employee_id', 'days_requested', 'leave_type', 'start_date', 'end_date', 'status')
UNION ALL
SELECT 
    'leave_balances' as table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'leave_balances' 
AND column_name IN ('employee_id', 'year', 'vacation_days_total', 'vacation_days_used')
ORDER BY table_name, column_name;