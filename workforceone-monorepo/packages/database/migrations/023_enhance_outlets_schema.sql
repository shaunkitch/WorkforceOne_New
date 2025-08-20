-- Migration 023: Enhance Outlets Schema
-- Add auto-generated identifier, province, and contact details to outlets table

-- Add new columns to outlets table
ALTER TABLE outlets 
ADD COLUMN IF NOT EXISTS outlet_code VARCHAR(20) UNIQUE,
ADD COLUMN IF NOT EXISTS province VARCHAR(100),
ADD COLUMN IF NOT EXISTS phone VARCHAR(20),
ADD COLUMN IF NOT EXISTS email VARCHAR(255),
ADD COLUMN IF NOT EXISTS manager_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS manager_phone VARCHAR(20),
ADD COLUMN IF NOT EXISTS manager_email VARCHAR(255);

-- Create a function to generate outlet codes
CREATE OR REPLACE FUNCTION generate_outlet_code()
RETURNS TEXT AS $$
DECLARE
    new_code TEXT;
    counter INTEGER := 1;
BEGIN
    LOOP
        -- Generate code in format OL-YYYY-001, OL-YYYY-002, etc.
        new_code := 'OL-' || EXTRACT(YEAR FROM CURRENT_DATE) || '-' || LPAD(counter::TEXT, 3, '0');
        
        -- Check if this code already exists
        IF NOT EXISTS (SELECT 1 FROM outlets WHERE outlet_code = new_code) THEN
            RETURN new_code;
        END IF;
        
        counter := counter + 1;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Update existing outlets that don't have outlet codes
UPDATE outlets 
SET outlet_code = generate_outlet_code() 
WHERE outlet_code IS NULL;

-- Create a trigger to auto-generate outlet codes for new outlets
CREATE OR REPLACE FUNCTION set_outlet_code()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.outlet_code IS NULL THEN
        NEW.outlet_code := generate_outlet_code();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically set outlet_code before insert
DROP TRIGGER IF EXISTS trigger_set_outlet_code ON outlets;
CREATE TRIGGER trigger_set_outlet_code
    BEFORE INSERT ON outlets
    FOR EACH ROW
    EXECUTE FUNCTION set_outlet_code();

-- Add comments for documentation
COMMENT ON COLUMN outlets.outlet_code IS 'Auto-generated unique identifier for the outlet (format: OL-YYYY-NNN)';
COMMENT ON COLUMN outlets.province IS 'Province or state where the outlet is located';
COMMENT ON COLUMN outlets.phone IS 'Primary phone number for the outlet';
COMMENT ON COLUMN outlets.email IS 'Primary email contact for the outlet';
COMMENT ON COLUMN outlets.manager_name IS 'Name of the outlet manager';
COMMENT ON COLUMN outlets.manager_phone IS 'Phone number of the outlet manager';
COMMENT ON COLUMN outlets.manager_email IS 'Email address of the outlet manager';