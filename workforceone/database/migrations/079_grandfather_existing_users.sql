-- =============================================
-- GRANDFATHER EXISTING USERS TO ALL PRODUCTS
-- Grants all existing organizations and users access to all three products
-- This ensures no disruption to existing customers
-- =============================================

-- ===== GRANT ALL PRODUCTS TO EXISTING ORGANIZATIONS =====

-- Insert organization subscriptions for all existing organizations
INSERT INTO organization_subscriptions (
  organization_id, 
  product_id, 
  status, 
  trial_ends_at,
  current_period_start,
  current_period_end,
  user_count,
  unit_price,
  metadata
)
SELECT 
  o.id as organization_id,
  p.id as product_id,
  'active' as status,
  NOW() + INTERVAL '999 years' as trial_ends_at, -- Essentially unlimited trial
  NOW() as current_period_start,
  NOW() + INTERVAL '1 year' as current_period_end,
  999 as user_count, -- Unlimited users for grandfathered orgs
  0.00 as unit_price, -- Free for existing customers
  jsonb_build_object(
    'grandfathered', true,
    'migration_date', NOW()::text,
    'original_features', COALESCE(o.feature_flags, '{}'),
    'notes', 'Grandfathered during product modularization migration'
  ) as metadata
FROM organizations o
CROSS JOIN products p
WHERE NOT EXISTS (
  -- Don't duplicate if already exists
  SELECT 1 FROM organization_subscriptions os
  WHERE os.organization_id = o.id 
  AND os.product_id = p.id
);

-- ===== GRANT PRODUCT ACCESS TO ALL EXISTING USERS =====

-- Grant access to all products for all existing users
INSERT INTO user_product_access (
  user_id,
  organization_id,
  product_id,
  granted_at,
  granted_by,
  is_active,
  permissions,
  metadata
)
SELECT 
  p.id as user_id,
  p.organization_id,
  pr.id as product_id,
  NOW() as granted_at,
  NULL as granted_by, -- System granted
  true as is_active,
  jsonb_build_object(
    'grandfathered', true,
    'all_features', true
  ) as permissions,
  jsonb_build_object(
    'grandfathered', true,
    'migration_date', NOW()::text,
    'original_role', p.role,
    'work_type', p.work_type,
    'notes', 'Grandfathered during product modularization migration'
  ) as metadata
FROM profiles p
CROSS JOIN products pr
WHERE p.organization_id IS NOT NULL
AND NOT EXISTS (
  -- Don't duplicate if already exists
  SELECT 1 FROM user_product_access upa
  WHERE upa.user_id = p.id 
  AND upa.product_id = pr.id
);

-- ===== UPDATE EXISTING DATA WITH PRODUCT ASSOCIATIONS =====

-- Update existing tasks to Remote product (if not already set)
UPDATE tasks 
SET product_id = (SELECT id FROM products WHERE code = 'remote')
WHERE product_id IS NULL;

-- Update existing attendance records to Time product
UPDATE attendance 
SET product_id = (SELECT id FROM products WHERE code = 'time')
WHERE product_id IS NULL;

-- Update existing patrol routes to Guard product
UPDATE patrol_routes 
SET product_id = (SELECT id FROM products WHERE code = 'guard')
WHERE product_id IS NULL;

-- Update existing forms to Remote product
UPDATE forms 
SET product_id = (SELECT id FROM products WHERE code = 'remote')
WHERE product_id IS NULL;

-- Update existing incidents to Guard product
UPDATE incidents 
SET product_id = (SELECT id FROM products WHERE code = 'guard')
WHERE product_id IS NULL;

-- Update existing leave requests to Time product
UPDATE leave_requests 
SET product_id = (SELECT id FROM products WHERE code = 'time')
WHERE product_id IS NULL;

-- Update existing teams to Remote product
UPDATE teams 
SET product_id = (SELECT id FROM products WHERE code = 'remote')
WHERE product_id IS NULL;

-- Update existing projects to Remote product
UPDATE projects 
SET product_id = (SELECT id FROM products WHERE code = 'remote')
WHERE product_id IS NULL;

-- ===== SMART PRODUCT ASSIGNMENT BASED ON USER WORK TYPE =====

-- Update user preferences based on work_type (this helps with UI defaults)
-- Users with work_type 'security' get Guard as primary
-- Users with work_type 'field' get Remote as primary  
-- Users with work_type 'office' get Time as primary

UPDATE user_product_access 
SET permissions = permissions || jsonb_build_object('primary_product', true)
WHERE product_id = (SELECT id FROM products WHERE code = 'guard')
AND user_id IN (
  SELECT id FROM profiles WHERE work_type = 'security'
);

