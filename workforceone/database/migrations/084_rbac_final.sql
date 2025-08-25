-- ============================================
-- COMPATIBLE RBAC SYSTEM FOR EXISTING SCHEMA (FINAL)
-- Migration: 084_rbac_final.sql
-- Works with existing features and organizations tables
-- Handles existing policies gracefully
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

-- Insert default roles if they don't exist
INSERT INTO roles (name, display_name, description, is_system_role) VALUES
    ('super_admin', 'Super Admin', 'Full system access across all organizations', true),
    ('organization_admin', 'Organization Admin', 'Full access within organization', true),
    ('manager', 'Manager', 'Management access with reports and analytics', true),
    ('supervisor', 'Supervisor', 'Team supervision and limited management', true),
    ('employee', 'Employee', 'Standard employee access', true),
    ('guard', 'Security Guard', 'Security guard mobile app access', true),
    ('rep', 'Representative', 'Field representative access', true)
ON CONFLICT (name) DO NOTHING;

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

-- Insert basic permissions
INSERT INTO permissions (key, name, description, resource, action) VALUES
    ('users.read', 'View Users', 'View user profiles and information', 'users', 'read'),
    ('users.write', 'Manage Users', 'Create, update, and manage user accounts', 'users', 'write'),
    ('users.admin', 'Administer Users', 'Full user administration including roles', 'users', 'admin'),
    ('features.read', 'View Features', 'View organization feature settings', 'features', 'read'),
    ('features.write', 'Manage Features', 'Enable/disable organization features', 'features', 'write'),
    ('reports.read', 'View Reports', 'Access reports and analytics', 'reports', 'read'),
    ('reports.write', 'Manage Reports', 'Create and configure reports', 'reports', 'write'),
    ('incidents.read', 'View Incidents', 'View security incident reports', 'incidents', 'read'),
    ('incidents.write', 'Manage Incidents', 'Create and manage security incidents', 'incidents', 'write'),
    ('guards.read', 'View Guards', 'View security guard information', 'guards', 'read'),
    ('guards.write', 'Manage Guards', 'Manage security guard assignments', 'guards', 'write')
ON CONFLICT (key) DO NOTHING;

-- Create role_permissions junction table
CREATE TABLE IF NOT EXISTS role_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    granted_at TIMESTAMPTZ DEFAULT NOW(),
    granted_by UUID REFERENCES profiles(id),
    UNIQUE(role_id, permission_id)
);

-- Create user_roles junction table (optional - can use profiles.role directly)
CREATE TABLE IF NOT EXISTS user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    is_active BOOLEAN DEFAULT TRUE,
    granted_at TIMESTAMPTZ DEFAULT NOW(),
    granted_by UUID REFERENCES profiles(id),
    expires_at TIMESTAMPTZ,
    UNIQUE(user_id, role_id, organization_id)
);

-- Create organization_features table to work with existing features
CREATE TABLE IF NOT EXISTS organization_features (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    feature_id UUID NOT NULL REFERENCES features(id) ON DELETE CASCADE,
    is_enabled BOOLEAN DEFAULT TRUE,
    enabled_at TIMESTAMPTZ DEFAULT NOW(),
    enabled_by UUID REFERENCES profiles(id),
    settings JSONB DEFAULT '{}',
    UNIQUE(organization_id, feature_id)
);

