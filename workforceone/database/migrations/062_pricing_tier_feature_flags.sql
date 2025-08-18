-- =============================================
-- PRICING TIER FEATURE FLAGS CONFIGURATION
-- Aligns feature flags with the 3-tier pricing structure
-- =============================================

-- Insert/Update feature flags for each pricing tier
-- These match our FINAL_PRICING_STRUCTURE.md

-- =============================================
-- STARTER TIER DEFAULT FLAGS ($19/user/month)
-- =============================================

CREATE OR REPLACE FUNCTION set_starter_tier_flags(org_id UUID) 
RETURNS void AS $$
BEGIN
    UPDATE organizations 
    SET feature_flags = jsonb_build_object(
        -- Core Features (Included)
        'dashboard', true,
        'attendance', true,
        'leave', true,
        'teams', true,
        'forms', true,
        
        -- Mobile Features (Basic)
        'mobile_clock_in', true,
        'mobile_leave', true,
        'mobile_forms', true,
        'mobile_offline_mode', false, -- Limited offline
        'mobile_push_notifications', false,
        
        -- Advanced Features (Disabled)
        'time_tracking', false,
        'projects', false,
        'tasks', false,
        'routes', false,
        'maps', false,
        'outlets', false,
        'analytics', false,
        'automation', false,
        'integrations', false,
        'payroll', false,
        
        -- Branding (Basic only)
        'custom_branding', false,
        'color_schemes', false,
        
        -- Support Level
        'priority_support', false,
        'phone_support', false
    )
    WHERE id = org_id;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- PROFESSIONAL TIER DEFAULT FLAGS ($39/user/month)
-- =============================================

CREATE OR REPLACE FUNCTION set_professional_tier_flags(org_id UUID) 
RETURNS void AS $$
BEGIN
    UPDATE organizations 
    SET feature_flags = jsonb_build_object(
        -- Core Features (All included)
        'dashboard', true,
        'attendance', true,
        'leave', true,
        'teams', true,
        'forms', true,
        
        -- Advanced Operations (Included)
        'time_tracking', true,
        'projects', true,
        'tasks', true,
        'routes', true,
        'maps', true,
        'outlets', true,
        
        -- Mobile Features (Enhanced)
        'mobile_clock_in', true,
        'mobile_leave', true,
        'mobile_forms', true,
        'mobile_offline_mode', true,
        'mobile_push_notifications', true,
        'mobile_gps_tracking', true,
        'mobile_photo_attachments', true,
        
        -- Analytics (Advanced)
        'analytics', true,
        'advanced_reports', true,
        
        -- Branding (Custom included)
        'custom_branding', true,
        'color_schemes', true,
        
        -- Still Disabled (Enterprise only)
        'automation', false,
        'integrations', false,
        'payroll', false,
        'daily_calls', false,
        'messaging', false,
        'api_access', false,
        
        -- Support Level
        'priority_support', true,
        'phone_support', false
    )
    WHERE id = org_id;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- ENTERPRISE TIER DEFAULT FLAGS ($79/user/month)
-- =============================================

CREATE OR REPLACE FUNCTION set_enterprise_tier_flags(org_id UUID) 
RETURNS void AS $$
BEGIN
    UPDATE organizations 
    SET feature_flags = jsonb_build_object(
        -- Core Features (All included)
        'dashboard', true,
        'attendance', true,
        'leave', true,
        'teams', true,
        'forms', true,
        
        -- Advanced Operations (All included)
        'time_tracking', true,
        'projects', true,
        'tasks', true,
        'routes', true,
        'maps', true,
        'outlets', true,
        
        -- Enterprise Features (All included)
        'analytics', true,
        'advanced_reports', true,
        'automation', true,
        'integrations', true,
        'payroll', true,
        'daily_calls', true,
        'messaging', true,
        'api_access', true,
        
        -- Mobile Features (Premium)
        'mobile_clock_in', true,
        'mobile_leave', true,
        'mobile_forms', true,
        'mobile_offline_mode', true,
        'mobile_push_notifications', true,
        'mobile_gps_tracking', true,
        'mobile_photo_attachments', true,
        'mobile_analytics', true,
        'mobile_messaging', true,
        'mobile_daily_calls', true,
        'mobile_payslips', true,
        
        -- Branding (Full customization)
        'custom_branding', true,
        'color_schemes', true,
        'white_label', false, -- Still custom tier only
        
        -- Support Level
        'priority_support', true,
        'phone_support', true,
        'dedicated_support', true
    )
    WHERE id = org_id;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- CUSTOM TIER DEFAULT FLAGS (Contact Sales)
-- =============================================

