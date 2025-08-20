-- =============================================
-- PRODUCT SYSTEM ARCHITECTURE
-- Creates the foundation for WorkforceOne Remote, Time, and Guard
-- =============================================

-- ===== PRODUCTS TABLE =====
-- Defines the three main products
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL, -- 'remote', 'time', 'guard'
    name TEXT NOT NULL,
    display_name TEXT NOT NULL,
    description TEXT,
    category TEXT DEFAULT 'core',
    
    -- Pricing
    price_monthly DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    price_annual DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    
    -- UI Configuration
    color_theme TEXT, -- hex color for product theming
    icon_name TEXT, -- lucide icon name
    sort_order INTEGER DEFAULT 0,
    
    -- Features and Configuration
    features JSONB NOT NULL DEFAULT '{}',
    settings JSONB DEFAULT '{}',
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    is_beta BOOLEAN DEFAULT false,
    min_users INTEGER DEFAULT 1,
    max_users INTEGER, -- NULL = unlimited
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert the three core products
INSERT INTO products (code, name, display_name, description, price_monthly, price_annual, color_theme, icon_name, sort_order, features) VALUES
('remote', 'WorkforceOne Remote', 'Remote', 'Complete remote workforce management platform with teams, tasks, projects, and forms', 8.00, 76.80, '#3B82F6', 'Users', 1, 
 '{"teams": true, "tasks": true, "projects": true, "forms": true, "announcements": true, "workflows": true, "routes": true, "outlets": true}'::jsonb),
('time', 'WorkforceOne Time', 'Time', 'Advanced time tracking and attendance management with leave, payroll, and scheduling', 6.00, 57.60, '#10B981', 'Clock', 2,
 '{"attendance": true, "time_tracking": true, "leave": true, "payslips": true, "schedules": true, "reminders": true, "reporting": true}'::jsonb),
('guard', 'WorkforceOne Guard', 'Guard', 'Professional security patrol management with real-time tracking, incidents, and compliance', 12.00, 115.20, '#F97316', 'Shield', 3,
 '{"patrol": true, "checkpoints": true, "incidents": true, "real_time_tracking": true, "emergency": true, "compliance": true, "analytics": true}'::jsonb);

-- ===== ORGANIZATION SUBSCRIPTIONS TABLE =====
-- Tracks which products each organization has access to
CREATE TABLE organization_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    
    -- Subscription Status
    status TEXT CHECK (status IN ('trial', 'active', 'past_due', 'cancelled', 'suspended', 'paused')) DEFAULT 'trial',
    
    -- Trial Information
    trial_starts_at TIMESTAMPTZ DEFAULT NOW(),
    trial_ends_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '14 days'),
    trial_extended BOOLEAN DEFAULT false,
    trial_extension_reason TEXT,
    
    -- Billing Period
    billing_period TEXT CHECK (billing_period IN ('monthly', 'annual')) DEFAULT 'monthly',
    current_period_start TIMESTAMPTZ DEFAULT NOW(),
    current_period_end TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '1 month'),
    
    -- Cancellation
    cancel_at_period_end BOOLEAN DEFAULT false,
    cancelled_at TIMESTAMPTZ,
    cancellation_reason TEXT,
    
    -- Stripe Integration
    stripe_subscription_id TEXT UNIQUE,
    stripe_price_id TEXT,
    stripe_customer_id TEXT,
    
    -- Usage
    user_count INTEGER DEFAULT 1,
    max_users INTEGER, -- NULL = unlimited
    usage_limits JSONB DEFAULT '{}',
    
    -- Pricing
    unit_price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    discount_percentage DECIMAL(5,2) DEFAULT 0.00,
    custom_price DECIMAL(10,2), -- For enterprise/custom deals
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(organization_id, product_id)
);

-- ===== USER PRODUCT ACCESS TABLE =====
-- Tracks individual user access to products within organizations
CREATE TABLE user_product_access (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    
    -- Access Control
    is_active BOOLEAN DEFAULT true,
    granted_at TIMESTAMPTZ DEFAULT NOW(),
    granted_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    revoked_at TIMESTAMPTZ,
    revoked_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    revoke_reason TEXT,
    
    -- Usage Tracking
    first_used_at TIMESTAMPTZ,
    last_used_at TIMESTAMPTZ,
    total_usage_minutes INTEGER DEFAULT 0,
    
    -- Permissions (product-specific role overrides)
    permissions JSONB DEFAULT '{}',
    restrictions JSONB DEFAULT '{}',
    
    -- Metadata
    notes TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, product_id)
);