-- Create user_feature_overrides for individual user feature access
CREATE TABLE IF NOT EXISTS user_feature_overrides (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    feature_id UUID NOT NULL REFERENCES features(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    is_enabled BOOLEAN NOT NULL,
    override_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES profiles(id),
    expires_at TIMESTAMPTZ,
    UNIQUE(user_id, feature_id, organization_id)
);

-- Assign permissions to roles
DO $$
DECLARE
    super_admin_role_id UUID;
    org_admin_role_id UUID;
    manager_role_id UUID;
    supervisor_role_id UUID;
    employee_role_id UUID;
    guard_role_id UUID;
    rep_role_id UUID;
BEGIN
    -- Get role IDs
    SELECT id INTO super_admin_role_id FROM roles WHERE name = 'super_admin';
    SELECT id INTO org_admin_role_id FROM roles WHERE name = 'organization_admin';
    SELECT id INTO manager_role_id FROM roles WHERE name = 'manager';
    SELECT id INTO supervisor_role_id FROM roles WHERE name = 'supervisor';
    SELECT id INTO employee_role_id FROM roles WHERE name = 'employee';
    SELECT id INTO guard_role_id FROM roles WHERE name = 'guard';
    SELECT id INTO rep_role_id FROM roles WHERE name = 'rep';

    -- Super Admin gets all permissions
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT super_admin_role_id, id FROM permissions
    ON CONFLICT DO NOTHING;

    -- Organization Admin gets most permissions
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT org_admin_role_id, id FROM permissions
    WHERE key IN ('users.read', 'users.write', 'features.read', 'features.write', 'reports.read', 'reports.write', 'incidents.read', 'incidents.write', 'guards.read', 'guards.write')
    ON CONFLICT DO NOTHING;

    -- Manager gets read access and limited write
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT manager_role_id, id FROM permissions
    WHERE key IN ('users.read', 'reports.read', 'reports.write', 'incidents.read', 'incidents.write', 'guards.read')
    ON CONFLICT DO NOTHING;

    -- Supervisor gets read access
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT supervisor_role_id, id FROM permissions
    WHERE key IN ('users.read', 'reports.read', 'incidents.read', 'guards.read')
    ON CONFLICT DO NOTHING;

    -- Employee gets basic read access
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT employee_role_id, id FROM permissions
    WHERE key IN ('reports.read')
    ON CONFLICT DO NOTHING;

    -- Guard gets incident write access
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT guard_role_id, id FROM permissions
    WHERE key IN ('incidents.read', 'incidents.write')
    ON CONFLICT DO NOTHING;

    -- Rep gets read access and reports
    INSERT INTO role_permissions (role_id, permission_id)
    SELECT rep_role_id, id FROM permissions
    WHERE key IN ('reports.read', 'incidents.read')
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

-- Enable Row Level Security on new tables only
DO $$
BEGIN
    -- Only enable RLS if table exists and RLS is not already enabled
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'roles' AND rowsecurity = true) THEN
        ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'permissions' AND rowsecurity = true) THEN
        ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'role_permissions' AND rowsecurity = true) THEN
        ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'user_roles' AND rowsecurity = true) THEN
        ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'organization_features' AND rowsecurity = true) THEN
        ALTER TABLE organization_features ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'user_feature_overrides' AND rowsecurity = true) THEN
        ALTER TABLE user_feature_overrides ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- Create RLS policies only if they don't exist
DO $$
BEGIN
    -- Roles policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'roles' AND policyname = 'rbac_allow_admins_manage_roles') THEN
        CREATE POLICY "rbac_allow_admins_manage_roles" ON roles FOR ALL TO authenticated 
            USING (EXISTS(
                SELECT 1 FROM profiles 
                WHERE profiles.id = auth.uid() 
                AND profiles.role IN ('super_admin', 'organization_admin', 'admin')
            ));
    END IF;
    
    -- Organization features policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'organization_features' AND policyname = 'rbac_view_own_org_features') THEN
        CREATE POLICY "rbac_view_own_org_features" ON organization_features FOR SELECT TO authenticated 
            USING (EXISTS(
                SELECT 1 FROM profiles 
                WHERE profiles.id = auth.uid() 
                AND profiles.organization_id = organization_features.organization_id
            ));
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'organization_features' AND policyname = 'rbac_admins_manage_org_features') THEN
        CREATE POLICY "rbac_admins_manage_org_features" ON organization_features FOR ALL TO authenticated 
            USING (EXISTS(
                SELECT 1 FROM profiles 
                WHERE profiles.id = auth.uid() 
                AND profiles.organization_id = organization_features.organization_id
                AND profiles.role IN ('super_admin', 'organization_admin', 'admin')
            ));
    END IF;
END $$;

