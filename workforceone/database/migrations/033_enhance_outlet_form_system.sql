-- Migration 033: Enhance outlet form system with toggles and group assignments
-- Add form required toggle and group-level form assignments

-- Add form_required toggle to outlets table
ALTER TABLE outlets ADD COLUMN IF NOT EXISTS form_required BOOLEAN DEFAULT false;

-- Create outlet group forms table for group-level form assignments
CREATE TABLE IF NOT EXISTS outlet_group_forms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL,
    group_name VARCHAR(100) NOT NULL,
    form_id UUID NOT NULL,
    created_by UUID NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure one form per group per organization
    UNIQUE(organization_id, group_name, form_id)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_outlets_form_required ON outlets(form_required);
CREATE INDEX IF NOT EXISTS idx_outlet_group_forms_org_group ON outlet_group_forms(organization_id, group_name);
CREATE INDEX IF NOT EXISTS idx_outlet_group_forms_form_id ON outlet_group_forms(form_id);
CREATE INDEX IF NOT EXISTS idx_outlet_group_forms_created_by ON outlet_group_forms(created_by);

-- Enable RLS on outlet_group_forms
ALTER TABLE outlet_group_forms ENABLE ROW LEVEL SECURITY;

-- RLS policy for outlet_group_forms
CREATE POLICY "Users can manage group forms in their org" ON outlet_group_forms
FOR ALL TO authenticated
USING (
  organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  )
);

-- Grant permissions
GRANT ALL ON outlet_group_forms TO authenticated;

-- Add foreign key constraints with error handling
DO $$
BEGIN
    -- Reference to organizations
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'organizations') THEN
        BEGIN
            ALTER TABLE outlet_group_forms ADD CONSTRAINT fk_outlet_group_forms_organization_id
            FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;
        EXCEPTION WHEN duplicate_object THEN
            NULL;
        END;
    END IF;
    
    -- Reference to forms
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'forms') THEN
        BEGIN
            ALTER TABLE outlet_group_forms ADD CONSTRAINT fk_outlet_group_forms_form_id
            FOREIGN KEY (form_id) REFERENCES forms(id) ON DELETE CASCADE;
        EXCEPTION WHEN duplicate_object THEN
            NULL;
        END;
    END IF;
    
    -- Reference to profiles (created_by)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'profiles') THEN
        BEGIN
            ALTER TABLE outlet_group_forms ADD CONSTRAINT fk_outlet_group_forms_created_by
            FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE CASCADE;
        EXCEPTION WHEN duplicate_object THEN
            NULL;
        END;
    END IF;
END $$;

-- Add trigger for updated_at
CREATE TRIGGER update_outlet_group_forms_updated_at 
BEFORE UPDATE ON outlet_group_forms
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON COLUMN outlets.form_required IS 'Toggle switch - whether this outlet requires form completion';
COMMENT ON TABLE outlet_group_forms IS 'Form assignments at the group level - applies to all outlets in a group';
COMMENT ON COLUMN outlet_group_forms.group_name IS 'Name of the outlet group this form assignment applies to';
COMMENT ON COLUMN outlet_group_forms.form_id IS 'Form that should be completed for outlets in this group';
COMMENT ON COLUMN outlet_group_forms.is_active IS 'Whether this group form assignment is currently active';

-- Create a view to easily get outlet form requirements
CREATE OR REPLACE VIEW outlet_form_requirements AS
SELECT 
    o.id as outlet_id,
    o.name as outlet_name,
    o.group_name,
    o.form_required,
    o.required_form_id as individual_form_id,
    o.organization_id,
    
    -- Individual form details
    f1.title as individual_form_title,
    f1.description as individual_form_description,
    
    -- Group form details
    ogf.form_id as group_form_id,
    f2.title as group_form_title,
    f2.description as group_form_description,
    
    -- Determine which form should be used (individual takes precedence)
    CASE 
        WHEN o.form_required = false THEN null
        WHEN o.required_form_id IS NOT NULL THEN o.required_form_id
        WHEN ogf.form_id IS NOT NULL AND ogf.is_active = true THEN ogf.form_id
        ELSE null
    END as effective_form_id,
    
    CASE 
        WHEN o.form_required = false THEN null
        WHEN o.required_form_id IS NOT NULL THEN f1.title
        WHEN ogf.form_id IS NOT NULL AND ogf.is_active = true THEN f2.title
        ELSE null
    END as effective_form_title

FROM outlets o
    LEFT JOIN forms f1 ON o.required_form_id = f1.id
    LEFT JOIN outlet_group_forms ogf ON o.group_name = ogf.group_name 
        AND o.organization_id = ogf.organization_id 
        AND ogf.is_active = true
    LEFT JOIN forms f2 ON ogf.form_id = f2.id;

-- Grant access to the view
GRANT SELECT ON outlet_form_requirements TO authenticated;

-- Enable RLS on the view (inherits from base tables)
ALTER VIEW outlet_form_requirements SET (security_invoker = on);