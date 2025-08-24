import dotenv from 'dotenv'
import express from 'express'
import { createClient } from '@supabase/supabase-js'
import EmailService from '../services/emailService'
import { createLogger } from '../utils/logger'

// Load environment variables
dotenv.config()

const router = express.Router()
const logger = createLogger('email-integrations')

// Debug environment variables
logger.debug('Environment check', {
  supabaseUrl: !!process.env.SUPABASE_URL,
  serviceKey: !!process.env.SUPABASE_SERVICE_KEY,
  anonKey: !!process.env.SUPABASE_ANON_KEY
})

// Create a Supabase client for user authentication (using anon key)
const supabaseAuth = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
)

// Create a Supabase client for database operations (using service key)
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

logger.debug('Supabase clients initialized')

// Get organization email integration
router.get('/', async (req: express.Request, res: express.Response) => {
  try {
    logger.info('GET /api/email-integrations called', { 
      userAgent: req.headers['user-agent'],
      hasAuth: !!req.headers.authorization
    })
    
    const authHeader = req.headers.authorization
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      logger.warn('Invalid auth header format')
      return res.status(401).json({ error: 'No valid authorization token provided' })
    }

    const token = authHeader.substring(7)
    logger.debug('Token received', { tokenLength: token.length })
    
    // Verify user using the auth client
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(token)
    logger.debug('User auth check', { hasError: !!authError, hasUser: !!user })
    
    if (authError || !user) {
      logger.warn('Token validation failed', { error: authError?.message })
      return res.status(401).json({ error: 'Invalid token', details: authError?.message })
    }

    // Get user profile - try by email first as a workaround
    logger.debug('Profile lookup started', { userId: user.id, hasEmail: !!user.email })
    
    let profile = null
    let profileError = null

    // Try lookup by email first (more reliable)
    if (user.email) {
      logger.debug('Looking up profile by email')
      
      // Create a fresh service client to test
      const freshServiceClient = createClient(
        'https://edeheyeloakiworbkfpg.supabase.co',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVkZWhleWVsb2FraXdvcmJrZnBnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDkxODY3NSwiZXhwIjoyMDcwNDk0Njc1fQ.HNoN21ykstlIQ6sPF5bsJtRyQyCTKENDBtFzgkEe40c',
        {
          auth: { autoRefreshToken: false, persistSession: false }
        }
      )
      
      logger.debug('Testing fresh service client')
      const { data: profileByEmail, error: emailError } = await freshServiceClient
        .from('profiles')
        .select('*')
        .eq('email', user.email)
        .single()
      
      if (!emailError && profileByEmail) {
        profile = profileByEmail
        logger.info('Profile found by email', { email: profile.email, role: profile.role })
        
        if (profile.id !== user.id) {
          logger.warn('ID mismatch between token and profile', { tokenId: user.id, profileId: profile.id })
          // Continue anyway since we found the user
        }
      } else {
        logger.debug('Profile by email lookup failed', { error: emailError?.message })
        
        // Fallback to ID lookup
        const { data: profileById, error: idError } = await freshServiceClient
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()
        
        profile = profileById
        profileError = idError
        logger.debug('Fallback to ID lookup', { found: !!profile })
        if (idError) logger.debug('ID lookup error', { error: idError.message })
      }
    }

    if (!profile) {
      logger.warn('No profile found for user')
      return res.status(403).json({ error: 'User profile not found' })
    }

    if (profile.role !== 'admin') {
      logger.warn('User role is not admin', { role: profile.role })
      return res.status(403).json({ error: 'Admin access required' })
    }

    logger.info('Admin access verified', { email: profile.email })

    // Create fresh service client for database operations
    const freshServiceClientForDB = createClient(
      'https://edeheyeloakiworbkfpg.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVkZWhleWVsb2FraXdvcmJrZnBnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDkxODY3NSwiZXhwIjoyMDcwNDk0Njc1fQ.HNoN21ykstlIQ6sPF5bsJtRyQyCTKENDBtFzgkEe40c',
      {
        auth: { autoRefreshToken: false, persistSession: false }
      }
    )

    // Get email integration for organization using fresh service client
    const { data: integration, error: integrationError } = await freshServiceClientForDB
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

  } catch (error: unknown) {
    logger.error('Error fetching email integration', { error: error instanceof Error ? error.message : String(error) })
    res.status(500).json({ 
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    })
  }
})

