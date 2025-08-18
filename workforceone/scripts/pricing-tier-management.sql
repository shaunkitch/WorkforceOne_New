-- =============================================
-- PRICING TIER MANAGEMENT UTILITIES
-- Quick scripts for managing organization tiers
-- =============================================

-- View all organizations with their current tiers
SELECT 
    o.id,
    o.name,
    get_organization_tier(o.id) as current_tier,
    CASE 
        WHEN (o.feature_flags->>'custom_branding')::boolean = true THEN '🎨'
        ELSE ''
    END as branding,
    CASE 
        WHEN (o.feature_flags->>'automation')::boolean = true THEN '🤖'
        ELSE ''
    END as automation,
    o.created_at,
    (SELECT COUNT(*) FROM profiles WHERE organization_id = o.id) as user_count
FROM organizations o 
ORDER BY o.created_at DESC;

-- Upgrade examples (use these as templates):

-- Upgrade specific organization to Professional tier
-- SELECT upgrade_organization_tier('your-org-id-here', 'professional');

-- Upgrade specific organization to Enterprise tier  
-- SELECT upgrade_organization_tier('your-org-id-here', 'enterprise');

-- Batch upgrade all organizations with > 25 users to Professional
-- UPDATE organizations 
-- SET feature_flags = (SELECT set_professional_tier_flags(id))
-- WHERE id IN (
--     SELECT o.id 
--     FROM organizations o
--     JOIN (
--         SELECT organization_id, COUNT(*) as user_count 
--         FROM profiles 
--         GROUP BY organization_id
--     ) p ON o.id = p.organization_id
--     WHERE p.user_count > 25
-- );

-- Check feature availability for specific organization
CREATE OR REPLACE FUNCTION check_org_features(org_id UUID)
RETURNS TABLE(
    feature_name TEXT,
    enabled BOOLEAN,
    tier_requirement TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        f.key,
        COALESCE((o.feature_flags->>f.key)::boolean, false) as enabled,
        f.tier
    FROM (
        VALUES 
            ('dashboard', 'starter'),
            ('attendance', 'starter'), 
            ('leave', 'starter'),
            ('teams', 'starter'),
            ('forms', 'starter'),
            ('time_tracking', 'professional'),
            ('projects', 'professional'),
            ('tasks', 'professional'),
            ('routes', 'professional'),
            ('custom_branding', 'professional'),
            ('analytics', 'professional'),
            ('automation', 'enterprise'),
            ('integrations', 'enterprise'),
            ('payroll', 'enterprise'),
            ('white_label', 'custom')
    ) f(key, tier)
    JOIN organizations o ON o.id = org_id;
END;
$$ LANGUAGE plpgsql;

-- Usage: SELECT * FROM check_org_features('your-org-id-here');

-- Get pricing estimate for organization
CREATE OR REPLACE FUNCTION get_pricing_estimate(org_id UUID)
RETURNS TABLE(
    tier TEXT,
    monthly_per_user DECIMAL,
    user_count INTEGER,
    monthly_total DECIMAL,
    annual_total_with_discount DECIMAL
) AS $$
DECLARE
    current_tier TEXT;
    users INTEGER;
    base_price DECIMAL;
    volume_discount DECIMAL := 0;
    annual_discount DECIMAL := 0.20; -- 20% annual discount
BEGIN
    -- Get current tier and user count
    SELECT get_organization_tier(org_id) INTO current_tier;
    SELECT COUNT(*) INTO users FROM profiles WHERE organization_id = org_id;
    
    -- Base pricing per tier
    base_price := CASE current_tier
        WHEN 'starter' THEN 19.00
        WHEN 'professional' THEN 39.00
        WHEN 'enterprise' THEN 79.00
        ELSE 0.00 -- Custom pricing
    END;
    
    -- Volume discounts
    volume_discount := CASE 
        WHEN users > 250 THEN 0.25  -- 25% discount
        WHEN users > 100 THEN 0.20  -- 20% discount
        WHEN users > 50 THEN 0.15   -- 15% discount
        WHEN users > 25 THEN 0.10   -- 10% discount
        WHEN users > 10 THEN 0.05   -- 5% discount
        ELSE 0.00
    END;
    
    RETURN QUERY
    SELECT 
        current_tier,
        base_price * (1 - volume_discount),
        users,
        (base_price * (1 - volume_discount) * users),
        (base_price * (1 - volume_discount) * users * 12 * (1 - annual_discount))
    ;
END;
$$ LANGUAGE plpgsql;

-- Usage: SELECT * FROM get_pricing_estimate('your-org-id-here');

-- Feature usage analytics
CREATE OR REPLACE VIEW feature_usage_summary AS
SELECT 
    feature_name,
    COUNT(*) as total_orgs,
    COUNT(*) FILTER (WHERE enabled = true) as enabled_count,
    ROUND(
        (COUNT(*) FILTER (WHERE enabled = true)::decimal / COUNT(*) * 100), 
        2
    ) as adoption_rate
FROM (
    SELECT 
        o.id,
        jsonb_each_text(o.feature_flags) as feature_data
    FROM organizations o
    WHERE o.feature_flags IS NOT NULL
) org_features
CROSS JOIN LATERAL (
    SELECT 
        (feature_data).key as feature_name,
        (feature_data).value::boolean as enabled
) feature_expanded
GROUP BY feature_name
ORDER BY adoption_rate DESC;

-- View feature adoption rates
-- SELECT * FROM feature_usage_summary;

RAISE NOTICE '✅ Pricing tier management utilities created!';
RAISE NOTICE '📊 View all tiers: See the SELECT query above';
RAISE NOTICE '⬆️ Upgrade org: SELECT upgrade_organization_tier(org_id, ''tier_name'')';
RAISE NOTICE '🔍 Check features: SELECT * FROM check_org_features(org_id)';
RAISE NOTICE '💰 Get pricing: SELECT * FROM get_pricing_estimate(org_id)';
RAISE NOTICE '📈 Usage stats: SELECT * FROM feature_usage_summary;';