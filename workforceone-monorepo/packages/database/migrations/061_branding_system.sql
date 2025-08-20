-- =============================================
-- BRANDING SYSTEM MIGRATION
-- Adds dynamic color scheme support for organizations
-- =============================================

-- Create organization branding table
CREATE TABLE IF NOT EXISTS organization_branding (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Primary brand colors
    primary_color VARCHAR(7) DEFAULT '#3b82f6', -- Main brand color
    secondary_color VARCHAR(7) DEFAULT '#1e40af', -- Secondary brand color
    accent_color VARCHAR(7) DEFAULT '#06b6d4', -- Accent color
    
    -- Background colors
    background_light VARCHAR(7) DEFAULT '#ffffff', -- Light background
    background_dark VARCHAR(7) DEFAULT '#f8fafc', -- Dark background
    surface_color VARCHAR(7) DEFAULT '#ffffff', -- Surface color
    
    -- Text colors
    text_primary VARCHAR(7) DEFAULT '#111827', -- Primary text
    text_secondary VARCHAR(7) DEFAULT '#6b7280', -- Secondary text
    text_muted VARCHAR(7) DEFAULT '#9ca3af', -- Muted text
    
    -- Status colors
    success_color VARCHAR(7) DEFAULT '#10b981', -- Success state
    warning_color VARCHAR(7) DEFAULT '#f59e0b', -- Warning state
    error_color VARCHAR(7) DEFAULT '#ef4444', -- Error state
    info_color VARCHAR(7) DEFAULT '#3b82f6', -- Info state
    
    -- Additional branding options
    logo_url TEXT, -- Company logo URL
    favicon_url TEXT, -- Custom favicon
    font_family VARCHAR(100) DEFAULT 'Inter', -- Custom font
    border_radius INTEGER DEFAULT 8, -- Global border radius
    
    -- Theme mode
    theme_mode VARCHAR(20) DEFAULT 'light' CHECK (theme_mode IN ('light', 'dark', 'auto')),
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES profiles(id),
    updated_by UUID REFERENCES profiles(id),
    
    -- Ensure one branding config per organization
    UNIQUE(organization_id)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_organization_branding_org_id ON organization_branding(organization_id);

-- Enable RLS
ALTER TABLE organization_branding ENABLE ROW LEVEL SECURITY;

-- RLS policies for organization branding
CREATE POLICY "organization_branding_org_isolation" ON organization_branding
    FOR ALL USING (
        auth.uid() IS NOT NULL AND 
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND organization_id = organization_branding.organization_id
        )
    );

-- Add updated_at trigger
CREATE TRIGGER update_organization_branding_updated_at 
    BEFORE UPDATE ON organization_branding
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create predefined color schemes for quick selection
CREATE TABLE IF NOT EXISTS branding_color_schemes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL,
    description TEXT,
    
    -- Color values
    primary_color VARCHAR(7) NOT NULL,
    secondary_color VARCHAR(7) NOT NULL,
    accent_color VARCHAR(7) NOT NULL,
    background_light VARCHAR(7) NOT NULL,
    background_dark VARCHAR(7) NOT NULL,
    surface_color VARCHAR(7) NOT NULL,
    text_primary VARCHAR(7) NOT NULL,
    text_secondary VARCHAR(7) NOT NULL,
    text_muted VARCHAR(7) NOT NULL,
    success_color VARCHAR(7) NOT NULL,
    warning_color VARCHAR(7) NOT NULL,
    error_color VARCHAR(7) NOT NULL,
    info_color VARCHAR(7) NOT NULL,
    
    -- Theme info
    category VARCHAR(30) DEFAULT 'general',
    is_default BOOLEAN DEFAULT false,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert predefined color schemes
INSERT INTO branding_color_schemes (name, description, category, is_default,
    primary_color, secondary_color, accent_color, background_light, background_dark, surface_color,
    text_primary, text_secondary, text_muted, success_color, warning_color, error_color, info_color)
