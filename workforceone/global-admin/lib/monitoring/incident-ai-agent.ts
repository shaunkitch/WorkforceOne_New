/**
 * AI-Powered Incident Investigation and Response Agent
 * Analyzes errors, investigates issues, and sends intelligent email alerts
 */

import { EmailService } from './email-service'

interface LogEntry {
  timestamp: string
  level: 'info' | 'warn' | 'error' | 'critical'
  message: string
  source: string
  stack?: string
  context?: Record<string, any>
}

interface Incident {
  id: string
  title: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  status: 'investigating' | 'identified' | 'monitoring' | 'resolved'
  description: string
  root_cause?: string
  impact: string
  affected_services: string[]
  started_at: string
  resolved_at?: string
  logs: LogEntry[]
  ai_analysis?: {
    probable_cause: string
    recommended_actions: string[]
    fix_confidence: number
    auto_fixable: boolean
  }
}


export class IncidentAIAgent {
  private incidents: Map<string, Incident> = new Map()
  private emailService: EmailService
  private openaiApiKey?: string

  constructor(openaiApiKey?: string) {
    this.emailService = EmailService.createFromEnv()
    this.openaiApiKey = openaiApiKey
  }

  /**
   * Analyze system logs and detect incidents
   */
  async analyzeLogs(logs: LogEntry[]): Promise<Incident[]> {
    const incidents: Incident[] = []
    
    // Group related logs by error patterns
    const errorGroups = this.groupErrorLogs(logs)
    
    for (const [pattern, groupLogs] of errorGroups.entries()) {
      const incident = await this.createIncidentFromLogs(pattern, groupLogs)
      if (incident) {
        incidents.push(incident)
        this.incidents.set(incident.id, incident)
        
        // Trigger AI analysis and email if critical
        if (incident.severity === 'critical' || incident.severity === 'high') {
          await this.investigateIncident(incident)
          await this.sendIncidentAlert(incident)
        }
      }
    }
    
    return incidents
  }

  /**
   * Group error logs by similar patterns
   */
  private groupErrorLogs(logs: LogEntry[]): Map<string, LogEntry[]> {
    const groups = new Map<string, LogEntry[]>()
    
    logs.filter(log => log.level === 'error' || log.level === 'critical').forEach(log => {
      // Extract error pattern (remove specific values like IDs, timestamps, etc.)
      const pattern = this.extractErrorPattern(log.message)
      
      if (!groups.has(pattern)) {
        groups.set(pattern, [])
      }
      groups.get(pattern)!.push(log)
    })
    
    return groups
  }

  /**
   * Extract error pattern from log message
   */
  private extractErrorPattern(message: string): string {
    return message
      .replace(/\d+/g, 'NUM') // Replace numbers
      .replace(/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/gi, 'UUID') // Replace UUIDs
      .replace(/https?:\/\/[^\s]+/g, 'URL') // Replace URLs
      .replace(/\/[^\s]+/g, 'PATH') // Replace file paths
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim()
  }

