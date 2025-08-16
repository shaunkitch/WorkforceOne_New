-- Migration 039: Add join codes to organizations table
-- This migration adds join_code column and populates existing organizations with unique codes

-- Step 1: Add join_code column to organizations table
ALTER TABLE organizations 
ADD COLUMN join_code VARCHAR(6) UNIQUE;

-- Step 2: Create function to generate unique join codes
CREATE OR REPLACE FUNCTION generate_unique_join_code()
RETURNS VARCHAR(6) AS $$
DECLARE
    new_code VARCHAR(6);
    code_exists BOOLEAN;
BEGIN
    LOOP
        -- Generate a random 6-character alphanumeric code
        new_code := UPPER(
            SUBSTR(
                MD5(RANDOM()::TEXT || CLOCK_TIMESTAMP()::TEXT),
                1, 6
            )
        );
        
        -- Ensure it contains at least one letter and one number for readability
        -- If not, regenerate (this is a simple check, could be enhanced)
        IF new_code ~ '[A-Z]' AND new_code ~ '[0-9]' THEN
            -- Check if code already exists
            SELECT EXISTS(
                SELECT 1 FROM organizations WHERE join_code = new_code
            ) INTO code_exists;
            
            -- If code doesn't exist, we can use it
            IF NOT code_exists THEN
                RETURN new_code;
            END IF;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Step 3: Populate existing organizations with unique join codes
DO $$
DECLARE
    org_record RECORD;
    new_join_code VARCHAR(6);
BEGIN
    -- Loop through all organizations that don't have a join_code
    FOR org_record IN 
        SELECT id, name FROM organizations WHERE join_code IS NULL
    LOOP
        -- Generate a unique join code
        new_join_code := generate_unique_join_code();
        
        -- Update the organization with the new join code
        UPDATE organizations 
        SET join_code = new_join_code,
            updated_at = NOW()
        WHERE id = org_record.id;
        
        -- Log the update (optional)
        RAISE NOTICE 'Generated join code % for organization: %', new_join_code, org_record.name;
    END LOOP;
END $$;

-- Step 4: Make join_code NOT NULL (after all existing records have codes)
ALTER TABLE organizations 
ALTER COLUMN join_code SET NOT NULL;

-- Step 5: Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_organizations_join_code ON organizations(join_code);

-- Step 6: Add RLS policy for join_code access
-- Allow authenticated users to read join_code for their organization
CREATE POLICY "Users can read their organization join_code" ON organizations
    FOR SELECT USING (
        auth.uid() IN (
            SELECT p.id 
            FROM profiles p 
            WHERE p.organization_id = organizations.id
        )
    );

-- Step 7: Create trigger to auto-generate join_code for new organizations
CREATE OR REPLACE FUNCTION auto_generate_join_code()
RETURNS TRIGGER AS $$
BEGIN
    -- If no join_code is provided, generate one
    IF NEW.join_code IS NULL THEN
        NEW.join_code := generate_unique_join_code();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_generate_join_code
    BEFORE INSERT ON organizations
    FOR EACH ROW
    EXECUTE FUNCTION auto_generate_join_code();

-- Step 8: Add comment for documentation
COMMENT ON COLUMN organizations.join_code IS 'Unique 6-character code for new members to join the organization';

-- Verification query (commented out, can be run manually)
-- SELECT id, name, join_code, created_at, updated_at 
-- FROM organizations 
-- ORDER BY created_at;