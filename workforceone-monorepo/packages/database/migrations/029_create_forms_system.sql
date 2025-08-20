-- Migration 029: Create forms and form assignments system
-- This creates the missing forms infrastructure for mobile app

-- Create forms table
CREATE TABLE IF NOT EXISTS forms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    fields JSONB NOT NULL DEFAULT '[]', -- Array of form field definitions
    created_by UUID NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create form_assignments table
CREATE TABLE IF NOT EXISTS form_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    form_id UUID NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    assigned_by UUID NOT NULL,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    due_date TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) DEFAULT 'assigned' CHECK (status IN ('assigned', 'completed', 'overdue')),
    completed_at TIMESTAMP WITH TIME ZONE,
    response_id UUID, -- Reference to form response if completed
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create form_responses table for storing completed form data
CREATE TABLE IF NOT EXISTS form_responses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    form_id UUID NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
    assignment_id UUID REFERENCES form_assignments(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    responses JSONB NOT NULL DEFAULT '{}', -- Form field responses
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_forms_organization_id ON forms(organization_id);
CREATE INDEX IF NOT EXISTS idx_forms_created_by ON forms(created_by);
CREATE INDEX IF NOT EXISTS idx_form_assignments_form_id ON form_assignments(form_id);
CREATE INDEX IF NOT EXISTS idx_form_assignments_user_id ON form_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_form_assignments_organization_id ON form_assignments(organization_id);
CREATE INDEX IF NOT EXISTS idx_form_assignments_status ON form_assignments(status);
CREATE INDEX IF NOT EXISTS idx_form_responses_form_id ON form_responses(form_id);
CREATE INDEX IF NOT EXISTS idx_form_responses_assignment_id ON form_responses(assignment_id);

-- Enable RLS
ALTER TABLE forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_responses ENABLE ROW LEVEL SECURITY;

-- RLS Policies for forms
CREATE POLICY "Users can view forms in their organization" ON forms
FOR SELECT TO authenticated
USING (
  organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  )
);

CREATE POLICY "Admins and managers can insert forms" ON forms
FOR INSERT TO authenticated
WITH CHECK (
  organization_id IN (
    SELECT organization_id FROM profiles 
    WHERE id = auth.uid() AND role IN ('admin', 'manager')
  )
);

CREATE POLICY "Admins and managers can update forms" ON forms
FOR UPDATE TO authenticated
USING (
  organization_id IN (
    SELECT organization_id FROM profiles 
    WHERE id = auth.uid() AND role IN ('admin', 'manager')
  )
);

CREATE POLICY "Admins can delete forms" ON forms
FOR DELETE TO authenticated
USING (
  organization_id IN (
    SELECT organization_id FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- RLS Policies for form_assignments (simplified)
CREATE POLICY "Users can view form assignments in their org" ON form_assignments
FOR SELECT TO authenticated
USING (
  organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  )
);

CREATE POLICY "Users can insert form assignments in their org" ON form_assignments
FOR INSERT TO authenticated
WITH CHECK (
  organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  )
);

CREATE POLICY "Users can update form assignments in their org" ON form_assignments
FOR UPDATE TO authenticated
USING (
  organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  )
);

-- RLS Policies for form_responses (simplified)
CREATE POLICY "Users can view form responses in their org" ON form_responses
FOR SELECT TO authenticated
USING (
  organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  )
);

CREATE POLICY "Users can create form responses in their org" ON form_responses
FOR INSERT TO authenticated
WITH CHECK (
  organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  )
);

-- Add triggers for updated_at
CREATE TRIGGER update_forms_updated_at 
BEFORE UPDATE ON forms
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_form_assignments_updated_at 
BEFORE UPDATE ON form_assignments
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_form_responses_updated_at 
BEFORE UPDATE ON form_responses
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON forms TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON form_assignments TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON form_responses TO authenticated;

-- Add foreign key constraints after tables are created (skip if profiles doesn't exist)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN
        -- Check if constraints already exist before adding them
        IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_forms_created_by') THEN
            ALTER TABLE forms ADD CONSTRAINT fk_forms_created_by 
            FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE CASCADE;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_form_assignments_user_id') THEN
            ALTER TABLE form_assignments ADD CONSTRAINT fk_form_assignments_user_id 
            FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_form_assignments_assigned_by') THEN
            ALTER TABLE form_assignments ADD CONSTRAINT fk_form_assignments_assigned_by 
            FOREIGN KEY (assigned_by) REFERENCES profiles(id) ON DELETE CASCADE;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_form_responses_user_id') THEN
            ALTER TABLE form_responses ADD CONSTRAINT fk_form_responses_user_id 
            FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;
        END IF;
    END IF;
EXCEPTION 
    WHEN OTHERS THEN
        -- Ignore constraint errors and continue
        NULL;
END $$;

-- Add comments
COMMENT ON TABLE forms IS 'Forms that can be assigned to users';
COMMENT ON TABLE form_assignments IS 'Assignment of forms to specific users';
COMMENT ON TABLE form_responses IS 'User responses to completed forms';