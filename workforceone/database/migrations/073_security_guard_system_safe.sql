-- =============================================
-- Security Guard Patrol & Incident System (SAFE VERSION)
-- Database schema for comprehensive security management
-- This version handles existing objects gracefully
-- =============================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- ENUMS FOR TYPE SAFETY (with duplicate handling)
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
    WHEN duplicate_object THEN 
        RAISE NOTICE 'Type patrol_session_status already exists, skipping';
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
    WHEN duplicate_object THEN 
        RAISE NOTICE 'Type assignment_status already exists, skipping';
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
    WHEN duplicate_object THEN 
        RAISE NOTICE 'Type incident_category already exists, skipping';
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
    WHEN duplicate_object THEN 
        RAISE NOTICE 'Type incident_severity already exists, skipping';
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
    WHEN duplicate_object THEN 
        RAISE NOTICE 'Type incident_status already exists, skipping';
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
    WHEN duplicate_object THEN 
        RAISE NOTICE 'Type attachment_type already exists, skipping';
END $$;

-- =============================================
-- PATROL SYSTEM TABLES
-- =============================================

-- Patrol routes define the paths guards should follow
CREATE TABLE IF NOT EXISTS patrol_routes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    
    -- Route configuration
    estimated_duration INTERVAL NOT NULL DEFAULT '2 hours',
    color_code VARCHAR(7) DEFAULT '#3b82f6',
    is_active BOOLEAN DEFAULT true,
    
    -- Geographic boundary (optional)
    boundary_coords JSONB,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID,
    
    UNIQUE(organization_id, name)
);

-- Checkpoints that must be visited during patrol
CREATE TABLE IF NOT EXISTS patrol_checkpoints (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    route_id UUID NOT NULL REFERENCES patrol_routes(id) ON DELETE CASCADE,
    
    name VARCHAR(255) NOT NULL,
    description TEXT,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    
    -- Checkpoint configuration
    order_sequence INTEGER NOT NULL,
    is_mandatory BOOLEAN DEFAULT true,
    radius_meters INTEGER DEFAULT 50,
    
    -- QR code for verification
    qr_code VARCHAR(255) UNIQUE,
    qr_code_expires_at TIMESTAMPTZ,
    
    -- Requirements
    requires_photo BOOLEAN DEFAULT false,
    requires_signature BOOLEAN DEFAULT false,
    photo_instructions TEXT,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(route_id, order_sequence)
);

-- Guard shift assignments
CREATE TABLE IF NOT EXISTS guard_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    guard_id UUID NOT NULL,
    route_id UUID NOT NULL REFERENCES patrol_routes(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL,
    
    -- Schedule
    shift_start TIMESTAMPTZ NOT NULL,
    shift_end TIMESTAMPTZ NOT NULL,
    
    -- Status tracking
    status assignment_status DEFAULT 'scheduled',
    check_in_time TIMESTAMPTZ,
    check_out_time TIMESTAMPTZ,
    
    -- Performance metrics
    completion_percentage DECIMAL(5,2) DEFAULT 0,
    
    -- Notes
    assignment_notes TEXT,
    completion_notes TEXT,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID
);

-- Active patrol sessions
CREATE TABLE IF NOT EXISTS patrol_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    guard_id UUID NOT NULL,
    organization_id UUID NOT NULL,
    route_id UUID NOT NULL REFERENCES patrol_routes(id) ON DELETE CASCADE,
    assignment_id UUID REFERENCES guard_assignments(id) ON DELETE SET NULL,
    
    -- Session timing
    start_time TIMESTAMPTZ DEFAULT NOW(),
    end_time TIMESTAMPTZ,
    status patrol_session_status DEFAULT 'active',
    
    -- Real-time tracking
    current_latitude DECIMAL(10, 8),
    current_longitude DECIMAL(11, 8),
    last_location_update TIMESTAMPTZ,
    
    -- Progress tracking
    checkpoints_completed INTEGER DEFAULT 0,
    checkpoints_missed INTEGER DEFAULT 0,
    total_distance_meters DECIMAL(10,2) DEFAULT 0,
    
    -- Device info
    device_id VARCHAR(255),
    device_battery_level INTEGER,
    
    -- Emergency
    panic_button_pressed BOOLEAN DEFAULT false,
    panic_time TIMESTAMPTZ,
    
    -- Notes
    start_notes TEXT,
    end_notes TEXT,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- GPS location tracking (10-minute intervals)
