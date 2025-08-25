// Role-Based Access Control (RBAC) System
import { supabase } from './supabase';

// Define role hierarchy and permissions
export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  ORGANIZATION_ADMIN = 'organization_admin', 
  MANAGER = 'manager',
  SUPERVISOR = 'supervisor',
  GUARD = 'guard',
  REP = 'rep',
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
    dataScope: 'global'
  },
  [UserRole.ORGANIZATION_ADMIN]: {
    role: UserRole.ORGANIZATION_ADMIN,
    products: ['workforce-management', 'time-tracker', 'guard-management'],
    canViewAllData: true,
    canManageUsers: true,
    canViewReports: true,
    canManageOrganization: true,
    dataScope: 'organization'
  },
  [UserRole.MANAGER]: {
    role: UserRole.MANAGER,
    products: ['workforce-management', 'time-tracker', 'guard-management'],
    canViewAllData: true,
    canManageUsers: false,
    canViewReports: true,
    canManageOrganization: false,
    dataScope: 'organization'
  },
  [UserRole.SUPERVISOR]: {
    role: UserRole.SUPERVISOR,
    products: ['workforce-management', 'time-tracker', 'guard-management'],
    canViewAllData: true,
    canManageUsers: false,
    canViewReports: true,
    canManageOrganization: false,
    dataScope: 'team'
  },
  [UserRole.GUARD]: {
    role: UserRole.GUARD,
    products: ['guard-management'],
    canViewAllData: false,
    canManageUsers: false,
    canViewReports: false,
    canManageOrganization: false,
    dataScope: 'self'
  },
  [UserRole.REP]: {
    role: UserRole.REP,
    products: ['workforce-management', 'time-tracker'],
    canViewAllData: false,
    canManageUsers: false,
    canViewReports: true,
    canManageOrganization: false,
    dataScope: 'self'
  },
  [UserRole.EMPLOYEE]: {
    role: UserRole.EMPLOYEE,
    products: ['workforce-management', 'time-tracker'],
    canViewAllData: false,
    canManageUsers: false,
    canViewReports: false,
    canManageOrganization: false,
    dataScope: 'self'
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
      .maybeSingle();

    if (profileError) {
      console.error('Error fetching user profile:', profileError);
      return null;
    }

    // If no profile exists, create one for QR users
    if (!profile) {
      console.log('No profile found, creating one for user:', user.email);
      
      // Create default profile for QR users
      const { data: newProfile, error: createError } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          email: user.email,
          full_name: user.user_metadata?.full_name || 'Guard User',
          role: 'guard', // Default role for QR users
          organization_id: null, // Leave null for QR users without specific organization
          is_active: true
        })
        .select()
        .single();

      if (createError || !newProfile) {
        console.error('Error creating profile:', createError);
        return null;
      }

      console.log('Profile created successfully for QR user');
      return await getCurrentUserProfile(); // Recurse to get the newly created profile
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
      organization_id: profile.organization_id || 'default-org', // Use string fallback for null values
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

// Check if user has access to specific product
export const hasProductAccess = (userProfile: UserProfile, productId: string): boolean => {
  return userProfile.permissions.products.includes(productId);
};

// Feature access interface
export interface FeatureAccess {
  [key: string]: boolean;
}

// Check if organization has specific feature enabled
export const hasFeatureAccess = async (featureKey: string): Promise<boolean> => {
  try {
    const userProfile = await getCurrentUserProfile();
    
    if (!userProfile || !userProfile.organization_id) {
      return false;
    }

    // Try to check using the new RBAC feature system
    const { data: orgFeatures, error: featureError } = await supabase
      .from('organization_features')
      .select(`
        is_enabled,
        features!inner (
          key
        )
      `)
      .eq('organization_id', userProfile.organization_id)
      .eq('features.key', featureKey)
      .maybeSingle();

    if (!featureError && orgFeatures) {
      return orgFeatures.is_enabled;
    }

    // Fallback to legacy feature_flags in organizations table
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .select('feature_flags')
      .eq('id', userProfile.organization_id)
      .maybeSingle();

    if (orgError || !organization?.feature_flags) {
      // Default to enabled for essential features if no data found
      const defaultFeatures = [
        'mobile_guard_product', 'mobile_workforce_product', 'mobile_time_product',
        'guard_management', 'mobile_security', 'workforce_management', 
        'time_tracking', 'dashboard', 'attendance'
      ];
      return defaultFeatures.includes(featureKey);
    }

    return organization.feature_flags[featureKey] === true;
  } catch (error) {
    console.error('Error checking feature access:', error);
    return false;
  }
};

