-- =============================================
-- PRICING AND SUBSCRIPTION SYSTEM
-- =============================================

-- 1. PRICING PLANS AND FEATURES
-- =============================================

-- Feature categories enum
CREATE TYPE feature_category AS ENUM (
  'core',
  'productivity', 
  'analytics',
  'location',
  'integration',
  'support'
);

-- Billing unit enum
CREATE TYPE billing_unit AS ENUM (
  'user',
  'organization'
);

-- Feature status enum
CREATE TYPE feature_status AS ENUM (
  'active',
  'deprecated',
  'beta',
  'coming_soon'
);

-- Features master table
CREATE TABLE IF NOT EXISTS public.features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_key VARCHAR(100) UNIQUE NOT NULL, -- e.g., 'advanced_tasks', 'gps_tracking'
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category feature_category NOT NULL,
  is_free BOOLEAN DEFAULT false,
  base_price DECIMAL(10, 2) DEFAULT 0, -- Base price in USD
  billing_unit billing_unit NOT NULL,
  dependencies JSONB DEFAULT '[]'::jsonb, -- Array of feature_keys this depends on
  settings JSONB DEFAULT '{}'::jsonb, -- Additional settings/limits for the feature
  is_popular BOOLEAN DEFAULT false,
  status feature_status DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- User tier pricing
CREATE TABLE IF NOT EXISTS public.user_tier_pricing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  min_users INTEGER NOT NULL,
  max_users INTEGER, -- NULL means unlimited
  price_per_user DECIMAL(10, 2) NOT NULL, -- Price per user in this tier
  tier_name VARCHAR(100) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(min_users, max_users)
);

-- 2. SUBSCRIPTION MANAGEMENT
-- =============================================

-- Subscription status enum
CREATE TYPE subscription_status AS ENUM (
  'trial',
  'active',
  'past_due',
  'canceled',
  'paused',
  'expired'
);

-- Billing period enum
CREATE TYPE billing_period AS ENUM (
  'monthly',
  'yearly'
);

-- Organization subscriptions
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  status subscription_status NOT NULL DEFAULT 'trial',
  billing_period billing_period NOT NULL DEFAULT 'monthly',
  
  -- User counts and pricing
  user_count INTEGER NOT NULL DEFAULT 1,
  user_tier_price DECIMAL(10, 2) NOT NULL DEFAULT 0, -- Current per-user price based on tier
  
  -- Subscription dates
  trial_starts_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  trial_ends_at TIMESTAMPTZ DEFAULT (CURRENT_TIMESTAMP + INTERVAL '14 days'),
  current_period_start TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  current_period_end TIMESTAMPTZ DEFAULT (CURRENT_TIMESTAMP + INTERVAL '1 month'),
  canceled_at TIMESTAMPTZ,
  
  -- Pricing
  monthly_total DECIMAL(10, 2) DEFAULT 0,
  yearly_discount DECIMAL(4, 2) DEFAULT 0.20, -- 20% default yearly discount
  
  -- Payment info (for integration with payment processors)
  stripe_customer_id VARCHAR(255),
  stripe_subscription_id VARCHAR(255),
  payment_method_id VARCHAR(255),
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(organization_id)
);

-- Selected features for each subscription
CREATE TABLE IF NOT EXISTS public.subscription_features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID NOT NULL REFERENCES public.subscriptions(id) ON DELETE CASCADE,
  feature_id UUID NOT NULL REFERENCES public.features(id) ON DELETE CASCADE,
  
  -- Override pricing (for custom deals)
  custom_price DECIMAL(10, 2), -- NULL means use default feature price
  
  -- Feature-specific limits/settings
  limits JSONB DEFAULT '{}'::jsonb, -- e.g., {"max_forms": 100, "storage_gb": 50}
  
  enabled BOOLEAN DEFAULT true,
  added_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMPTZ, -- For temporary features/promotions
  
  UNIQUE(subscription_id, feature_id)
);

-- 3. BILLING AND INVOICES
-- =============================================

