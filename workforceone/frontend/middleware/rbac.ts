// RBAC Middleware for API endpoints
import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export interface RBACConfig {
  allowedRoles: string[];
  requireOrgAccess?: boolean;
  requireActiveUser?: boolean;
  requiredPermissions?: string[];
}

// Default RBAC configuration
const DEFAULT_CONFIG: RBACConfig = {
  allowedRoles: ['super_admin', 'organization_admin'],
  requireOrgAccess: true,
  requireActiveUser: true
};

// RBAC middleware function
export async function withRBAC(
  handler: (request: NextRequest, user: any, profile: any) => Promise<NextResponse>,
  config: Partial<RBACConfig> = {}
) {
  const rbacConfig = { ...DEFAULT_CONFIG, ...config };

  return async (request: NextRequest): Promise<NextResponse> => {
    try {
      const supabase = createRouteHandlerClient({ cookies });
      
      // Get authenticated user
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }

      // Get user profile from database
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError || !profile) {
        return NextResponse.json({ error: 'User profile not found' }, { status: 403 });
      }

      // Check if user is active (if required)
      if (rbacConfig.requireActiveUser && !profile.is_active) {
        return NextResponse.json({ error: 'User account is inactive' }, { status: 403 });
      }

      // Check role permissions
      if (!rbacConfig.allowedRoles.includes(profile.role)) {
        return NextResponse.json({ 
          error: 'Insufficient permissions', 
          required_roles: rbacConfig.allowedRoles 
        }, { status: 403 });
      }

      // Check organization access (if required)
      if (rbacConfig.requireOrgAccess && !profile.organization_id) {
        return NextResponse.json({ error: 'Organization access required' }, { status: 403 });
      }

      // Log access attempt for security
      console.log(`RBAC: ${user.email} (${profile.role}) accessing ${request.url}`);

      // Call the actual handler with authenticated user and profile
      return handler(request, user, profile);

    } catch (error) {
      console.error('RBAC Middleware Error:', error);
      return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
  };
}

// Pre-configured middleware functions for common use cases

// Admin only endpoints (organization management, user management)
export const withAdminAccess = (handler: any) => withRBAC(handler, {
  allowedRoles: ['super_admin', 'organization_admin', 'admin']
});

// Manager+ access (reports, analytics, some management features)  
export const withManagerAccess = (handler: any) => withRBAC(handler, {
  allowedRoles: ['super_admin', 'organization_admin', 'admin', 'manager']
});

// Supervisor+ access (team data, limited management)
export const withSupervisorAccess = (handler: any) => withRBAC(handler, {
  allowedRoles: ['super_admin', 'organization_admin', 'admin', 'manager', 'supervisor']
});

// Any authenticated user (basic endpoints)
export const withAuthenticatedAccess = (handler: any) => withRBAC(handler, {
  allowedRoles: ['super_admin', 'organization_admin', 'admin', 'manager', 'supervisor', 'employee', 'guard', 'rep']
});

// Guard-specific endpoints
export const withGuardAccess = (handler: any) => withRBAC(handler, {
  allowedRoles: ['guard', 'supervisor', 'manager', 'organization_admin', 'super_admin']
});

// Feature-specific access control
export const withFeatureAccess = (requiredFeatures: string[]) => 
  async (handler: any) => withRBAC(async (request, user, profile) => {
    // Check feature access for the organization
    const supabase = createRouteHandlerClient({ cookies });
    
    // Try new RBAC system first
    const { data: orgFeatures, error } = await supabase
      .from('organization_features')
      .select(`
        is_enabled,
        features!inner (
          key
        )
      `)
      .eq('organization_id', profile.organization_id)
      .in('features.key', requiredFeatures)
      .eq('is_enabled', true);

    if (!error && orgFeatures) {
      const enabledFeatures = orgFeatures.map(f => f.features?.key).filter(Boolean);
      const hasAllFeatures = requiredFeatures.every(feature => enabledFeatures.includes(feature));
      
      if (!hasAllFeatures) {
        return NextResponse.json({ 
          error: 'Required features not enabled',
          required_features: requiredFeatures,
          enabled_features: enabledFeatures
        }, { status: 403 });
      }
    } else {
      // Fallback to legacy feature flags
      const { data: organization } = await supabase
        .from('organizations')
        .select('feature_flags')
        .eq('id', profile.organization_id)
        .single();

      if (organization?.feature_flags) {
        const hasAllFeatures = requiredFeatures.every(feature => 
          organization.feature_flags[feature] === true
        );
        
        if (!hasAllFeatures) {
          return NextResponse.json({ 
            error: 'Required features not enabled',
            required_features: requiredFeatures
          }, { status: 403 });
        }
      }
    }

    return handler(request, user, profile);
  });

// Data scope filtering helper
export const filterByDataScope = async (
  query: any, 
  profile: any, 
  resourceOrgField = 'organization_id',
  resourceUserField = 'user_id'
) => {
  switch (profile.role) {
    case 'super_admin':
      // Super admins see everything
      return query;
      
    case 'organization_admin':
    case 'admin':
    case 'manager':
      // Org-level access
      return query.eq(resourceOrgField, profile.organization_id);
      
    case 'supervisor':
      // Team-level access (would need team membership logic)
      return query.eq(resourceOrgField, profile.organization_id);
      
    case 'employee':
    case 'guard':
    case 'rep':
      // Self-only access
      return query
        .eq(resourceOrgField, profile.organization_id)
        .eq(resourceUserField, profile.id);
        
    default:
      // Default to most restrictive
      return query
        .eq(resourceOrgField, profile.organization_id)
        .eq(resourceUserField, profile.id);
  }
};

export default {
  withRBAC,
  withAdminAccess,
  withManagerAccess,
  withSupervisorAccess,
  withAuthenticatedAccess,
  withGuardAccess,
  withFeatureAccess,
  filterByDataScope
};