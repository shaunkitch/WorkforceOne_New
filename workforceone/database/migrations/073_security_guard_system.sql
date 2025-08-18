-- =============================================
-- Security Guard Patrol & Incident System
-- Database schema for comprehensive security management
-- =============================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis"; -- For advanced geospatial queries (optional)

-- =============================================
-- ENUMS FOR TYPE SAFETY
-- =============================================

-- Patrol session status
DO $$ BEGIN
    CREATE TYPE patrol_session_status AS ENUM (
        'scheduled',
        'active', 
        'paused',
        'completed',
        'missed',
        'emergency_stopped'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Guard assignment status  
DO $$ BEGIN
    CREATE TYPE assignment_status AS ENUM (
        'scheduled',
        'active',
        'completed', 
        'missed',
        'cancelled'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Incident categories
DO $$ BEGIN
    CREATE TYPE incident_category AS ENUM (
        'security_breach',
        'suspicious_activity', 
        'maintenance_issue',
        'safety_hazard',
        'medical_emergency',
        'fire_alarm',
        'equipment_failure',
        'vandalism',
        'theft',
        'other'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Incident severity levels
DO $$ BEGIN
    CREATE TYPE incident_severity AS ENUM (
        'low',
        'medium', 
        'high',
        'critical'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Incident status workflow
DO $$ BEGIN
    CREATE TYPE incident_status AS ENUM (
        'open',
        'assigned',
        'investigating',
        'pending_review',
        'resolved',
        'closed',
        'escalated'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- File types for evidence
DO $$ BEGIN
    CREATE TYPE attachment_type AS ENUM (
        'photo',
        'video',
        'audio',
        'document'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- =============================================
-- PATROL SYSTEM TABLES
-- =============================================

-- Patrol routes define the paths guards should follow
CREATE TABLE IF NOT EXISTS IF NOT EXISTS patrol_routes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Route configuration
    estimated_duration INTERVAL NOT NULL DEFAULT '2 hours',
    max_deviation_meters INTEGER DEFAULT 100,
    patrol_frequency INTERVAL DEFAULT '4 hours',
    
    -- Geospatial boundaries (JSON for now, PostGIS geometry later)
    boundary_coords JSONB, -- Array of lat/lng coordinates
    
    -- Status and metadata
    is_active BOOLEAN DEFAULT true,
    color_code VARCHAR(7) DEFAULT '#2563eb', -- Hex color for map display
    instructions TEXT,
    
    -- Audit fields
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT patrol_routes_name_org_unique UNIQUE (name, organization_id)
);

-- Checkpoints are specific locations guards must visit during patrols
CREATE TABLE IF NOT EXISTS patrol_checkpoints (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    route_id UUID NOT NULL REFERENCES patrol_routes(id) ON DELETE CASCADE,
    
    -- Location details
    name VARCHAR(255) NOT NULL,
    description TEXT,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    radius_meters INTEGER DEFAULT 50,
    
    -- Checkpoint configuration
    order_sequence INTEGER NOT NULL,
    is_mandatory BOOLEAN DEFAULT true,
    estimated_time_minutes INTEGER DEFAULT 5,
    
    -- QR Code for verification
    qr_code VARCHAR(255) UNIQUE,
    qr_code_expires_at TIMESTAMPTZ,
    
    -- Verification requirements
    requires_photo BOOLEAN DEFAULT false,
    requires_scan BOOLEAN DEFAULT true,
    photo_instructions TEXT,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    
    -- Audit fields
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT checkpoint_sequence_unique UNIQUE (route_id, order_sequence),
    CONSTRAINT valid_coordinates CHECK (
        latitude BETWEEN -90 AND 90 AND 
        longitude BETWEEN -180 AND 180
    )
);

-- Guard assignments schedule when guards should patrol specific routes
CREATE TABLE IF NOT EXISTS guard_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    guard_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    route_id UUID NOT NULL REFERENCES patrol_routes(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Schedule timing
    shift_start TIMESTAMPTZ NOT NULL,
    shift_end TIMESTAMPTZ NOT NULL,
    expected_patrol_start TIMESTAMPTZ,
    expected_patrol_end TIMESTAMPTZ,
    
    -- Status tracking
    status assignment_status DEFAULT 'scheduled',
    actual_start TIMESTAMPTZ,
    actual_end TIMESTAMPTZ,
    
    -- Performance metrics
    completion_percentage DECIMAL(5,2) DEFAULT 0,
    checkpoints_completed INTEGER DEFAULT 0,
    checkpoints_total INTEGER DEFAULT 0,
    
    -- Notes and feedback
    supervisor_notes TEXT,
    guard_notes TEXT,
    
    -- Audit fields
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_shift_times CHECK (shift_end > shift_start),
    CONSTRAINT completion_percentage_bounds CHECK (
        completion_percentage >= 0 AND completion_percentage <= 100
    )
);

-- Patrol sessions track active/completed patrols
CREATE TABLE IF NOT EXISTS patrol_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    guard_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    route_id UUID NOT NULL REFERENCES patrol_routes(id) ON DELETE CASCADE,
    assignment_id UUID REFERENCES guard_assignments(id) ON DELETE SET NULL,
    
    -- Session timing
    start_time TIMESTAMPTZ DEFAULT NOW(),
    end_time TIMESTAMPTZ,
    paused_duration INTERVAL DEFAULT '0 seconds',
    
    -- Status and location
    status patrol_session_status DEFAULT 'active',
    current_latitude DECIMAL(10, 8),
    current_longitude DECIMAL(11, 8),
    last_location_update TIMESTAMPTZ,
    
    -- Performance metrics
    total_distance_meters DECIMAL(10, 2) DEFAULT 0,
    checkpoints_completed INTEGER DEFAULT 0,
    checkpoints_missed INTEGER DEFAULT 0,
    average_speed_kmh DECIMAL(5, 2),
    
    -- Device and connectivity
    device_battery_level INTEGER,
    device_info JSONB,
    offline_duration INTERVAL DEFAULT '0 seconds',
    
    -- Emergency and alerts
    panic_button_pressed BOOLEAN DEFAULT false,
    panic_time TIMESTAMPTZ,
    emergency_contacts_notified BOOLEAN DEFAULT false,
    
    -- Notes
    start_notes TEXT,
    end_notes TEXT,
    supervisor_notes TEXT,
    
    -- Audit fields
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_session_times CHECK (
        end_time IS NULL OR end_time >= start_time
    ),
    CONSTRAINT valid_coordinates CHECK (
        (current_latitude IS NULL AND current_longitude IS NULL) OR
        (current_latitude BETWEEN -90 AND 90 AND current_longitude BETWEEN -180 AND 180)
    )
);

-- GPS location tracking for patrol sessions
CREATE TABLE IF NOT EXISTS patrol_locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES patrol_sessions(id) ON DELETE CASCADE,
    
    -- GPS coordinates
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    accuracy_meters DECIMAL(6, 2),
    altitude_meters DECIMAL(8, 2),
    
    -- Timing
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    
    -- Device status
    battery_level INTEGER,
    signal_strength INTEGER,
    
    -- Context information
    is_checkpoint_scan BOOLEAN DEFAULT false,
    checkpoint_id UUID REFERENCES patrol_checkpoints(id),
    movement_speed_kmh DECIMAL(5, 2),
    
    -- Data quality flags
    is_accurate BOOLEAN DEFAULT true,
    is_manual_entry BOOLEAN DEFAULT false,
    
    -- Constraints
    CONSTRAINT valid_location_coords CHECK (
        latitude BETWEEN -90 AND 90 AND 
        longitude BETWEEN -180 AND 180
    ),
    CONSTRAINT valid_battery_level CHECK (
        battery_level IS NULL OR (battery_level >= 0 AND battery_level <= 100)
    )
);

-- Checkpoint visits track when guards visit specific checkpoints
CREATE TABLE IF NOT EXISTS checkpoint_visits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES patrol_sessions(id) ON DELETE CASCADE,
    checkpoint_id UUID NOT NULL REFERENCES patrol_checkpoints(id) ON DELETE CASCADE,
    
    -- Visit details
    visited_at TIMESTAMPTZ DEFAULT NOW(),
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    distance_from_checkpoint_meters DECIMAL(8, 2),
    
    -- Verification methods
    qr_code_scanned BOOLEAN DEFAULT false,
    photo_taken BOOLEAN DEFAULT false,
    manual_check_in BOOLEAN DEFAULT false,
    
    -- Verification data
    qr_scan_data TEXT,
    photo_path TEXT,
    verification_notes TEXT,
    
    -- Status and validation
    is_valid_visit BOOLEAN DEFAULT true,
    validation_flags JSONB, -- Array of validation issues
    
    -- Timing analysis
    time_spent_minutes DECIMAL(5, 2),
    arrival_delay_minutes DECIMAL(5, 2),
    
    -- Device info
    device_battery_level INTEGER,
    
    -- Audit fields
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_visit_coords CHECK (
        latitude BETWEEN -90 AND 90 AND 
        longitude BETWEEN -180 AND 180
    )
);

-- =============================================
-- INCIDENT REPORTING SYSTEM
-- =============================================

-- Incident reports for security events
CREATE TABLE IF NOT EXISTS incident_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    guard_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    session_id UUID REFERENCES patrol_sessions(id) ON DELETE SET NULL,
    
    -- Report details
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category incident_category NOT NULL,
    severity incident_severity NOT NULL DEFAULT 'medium',
    
    -- Location information
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    location_description TEXT,
    nearest_checkpoint_id UUID REFERENCES patrol_checkpoints(id),
    
    -- Timing
    incident_time TIMESTAMPTZ NOT NULL,
    reported_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Status and workflow
    status incident_status DEFAULT 'open',
    assigned_to UUID REFERENCES profiles(id),
    assigned_at TIMESTAMPTZ,
    resolved_at TIMESTAMPTZ,
    resolution_notes TEXT,
    
    -- Priority and escalation
    is_emergency BOOLEAN DEFAULT false,
    escalated_at TIMESTAMPTZ,
    escalated_to UUID REFERENCES profiles(id),
    
    -- Follow-up requirements
    requires_police BOOLEAN DEFAULT false,
    requires_medical BOOLEAN DEFAULT false,
    requires_maintenance BOOLEAN DEFAULT false,
    police_case_number VARCHAR(100),
    
    -- Client notification
    client_notified BOOLEAN DEFAULT false,
    client_notification_sent_at TIMESTAMPTZ,
    
    -- Impact assessment
    property_damage_estimated DECIMAL(10, 2),
    people_affected INTEGER DEFAULT 0,
    business_impact_level VARCHAR(20),
    
    -- Additional metadata
    weather_conditions TEXT,
    witness_count INTEGER DEFAULT 0,
    tags JSONB, -- Array of tags for categorization
    
    -- Audit fields
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_incident_coords CHECK (
        latitude BETWEEN -90 AND 90 AND 
        longitude BETWEEN -180 AND 180
    ),
    CONSTRAINT valid_damage_amount CHECK (
        property_damage_estimated IS NULL OR property_damage_estimated >= 0
    )
);

-- Attachments for incident evidence (photos, videos, documents)
CREATE TABLE IF NOT EXISTS incident_attachments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    incident_id UUID NOT NULL REFERENCES incident_reports(id) ON DELETE CASCADE,
    
    -- File information
    filename VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    file_type attachment_type NOT NULL,
    file_size_bytes BIGINT NOT NULL,
    mime_type VARCHAR(100),
    
    -- Content details
    caption TEXT,
    description TEXT,
    
    -- GPS location of photo/video
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    
    -- Metadata
    taken_at TIMESTAMPTZ DEFAULT NOW(),
    device_info JSONB,
    
    -- Processing status
    is_processed BOOLEAN DEFAULT false,
    thumbnail_path TEXT,
    
    -- Audit fields
    uploaded_by UUID REFERENCES profiles(id),
    uploaded_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT valid_file_size CHECK (file_size_bytes > 0),
    CONSTRAINT valid_attachment_coords CHECK (
        (latitude IS NULL AND longitude IS NULL) OR
        (latitude BETWEEN -90 AND 90 AND longitude BETWEEN -180 AND 180)
    )
);

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