-- Invoice status enum
CREATE TYPE invoice_status AS ENUM (
  'draft',
  'pending',
  'paid',
  'partially_paid',
  'overdue',
  'canceled',
  'refunded'
);

-- Invoices table
CREATE TABLE IF NOT EXISTS public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  subscription_id UUID NOT NULL REFERENCES public.subscriptions(id) ON DELETE CASCADE,
  
  invoice_number VARCHAR(50) UNIQUE NOT NULL,
  status invoice_status NOT NULL DEFAULT 'pending',
  
  -- Billing period
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  
  -- Amounts
  subtotal DECIMAL(10, 2) NOT NULL DEFAULT 0,
  discount_amount DECIMAL(10, 2) DEFAULT 0,
  tax_amount DECIMAL(10, 2) DEFAULT 0,
  total_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
  amount_paid DECIMAL(10, 2) DEFAULT 0,
  amount_due DECIMAL(10, 2) NOT NULL DEFAULT 0,
  
  -- Dates
  issued_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  due_date DATE NOT NULL,
  paid_at TIMESTAMPTZ,
  
  -- Payment details
  stripe_invoice_id VARCHAR(255),
  payment_intent_id VARCHAR(255),
  
  -- Line items stored as JSONB for flexibility
  line_items JSONB NOT NULL DEFAULT '[]'::jsonb,
  
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Invoice line items (normalized view)
CREATE TABLE IF NOT EXISTS public.invoice_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  
  description TEXT NOT NULL,
  quantity INTEGER DEFAULT 1,
  unit_price DECIMAL(10, 2) NOT NULL,
  total_price DECIMAL(10, 2) NOT NULL,
  
  -- Reference to what's being charged
  feature_id UUID REFERENCES public.features(id) ON DELETE SET NULL,
  item_type VARCHAR(50) NOT NULL, -- 'feature', 'user_tier', 'addon', 'credit', 'discount'
  
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 4. USAGE TRACKING
-- =============================================

-- Track feature usage for analytics and limits
CREATE TABLE IF NOT EXISTS public.feature_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  feature_id UUID NOT NULL REFERENCES public.features(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Usage metrics
  usage_count INTEGER DEFAULT 1,
  usage_date DATE NOT NULL DEFAULT CURRENT_DATE,
  
  -- Additional metrics (feature-specific)
  metrics JSONB DEFAULT '{}'::jsonb, -- e.g., {"api_calls": 100, "storage_mb": 250}
  
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  
  -- Composite index for efficient queries
  UNIQUE(organization_id, feature_id, usage_date, user_id)
);

-- 5. PAYMENT METHODS
-- =============================================

CREATE TABLE IF NOT EXISTS public.payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  
  is_default BOOLEAN DEFAULT false,
  type VARCHAR(50) NOT NULL, -- 'card', 'bank_account', 'paypal'
  
  -- Card details (encrypted/tokenized in production)
  last_four VARCHAR(4),
  brand VARCHAR(50), -- 'visa', 'mastercard', etc.
  exp_month INTEGER,
  exp_year INTEGER,
  
  -- Billing address
  billing_name VARCHAR(255),
  billing_email VARCHAR(255),
  billing_address JSONB DEFAULT '{}'::jsonb,
  
  -- Payment processor references
  stripe_payment_method_id VARCHAR(255),
  
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 6. PROMOTIONAL CODES AND DISCOUNTS
-- =============================================

CREATE TABLE IF NOT EXISTS public.promo_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  
  -- Discount details
  discount_type VARCHAR(20) NOT NULL, -- 'percentage', 'fixed_amount'
  discount_value DECIMAL(10, 2) NOT NULL,
  
  -- Validity
  valid_from TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  valid_until TIMESTAMPTZ,
  max_uses INTEGER,
  current_uses INTEGER DEFAULT 0,
  
  -- Restrictions
  minimum_amount DECIMAL(10, 2), -- Minimum subscription amount
  applicable_features UUID[], -- Specific features this applies to
  new_customers_only BOOLEAN DEFAULT false,
  
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Applied promo codes
CREATE TABLE IF NOT EXISTS public.applied_promos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID NOT NULL REFERENCES public.subscriptions(id) ON DELETE CASCADE,
  promo_code_id UUID NOT NULL REFERENCES public.promo_codes(id) ON DELETE CASCADE,
  
  applied_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMPTZ,
  
  UNIQUE(subscription_id, promo_code_id)
);

