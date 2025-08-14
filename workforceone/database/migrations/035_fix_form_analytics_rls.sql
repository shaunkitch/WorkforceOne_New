-- Migration 035: Fix form_analytics RLS policy
-- This fixes the RLS error when creating form responses

-- First check if form_analytics table exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'form_analytics') THEN
        
        -- Drop existing restrictive policies
        BEGIN
            DROP POLICY IF EXISTS "Users can view analytics for their organization" ON form_analytics;
            DROP POLICY IF EXISTS "Users can insert analytics for their organization" ON form_analytics;
            DROP POLICY IF EXISTS "Users can update analytics for their organization" ON form_analytics;
            DROP POLICY IF EXISTS "Only system can manage form_analytics" ON form_analytics;
        EXCEPTION WHEN OTHERS THEN
            NULL; -- Ignore if policies don't exist
        END;
        
        -- Create a more permissive policy that allows triggers to work
        BEGIN
            CREATE POLICY "Allow all operations on form_analytics" ON form_analytics
            FOR ALL 
            TO authenticated
            USING (
                -- Users can access analytics for their organization
                organization_id IN (
                    SELECT organization_id FROM profiles WHERE id = auth.uid()
                )
            )
            WITH CHECK (
                -- Allow inserts/updates for user's organization
                organization_id IN (
                    SELECT organization_id FROM profiles WHERE id = auth.uid()
                )
            );
        EXCEPTION WHEN duplicate_object THEN
            NULL; -- Policy already exists
        END;
        
        -- Also create a policy for service role to handle triggers
        BEGIN
            CREATE POLICY "Service role bypass for form_analytics" ON form_analytics
            FOR ALL
            TO service_role
            USING (true)
            WITH CHECK (true);
        EXCEPTION WHEN duplicate_object THEN
            NULL; -- Policy already exists
        END;
        
        -- Grant necessary permissions
        GRANT ALL ON form_analytics TO authenticated;
        GRANT ALL ON form_analytics TO service_role;
        
    END IF;
END $$;

-- If the table has triggers that update analytics, ensure they run with proper permissions
DO $$
BEGIN
    -- Check if there's a trigger function that updates form_analytics
    IF EXISTS (
        SELECT 1 FROM pg_proc 
        WHERE proname LIKE '%form_analytics%' OR proname LIKE '%update_analytics%'
    ) THEN
        -- Set the function to run with definer privileges (superuser)
        -- This allows the trigger to bypass RLS
        BEGIN
            ALTER FUNCTION update_form_analytics() SECURITY DEFINER;
        EXCEPTION WHEN OTHERS THEN
            NULL; -- Function might not exist or have different name
        END;
        
        BEGIN
            ALTER FUNCTION calculate_form_analytics() SECURITY DEFINER;
        EXCEPTION WHEN OTHERS THEN
            NULL; -- Function might not exist or have different name
        END;
    END IF;
END $$;

-- Add comment
COMMENT ON TABLE form_analytics IS 'Analytics data for forms, updated automatically via triggers';