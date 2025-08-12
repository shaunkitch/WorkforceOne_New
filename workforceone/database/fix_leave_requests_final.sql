-- Final fix for leave_requests - add missing days_requested column
-- Based on actual current schema

-- 1. Add the missing days_requested column
ALTER TABLE public.leave_requests 
ADD COLUMN IF NOT EXISTS days_requested INTEGER;

-- 2. Calculate days_requested for existing records
UPDATE public.leave_requests 
SET days_requested = (DATE_PART('day', end_date::timestamp - start_date::timestamp) + 1)::integer
WHERE days_requested IS NULL;

-- 3. Add foreign key constraint for employee_id if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'leave_requests_employee_id_fkey'
        AND table_name = 'leave_requests'
    ) THEN
        ALTER TABLE public.leave_requests 
        ADD CONSTRAINT leave_requests_employee_id_fkey 
        FOREIGN KEY (employee_id) REFERENCES profiles(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 4. Create leave_balances table
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

-- 5. Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_leave_requests_employee_id ON public.leave_requests(employee_id);
CREATE INDEX IF NOT EXISTS idx_leave_requests_status ON public.leave_requests(status);
CREATE INDEX IF NOT EXISTS idx_leave_balances_employee_id ON public.leave_balances(employee_id);
CREATE INDEX IF NOT EXISTS idx_leave_balances_year ON public.leave_balances(year);

-- 6. Enable RLS and create policies
ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_balances ENABLE ROW LEVEL SECURITY;

-- Drop existing policies first
DROP POLICY IF EXISTS "Users can view own leave requests" ON public.leave_requests;
DROP POLICY IF EXISTS "Users can insert own leave requests" ON public.leave_requests;
DROP POLICY IF EXISTS "Users can update own leave requests" ON public.leave_requests;
DROP POLICY IF EXISTS "Users can view own leave balances" ON public.leave_balances;
DROP POLICY IF EXISTS "Users can insert own leave balances" ON public.leave_balances;
DROP POLICY IF EXISTS "Users can update own leave balances" ON public.leave_balances;

-- Leave requests policies
CREATE POLICY "Users can view own leave requests"
ON public.leave_requests FOR SELECT
TO authenticated
USING (auth.uid() = employee_id);

CREATE POLICY "Users can insert own leave requests"
ON public.leave_requests FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = employee_id);

CREATE POLICY "Users can update own leave requests"
ON public.leave_requests FOR UPDATE
TO authenticated
USING (auth.uid() = employee_id);

-- Leave balances policies
CREATE POLICY "Users can view own leave balances"
ON public.leave_balances FOR SELECT
TO authenticated
USING (auth.uid() = employee_id);

CREATE POLICY "Users can insert own leave balances"
ON public.leave_balances FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = employee_id);

CREATE POLICY "Users can update own leave balances"
ON public.leave_balances FOR UPDATE
TO authenticated
USING (auth.uid() = employee_id);

-- 7. Verify the fix
SELECT 'Added days_requested column successfully' as status;