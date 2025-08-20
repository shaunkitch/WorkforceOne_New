# Company Branding System - Database Setup

## Required Database Changes

The complete branding system (company name + logo upload) requires the following database setup:

### 1. Database Schema Updates

Run the complete setup script:
```sql
-- Run this in your Supabase SQL Editor
\i database/setup_complete_branding.sql
```

Or manually execute: `/workforceone/database/setup_complete_branding.sql`

### 2. What This Script Does

1. **Organizations Table Updates:**
   - Adds `logo_url TEXT` column (if not exists) - stores company logo URLs
   - Adds `feature_flags JSONB` column (if not exists) - for feature management
   - Adds `name VARCHAR(255)` column (if not exists) - for custom company names
   - Sets default name "My Organization" for existing organizations
   - Makes name column NOT NULL (required field)

2. **Storage Bucket Setup:**
   - Creates `logos` bucket in Supabase Storage
   - Sets bucket as public for logo viewing

3. **Security Policies:**
   - Allows public viewing of logos
   - Allows admin users to upload/update/delete logos
   - Allows admin users to update organization settings
   - Restricts access to organization data by membership

4. **Performance Indexes:**
   - Adds indexes on logo_url and name columns

### 3. Verification

After running the script, verify the setup:

```sql
-- Check organizations table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'organizations' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check storage bucket exists
SELECT * FROM storage.buckets WHERE name = 'logos';

-- Check storage policies
SELECT * FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage';
```

### 4. Testing

1. Login as an admin user
2. Navigate to Settings > Branding tab
3. **Test Company Name:**
   - Change company name and save
   - Verify new name appears in sidebar/navigation
4. **Test Logo Upload:**
   - Upload a test logo image (PNG/JPG, under 5MB)
   - Verify logo appears in sidebar/header
   - Test logo removal functionality

### 5. Storage Bucket Configuration

The logos bucket is configured as:
- **Name:** `logos`
- **Public:** `true` (allows public viewing of logos)
- **Path Structure:** `logos/{organization_id}-logo.{extension}`

### 6. Required Permissions

Users need the following roles:
- **Admin users:** Can upload, update, and remove organization logos
- **All users:** Can view organization logos

## File Structure Created

- `setup_complete_branding.sql` - Complete setup script
- `setup_logo_storage.sql` - Storage-specific setup
- `migrations/002_logo_and_branding_setup.sql` - Migration file
- `BRANDING_SETUP_INSTRUCTIONS.md` - This file

## Troubleshooting

If you encounter issues:

1. **Permission Errors:** Ensure the user has admin role in their profile
2. **Storage Errors:** Verify the logos bucket exists and policies are set
3. **Upload Failures:** Check file size (max 5MB) and format (images only)
4. **Logo Not Displaying:** Verify logo_url is set in organizations table