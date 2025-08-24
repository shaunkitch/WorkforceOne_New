// Role-Based Access Control (RBAC) System for Web Portal
import { createClient } from '@/lib/supabase/client';

const supabase = createClient();

// Define role hierarchy and permissions (matching mobile app)
export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  ORGANIZATION_ADMIN = 'organization_admin', 
  MANAGER = 'manager',
  SUPERVISOR = 'supervisor',
  GUARD = 'guard',
  EMPLOYEE = 'employee'
}

// Define product permissions per role
export interface RolePermissions {
  role: UserRole;
  products: string[];
  canViewAllData: boolean;
  canManageUsers: boolean;
  canViewReports: boolean;
  canManageOrganization: boolean;
  dataScope: 'self' | 'team' | 'organization' | 'global';
  webPortalAccess: {
    dashboard: boolean;
    analytics: boolean;
    userManagement: boolean;
    settings: boolean;
    billing: boolean;
    reports: boolean;
    incidents: 'all' | 'team' | 'own' | 'none';
    guards: 'manage' | 'view' | 'none';
    automation: boolean;
    integrations: boolean;
  };
}

// Role configuration matrix
const ROLE_PERMISSIONS: Record<UserRole, RolePermissions> = {
  [UserRole.SUPER_ADMIN]: {
    role: UserRole.SUPER_ADMIN,
    products: ['workforce-management', 'time-tracker', 'guard-management'],
    canViewAllData: true,
    canManageUsers: true,
    canViewReports: true,
    canManageOrganization: true,
    dataScope: 'global',
    webPortalAccess: {
      dashboard: true,
      analytics: true,
      userManagement: true,
      settings: true,
      billing: true,
      reports: true,
      incidents: 'all',
      guards: 'manage',
      automation: true,
      integrations: true
    }
  },
  [UserRole.ORGANIZATION_ADMIN]: {
    role: UserRole.ORGANIZATION_ADMIN,
    products: ['workforce-management', 'time-tracker', 'guard-management'],
    canViewAllData: true,
    canManageUsers: true,
    canViewReports: true,
    canManageOrganization: true,
    dataScope: 'organization',
    webPortalAccess: {
      dashboard: true,
      analytics: true,
      userManagement: true,
      settings: true,
      billing: true,
      reports: true,
      incidents: 'all',
      guards: 'manage',
      automation: true,
      integrations: true
    }
  },
  [UserRole.MANAGER]: {
    role: UserRole.MANAGER,
    products: ['workforce-management', 'time-tracker', 'guard-management'],
    canViewAllData: true,
    canManageUsers: false,
    canViewReports: true,
    canManageOrganization: false,
    dataScope: 'organization',
    webPortalAccess: {
      dashboard: true,
      analytics: true,
      userManagement: false,
      settings: false,
      billing: false,
      reports: true,
      incidents: 'all',
      guards: 'view',
      automation: false,
      integrations: false
    }
  },
  [UserRole.SUPERVISOR]: {
    role: UserRole.SUPERVISOR,
    products: ['workforce-management', 'time-tracker', 'guard-management'],
    canViewAllData: true,
    canManageUsers: false,
    canViewReports: true,
    canManageOrganization: false,
    dataScope: 'team',
    webPortalAccess: {
      dashboard: true,
      analytics: false,
      userManagement: false,
      settings: false,
      billing: false,
      reports: true,
      incidents: 'team',
      guards: 'view',
      automation: false,
      integrations: false
    }
  },
  [UserRole.GUARD]: {
    role: UserRole.GUARD,
    products: ['guard-management'],
    canViewAllData: false,
    canManageUsers: false,
    canViewReports: false,
    canManageOrganization: false,
    dataScope: 'self',
    webPortalAccess: {
      dashboard: false, // Guards use mobile app primarily
      analytics: false,
      userManagement: false,
      settings: false,
      billing: false,
      reports: false,
      incidents: 'own',
      guards: 'none',
      automation: false,
      integrations: false
    }
  },
  [UserRole.EMPLOYEE]: {
    role: UserRole.EMPLOYEE,
    products: ['workforce-management', 'time-tracker'],
    canViewAllData: false,
    canManageUsers: false,
    canViewReports: false,
    canManageOrganization: false,
    dataScope: 'self',
    webPortalAccess: {
      dashboard: true, // Limited employee dashboard
      analytics: false,
      userManagement: false,
      settings: false,
      billing: false,
      reports: false,
      incidents: 'none',
      guards: 'none',
      automation: false,
      integrations: false
    }
  }
};

