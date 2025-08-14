-- Migration 031: Add outlet forms relationship
-- Link outlets to forms that need to be completed when visiting

-- Add form_id to outlets table (optional - outlets may or may not have a required form)
ALTER TABLE outlets ADD COLUMN IF NOT EXISTS required_form_id UUID;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_outlets_required_form_id ON outlets(required_form_id);

-- Add foreign key constraint if forms table exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'forms') THEN
        -- Add constraint with error handling
        BEGIN
            ALTER TABLE outlets ADD CONSTRAINT fk_outlets_required_form_id
            FOREIGN KEY (required_form_id) REFERENCES forms(id) ON DELETE SET NULL;
        EXCEPTION WHEN duplicate_object THEN
            -- Constraint already exists, ignore
            NULL;
        END;
    END IF;
END $$;

-- Create outlet_visits table to track visits and form completions
CREATE TABLE IF NOT EXISTS outlet_visits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    outlet_id UUID NOT NULL,
    user_id UUID NOT NULL,
    route_stop_id UUID, -- Reference to the route_stop if this was part of a planned route
    organization_id UUID NOT NULL,
    check_in_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    check_out_time TIMESTAMP WITH TIME ZONE,
    form_completed BOOLEAN DEFAULT false,
    form_response_id UUID, -- Reference to form_responses if form was completed
    notes TEXT,
    location_coordinates JSONB, -- {lat, lng} where they checked in
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for outlet_visits
CREATE INDEX IF NOT EXISTS idx_outlet_visits_outlet_id ON outlet_visits(outlet_id);
CREATE INDEX IF NOT EXISTS idx_outlet_visits_user_id ON outlet_visits(user_id);
CREATE INDEX IF NOT EXISTS idx_outlet_visits_route_stop_id ON outlet_visits(route_stop_id);
CREATE INDEX IF NOT EXISTS idx_outlet_visits_organization_id ON outlet_visits(organization_id);
CREATE INDEX IF NOT EXISTS idx_outlet_visits_check_in_time ON outlet_visits(check_in_time);

-- Enable RLS on outlet_visits
ALTER TABLE outlet_visits ENABLE ROW LEVEL SECURITY;

-- RLS policy for outlet_visits
CREATE POLICY "Users can view outlet visits in their org" ON outlet_visits
FOR ALL TO authenticated
USING (
  organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  )
);

-- Grant permissions
GRANT ALL ON outlet_visits TO authenticated;

-- Add foreign key constraints for outlet_visits if tables exist
DO $$
BEGIN
    -- Reference to outlets
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'outlets') THEN
        BEGIN
            ALTER TABLE outlet_visits ADD CONSTRAINT fk_outlet_visits_outlet_id
            FOREIGN KEY (outlet_id) REFERENCES outlets(id) ON DELETE CASCADE;
        EXCEPTION WHEN duplicate_object THEN
            NULL;
        END;
    END IF;
    
    -- Reference to profiles  
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') THEN
        BEGIN
            ALTER TABLE outlet_visits ADD CONSTRAINT fk_outlet_visits_user_id
            FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
        EXCEPTION WHEN duplicate_object THEN
            NULL;
        END;
    END IF;
    
    -- Reference to organizations
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'organizations') THEN
        BEGIN
            ALTER TABLE outlet_visits ADD CONSTRAINT fk_outlet_visits_organization_id
            FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;
        EXCEPTION WHEN duplicate_object THEN
            NULL;
        END;
    END IF;
    
    -- Reference to route_stops
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'route_stops') THEN
        BEGIN
            ALTER TABLE outlet_visits ADD CONSTRAINT fk_outlet_visits_route_stop_id
            FOREIGN KEY (route_stop_id) REFERENCES route_stops(id) ON DELETE SET NULL;
        EXCEPTION WHEN duplicate_object THEN
            NULL;
        END;
    END IF;
    
    -- Reference to form_responses
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'form_responses') THEN
        BEGIN
            ALTER TABLE outlet_visits ADD CONSTRAINT fk_outlet_visits_form_response_id
            FOREIGN KEY (form_response_id) REFERENCES form_responses(id) ON DELETE SET NULL;
        EXCEPTION WHEN duplicate_object THEN
            NULL;
        END;
    END IF;
END $$;

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_outlet_visits_updated_at 
BEFORE UPDATE ON outlet_visits
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON COLUMN outlets.required_form_id IS 'Form that must be completed when visiting this outlet';
COMMENT ON TABLE outlet_visits IS 'Track visits to outlets and form completion status';
COMMENT ON COLUMN outlet_visits.route_stop_id IS 'Reference to planned route stop if this was part of a route';
COMMENT ON COLUMN outlet_visits.form_response_id IS 'Reference to completed form if form was filled';