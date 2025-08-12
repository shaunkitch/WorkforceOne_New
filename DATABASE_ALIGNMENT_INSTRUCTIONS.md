# WorkforceOne Database Alignment Instructions

## Overview
This document provides instructions to ensure your Supabase database schema is fully aligned with the WorkforceOne application code. The application includes comprehensive functionality for attendance tracking, team management, project management, task management, leave requests, and user settings.

## Required Actions

### 1. Update Database Schema
Execute the complete schema update script in your Supabase SQL Editor:

```sql
-- Run this file: /workforceone/database/complete_schema_update.sql
```

This script will:
- ✅ Add missing columns to existing tables
- ✅ Create all missing tables required by the application
- ✅ Set up proper indexes for performance
- ✅ Configure Row Level Security (RLS) policies
- ✅ Create storage buckets for file uploads
- ✅ Add helpful database views
- ✅ Set up all necessary triggers

### 2. Verify Installation
After running the schema update, execute the test script:

```sql
-- Run this file: /workforceone/database/test_schema.sql
```

This will verify:
- ✅ All required tables exist
- ✅ All required columns are present
- ✅ RLS policies are properly configured
- ✅ Storage buckets are created
- ✅ All triggers and views are in place

## Database Schema Summary

### Core Tables Updated/Created:

#### **Existing Tables Enhanced:**
- `profiles` - Added job_title, bio, location, start_date
- `teams` - Added team_lead_id, department 
- `team_members` - Added id column, updated constraints
- `projects` - Added priority, progress, team_id, project_manager_id, spent_budget
- `tasks` - Added assignee_id, reporter_id, team_id, completed_at
- `leave_requests` - Renamed columns, added employee_id, leave_type, manager_comments

#### **New Tables Created:**
- `notifications` - In-app notification system
- `documents` - File upload and document management
- `leave_balances` - Annual leave balance tracking
- `task_comments` - Task collaboration comments
- `task_attachments` - File attachments for tasks

### Storage Buckets:
- `documents` - For general file uploads
- `avatars` - For user profile pictures

### Security Features:
- ✅ Row Level Security enabled on all tables
- ✅ Proper access policies for data isolation
- ✅ Storage bucket security policies
- ✅ User-based data access controls

## Application Features Supported

### 1. **Attendance Management**
- Real-time check-in/out tracking
- Break time management
- Weekly attendance statistics
- Historical attendance records
- Status tracking (present, late, absent)

### 2. **Team Management** 
- Team creation and member management
- Role assignments (member, lead, manager)
- Department organization
- Team statistics and performance tracking

### 3. **Project Tracking**
- Comprehensive project lifecycle management
- Progress tracking and budget monitoring
- Priority levels and status workflows
- Team assignment and project statistics

### 4. **Task Management**
- Kanban board and list views
- Task assignments and status tracking
- Comments and collaboration features
- Priority levels and due date management

### 5. **Leave Management**
- Leave request submission and approval
- Balance tracking for different leave types
- Manager approval workflows
- Leave history and analytics

### 6. **User Settings**
- Profile management with avatar upload
- Comprehensive notification preferences
- Theme and appearance customization
- Privacy and security controls
- Data export capabilities

### 7. **File Management**
- Document upload and organization
- Folder-based file management
- File sharing and access controls
- Multiple file format support

### 8. **Notifications**
- Real-time in-app notifications
- Email and push notification support
- Customizable notification preferences
- Activity tracking and alerts

## Post-Installation Verification

After running both SQL scripts, verify the installation by:

1. **Check Supabase Dashboard:**
   - Confirm all 14 tables are visible
   - Verify RLS policies are active
   - Check storage buckets exist

2. **Test Application Functions:**
   - User registration and profile setup
   - Team creation and member management  
   - Project creation and task assignment
   - Attendance check-in/out functionality
   - Leave request submission
   - File upload functionality
   - Settings page updates

3. **Monitor Logs:**
   - Check for any database connection errors
   - Verify RLS policies aren't blocking legitimate requests
   - Confirm file uploads work correctly

## Troubleshooting

### Common Issues:

**Authentication Errors:**
- Ensure your Supabase anon key is correct in environment variables
- Verify user is authenticated before accessing protected routes

**RLS Policy Errors:**
- Check if policies are too restrictive
- Verify user context is properly set in queries

**File Upload Issues:**
- Confirm storage buckets have proper policies
- Check file size limits and format restrictions

**Missing Data:**
- Verify foreign key relationships are correct
- Check if sample data insertion completed successfully

## Environment Variables Required

Ensure these are set in your `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

## Support

If you encounter any issues:

1. Check the browser console for JavaScript errors
2. Review Supabase dashboard for database errors
3. Verify all environment variables are set correctly
4. Ensure you're running the latest version of the application code

The database schema is now fully aligned with the WorkforceOne application code and should support all implemented features without errors.