// User profile with role information
export interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  role: UserRole;
  organization_id: string;
  department?: string;
  position?: string;
  is_active: boolean;
  permissions: RolePermissions;
}

// Get current user profile with role and permissions
export const getCurrentUserProfile = async (): Promise<UserProfile | null> => {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.log('No authenticated user found');
      return null;
    }

    // Get user profile from database
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .eq('is_active', true)
      .single();

    if (profileError || !profile) {
      console.error('Error fetching user profile:', profileError);
      return null;
    }

    // Validate and normalize role (handle legacy role names)
    let userRole = profile.role as UserRole;
    
    // Handle legacy role mappings
    const roleMappings: Record<string, UserRole> = {
      'admin': UserRole.ORGANIZATION_ADMIN,
      'user': UserRole.EMPLOYEE,
      'member': UserRole.EMPLOYEE,
      'owner': UserRole.SUPER_ADMIN
    };
    
    // Check if it's a legacy role that needs mapping
    if (!Object.values(UserRole).includes(userRole) && roleMappings[profile.role]) {
      console.log(`Mapping legacy role "${profile.role}" to "${roleMappings[profile.role]}"`);
      userRole = roleMappings[profile.role];
    }
    
    // Final validation
    if (!Object.values(UserRole).includes(userRole)) {
      console.error('Invalid user role after mapping:', profile.role, '→', userRole);
      // Default to employee for unrecognized roles instead of failing
      userRole = UserRole.EMPLOYEE;
      console.log('Defaulting to employee role for safety');
    }

    const permissions = ROLE_PERMISSIONS[userRole];
    
    return {
      id: profile.id,
      email: profile.email,
      full_name: profile.full_name,
      role: userRole,
      organization_id: profile.organization_id || 'default',
      department: profile.department,
      position: profile.position,
      is_active: profile.is_active,
      permissions
    };
  } catch (error) {
    console.error('Error getting user profile:', error);
    return null;
  }
};

// Check if user has access to specific web portal section
export const hasWebPortalAccess = (userProfile: UserProfile, section: keyof RolePermissions['webPortalAccess']): boolean => {
  return userProfile.permissions.webPortalAccess[section] === true;
};

// Check incidents access level
export const getIncidentsAccess = (userProfile: UserProfile): 'all' | 'team' | 'own' | 'none' => {
  return userProfile.permissions.webPortalAccess.incidents;
};

// Check guards management access level
export const getGuardsAccess = (userProfile: UserProfile): 'manage' | 'view' | 'none' => {
  return userProfile.permissions.webPortalAccess.guards;
};

// Check if user has access to specific product
export const hasProductAccess = (userProfile: UserProfile, productId: string): boolean => {
  return userProfile.permissions.products.includes(productId);
};

// Check if user can view all organization data
export const canViewAllData = (userProfile: UserProfile): boolean => {
  return userProfile.permissions.canViewAllData;
};

// Check if user can manage other users
export const canManageUsers = (userProfile: UserProfile): boolean => {
  return userProfile.permissions.canManageUsers;
};

// Check if user can view reports
export const canViewReports = (userProfile: UserProfile): boolean => {
  return userProfile.permissions.canViewReports;
};

// Get data scope for user (what data they can access)
export const getDataScope = (userProfile: UserProfile): 'self' | 'team' | 'organization' | 'global' => {
  return userProfile.permissions.dataScope;
};

