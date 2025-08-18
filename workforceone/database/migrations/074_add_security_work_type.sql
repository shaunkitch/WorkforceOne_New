-- Migration: Add security work type to work_type enum
-- Description: Add 'security' as a valid work type for security guards

-- First, check if the enum value already exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'security' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'work_type')) THEN
        ALTER TYPE work_type ADD VALUE 'security';
        RAISE NOTICE 'Added security work type enum value';
    ELSE
        RAISE NOTICE 'Security work type already exists';
    END IF;
END$$;