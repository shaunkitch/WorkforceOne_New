-- Migration 024: Add hourly rate to projects
-- Add hourly_rate column to projects table for per-project billing rates

-- Add hourly_rate column to projects table
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS hourly_rate DECIMAL(10,2) DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN projects.hourly_rate IS 'Hourly billing rate for time tracking on this project (overrides user default rate)';