-- ===== PRODUCT FEATURES TABLE =====
-- Defines available features per product
CREATE TABLE product_features (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    
    -- Feature Definition
    feature_key TEXT NOT NULL, -- 'teams', 'tasks', 'patrol', etc.
    feature_name TEXT NOT NULL,
    description TEXT,
    category TEXT DEFAULT 'core',
    
    -- Availability
    is_enabled BOOLEAN DEFAULT true,
    is_beta BOOLEAN DEFAULT false,
    requires_upgrade BOOLEAN DEFAULT false,
    min_tier TEXT DEFAULT 'basic',
    
    -- Usage Limits
    usage_limits JSONB DEFAULT '{}', -- {"max_items": 100, "max_users": 10}
    
    -- Dependencies
    depends_on JSONB DEFAULT '[]', -- ["feature1", "feature2"]
    conflicts_with JSONB DEFAULT '[]',
    
    -- Metadata
    sort_order INTEGER DEFAULT 0,
    documentation_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(product_id, feature_key)
);

-- ===== BILLING HISTORY TABLE =====
-- Tracks all billing events across products
CREATE TABLE billing_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES organization_subscriptions(id) ON DELETE CASCADE,
    
    -- Event Information
    event_type TEXT NOT NULL, -- 'subscription_created', 'payment_succeeded', 'invoice_generated', etc.
    event_date TIMESTAMPTZ DEFAULT NOW(),
    
    -- Financial Data
    amount DECIMAL(10,2) DEFAULT 0.00,
    currency TEXT DEFAULT 'USD',
    tax_amount DECIMAL(10,2) DEFAULT 0.00,
    discount_amount DECIMAL(10,2) DEFAULT 0.00,
    
    -- Period Information
    period_start DATE,
    period_end DATE,
    user_count INTEGER,
    
    -- Integration Data
    stripe_event_id TEXT,
    stripe_invoice_id TEXT,
    stripe_payment_intent_id TEXT,
    
    -- Status
    status TEXT DEFAULT 'completed',
    error_message TEXT,
    
    -- Metadata
    event_data JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===== USAGE TRACKING TABLE =====
-- Tracks product usage for analytics and billing
CREATE TABLE product_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    
    -- Usage Data
    feature_key TEXT NOT NULL,
    action_type TEXT NOT NULL, -- 'create', 'update', 'delete', 'view', etc.
    usage_date DATE DEFAULT CURRENT_DATE,
    usage_count INTEGER DEFAULT 1,
    
    -- Context
    entity_type TEXT, -- 'task', 'form', 'patrol', etc.
    entity_id UUID,
    session_duration INTEGER, -- minutes
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Composite index for fast queries
    CONSTRAINT usage_tracking_date_check CHECK (usage_date <= CURRENT_DATE)
);

-- ===== PRODUCT TIERS TABLE =====
-- Defines pricing tiers (Basic, Pro, Enterprise)
CREATE TABLE product_tiers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    
    -- Tier Information
    tier_code TEXT NOT NULL, -- 'basic', 'pro', 'enterprise'
    tier_name TEXT NOT NULL,
    description TEXT,
    
    -- Pricing
    price_monthly DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    price_annual DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    setup_fee DECIMAL(10,2) DEFAULT 0.00,
    
    -- Limits
    max_users INTEGER,
    feature_limits JSONB DEFAULT '{}',
    
    -- Availability
    is_active BOOLEAN DEFAULT true,
    is_popular BOOLEAN DEFAULT false,
    sort_order INTEGER DEFAULT 0,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(product_id, tier_code)
);

-- Insert basic tiers for each product
INSERT INTO product_tiers (product_id, tier_code, tier_name, description, price_monthly, price_annual, is_popular) VALUES
((SELECT id FROM products WHERE code = 'remote'), 'basic', 'Basic', 'Essential remote workforce management', 8.00, 76.80, true),
((SELECT id FROM products WHERE code = 'time'), 'basic', 'Basic', 'Core time tracking and attendance', 6.00, 57.60, true),
((SELECT id FROM products WHERE code = 'guard'), 'basic', 'Basic', 'Professional security management', 12.00, 115.20, true);

