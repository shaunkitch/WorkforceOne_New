-- ============================================
-- COMPREHENSIVE RBAC & FEATURE MANAGEMENT SYSTEM
-- Migration: 084_comprehensive_rbac_system.sql
-- ============================================

-- Create roles table for system-wide roles
CREATE TABLE IF NOT EXISTS roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL UNIQUE,
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    is_system_role BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create features table for all product features
CREATE TABLE IF NOT EXISTS features (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key VARCHAR(100) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    product_id VARCHAR(50) NOT NULL, -- guard-management, workforce-management, time-tracker
    category VARCHAR(50), -- dashboard, reports, admin, etc.
    is_core_feature BOOLEAN DEFAULT FALSE, -- Cannot be disabled
    requires_subscription BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create permissions table
CREATE TABLE IF NOT EXISTS permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key VARCHAR(100) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    resource VARCHAR(100) NOT NULL, -- What resource this applies to
    action VARCHAR(50) NOT NULL, -- read, write, delete, admin
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create role_permissions junction table
CREATE TABLE IF NOT EXISTS role_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    granted_at TIMESTAMPTZ DEFAULT NOW(),
    granted_by UUID REFERENCES profiles(id),
    UNIQUE(role_id, permission_id)
);

-- Create user_roles junction table
CREATE TABLE IF NOT EXISTS user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id),
    granted_at TIMESTAMPTZ DEFAULT NOW(),
    granted_by UUID REFERENCES profiles(id),
    expires_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT TRUE,
    UNIQUE(user_id, role_id, organization_id)
);

-- Create organization_features for per-org feature control
CREATE TABLE IF NOT EXISTS organization_features (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    feature_id UUID NOT NULL REFERENCES features(id) ON DELETE CASCADE,
    is_enabled BOOLEAN DEFAULT TRUE,
    enabled_at TIMESTAMPTZ DEFAULT NOW(),
    enabled_by UUID REFERENCES profiles(id),
    settings JSONB, -- Feature-specific settings
    UNIQUE(organization_id, feature_id)
);

-- Create user_feature_overrides for individual user feature control
CREATE TABLE IF NOT EXISTS user_feature_overrides (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    feature_id UUID NOT NULL REFERENCES features(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id),
    is_enabled BOOLEAN NOT NULL,
    reason TEXT,
    overridden_at TIMESTAMPTZ DEFAULT NOW(),
    overridden_by UUID REFERENCES profiles(id),
    expires_at TIMESTAMPTZ,
    UNIQUE(user_id, feature_id, organization_id)
);

-- Insert default system roles
INSERT INTO roles (name, display_name, description, is_system_role) VALUES
('super_admin', 'Super Administrator', 'Full system access across all organizations', TRUE),
('org_admin', 'Organization Administrator', 'Full access within organization', TRUE),
('manager', 'Manager', 'Management access to assigned areas', TRUE),
('supervisor', 'Supervisor', 'Supervision access with limited admin features', TRUE),
('employee', 'Employee', 'Standard employee access', TRUE),
('guard', 'Security Guard', 'Security guard with field access', TRUE),
('rep', 'Sales Representative', 'Sales and client management access', TRUE),
('viewer', 'Viewer', 'Read-only access to assigned areas', TRUE)
ON CONFLICT (name) DO NOTHING;

-- Insert core features for Guard Management
INSERT INTO features (key, name, description, product_id, category, is_core_feature) VALUES
-- Guard Dashboard & Core
('guard.dashboard', 'Guard Dashboard', 'Access to guard dashboard and overview', 'guard-management', 'dashboard', TRUE),
('guard.checkin', 'Check-In System', 'QR code and manual check-ins', 'guard-management', 'operations', TRUE),
('guard.patrol', 'Patrol Management', 'Start/end patrols and route management', 'guard-management', 'operations', TRUE),
('guard.incidents', 'Incident Reporting', 'Report and manage security incidents', 'guard-management', 'operations', TRUE),
('guard.emergency', 'Emergency Functions', 'Emergency alerts and panic buttons', 'guard-management', 'safety', TRUE),

-- Guard Advanced Features
('guard.kpi', 'KPI & Performance', 'View performance metrics and targets', 'guard-management', 'analytics', FALSE),
('guard.sites', 'Site Management', 'Manage guard sites and locations', 'guard-management', 'admin', FALSE),
('guard.backup', 'Request Backup', 'Request backup and assistance', 'guard-management', 'operations', FALSE),
('guard.reports', 'Guard Reports', 'Generate and view guard reports', 'guard-management', 'reports', FALSE),
('guard.admin', 'Guard Administration', 'Admin functions for guard management', 'guard-management', 'admin', FALSE),

