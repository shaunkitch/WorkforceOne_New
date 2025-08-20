-- Simple Migration: Add join codes to organizations table
-- This migration safely adds join_code column and populates existing organizations

-- Step 1: Add join_code column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'organizations' AND column_name = 'join_code'
    ) THEN
        ALTER TABLE organizations ADD COLUMN join_code VARCHAR(6);
    END IF;
END $$;

-- Step 2: Create function to generate unique join codes
CREATE OR REPLACE FUNCTION generate_unique_join_code()
RETURNS VARCHAR(6) AS $$
DECLARE
    new_code VARCHAR(6);
    code_exists BOOLEAN;
    attempt_count INTEGER := 0;
    max_attempts INTEGER := 100;
BEGIN
    LOOP
        attempt_count := attempt_count + 1;
        
        -- Generate a random 6-character alphanumeric code
        new_code := UPPER(
            SUBSTR(
                MD5(RANDOM()::TEXT || CLOCK_TIMESTAMP()::TEXT || attempt_count::TEXT),
                1, 6
            )
        );
        
        -- Check if code already exists
        SELECT EXISTS(
            SELECT 1 FROM organizations WHERE join_code = new_code
        ) INTO code_exists;
        
        -- If code doesn't exist, we can use it
        IF NOT code_exists THEN
            RETURN new_code;
        END IF;
        
        -- Safety exit after max attempts
        IF attempt_count >= max_attempts THEN
            RAISE EXCEPTION 'Could not generate unique join code after % attempts', max_attempts;
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
        SELECT id, name FROM organizations WHERE join_code IS NULL OR join_code = ''
    LOOP
        -- Generate a unique join code
        new_join_code := generate_unique_join_code();
        
        -- Update the organization with the new join code
        UPDATE organizations 
        SET join_code = new_join_code,
            updated_at = COALESCE(updated_at, NOW())
        WHERE id = org_record.id;
        
        -- Log the update
        RAISE NOTICE 'Generated join code % for organization: %', new_join_code, org_record.name;
    END LOOP;
END $$;

-- Step 4: Add constraints after population
DO $$ 
BEGIN
    -- Add unique constraint if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'organizations' 
        AND constraint_name = 'organizations_join_code_key'
    ) THEN
        ALTER TABLE organizations ADD CONSTRAINT organizations_join_code_key UNIQUE (join_code);
    END IF;
    
    -- Make join_code NOT NULL if all records have codes
    IF NOT EXISTS (
        SELECT 1 FROM organizations WHERE join_code IS NULL OR join_code = ''
    ) THEN
        ALTER TABLE organizations ALTER COLUMN join_code SET NOT NULL;
    END IF;
END $$;

-- Step 5: Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_organizations_join_code ON organizations(join_code);

-- Step 6: Create trigger to auto-generate join_code for new organizations
CREATE OR REPLACE FUNCTION auto_generate_join_code()
RETURNS TRIGGER AS $$
BEGIN
    -- If no join_code is provided, generate one
    IF NEW.join_code IS NULL OR NEW.join_code = '' THEN
        NEW.join_code := generate_unique_join_code();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if it exists and recreate
DROP TRIGGER IF EXISTS trigger_auto_generate_join_code ON organizations;
CREATE TRIGGER trigger_auto_generate_join_code
    BEFORE INSERT ON organizations
    FOR EACH ROW
    EXECUTE FUNCTION auto_generate_join_code();

-- Step 7: Verification
DO $$
DECLARE
    total_orgs INTEGER;
    orgs_with_codes INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_orgs FROM organizations;
    SELECT COUNT(*) INTO orgs_with_codes FROM organizations WHERE join_code IS NOT NULL AND join_code != '';
    
    RAISE NOTICE 'Migration completed: % total organizations, % have join codes', total_orgs, orgs_with_codes;
END $$;