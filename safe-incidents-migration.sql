-- Safe migration for security incidents table
-- This script handles existing views and dependencies

BEGIN;

-- Step 1: Drop dependent views first
DROP VIEW IF EXISTS recent_incidents_summary CASCADE;

-- Step 2: Drop existing table if it has structural issues
-- Only uncomment if you need to recreate the table completely
-- DROP TABLE IF EXISTS security_incidents CASCADE;

-- Step 3: Create the table (safe with IF NOT EXISTS)
CREATE TABLE IF NOT EXISTS security_incidents (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  latitude DECIMAL(10, 8) DEFAULT 0,
  longitude DECIMAL(11, 8) DEFAULT 0,
  address TEXT DEFAULT 'Unknown location',
  guard_id UUID,
  guard_name TEXT NOT NULL,
  status TEXT DEFAULT 'submitted' CHECK (status IN ('submitted', 'investigating', 'resolved', 'dismissed')),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  resolved_by UUID
);

-- Step 4: Add columns if they don't exist (safe for existing tables)
DO $$ 
BEGIN
  -- Add guard_id column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='security_incidents' AND column_name='guard_id') THEN
    ALTER TABLE security_incidents ADD COLUMN guard_id UUID;
  END IF;
  
  -- Add guard_name column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='security_incidents' AND column_name='guard_name') THEN
    ALTER TABLE security_incidents ADD COLUMN guard_name TEXT NOT NULL DEFAULT 'Unknown Guard';
  END IF;
  
  -- Add metadata column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='security_incidents' AND column_name='metadata') THEN
    ALTER TABLE security_incidents ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb;
  END IF;
  
  -- Add address column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='security_incidents' AND column_name='address') THEN
    ALTER TABLE security_incidents ADD COLUMN address TEXT DEFAULT 'Unknown location';
  END IF;
END $$;

-- Step 5: Create indexes (safe with IF NOT EXISTS)
CREATE INDEX IF NOT EXISTS idx_security_incidents_category ON security_incidents(category);
CREATE INDEX IF NOT EXISTS idx_security_incidents_severity ON security_incidents(severity);
CREATE INDEX IF NOT EXISTS idx_security_incidents_status ON security_incidents(status);
CREATE INDEX IF NOT EXISTS idx_security_incidents_guard ON security_incidents(guard_id);
CREATE INDEX IF NOT EXISTS idx_security_incidents_created ON security_incidents(created_at);

-- Step 6: Enable RLS
ALTER TABLE security_incidents ENABLE ROW LEVEL SECURITY;

-- Step 7: Drop existing policies first
DROP POLICY IF EXISTS "security_incidents_select" ON security_incidents;
DROP POLICY IF EXISTS "security_incidents_insert" ON security_incidents;
DROP POLICY IF EXISTS "security_incidents_update" ON security_incidents;

-- Step 8: Create new RLS policies
CREATE POLICY "security_incidents_insert" ON security_incidents
  FOR INSERT WITH CHECK (true); -- Allow all inserts for now

CREATE POLICY "security_incidents_select" ON security_incidents
  FOR SELECT USING (true); -- Allow all reads for now

CREATE POLICY "security_incidents_update" ON security_incidents
  FOR UPDATE USING (true); -- Allow all updates for now

-- Step 9: Insert sample data (safe with ON CONFLICT)
INSERT INTO security_incidents (
  id, title, description, category, severity, 
  latitude, longitude, address, guard_name, status, metadata
) VALUES 
(
  'INC-SAMPLE-001',
  'Suspicious Vehicle in Parking Lot',
  'Unregistered vehicle parked in restricted area for over 30 minutes.',
  'suspicious',
  'medium',
  -26.2041,
  28.0473,
  'Main Office Parking Lot',
  'John Smith',
  'investigating',
  '{"photos": 2, "device_info": "mobile"}'::jsonb
),
(
  'INC-SAMPLE-002',
  'Broken Window Discovered',
  'Large window broken on ground floor. Glass scattered.',
  'vandalism',
  'high',
  -26.2051,
  28.0483,
  'Building B, Ground Floor',
  'Sarah Johnson',
  'submitted',
  '{"photos": 3, "device_info": "mobile"}'::jsonb
)
ON CONFLICT (id) DO NOTHING;

-- Step 10: Recreate the view
CREATE OR REPLACE VIEW recent_incidents_summary AS
SELECT 
  id,
  title,
  category,
  severity,
  latitude,
  longitude,
  guard_name,
  status,
  created_at
FROM security_incidents
ORDER BY created_at DESC;

COMMIT;