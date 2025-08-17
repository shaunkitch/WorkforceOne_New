/**
 * Enhanced Email Service with SendGrid and SMTP Support
 * Handles incident alerts and system notifications
 */

import sgMail from '@sendgrid/mail'
import nodemailer from 'nodemailer'

interface EmailConfig {
  provider: 'sendgrid' | 'smtp'
  sendgrid_api_key?: string
  smtp_host?: string
  smtp_port?: number
  smtp_secure?: boolean
  smtp_user?: string
  smtp_pass?: string
  from_email: string
  from_name?: string
  admin_email: string
}

interface EmailData {
  to: string
  subject: string
  html: string
  text?: string
}

export class EmailService {
  private config: EmailConfig
  private smtpTransporter?: any

  constructor(config: EmailConfig) {
    this.config = config
    
    if (config.provider === 'sendgrid' && config.sendgrid_api_key) {
      sgMail.setApiKey(config.sendgrid_api_key)
    } else if (config.provider === 'smtp') {
      this.setupSMTP()
    }
  }

  private setupSMTP() {
    if (!this.config.smtp_host || !this.config.smtp_user || !this.config.smtp_pass) {
      throw new Error('SMTP configuration incomplete')
    }

    this.smtpTransporter = nodemailer.createTransporter({
      host: this.config.smtp_host,
      port: this.config.smtp_port || 587,
      secure: this.config.smtp_secure || false,
      auth: {
        user: this.config.smtp_user,
        pass: this.config.smtp_pass
      }
    })
  }

  async sendEmail(emailData: EmailData): Promise<boolean> {
    try {
      if (this.config.provider === 'sendgrid') {
        return await this.sendWithSendGrid(emailData)
      } else {
        return await this.sendWithSMTP(emailData)
      }
    } catch (error) {
      console.error('Email sending failed:', error)
      return false
    }
  }

  private async sendWithSendGrid(emailData: EmailData): Promise<boolean> {
    try {
      const msg = {
        to: emailData.to,
        from: {
          email: this.config.from_email,
          name: this.config.from_name || 'WorkforceOne Alerts'
        },
        subject: emailData.subject,
        html: emailData.html,
        text: emailData.text || this.htmlToText(emailData.html)
      }

      await sgMail.send(msg)
      console.log(`📧 Email sent successfully via SendGrid to ${emailData.to}`)
      return true
    } catch (error: any) {
      console.error('SendGrid error:', error.response?.body || error.message)
      return false
    }
  }

  private async sendWithSMTP(emailData: EmailData): Promise<boolean> {
    try {
      if (!this.smtpTransporter) {
        throw new Error('SMTP transporter not configured')
      }

      await this.smtpTransporter.sendMail({
        from: `"${this.config.from_name || 'WorkforceOne Alerts'}" <${this.config.from_email}>`,
        to: emailData.to,
        subject: emailData.subject,
        html: emailData.html,
        text: emailData.text || this.htmlToText(emailData.html)
      })

      console.log(`📧 Email sent successfully via SMTP to ${emailData.to}`)
      return true
    } catch (error: any) {
      console.error('SMTP error:', error.message)
      return false
    }
  }

