# Individual User Feature Control System - Setup Guide

## Overview

This enhancement adds granular feature control at the individual user level, allowing administrators to enable or disable specific features for individual users while maintaining organization-wide defaults.

## Features

### Two-Tier Feature System:
1. **Organization Features**: Default feature settings for all users in the organization
2. **User-Specific Features**: Individual overrides that take precedence over organization defaults

### Supported Features:
- Time Tracking
- Attendance
- Team Map
- Teams
- Projects
- Tasks
- Forms
- Leave Requests
- Outlets

## Database Changes Required

### 1. Run the Migration Script

Execute the migration script to add user feature flags:

```sql
-- Run in your Supabase SQL Editor
\i database/migrations/004_user_feature_flags.sql
```

### 2. What This Migration Does

#### Profiles Table Enhancement:
- Adds `feature_flags JSONB` column to store individual user feature overrides
- Creates GIN index for efficient JSON queries
- Defaults to empty JSON object `{}`

#### Helper Functions:
- `get_user_effective_features(user_id)`: Returns merged feature flags (org defaults + user overrides)
- `user_feature_summary` view: Easy access to all feature flag data

#### Performance Optimizations:
- GIN index on `feature_flags` column for fast JSON operations
- Efficient merging of organization and user settings

## User Interface Features

### Enhanced Settings Page

#### Organization Features Tab:
- Manage default feature settings for all users
- Serves as fallback for users without specific overrides
- Clear indication of organization-wide defaults

#### User-Specific Features Tab:
- Search and select individual users
- Override organization defaults for specific users
- Visual indicators for overridden settings
- Reset functionality to remove overrides

### Feature Control Interface:
1. **User Search**: Find users by name or email
2. **Real-time Updates**: Changes save immediately
3. **Override Indicators**: Clear visual feedback for customized settings
4. **Reset Options**: Easy way to remove user-specific overrides

## Feature Priority System

The system uses a hierarchical approach:

```
User-Specific Setting > Organization Default > System Default (enabled)
```

### Example Scenarios:

1. **Organization has Time Tracking disabled, User has no override**:
   - Result: Time Tracking is disabled for this user

2. **Organization has Time Tracking disabled, User override enables it**:
   - Result: Time Tracking is enabled for this user

3. **Organization has Time Tracking enabled, User override disables it**:
   - Result: Time Tracking is disabled for this user

4. **No organization setting, no user override**:
   - Result: Feature is enabled (system default)

## Database Schema

### Profiles Table Structure:
```sql
ALTER TABLE profiles ADD COLUMN feature_flags JSONB DEFAULT '{}';
```

### Feature Flags JSON Structure:
```json
{
  "time_tracking": true,
  "attendance": false,
  "maps": true,
  "teams": false,
  "projects": true,
  "tasks": true,
  "forms": false,
  "leave": true,
  "outlets": false
}
```

### Helper Functions:

#### Get Effective Features:
```sql
SELECT get_user_effective_features('user-uuid-here');
```

#### Check Specific Feature:
```sql
SELECT (get_user_effective_features('user-uuid-here')->>'time_tracking')::boolean;
```

## Implementation Details

### Frontend Features:
- Tabbed interface in Settings > Features
- Real-time user search and selection
- Visual indicators for overridden features
- Immediate save functionality with user feedback
- Reset capability to remove user overrides

### Backend Features:
- JSONB storage for efficient feature flag management
- Database functions for feature resolution
- Automatic merging of organization and user settings
- Performance indexes for fast queries

### Security:
- Admin-only access to feature management
- Validated user selections within organization
- Proper error handling and user feedback

## Usage Instructions

### For Administrators:

1. **Access Feature Management**:
   - Navigate to Settings > Features tab (admin only)
   - Choose between Organization Features and User-Specific Features

2. **Manage Organization Defaults**:
   - Use "Organization Features" tab
   - Enable/disable features for all users
   - Save changes to update defaults

3. **Customize Individual Users**:
   - Use "User-Specific Features" tab
   - Search and select a user
   - Toggle features to override organization defaults
   - Changes save automatically
   - Use "Reset" to remove overrides

### Feature Resolution Examples:

```javascript
// Organization: time_tracking = false
// User: time_tracking = true (override)
// Result: User sees Time Tracking enabled

// Organization: projects = true  
// User: no override
// Result: User sees Projects enabled

// Organization: forms = false
// User: forms = false (explicit)
// Result: User sees Forms disabled (same as org, but explicit)
```

## Testing the System

### 1. Organization-Wide Settings:
- Login as admin
- Navigate to Settings > Features > Organization Features
- Toggle features on/off
- Verify changes affect all users without overrides

### 2. User-Specific Overrides:
- Select "User-Specific Features" tab
- Search and select a test user
- Override some features differently from organization defaults
- Login as that user to verify feature visibility

### 3. Reset Functionality:
- Select a user with existing overrides
- Click "Reset" next to overridden features
- Verify features revert to organization defaults

## Database Queries for Troubleshooting

### View All User Features:
```sql
SELECT * FROM user_feature_summary ORDER BY full_name;
```

### Check Effective Features for User:
```sql
SELECT get_user_effective_features('user-uuid-here');
```

### Find Users with Overrides:
```sql
SELECT full_name, email, feature_flags 
FROM profiles 
WHERE feature_flags != '{}'::jsonb;
```

### Organization Feature Flags:
```sql
SELECT name, feature_flags FROM organizations;
```

## Migration from Previous System

The system maintains backward compatibility:
- Existing organization feature flags continue to work
- Users without individual overrides use organization defaults
- New `feature_flags` column defaults to empty, meaning no overrides

## Performance Considerations

- GIN index on `feature_flags` column for efficient JSON queries
- Helper functions are marked as `SECURITY DEFINER` for consistent permissions
- View caching for frequently accessed feature summaries

## Future Enhancements

The system is designed to be extensible:
- Easy addition of new features to the `ALL_FEATURES` array
- Support for role-based feature defaults
- Bulk user feature management
- Feature usage analytics and reporting