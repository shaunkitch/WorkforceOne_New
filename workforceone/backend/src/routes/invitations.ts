import dotenv from 'dotenv'
import express from 'express'
import { createClient } from '@supabase/supabase-js'
import EmailService from '../services/emailService'
import { body, validationResult } from 'express-validator'

// Load environment variables
dotenv.config()

const router = express.Router()
const emailService = new EmailService()

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

// Middleware to verify Supabase JWT token
const authenticateUser = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const authHeader = req.headers.authorization
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No valid authorization token provided' })
  }

  const token = authHeader.substring(7)
  
  try {
    const { data: { user }, error } = await supabase.auth.getUser(token)
    
    if (error || !user) {
      return res.status(401).json({ error: 'Invalid token' })
    }

    // Get user profile to check permissions
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return res.status(401).json({ error: 'User profile not found' })
    }

    // Check if user has permission to send invitations
    if (profile.role !== 'admin' && profile.role !== 'manager') {
      return res.status(403).json({ error: 'Insufficient permissions to send invitations' })
    }

    req.user = user
    req.userProfile = profile
    next()
  } catch (error) {
    console.error('Authentication error:', error)
    return res.status(401).json({ error: 'Authentication failed' })
  }
}

// Send invitation email
router.post('/send-email', 
  authenticateUser,
  [
    body('invitationId').isUUID().withMessage('Valid invitation ID is required'),
  ],
  async (req: express.Request, res: express.Response) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          error: 'Validation failed', 
          details: errors.array() 
        })
      }

      const { invitationId } = req.body
      const userProfile = req.userProfile

      // Get invitation details
      const { data: invitation, error: invitationError } = await supabase
        .from('company_invitations')
        .select(`
          *,
          organizations!inner(name),
          invited_by_profile:profiles!company_invitations_invited_by_fkey(full_name)
        `)
        .eq('id', invitationId)
        .eq('organization_id', userProfile.organization_id)
        .single()

      if (invitationError || !invitation) {
        return res.status(404).json({ error: 'Invitation not found' })
      }

      // Check if invitation is still pending
      if (invitation.status !== 'pending') {
        return res.status(400).json({ error: 'Invitation is not in pending status' })
      }

      // Check if invitation has expired
      if (new Date(invitation.expires_at) < new Date()) {
        return res.status(400).json({ error: 'Invitation has expired' })
      }

      // Prepare email data
      const emailData = {
        email: invitation.email,
        organizationName: invitation.organizations.name,
        inviterName: invitation.invited_by_profile?.full_name || 'WorkforceOne Admin',
        role: invitation.role,
        department: invitation.department,
        personalMessage: invitation.personal_message,
        invitationToken: invitation.invitation_token,
        expiresAt: invitation.expires_at
      }

      // Send email
      const emailSent = await emailService.sendInvitationEmail(emailData)

      if (!emailSent) {
        return res.status(500).json({ error: 'Failed to send invitation email' })
      }

      // Update invitation with email sent timestamp
      await supabase
        .from('company_invitations')
        .update({ 
          updated_at: new Date().toISOString(),
          // Add email_sent_at field if it exists in your schema
        })
        .eq('id', invitationId)

      res.json({ 
        success: true, 
        message: 'Invitation email sent successfully',
        invitationId 
      })

    } catch (error) {
      console.error('Error sending invitation email:', error)
      res.status(500).json({ 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error.message : undefined
      })
    }
  }
)

// Resend invitation email
router.post('/resend-email',
  authenticateUser,
  [
    body('invitationId').isUUID().withMessage('Valid invitation ID is required'),
  ],
  async (req: express.Request, res: express.Response) => {
    try {
      const errors = validationResult(req)
      if (!errors.isEmpty()) {
        return res.status(400).json({ 
          error: 'Validation failed', 
          details: errors.array() 
        })
      }

      const { invitationId } = req.body
      const userProfile = req.userProfile

      // Get invitation details
      const { data: invitation, error: invitationError } = await supabase
        .from('company_invitations')
        .select(`
          *,
          organizations!inner(name),
          invited_by_profile:profiles!company_invitations_invited_by_fkey(full_name)
        `)
        .eq('id', invitationId)
        .eq('organization_id', userProfile.organization_id)
        .single()

      if (invitationError || !invitation) {
        return res.status(404).json({ error: 'Invitation not found' })
      }

      // Check if invitation is still pending
      if (invitation.status !== 'pending') {
        return res.status(400).json({ error: 'Invitation is not in pending status' })
      }

      // Extend expiry date
      const newExpiryDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now

      // Update invitation expiry
      const { error: updateError } = await supabase
        .from('company_invitations')
        .update({ 
          expires_at: newExpiryDate.toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', invitationId)

      if (updateError) {
        return res.status(500).json({ error: 'Failed to update invitation expiry' })
      }

      // Prepare email data
      const emailData = {
        email: invitation.email,
        organizationName: invitation.organizations.name,
        inviterName: invitation.invited_by_profile?.full_name || 'WorkforceOne Admin',
        role: invitation.role,
        department: invitation.department,
        personalMessage: invitation.personal_message,
        invitationToken: invitation.invitation_token,
        expiresAt: newExpiryDate.toISOString()
      }

      // Send email
      const emailSent = await emailService.sendInvitationEmail(emailData)

      if (!emailSent) {
        return res.status(500).json({ error: 'Failed to resend invitation email' })
      }

      res.json({ 
        success: true, 
        message: 'Invitation email resent successfully',
        invitationId,
        newExpiryDate: newExpiryDate.toISOString()
      })

    } catch (error) {
      console.error('Error resending invitation email:', error)
      res.status(500).json({ 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error.message : undefined
      })
    }
  }
)

// Test email service connection
router.get('/test-email', 
  authenticateUser,
  async (req: express.Request, res: express.Response) => {
    try {
      const userProfile = req.userProfile

      // Only allow admins to test email service
      if (userProfile.role !== 'admin') {
        return res.status(403).json({ error: 'Only administrators can test email service' })
      }

      const connectionStatus = await emailService.testConnection()
      
      res.json({ 
        success: connectionStatus,
        message: connectionStatus ? 'Email service is working' : 'Email service connection failed'
      })

    } catch (error) {
      console.error('Error testing email service:', error)
      res.status(500).json({ 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? error.message : undefined
      })
    }
  }
)

export default router