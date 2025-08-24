import dotenv from 'dotenv'
import express from 'express'
import { createClient } from '@supabase/supabase-js'
import EmailService from '../services/emailService'

// Load environment variables
dotenv.config()

const router = express.Router()

// Debug environment variables
console.log('🔧 Environment check:')
console.log('SUPABASE_URL:', process.env.SUPABASE_URL ? 'Present' : 'Missing')
console.log('SERVICE_KEY:', process.env.SUPABASE_SERVICE_KEY ? `Present (${process.env.SUPABASE_SERVICE_KEY.substring(0, 20)}...)` : 'Missing')
console.log('ANON_KEY:', process.env.SUPABASE_ANON_KEY ? `Present (${process.env.SUPABASE_ANON_KEY.substring(0, 20)}...)` : 'Missing')

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

console.log('✅ Supabase clients initialized')

// Get organization email integration
router.get('/', async (req: express.Request, res: express.Response) => {
  try {
    console.log('🔍 GET /api/email-integrations called')
    console.log('Request headers:', Object.keys(req.headers))
    console.log('User Agent:', req.headers['user-agent'])
    
    const authHeader = req.headers.authorization
    
    console.log('Auth header:', authHeader ? 'Present' : 'Missing')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('Invalid auth header format')
      return res.status(401).json({ error: 'No valid authorization token provided' })
    }

    const token = authHeader.substring(7)
    console.log('Token length:', token.length)
    console.log('Token prefix:', token.substring(0, 20) + '...')
    
    // Verify user using the auth client
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(token)
    console.log('Auth error:', authError)
    console.log('User found:', user ? user.id : 'None')
    
    if (authError || !user) {
      console.log('Token validation failed:', authError?.message)
      return res.status(401).json({ error: 'Invalid token', details: authError?.message })
    }

    // Get user profile - try by email first as a workaround
    console.log('GET Profile lookup for user:', user.id)
    console.log('GET User email from token:', user.email)
    
    let profile = null
    let profileError = null

    // Try lookup by email first (more reliable)
    if (user.email) {
      console.log('GET Looking up profile by email:', user.email)
      
      // Create a fresh service client to test
      const freshServiceClient = createClient(
        'https://edeheyeloakiworbkfpg.supabase.co',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVkZWhleWVsb2FraXdvcmJrZnBnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDkxODY3NSwiZXhwIjoyMDcwNDk0Njc1fQ.HNoN21ykstlIQ6sPF5bsJtRyQyCTKENDBtFzgkEe40c',
        {
          auth: { autoRefreshToken: false, persistSession: false }
        }
      )
      
      console.log('GET Testing fresh service client...')
      const { data: profileByEmail, error: emailError } = await freshServiceClient
        .from('profiles')
        .select('*')
        .eq('email', user.email)
        .single()
      
      if (!emailError && profileByEmail) {
        profile = profileByEmail
        console.log('GET ✅ Profile found by email:', profile.email, profile.role)
        
        if (profile.id !== user.id) {
          console.log('GET ⚠️ ID mismatch - Token ID:', user.id, 'Profile ID:', profile.id)
          // Continue anyway since we found the user
        }
      } else {
        console.log('GET Profile by email error:', emailError?.message)
        
        // Fallback to ID lookup
        const { data: profileById, error: idError } = await freshServiceClient
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()
        
        profile = profileById
        profileError = idError
        console.log('GET Fallback to ID lookup:', profile ? 'Found' : 'Not found')
        if (idError) console.log('GET ID lookup error:', idError.message)
      }
    }

    if (!profile) {
      console.log('GET No profile found for user')
      return res.status(403).json({ error: 'User profile not found' })
    }

    if (profile.role !== 'admin') {
      console.log(`GET User role '${profile.role}' is not admin`)
      return res.status(403).json({ error: 'Admin access required' })
    }

    console.log('GET ✅ Admin access verified for:', profile.email)

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
    console.log('💾 POST /api/email-integrations called')
    console.log('Request headers:', Object.keys(req.headers))
    
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
    
    console.log('POST Auth header:', authHeader ? 'Present' : 'Missing')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('POST Invalid auth header format')
      return res.status(401).json({ error: 'No valid authorization token provided' })
    }

    const token = authHeader.substring(7)
    console.log('POST Token length:', token.length)
    
    // Verify user using the auth client
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(token)
    console.log('POST Auth error:', authError)
    console.log('POST User found:', user ? user.id : 'None')
    
    if (authError || !user) {
      console.log('POST Token validation failed:', authError?.message)
      return res.status(401).json({ error: 'Invalid token', details: authError?.message })
    }

    // Get user profile - try by email first as a workaround  
    console.log('POST Profile lookup for user:', user.id)
    console.log('POST User email from token:', user.email)
    
    let profile = null
    let profileError = null

    // Try lookup by email first (more reliable)
    if (user.email) {
      console.log('POST Looking up profile by email:', user.email)
      
      // Create a fresh service client to test
      const freshServiceClient = createClient(
        'https://edeheyeloakiworbkfpg.supabase.co',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVkZWhleWVsb2FraXdvcmJrZnBnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDkxODY3NSwiZXhwIjoyMDcwNDk0Njc1fQ.HNoN21ykstlIQ6sPF5bsJtRyQyCTKENDBtFzgkEe40c',
        {
          auth: { autoRefreshToken: false, persistSession: false }
        }
      )
      
      console.log('POST Testing fresh service client...')
      const { data: profileByEmail, error: emailError } = await freshServiceClient
        .from('profiles')
        .select('*')
        .eq('email', user.email)
        .single()
      
      if (!emailError && profileByEmail) {
        profile = profileByEmail
        console.log('POST ✅ Profile found by email:', profile.email, profile.role)
        
        if (profile.id !== user.id) {
          console.log('POST ⚠️ ID mismatch - Token ID:', user.id, 'Profile ID:', profile.id)
          // Continue anyway since we found the user
        }
      } else {
        console.log('POST Profile by email error:', emailError?.message)
        
        // Fallback to ID lookup
        const { data: profileById, error: idError } = await freshServiceClient
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()
        
        profile = profileById
        profileError = idError
        console.log('POST Fallback to ID lookup:', profile ? 'Found' : 'Not found')
        if (idError) console.log('POST ID lookup error:', idError.message)
      }
    }

    if (!profile) {
      console.log('POST No profile found for user')
      return res.status(403).json({ error: 'User profile not found' })
    }

    if (profile.role !== 'admin') {
      console.log(`POST User role '${profile.role}' is not admin`)
      return res.status(403).json({ error: 'Admin access required' })
    }

    console.log('POST ✅ Admin access verified for:', profile.email)

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

    console.log('📊 Connection test result:', connectionResult)

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

  } catch (error) {
    console.error('Error testing email integration:', error)
    res.status(500).json({ 
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
    })
  }
})

export default router