UPDATE user_product_access 
SET permissions = permissions || jsonb_build_object('primary_product', true)
WHERE product_id = (SELECT id FROM products WHERE code = 'remote')
AND user_id IN (
  SELECT id FROM profiles WHERE work_type = 'field'
);

UPDATE user_product_access 
SET permissions = permissions || jsonb_build_object('primary_product', true)
WHERE product_id = (SELECT id FROM products WHERE code = 'time')
AND user_id IN (
  SELECT id FROM profiles WHERE work_type = 'office'
);

-- Default to Remote for users without work_type
UPDATE user_product_access 
SET permissions = permissions || jsonb_build_object('primary_product', true)
WHERE product_id = (SELECT id FROM products WHERE code = 'remote')
AND user_id IN (
  SELECT id FROM profiles WHERE work_type IS NULL
);

-- ===== UPDATE OUTLETS BASED ON USAGE CONTEXT =====

-- Outlets used in routes should be Remote product
UPDATE outlets 
SET product_id = (SELECT id FROM products WHERE code = 'remote')
WHERE product_id IS NULL 
AND id IN (
  SELECT DISTINCT outlet_id FROM route_stops WHERE outlet_id IS NOT NULL
);

-- Note: Patrol routes don't directly reference outlets via outlet_id
-- So we'll assign remaining outlets to Remote by default

-- Any remaining outlets default to Remote (they're likely general business locations)
UPDATE outlets 
SET product_id = (SELECT id FROM products WHERE code = 'remote')
WHERE product_id IS NULL;

-- ===== CREATE BILLING HISTORY FOR GRANDFATHERED ACCOUNTS =====

-- Create billing history entries for the grandfathering process
INSERT INTO billing_history (
  organization_id,
  subscription_id,
  event_type,
  event_date,
  amount,
  currency,
  period_start,
  period_end,
  user_count,
  status,
  event_data
)
SELECT 
  os.organization_id,
  os.id as subscription_id,
  'grandfathering_migration' as event_type,
  NOW() as event_date,
  0.00 as amount,
  'USD' as currency,
  NOW()::date as period_start,
  (NOW() + INTERVAL '1 year')::date as period_end,
  os.user_count,
  'completed' as status,
  jsonb_build_object(
    'migration_type', 'product_modularization',
    'products_granted', 3,
    'grandfathered', true,
    'original_subscription', 'all_features'
  ) as event_data
FROM organization_subscriptions os
WHERE os.metadata->>'grandfathered' = 'true';

-- ===== VALIDATE DATA CONSISTENCY =====

-- Check that all organizations have subscriptions
DO $$
DECLARE
  org_count INTEGER;
  sub_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO org_count FROM organizations;
  SELECT COUNT(DISTINCT organization_id) INTO sub_count FROM organization_subscriptions;
  
  IF org_count != sub_count THEN
    RAISE WARNING 'Mismatch: % organizations but % have subscriptions', org_count, sub_count;
  END IF;
END $$;

-- Check that all users have product access
DO $$
DECLARE
  user_count INTEGER;
  access_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO user_count FROM profiles WHERE organization_id IS NOT NULL;
  SELECT COUNT(DISTINCT user_id) INTO access_count FROM user_product_access;
  
  IF user_count != access_count THEN
    RAISE WARNING 'Mismatch: % users but % have product access', user_count, access_count;
  END IF;
END $$;

-- ===== SUMMARY REPORT =====

-- Generate migration summary
SELECT 
  'Migration Summary' as report_type,
  (SELECT COUNT(*) FROM organizations) as total_organizations,
  (SELECT COUNT(*) FROM organization_subscriptions) as total_subscriptions,
  (SELECT COUNT(*) FROM profiles WHERE organization_id IS NOT NULL) as total_users,
  (SELECT COUNT(*) FROM user_product_access) as total_user_access_grants,
  (SELECT COUNT(*) FROM billing_history WHERE event_type = 'grandfathering_migration') as billing_records_created;

-- Show product distribution
SELECT 
  p.display_name as product,
  COUNT(os.id) as organizations_subscribed,
  COUNT(DISTINCT upa.user_id) as users_with_access
FROM products p
LEFT JOIN organization_subscriptions os ON os.product_id = p.id
LEFT JOIN user_product_access upa ON upa.product_id = p.id
GROUP BY p.id, p.display_name
ORDER BY p.display_name;

-- Success message
SELECT 'All existing users grandfathered successfully! No one loses access.' as status;