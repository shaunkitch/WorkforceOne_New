-- Mobile Guard Support Tables
-- Simplified tables for mobile app functionality

-- Ensure patrol_sessions table exists (simplified version)
CREATE TABLE IF NOT EXISTS patrol_sessions (
    id TEXT PRIMARY KEY,
    guard_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id TEXT DEFAULT 'default-org',
    route_id TEXT DEFAULT 'default-route',
    start_time TIMESTAMPTZ DEFAULT NOW(),
    end_time TIMESTAMPTZ,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed')),
    current_latitude DECIMAL(10, 8),
    current_longitude DECIMAL(11, 8),
    device_info JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure checkpoint_visits table exists (simplified version)
CREATE TABLE IF NOT EXISTS checkpoint_visits (
    id TEXT PRIMARY KEY,
    session_id TEXT REFERENCES patrol_sessions(id) ON DELETE SET NULL,
    checkpoint_id TEXT NOT NULL,
    visited_at TIMESTAMPTZ DEFAULT NOW(),
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    qr_code_scanned BOOLEAN DEFAULT false,
    manual_check_in BOOLEAN DEFAULT false,
    verification_notes TEXT,
    device_battery_level INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create backup_requests table for mobile app
CREATE TABLE IF NOT EXISTS backup_requests (
    id TEXT PRIMARY KEY,
    guard_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    guard_name TEXT NOT NULL,
    location JSONB,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    status TEXT DEFAULT 'requested' CHECK (status IN ('requested', 'dispatched', 'resolved')),
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create emergency_alerts table for mobile app
CREATE TABLE IF NOT EXISTS emergency_alerts (
    id TEXT PRIMARY KEY,
    guard_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    guard_name TEXT NOT NULL,
    location JSONB,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'responding', 'resolved')),
    response_time INTERVAL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create daily_reports table for mobile app
CREATE TABLE IF NOT EXISTS daily_reports (
    id TEXT PRIMARY KEY,
    guard_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    guard_name TEXT NOT NULL,
    date DATE DEFAULT CURRENT_DATE,
    check_ins INTEGER DEFAULT 0,
    incidents_reported INTEGER DEFAULT 0,
    patrol_duration INTERVAL DEFAULT '0 seconds',
    notes TEXT,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_patrol_sessions_guard ON patrol_sessions(guard_id);
CREATE INDEX IF NOT EXISTS idx_patrol_sessions_status ON patrol_sessions(status);
CREATE INDEX IF NOT EXISTS idx_checkpoint_visits_session ON checkpoint_visits(session_id);
CREATE INDEX IF NOT EXISTS idx_backup_requests_guard ON backup_requests(guard_id);
CREATE INDEX IF NOT EXISTS idx_backup_requests_status ON backup_requests(status);
CREATE INDEX IF NOT EXISTS idx_emergency_alerts_guard ON emergency_alerts(guard_id);
CREATE INDEX IF NOT EXISTS idx_emergency_alerts_status ON emergency_alerts(status);
CREATE INDEX IF NOT EXISTS idx_daily_reports_guard_date ON daily_reports(guard_id, date);

-- Enable RLS on all tables
ALTER TABLE patrol_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE checkpoint_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE backup_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Allow users to access their own data
CREATE POLICY "Users can manage own patrol sessions" ON patrol_sessions
    FOR ALL USING (guard_id = auth.uid());

CREATE POLICY "Users can manage own checkpoint visits" ON checkpoint_visits
    FOR ALL USING (
        session_id IN (
            SELECT id FROM patrol_sessions WHERE guard_id = auth.uid()
        )
    );

CREATE POLICY "Users can manage own backup requests" ON backup_requests
    FOR ALL USING (guard_id = auth.uid());

CREATE POLICY "Users can manage own emergency alerts" ON emergency_alerts
    FOR ALL USING (guard_id = auth.uid());

CREATE POLICY "Users can manage own daily reports" ON daily_reports
    FOR ALL USING (guard_id = auth.uid());

-- Allow users with guard-management product access to view all records
CREATE POLICY "Guard managers can view all patrol data" ON patrol_sessions
    FOR SELECT USING (
        auth.uid() IN (
            SELECT user_id FROM user_products 
            WHERE product_id = 'guard-management' AND is_active = true
        )
    );

CREATE POLICY "Guard managers can view all checkpoint visits" ON checkpoint_visits
    FOR SELECT USING (
        auth.uid() IN (
            SELECT user_id FROM user_products 
            WHERE product_id = 'guard-management' AND is_active = true
        )
    );

CREATE POLICY "Guard managers can view all backup requests" ON backup_requests
    FOR SELECT USING (
        auth.uid() IN (
            SELECT user_id FROM user_products 
            WHERE product_id = 'guard-management' AND is_active = true
        )
    );

CREATE POLICY "Guard managers can view all emergency alerts" ON emergency_alerts
    FOR SELECT USING (
        auth.uid() IN (
            SELECT user_id FROM user_products 
            WHERE product_id = 'guard-management' AND is_active = true
        )
    );

CREATE POLICY "Guard managers can view all daily reports" ON daily_reports
    FOR SELECT USING (
        auth.uid() IN (
            SELECT user_id FROM user_products 
            WHERE product_id = 'guard-management' AND is_active = true
        )
    );

-- Update timestamp triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_patrol_sessions_updated_at BEFORE UPDATE ON patrol_sessions
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_backup_requests_updated_at BEFORE UPDATE ON backup_requests
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_emergency_alerts_updated_at BEFORE UPDATE ON emergency_alerts
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Success message
SELECT 'Mobile Guard Support Tables created successfully!' as message;