// Get all enabled features for user's organization
export const getEnabledFeatures = async (): Promise<FeatureAccess> => {
  try {
    const userProfile = await getCurrentUserProfile();
    
    if (!userProfile || !userProfile.organization_id) {
      return {};
    }

    // Try RBAC system first
    const { data: orgFeatures, error: featureError } = await supabase
      .from('organization_features')
      .select(`
        is_enabled,
        features!inner (
          key
        )
      `)
      .eq('organization_id', userProfile.organization_id)
      .eq('is_enabled', true);

    if (!featureError && orgFeatures && orgFeatures.length > 0) {
      const features: FeatureAccess = {};
      orgFeatures.forEach(feature => {
        if (feature.features) {
          features[feature.features.key] = true;
        }
      });
      return features;
    }

    // Fallback to legacy system
    const { data: organization, error: orgError } = await supabase
      .from('organizations')
      .select('feature_flags')
      .eq('id', userProfile.organization_id)
      .maybeSingle();

    if (orgError || !organization?.feature_flags) {
      // Return default enabled features (including master toggles)
      return {
        // Master mobile product toggles
        mobile_guard_product: true,
        mobile_workforce_product: true,
        mobile_time_product: true,
        
        // Individual features
        guard_management: true,
        mobile_security: true,
        workforce_management: true,
        time_tracking: true,
        dashboard: true,
        attendance: true
      };
    }

    return organization.feature_flags || {};
  } catch (error) {
    console.error('Error getting enabled features:', error);
    return {};
  }
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

// Get filtered products for user (SECURE - no fallback to all products)
export const getUserProducts = async (): Promise<string[]> => {
  try {
    const userProfile = await getCurrentUserProfile();
    
    if (!userProfile) {
      console.log('No user profile found - denying all product access');
      return []; // SECURE: Return empty array instead of all products
    }

    console.log(`User ${userProfile.email} (${userProfile.role}) has access to:`, userProfile.permissions.products);
    return userProfile.permissions.products;
  } catch (error) {
    console.error('Error getting user products:', error);
    return []; // SECURE: Return empty array on error
  }
};

// Get user's accessible incidents (based on data scope)
export const getAccessibleIncidents = async (userProfile: UserProfile) => {
  try {
    let query = supabase.from('security_incidents').select('*');

    switch (userProfile.permissions.dataScope) {
      case 'self':
        // Guards can only see their own incidents
        query = query.eq('guard_id', userProfile.id);
        break;
      
      case 'team':
        // Supervisors can see their team's incidents
        // This would require team membership data
        query = query.eq('guard_id', userProfile.id); // Fallback to self for now
        break;
      
      case 'organization':
        // Managers can see all incidents in their organization
        // This requires organization_id in incidents table
        break;
      
      case 'global':
        // Super admins can see everything
        break;
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

// Get user's accessible patrol sessions
export const getAccessiblePatrolSessions = async (userProfile: UserProfile) => {
  try {
    let query = supabase.from('patrol_sessions').select('*');

    switch (userProfile.permissions.dataScope) {
      case 'self':
        query = query.eq('guard_id', userProfile.id);
        break;
      
      case 'team':
        // Would need team membership logic
        query = query.eq('guard_id', userProfile.id); // Fallback to self
        break;
      
      case 'organization':
        query = query.eq('organization_id', userProfile.organization_id);
        break;
      
      case 'global':
        // No filter - can see all
        break;
    }

    const { data, error } = await query.order('start_time', { ascending: false });
    
    if (error) {
      console.error('Error fetching accessible patrol sessions:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getAccessiblePatrolSessions:', error);
    return [];
  }
};

// Role-based navigation filtering
export const getAvailableNavigation = (userProfile: UserProfile) => {
  const nav = [];

  // Guards only see guard-specific navigation
  if (hasProductAccess(userProfile, 'guard-management')) {
    nav.push({
      id: 'guard',
      title: 'Security',
      icon: '🛡️',
      screens: ['GuardDashboard', 'PatrolSession', 'GuardCheckIn']
    });
  }

  // Employees see workforce and time tracking
  if (hasProductAccess(userProfile, 'workforce-management')) {
    nav.push({
      id: 'workforce',
      title: 'Workforce',
      icon: '👥',
      screens: ['WorkforceDashboard', 'Projects', 'Tasks']
    });
  }

  if (hasProductAccess(userProfile, 'time-tracker')) {
    nav.push({
      id: 'time',
      title: 'Time',
      icon: '⏰',
      screens: ['TimeDashboard', 'Timer', 'Timesheet']
    });
  }

  return nav;
};

// Validate user role on critical operations
export const validateRoleForOperation = (
  userProfile: UserProfile, 
  operation: 'view_all_data' | 'manage_users' | 'view_reports' | 'manage_organization'
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
    default:
      return false;
  }
};

// Security logging for role-based actions
export const logRoleBasedAccess = (
  userProfile: UserProfile,
  action: string,
  resource: string,
  granted: boolean
) => {
  console.log(`RBAC LOG: ${userProfile.email} (${userProfile.role}) ${granted ? 'GRANTED' : 'DENIED'} ${action} on ${resource}`);
};

export default {
  UserRole,
  getCurrentUserProfile,
  hasProductAccess,
  canViewAllData,
  canManageUsers,
  canViewReports,
  getDataScope,
  getUserProducts,
  getAccessibleIncidents,
  getAccessiblePatrolSessions,
  getAvailableNavigation,
  validateRoleForOperation,
  logRoleBasedAccess
};