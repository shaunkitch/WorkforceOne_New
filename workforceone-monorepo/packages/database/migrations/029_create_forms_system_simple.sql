-- Migration 029: Create forms system (simplified version)
-- This creates the basic forms infrastructure without complex constraints

-- Create forms table
CREATE TABLE IF NOT EXISTS forms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    fields JSONB DEFAULT '[]',
    created_by UUID,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create form_assignments table
CREATE TABLE IF NOT EXISTS form_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    form_id UUID,
    user_id UUID,
    organization_id UUID,
    assigned_by UUID,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    due_date TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) DEFAULT 'assigned',
    completed_at TIMESTAMP WITH TIME ZONE,
    response_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create form_responses table
CREATE TABLE IF NOT EXISTS form_responses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    form_id UUID,
    assignment_id UUID,
    user_id UUID,
    organization_id UUID,
    responses JSONB DEFAULT '{}',
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_forms_organization_id ON forms(organization_id);
CREATE INDEX IF NOT EXISTS idx_form_assignments_user_id ON form_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_form_assignments_organization_id ON form_assignments(organization_id);
CREATE INDEX IF NOT EXISTS idx_form_responses_user_id ON form_responses(user_id);

-- Enable RLS but without complex policies initially
ALTER TABLE forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_responses ENABLE ROW LEVEL SECURITY;

-- Basic permissive policies for testing
CREATE POLICY "Allow all for authenticated users" ON forms FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all for authenticated users" ON form_assignments FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow all for authenticated users" ON form_responses FOR ALL TO authenticated USING (true);

-- Grant permissions
GRANT ALL ON forms TO authenticated;
GRANT ALL ON form_assignments TO authenticated;
GRANT ALL ON form_responses TO authenticated;

-- Comments
COMMENT ON TABLE forms IS 'Forms that can be assigned to users (simplified version)';
COMMENT ON TABLE form_assignments IS 'Form assignments to users (simplified version)';
COMMENT ON TABLE form_responses IS 'User responses to forms (simplified version)';