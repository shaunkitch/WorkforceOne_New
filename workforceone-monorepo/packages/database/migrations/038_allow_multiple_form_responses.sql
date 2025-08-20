-- Migration: Allow multiple form responses per user/form and add location tracking
-- This removes the unique constraint that prevents multiple submissions

-- Drop the unique constraint that limits one response per user per form
ALTER TABLE form_responses DROP CONSTRAINT IF EXISTS form_responses_unique;

-- Add location tracking fields for form submissions
ALTER TABLE form_responses ADD COLUMN IF NOT EXISTS location_latitude DECIMAL(10,8);
ALTER TABLE form_responses ADD COLUMN IF NOT EXISTS location_longitude DECIMAL(11,8);
ALTER TABLE form_responses ADD COLUMN IF NOT EXISTS location_accuracy DECIMAL(8,2);
ALTER TABLE form_responses ADD COLUMN IF NOT EXISTS location_timestamp TIMESTAMP WITH TIME ZONE;

-- Add a comment to document the change
COMMENT ON TABLE form_responses IS 'Form responses - now allows multiple submissions per user per form with location tracking';

-- Create an index for location-based queries (optional, for performance)
CREATE INDEX IF NOT EXISTS idx_form_responses_location ON form_responses(location_latitude, location_longitude) 
WHERE location_latitude IS NOT NULL AND location_longitude IS NOT NULL;

-- Create an index for user submissions by form and time for better querying
CREATE INDEX IF NOT EXISTS idx_form_responses_user_time ON form_responses(form_id, respondent_id, submitted_at);