CREATE TABLE IF NOT EXISTS patrol_locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES patrol_sessions(id) ON DELETE CASCADE,
    
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    accuracy_meters DECIMAL(6,2),
    altitude_meters DECIMAL(8,2),
    
    speed_kmh DECIMAL(5,2),
    heading_degrees DECIMAL(5,2),
    
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    
    -- Additional context
    battery_level INTEGER,
    is_checkpoint_scan BOOLEAN DEFAULT false,
    checkpoint_id UUID REFERENCES patrol_checkpoints(id) ON DELETE SET NULL
);

-- Checkpoint scan records
CREATE TABLE IF NOT EXISTS checkpoint_scans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES patrol_sessions(id) ON DELETE CASCADE,
    checkpoint_id UUID NOT NULL REFERENCES patrol_checkpoints(id) ON DELETE CASCADE,
    
    -- Scan details
    scan_time TIMESTAMPTZ DEFAULT NOW(),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    distance_meters DECIMAL(6,2),
    
    -- Verification
    qr_code_verified BOOLEAN DEFAULT false,
    photo_url TEXT,
    signature_url TEXT,
    
    -- Notes
    notes TEXT,
    issues_reported TEXT,
    
    -- Validation
    validation_flags JSONB,
    
    UNIQUE(session_id, checkpoint_id)
);

-- =============================================
-- INCIDENT MANAGEMENT TABLES
-- =============================================

-- Security incidents reported during patrol
CREATE TABLE IF NOT EXISTS incidents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    organization_id UUID NOT NULL,
    reported_by UUID NOT NULL,
    session_id UUID REFERENCES patrol_sessions(id) ON DELETE SET NULL,
    
    -- Incident details
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category incident_category NOT NULL,
    severity incident_severity DEFAULT 'medium',
    status incident_status DEFAULT 'open',
    
    -- Location
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    location_description TEXT,
    
    -- Timing
    incident_time TIMESTAMPTZ DEFAULT NOW(),
    reported_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Response
    assigned_to UUID,
    response_time TIMESTAMPTZ,
    resolved_at TIMESTAMPTZ,
    resolution_notes TEXT,
    
    -- Escalation
    is_escalated BOOLEAN DEFAULT false,
    escalated_at TIMESTAMPTZ,
    escalated_to UUID,
    escalation_reason TEXT,
    
    -- Metadata
    tags TEXT[],
    priority INTEGER DEFAULT 5,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Witness information for incidents
CREATE TABLE IF NOT EXISTS incident_witnesses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    incident_id UUID NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
    
    name VARCHAR(255) NOT NULL,
    contact_number VARCHAR(50),
    email VARCHAR(255),
    statement TEXT,
    
    -- Identification
    id_type VARCHAR(100),
    id_number VARCHAR(100),
    
    -- Metadata
    recorded_at TIMESTAMPTZ DEFAULT NOW(),
    recorded_by UUID
);

-- Evidence attachments for incidents
CREATE TABLE IF NOT EXISTS incident_attachments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    incident_id UUID NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
    
    file_url TEXT NOT NULL,
    file_type attachment_type NOT NULL,
    file_name VARCHAR(255),
    file_size_bytes INTEGER,
    
    -- Context
    description TEXT,
    taken_at TIMESTAMPTZ DEFAULT NOW(),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    
    -- Metadata
    uploaded_at TIMESTAMPTZ DEFAULT NOW(),
    uploaded_by UUID
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

CREATE INDEX IF NOT EXISTS idx_checkpoint_scans_session ON checkpoint_scans (session_id);
CREATE INDEX IF NOT EXISTS idx_checkpoint_scans_checkpoint_time ON checkpoint_scans (checkpoint_id, scan_time DESC);

CREATE INDEX IF NOT EXISTS idx_guard_assignments_guard_shift ON guard_assignments (guard_id, shift_start, shift_end);
-- Removed date cast index - use shift_start directly instead
CREATE INDEX IF NOT EXISTS idx_guard_assignments_route_time ON guard_assignments (route_id, shift_start);