-- Workforce Management Features
('workforce.dashboard', 'Workforce Dashboard', 'Access to workforce overview', 'workforce-management', 'dashboard', TRUE),
('workforce.teams', 'Team Management', 'Manage teams and team members', 'workforce-management', 'management', FALSE),
('workforce.projects', 'Project Management', 'Create and manage projects', 'workforce-management', 'management', FALSE),
('workforce.tasks', 'Task Management', 'Assign and track tasks', 'workforce-management', 'operations', FALSE),
('workforce.attendance', 'Attendance Tracking', 'Track employee attendance', 'workforce-management', 'operations', FALSE),
('workforce.leave', 'Leave Management', 'Manage leave requests and approvals', 'workforce-management', 'management', FALSE),
('workforce.payroll', 'Payroll Access', 'Access payroll information', 'workforce-management', 'admin', FALSE),
('workforce.reports', 'Workforce Reports', 'Generate workforce analytics', 'workforce-management', 'reports', FALSE),

-- Time Tracking Features
('time.dashboard', 'Time Dashboard', 'Access to time tracking overview', 'time-tracker', 'dashboard', TRUE),
('time.tracking', 'Time Tracking', 'Track work time and breaks', 'time-tracker', 'operations', TRUE),
('time.timesheets', 'Timesheets', 'View and manage timesheets', 'time-tracker', 'operations', FALSE),
('time.reports', 'Time Reports', 'Generate time tracking reports', 'time-tracker', 'reports', FALSE),
('time.admin', 'Time Administration', 'Admin functions for time tracking', 'time-tracker', 'admin', FALSE)

ON CONFLICT (key) DO NOTHING;

-- Insert core permissions
INSERT INTO permissions (key, name, description, resource, action) VALUES
-- System permissions
('system.admin', 'System Administration', 'Full system administration access', 'system', 'admin'),
('system.settings', 'System Settings', 'Access system settings and configuration', 'system', 'write'),

-- Organization permissions
('org.admin', 'Organization Admin', 'Full organization administration', 'organization', 'admin'),
('org.settings', 'Organization Settings', 'Manage organization settings', 'organization', 'write'),
('org.users.manage', 'Manage Users', 'Add, edit, and remove users', 'users', 'write'),
('org.roles.assign', 'Assign Roles', 'Assign roles to users', 'roles', 'write'),
('org.features.manage', 'Manage Features', 'Enable/disable features for organization', 'features', 'write'),

-- Guard permissions
('guard.view', 'View Guard Data', 'View guard information and activities', 'guard', 'read'),
('guard.manage', 'Manage Guards', 'Manage guard assignments and schedules', 'guard', 'write'),
('guard.reports.view', 'View Guard Reports', 'View guard reports and analytics', 'guard_reports', 'read'),
('guard.admin', 'Guard Administration', 'Administrative access to guard system', 'guard', 'admin'),

-- Workforce permissions
('workforce.view', 'View Workforce Data', 'View workforce information', 'workforce', 'read'),
('workforce.manage', 'Manage Workforce', 'Manage teams and employees', 'workforce', 'write'),
('workforce.reports.view', 'View Workforce Reports', 'View workforce analytics', 'workforce_reports', 'read'),
('workforce.admin', 'Workforce Administration', 'Administrative access to workforce system', 'workforce', 'admin'),

-- Time tracking permissions
('time.view', 'View Time Data', 'View time tracking information', 'time', 'read'),
('time.manage', 'Manage Time Tracking', 'Manage time entries and approvals', 'time', 'write'),
('time.reports.view', 'View Time Reports', 'View time tracking reports', 'time_reports', 'read'),
('time.admin', 'Time Administration', 'Administrative access to time tracking', 'time', 'admin')

ON CONFLICT (key) DO NOTHING;

-- Assign permissions to default roles
DO $$
DECLARE
    super_admin_role_id UUID;
    org_admin_role_id UUID;
    manager_role_id UUID;
    supervisor_role_id UUID;
    employee_role_id UUID;
    guard_role_id UUID;
    rep_role_id UUID;
    viewer_role_id UUID;
