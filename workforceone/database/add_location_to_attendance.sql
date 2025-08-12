-- Add location tracking fields to attendance table
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8);
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8);
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS location_accuracy DECIMAL(8, 2); -- in meters
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS location_timestamp TIMESTAMP WITH TIME ZONE;
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS address TEXT; -- optional geocoded address

-- Add indexes for location-based queries
CREATE INDEX IF NOT EXISTS idx_attendance_location ON attendance(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_attendance_location_timestamp ON attendance(location_timestamp);

-- Add comment
COMMENT ON COLUMN attendance.latitude IS 'GPS latitude coordinate for check-in location';
COMMENT ON COLUMN attendance.longitude IS 'GPS longitude coordinate for check-in location';
COMMENT ON COLUMN attendance.location_accuracy IS 'GPS accuracy in meters';
COMMENT ON COLUMN attendance.location_timestamp IS 'Timestamp when location was captured';
COMMENT ON COLUMN attendance.address IS 'Human-readable address (optional)';