import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'

// Load environment variables
dotenv.config()

const nodemailer = require('nodemailer')

interface InvitationEmailData {
  email: string
  organizationId: string
  organizationName: string
  inviterName: string
  role: string
  department?: string
  personalMessage?: string
  invitationToken: string
  expiresAt: string
}

interface EmailConfig {
  host: string
  port: number
  secure: boolean
  auth: {
    user: string
    pass: string
  }
}

interface EmailIntegration {
  id: string
  organization_id: string
  provider: string
  is_active: boolean
  smtp_host: string
  smtp_port: number
  smtp_secure: boolean
  smtp_user: string
  smtp_password_encrypted: string
  sendgrid_api_key_encrypted: string
  mailgun_api_key_encrypted: string
  mailgun_domain: string
  ses_access_key_encrypted: string
  ses_secret_key_encrypted: string
  ses_region: string
  gmail_client_id: string
  gmail_client_secret_encrypted: string
  gmail_refresh_token_encrypted: string
  outlook_client_id: string
  outlook_client_secret_encrypted: string
  outlook_refresh_token_encrypted: string
  from_email: string
  from_name: string
  reply_to_email: string
}

class EmailService {
  private supabase: any

  constructor() {
    // Initialize Supabase client
    this.supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_KEY!
    )
  }

  private async getOrganizationEmailIntegration(organizationId: string): Promise<EmailIntegration | null> {
    try {
      const { data, error } = await this.supabase
        .from('email_integrations')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('is_active', true)
        .single()

      if (error || !data) {
        console.log('No active email integration found for organization:', organizationId)
        return null
      }

      return data
    } catch (error) {
      console.error('Error fetching email integration:', error)
      return null
    }
  }

  private async decryptCredential(encryptedValue: string): Promise<string> {
    try {
      const { data, error } = await this.supabase
        .rpc('decrypt_email_credential', { encrypted_credential: encryptedValue })

      if (error || !data) {
        throw new Error('Failed to decrypt credential')
      }

      return data
    } catch (error) {
      console.error('Error decrypting credential:', error)
      throw error
    }
  }

  private async createTransporterForOrganization(organizationId: string): Promise<any> {
    const integration = await this.getOrganizationEmailIntegration(organizationId)

    if (!integration) {
      // Fallback to environment variables for development or organizations without custom settings
      return this.createDefaultTransporter()
    }

    try {
      switch (integration.provider) {
        case 'smtp':
          if (!integration.smtp_host || !integration.smtp_user || !integration.smtp_password_encrypted) {
            throw new Error('Missing SMTP configuration')
          }
          
          const smtpPassword = await this.decryptCredential(integration.smtp_password_encrypted)
          
          return nodemailer.createTransport({
            host: integration.smtp_host,
            port: integration.smtp_port,
            secure: integration.smtp_secure,
            auth: {
              user: integration.smtp_user,
              pass: smtpPassword
            }
          })

        case 'sendgrid':
          if (!integration.sendgrid_api_key_encrypted) {
            throw new Error('Missing SendGrid API key')
          }
          
          const sendgridApiKey = await this.decryptCredential(integration.sendgrid_api_key_encrypted)
          
          return nodemailer.createTransporter('SendGrid', {
            auth: {
              api_key: sendgridApiKey
            }
          })

        case 'mailgun':
          if (!integration.mailgun_api_key_encrypted || !integration.mailgun_domain) {
            throw new Error('Missing Mailgun configuration')
          }
          
          const mailgunApiKey = await this.decryptCredential(integration.mailgun_api_key_encrypted)
          
          return nodemailer.createTransporter('Mailgun', {
            auth: {
              api_key: mailgunApiKey,
              domain: integration.mailgun_domain
            }
          })

        case 'ses':
          if (!integration.ses_access_key_encrypted || !integration.ses_secret_key_encrypted || !integration.ses_region) {
            throw new Error('Missing AWS SES configuration')
          }
          
          const sesAccessKey = await this.decryptCredential(integration.ses_access_key_encrypted)
          const sesSecretKey = await this.decryptCredential(integration.ses_secret_key_encrypted)
          
          return nodemailer.createTransporter('SES', {
            accessKeyId: sesAccessKey,
            secretAccessKey: sesSecretKey,
            region: integration.ses_region
          })

        case 'gmail':
          if (!integration.gmail_client_id || !integration.gmail_client_secret_encrypted || !integration.gmail_refresh_token_encrypted) {
            throw new Error('Missing Gmail OAuth configuration')
          }
          
          const gmailClientSecret = await this.decryptCredential(integration.gmail_client_secret_encrypted)
          const gmailRefreshToken = await this.decryptCredential(integration.gmail_refresh_token_encrypted)
          
          return nodemailer.createTransport({
            service: 'gmail',
            auth: {
              type: 'OAuth2',
              user: integration.from_email,
              clientId: integration.gmail_client_id,
              clientSecret: gmailClientSecret,
              refreshToken: gmailRefreshToken
            }
          })

        case 'outlook':
          if (!integration.outlook_client_id || !integration.outlook_client_secret_encrypted || !integration.outlook_refresh_token_encrypted) {
            throw new Error('Missing Outlook OAuth configuration')
          }
          
          const outlookClientSecret = await this.decryptCredential(integration.outlook_client_secret_encrypted)
          const outlookRefreshToken = await this.decryptCredential(integration.outlook_refresh_token_encrypted)
          
          return nodemailer.createTransport({
            service: 'outlook',
            auth: {
              type: 'OAuth2',
              user: integration.from_email,
              clientId: integration.outlook_client_id,
              clientSecret: outlookClientSecret,
              refreshToken: outlookRefreshToken
            }
          })

        default:
          throw new Error(`Unsupported email provider: ${integration.provider}`)
      }
    } catch (error) {
      console.error(`Error creating transporter for ${integration.provider}:`, error)
      // Fallback to default transporter
      return this.createDefaultTransporter()
    }
  }

  private createDefaultTransporter(): any {
    // Fallback to environment variables for development or when no integration is configured
    if (process.env.NODE_ENV === 'production') {
      // Production email configuration from environment
      const config: EmailConfig = {
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER!,
          pass: process.env.SMTP_PASS!
        }
      }
      
      return nodemailer.createTransport(config)
    } else {
      // Development: Create test account with Ethereal
      return nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: process.env.ETHEREAL_USER || 'test@ethereal.email',
          pass: process.env.ETHEREAL_PASS || 'testpass'
        }
      })
    }
  }

  async sendInvitationEmail(data: InvitationEmailData): Promise<boolean> {
    try {
      // Get organization-specific email integration and create transporter
      const transporter = await this.createTransporterForOrganization(data.organizationId)
      const integration = await this.getOrganizationEmailIntegration(data.organizationId)
      
      const invitationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/signup?token=${data.invitationToken}`
      
      const emailTemplate = this.generateInvitationEmailTemplate(data, invitationUrl)
      
      // Use organization's email settings if available, otherwise fall back to defaults
      const fromEmail = integration?.from_email || process.env.FROM_EMAIL || 'noreply@workforceone.com'
      const fromName = integration?.from_name || data.organizationName
      const replyToEmail = integration?.reply_to_email
      
      const mailOptions = {
        from: `"${fromName}" <${fromEmail}>`,
        to: data.email,
        subject: `You're invited to join ${data.organizationName} on WorkforceOne`,
        html: emailTemplate.html,
        text: emailTemplate.text,
        ...(replyToEmail && { replyTo: replyToEmail })
      }

      const info = await transporter.sendMail(mailOptions)
      
      // Log successful email send to the new email_logs table
      await this.logEmailToDatabase(data.organizationId, integration?.id, {
        to_email: data.email,
        from_email: fromEmail,
        subject: mailOptions.subject,
        email_type: 'invitation',
        status: 'sent',
        provider_message_id: info.messageId,
        related_invitation_token: data.invitationToken
      })

      console.log('Invitation email sent:', info.messageId)
      
      // In development, log the preview URL
      if (process.env.NODE_ENV !== 'production') {
        console.log('Preview URL:', nodemailer.getTestMessageUrl(info))
      }

      return true
    } catch (error) {
      console.error('Failed to send invitation email:', error)
      
      // Log failed email send
      await this.logEmailToDatabase(data.organizationId, null, {
        to_email: data.email,
        from_email: process.env.FROM_EMAIL || 'noreply@workforceone.com',
        subject: `You're invited to join ${data.organizationName} on WorkforceOne`,
        email_type: 'invitation',
        status: 'failed',
        error_message: error instanceof Error ? error.message : 'Unknown error',
        related_invitation_token: data.invitationToken
      })

      return false
    }
  }

  private generateInvitationEmailTemplate(data: InvitationEmailData, invitationUrl: string) {
    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Invitation to join ${data.organizationName}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
            border-radius: 8px 8px 0 0;
        }
        .content {
            background: #f8f9fa;
            padding: 30px;
            border-radius: 0 0 8px 8px;
        }
        .invitation-card {
            background: white;
            padding: 25px;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            margin: 20px 0;
        }
        .cta-button {
            display: inline-block;
            background: #667eea;
            color: white !important;
            padding: 15px 30px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
            margin: 20px 0;
            text-align: center;
        }
        .details {
            background: #e9ecef;
            padding: 15px;
            border-radius: 6px;
            margin: 15px 0;
        }
        .footer {
            text-align: center;
            padding: 20px;
            color: #666;
            font-size: 14px;
        }
        .logo {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 10px;
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="logo">WorkforceOne</div>
        <h1>You're Invited!</h1>
    </div>
    
    <div class="content">
        <div class="invitation-card">
            <h2>Welcome to ${data.organizationName}</h2>
            <p>Hi there!</p>
            <p>${data.inviterName} has invited you to join <strong>${data.organizationName}</strong> on WorkforceOne, our workforce management platform.</p>
            
            ${data.personalMessage ? `
            <div class="details">
                <strong>Personal message from ${data.inviterName}:</strong><br>
                <em>"${data.personalMessage}"</em>
            </div>
            ` : ''}
            
            <div class="details">
                <strong>Your role:</strong> ${data.role.charAt(0).toUpperCase() + data.role.slice(1)}<br>
                ${data.department ? `<strong>Department:</strong> ${data.department}<br>` : ''}
                <strong>Organization:</strong> ${data.organizationName}
            </div>
            
            <p>Click the button below to accept your invitation and create your account:</p>
            
            <div style="text-align: center;">
                <a href="${invitationUrl}" class="cta-button">Accept Invitation</a>
            </div>
            
            <p><small>This invitation will expire on ${new Date(data.expiresAt).toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}.</small></p>
            
            <p><small>If the button doesn't work, copy and paste this link into your browser:<br>
            <a href="${invitationUrl}">${invitationUrl}</a></small></p>
        </div>
    </div>
    
    <div class="footer">
        <p>This email was sent by WorkforceOne on behalf of ${data.organizationName}.</p>
        <p>If you weren't expecting this invitation, you can safely ignore this email.</p>
    </div>
</body>
</html>
    `

    const text = `
You're invited to join ${data.organizationName} on WorkforceOne!

${data.inviterName} has invited you to join ${data.organizationName} on WorkforceOne, our workforce management platform.

Your role: ${data.role.charAt(0).toUpperCase() + data.role.slice(1)}
${data.department ? `Department: ${data.department}` : ''}
Organization: ${data.organizationName}

${data.personalMessage ? `Personal message from ${data.inviterName}: "${data.personalMessage}"` : ''}

To accept your invitation and create your account, visit:
${invitationUrl}

This invitation will expire on ${new Date(data.expiresAt).toLocaleDateString()}.

If you weren't expecting this invitation, you can safely ignore this email.

---
This email was sent by WorkforceOne on behalf of ${data.organizationName}.
    `

    return { html, text }
  }

  private async logEmailToDatabase(organizationId: string, integrationId: string | null, emailData: any) {
    try {
      await this.supabase
        .from('email_logs')
        .insert({
          organization_id: organizationId,
          integration_id: integrationId,
          to_email: emailData.to_email,
          from_email: emailData.from_email,
          subject: emailData.subject,
          email_type: emailData.email_type,
          status: emailData.status,
          provider_message_id: emailData.provider_message_id,
          error_message: emailData.error_message,
          related_invitation_token: emailData.related_invitation_token,
          sent_at: new Date().toISOString(),
          created_at: new Date().toISOString()
        })
    } catch (error) {
      console.error('Failed to log email to database:', error)
    }
  }

  private async logEmailSend(email: string, type: string, metadata: any) {
    try {
      await this.supabase
        .from('system_logs')
        .insert({
          log_type: type,
          message: `Email sent to ${email}`,
          metadata: metadata,
          created_at: new Date().toISOString()
        })
    } catch (error) {
      console.error('Failed to log email send:', error)
    }
  }

  async testConnectionForOrganization(organizationId: string): Promise<{ success: boolean; error?: string; details?: any }> {
    try {
      console.log('🔍 Testing email connection for organization:', organizationId)
      
      const integration = await this.getOrganizationEmailIntegration(organizationId)
      if (!integration) {
        console.log('⚠️ No email integration found, using default transporter')
        const transporter = this.createDefaultTransporter()
        await transporter.verify()
        console.log('✅ Default email service connection verified')
        return { success: true }
      }
      
      console.log('📧 Email integration found:', {
        provider: integration.provider,
        host: integration.smtp_host,
        port: integration.smtp_port,
        secure: integration.smtp_secure,
        user: integration.smtp_user
      })
      
      const transporter = await this.createTransporterForOrganization(organizationId)
      
      console.log('🔧 Testing transporter connection...')
      await transporter.verify()
      console.log('✅ Email service connection verified for organization:', organizationId)
      return { success: true }
    } catch (error) {
      console.error('❌ Email service connection failed for organization:', organizationId)
      console.error('Error details:', error)
      
      let errorMessage = 'Unknown error'
      if (error instanceof Error) {
        errorMessage = error.message
      }
      
      return { 
        success: false, 
        error: errorMessage,
        details: {
          code: (error as any)?.code,
          responseCode: (error as any)?.responseCode,
          response: (error as any)?.response
        }
      }
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      const transporter = this.createDefaultTransporter()
      await transporter.verify()
      console.log('Email service connection verified (default)')
      return true
    } catch (error) {
      console.error('Email service connection failed (default):', error)
      return false
    }
  }
}

export default EmailService