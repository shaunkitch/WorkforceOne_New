import dotenv from 'dotenv'
import express from 'express'
import { createClient } from '@supabase/supabase-js'
import EmailService from '../services/emailService'
import { createLogger } from '../utils/logger'

// Load environment variables
dotenv.config()

const router = express.Router()
const logger = createLogger('simple-invitations')
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

// Simple send invitation email endpoint
router.post('/send-email', async (req: express.Request, res: express.Response) => {
  try {
    const { invitationId } = req.body
    const authHeader = req.headers.authorization
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No valid authorization token provided' })
    }

    const token = authHeader.substring(7)
    
    // Verify user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid token' })
    }

    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (!profile || (profile.role !== 'admin' && profile.role !== 'manager')) {
      return res.status(403).json({ error: 'Insufficient permissions' })
    }

    // Get invitation details
    const { data: invitation, error: invitationError } = await supabase
      .from('company_invitations')
      .select(`
        *,
        organizations!inner(name),
        invited_by_profile:profiles!company_invitations_invited_by_fkey(full_name)
      `)
      .eq('id', invitationId)
      .eq('organization_id', profile.organization_id)
      .single()

    if (invitationError || !invitation) {
      return res.status(404).json({ error: 'Invitation not found' })
    }

    // Create email service instance and send email
    const emailService = new EmailService()
    const emailData = {
      email: invitation.email,
      organizationId: profile.organization_id,
      organizationName: invitation.organizations.name,
      inviterName: invitation.invited_by_profile?.full_name || 'WorkforceOne Admin',
      role: invitation.role,
      department: invitation.department,
      personalMessage: invitation.personal_message,
      invitationToken: invitation.invitation_token,
      expiresAt: invitation.expires_at
    }

    const emailSent = await emailService.sendInvitationEmail(emailData)

    if (!emailSent) {
      return res.status(500).json({ error: 'Failed to send invitation email' })
    }

    res.json({ 
      success: true, 
      message: 'Invitation email sent successfully',
      invitationId 
    })

  } catch (error: unknown) {
    logger.error('Error sending invitation email', { error: (error as Error).message })
    res.status(500).json({ 
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    })
  }
})

// Simple resend invitation email endpoint
router.post('/resend-email', async (req: express.Request, res: express.Response) => {
  try {
    const { invitationId } = req.body
    const authHeader = req.headers.authorization
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No valid authorization token provided' })
    }

    const token = authHeader.substring(7)
    
    // Verify user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid token' })
    }

    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (!profile || (profile.role !== 'admin' && profile.role !== 'manager')) {
      return res.status(403).json({ error: 'Insufficient permissions' })
    }

    // Get invitation details
    const { data: invitation, error: invitationError } = await supabase
      .from('company_invitations')
      .select(`
        *,
        organizations!inner(name),
        invited_by_profile:profiles!company_invitations_invited_by_fkey(full_name)
      `)
      .eq('id', invitationId)
      .eq('organization_id', profile.organization_id)
      .single()

    if (invitationError || !invitation) {
      return res.status(404).json({ error: 'Invitation not found' })
    }

    // Extend expiry date
    const newExpiryDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

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

    // Send email
    const emailService = new EmailService()
    const emailData = {
      email: invitation.email,
      organizationId: profile.organization_id,
      organizationName: invitation.organizations.name,
      inviterName: invitation.invited_by_profile?.full_name || 'WorkforceOne Admin',
      role: invitation.role,
      department: invitation.department,
      personalMessage: invitation.personal_message,
      invitationToken: invitation.invitation_token,
      expiresAt: newExpiryDate.toISOString()
    }

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

  } catch (error: unknown) {
    logger.error('Error resending invitation email', { error: (error as Error).message })
    res.status(500).json({ 
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    })
  }
})

export default router