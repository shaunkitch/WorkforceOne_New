-- Test data for forms system
-- Insert some sample forms and assignments for testing

-- First, get some existing data to work with
DO $$
DECLARE
    org_id UUID;
    user_id UUID;
    admin_id UUID;
    form_id1 UUID;
    form_id2 UUID;
BEGIN
    -- Get first organization ID
    SELECT id INTO org_id FROM organizations LIMIT 1;
    
    -- Get a regular user (employee)
    SELECT id INTO user_id FROM profiles 
    WHERE role = 'employee' AND organization_id = org_id 
    LIMIT 1;
    
    -- Get an admin/manager to be the assigner
    SELECT id INTO admin_id FROM profiles 
    WHERE role IN ('admin', 'manager') AND organization_id = org_id 
    LIMIT 1;
    
    -- If no admin, use any user
    IF admin_id IS NULL THEN
        SELECT id INTO admin_id FROM profiles 
        WHERE organization_id = org_id 
        LIMIT 1;
    END IF;
    
    -- Only proceed if we have the required data
    IF org_id IS NOT NULL AND user_id IS NOT NULL AND admin_id IS NOT NULL THEN
        
        -- Insert sample forms
        INSERT INTO forms (id, organization_id, title, description, fields, created_by, is_active)
        VALUES 
            (uuid_generate_v4(), org_id, 'Employee Onboarding Form', 'Complete this form for new employee setup', 
             '[{"type":"text","label":"Full Name","required":true},{"type":"email","label":"Email","required":true},{"type":"text","label":"Department","required":false}]', 
             admin_id, true),
            (uuid_generate_v4(), org_id, 'Weekly Check-in', 'Weekly progress and feedback form',
             '[{"type":"textarea","label":"What did you accomplish this week?","required":true},{"type":"select","label":"How are you feeling?","options":["Great","Good","Okay","Not great"],"required":true}]',
             admin_id, true)
        RETURNING id;
        
        -- Get the form IDs that were just created
        SELECT id INTO form_id1 FROM forms WHERE title = 'Employee Onboarding Form' AND organization_id = org_id;
        SELECT id INTO form_id2 FROM forms WHERE title = 'Weekly Check-in' AND organization_id = org_id;
        
        -- Insert form assignments
        INSERT INTO form_assignments (form_id, user_id, organization_id, assigned_by, due_date, status)
        VALUES 
            (form_id1, user_id, org_id, admin_id, NOW() + INTERVAL '7 days', 'assigned'),
            (form_id2, user_id, org_id, admin_id, NOW() + INTERVAL '3 days', 'assigned');
            
        RAISE NOTICE 'Test forms and assignments created successfully for user: %', user_id;
        
    ELSE
        RAISE NOTICE 'Could not create test data - missing required records (org: %, user: %, admin: %)', org_id, user_id, admin_id;
    END IF;
    
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error creating test data: %', SQLERRM;
END $$;