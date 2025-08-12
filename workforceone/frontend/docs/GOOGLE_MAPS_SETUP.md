# Google Maps Integration Setup

This guide will help you set up Google Maps integration for the WorkforceOne team location tracking feature.

## Overview

The Google Maps integration provides:
- Real-time visualization of team member locations
- Color-coded status indicators (present, late, absent, checked out)
- Interactive map with detailed user information
- Location capture during attendance check-in
- Team dashboard with live statistics

## Prerequisites

1. Google Cloud Console account
2. Billing enabled (required for Maps API usage)
3. Basic understanding of API key management

## Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing one
3. Note your project ID for reference

## Step 2: Enable Required APIs

Navigate to **APIs & Services > Library** and enable:

### Required APIs:
- **Maps JavaScript API** (Core mapping functionality)

### Optional APIs:
- **Places API** (Address autocomplete, future enhancement)
- **Geocoding API** (Convert coordinates to addresses)
- **Geolocation API** (Enhanced location services)

## Step 3: Create API Key

1. Go to **APIs & Services > Credentials**
2. Click **Create Credentials > API Key**
3. Copy the generated API key
4. Click **Restrict Key** to secure it

## Step 4: Configure API Key Restrictions

### Application Restrictions:
Choose **HTTP referrers (web sites)** and add:
```
https://your-domain.com/*
http://localhost:3000/*  (for development)
```

### API Restrictions:
Select **Restrict key** and choose only the APIs you enabled above.

## Step 5: Environment Configuration

1. Copy `.env.local.example` to `.env.local`
2. Add your API key:

```env
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_actual_api_key_here
```

## Step 6: Database Setup

Run the database migration to add location fields:

```sql
-- Run in Supabase SQL Editor
-- File: /database/add_location_to_attendance.sql
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8);
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8);
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS location_accuracy DECIMAL(8, 2);
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS location_timestamp TIMESTAMP WITH TIME ZONE;
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS address TEXT;
```

## Step 7: Testing

1. Start your development server
2. Navigate to `/dashboard/maps`
3. Check browser console for any API errors
4. Test location features:
   - Check-in with location access
   - View team members on map
   - Test marker interactions

## Features Overview

### Map Page (`/dashboard/maps`)
- **Team Location Map**: Visual overview of all team members
- **Live Statistics**: Real-time counts of present/absent/late users
- **Interactive Markers**: Click for detailed user information
- **Filtering**: Filter by status, department
- **My Location**: Center map on current user location

### Location Capture
- **Automatic**: Location captured during check-in
- **Optional**: Works without location permissions
- **Accurate**: High-precision GPS with accuracy metrics
- **Timestamped**: Location timestamp for tracking

### Status Colors
- 🟢 **Green**: Present (checked in on time)
- 🟡 **Yellow**: Late (checked in after business hours)
- 🔵 **Blue**: Checked out (completed work day)
- 🔴 **Red**: Absent (not checked in)

## Security Best Practices

### API Key Security:
1. **Never commit API keys** to version control
2. **Use environment variables** for all keys
3. **Restrict by domain** in production
4. **Monitor usage** regularly
5. **Rotate keys** periodically

### Location Privacy:
1. **Request permission** before accessing location
2. **Optional feature** - works without location
3. **Organization-scoped** data access only
4. **No tracking** without user consent

## Troubleshooting

### Common Issues:

**1. "Google Maps failed to load"**
- Check API key is correct
- Verify Maps JavaScript API is enabled
- Check browser console for specific errors

**2. "Multiple Google Maps API loads"**
- This error has been fixed with proper service implementation
- Ensure using GoogleMapComponent, not direct script loading

**3. "Location access denied"**
- Normal behavior, app works without location
- Users can manually grant permission
- Check browser location settings

**4. "Markers not showing"**
- Verify users have location data in database
- Check attendance records have latitude/longitude
- Ensure users have checked in with location enabled

### Debug Steps:

1. **Check API Key**: Verify in browser network tab
2. **Check Console**: Look for JavaScript errors
3. **Check Database**: Verify location data exists
4. **Check Permissions**: Browser location settings

## API Usage Monitoring

### Google Cloud Console:
1. Go to **APIs & Services > Quotas**
2. Monitor **Maps JavaScript API** usage
3. Set up billing alerts
4. Review usage patterns

### Typical Usage:
- **Map loads**: ~1-5 requests per user session
- **Marker updates**: Minimal after initial load
- **Cost**: Usually under $1/month for small teams

## Future Enhancements

Potential improvements:
- **Geofencing**: Alert when users check in outside office
- **Route tracking**: Show commute patterns
- **Address geocoding**: Convert coordinates to readable addresses
- **Heatmaps**: Visualize team density patterns
- **Mobile app**: Native location tracking

## Support

For issues with:
- **Google Maps API**: [Google Maps Platform Support](https://developers.google.com/maps/support)
- **WorkforceOne Integration**: Check application logs and console errors
- **Location Services**: Browser-specific documentation

## Cost Estimation

**Google Maps Pricing** (as of 2024):
- Maps JavaScript API: $7 per 1,000 loads
- First 28,000 loads per month: FREE
- Typical small team (10-50 users): FREE tier sufficient

**Monitor usage**: Set up billing alerts in Google Cloud Console