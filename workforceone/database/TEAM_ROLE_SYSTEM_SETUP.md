# Enhanced Team Role System - Setup Guide

## Overview

This enhancement implements a comprehensive role-based access control system with three main roles:
- **Administrator**: Full system access, can manage all teams and users
- **Manager**: Can manage their assigned teams, approve leave requests, and view attendance reports
- **Member**: Basic access to their assigned teams

## Database Changes Required

### 1. Run the Migration Script

Execute the migration script to update your database schema:

```sql
-- Run in your Supabase SQL Editor
\i database/migrations/003_enhanced_team_roles.sql
```

### 2. What This Migration Does

#### Profile Role System:
- Updates `profiles.role` to support: `admin`, `manager`, `member`
- Adds constraints to ensure valid roles
- Creates indexes for better performance
- Automatically promotes first user to admin if no admins exist

#### Team Role System:
- Updates `team_members.role` to support: `manager`, `member`
- Converts existing `lead` roles to `manager`
- Adds automatic team leadership management
- Ensures team leads must have manager or admin profile role

#### Triggers and Functions:
- `check_team_lead_role()`: Validates team lead assignments
- `update_team_leadership()`: Automatically manages team leadership changes
- `team_permissions` view: Simplified querying of team permissions

## Role Permissions Matrix

| Permission | Admin | Manager | Member |
|------------|-------|---------|--------|
| Create/Delete Teams | ✅ | ❌ | ❌ |
| Manage All Teams | ✅ | ❌ | ❌ |
| Manage Own Team | ✅ | ✅ | ❌ |
| Add/Remove Team Members | ✅ | ✅ (own teams) | ❌ |
| Change User Profile Roles | ✅ | ❌ | ❌ |
| Change Team Roles | ✅ | ✅ (own teams) | ❌ |
| View All Teams | ✅ | ❌ | ❌ |
| View Own Teams | ✅ | ✅ | ✅ |
| Approve Leave Requests | ✅ | ✅ (team members) | ❌ |
| View Attendance Reports | ✅ | ✅ (team members) | ❌ |
| Manual Attendance Entry | ✅ | ✅ (team members) | ❌ |

## User Interface Features

### Enhanced Teams Page:
1. **Role-Based Navigation**: Users only see teams they have permission to access
2. **Dynamic Permissions**: Buttons and actions appear based on user role
3. **Dual Role Display**: Shows both profile role (Admin/Manager/Member) and team role (Manager/Member)
4. **Role Management**: Admins can change user profile roles through dedicated interface

### Role Management Features:
1. **User Registration**: Enhanced registration with role assignment
2. **Team Member Management**: Add users to teams with specific roles
3. **Permission Validation**: All actions validated against user permissions
4. **Visual Indicators**: Clear role badges and permission indicators

## Implementation Details

### Frontend Changes:
- Added role-based permission checking functions
- Enhanced UI with conditional rendering based on permissions
- Added role management modal for administrators
- Updated role badges and visual indicators

### Database Schema:
- Profile roles: `admin`, `manager`, `member` (system-wide permissions)
- Team roles: `manager`, `member` (team-specific roles)
- Automatic constraint validation and leadership management

### Security Features:
- Permission checks on all sensitive operations
- Database-level constraints to prevent invalid role assignments
- Automatic cleanup when roles change

## Testing the System

### 1. Admin User Testing:
- Login as admin user
- Verify you can see all teams
- Test creating new teams
- Test changing user roles
- Test adding/removing team members

### 2. Manager User Testing:
- Login as manager user
- Verify you only see your managed teams
- Test adding/removing team members from your teams
- Verify you cannot create new teams or change profile roles

### 3. Member User Testing:
- Login as member user
- Verify you only see teams you belong to
- Verify you cannot manage teams or change roles
- Test basic team viewing functionality

## Troubleshooting

### Common Issues:

1. **No Admin Users**: If no admin users exist after migration, the first user will be automatically promoted
2. **Permission Denied**: Ensure user roles are properly set in the database
3. **Team Lead Issues**: Team leads must have manager or admin profile roles
4. **Role Constraints**: Database constraints prevent invalid role assignments

### Verification Queries:

```sql
-- Check user roles
SELECT full_name, email, role FROM public.profiles ORDER BY role;

-- Check team leadership
SELECT t.name, p.full_name as team_lead, p.role 
FROM public.teams t 
LEFT JOIN public.profiles p ON t.team_lead_id = p.id;

-- Check team member roles
SELECT * FROM team_permissions ORDER BY team_name, member_name;
```

## Migration from Old System

If upgrading from the old role system:
1. All `lead` roles in `team_members` become `manager`
2. All `employee` roles in `profiles` become `member`
3. First user is automatically promoted to `admin` if no admins exist
4. Team leadership is automatically assigned to team managers

## Next Steps

After implementing the enhanced role system, you can:
1. Add leave request approval workflows for managers
2. Implement attendance report access for managers
3. Add manual attendance entry capabilities for managers
4. Extend permissions for other system features