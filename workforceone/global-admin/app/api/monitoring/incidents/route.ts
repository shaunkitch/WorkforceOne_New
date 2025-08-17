import { NextRequest, NextResponse } from 'next/server'
import { IncidentAIAgent } from '@/lib/monitoring/incident-ai-agent'

let incidentAgent: IncidentAIAgent | null = null

function getIncidentAgent(): IncidentAIAgent {
  if (!incidentAgent) {
    incidentAgent = new IncidentAIAgent(process.env.OPENAI_API_KEY)
  }
  
  return incidentAgent
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status')
    const severity = searchParams.get('severity')
    const includeAnalysis = searchParams.get('analysis') === 'true'

    const agent = getIncidentAgent()
    
    // Process current logs to detect new incidents
    const newIncidents = await agent.processCurrentLogs()
    
    // Get all incidents
    let incidents = agent.getIncidents()
    
    // Apply filters
    if (status) {
      incidents = incidents.filter(incident => incident.status === status)
    }
    
    if (severity) {
      incidents = incidents.filter(incident => incident.severity === severity)
    }

    // Remove AI analysis if not requested to reduce payload size
    if (!includeAnalysis) {
      incidents = incidents.map(incident => {
        const { ai_analysis, ...incidentWithoutAI } = incident
        return incidentWithoutAI
      })
    }

    const response = {
      success: true,
      data: incidents,
      meta: {
        total: incidents.length,
        new_incidents: newIncidents.length,
        status_filter: status,
        severity_filter: severity,
        counts: {
          investigating: agent.getIncidents().filter(i => i.status === 'investigating').length,
          identified: agent.getIncidents().filter(i => i.status === 'identified').length,
          monitoring: agent.getIncidents().filter(i => i.status === 'monitoring').length,
          resolved: agent.getIncidents().filter(i => i.status === 'resolved').length,
          critical: agent.getIncidents().filter(i => i.severity === 'critical').length,
          high: agent.getIncidents().filter(i => i.severity === 'high').length,
          medium: agent.getIncidents().filter(i => i.severity === 'medium').length,
          low: agent.getIncidents().filter(i => i.severity === 'low').length
        }
      }
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Incidents fetch error:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch incidents',
      data: []
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action, incident_id, data } = body

    const agent = getIncidentAgent()

    switch (action) {
      case 'resolve':
        if (!incident_id || !data?.resolution) {
          return NextResponse.json({
            success: false,
            error: 'Missing incident_id or resolution'
          }, { status: 400 })
        }
        
        const resolved = agent.resolveIncident(incident_id, data.resolution)
        if (resolved) {
          return NextResponse.json({
            success: true,
            message: 'Incident resolved successfully'
          })
        } else {
          return NextResponse.json({
            success: false,
            error: 'Incident not found'
          }, { status: 404 })
        }

      case 'analyze_logs':
        // Trigger manual log analysis
        const incidents = await agent.processCurrentLogs()
        return NextResponse.json({
          success: true,
          message: `Analyzed logs and detected ${incidents.length} incidents`,
          data: incidents
        })

      case 'test_email_service':
        // Test email service directly
        const { EmailService } = await import('@/lib/monitoring/email-service')
        const emailService = EmailService.createFromEnv()
        
        const testResult = await emailService.testConnection()
        
        return NextResponse.json({
          success: testResult.success,
          message: testResult.message
        })

      case 'send_test_alert':
        // Send test alert email
        const testIncident = {
          id: 'TEST-' + Date.now(),
          title: 'Test Alert - System Check',
          severity: 'medium' as const,
          status: 'investigating' as const,
          description: 'This is a test alert to verify email configuration',
          impact: 'No actual impact - this is a test',
          affected_services: ['email-system'],
          started_at: new Date().toISOString(),
          logs: [{
            timestamp: new Date().toISOString(),
            level: 'info' as const,
            message: 'Test alert triggered by admin',
            source: 'system'
          }],
          ai_analysis: {
            probable_cause: 'Manual test trigger',
            recommended_actions: ['Verify email was received', 'Check spam folder if needed'],
            fix_confidence: 100,
            auto_fixable: false
          }
        }
        
        await agent.sendIncidentAlert(testIncident)
        
        return NextResponse.json({
          success: true,
          message: 'Test alert email sent successfully'
        })

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action'
        }, { status: 400 })
    }
  } catch (error) {
    console.error('Incidents action error:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to process incident action',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}