-- Drop existing functions if they exist to avoid conflicts
DROP FUNCTION IF EXISTS has_feature_access(TEXT, UUID, UUID);
DROP FUNCTION IF EXISTS has_feature_access(TEXT, UUID);
DROP FUNCTION IF EXISTS has_feature_access(TEXT);
DROP FUNCTION IF EXISTS has_permission(TEXT, UUID);
DROP FUNCTION IF EXISTS has_permission(TEXT);
DROP FUNCTION IF EXISTS rbac_check_feature_access(TEXT, UUID, UUID);
DROP FUNCTION IF EXISTS rbac_check_permission(TEXT, UUID);

-- Create helper functions with unique names
CREATE OR REPLACE FUNCTION rbac_check_feature_access(
    feature_key_param TEXT,
    user_id_param UUID DEFAULT auth.uid(),
    organization_id_param UUID DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
    org_id UUID;
    feature_uuid UUID;
    org_enabled BOOLEAN := FALSE;
    user_override BOOLEAN;
BEGIN
    -- Get user's organization if not provided
    IF organization_id_param IS NULL THEN
        SELECT organization_id INTO org_id FROM profiles WHERE id = user_id_param;
        IF org_id IS NULL THEN
            RETURN FALSE;
        END IF;
    ELSE
        org_id := organization_id_param;
    END IF;

    -- Get feature ID from existing features table using feature_key
    SELECT id INTO feature_uuid FROM features WHERE feature_key = feature_key_param;
    
    IF feature_uuid IS NULL THEN
        -- Check legacy feature_flags in organizations table
        SELECT (feature_flags->feature_key_param)::boolean INTO org_enabled 
        FROM organizations 
        WHERE id = org_id;
        
        RETURN COALESCE(org_enabled, FALSE);
    END IF;

    -- Check organization feature setting
    SELECT is_enabled INTO org_enabled 
    FROM organization_features 
    WHERE organization_id = org_id AND feature_id = feature_uuid;
    
    -- If no org setting, fall back to legacy
    IF org_enabled IS NULL THEN
        SELECT (feature_flags->feature_key_param)::boolean INTO org_enabled 
        FROM organizations 
        WHERE id = org_id;
    END IF;
    
    -- Check for user override
    SELECT is_enabled INTO user_override 
    FROM user_feature_overrides 
    WHERE user_id = user_id_param 
      AND feature_id = feature_uuid 
      AND organization_id = org_id
      AND (expires_at IS NULL OR expires_at > NOW());
    
    -- Return override if exists, otherwise org setting
    RETURN COALESCE(user_override, org_enabled, FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION rbac_check_permission(
    permission_key_param TEXT,
    user_id_param UUID DEFAULT auth.uid()
) RETURNS BOOLEAN AS $$
DECLARE
    user_role TEXT;
    permission_uuid UUID;
BEGIN
    -- Get user role from profiles
    SELECT role INTO user_role FROM profiles WHERE id = user_id_param;
    
    IF user_role IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Get permission UUID
    SELECT id INTO permission_uuid FROM permissions WHERE key = permission_key_param;
    
    IF permission_uuid IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Check if user's role has this permission
    RETURN EXISTS(
        SELECT 1 FROM role_permissions rp
        JOIN roles r ON r.id = rp.role_id
        WHERE r.name = user_role AND rp.permission_id = permission_uuid
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comments
COMMENT ON TABLE roles IS 'System-wide user roles with hierarchy';
COMMENT ON TABLE permissions IS 'Granular permissions for system resources';
COMMENT ON TABLE role_permissions IS 'Junction table mapping roles to permissions';
COMMENT ON TABLE user_roles IS 'Optional user role assignments (can use profiles.role directly)';
COMMENT ON TABLE organization_features IS 'Organization-level feature toggles (works with existing features table)';
COMMENT ON TABLE user_feature_overrides IS 'Individual user feature access overrides';

COMMENT ON FUNCTION rbac_check_feature_access IS 'Check if user has access to a specific feature (works with legacy feature_flags)';
COMMENT ON FUNCTION rbac_check_permission IS 'Check if user has a specific permission based on their role';

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'RBAC system migration completed successfully!';
    RAISE NOTICE 'Created tables: roles, permissions, role_permissions, user_roles, organization_features, user_feature_overrides';
    RAISE NOTICE 'Created functions: rbac_check_feature_access, rbac_check_permission';
    RAISE NOTICE 'The system is now ready for role-based access control and feature management.';
END $$;