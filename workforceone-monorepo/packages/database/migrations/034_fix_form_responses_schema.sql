-- Migration 034: Fix form_responses table schema
-- Add missing user_id column to form_responses table

-- Add user_id column if it doesn't exist
ALTER TABLE form_responses ADD COLUMN IF NOT EXISTS user_id UUID;

-- Add index for the new column
CREATE INDEX IF NOT EXISTS idx_form_responses_user_id ON form_responses(user_id);

-- Add foreign key constraint if profiles table exists
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN
        -- Check if constraint already exists before adding it
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

-- Update RLS policy to include user access
DO $$
BEGIN
    -- Drop existing policy if it exists and recreate with user_id access
    BEGIN
        DROP POLICY IF EXISTS "Allow all operations on form_responses" ON form_responses;
    EXCEPTION WHEN OTHERS THEN
        NULL;
    END;
    
    -- Create new policy that allows users to access their own responses
    BEGIN
        CREATE POLICY "Users can manage their own form responses" ON form_responses
        FOR ALL TO authenticated
        USING (
          user_id = auth.uid() OR 
          organization_id IN (
            SELECT organization_id FROM profiles WHERE id = auth.uid()
          )
        );
    EXCEPTION WHEN duplicate_object THEN
        NULL; -- Policy already exists
    END;
END $$;

-- Add comment
COMMENT ON COLUMN form_responses.user_id IS 'User who submitted the form response';