-- Drop existing view first to avoid dependency issues
DROP VIEW IF EXISTS recent_incidents_summary;

-- Create security_incidents table for incident management
CREATE TABLE IF NOT EXISTS security_incidents (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  latitude DECIMAL(10, 8) DEFAULT 0,
  longitude DECIMAL(11, 8) DEFAULT 0,
  address TEXT DEFAULT 'Unknown location',
  guard_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  guard_name TEXT NOT NULL,
  status TEXT DEFAULT 'submitted' CHECK (status IN ('submitted', 'investigating', 'resolved', 'dismissed')),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_security_incidents_category ON security_incidents(category);
CREATE INDEX IF NOT EXISTS idx_security_incidents_severity ON security_incidents(severity);
CREATE INDEX IF NOT EXISTS idx_security_incidents_status ON security_incidents(status);
CREATE INDEX IF NOT EXISTS idx_security_incidents_guard ON security_incidents(guard_id);
CREATE INDEX IF NOT EXISTS idx_security_incidents_created ON security_incidents(created_at);
CREATE INDEX IF NOT EXISTS idx_security_incidents_location ON security_incidents(latitude, longitude);

-- Enable RLS (Row Level Security)
ALTER TABLE security_incidents ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "security_incidents_select" ON security_incidents;
DROP POLICY IF EXISTS "security_incidents_insert" ON security_incidents;
DROP POLICY IF EXISTS "security_incidents_update" ON security_incidents;

-- Allow guards to insert their own incidents
CREATE POLICY "security_incidents_insert" ON security_incidents
  FOR INSERT WITH CHECK (
    guard_id = auth.uid() OR 
    auth.uid() IN (
      SELECT user_id FROM user_products 
      WHERE product_id = 'guard-management' AND is_active = true
    )
  );

-- Allow viewing incidents within the same organization
CREATE POLICY "security_incidents_select" ON security_incidents
  FOR SELECT USING (
    auth.uid() IN (
      SELECT user_id FROM user_products 
      WHERE product_id = 'guard-management' AND is_active = true
    )
  );

-- Allow updating incidents (for status changes, etc.)
CREATE POLICY "security_incidents_update" ON security_incidents
  FOR UPDATE USING (
    guard_id = auth.uid() OR
    auth.uid() IN (
      SELECT user_id FROM user_products 
      WHERE product_id = 'guard-management' AND is_active = true
    )
  );

-- Insert some sample incidents for testing
INSERT INTO security_incidents (
  id, title, description, category, severity, 
  latitude, longitude, address, guard_id, guard_name, status, metadata
) VALUES 
(
  'INC-SAMPLE-001',
  'Suspicious Vehicle in Parking Lot',
  'Unregistered vehicle parked in restricted area for over 30 minutes. License plate ABC-123.',
  'suspicious',
  'medium',
  -26.2041,
  28.0473,
  'Main Office Parking Lot',
  NULL,
  'John Smith',
  'investigating',
  '{"photos": 2, "timestamp": "2024-01-20T10:30:00Z", "device_info": "ios"}'::jsonb
),
(
  'INC-SAMPLE-002',
  'Broken Window at Building B',
  'Large window broken on ground floor. Glass scattered. Possible vandalism.',
  'vandalism',
  'high',
  -26.2051,
  28.0483,
  'Building B, Ground Floor',
  NULL,
  'Sarah Johnson',
  'submitted',
  '{"photos": 3, "timestamp": "2024-01-20T14:15:00Z", "device_info": "android"}'::jsonb
),
(
  'INC-SAMPLE-003',
  'Medical Emergency - Visitor Collapsed',
  'Elderly visitor collapsed in lobby. Ambulance called. First aid administered.',
  'medical',
  'critical',
  -26.2031,
  28.0463,
  'Main Building Lobby',
  NULL,
  'Mike Davis',
  'resolved',
  '{"photos": 0, "timestamp": "2024-01-20T16:45:00Z", "ambulance_called": true}'::jsonb
)
ON CONFLICT (id) DO NOTHING;

-- Create a view for easy querying
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
  created_at,
  CASE 
    WHEN created_at > NOW() - INTERVAL '1 hour' THEN 'recent'
    WHEN created_at > NOW() - INTERVAL '1 day' THEN 'today'
    ELSE 'older'
  END as recency
FROM security_incidents
ORDER BY created_at DESC;

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_security_incidents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_security_incidents_updated_at ON security_incidents;
CREATE TRIGGER update_security_incidents_updated_at
  BEFORE UPDATE ON security_incidents
  FOR EACH ROW
  EXECUTE PROCEDURE update_security_incidents_updated_at();