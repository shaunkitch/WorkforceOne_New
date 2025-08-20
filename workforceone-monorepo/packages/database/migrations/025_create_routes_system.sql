-- Migration 025: Create Routes and Route Optimization System
-- Comprehensive route planning, optimization, and assignment system

-- Routes table - Core route definitions
CREATE TABLE IF NOT EXISTS routes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'archived', 'completed')),
    optimization_type VARCHAR(20) DEFAULT 'balanced' CHECK (optimization_type IN ('distance', 'time', 'balanced', 'custom')),
    total_estimated_duration INTEGER DEFAULT 0, -- minutes
    total_estimated_distance DECIMAL(10,2) DEFAULT 0, -- kilometers
    total_stops INTEGER DEFAULT 0,
    route_date DATE, -- planned execution date
    start_location JSONB, -- {lat, lng, address} for route starting point
    end_location JSONB, -- {lat, lng, address} for route ending point (optional)
    optimization_settings JSONB DEFAULT '{}', -- custom optimization parameters
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Route stops table - Individual stops in each route
CREATE TABLE IF NOT EXISTS route_stops (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    route_id UUID NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
    outlet_id UUID NOT NULL REFERENCES outlets(id) ON DELETE CASCADE,
    stop_order INTEGER NOT NULL, -- order in the route (1, 2, 3, etc.)
    estimated_arrival_time TIME, -- planned arrival time
    estimated_duration INTEGER DEFAULT 30, -- minutes to spend at this stop
    actual_arrival_time TIMESTAMP WITH TIME ZONE,
    actual_departure_time TIMESTAMP WITH TIME ZONE,
    distance_from_previous DECIMAL(10,2), -- km from previous stop
    travel_time_from_previous INTEGER, -- minutes from previous stop
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_transit', 'arrived', 'completed', 'skipped')),
    notes TEXT,
    priority INTEGER DEFAULT 1, -- 1=high, 2=medium, 3=low
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(route_id, stop_order)
);

-- Route assignments table - Assign routes to users or teams
CREATE TABLE IF NOT EXISTS route_assignments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    route_id UUID NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
    assignee_type VARCHAR(10) NOT NULL CHECK (assignee_type IN ('user', 'team')),
    assignee_id UUID NOT NULL, -- references profiles(id) or teams(id)
    assigned_by UUID NOT NULL REFERENCES profiles(id),
    assigned_date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'assigned' CHECK (status IN ('assigned', 'accepted', 'in_progress', 'completed', 'rejected')),
    actual_start_time TIMESTAMP WITH TIME ZONE,
    actual_end_time TIMESTAMP WITH TIME ZONE,
    actual_total_distance DECIMAL(10,2), -- actual distance traveled
    actual_total_duration INTEGER, -- actual time taken in minutes
    completion_percentage INTEGER DEFAULT 0, -- 0-100
    performance_score DECIMAL(5,2), -- efficiency rating
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Route optimization settings table - Organization preferences
CREATE TABLE IF NOT EXISTS route_optimization_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    default_optimization_type VARCHAR(20) DEFAULT 'balanced',
    default_stop_duration INTEGER DEFAULT 30, -- minutes
    max_route_duration INTEGER DEFAULT 480, -- minutes (8 hours)
    max_daily_distance DECIMAL(10,2) DEFAULT 300, -- kilometers
    avoid_tolls BOOLEAN DEFAULT FALSE,
    avoid_highways BOOLEAN DEFAULT FALSE,
    prefer_main_roads BOOLEAN DEFAULT TRUE,
    working_hours_start TIME DEFAULT '08:00',
    working_hours_end TIME DEFAULT '17:00',
    break_duration INTEGER DEFAULT 60, -- lunch break in minutes
    travel_speed_factor DECIMAL(3,2) DEFAULT 1.0, -- adjust for driver speed (0.8 = slower, 1.2 = faster)
    map_service VARCHAR(20) DEFAULT 'google' CHECK (map_service IN ('google', 'openstreet', 'mapbox')),
    api_settings JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(organization_id)
);

