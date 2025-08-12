-- Fix Leave Requests Schema
-- This migration fixes the leave_requests table to match the frontend expectations

-- 1. Add the missing days_requested column
ALTER TABLE public.leave_requests 
ADD COLUMN IF NOT EXISTS days_requested INTEGER;

-- 2. Add employee_id column that references profiles (keeping user_id for backward compatibility)
ALTER TABLE public.leave_requests 
ADD COLUMN IF NOT EXISTS employee_id UUID REFERENCES profiles(id) ON DELETE CASCADE;

-- 3. Update existing records to populate the new columns
UPDATE public.leave_requests 
SET 
    employee_id = user_id,
    days_requested = (DATE_PART('day', end_date::timestamp - start_date::timestamp) + 1)::integer
WHERE employee_id IS NULL OR days_requested IS NULL;

-- 4. Add the foreign key constraint for employee_id properly
DO $$ 
BEGIN
    -- Check if the foreign key constraint exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'leave_requests_employee_id_fkey'
        AND table_name = 'leave_requests'
    ) THEN
        -- Create the foreign key constraint with the correct name that matches the frontend
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

-- Users can view their own leave requests (using both user_id and employee_id for compatibility)
DROP POLICY IF EXISTS "Users can view own leave requests" ON public.leave_requests;
CREATE POLICY "Users can view own leave requests"
ON public.leave_requests FOR SELECT
TO authenticated
USING (auth.uid() = user_id OR auth.uid() = employee_id);

-- Users can insert their own leave requests
DROP POLICY IF EXISTS "Users can insert own leave requests" ON public.leave_requests;
CREATE POLICY "Users can insert own leave requests"
ON public.leave_requests FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id OR auth.uid() = employee_id);

-- Users can update their own leave requests (for cancellation)
DROP POLICY IF EXISTS "Users can update own leave requests" ON public.leave_requests;
CREATE POLICY "Users can update own leave requests"
ON public.leave_requests FOR UPDATE
TO authenticated
USING (auth.uid() = user_id OR auth.uid() = employee_id);

-- Managers can view and update leave requests for their organization
DROP POLICY IF EXISTS "Managers can manage leave requests" ON public.leave_requests;
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

-- 7. Add comments
COMMENT ON COLUMN public.leave_requests.employee_id IS 'Reference to the employee (profiles table) - matches frontend expectations';
COMMENT ON COLUMN public.leave_requests.days_requested IS 'Number of days requested for this leave';

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

-- Users can view their own leave balances
DROP POLICY IF EXISTS "Users can view own leave balances" ON public.leave_balances;
CREATE POLICY "Users can view own leave balances"
ON public.leave_balances FOR SELECT
TO authenticated
USING (auth.uid() = employee_id);

-- Users can update their own leave balances (for tracking usage)
DROP POLICY IF EXISTS "Users can update own leave balances" ON public.leave_balances;
CREATE POLICY "Users can update own leave balances"
ON public.leave_balances FOR UPDATE
TO authenticated
USING (auth.uid() = employee_id);

-- Users can insert their own leave balances
DROP POLICY IF EXISTS "Users can insert own leave balances" ON public.leave_balances;
CREATE POLICY "Users can insert own leave balances"
ON public.leave_balances FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = employee_id);

-- 10. Verify the schema matches expectations
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'leave_requests' 
AND column_name IN ('employee_id', 'days_requested', 'user_id')
ORDER BY column_name;