-- 7. INSERT DEFAULT DATA
-- =============================================

-- Insert user tier pricing
INSERT INTO public.user_tier_pricing (min_users, max_users, price_per_user, tier_name) VALUES
  (1, 10, 0, 'Starter (1-10 users)'),
  (11, 50, 2, 'Small Team (11-50 users)'),
  (51, 200, 4, 'Medium Team (51-200 users)'),
  (201, NULL, 6, 'Large Team (201+ users)')
ON CONFLICT (min_users, max_users) DO NOTHING;

-- Insert features
INSERT INTO public.features (feature_key, name, description, category, is_free, base_price, billing_unit, is_popular, dependencies) VALUES
  -- Core Features (Free)
  ('team_management', 'Team Management', 'Create and manage teams, assign roles, and organize your workforce', 'core', true, 0, 'organization', false, '[]'),
  ('basic_attendance', 'Basic Attendance', 'Clock in/out tracking, basic attendance reports', 'core', true, 0, 'organization', false, '[]'),
  ('overview_dashboard', 'Overview Dashboard', 'Essential metrics and team overview', 'core', true, 0, 'organization', false, '[]'),
  ('basic_tasks', 'Basic Task Management', 'Create, assign, and track simple tasks', 'core', true, 0, 'organization', false, '[]'),
  ('mobile_app', 'Mobile App Access', 'iOS and Android mobile applications', 'core', true, 0, 'organization', false, '[]'),
  
  -- Productivity Features
  ('advanced_tasks', 'Advanced Task Management', 'Workflows, dependencies, custom fields, and automation', 'productivity', false, 3, 'user', true, '[]'),
  ('time_tracking', 'Time Tracking', 'Detailed time tracking, timesheets, and billing integration', 'productivity', false, 2, 'user', false, '[]'),
  ('advanced_forms', 'Advanced Forms', 'Custom form builder, conditional logic, and AI form scanner', 'productivity', false, 4, 'user', true, '[]'),
  ('leave_management', 'Leave Management', 'Leave requests, approvals, balances, and calendar integration', 'productivity', false, 2, 'user', false, '[]'),
  ('workflow_automation', 'Workflow Automation', 'Automate repetitive tasks and business processes', 'productivity', false, 5, 'user', false, '[]'),
  ('site_outlet_visits', 'Site/Outlet Visits', 'Track field visits, retail audits, customer check-ins with photo verification', 'productivity', false, 3, 'user', true, '[]'),
  
  -- Analytics Features
  ('advanced_analytics', 'Advanced Analytics', 'Detailed insights, custom dashboards, and predictive analytics', 'analytics', false, 50, 'organization', false, '[]'),
  ('custom_reports', 'Custom Reports', 'Build custom reports, scheduled delivery, and data exports', 'analytics', false, 30, 'organization', false, '[]'),
  ('performance_tracking', 'Performance Tracking', 'Employee performance metrics and KPI monitoring', 'analytics', false, 40, 'organization', false, '[]'),
  
  -- Location Features
  ('gps_tracking', 'GPS Tracking', 'Real-time location tracking and geofencing', 'location', false, 3, 'user', false, '[]'),
  ('route_optimization', 'Route Optimization', 'AI-powered route planning and optimization', 'location', false, 4, 'user', false, '["gps_tracking"]'),
  
  -- Integration Features
  ('ai_form_scanner', 'AI Form Scanner', 'Convert paper forms to digital instantly using Claude AI vision technology', 'integration', false, 50, 'organization', true, '[]'),
  ('api_access', 'API Access', 'RESTful API access for custom integrations', 'integration', false, 75, 'organization', false, '[]'),
  ('sso_integration', 'SSO & LDAP', 'Single sign-on and enterprise authentication', 'integration', false, 100, 'organization', false, '[]'),
  ('custom_integrations', 'Custom Integrations', 'Bespoke integrations with your existing systems', 'integration', false, 250, 'organization', false, '[]'),
  
  -- Support Features
  ('priority_support', 'Priority Support', '24/7 chat and email support with faster response times', 'support', false, 75, 'organization', false, '[]'),
  ('dedicated_manager', 'Dedicated Account Manager', 'Personal account manager for enterprise support', 'support', false, 500, 'organization', false, '[]')
