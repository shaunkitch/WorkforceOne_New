-- Create attendance QR codes system
-- Migration: 085_attendance_qr_codes_system.sql

BEGIN;

-- Create organization_qr_codes table for QR code management
CREATE TABLE IF NOT EXISTS organization_qr_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    location_name TEXT NOT NULL,
    description TEXT,
    shift_type TEXT NOT NULL DEFAULT 'both' CHECK (shift_type IN ('check_in', 'check_out', 'both')),
    qr_code_data TEXT NOT NULL,
    qr_code_image TEXT, -- Base64 encoded QR code image
    expires_at TIMESTAMPTZ,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_organization_qr_codes_org_id ON organization_qr_codes(organization_id);
CREATE INDEX IF NOT EXISTS idx_organization_qr_codes_active ON organization_qr_codes(is_active);
CREATE INDEX IF NOT EXISTS idx_organization_qr_codes_expires ON organization_qr_codes(expires_at);

-- Add location and GPS tracking fields to attendance table if they don't exist
DO $$
BEGIN
    -- Add latitude column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'attendance' AND column_name = 'latitude') THEN
        ALTER TABLE attendance ADD COLUMN latitude NUMERIC(10, 8);
    END IF;
    
    -- Add longitude column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'attendance' AND column_name = 'longitude') THEN
        ALTER TABLE attendance ADD COLUMN longitude NUMERIC(11, 8);
    END IF;
    
    -- Add location_accuracy column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'attendance' AND column_name = 'location_accuracy') THEN
        ALTER TABLE attendance ADD COLUMN location_accuracy NUMERIC;
    END IF;
    
    -- Add location_timestamp column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'attendance' AND column_name = 'location_timestamp') THEN
        ALTER TABLE attendance ADD COLUMN location_timestamp TIMESTAMPTZ;
    END IF;
    
    -- Add qr_code_id column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'attendance' AND column_name = 'qr_code_id') THEN
        ALTER TABLE attendance ADD COLUMN qr_code_id UUID REFERENCES organization_qr_codes(id);
    END IF;
END $$;

-- Create indexes for attendance location data
CREATE INDEX IF NOT EXISTS idx_attendance_location ON attendance(latitude, longitude) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_attendance_qr_code ON attendance(qr_code_id);

-- Enable RLS
ALTER TABLE organization_qr_codes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for organization_qr_codes
CREATE POLICY "Users can view QR codes in their organization" ON organization_qr_codes
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.organization_id = organization_qr_codes.organization_id
        )
    );

CREATE POLICY "Admins and managers can manage QR codes" ON organization_qr_codes
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.organization_id = organization_qr_codes.organization_id
            AND profiles.role IN ('admin', 'manager')
        )
    );

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_organization_qr_codes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
CREATE TRIGGER update_organization_qr_codes_updated_at
    BEFORE UPDATE ON organization_qr_codes
    FOR EACH ROW
    EXECUTE FUNCTION update_organization_qr_codes_updated_at();

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON organization_qr_codes TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Create function to validate QR code data
CREATE OR REPLACE FUNCTION validate_qr_code_data(qr_data TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    qr_json JSONB;
BEGIN
    -- Try to parse JSON
    BEGIN
        qr_json := qr_data::JSONB;
    EXCEPTION WHEN OTHERS THEN
        RETURN FALSE;
    END;
    
    -- Check required fields
    IF NOT (qr_json ? 'organizationId' AND qr_json ? 'locationName' AND qr_json ? 'shiftType' AND qr_json ? 'id') THEN
        RETURN FALSE;
    END IF;
    
    -- Check shift_type is valid
    IF NOT (qr_json->>'shiftType' IN ('check_in', 'check_out', 'both')) THEN
        RETURN FALSE;
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION validate_qr_code_data(TEXT) TO authenticated;

COMMIT;