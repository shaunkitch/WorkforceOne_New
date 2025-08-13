# Email Service Integration Setup

This document explains how the email service integration works for the WorkforceOne invitation system.

## Overview

The email service integration allows the application to send professional invitation emails to new users when they are invited to join an organization.

## Architecture

### Backend Components

1. **Email Service** (`/backend/src/services/emailService.ts`)
   - Handles email sending using Nodemailer
   - Supports both development (Ethereal) and production (SMTP) configurations
   - Generates HTML email templates
   - Logs email activities to Supabase

2. **API Endpoints** (`/backend/src/routes/simple-invitations.ts`)
   - `POST /api/invitations/send-email` - Send initial invitation email
   - `POST /api/invitations/resend-email` - Resend invitation with extended expiry

3. **Server Configuration** (`/backend/src/server.ts`)
   - Express server with CORS, security middleware
   - Authentication verification for API endpoints

### Frontend Integration

1. **Teams Page** (`/frontend/app/dashboard/teams/page.tsx`)
   - Invitations tab for managing user invitations
   - Automatic email sending when creating invitations
   - Resend functionality for pending invitations

2. **Signup Page** (`/frontend/app/signup/page.tsx`)
   - Token-based invitation acceptance
   - Pre-filled forms from invitation data

## Configuration

### Environment Variables

**Backend** (`.env`):
```env
# Supabase Configuration
SUPABASE_URL=your_supabase_project_url
SUPABASE_SERVICE_KEY=your_supabase_service_role_key

# Frontend Configuration
FRONTEND_URL=http://localhost:3000

# Email Configuration (Development)
SMTP_HOST=smtp.ethereal.email
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=test@ethereal.email
SMTP_PASS=testpass

# Email Configuration (Production)
# SMTP_HOST=smtp.gmail.com
# SMTP_PORT=587
# SMTP_SECURE=false
# SMTP_USER=your_email@gmail.com
# SMTP_PASS=your_app_password

# From Email Address
FROM_EMAIL=noreply@workforceone.com

# Server Configuration
PORT=5000
NODE_ENV=development
```

**Frontend** (`.env.local`):
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

## Email Templates

The system includes a professional HTML email template with:
- Organization branding
- Personal message support
- Role and department information
- Secure invitation links
- Expiry information
- Mobile-responsive design

## Development vs Production

### Development
- Uses Ethereal Email for testing
- Emails are not actually sent but can be viewed in browser
- Console logs provide preview URLs

### Production
- Configure with real SMTP service (Gmail, SendGrid, AWS SES, etc.)
- Requires proper SMTP credentials
- Emails are delivered to actual recipients

## Usage Flow

1. **Admin/Manager creates invitation** in Teams → Invitations tab
2. **System creates database record** in `company_invitations` table
3. **Frontend calls backend API** to send email
4. **Backend generates and sends email** using Nodemailer
5. **User receives email** with secure invitation link
6. **User clicks link** and is redirected to signup page with token
7. **Signup page processes token** and pre-fills form
8. **User completes signup** and invitation is marked as accepted

## Security Features

- JWT token authentication for API endpoints
- Role-based access control (admin/manager only)
- Secure invitation tokens with expiry
- Email validation and duplicate prevention
- Organization-scoped data access

## Monitoring

All email activities are logged to the `system_logs` table including:
- Successful email sends
- Failed email attempts
- Invitation token usage
- Error details for debugging

## Testing

1. **Start Backend Server**:
   ```bash
   cd workforceone/backend
   npm run dev
   ```

2. **Access Application**:
   - Frontend: http://localhost:3000
   - Backend: http://localhost:5000
   - Health Check: http://localhost:5000/health

3. **Test Email Service**:
   - Login as admin/manager
   - Go to Teams → Invitations tab
   - Create new invitation
   - Check console for Ethereal preview URL (development)

## Production Deployment

For production deployment:

1. Update environment variables with real SMTP credentials
2. Set `NODE_ENV=production`
3. Configure proper domain for `FRONTEND_URL`
4. Use secure HTTPS endpoints
5. Monitor email delivery rates and logs

## Troubleshooting

Common issues and solutions:

1. **"Email service connection failed"**
   - Check SMTP credentials
   - Verify network connectivity
   - Ensure firewall allows SMTP ports

2. **"Authentication required"**
   - Verify JWT token is valid
   - Check user permissions (admin/manager role)

3. **"Invitation not found"**
   - Ensure invitation exists in database
   - Check organization_id matching
   - Verify invitation status is 'pending'

## Future Enhancements

Potential improvements:
- Email queue system for bulk invitations
- Custom email templates per organization
- Email delivery status tracking
- Bounce and unsubscribe handling
- Integration with dedicated email services (SendGrid, Mailgun)