-- Patrol system indexes
CREATE INDEX IF NOT EXISTS idx_patrol_sessions_guard_time ON patrol_sessions (guard_id, start_time DESC);
CREATE INDEX IF NOT EXISTS idx_patrol_sessions_organization_status ON patrol_sessions (organization_id, status);
-- Removed date cast index - use start_time directly instead
CREATE INDEX IF NOT EXISTS idx_patrol_sessions_route_time ON patrol_sessions (route_id, start_time);

CREATE INDEX IF NOT EXISTS idx_patrol_locations_session_time ON patrol_locations (session_id, timestamp);
CREATE INDEX IF NOT EXISTS idx_patrol_locations_coords ON patrol_locations (latitude, longitude);

CREATE INDEX IF NOT EXISTS idx_checkpoint_visits_session ON checkpoint_visits (session_id);
CREATE INDEX IF NOT EXISTS idx_checkpoint_visits_checkpoint_time ON checkpoint_visits (checkpoint_id, visited_at DESC);

CREATE INDEX IF NOT EXISTS idx_guard_assignments_guard_shift ON guard_assignments (guard_id, shift_start, shift_end);
-- Removed date cast index - use shift_start directly instead
CREATE INDEX IF NOT EXISTS idx_guard_assignments_route_time ON guard_assignments (route_id, shift_start);