BEGIN
    -- Get role IDs
    SELECT id INTO super_admin_role_id FROM roles WHERE name = 'super_admin';
    SELECT id INTO org_admin_role_id FROM roles WHERE name = 'org_admin';
    SELECT id INTO manager_role_id FROM roles WHERE name = 'manager';
    SELECT id INTO supervisor_role_id FROM roles WHERE name = 'supervisor';
    SELECT id INTO employee_role_id FROM roles WHERE name = 'employee';
    SELECT id INTO guard_role_id FROM roles WHERE name = 'guard';
    SELECT id INTO rep_role_id FROM roles WHERE name = 'rep';
    SELECT id INTO viewer_role_id FROM roles WHERE name = 'viewer';

    -- Super Admin gets all permissions
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT super_admin_role_id, id FROM permissions
    ON CONFLICT DO NOTHING;

    -- Organization Admin gets org-level permissions
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT org_admin_role_id, id FROM permissions 
    WHERE key NOT LIKE 'system.%'
    ON CONFLICT DO NOTHING;

    -- Manager gets management permissions
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT manager_role_id, id FROM permissions 
    WHERE key IN (
        'org.settings', 'org.users.manage', 'org.features.manage',
        'guard.manage', 'guard.reports.view',
        'workforce.manage', 'workforce.reports.view',
        'time.manage', 'time.reports.view'
    )
    ON CONFLICT DO NOTHING;

    -- Supervisor gets view and limited manage permissions
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT supervisor_role_id, id FROM permissions 
    WHERE key IN (
        'guard.view', 'guard.manage', 'guard.reports.view',
        'workforce.view', 'workforce.manage',
        'time.view', 'time.manage'
    )
    ON CONFLICT DO NOTHING;

    -- Employee gets basic workforce and time permissions
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT employee_role_id, id FROM permissions 
    WHERE key IN (
        'workforce.view', 'time.view'
    )
    ON CONFLICT DO NOTHING;

    -- Guard gets guard-specific permissions
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT guard_role_id, id FROM permissions 
    WHERE key IN (
        'guard.view'
    )
    ON CONFLICT DO NOTHING;

    -- Rep gets sales-related permissions
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT rep_role_id, id FROM permissions 
    WHERE key IN (
        'workforce.view', 'workforce.reports.view',
        'time.view', 'time.reports.view'
    )
    ON CONFLICT DO NOTHING;

    -- Viewer gets read-only permissions
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT viewer_role_id, id FROM permissions 
    WHERE action = 'read'
    ON CONFLICT DO NOTHING;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_organization_id ON user_roles(organization_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_active ON user_roles(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_role_permissions_role_id ON role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_organization_features_org_id ON organization_features(organization_id);
CREATE INDEX IF NOT EXISTS idx_organization_features_enabled ON organization_features(is_enabled) WHERE is_enabled = TRUE;
CREATE INDEX IF NOT EXISTS idx_user_feature_overrides_user_id ON user_feature_overrides(user_id);
CREATE INDEX IF NOT EXISTS idx_features_product_id ON features(product_id);
CREATE INDEX IF NOT EXISTS idx_features_category ON features(category);

-- Enable RLS on all RBAC tables
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE features ENABLE ROW LEVEL SECURITY;
ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_feature_overrides ENABLE ROW LEVEL SECURITY;

-- Create RLS policies

-- Roles: Visible to authenticated users, manageable by admins
CREATE POLICY "roles_select_policy" ON roles FOR SELECT TO authenticated USING (true);
CREATE POLICY "roles_insert_policy" ON roles FOR INSERT TO authenticated 
    WITH CHECK (EXISTS(
        SELECT 1 FROM user_roles ur 
        JOIN role_permissions rp ON ur.role_id = rp.role_id 
        JOIN permissions p ON rp.permission_id = p.id 
        WHERE ur.user_id = auth.uid() 
        AND p.key IN ('system.admin', 'org.admin')
        AND ur.is_active = TRUE
    ));

-- Features: Readable by all, manageable by feature admins
CREATE POLICY "features_select_policy" ON features FOR SELECT TO authenticated USING (true);
CREATE POLICY "features_manage_policy" ON features FOR ALL TO authenticated 
    USING (EXISTS(
        SELECT 1 FROM user_roles ur 
        JOIN role_permissions rp ON ur.role_id = rp.role_id 
        JOIN permissions p ON rp.permission_id = p.id 
        WHERE ur.user_id = auth.uid() 
        AND p.key IN ('system.admin', 'org.features.manage')
        AND ur.is_active = TRUE
    ));

-- Organization features: Organization-scoped access
CREATE POLICY "org_features_policy" ON organization_features FOR ALL TO authenticated 
    USING (
        organization_id IN (
            SELECT organization_id FROM profiles WHERE id = auth.uid()
        )
        OR EXISTS(
            SELECT 1 FROM user_roles ur 
            JOIN role_permissions rp ON ur.role_id = rp.role_id 
            JOIN permissions p ON rp.permission_id = p.id 
            WHERE ur.user_id = auth.uid() 
            AND p.key = 'system.admin'
            AND ur.is_active = TRUE
        )
    );

-- User roles: Users can see their own roles, admins can manage
CREATE POLICY "user_roles_select_policy" ON user_roles FOR SELECT TO authenticated 
    USING (
        user_id = auth.uid() 
        OR EXISTS(
            SELECT 1 FROM user_roles ur 
            JOIN role_permissions rp ON ur.role_id = rp.role_id 
            JOIN permissions p ON rp.permission_id = p.id 
            WHERE ur.user_id = auth.uid() 
            AND p.key IN ('system.admin', 'org.admin', 'org.roles.assign')
            AND ur.is_active = TRUE
        )
    );

CREATE POLICY "user_roles_manage_policy" ON user_roles FOR INSERT TO authenticated 
    WITH CHECK (EXISTS(
        SELECT 1 FROM user_roles ur 
        JOIN role_permissions rp ON ur.role_id = rp.role_id 
        JOIN permissions p ON rp.permission_id = p.id 
        WHERE ur.user_id = auth.uid() 
        AND p.key IN ('system.admin', 'org.admin', 'org.roles.assign')
        AND ur.is_active = TRUE
    ));

-- Create helper functions

-- Function to check if user has specific permission
CREATE OR REPLACE FUNCTION user_has_permission(user_uuid UUID, permission_key TEXT, org_uuid UUID DEFAULT NULL)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN EXISTS(
        SELECT 1 
        FROM user_roles ur
        JOIN role_permissions rp ON ur.role_id = rp.role_id
        JOIN permissions p ON rp.permission_id = p.id
        WHERE ur.user_id = user_uuid
        AND p.key = permission_key
        AND ur.is_active = TRUE
        AND (org_uuid IS NULL OR ur.organization_id = org_uuid OR ur.organization_id IS NULL)
        AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
    );
END;
$$;

-- Function to check if user has access to feature
CREATE OR REPLACE FUNCTION user_has_feature_access(user_uuid UUID, feature_key TEXT, org_uuid UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    feature_uuid UUID;
    org_enabled BOOLEAN := FALSE;
    user_override BOOLEAN;
BEGIN
    -- Get feature ID
    SELECT id INTO feature_uuid FROM features WHERE key = feature_key;
    IF feature_uuid IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Check if feature is enabled for organization
    SELECT is_enabled INTO org_enabled 
    FROM organization_features 
    WHERE organization_id = org_uuid AND feature_id = feature_uuid;
    
    -- If not explicitly set for org, default to enabled for core features
    IF org_enabled IS NULL THEN
        SELECT is_core_feature INTO org_enabled 
        FROM features 
        WHERE id = feature_uuid;
    END IF;
    
    -- Check for user-specific override
    SELECT is_enabled INTO user_override
    FROM user_feature_overrides 
    WHERE user_id = user_uuid 
    AND feature_id = feature_uuid 
    AND organization_id = org_uuid
    AND (expires_at IS NULL OR expires_at > NOW());
    
    -- Return override if exists, otherwise org setting
    RETURN COALESCE(user_override, org_enabled, FALSE);
END;
$$;

-- Function to get user's effective permissions
CREATE OR REPLACE FUNCTION get_user_permissions(user_uuid UUID, org_uuid UUID DEFAULT NULL)
RETURNS TABLE(permission_key TEXT, permission_name TEXT, resource TEXT, action TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT DISTINCT p.key, p.name, p.resource, p.action
    FROM user_roles ur
    JOIN role_permissions rp ON ur.role_id = rp.role_id
    JOIN permissions p ON rp.permission_id = p.id
    WHERE ur.user_id = user_uuid
    AND ur.is_active = TRUE
    AND (org_uuid IS NULL OR ur.organization_id = org_uuid OR ur.organization_id IS NULL)
    AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
    ORDER BY p.key;
END;
$$;

-- Update existing user_products to use new RBAC system
-- This will be handled by the application layer to maintain compatibility

COMMENT ON TABLE roles IS 'System and organization roles for RBAC';
COMMENT ON TABLE features IS 'All available features across all products';
COMMENT ON TABLE permissions IS 'Granular permissions for system resources';
COMMENT ON TABLE role_permissions IS 'Junction table mapping roles to permissions';
COMMENT ON TABLE user_roles IS 'User role assignments with organization scope';
COMMENT ON TABLE organization_features IS 'Organization-level feature toggles';
COMMENT ON TABLE user_feature_overrides IS 'Individual user feature access overrides';