ON CONFLICT (feature_key) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  base_price = EXCLUDED.base_price,
  is_popular = EXCLUDED.is_popular;

-- 8. FUNCTIONS AND TRIGGERS
-- =============================================

-- Function to calculate subscription total
CREATE OR REPLACE FUNCTION calculate_subscription_total(sub_id UUID)
RETURNS DECIMAL AS $$
DECLARE
  total DECIMAL(10, 2) := 0;
  user_count INTEGER;
  user_price DECIMAL(10, 2);
  feature_total DECIMAL(10, 2) := 0;
  yearly_multiplier DECIMAL(4, 2);
BEGIN
  -- Get subscription details
  SELECT s.user_count, s.user_tier_price, 
         CASE WHEN s.billing_period = 'yearly' THEN (1 - s.yearly_discount) ELSE 1 END
  INTO user_count, user_price, yearly_multiplier
  FROM subscriptions s
  WHERE s.id = sub_id;
  
  -- Calculate user tier cost
  total := user_count * user_price;
  
  -- Add feature costs
  SELECT COALESCE(SUM(
    CASE 
      WHEN f.billing_unit = 'user' THEN 
        COALESCE(sf.custom_price, f.base_price) * user_count
      ELSE 
        COALESCE(sf.custom_price, f.base_price)
    END
  ), 0)
  INTO feature_total
  FROM subscription_features sf
  JOIN features f ON f.id = sf.feature_id
  WHERE sf.subscription_id = sub_id
    AND sf.enabled = true
    AND f.is_free = false;
  
  total := total + feature_total;
  
  -- Apply yearly discount if applicable
  IF yearly_multiplier < 1 THEN
    total := total * 12 * yearly_multiplier; -- Annual total with discount
  END IF;
  
  RETURN total;
END;
$$ LANGUAGE plpgsql;

-- Function to check feature access
CREATE OR REPLACE FUNCTION has_feature_access(org_id UUID, feature_key_param VARCHAR)
RETURNS BOOLEAN AS $$
DECLARE
  has_access BOOLEAN := false;
  is_free_feature BOOLEAN := false;
BEGIN
  -- Check if it's a free feature
  SELECT f.is_free INTO is_free_feature
  FROM features f
  WHERE f.feature_key = feature_key_param;
  
  IF is_free_feature THEN
    RETURN true;
  END IF;
  
  -- Check if organization has this feature in their subscription
  SELECT EXISTS(
    SELECT 1
    FROM subscriptions s
    JOIN subscription_features sf ON sf.subscription_id = s.id
    JOIN features f ON f.id = sf.feature_id
    WHERE s.organization_id = org_id
      AND f.feature_key = feature_key_param
      AND sf.enabled = true
      AND s.status IN ('trial', 'active')
      AND (sf.expires_at IS NULL OR sf.expires_at > NOW())
  ) INTO has_access;
  
  RETURN has_access;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update subscription monthly total on changes
CREATE OR REPLACE FUNCTION update_subscription_total()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE subscriptions
  SET monthly_total = calculate_subscription_total(NEW.subscription_id),
      updated_at = CURRENT_TIMESTAMP
  WHERE id = NEW.subscription_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_subscription_total_on_feature_change