  private htmlToText(html: string): string {
    return html
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/\s+/g, ' ')
      .trim()
  }

  async testConnection(): Promise<{ success: boolean; message: string }> {
    const testEmail = {
      to: this.config.admin_email,
      subject: '✅ WorkforceOne Email Test - Configuration Successful',
      html: this.generateTestEmailHTML()
    }

    try {
      const success = await this.sendEmail(testEmail)
      return {
        success,
        message: success 
          ? `Test email sent successfully via ${this.config.provider.toUpperCase()} to ${this.config.admin_email}`
          : `Failed to send test email via ${this.config.provider.toUpperCase()}`
      }
    } catch (error) {
      return {
        success: false,
        message: `Email test failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }

  private generateTestEmailHTML(): string {
    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>WorkforceOne Email Test</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #10B981; color: white; padding: 20px; border-radius: 8px; text-align: center;">
            <h1 style="margin: 0;">✅ Email Configuration Successful!</h1>
            <h2 style="margin: 10px 0 0 0;">WorkforceOne AI Monitoring</h2>
        </div>
        
        <div style="background-color: #FFFFFF; padding: 20px; border: 1px solid #E5E7EB; border-radius: 8px; margin-top: 20px;">
            <h3 style="color: #374151; margin-top: 0;">🎉 Great News!</h3>
            <p>Your WorkforceOne AI Incident Management System is now configured to send email alerts!</p>
            
            <div style="background-color: #F0F9FF; border-left: 4px solid #0EA5E9; padding: 15px; margin: 20px 0;">
                <h4 style="margin: 0 0 10px 0; color: #0369A1;">What happens next:</h4>
                <ul style="margin: 0; padding-left: 20px;">
                    <li>🚨 <strong>Critical incidents</strong> will trigger immediate email alerts</li>
                    <li>🤖 <strong>AI analysis</strong> will provide root cause and solutions</li>
                    <li>📊 <strong>Real-time monitoring</strong> of Vercel and Supabase services</li>
                    <li>📈 <strong>Trend analysis</strong> to prevent future issues</li>
                </ul>
            </div>
            
            <div style="background-color: #F9FAFB; padding: 15px; border-radius: 6px; margin: 20px 0;">
                <h4 style="color: #374151; margin-top: 0;">Configuration Details:</h4>
                <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                        <td style="padding: 8px; border-bottom: 1px solid #E5E7EB;"><strong>Email Provider:</strong></td>
                        <td style="padding: 8px; border-bottom: 1px solid #E5E7EB;">${this.config.provider.toUpperCase()}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px; border-bottom: 1px solid #E5E7EB;"><strong>Alert Email:</strong></td>
                        <td style="padding: 8px; border-bottom: 1px solid #E5E7EB;">${this.config.admin_email}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px; border-bottom: 1px solid #E5E7EB;"><strong>From Address:</strong></td>
                        <td style="padding: 8px; border-bottom: 1px solid #E5E7EB;">${this.config.from_email}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px;"><strong>Test Status:</strong></td>
                        <td style="padding: 8px;">✅ Successfully Delivered</td>
                    </tr>
                </table>
            </div>
            
            <div style="background-color: #FEF3C7; border-left: 4px solid #F59E0B; padding: 15px; margin: 20px 0;">
                <h4 style="margin: 0 0 10px 0; color: #92400E;">💡 Pro Tip:</h4>
                <p style="margin: 0; color: #92400E;">
                    Visit your AI Incidents dashboard to see current issues detected by the system: 
                    <a href="http://localhost:3002/dashboard/incidents" style="color: #0EA5E9;">View Incidents</a>
                </p>
            </div>
        </div>
        
        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #E5E7EB;">
            <p style="color: #6B7280; font-size: 14px;">
                This test email was sent by WorkforceOne AI Incident Management System<br>
                Timestamp: ${new Date().toISOString()}<br>
                Dashboard: <a href="http://localhost:3002/dashboard">http://localhost:3002/dashboard</a>
            </p>
        </div>
    </div>
</body>
</html>
    `
  }

  static createFromEnv(): EmailService {
    const config: EmailConfig = {
      provider: process.env.EMAIL_PROVIDER === 'sendgrid' ? 'sendgrid' : 'smtp',
      sendgrid_api_key: process.env.SENDGRID_API_KEY,
      smtp_host: process.env.SMTP_HOST,
      smtp_port: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 587,
      smtp_secure: process.env.SMTP_SECURE === 'true',
      smtp_user: process.env.SMTP_USER,
      smtp_pass: process.env.SMTP_PASS,
      from_email: process.env.FROM_EMAIL || 'noreply@workforceone.co.za',
      from_name: process.env.FROM_NAME || 'WorkforceOne Alerts',
      admin_email: process.env.ADMIN_EMAIL || 'admin@workforceone.co.za'
    }

    return new EmailService(config)
  }
}