// Get user's accessible incidents (based on data scope)
export const getAccessibleIncidents = async (userProfile: UserProfile) => {
  try {
    let query = supabase.from('security_incidents').select('*');

    switch (userProfile.permissions.webPortalAccess.incidents) {
      case 'own':
        // Guards can only see their own incidents
        query = query.eq('guard_id', userProfile.id);
        break;
      
      case 'team':
        // Supervisors can see their team's incidents
        // This would require team membership data
        query = query.eq('guard_id', userProfile.id); // Fallback to self for now
        break;
      
      case 'all':
        // Managers and above can see all incidents in their scope
        if (userProfile.permissions.dataScope === 'organization') {
          query = query.eq('organization_id', userProfile.organization_id);
        }
        // Global scope (super_admin) sees everything - no filter
        break;
        
      case 'none':
        return []; // No access
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching accessible incidents:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getAccessibleIncidents:', error);
    return [];
  }
};

// Get available navigation items based on role
export const getAvailableNavigation = (userProfile: UserProfile) => {
  const nav = [];
  const access = userProfile.permissions.webPortalAccess;

  if (access.dashboard) {
    nav.push({
      id: 'dashboard',
      title: 'Dashboard',
      icon: '📊',
      path: '/dashboard'
    });
  }

  if (hasProductAccess(userProfile, 'workforce-management')) {
    nav.push({
      id: 'workforce',
      title: 'Workforce',
      icon: '👥',
      path: '/dashboard/teams'
    });
  }

  if (hasProductAccess(userProfile, 'time-tracker')) {
    nav.push({
      id: 'time',
      title: 'Time Tracking',
      icon: '⏰',
      path: '/dashboard/time'
    });
  }

  if (hasProductAccess(userProfile, 'guard-management')) {
    nav.push({
      id: 'security',
      title: 'Security',
      icon: '🛡️',
      path: '/dashboard/security'
    });
  }

  if (access.analytics) {
    nav.push({
      id: 'analytics',
      title: 'Analytics',
      icon: '📈',
      path: '/dashboard/analytics'
    });
  }

  if (access.reports) {
    nav.push({
      id: 'reports',
      title: 'Reports',
      icon: '📋',
      path: '/dashboard/reports'
    });
  }

  if (access.userManagement) {
    nav.push({
      id: 'users',
      title: 'User Management',
      icon: '👤',
      path: '/dashboard/settings'
    });
  }

  if (access.integrations) {
    nav.push({
      id: 'integrations',
      title: 'Integrations',
      icon: '🔗',
      path: '/dashboard/integrations'
    });
  }

  return nav;
};

// Validate user role for critical operations
export const validateRoleForOperation = (
  userProfile: UserProfile, 
  operation: 'view_all_data' | 'manage_users' | 'view_reports' | 'manage_organization' | 'access_billing' | 'manage_integrations'
): boolean => {
  switch (operation) {
    case 'view_all_data':
      return userProfile.permissions.canViewAllData;
    case 'manage_users':
      return userProfile.permissions.canManageUsers;
    case 'view_reports':
      return userProfile.permissions.canViewReports;
    case 'manage_organization':
      return userProfile.permissions.canManageOrganization;
    case 'access_billing':
      return userProfile.permissions.webPortalAccess.billing;
    case 'manage_integrations':
      return userProfile.permissions.webPortalAccess.integrations;
    default:
      return false;
  }
};

// Security logging for role-based actions
export const logRoleBasedAccess = (
  userProfile: UserProfile,
  action: string,
  resource: string,
  granted: boolean,
  additionalContext?: any
) => {
  console.log(`RBAC LOG: ${userProfile.email} (${userProfile.role}) ${granted ? 'GRANTED' : 'DENIED'} ${action} on ${resource}`, additionalContext);
  
  // In production, this would be sent to a security monitoring system
  if (!granted) {
    console.warn(`SECURITY ALERT: Unauthorized access attempt by ${userProfile.email} to ${resource}`);
  }
};

// Route protection helper
export const requireRole = (requiredRoles: UserRole[]) => {
  return async (): Promise<{ allowed: boolean; userProfile?: UserProfile; redirectTo?: string }> => {
    const userProfile = await getCurrentUserProfile();
    
    if (!userProfile) {
      return { allowed: false, redirectTo: '/login' };
    }

    if (!requiredRoles.includes(userProfile.role)) {
      logRoleBasedAccess(userProfile, 'access_route', window.location.pathname, false);
      return { allowed: false, userProfile, redirectTo: '/dashboard' };
    }

    return { allowed: true, userProfile };
  };
};

// Component access helper
export const requirePermission = (permission: keyof RolePermissions['webPortalAccess']) => {
  return async (): Promise<{ allowed: boolean; userProfile?: UserProfile }> => {
    const userProfile = await getCurrentUserProfile();
    
    if (!userProfile) {
      return { allowed: false };
    }

    const hasAccess = hasWebPortalAccess(userProfile, permission);
    
    if (!hasAccess) {
      logRoleBasedAccess(userProfile, 'access_component', permission, false);
    }

    return { allowed: hasAccess, userProfile };
  };
};

export default {
  UserRole,
  getCurrentUserProfile,
  hasWebPortalAccess,
  getIncidentsAccess,
  getGuardsAccess,
  hasProductAccess,
  canViewAllData,
  canManageUsers,
  canViewReports,
  getDataScope,
  getAccessibleIncidents,
  getAvailableNavigation,
  validateRoleForOperation,
  logRoleBasedAccess,
  requireRole,
  requirePermission
};