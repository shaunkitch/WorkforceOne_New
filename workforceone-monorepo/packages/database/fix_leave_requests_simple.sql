-- Simple fix for leave_requests schema issues
-- This adds the missing columns that the frontend expects

-- 1. Add missing columns to leave_requests
ALTER TABLE public.leave_requests 
ADD COLUMN IF NOT EXISTS days_requested INTEGER;

ALTER TABLE public.leave_requests 
ADD COLUMN IF NOT EXISTS employee_id UUID;

-- 2. Update employee_id to match user_id for existing records (if user_id exists)
UPDATE public.leave_requests 
SET employee_id = user_id 
WHERE employee_id IS NULL AND user_id IS NOT NULL;

-- 3. Calculate days_requested for existing records
UPDATE public.leave_requests 
SET days_requested = (DATE_PART('day', end_date::timestamp - start_date::timestamp) + 1)::integer
WHERE days_requested IS NULL;

-- 4. Add foreign key constraint for employee_id
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'leave_requests_employee_id_fkey'
    ) THEN
        ALTER TABLE public.leave_requests 
        ADD CONSTRAINT leave_requests_employee_id_fkey 
        FOREIGN KEY (employee_id) REFERENCES profiles(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 5. Create leave_balances table
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

-- 6. Enable RLS and create basic policies
ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_balances ENABLE ROW LEVEL SECURITY;

-- Basic policy: users can manage their own leave requests
DROP POLICY IF EXISTS "Users manage own leave requests" ON public.leave_requests;
CREATE POLICY "Users manage own leave requests"
ON public.leave_requests FOR ALL
TO authenticated
USING (auth.uid() = employee_id OR auth.uid() = user_id);

-- Basic policy: users can manage their own leave balances  
DROP POLICY IF EXISTS "Users manage own leave balances" ON public.leave_balances;
CREATE POLICY "Users manage own leave balances"
ON public.leave_balances FOR ALL
TO authenticated
USING (auth.uid() = employee_id);