-- Migration 029b: Add indexes and policies to forms system
-- Run this after 029_create_forms_minimal.sql

-- Add indexes (only if tables exist and have the columns)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'forms' AND column_name = 'organization_id') THEN
        CREATE INDEX IF NOT EXISTS idx_forms_organization_id ON forms(organization_id);
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'form_assignments' AND column_name = 'user_id') THEN
        CREATE INDEX IF NOT EXISTS idx_form_assignments_user_id ON form_assignments(user_id);
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'form_assignments' AND column_name = 'organization_id') THEN
        CREATE INDEX IF NOT EXISTS idx_form_assignments_organization_id ON form_assignments(organization_id);
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'form_responses' AND column_name = 'user_id') THEN
        CREATE INDEX IF NOT EXISTS idx_form_responses_user_id ON form_responses(user_id);
    END IF;
END $$;

-- Enable RLS on all tables
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'forms') THEN
        ALTER TABLE forms ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'form_assignments') THEN
        ALTER TABLE form_assignments ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'form_responses') THEN
        ALTER TABLE form_responses ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- Add basic permissive policies (can be made more restrictive later)
DO $$
BEGIN
    -- Forms policies
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'forms') THEN
        BEGIN
            CREATE POLICY "Allow all operations on forms" ON forms FOR ALL TO authenticated USING (true);
        EXCEPTION WHEN duplicate_object THEN
            NULL; -- Policy already exists
        END;
    END IF;
    
    -- Form assignments policies
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'form_assignments') THEN
        BEGIN
            CREATE POLICY "Allow all operations on form_assignments" ON form_assignments FOR ALL TO authenticated USING (true);
        EXCEPTION WHEN duplicate_object THEN
            NULL; -- Policy already exists
        END;
    END IF;
    
    -- Form responses policies
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'form_responses') THEN
        BEGIN
            CREATE POLICY "Allow all operations on form_responses" ON form_responses FOR ALL TO authenticated USING (true);
        EXCEPTION WHEN duplicate_object THEN
            NULL; -- Policy already exists
        END;
    END IF;
END $$;

-- Grant permissions
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'forms') THEN
        GRANT ALL ON forms TO authenticated;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'form_assignments') THEN
        GRANT ALL ON form_assignments TO authenticated;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'form_responses') THEN
        GRANT ALL ON form_responses TO authenticated;
    END IF;
END $$;