-- ===== CREATE INDEXES =====

-- Organization subscriptions indexes
CREATE INDEX idx_org_subscriptions_org_id ON organization_subscriptions(organization_id);
CREATE INDEX idx_org_subscriptions_product_id ON organization_subscriptions(product_id);
CREATE INDEX idx_org_subscriptions_status ON organization_subscriptions(status);
CREATE INDEX idx_org_subscriptions_stripe ON organization_subscriptions(stripe_subscription_id);

-- User product access indexes
CREATE INDEX idx_user_product_access_user_id ON user_product_access(user_id);
CREATE INDEX idx_user_product_access_org_id ON user_product_access(organization_id);
CREATE INDEX idx_user_product_access_product_id ON user_product_access(product_id);
CREATE INDEX idx_user_product_access_active ON user_product_access(is_active);

-- Product features indexes
CREATE INDEX idx_product_features_product_id ON product_features(product_id);
CREATE INDEX idx_product_features_key ON product_features(feature_key);
CREATE INDEX idx_product_features_enabled ON product_features(is_enabled);

-- Usage tracking indexes
CREATE INDEX idx_product_usage_org_date ON product_usage(organization_id, usage_date);
CREATE INDEX idx_product_usage_user_date ON product_usage(user_id, usage_date);
CREATE INDEX idx_product_usage_product_date ON product_usage(product_id, usage_date);
CREATE INDEX idx_product_usage_feature_date ON product_usage(feature_key, usage_date);

-- Billing history indexes
CREATE INDEX idx_billing_history_org_id ON billing_history(organization_id);
CREATE INDEX idx_billing_history_subscription_id ON billing_history(subscription_id);
CREATE INDEX idx_billing_history_date ON billing_history(event_date);
CREATE INDEX idx_billing_history_stripe ON billing_history(stripe_event_id);

-- ===== ENABLE ROW LEVEL SECURITY =====

ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_product_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_tiers ENABLE ROW LEVEL SECURITY;

-- ===== RLS POLICIES =====

-- Products: Public read access, admin write access
CREATE POLICY "products_public_read" ON products
    FOR SELECT USING (true);

CREATE POLICY "products_admin_write" ON products
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

-- Organization subscriptions: Organization access only
CREATE POLICY "org_subscriptions_org_access" ON organization_subscriptions
    FOR ALL TO authenticated
    USING (
        organization_id IN (
            SELECT p.organization_id 
            FROM profiles p 
            WHERE p.id = auth.uid()
        )
    );

-- User product access: Self and org admin access
CREATE POLICY "user_product_access_self" ON user_product_access
    FOR SELECT TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "user_product_access_org_admin" ON user_product_access
    FOR ALL TO authenticated
    USING (
        organization_id IN (
            SELECT p.organization_id 
            FROM profiles p 
            WHERE p.id = auth.uid() 
            AND p.role IN ('admin', 'manager')
        )
    );

-- Product features: Public read access
CREATE POLICY "product_features_public_read" ON product_features
    FOR SELECT USING (true);

-- Billing history: Organization access only
CREATE POLICY "billing_history_org_access" ON billing_history
    FOR ALL TO authenticated
    USING (
        organization_id IN (
            SELECT p.organization_id 
            FROM profiles p 
            WHERE p.id = auth.uid()
        )
    );

-- Product usage: Self and org admin access
CREATE POLICY "product_usage_self" ON product_usage
    FOR SELECT TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "product_usage_org_admin" ON product_usage
    FOR ALL TO authenticated
    USING (
        organization_id IN (
            SELECT p.organization_id 
            FROM profiles p 
            WHERE p.id = auth.uid() 
            AND p.role IN ('admin', 'manager')
        )
    );

-- Product tiers: Public read access
CREATE POLICY "product_tiers_public_read" ON product_tiers
    FOR SELECT USING (true);

-- ===== GRANT PERMISSIONS =====

-- Grant table access
GRANT SELECT ON products TO authenticated, anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON organization_subscriptions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON user_product_access TO authenticated;
GRANT SELECT ON product_features TO authenticated, anon;
GRANT SELECT, INSERT ON billing_history TO authenticated;
GRANT SELECT, INSERT ON product_usage TO authenticated;
GRANT SELECT ON product_tiers TO authenticated, anon;

-- Grant sequence access
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Success message
SELECT 'Product system tables created successfully!' as status;