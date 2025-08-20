-- Populate form_field_types table with all available field types
-- This ensures all field types including new ones are available in the form builder

-- First, check if the table exists and create it if not
CREATE TABLE IF NOT EXISTS public.form_field_types (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT,
    category TEXT,
    default_settings JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add missing columns if they don't exist (for existing tables)
ALTER TABLE public.form_field_types ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE public.form_field_types ADD COLUMN IF NOT EXISTS icon TEXT;

-- Clear existing field types to ensure we have the latest
TRUNCATE TABLE public.form_field_types;

-- Insert all field types including new ones
INSERT INTO public.form_field_types (id, name, description, category, default_settings, icon) VALUES
-- Basic Input Fields
('text', 'Text Input', 'Single line text input', 'basic', '{}', 'Type'),
('textarea', 'Text Area', 'Multi-line text input', 'basic', '{"rows": 4}', 'AlignLeft'),
('email', 'Email', 'Email input with validation', 'basic', '{}', 'Mail'),
('number', 'Number', 'Numeric input field', 'basic', '{}', 'Hash'),
('date', 'Date', 'Date picker field', 'basic', '{}', 'Calendar'),
('time', 'Time', 'Time picker field', 'basic', '{}', 'Clock'),
('phone', 'Phone', 'Phone number input', 'basic', '{}', 'Phone'),
('url', 'URL', 'URL input with validation', 'basic', '{}', 'Link'),

-- Selection Fields
('select', 'Dropdown', 'Single selection dropdown', 'selection', '{"options": ["Option 1", "Option 2", "Option 3"]}', 'ChevronDown'),
('multiselect', 'Multi-Select Dropdown', 'Multiple choice dropdown selection', 'selection', '{"options": ["Option 1", "Option 2", "Option 3"]}', 'CheckSquare'),
('radio', 'Radio Buttons', 'Single choice from multiple options', 'selection', '{"options": ["Option 1", "Option 2", "Option 3"]}', 'Circle'),
('checkbox', 'Checkboxes', 'Multiple choice selection', 'selection', '{"options": ["Option 1", "Option 2", "Option 3"]}', 'Square'),

-- Advanced Fields
('file', 'File Upload', 'File upload field', 'advanced', '{"maxSize": 10, "accept": ""}', 'Upload'),
('signature', 'Signature Pad', 'Digital signature capture', 'advanced', '{"width": 400, "height": 200, "clearButton": true}', 'Edit3'),
('camera', 'Camera/Photo', 'Photo capture or upload', 'advanced', '{"multiple": false, "maxSize": 5, "allowUpload": true}', 'Camera'),
('rating', 'Star Rating', 'Star rating field', 'advanced', '{"max": 5}', 'Star'),
('likert', 'Likert Scale', 'Survey-style rating scale', 'advanced', '{"scale": ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"]}', 'BarChart2'),

-- Layout Fields
('section', 'Section Header', 'Visual section divider', 'layout', '{}', 'Layout'),
('html', 'HTML Content', 'Custom HTML content block', 'layout', '{}', 'Code'),
('divider', 'Divider', 'Horizontal line divider', 'layout', '{}', 'Minus'),
('spacer', 'Spacer', 'Add vertical spacing', 'layout', '{"height": 20}', 'MoveVertical');

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_form_field_types_active ON public.form_field_types(is_active);
CREATE INDEX IF NOT EXISTS idx_form_field_types_category ON public.form_field_types(category);

-- Add RLS policies if needed
ALTER TABLE public.form_field_types ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can view field types" ON public.form_field_types;
DROP POLICY IF EXISTS "Only admins can modify field types" ON public.form_field_types;

-- Allow all authenticated users to read field types
CREATE POLICY "Anyone can view field types"
ON public.form_field_types FOR SELECT
TO authenticated
USING (true);

-- Only admins can modify field types
CREATE POLICY "Only admins can modify field types"
ON public.form_field_types FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role = 'admin'
    )
);

-- Add helpful comments
COMMENT ON TABLE public.form_field_types IS 'Defines available field types for the form builder';
COMMENT ON COLUMN public.form_field_types.default_settings IS 'Default configuration for each field type in JSON format';