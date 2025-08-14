-- Migration 032: Fix route assignments constraints and add missing fields
-- This fixes the route transfer functionality by updating constraints and adding missing fields

-- Add missing fields to route_assignments table
ALTER TABLE route_assignments ADD COLUMN IF NOT EXISTS day_of_week VARCHAR(20);
ALTER TABLE route_assignments ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT false;
ALTER TABLE route_assignments ADD COLUMN IF NOT EXISTS recurrence_pattern VARCHAR(50);
ALTER TABLE route_assignments ADD COLUMN IF NOT EXISTS recurring_until DATE;

-- Drop the existing check constraint
ALTER TABLE route_assignments DROP CONSTRAINT IF EXISTS route_assignments_status_check;

-- Add the updated check constraint with 'transferred' status
ALTER TABLE route_assignments ADD CONSTRAINT route_assignments_status_check 
CHECK (status IN ('assigned', 'accepted', 'in_progress', 'completed', 'rejected', 'transferred'));

-- Add indexes for the new fields
CREATE INDEX IF NOT EXISTS idx_route_assignments_day_of_week ON route_assignments(day_of_week);
CREATE INDEX IF NOT EXISTS idx_route_assignments_is_recurring ON route_assignments(is_recurring);
CREATE INDEX IF NOT EXISTS idx_route_assignments_recurring_until ON route_assignments(recurring_until);

-- Add comments for the new fields
COMMENT ON COLUMN route_assignments.day_of_week IS 'Day of week for recurring assignments (monday, tuesday, etc.)';
COMMENT ON COLUMN route_assignments.is_recurring IS 'Whether this assignment is recurring';
COMMENT ON COLUMN route_assignments.recurrence_pattern IS 'Pattern for recurring assignments (daily, weekly, biweekly, monthly)';
COMMENT ON COLUMN route_assignments.recurring_until IS 'End date for recurring assignments';
COMMENT ON COLUMN route_assignments.status IS 'Status: assigned, accepted, in_progress, completed, rejected, transferred';