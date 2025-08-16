-- Add Emergency and Bereavement leave columns to leave_balances table
-- Also standardize naming to match frontend expectations

-- 1. Add emergency and bereavement leave columns
ALTER TABLE public.leave_balances 
ADD COLUMN IF NOT EXISTS emergency_days_allocated INTEGER DEFAULT 3,
ADD COLUMN IF NOT EXISTS emergency_days_used INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS bereavement_days_allocated INTEGER DEFAULT 3,
ADD COLUMN IF NOT EXISTS bereavement_days_used INTEGER DEFAULT 0;

-- 2. Add columns with frontend-expected naming (keep old ones for compatibility)
ALTER TABLE public.leave_balances 
ADD COLUMN IF NOT EXISTS vacation_days_allocated INTEGER,
ADD COLUMN IF NOT EXISTS sick_days_allocated INTEGER,
ADD COLUMN IF NOT EXISTS personal_days_allocated INTEGER;

-- 3. Copy data from old columns to new columns (check if old columns exist first)
DO $$
BEGIN
    -- Only update if the old columns exist and new columns are empty
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leave_balances' AND column_name = 'vacation_days_total') THEN
        UPDATE public.leave_balances 
        SET 
            vacation_days_allocated = COALESCE(vacation_days_allocated, vacation_days_total),
            sick_days_allocated = COALESCE(sick_days_allocated, sick_days_total),
            personal_days_allocated = COALESCE(personal_days_allocated, personal_days_total)
        WHERE vacation_days_allocated IS NULL 
           OR sick_days_allocated IS NULL 
           OR personal_days_allocated IS NULL;
    ELSE
        -- If old columns don't exist, set defaults for new columns
        UPDATE public.leave_balances 
        SET 
            vacation_days_allocated = COALESCE(vacation_days_allocated, 20),
            sick_days_allocated = COALESCE(sick_days_allocated, 10),
            personal_days_allocated = COALESCE(personal_days_allocated, 5)
        WHERE vacation_days_allocated IS NULL 
           OR sick_days_allocated IS NULL 
           OR personal_days_allocated IS NULL;
    END IF;
END $$;

-- 4. Update existing records to have emergency and bereavement defaults if they're 0
UPDATE public.leave_balances 
SET 
    emergency_days_allocated = 3,
    bereavement_days_allocated = 3
WHERE emergency_days_allocated = 0 OR bereavement_days_allocated = 0;

-- 5. Add index for performance on new columns
CREATE INDEX IF NOT EXISTS idx_leave_balances_emergency_days ON public.leave_balances(emergency_days_allocated, emergency_days_used);
CREATE INDEX IF NOT EXISTS idx_leave_balances_bereavement_days ON public.leave_balances(bereavement_days_allocated, bereavement_days_used);

-- 6. Add comments for documentation
COMMENT ON COLUMN public.leave_balances.emergency_days_allocated IS 'Number of emergency leave days allocated per year';
COMMENT ON COLUMN public.leave_balances.emergency_days_used IS 'Number of emergency leave days used in current year';
COMMENT ON COLUMN public.leave_balances.bereavement_days_allocated IS 'Number of bereavement leave days allocated per year';
COMMENT ON COLUMN public.leave_balances.bereavement_days_used IS 'Number of bereavement leave days used in current year';
COMMENT ON COLUMN public.leave_balances.vacation_days_allocated IS 'Number of vacation days allocated per year (frontend compatibility)';
COMMENT ON COLUMN public.leave_balances.sick_days_allocated IS 'Number of sick days allocated per year (frontend compatibility)';
COMMENT ON COLUMN public.leave_balances.personal_days_allocated IS 'Number of personal days allocated per year (frontend compatibility)';

-- 7. Show final schema for leave_balances
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'leave_balances' 
AND column_name LIKE '%days%'
ORDER BY column_name;