-- Route tracking table - Real-time location tracking
CREATE TABLE IF NOT EXISTS route_tracking (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    route_assignment_id UUID NOT NULL REFERENCES route_assignments(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    current_location JSONB NOT NULL, -- {lat, lng, accuracy, timestamp}
    current_stop_id UUID REFERENCES route_stops(id),
    speed DECIMAL(5,2), -- km/h
    heading DECIMAL(5,2), -- degrees (0-360)
    battery_level INTEGER, -- percentage
    is_active BOOLEAN DEFAULT TRUE,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_routes_organization_id ON routes(organization_id);
CREATE INDEX IF NOT EXISTS idx_routes_created_by ON routes(created_by);
CREATE INDEX IF NOT EXISTS idx_routes_status ON routes(status);
CREATE INDEX IF NOT EXISTS idx_routes_route_date ON routes(route_date);

CREATE INDEX IF NOT EXISTS idx_route_stops_route_id ON route_stops(route_id);
CREATE INDEX IF NOT EXISTS idx_route_stops_outlet_id ON route_stops(outlet_id);
CREATE INDEX IF NOT EXISTS idx_route_stops_order ON route_stops(route_id, stop_order);

CREATE INDEX IF NOT EXISTS idx_route_assignments_route_id ON route_assignments(route_id);
CREATE INDEX IF NOT EXISTS idx_route_assignments_assignee ON route_assignments(assignee_type, assignee_id);
CREATE INDEX IF NOT EXISTS idx_route_assignments_date ON route_assignments(assigned_date);
CREATE INDEX IF NOT EXISTS idx_route_assignments_status ON route_assignments(status);

CREATE INDEX IF NOT EXISTS idx_route_tracking_assignment_id ON route_tracking(route_assignment_id);
CREATE INDEX IF NOT EXISTS idx_route_tracking_user_id ON route_tracking(user_id);
CREATE INDEX IF NOT EXISTS idx_route_tracking_recorded_at ON route_tracking(recorded_at);

-- Comments for documentation
COMMENT ON TABLE routes IS 'Core route definitions with optimization settings';
COMMENT ON TABLE route_stops IS 'Individual stops within each route with timing and status';
COMMENT ON TABLE route_assignments IS 'Assignment of routes to users or teams with tracking';
COMMENT ON TABLE route_optimization_settings IS 'Organization-level route optimization preferences';
COMMENT ON TABLE route_tracking IS 'Real-time GPS tracking data for active routes';

COMMENT ON COLUMN routes.optimization_type IS 'Route optimization preference: distance (shortest), time (fastest), balanced, or custom';
COMMENT ON COLUMN route_stops.stop_order IS 'Order of this stop in the route (1=first, 2=second, etc.)';
COMMENT ON COLUMN route_assignments.assignee_type IS 'Whether route is assigned to individual user or entire team';
COMMENT ON COLUMN route_assignments.performance_score IS 'Efficiency score based on planned vs actual time/distance';
COMMENT ON COLUMN route_optimization_settings.travel_speed_factor IS 'Multiplier for estimated travel times (1.0=normal, 0.8=slower driver, 1.2=faster)';
COMMENT ON COLUMN route_tracking.current_location IS 'JSON object with lat, lng, accuracy, and timestamp';

-- Trigger to update route totals when stops are modified
CREATE OR REPLACE FUNCTION update_route_totals()
RETURNS TRIGGER AS $$
BEGIN
    -- Update route totals when stops are added/modified/deleted
    UPDATE routes SET 
        total_stops = (
            SELECT COUNT(*) 
            FROM route_stops 
            WHERE route_id = COALESCE(NEW.route_id, OLD.route_id)
        ),
        total_estimated_duration = (
            SELECT COALESCE(SUM(estimated_duration), 0) + COALESCE(SUM(travel_time_from_previous), 0)
            FROM route_stops 
            WHERE route_id = COALESCE(NEW.route_id, OLD.route_id)
        ),
        total_estimated_distance = (
            SELECT COALESCE(SUM(distance_from_previous), 0)
            FROM route_stops 
            WHERE route_id = COALESCE(NEW.route_id, OLD.route_id)
        ),
        updated_at = CURRENT_TIMESTAMP
    WHERE id = COALESCE(NEW.route_id, OLD.route_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create triggers
DROP TRIGGER IF EXISTS trigger_update_route_totals ON route_stops;
CREATE TRIGGER trigger_update_route_totals
    AFTER INSERT OR UPDATE OR DELETE ON route_stops
    FOR EACH ROW
    EXECUTE FUNCTION update_route_totals();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers
CREATE TRIGGER update_routes_updated_at BEFORE UPDATE ON routes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_route_stops_updated_at BEFORE UPDATE ON route_stops FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_route_assignments_updated_at BEFORE UPDATE ON route_assignments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_route_optimization_settings_updated_at BEFORE UPDATE ON route_optimization_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();