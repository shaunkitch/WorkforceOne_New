-- Migration 030: Add location field to attendance table
-- This adds the missing location field that mobile app is trying to use

-- Add location column to attendance table
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS location TEXT;

-- Add index for location field
CREATE INDEX IF NOT EXISTS idx_attendance_location ON attendance(location);

-- Add comment
COMMENT ON COLUMN attendance.location IS 'Location where attendance was recorded (e.g., Mobile App, Office, etc.)';