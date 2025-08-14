-- Migration 027: Add group_name column to outlets table
-- This enables grouping outlets by category, region, or type for better organization

-- Add group_name column to outlets table
ALTER TABLE outlets 
ADD COLUMN IF NOT EXISTS group_name VARCHAR(100);

-- Add index for better performance when filtering by group
CREATE INDEX IF NOT EXISTS idx_outlets_group_name ON outlets(group_name);

-- Add comment for documentation
COMMENT ON COLUMN outlets.group_name IS 'Optional group/category name for organizing outlets (e.g., Main Branches, Sub Offices, Retail Stores)';