AFTER INSERT OR UPDATE OR DELETE ON subscription_features
FOR EACH ROW
EXECUTE FUNCTION update_subscription_total();

-- 9. ROW LEVEL SECURITY
-- =============================================

-- Enable RLS on all tables
ALTER TABLE public.features ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_tier_pricing ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applied_promos ENABLE ROW LEVEL SECURITY;

-- Features and tier pricing are public read
CREATE POLICY "Features are viewable by all" ON public.features
  FOR SELECT USING (true);

CREATE POLICY "User tier pricing is viewable by all" ON public.user_tier_pricing
  FOR SELECT USING (true);

-- Subscriptions policies
CREATE POLICY "Users can view their organization subscription" ON public.subscriptions
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Only admins can manage subscriptions" ON public.subscriptions
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Subscription features policies
CREATE POLICY "Users can view their subscription features" ON public.subscription_features
  FOR SELECT USING (
    subscription_id IN (
      SELECT id FROM public.subscriptions WHERE organization_id IN (
        SELECT organization_id FROM public.profiles WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Only admins can manage subscription features" ON public.subscription_features
  FOR ALL USING (
    subscription_id IN (
      SELECT id FROM public.subscriptions WHERE organization_id IN (
        SELECT organization_id FROM public.profiles 
        WHERE id = auth.uid() AND role = 'admin'
      )
    )
  );

-- Invoices policies
CREATE POLICY "Users can view their organization invoices" ON public.invoices
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- Feature usage policies
CREATE POLICY "Organizations can track their own usage" ON public.feature_usage
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- Payment methods policies  
CREATE POLICY "Only admins can manage payment methods" ON public.payment_methods
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 10. INDEXES FOR PERFORMANCE
-- =============================================

CREATE INDEX idx_subscriptions_organization ON public.subscriptions(organization_id);
CREATE INDEX idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX idx_subscription_features_subscription ON public.subscription_features(subscription_id);
CREATE INDEX idx_subscription_features_feature ON public.subscription_features(feature_id);
CREATE INDEX idx_invoices_organization ON public.invoices(organization_id);
CREATE INDEX idx_invoices_status ON public.invoices(status);
CREATE INDEX idx_feature_usage_org_feature_date ON public.feature_usage(organization_id, feature_id, usage_date);
CREATE INDEX idx_payment_methods_organization ON public.payment_methods(organization_id);

-- 11. HELPER VIEWS
-- =============================================

-- View for current subscription status with features
CREATE OR REPLACE VIEW subscription_overview AS
SELECT 
  s.id as subscription_id,
  s.organization_id,
  o.name as organization_name,
  s.status,
  s.billing_period,
  s.user_count,
  s.monthly_total,
  s.trial_ends_at,
  s.current_period_end,
  COUNT(DISTINCT sf.feature_id) FILTER (WHERE sf.enabled = true) as active_features_count,
  ARRAY_AGG(DISTINCT f.feature_key) FILTER (WHERE sf.enabled = true) as active_features
FROM subscriptions s
JOIN organizations o ON o.id = s.organization_id
LEFT JOIN subscription_features sf ON sf.subscription_id = s.id
LEFT JOIN features f ON f.id = sf.feature_id
GROUP BY s.id, s.organization_id, o.name, s.status, s.billing_period, 
         s.user_count, s.monthly_total, s.trial_ends_at, s.current_period_end;

COMMENT ON TABLE public.features IS 'Master list of all available features and their pricing';
COMMENT ON TABLE public.subscriptions IS 'Organization subscription details and billing information';
COMMENT ON TABLE public.subscription_features IS 'Features selected by each organization';
COMMENT ON TABLE public.invoices IS 'Billing invoices for organizations';
COMMENT ON TABLE public.feature_usage IS 'Track usage metrics for features';
COMMENT ON FUNCTION has_feature_access IS 'Check if an organization has access to a specific feature';
COMMENT ON FUNCTION calculate_subscription_total IS 'Calculate the total subscription cost including all features';