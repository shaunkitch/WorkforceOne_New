-- =============================================
-- GLOBAL ADMIN AND MOBILE ADMIN SYSTEM
-- =============================================

-- Update extend_trial function to work with service role (for global admin)
CREATE OR REPLACE FUNCTION extend_trial(org_id UUID)
RETURNS JSONB AS $$
DECLARE
  sub_id UUID;
  extension_used BOOLEAN := false;
  current_trial_end TIMESTAMPTZ;
  is_global_admin BOOLEAN := false;
BEGIN
  -- Check if this is a service role call (global admin) or regular admin
  SELECT CASE 
    WHEN current_setting('role') = 'service_role' THEN true
    WHEN EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
        AND organization_id = org_id 
        AND role = 'admin'
    ) THEN true
    ELSE false
  END INTO is_global_admin;

  IF NOT is_global_admin THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Only administrators can extend trials'
    );
  END IF;

  -- Get subscription and check if extension already used
  SELECT id, trial_ends_at, COALESCE(metadata->>'extension_used', 'false')::boolean
  INTO sub_id, current_trial_end, extension_used
  FROM subscriptions
  WHERE organization_id = org_id;

  IF sub_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'No subscription found for organization'
    );
  END IF;

  IF extension_used THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Trial extension already used'
    );
  END IF;

  -- Extend trial by 10 days and mark extension as used
  UPDATE subscriptions
  SET 
    trial_ends_at = current_trial_end + INTERVAL '10 days',
    metadata = metadata || '{"extension_used": true}'::jsonb,
    updated_at = CURRENT_TIMESTAMP
  WHERE id = sub_id;

  RETURN jsonb_build_object(
    'success', true,
    'new_trial_end', current_trial_end + INTERVAL '10 days',
    'message', 'Trial extended by 10 days'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get global admin analytics
CREATE OR REPLACE FUNCTION get_global_analytics(period_months INTEGER DEFAULT 6)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
  start_date TIMESTAMPTZ;
BEGIN
  start_date := CURRENT_TIMESTAMP - (period_months || ' months')::interval;
  
  WITH analytics AS (
    SELECT
      -- Total counts
      (SELECT COUNT(*) FROM organizations) as total_organizations,
      (SELECT COUNT(*) FROM profiles) as total_users,
      (SELECT COUNT(*) FROM subscriptions WHERE status = 'active') as active_subscriptions,
      (SELECT COUNT(*) FROM subscriptions WHERE status = 'trial') as trial_subscriptions,
      
      -- Revenue metrics
      (SELECT COALESCE(SUM(total_amount), 0) 
       FROM invoices 
       WHERE status = 'paid' AND created_at >= start_date) as total_revenue,
       
      (SELECT COALESCE(SUM(monthly_total), 0) 
       FROM subscriptions 
       WHERE status = 'active') as monthly_recurring_revenue,
       
      -- Health metrics
      (SELECT COUNT(*) 
       FROM subscriptions 
       WHERE status = 'trial' 
         AND trial_ends_at < CURRENT_TIMESTAMP) as expired_trials,
         
      -- User activity
      (SELECT COUNT(*) 
       FROM profiles 
       WHERE last_sign_in_at >= CURRENT_TIMESTAMP - INTERVAL '30 days') as active_users_30d,
       
      -- Growth metrics
      (SELECT COUNT(*) 
       FROM organizations 
       WHERE created_at >= CURRENT_TIMESTAMP - INTERVAL '30 days') as new_orgs_30d,
       
      (SELECT COUNT(*) 
       FROM profiles 
       WHERE created_at >= CURRENT_TIMESTAMP - INTERVAL '30 days') as new_users_30d
  )
  SELECT jsonb_build_object(
    'total_organizations', total_organizations,
    'total_users', total_users,
    'active_subscriptions', active_subscriptions,
    'trial_subscriptions', trial_subscriptions,
    'total_revenue', total_revenue,
    'monthly_recurring_revenue', monthly_recurring_revenue,
    'expired_trials', expired_trials,
    'active_users_30d', active_users_30d,
    'new_orgs_30d', new_orgs_30d,
    'new_users_30d', new_users_30d,
    'health_score', ROUND(
      CASE 
        WHEN total_organizations > 0 THEN (active_subscriptions::float / total_organizations * 100)
        ELSE 0
      END
    ),
    'conversion_rate', ROUND(
      CASE 
        WHEN trial_subscriptions + active_subscriptions > 0 
        THEN (active_subscriptions::float / (trial_subscriptions + active_subscriptions) * 100)
        ELSE 0
      END
    )
  ) INTO result
  FROM analytics;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get organization health score
CREATE OR REPLACE FUNCTION calculate_org_health_score(org_id UUID)
RETURNS INTEGER AS $$
DECLARE
  score INTEGER := 0;
  user_count INTEGER;
  active_users INTEGER;
  subscription_status TEXT;
  trial_expired BOOLEAN := false;
  has_recent_activity BOOLEAN := false;
BEGIN
  -- Get basic org metrics
  SELECT 
    COUNT(*) as total_users,
    COUNT(CASE WHEN last_sign_in_at >= CURRENT_TIMESTAMP - INTERVAL '7 days' THEN 1 END) as active_users_7d
  INTO user_count, active_users
  FROM profiles 
  WHERE organization_id = org_id;
  
  -- Get subscription status
  SELECT 
    status,
    CASE WHEN status = 'trial' AND trial_ends_at < CURRENT_TIMESTAMP THEN true ELSE false END
  INTO subscription_status, trial_expired
  FROM subscriptions 
  WHERE organization_id = org_id;
  
  -- Check for recent activity
  SELECT EXISTS(
    SELECT 1 FROM time_entries 
    WHERE organization_id = org_id 
      AND created_at >= CURRENT_TIMESTAMP - INTERVAL '7 days'
  ) INTO has_recent_activity;
  
  -- Calculate score (0-100)
  
  -- Base score for having users
  IF user_count > 0 THEN
    score := score + 20;
  END IF;
  
  -- Active subscription bonus
  IF subscription_status = 'active' THEN
    score := score + 40;
  ELSIF subscription_status = 'trial' AND NOT trial_expired THEN
    score := score + 25;
  END IF;
  
  -- User activity bonus
  IF user_count > 0 AND active_users > 0 THEN
    score := score + LEAST(30, (active_users * 30 / user_count));
  END IF;
  
  -- Recent activity bonus
  IF has_recent_activity THEN
    score := score + 10;
  END IF;
  
  RETURN LEAST(100, score);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get detailed organization info for global admin
CREATE OR REPLACE FUNCTION get_organization_details(org_id UUID)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  WITH org_details AS (
    SELECT 
      o.*,
      s.status as subscription_status,
      s.trial_ends_at,
      s.monthly_total,
      s.user_count as subscription_user_count,
      COALESCE(s.metadata->>'extension_used', 'false')::boolean as extension_used,
      calculate_org_health_score(o.id) as health_score,
      (SELECT COUNT(*) FROM profiles WHERE organization_id = o.id) as actual_user_count,
      (SELECT COUNT(*) FROM profiles WHERE organization_id = o.id AND last_sign_in_at >= CURRENT_TIMESTAMP - INTERVAL '30 days') as active_user_count
    FROM organizations o
    LEFT JOIN subscriptions s ON s.organization_id = o.id
    WHERE o.id = org_id
  )
  SELECT jsonb_build_object(
    'id', id,
    'name', name,
    'email', email,
    'created_at', created_at,
    'subscription_status', subscription_status,
    'trial_ends_at', trial_ends_at,
    'monthly_total', monthly_total,
    'user_count', actual_user_count,
    'active_users', active_user_count,
    'health_score', health_score,
    'extension_used', extension_used,
    'can_extend_trial', CASE 
      WHEN subscription_status = 'trial' 
        AND trial_ends_at >= CURRENT_TIMESTAMP 
        AND NOT extension_used 
      THEN true 
      ELSE false 
    END
  ) INTO result
  FROM org_details;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions for service role access (global admin)
GRANT EXECUTE ON FUNCTION extend_trial TO service_role;
GRANT EXECUTE ON FUNCTION get_global_analytics TO service_role;
GRANT EXECUTE ON FUNCTION calculate_org_health_score TO service_role;
GRANT EXECUTE ON FUNCTION get_organization_details TO service_role;

-- Grant permissions for authenticated users (regular admin functions)
GRANT EXECUTE ON FUNCTION extend_trial TO authenticated;
GRANT EXECUTE ON FUNCTION get_organization_details TO authenticated;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_last_sign_in 
ON profiles(last_sign_in_at) WHERE last_sign_in_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_organizations_created_at 
ON organizations(created_at);

CREATE INDEX IF NOT EXISTS idx_subscriptions_status_trial_end 
ON subscriptions(status, trial_ends_at);

CREATE INDEX IF NOT EXISTS idx_invoices_status_created 
ON invoices(status, created_at) WHERE status = 'paid';

-- Comments
COMMENT ON FUNCTION extend_trial IS 'Extend trial period by 10 days (works with service role for global admin)';
COMMENT ON FUNCTION get_global_analytics IS 'Get platform-wide analytics for global admin dashboard';
COMMENT ON FUNCTION calculate_org_health_score IS 'Calculate health score (0-100) for an organization';
COMMENT ON FUNCTION get_organization_details IS 'Get detailed organization information for admin interfaces';

-- Add admin activity logging table
CREATE TABLE IF NOT EXISTS public.admin_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_email VARCHAR(255) NOT NULL,
  action VARCHAR(100) NOT NULL, -- 'trial_extended', 'user_banned', etc.
  target_type VARCHAR(50) NOT NULL, -- 'organization', 'user', etc.
  target_id UUID NOT NULL,
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Create index for admin activity log
CREATE INDEX IF NOT EXISTS idx_admin_activity_log_created 
ON admin_activity_log(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_admin_activity_log_admin 
ON admin_activity_log(admin_email);

-- Function to log admin activity
CREATE OR REPLACE FUNCTION log_admin_activity(
  admin_email VARCHAR(255),
  action VARCHAR(100),
  target_type VARCHAR(50),
  target_id UUID,
  details JSONB DEFAULT '{}'::jsonb
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO admin_activity_log (admin_email, action, target_type, target_id, details)
  VALUES (admin_email, action, target_type, target_id, details);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION log_admin_activity TO service_role;

-- Update extend_trial function to include logging
CREATE OR REPLACE FUNCTION extend_trial(org_id UUID, admin_email VARCHAR(255) DEFAULT NULL)
RETURNS JSONB AS $$
DECLARE
  sub_id UUID;
  extension_used BOOLEAN := false;
  current_trial_end TIMESTAMPTZ;
  is_global_admin BOOLEAN := false;
  org_name VARCHAR(255);
BEGIN
  -- Check if this is a service role call (global admin) or regular admin
  SELECT CASE 
    WHEN current_setting('role') = 'service_role' THEN true
    WHEN EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
        AND organization_id = org_id 
        AND role = 'admin'
    ) THEN true
    ELSE false
  END INTO is_global_admin;

  IF NOT is_global_admin THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Only administrators can extend trials'
    );
  END IF;

  -- Get organization name for logging
  SELECT name INTO org_name FROM organizations WHERE id = org_id;

  -- Get subscription and check if extension already used
  SELECT id, trial_ends_at, COALESCE(metadata->>'extension_used', 'false')::boolean
  INTO sub_id, current_trial_end, extension_used
  FROM subscriptions
  WHERE organization_id = org_id;

  IF sub_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'No subscription found for organization'
    );
  END IF;

  IF extension_used THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Trial extension already used'
    );
  END IF;

  -- Extend trial by 10 days and mark extension as used
  UPDATE subscriptions
  SET 
    trial_ends_at = current_trial_end + INTERVAL '10 days',
    metadata = metadata || '{"extension_used": true}'::jsonb,
    updated_at = CURRENT_TIMESTAMP
  WHERE id = sub_id;

  -- Log the admin activity if admin_email is provided
  IF admin_email IS NOT NULL THEN
    PERFORM log_admin_activity(
      admin_email,
      'trial_extended',
      'organization',
      org_id,
      jsonb_build_object(
        'organization_name', org_name,
        'old_trial_end', current_trial_end,
        'new_trial_end', current_trial_end + INTERVAL '10 days'
      )
    );
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'new_trial_end', current_trial_end + INTERVAL '10 days',
    'message', 'Trial extended by 10 days'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;