CREATE OR REPLACE FUNCTION set_custom_tier_flags(org_id UUID) 
RETURNS void AS $$
BEGIN
    UPDATE organizations 
    SET feature_flags = jsonb_build_object(
        -- Everything enabled
        'dashboard', true,
        'attendance', true,
        'leave', true,
        'teams', true,
        'forms', true,
        'time_tracking', true,
        'projects', true,
        'tasks', true,
        'routes', true,
        'maps', true,
        'outlets', true,
        'analytics', true,
        'advanced_reports', true,
        'automation', true,
        'integrations', true,
        'payroll', true,
        'daily_calls', true,
        'messaging', true,
        'api_access', true,
        
        -- Mobile Features (All)
        'mobile_clock_in', true,
        'mobile_leave', true,
        'mobile_forms', true,
        'mobile_offline_mode', true,
        'mobile_push_notifications', true,
        'mobile_gps_tracking', true,
        'mobile_photo_attachments', true,
        'mobile_analytics', true,
        'mobile_messaging', true,
        'mobile_daily_calls', true,
        'mobile_payslips', true,
        
        -- Branding (Complete customization)
        'custom_branding', true,
        'color_schemes', true,
        'white_label', true,
        'custom_features', true,
        
        -- Support Level (Premium)
        'priority_support', true,
        'phone_support', true,
        'dedicated_support', true,
        'account_manager', true,
        'custom_sla', true
    )
    WHERE id = org_id;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- TIER MANAGEMENT FUNCTIONS
-- =============================================

-- Function to get organization tier based on feature flags
CREATE OR REPLACE FUNCTION get_organization_tier(org_id UUID)
RETURNS TEXT AS $$
DECLARE
    flags JSONB;
    has_enterprise BOOLEAN := false;
    has_professional BOOLEAN := false;
BEGIN
    SELECT feature_flags INTO flags 
    FROM organizations 
    WHERE id = org_id;
    
    -- Check for enterprise features
    IF (flags->>'automation')::boolean = true OR 
       (flags->>'integrations')::boolean = true OR 
       (flags->>'payroll')::boolean = true THEN
        has_enterprise := true;
    END IF;
    
    -- Check for professional features
    IF (flags->>'time_tracking')::boolean = true OR 
       (flags->>'projects')::boolean = true OR 
       (flags->>'custom_branding')::boolean = true THEN
        has_professional := true;
    END IF;
    
    -- Check for custom tier (white label)
    IF (flags->>'white_label')::boolean = true THEN
        RETURN 'custom';
    ELSIF has_enterprise THEN
        RETURN 'enterprise';
    ELSIF has_professional THEN
        RETURN 'professional';
    ELSE
        RETURN 'starter';
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to upgrade organization tier
CREATE OR REPLACE FUNCTION upgrade_organization_tier(org_id UUID, new_tier TEXT)
RETURNS void AS $$
BEGIN
    CASE new_tier
        WHEN 'starter' THEN
            PERFORM set_starter_tier_flags(org_id);
        WHEN 'professional' THEN
            PERFORM set_professional_tier_flags(org_id);
        WHEN 'enterprise' THEN
            PERFORM set_enterprise_tier_flags(org_id);
        WHEN 'custom' THEN
            PERFORM set_custom_tier_flags(org_id);
        ELSE
            RAISE EXCEPTION 'Invalid tier: %. Valid tiers are: starter, professional, enterprise, custom', new_tier;
    END CASE;
    
    -- Update subscription tier tracking
    UPDATE organizations 
    SET updated_at = CURRENT_TIMESTAMP
    WHERE id = org_id;
    
    RAISE NOTICE 'Organization % upgraded to % tier', org_id, new_tier;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- SET DEFAULT STARTER TIER FOR EXISTING ORGS
-- =============================================

-- Update all existing organizations to starter tier by default
UPDATE organizations 
SET feature_flags = jsonb_build_object(
    'dashboard', true,
    'attendance', true,
    'leave', true,
    'teams', true,
    'forms', true,
    'mobile_clock_in', true,
    'mobile_leave', true,
    'mobile_forms', true,
    'time_tracking', false,
    'projects', false,
    'tasks', false,
    'routes', false,
    'maps', false,
    'outlets', false,
    'analytics', false,
    'automation', false,
    'integrations', false,
    'payroll', false,
    'custom_branding', false,
    'color_schemes', false,
    'priority_support', false,
    'phone_support', false
)
WHERE feature_flags IS NULL OR feature_flags = '{}'::jsonb;

-- =============================================
-- DEMO ORGANIZATION SETUP
-- =============================================

-- Set demo organization to enterprise tier for showcasing
DO $$
DECLARE
    demo_org_id UUID;
BEGIN
    -- Find demo organization (you may need to adjust this query)
    SELECT id INTO demo_org_id 
    FROM organizations 
    WHERE name ILIKE '%demo%' OR name ILIKE '%test%' 
    LIMIT 1;
    
    IF demo_org_id IS NOT NULL THEN
        PERFORM set_enterprise_tier_flags(demo_org_id);
        RAISE NOTICE 'Demo organization % set to enterprise tier', demo_org_id;
    END IF;
END $$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION set_starter_tier_flags(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION set_professional_tier_flags(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION set_enterprise_tier_flags(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION set_custom_tier_flags(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_organization_tier(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION upgrade_organization_tier(UUID, TEXT) TO authenticated;

RAISE NOTICE '✅ Pricing tier feature flags configured successfully!';
RAISE NOTICE '🎯 Organizations can now be upgraded using: SELECT upgrade_organization_tier(org_id, ''professional'')';
RAISE NOTICE '📊 Check tier with: SELECT get_organization_tier(org_id)';
RAISE NOTICE '💰 Pricing tiers: starter ($19), professional ($39), enterprise ($79), custom (contact sales)';