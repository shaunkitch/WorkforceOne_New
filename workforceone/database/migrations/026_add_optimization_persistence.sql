-- Migration 026: Add optimization persistence and weekly scheduling
-- Stores optimized route data and enables weekly recurring assignments

-- Add fields to routes table for storing optimization results
ALTER TABLE routes ADD COLUMN IF NOT EXISTS optimized_route_data JSONB;
ALTER TABLE routes ADD COLUMN IF NOT EXISTS optimization_timestamp TIMESTAMP WITH TIME ZONE;
ALTER TABLE routes ADD COLUMN IF NOT EXISTS polyline_encoded TEXT;

-- Add fields to route_assignments for weekly scheduling
ALTER TABLE route_assignments ADD COLUMN IF NOT EXISTS day_of_week INTEGER; -- 0=Sunday, 1=Monday, etc.
ALTER TABLE route_assignments ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT FALSE;
ALTER TABLE route_assignments ADD COLUMN IF NOT EXISTS recurrence_pattern VARCHAR(20) DEFAULT 'weekly' CHECK (recurrence_pattern IN ('weekly', 'biweekly', 'monthly'));
ALTER TABLE route_assignments ADD COLUMN IF NOT EXISTS recurring_until DATE;

-- Create index for day of week queries
CREATE INDEX IF NOT EXISTS idx_route_assignments_day_of_week ON route_assignments(day_of_week) WHERE day_of_week IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_route_assignments_recurring ON route_assignments(is_recurring, day_of_week) WHERE is_recurring = TRUE;

-- Comments for new fields
COMMENT ON COLUMN routes.optimized_route_data IS 'JSON data containing the optimized route results from Google Maps';
COMMENT ON COLUMN routes.optimization_timestamp IS 'When this route was last optimized';
COMMENT ON COLUMN routes.polyline_encoded IS 'Encoded polyline string from Google Directions API';
COMMENT ON COLUMN route_assignments.day_of_week IS '0=Sunday, 1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday, 5=Friday, 6=Saturday';
COMMENT ON COLUMN route_assignments.is_recurring IS 'Whether this assignment repeats on a schedule';
COMMENT ON COLUMN route_assignments.recurrence_pattern IS 'How often the assignment repeats (weekly, biweekly, monthly)';
COMMENT ON COLUMN route_assignments.recurring_until IS 'End date for recurring assignments (NULL = indefinite)';