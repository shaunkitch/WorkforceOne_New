import dotenv from 'dotenv'
import express from 'express'
import { createClient } from '@supabase/supabase-js'
import EmailService from '../services/emailService'

// Load environment variables
dotenv.config()

const router = express.Router()
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
)

// Get organization email integration
router.get('/', async (req: express.Request, res: express.Response) => {
  try {
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

    if (!profile || profile.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' })
    }

    // Get email integration for organization
    const { data: integration, error: integrationError } = await supabase
      .from('email_integrations')
      .select('*')
      .eq('organization_id', profile.organization_id)
      .single()

    if (integrationError && integrationError.code !== 'PGRST116') {
      return res.status(500).json({ error: 'Failed to fetch email integration' })
    }

    res.json({ 
      success: true, 
      integration: integration || null
    })

  } catch (error) {
    console.error('Error fetching email integration:', error)
    res.status(500).json({ 
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    })
  }
})

// Save/update organization email integration
router.post('/', async (req: express.Request, res: express.Response) => {
  try {
    const {
      provider,
      fromEmail,
      fromName,
      replyToEmail,
      smtpHost,
      smtpPort,
      smtpSecure,
      smtpUser,
      smtpPassword,
      sendgridApiKey,
      mailgunApiKey,
      mailgunDomain,
      sesAccessKey,
      sesSecretKey,
      sesRegion,
      gmailClientId,
      gmailClientSecret,
      gmailRefreshToken,
      outlookClientId,
      outlookClientSecret,
      outlookRefreshToken
    } = req.body

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

    if (!profile || profile.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' })
    }

    // Encrypt sensitive data
    const encryptedCredentials: any = {}
    
    if (smtpPassword) {
      const { data: encrypted } = await supabase.rpc('encrypt_email_credential', { credential: smtpPassword })
      encryptedCredentials.smtp_password_encrypted = encrypted
    }
    
    if (sendgridApiKey) {
      const { data: encrypted } = await supabase.rpc('encrypt_email_credential', { credential: sendgridApiKey })
      encryptedCredentials.sendgrid_api_key_encrypted = encrypted
    }
    
    if (mailgunApiKey) {
      const { data: encrypted } = await supabase.rpc('encrypt_email_credential', { credential: mailgunApiKey })
      encryptedCredentials.mailgun_api_key_encrypted = encrypted
    }
    
    if (sesAccessKey) {
      const { data: encrypted } = await supabase.rpc('encrypt_email_credential', { credential: sesAccessKey })
      encryptedCredentials.ses_access_key_encrypted = encrypted
    }
    
    if (sesSecretKey) {
      const { data: encrypted } = await supabase.rpc('encrypt_email_credential', { credential: sesSecretKey })
      encryptedCredentials.ses_secret_key_encrypted = encrypted
    }
    
    if (gmailClientSecret) {
      const { data: encrypted } = await supabase.rpc('encrypt_email_credential', { credential: gmailClientSecret })
      encryptedCredentials.gmail_client_secret_encrypted = encrypted
    }
    
    if (gmailRefreshToken) {
      const { data: encrypted } = await supabase.rpc('encrypt_email_credential', { credential: gmailRefreshToken })
      encryptedCredentials.gmail_refresh_token_encrypted = encrypted
    }
    
    if (outlookClientSecret) {
      const { data: encrypted } = await supabase.rpc('encrypt_email_credential', { credential: outlookClientSecret })
      encryptedCredentials.outlook_client_secret_encrypted = encrypted
    }
    
    if (outlookRefreshToken) {
      const { data: encrypted } = await supabase.rpc('encrypt_email_credential', { credential: outlookRefreshToken })
      encryptedCredentials.outlook_refresh_token_encrypted = encrypted
    }

    // Prepare integration data
    const integrationData = {
      organization_id: profile.organization_id,
      provider,
      is_active: true,
      smtp_host: smtpHost,
      smtp_port: smtpPort,
      smtp_secure: smtpSecure,
      smtp_user: smtpUser,
      mailgun_domain: mailgunDomain,
      ses_region: sesRegion,
      gmail_client_id: gmailClientId,
      outlook_client_id: outlookClientId,
      from_email: fromEmail,
      from_name: fromName,
      reply_to_email: replyToEmail,
      updated_at: new Date().toISOString(),
      updated_by: user.id,
      ...encryptedCredentials
    }

    // Upsert email integration
    const { data: integration, error: upsertError } = await supabase
      .from('email_integrations')
      .upsert(integrationData, { 
        onConflict: 'organization_id',
        returning: 'minimal'
      })

    if (upsertError) {
      console.error('Upsert error:', upsertError)
      return res.status(500).json({ error: 'Failed to save email integration' })
    }

    res.json({ 
      success: true, 
      message: 'Email integration saved successfully'
    })

  } catch (error) {
    console.error('Error saving email integration:', error)
    res.status(500).json({ 
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    })
  }
})

// Test email integration
router.post('/test', async (req: express.Request, res: express.Response) => {
  try {
    const { testEmail } = req.body
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

    if (!profile || profile.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' })
    }

    // Test email service connection
    const emailService = new EmailService()
    const connectionTest = await emailService.testConnectionForOrganization(profile.organization_id)

    if (connectionTest) {
      // Send test email if connection is successful
      const testEmailData = {
        email: testEmail,
        organizationId: profile.organization_id,
        organizationName: 'Your Organization',
        inviterName: profile.full_name || 'Admin',
        role: 'test',
        department: 'Test Department',
        personalMessage: 'This is a test email to verify your email integration is working correctly.',
        invitationToken: 'test-token',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      }

      const testSent = await emailService.sendInvitationEmail(testEmailData)

      res.json({
        success: true,
        connectionTest: true,
        emailSent: testSent,
        message: testSent ? 'Test email sent successfully' : 'Connection successful but email sending failed'
      })
    } else {
      res.json({
        success: false,
        connectionTest: false,
        emailSent: false,
        message: 'Email service connection failed'
      })
    }

  } catch (error) {
    console.error('Error testing email integration:', error)
    res.status(500).json({ 
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    })
  }
})

export default router