-- Incident system indexes
CREATE INDEX IF NOT EXISTS idx_incidents_organization_time ON incidents (organization_id, incident_time DESC);
CREATE INDEX IF NOT EXISTS idx_incidents_reported_by_time ON incidents (reported_by, incident_time DESC);
CREATE INDEX IF NOT EXISTS idx_incidents_status ON incidents (status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_incidents_coords ON incidents (latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_incidents_severity ON incidents (severity, incident_time DESC);

CREATE INDEX IF NOT EXISTS idx_incident_attachments_incident ON incident_attachments (incident_id);

-- JSON indexes for better performance
CREATE INDEX IF NOT EXISTS idx_patrol_routes_boundary ON patrol_routes USING GIN (boundary_coords);
CREATE INDEX IF NOT EXISTS idx_checkpoint_scans_validation ON checkpoint_scans USING GIN (validation_flags);
CREATE INDEX IF NOT EXISTS idx_incidents_tags ON incidents USING GIN (tags);

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

-- Enable RLS on all tables
ALTER TABLE patrol_routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE patrol_checkpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE guard_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE patrol_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE patrol_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE checkpoint_scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE incident_witnesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE incident_attachments ENABLE ROW LEVEL SECURITY;

-- Create basic RLS policies (adjust based on your auth setup)
DO $$
BEGIN
    -- Check if policies already exist before creating them
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'patrol_routes' 
        AND policyname = 'patrol_routes_org_isolation'
    ) THEN
        EXECUTE 'CREATE POLICY patrol_routes_org_isolation ON patrol_routes 
                 FOR ALL USING (true)';
    END IF;
    
    -- Add more policies as needed...
END $$;

-- =============================================
-- VIEWS FOR EASIER DATA ACCESS
-- =============================================

-- Active patrol sessions with guard and route info
CREATE OR REPLACE VIEW active_patrol_sessions AS
SELECT 
    ps.id as session_id,
    ps.guard_id,
    p.full_name as guard_name,
    ps.organization_id,
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
LEFT JOIN profiles p ON ps.guard_id = p.id
JOIN patrol_routes pr ON ps.route_id = pr.id
WHERE ps.status IN ('active', 'paused');

-- Recent incidents summary
CREATE OR REPLACE VIEW recent_incidents_summary AS
SELECT 
    i.id,
    i.organization_id,
    i.title,
    i.category,
    i.severity,
    i.status,
    i.incident_time,
    p.full_name as reporter_name,
    i.latitude,
    i.longitude,
    COUNT(ia.id) as attachment_count
FROM incidents i
LEFT JOIN profiles p ON i.reported_by = p.id
LEFT JOIN incident_attachments ia ON i.id = ia.incident_id
WHERE i.incident_time >= CURRENT_TIMESTAMP - INTERVAL '30 days'
GROUP BY i.id, p.full_name
ORDER BY i.incident_time DESC;

-- Guard performance stats
CREATE OR REPLACE VIEW guard_performance_stats AS
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
LEFT JOIN profiles p ON ga.guard_id = p.id
LEFT JOIN patrol_sessions ps ON ga.id = ps.assignment_id
WHERE ga.shift_start >= CURRENT_TIMESTAMP - INTERVAL '30 days'
GROUP BY ga.guard_id, p.full_name, ga.organization_id;

-- =============================================
-- HELPER FUNCTIONS
-- =============================================

-- Function to update patrol session metrics
CREATE OR REPLACE FUNCTION update_patrol_session_metrics()
RETURNS TRIGGER AS $$
BEGIN
    -- Update session metrics when new location is added
    UPDATE patrol_sessions
    SET 
        last_location_update = NEW.timestamp,
        current_latitude = NEW.latitude,
        current_longitude = NEW.longitude,
        device_battery_level = NEW.battery_level,
        updated_at = NOW()
    WHERE id = NEW.session_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update session metrics
DROP TRIGGER IF EXISTS trigger_update_patrol_metrics ON patrol_locations;
CREATE TRIGGER trigger_update_patrol_metrics
    AFTER INSERT ON patrol_locations
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
        NEW.qr_code_expires_at = CURRENT_TIMESTAMP + INTERVAL '1 year';
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
-- FOREIGN KEY CONSTRAINTS (Added separately for safety)
-- =============================================

DO $$
BEGIN
    -- Add foreign keys only if the referenced tables exist
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'organizations') THEN
        ALTER TABLE patrol_routes 
        ADD CONSTRAINT fk_patrol_routes_organization 
        FOREIGN KEY (organization_id) 
        REFERENCES organizations(id) 
        ON DELETE CASCADE;
        
        ALTER TABLE guard_assignments 
        ADD CONSTRAINT fk_guard_assignments_organization 
        FOREIGN KEY (organization_id) 
        REFERENCES organizations(id) 
        ON DELETE CASCADE;
        
        ALTER TABLE patrol_sessions 
        ADD CONSTRAINT fk_patrol_sessions_organization 
        FOREIGN KEY (organization_id) 
        REFERENCES organizations(id) 
        ON DELETE CASCADE;
        
        ALTER TABLE incidents 
        ADD CONSTRAINT fk_incidents_organization 
        FOREIGN KEY (organization_id) 
        REFERENCES organizations(id) 
        ON DELETE CASCADE;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') THEN
        ALTER TABLE patrol_routes 
        ADD CONSTRAINT fk_patrol_routes_created_by 
        FOREIGN KEY (created_by) 
        REFERENCES profiles(id) 
        ON DELETE SET NULL;
        
        ALTER TABLE guard_assignments 
        ADD CONSTRAINT fk_guard_assignments_guard 
        FOREIGN KEY (guard_id) 
        REFERENCES profiles(id) 
        ON DELETE CASCADE;
        
        ALTER TABLE guard_assignments 
        ADD CONSTRAINT fk_guard_assignments_created_by 
        FOREIGN KEY (created_by) 
        REFERENCES profiles(id) 
        ON DELETE SET NULL;
        
        ALTER TABLE patrol_sessions 
        ADD CONSTRAINT fk_patrol_sessions_guard 
        FOREIGN KEY (guard_id) 
        REFERENCES profiles(id) 
        ON DELETE CASCADE;
        
        ALTER TABLE incidents 
        ADD CONSTRAINT fk_incidents_reported_by 
        FOREIGN KEY (reported_by) 
        REFERENCES profiles(id) 
        ON DELETE CASCADE;
        
        ALTER TABLE incidents 
        ADD CONSTRAINT fk_incidents_assigned_to 
        FOREIGN KEY (assigned_to) 
        REFERENCES profiles(id) 
        ON DELETE SET NULL;
        
        ALTER TABLE incidents 
        ADD CONSTRAINT fk_incidents_escalated_to 
        FOREIGN KEY (escalated_to) 
        REFERENCES profiles(id) 
        ON DELETE SET NULL;
        
        ALTER TABLE incident_witnesses 
        ADD CONSTRAINT fk_incident_witnesses_recorded_by 
        FOREIGN KEY (recorded_by) 
        REFERENCES profiles(id) 
        ON DELETE SET NULL;
        
        ALTER TABLE incident_attachments 
        ADD CONSTRAINT fk_incident_attachments_uploaded_by 
        FOREIGN KEY (uploaded_by) 
        REFERENCES profiles(id) 
        ON DELETE SET NULL;
    END IF;
    
EXCEPTION
    WHEN duplicate_object THEN 
        RAISE NOTICE 'Some foreign key constraints already exist, continuing...';
END $$;

-- =============================================
-- SUCCESS MESSAGE
-- =============================================

DO $$
BEGIN
    RAISE NOTICE '✅ Security Guard Patrol & Incident System migration completed successfully!';
    RAISE NOTICE 'Tables created: patrol_routes, patrol_checkpoints, guard_assignments, patrol_sessions, patrol_locations, checkpoint_scans, incidents, incident_witnesses, incident_attachments';
    RAISE NOTICE 'Views created: active_patrol_sessions, recent_incidents_summary, guard_performance_stats';
    RAISE NOTICE '';
    RAISE NOTICE '📝 Next steps:';
    RAISE NOTICE '1. Configure RLS policies based on your authentication setup';
    RAISE NOTICE '2. Create patrol routes and checkpoints';
    RAISE NOTICE '3. Assign guards to routes';
    RAISE NOTICE '4. Test the system with the mobile app and dashboard';
END $$;