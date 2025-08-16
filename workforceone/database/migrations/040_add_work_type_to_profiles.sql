-- Migration 040: Add work_type to profiles for remote vs field worker distinction
-- This allows organizations to disable Daily Visits for remote workers

-- Create work_type enum
DO $$ BEGIN
    CREATE TYPE work_type AS ENUM ('field', 'remote', 'hybrid', 'office');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add work_type column to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS work_type work_type DEFAULT 'field' NOT NULL;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_profiles_work_type ON profiles(work_type);

-- Add comment
COMMENT ON COLUMN profiles.work_type IS 'Work type: field (mobile workers), remote (work from home), hybrid (both), office (fixed location)';

-- Update existing profiles to have a default work type (field workers)
-- Organizations can update this manually through the admin panel
UPDATE profiles 
SET work_type = 'field' 
WHERE work_type IS NULL;