  /**
   * Create incident from grouped logs
   */
  private async createIncidentFromLogs(pattern: string, logs: LogEntry[]): Promise<Incident | null> {
    if (logs.length === 0) return null

    const firstLog = logs[0]
    const lastLog = logs[logs.length - 1]
    
    // Determine severity based on frequency and error type
    let severity: Incident['severity'] = 'low'
    if (logs.length > 10) severity = 'high'
    if (logs.length > 5) severity = 'medium'
    if (pattern.includes('critical') || pattern.includes('outage') || pattern.includes('database')) {
      severity = 'critical'
    }

    // Determine affected services
    const affectedServices = this.identifyAffectedServices(logs)
    
    const incident: Incident = {
      id: `INC-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      title: this.generateIncidentTitle(pattern, logs.length),
      severity,
      status: 'investigating',
      description: `${logs.length} occurrences of: ${pattern}`,
      impact: this.calculateImpact(severity, affectedServices),
      affected_services: affectedServices,
      started_at: firstLog.timestamp,
      logs: logs.slice(0, 10) // Keep last 10 logs
    }

    return incident
  }

  /**
   * Generate meaningful incident title
   */
  private generateIncidentTitle(pattern: string, count: number): string {
    if (pattern.includes('Vercel API error')) return `Vercel API Integration Issues (${count} errors)`
    if (pattern.includes('Supabase') && pattern.includes('error')) return `Supabase Database Connectivity Issues (${count} errors)`
    if (pattern.includes('ENOENT')) return `Missing File/Resource Errors (${count} errors)`
    if (pattern.includes('timeout')) return `Service Timeout Issues (${count} errors)`
    if (pattern.includes('authentication')) return `Authentication Service Issues (${count} errors)`
    
    return `System Error Pattern Detected (${count} occurrences)`
  }

  /**
   * Identify affected services from logs
   */
  private identifyAffectedServices(logs: LogEntry[]): string[] {
    const services = new Set<string>()
    
    logs.forEach(log => {
      if (log.message.includes('Vercel') || log.source === 'vercel') services.add('vercel')
      if (log.message.includes('Supabase') || log.source === 'supabase') services.add('supabase')
      if (log.message.includes('database') || log.message.includes('postgres')) services.add('database')
      if (log.message.includes('auth')) services.add('authentication')
      if (log.message.includes('storage')) services.add('storage')
      if (log.message.includes('api')) services.add('api')
    })
    
    return Array.from(services)
  }

  /**
   * Calculate impact description
   */
  private calculateImpact(severity: string, services: string[]): string {
    if (severity === 'critical') {
      return `Critical impact affecting ${services.join(', ')}. Service functionality may be severely degraded.`
    }
    if (severity === 'high') {
      return `High impact on ${services.join(', ')}. Users may experience service disruptions.`
    }
    if (severity === 'medium') {
      return `Medium impact on ${services.join(', ')}. Some features may be affected.`
    }
    return `Low impact on ${services.join(', ')}. Monitoring for escalation.`
  }

  /**
   * Use AI to investigate incident and provide recommendations
   */
  private async investigateIncident(incident: Incident): Promise<void> {
    if (!this.openaiApiKey) {
      // Fallback analysis without AI
      incident.ai_analysis = this.performBasicAnalysis(incident)
      return
    }

    try {
      const prompt = this.createAnalysisPrompt(incident)
      
      // In real implementation, call OpenAI API here
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.openaiApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content: 'You are an expert DevOps engineer analyzing system incidents. Provide concise, actionable recommendations.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 500,
          temperature: 0.1
        })
      })

      const aiResponse = await response.json()
      const analysis = this.parseAIResponse(aiResponse.choices[0].message.content)
      
      incident.ai_analysis = analysis
    } catch (error) {
      console.error('AI analysis failed:', error)
      incident.ai_analysis = this.performBasicAnalysis(incident)
    }
  }

  /**
   * Create analysis prompt for AI
   */
  private createAnalysisPrompt(incident: Incident): string {
    const logMessages = incident.logs.map(log => `${log.timestamp}: ${log.message}`).join('\n')
    
    return `
INCIDENT ANALYSIS REQUEST

Title: ${incident.title}
Severity: ${incident.severity}
Affected Services: ${incident.affected_services.join(', ')}
Description: ${incident.description}

Recent Error Logs:
${logMessages}

Please analyze this incident and provide:
1. Probable root cause
2. 3-5 specific recommended actions
3. Confidence level (0-100) in the diagnosis
4. Whether this can be auto-fixed (true/false)

Format as JSON:
{
  "probable_cause": "...",
  "recommended_actions": ["action1", "action2", "action3"],
  "fix_confidence": 85,
  "auto_fixable": false
}
`
  }

  /**
   * Parse AI response
   */
  private parseAIResponse(content: string): Incident['ai_analysis'] {
    try {
      const parsed = JSON.parse(content)
      return {
        probable_cause: parsed.probable_cause || 'Unknown',
        recommended_actions: parsed.recommended_actions || [],
        fix_confidence: parsed.fix_confidence || 50,
        auto_fixable: parsed.auto_fixable || false
      }
    } catch {
      return this.performBasicAnalysis()
    }
  }

  /**
   * Fallback analysis without AI
   */
  private performBasicAnalysis(incident?: Incident): Incident['ai_analysis'] {
    if (!incident) {
      return {
        probable_cause: 'Analysis pending',
        recommended_actions: ['Check system logs', 'Verify service connectivity'],
        fix_confidence: 50,
        auto_fixable: false
      }
    }

    let cause = 'Unknown system error'
    let actions = ['Check system logs', 'Restart affected services']
    let confidence = 50
    let autoFixable = false

    // Rule-based analysis
    if (incident.title.includes('Vercel API')) {
      cause = 'Vercel API authentication or endpoint access issues'
      actions = [
        'Verify VERCEL_API_TOKEN is valid and has correct permissions',
        'Check if Vercel project ID exists and is accessible',
        'Review Vercel API rate limits',
        'Test API connectivity manually'
      ]
      confidence = 80
    } else if (incident.title.includes('Supabase')) {
      cause = 'Supabase database connectivity or configuration issues'
      actions = [
        'Verify SUPABASE_SERVICE_ROLE_KEY is correct',
        'Check Supabase project status in dashboard',
        'Review database connection limits',
        'Test database queries manually'
      ]
      confidence = 75
    } else if (incident.title.includes('Missing File')) {
      cause = 'File system or build process issues'
      actions = [
        'Clear Next.js build cache (.next directory)',
        'Restart development server',
        'Check for missing dependencies',
        'Verify file permissions'
      ]
      confidence = 90
      autoFixable = true
    }

    return {
      probable_cause: cause,
      recommended_actions: actions,
      fix_confidence: confidence,
      auto_fixable: autoFixable
    }
  }

  /**
   * Send incident alert email
   */
  async sendIncidentAlert(incident: Incident): Promise<void> {
    try {
      const emailHtml = this.generateIncidentEmail(incident)
      
      const success = await this.emailService.sendEmail({
        to: process.env.ADMIN_EMAIL || 'admin@workforceone.co.za',
        subject: `🚨 ${incident.severity.toUpperCase()} Incident: ${incident.title}`,
        html: emailHtml
      })

      if (success) {
        console.log(`📧 Incident alert sent successfully`)
      } else {
        console.error('Failed to send incident alert email')
      }
    } catch (error) {
      console.error('Failed to send incident alert email:', error)
    }
  }

  /**
   * Generate incident email HTML
   */
  private generateIncidentEmail(incident: Incident): string {
    const severityColor = {
      low: '#10B981',
      medium: '#F59E0B', 
      high: '#EF4444',
      critical: '#DC2626'
    }

    const aiSection = incident.ai_analysis ? `
      <div style="background-color: #F3F4F6; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="color: #374151; margin-top: 0;">🤖 AI Analysis</h3>
        <p><strong>Probable Cause:</strong> ${incident.ai_analysis.probable_cause}</p>
        <p><strong>Confidence:</strong> ${incident.ai_analysis.fix_confidence}%</p>
        <p><strong>Auto-fixable:</strong> ${incident.ai_analysis.auto_fixable ? 'Yes' : 'No'}</p>
        
        <h4 style="color: #374151;">Recommended Actions:</h4>
        <ol style="margin: 10px 0;">
          ${incident.ai_analysis.recommended_actions.map(action => `<li>${action}</li>`).join('')}
        </ol>
      </div>
    ` : ''

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>WorkforceOne Incident Alert</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: ${severityColor[incident.severity]}; color: white; padding: 20px; border-radius: 8px; text-align: center;">
            <h1 style="margin: 0;">🚨 ${incident.severity.toUpperCase()} INCIDENT</h1>
            <h2 style="margin: 10px 0 0 0;">${incident.title}</h2>
        </div>
        
        <div style="background-color: #FFFFFF; padding: 20px; border: 1px solid #E5E7EB; border-radius: 8px; margin-top: 20px;">
            <h3 style="color: #374151; margin-top: 0;">Incident Details</h3>
            <table style="width: 100%; border-collapse: collapse;">
                <tr>
                    <td style="padding: 8px; border-bottom: 1px solid #E5E7EB;"><strong>Incident ID:</strong></td>
                    <td style="padding: 8px; border-bottom: 1px solid #E5E7EB;">${incident.id}</td>
                </tr>
                <tr>
                    <td style="padding: 8px; border-bottom: 1px solid #E5E7EB;"><strong>Severity:</strong></td>
                    <td style="padding: 8px; border-bottom: 1px solid #E5E7EB;">
                        <span style="background-color: ${severityColor[incident.severity]}; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px;">
                            ${incident.severity.toUpperCase()}
                        </span>
                    </td>
                </tr>
                <tr>
                    <td style="padding: 8px; border-bottom: 1px solid #E5E7EB;"><strong>Status:</strong></td>
                    <td style="padding: 8px; border-bottom: 1px solid #E5E7EB;">${incident.status}</td>
                </tr>
                <tr>
                    <td style="padding: 8px; border-bottom: 1px solid #E5E7EB;"><strong>Started:</strong></td>
                    <td style="padding: 8px; border-bottom: 1px solid #E5E7EB;">${new Date(incident.started_at).toLocaleString()}</td>
                </tr>
                <tr>
                    <td style="padding: 8px; border-bottom: 1px solid #E5E7EB;"><strong>Affected Services:</strong></td>
                    <td style="padding: 8px; border-bottom: 1px solid #E5E7EB;">${incident.affected_services.join(', ')}</td>
                </tr>
            </table>
            
            <h4 style="color: #374151;">Description</h4>
            <p style="background-color: #F9FAFB; padding: 15px; border-radius: 6px; border-left: 4px solid #6B7280;">
                ${incident.description}
            </p>
            
            <h4 style="color: #374151;">Impact</h4>
            <p style="background-color: #FEF2F2; padding: 15px; border-radius: 6px; border-left: 4px solid #EF4444;">
                ${incident.impact}
            </p>
        </div>
        
        ${aiSection}
        
        <div style="background-color: #F9FAFB; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #374151; margin-top: 0;">Recent Error Logs</h3>
            <div style="background-color: #1F2937; color: #F9FAFB; padding: 15px; border-radius: 6px; font-family: monospace; font-size: 12px; overflow-x: auto;">
                ${incident.logs.slice(0, 5).map(log => 
                    `${log.timestamp}: [${log.level.toUpperCase()}] ${log.message}`
                ).join('\n')}
            </div>
        </div>
        
        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #E5E7EB;">
            <p style="color: #6B7280; font-size: 14px;">
                This alert was generated by WorkforceOne AI Incident Management System<br>
                Dashboard: <a href="http://localhost:3002/dashboard/health">http://localhost:3002/dashboard/health</a>
            </p>
        </div>
    </div>
</body>
</html>
    `
  }

  /**
   * Process current system logs and detect incidents
   */
  async processCurrentLogs(): Promise<Incident[]> {
    // Extract logs from current session (this would be enhanced to read actual log files)
    const currentLogs: LogEntry[] = [
      {
        timestamp: new Date().toISOString(),
        level: 'error',
        message: 'Vercel API error: 404 Not Found',
        source: 'vercel',
        context: { endpoint: '/v2/analytics', project_id: 'prj_6TF2w1N6A8uGPQP3Cz3lknRBWOgg' }
      },
      {
        timestamp: new Date().toISOString(),
        level: 'error', 
        message: 'ENOENT: no such file or directory, open \'/home/shaunkitch/WorkforceOne_New/workforceone/global-admin/.next/server/app/api/monitoring/health/route.js\'',
        source: 'system',
        context: { syscall: 'open', code: 'ENOENT' }
      },
      {
        timestamp: new Date().toISOString(),
        level: 'error',
        message: 'Failed to get Supabase database metrics: Connection timeout',
        source: 'supabase'
      }
    ]

    return await this.analyzeLogs(currentLogs)
  }

  /**
   * Get all current incidents
   */
  getIncidents(): Incident[] {
    return Array.from(this.incidents.values())
  }

  /**
   * Resolve an incident
   */
  resolveIncident(incidentId: string, resolution: string): boolean {
    const incident = this.incidents.get(incidentId)
    if (incident) {
      incident.status = 'resolved'
      incident.resolved_at = new Date().toISOString()
      incident.root_cause = resolution
      return true
    }
    return false
  }
}