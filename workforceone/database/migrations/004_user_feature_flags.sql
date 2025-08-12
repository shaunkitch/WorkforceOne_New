-- User Feature Flags Migration
-- Adds feature_flags column to profiles table for individual user feature control

-- Add feature_flags column to profiles table if it doesn't exist
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS feature_flags JSONB DEFAULT '{}'::jsonb;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_feature_flags ON public.profiles USING GIN (feature_flags);

-- Add helpful comment
COMMENT ON COLUMN public.profiles.feature_flags IS 'Individual user feature overrides - takes precedence over organization defaults';

-- Create function to merge user and organization feature flags
CREATE OR REPLACE FUNCTION get_user_effective_features(user_id UUID)
RETURNS JSONB AS $$
DECLARE
    user_features JSONB;
    org_features JSONB;
    effective_features JSONB;
BEGIN
    -- Get user's individual feature flags
    SELECT p.feature_flags INTO user_features
    FROM public.profiles p
    WHERE p.id = user_id;
    
    -- Get organization's default feature flags
    SELECT o.feature_flags INTO org_features
    FROM public.profiles p
    JOIN public.organizations o ON p.organization_id = o.id
    WHERE p.id = user_id;
    
    -- Merge flags with user overrides taking precedence
    effective_features := COALESCE(org_features, '{}'::jsonb) || COALESCE(user_features, '{}'::jsonb);
    
    RETURN effective_features;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_user_effective_features(UUID) TO authenticated;

-- Create view for easier feature flag management
CREATE OR REPLACE VIEW user_feature_summary AS
SELECT 
    p.id,
    p.full_name,
    p.email,
    p.role,
    p.organization_id,
    o.name as organization_name,
    o.feature_flags as org_feature_flags,
    p.feature_flags as user_feature_flags,
    get_user_effective_features(p.id) as effective_features
FROM public.profiles p
LEFT JOIN public.organizations o ON p.organization_id = o.id;

-- Grant select permission to authenticated users
GRANT SELECT ON user_feature_summary TO authenticated;

-- Example of how to use the function:
-- SELECT get_user_effective_features('user-uuid-here');

-- Example of checking if a user has a specific feature:
-- SELECT (get_user_effective_features('user-uuid-here')->>'time_tracking')::boolean;