// Save/update organization email integration
router.post('/', async (req: express.Request, res: express.Response) => {
  try {
    logger.info('POST /api/email-integrations called')
    
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
    
    logger.debug('POST auth check', { hasAuthHeader: !!authHeader })
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      logger.warn('POST Invalid auth header format')
      return res.status(401).json({ error: 'No valid authorization token provided' })
    }

    const token = authHeader.substring(7)
    logger.debug('POST Token received', { tokenLength: token.length })
    
    // Verify user using the auth client
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(token)
    logger.debug('POST User auth check', { hasError: !!authError, hasUser: !!user })
    
    if (authError || !user) {
      logger.warn('POST Token validation failed', { error: authError?.message })
      return res.status(401).json({ error: 'Invalid token', details: authError?.message })
    }

    // Get user profile - try by email first as a workaround  
    logger.debug('POST Profile lookup started', { userId: user.id, hasEmail: !!user.email })
    
    let profile = null
    let profileError = null

    // Try lookup by email first (more reliable)
    if (user.email) {
      logger.debug('POST Looking up profile by email')
      
      // Create a fresh service client to test
      const freshServiceClient = createClient(
        'https://edeheyeloakiworbkfpg.supabase.co',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVkZWhleWVsb2FraXdvcmJrZnBnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDkxODY3NSwiZXhwIjoyMDcwNDk0Njc1fQ.HNoN21ykstlIQ6sPF5bsJtRyQyCTKENDBtFzgkEe40c',
        {
          auth: { autoRefreshToken: false, persistSession: false }
        }
      )
      
      logger.debug('POST Testing fresh service client')
      const { data: profileByEmail, error: emailError } = await freshServiceClient
        .from('profiles')
        .select('*')
        .eq('email', user.email)
        .single()
      
      if (!emailError && profileByEmail) {
        profile = profileByEmail
        logger.info('POST Profile found by email', { email: profile.email, role: profile.role })
        
        if (profile.id !== user.id) {
          logger.warn('POST ID mismatch between token and profile', { tokenId: user.id, profileId: profile.id })
          // Continue anyway since we found the user
        }
      } else {
        logger.debug('POST Profile by email lookup failed', { error: emailError?.message })
        
        // Fallback to ID lookup
        const { data: profileById, error: idError } = await freshServiceClient
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()
        
        profile = profileById
        profileError = idError
        logger.debug('POST Fallback to ID lookup', { found: !!profile })
        if (idError) logger.debug('POST ID lookup error', { error: idError.message })
      }
    }

    if (!profile) {
      logger.warn('POST No profile found for user')
      return res.status(403).json({ error: 'User profile not found' })
    }

    if (profile.role !== 'admin') {
      logger.warn('POST User role is not admin', { role: profile.role })
      return res.status(403).json({ error: 'Admin access required' })
    }

    logger.info('POST Admin access verified', { email: profile.email })

    // Create fresh service client for database operations
    const freshServiceClientForDB = createClient(
      'https://edeheyeloakiworbkfpg.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVkZWhleWVsb2FraXdvcmJrZnBnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDkxODY3NSwiZXhwIjoyMDcwNDk0Njc1fQ.HNoN21ykstlIQ6sPF5bsJtRyQyCTKENDBtFzgkEe40c',
      {
        auth: { autoRefreshToken: false, persistSession: false }
      }
    )

    // Encrypt sensitive data
    const encryptedCredentials: any = {}
    
    if (smtpPassword) {
      const { data: encrypted } = await freshServiceClientForDB.rpc('encrypt_email_credential', { credential: smtpPassword })
      encryptedCredentials.smtp_password_encrypted = encrypted
    }
    
    if (sendgridApiKey) {
      const { data: encrypted } = await freshServiceClientForDB.rpc('encrypt_email_credential', { credential: sendgridApiKey })
      encryptedCredentials.sendgrid_api_key_encrypted = encrypted
    }
    
    if (mailgunApiKey) {
      const { data: encrypted } = await freshServiceClientForDB.rpc('encrypt_email_credential', { credential: mailgunApiKey })
      encryptedCredentials.mailgun_api_key_encrypted = encrypted
    }
    
    if (sesAccessKey) {
      const { data: encrypted } = await freshServiceClientForDB.rpc('encrypt_email_credential', { credential: sesAccessKey })
      encryptedCredentials.ses_access_key_encrypted = encrypted
    }
    
    if (sesSecretKey) {
      const { data: encrypted } = await freshServiceClientForDB.rpc('encrypt_email_credential', { credential: sesSecretKey })
      encryptedCredentials.ses_secret_key_encrypted = encrypted
    }
    
    if (gmailClientSecret) {
      const { data: encrypted } = await freshServiceClientForDB.rpc('encrypt_email_credential', { credential: gmailClientSecret })
      encryptedCredentials.gmail_client_secret_encrypted = encrypted
    }
    
    if (gmailRefreshToken) {
      const { data: encrypted } = await freshServiceClientForDB.rpc('encrypt_email_credential', { credential: gmailRefreshToken })
      encryptedCredentials.gmail_refresh_token_encrypted = encrypted
    }
    
    if (outlookClientSecret) {
      const { data: encrypted } = await freshServiceClientForDB.rpc('encrypt_email_credential', { credential: outlookClientSecret })
      encryptedCredentials.outlook_client_secret_encrypted = encrypted
    }
    
    if (outlookRefreshToken) {
      const { data: encrypted } = await freshServiceClientForDB.rpc('encrypt_email_credential', { credential: outlookRefreshToken })
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

    // Upsert email integration using the working service client
    const { data: integration, error: upsertError } = await freshServiceClientForDB
      .from('email_integrations')
      .upsert(integrationData, { 
        onConflict: 'organization_id'
      })
      .select()

    if (upsertError) {
      logger.error('Upsert error', { error: upsertError })
      return res.status(500).json({ error: 'Failed to save email integration' })
    }

    res.json({ 
      success: true, 
      message: 'Email integration saved successfully'
    })

  } catch (error: unknown) {
    logger.error('Error saving email integration', { error: error instanceof Error ? error.message : String(error) })
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
    
    // Verify user using the auth client
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(token)
    if (authError || !user) {
      return res.status(401).json({ error: 'Invalid token' })
    }

    // Create fresh service client
    const freshServiceClient = createClient(
      'https://edeheyeloakiworbkfpg.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVkZWhleWVsb2FraXdvcmJrZnBnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDkxODY3NSwiZXhwIjoyMDcwNDk0Njc1fQ.HNoN21ykstlIQ6sPF5bsJtRyQyCTKENDBtFzgkEe40c',
      {
        auth: { autoRefreshToken: false, persistSession: false }
      }
    )

    // Get user profile
    const { data: profile } = await freshServiceClient
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' })
    }

    // Test email service connection
    const emailService = new EmailService()
    const connectionResult = await emailService.testConnectionForOrganization(profile.organization_id)

    logger.info('Connection test completed', { success: connectionResult.success })

    if (connectionResult.success) {
      // Send test email if connection is successful and testEmail is provided
      if (testEmail) {
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
          success: true,
          connectionTest: true,
          emailSent: false,
          message: 'Connection test successful (no test email sent)'
        })
      }
    } else {
      res.json({
        success: false,
        connectionTest: false,
        emailSent: false,
        message: `Email service connection failed: ${connectionResult.error}`,
        error: connectionResult.error,
        details: connectionResult.details
      })
    }

  } catch (error: unknown) {
    logger.error('Error testing email integration', { error: error instanceof Error ? error.message : String(error) })
    res.status(500).json({ 
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    })
  }
})

export default router