VALUES 
    -- Blue Theme (Default)
    ('Blue Professional', 'Classic blue theme for professional businesses', 'professional', true,
     '#3b82f6', '#1e40af', '#06b6d4', '#ffffff', '#f8fafc', '#ffffff',
     '#111827', '#6b7280', '#9ca3af', '#10b981', '#f59e0b', '#ef4444', '#3b82f6'),
    
    -- Green Theme
    ('Green Nature', 'Fresh green theme for eco-friendly businesses', 'nature', false,
     '#059669', '#047857', '#10b981', '#ffffff', '#f0fdf4', '#ffffff',
     '#111827', '#6b7280', '#9ca3af', '#10b981', '#f59e0b', '#ef4444', '#059669'),
    
    -- Purple Theme
    ('Purple Creative', 'Creative purple theme for design agencies', 'creative', false,
     '#7c3aed', '#5b21b6', '#8b5cf6', '#ffffff', '#faf5ff', '#ffffff',
     '#111827', '#6b7280', '#9ca3af', '#10b981', '#f59e0b', '#ef4444', '#7c3aed'),
    
    -- Orange Theme
    ('Orange Energy', 'Energetic orange theme for dynamic companies', 'energy', false,
     '#ea580c', '#c2410c', '#f97316', '#ffffff', '#fff7ed', '#ffffff',
     '#111827', '#6b7280', '#9ca3af', '#10b981', '#f59e0b', '#ef4444', '#ea580c'),
    
    -- Red Theme
    ('Red Bold', 'Bold red theme for impactful businesses', 'bold', false,
     '#dc2626', '#b91c1c', '#ef4444', '#ffffff', '#fef2f2', '#ffffff',
     '#111827', '#6b7280', '#9ca3af', '#10b981', '#f59e0b', '#ef4444', '#dc2626'),
    
    -- Teal Theme
    ('Teal Modern', 'Modern teal theme for tech companies', 'modern', false,
     '#0d9488', '#0f766e', '#14b8a6', '#ffffff', '#f0fdfa', '#ffffff',
     '#111827', '#6b7280', '#9ca3af', '#10b981', '#f59e0b', '#ef4444', '#0d9488'),
    
    -- Indigo Theme
    ('Indigo Corporate', 'Corporate indigo theme for enterprise', 'corporate', false,
     '#4f46e5', '#3730a3', '#6366f1', '#ffffff', '#f8fafc', '#ffffff',
     '#111827', '#6b7280', '#9ca3af', '#10b981', '#f59e0b', '#ef4444', '#4f46e5'),
    
    -- Dark Theme
    ('Dark Professional', 'Dark theme for modern applications', 'dark', false,
     '#3b82f6', '#1e40af', '#06b6d4', '#111827', '#1f2937', '#374151',
     '#ffffff', '#d1d5db', '#9ca3af', '#10b981', '#f59e0b', '#ef4444', '#3b82f6');

-- Create function to apply color scheme to organization
CREATE OR REPLACE FUNCTION apply_color_scheme_to_organization(
    org_id UUID,
    scheme_id UUID,
    user_id UUID
) RETURNS VOID AS $$
DECLARE
    scheme_record RECORD;
BEGIN
    -- Get the color scheme
    SELECT * INTO scheme_record 
    FROM branding_color_schemes 
    WHERE id = scheme_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Color scheme not found';
    END IF;
    
    -- Insert or update organization branding
    INSERT INTO organization_branding (
        organization_id, primary_color, secondary_color, accent_color,
        background_light, background_dark, surface_color,
        text_primary, text_secondary, text_muted,
        success_color, warning_color, error_color, info_color,
        created_by, updated_by
    ) VALUES (
        org_id, scheme_record.primary_color, scheme_record.secondary_color, scheme_record.accent_color,
        scheme_record.background_light, scheme_record.background_dark, scheme_record.surface_color,
        scheme_record.text_primary, scheme_record.text_secondary, scheme_record.text_muted,
        scheme_record.success_color, scheme_record.warning_color, scheme_record.error_color, scheme_record.info_color,
        user_id, user_id
    )
    ON CONFLICT (organization_id) 
    DO UPDATE SET
        primary_color = scheme_record.primary_color,
        secondary_color = scheme_record.secondary_color,
        accent_color = scheme_record.accent_color,
        background_light = scheme_record.background_light,
        background_dark = scheme_record.background_dark,
        surface_color = scheme_record.surface_color,
        text_primary = scheme_record.text_primary,
        text_secondary = scheme_record.text_secondary,
        text_muted = scheme_record.text_muted,
        success_color = scheme_record.success_color,
        warning_color = scheme_record.warning_color,
        error_color = scheme_record.error_color,
        info_color = scheme_record.info_color,
        updated_by = user_id,
        updated_at = CURRENT_TIMESTAMP;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON organization_branding TO authenticated;
GRANT SELECT ON branding_color_schemes TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Create initial branding for existing organizations using default scheme
INSERT INTO organization_branding (organization_id, created_by, updated_by)
SELECT 
    o.id as organization_id,
    p.id as created_by,
    p.id as updated_by
FROM organizations o
JOIN profiles p ON p.organization_id = o.id AND p.role = 'admin'
WHERE NOT EXISTS (
    SELECT 1 FROM organization_branding ob 
    WHERE ob.organization_id = o.id
)
GROUP BY o.id, p.id;

RAISE NOTICE '✅ Branding system migration completed successfully!';
RAISE NOTICE '🎨 Created organization branding table with color customization';
RAISE NOTICE '🎯 Added 8 predefined color schemes for quick selection';
RAISE NOTICE '⚡ Set up functions for easy color scheme application';
RAISE NOTICE '🔒 Configured RLS policies for secure organization isolation';