-- Incident system indexes
CREATE INDEX IF NOT EXISTS idx_incident_reports_organization_time ON incident_reports (organization_id, incident_time DESC);
CREATE INDEX IF NOT EXISTS idx_incident_reports_guard_time ON incident_reports (guard_id, incident_time DESC);
CREATE INDEX IF NOT EXISTS idx_incident_reports_status ON incident_reports (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_incident_reports_coords ON incident_reports (latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_incident_reports_severity ON incident_reports (severity, incident_time DESC);

CREATE INDEX IF NOT EXISTS idx_incident_attachments_incident ON incident_attachments (incident_id);

-- GIN indexes for JSON columns
CREATE INDEX IF NOT EXISTS idx_patrol_routes_boundary ON patrol_routes USING GIN (boundary_coords);
CREATE INDEX IF NOT EXISTS idx_checkpoint_visits_validation ON checkpoint_visits USING GIN (validation_flags);
CREATE INDEX IF NOT EXISTS idx_incident_reports_tags ON incident_reports USING GIN (tags);

-- =============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================

-- Enable RLS on all tables
ALTER TABLE patrol_routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE patrol_checkpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE guard_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE patrol_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE patrol_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE checkpoint_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE incident_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE incident_attachments ENABLE ROW LEVEL SECURITY;

-- Example RLS policies (can be customized based on role requirements)

-- Guards can only see their own patrols and assignments
CREATE POLICY "Guards can view own patrol sessions" ON patrol_sessions
    FOR ALL USING (guard_id = auth.uid());

CREATE POLICY "Guards can view own assignments" ON guard_assignments
    FOR ALL USING (guard_id = auth.uid());

-- Organization admins can see all data for their organization
CREATE POLICY "Admins can view org patrol data" ON patrol_sessions
    FOR ALL USING (
        organization_id IN (
            SELECT organization_id FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager')
        )
    );

-- Similar policies for other tables...
-- (Additional policies can be added based on specific security requirements)

-- =============================================
-- TRIGGERS AND FUNCTIONS
-- =============================================

-- Function to update patrol session metrics
CREATE OR REPLACE FUNCTION update_patrol_session_metrics()
RETURNS TRIGGER AS $$
BEGIN
    -- Update distance and checkpoint counts when location is added
    IF TG_OP = 'INSERT' THEN
        UPDATE patrol_sessions SET
            current_latitude = NEW.latitude,
            current_longitude = NEW.longitude,
            last_location_update = NEW.timestamp,
            updated_at = NOW()
        WHERE id = NEW.session_id;
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger to update session metrics
DROP TRIGGER IF EXISTS trigger_update_patrol_metrics ON patrol_locations;
CREATE TRIGGER trigger_update_patrol_metrics
    AFTER INSERT OR UPDATE ON patrol_locations
    FOR EACH ROW EXECUTE FUNCTION update_patrol_session_metrics();

-- Function to generate QR codes for checkpoints
CREATE OR REPLACE FUNCTION generate_checkpoint_qr_code()
RETURNS TRIGGER AS $$
BEGIN
    -- Generate unique QR code if not provided
    IF NEW.qr_code IS NULL THEN
        NEW.qr_code = 'CP_' || UPPER(SUBSTRING(NEW.id::text, 1, 8));
    END IF;
    
    -- Set expiry date (1 year from creation)
    IF NEW.qr_code_expires_at IS NULL THEN
        NEW.qr_code_expires_at = NOW() + INTERVAL '1 year';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to generate QR codes
DROP TRIGGER IF EXISTS trigger_generate_checkpoint_qr ON patrol_checkpoints;
CREATE TRIGGER trigger_generate_checkpoint_qr
    BEFORE INSERT OR UPDATE ON patrol_checkpoints
    FOR EACH ROW EXECUTE FUNCTION generate_checkpoint_qr_code();

-- =============================================
-- SAMPLE DATA FUNCTIONS
-- =============================================

-- Function to create sample patrol route (for testing)
CREATE OR REPLACE FUNCTION create_sample_patrol_route(
    org_id UUID,
    route_name TEXT DEFAULT 'Sample Security Route'
)
RETURNS UUID AS $$
DECLARE
    route_id UUID;
    checkpoint_id UUID;
BEGIN
    -- Create route
    INSERT INTO patrol_routes (organization_id, name, description, estimated_duration)
    VALUES (
        org_id, 
        route_name, 
        'Sample patrol route for testing security system',
        '2 hours'::interval
    )
    RETURNING id INTO route_id;
    
    -- Create sample checkpoints
    INSERT INTO patrol_checkpoints (route_id, name, latitude, longitude, order_sequence)
    VALUES 
        (route_id, 'Main Entrance', -26.2041, 28.0473, 1),
        (route_id, 'Parking Lot', -26.2045, 28.0470, 2),
        (route_id, 'Building Perimeter', -26.2048, 28.0475, 3),
        (route_id, 'Emergency Exits', -26.2044, 28.0478, 4);
    
    RETURN route_id;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- VIEWS FOR COMMON QUERIES
-- =============================================

-- Active patrol sessions with guard info
CREATE OR REPLACE VIEW active_patrol_sessions AS
SELECT 
    ps.id,
    ps.organization_id,
    ps.guard_id,
    p.full_name as guard_name,
    ps.route_id,
    pr.name as route_name,
    ps.start_time,
    ps.status,
    ps.current_latitude,
    ps.current_longitude,
    ps.last_location_update,
    ps.checkpoints_completed,
    ps.checkpoints_missed,
    ps.device_battery_level
FROM patrol_sessions ps
JOIN profiles p ON ps.guard_id = p.id
JOIN patrol_routes pr ON ps.route_id = pr.id
WHERE ps.status IN ('active', 'paused');

-- Recent incident summary
CREATE OR REPLACE VIEW recent_incidents_summary AS
SELECT 
    ir.id,
    ir.organization_id,
    ir.title,
    ir.category,
    ir.severity,
    ir.status,
    ir.incident_time,
    p.full_name as guard_name,
    ir.latitude,
    ir.longitude,
    COUNT(ia.id) as attachment_count
FROM incident_reports ir
JOIN profiles p ON ir.guard_id = p.id
LEFT JOIN incident_attachments ia ON ir.id = ia.incident_id
WHERE ir.incident_time >= NOW() - INTERVAL '30 days'
GROUP BY ir.id, p.full_name
ORDER BY ir.incident_time DESC;

-- Patrol performance metrics
CREATE OR REPLACE VIEW patrol_performance_metrics AS
SELECT 
    ga.guard_id,
    p.full_name as guard_name,
    ga.organization_id,
    COUNT(*) as total_assignments,
    COUNT(*) FILTER (WHERE ga.status = 'completed') as completed_assignments,
    COUNT(*) FILTER (WHERE ga.status = 'missed') as missed_assignments,
    ROUND(AVG(ga.completion_percentage), 2) as avg_completion_rate,
    AVG(ps.total_distance_meters) as avg_patrol_distance
FROM guard_assignments ga
JOIN profiles p ON ga.guard_id = p.id
LEFT JOIN patrol_sessions ps ON ga.id = ps.assignment_id
WHERE ga.shift_start >= NOW() - INTERVAL '30 days'
GROUP BY ga.guard_id, p.full_name, ga.organization_id;

-- Add comments for documentation
COMMENT ON TABLE patrol_routes IS 'Defines patrol routes with checkpoints and boundaries';
COMMENT ON TABLE patrol_sessions IS 'Tracks active and completed patrol sessions with real-time location data';
COMMENT ON TABLE incident_reports IS 'Security incident reports with evidence and workflow tracking';
COMMENT ON TABLE patrol_locations IS 'GPS location tracking data for patrol sessions (10-minute intervals)';

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Security Guard Patrol & Incident System database schema created successfully!';
    RAISE NOTICE 'Tables created: %, %, %, %, %, %, %, %', 
        'patrol_routes', 'patrol_checkpoints', 'guard_assignments', 'patrol_sessions',
        'patrol_locations', 'checkpoint_visits', 'incident_reports', 'incident_attachments';
END $$;