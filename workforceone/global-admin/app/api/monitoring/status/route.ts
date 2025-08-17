import { NextRequest, NextResponse } from 'next/server'
import { VercelClient } from '@/lib/monitoring/vercel-client'
import { SupabaseMonitoringClient } from '@/lib/monitoring/supabase-client'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const includeMetrics = searchParams.get('metrics') === 'true'

    // Initialize clients
    const vercelClient = process.env.VERCEL_API_TOKEN 
      ? new VercelClient(process.env.VERCEL_API_TOKEN, process.env.VERCEL_TEAM_ID)
      : null

    const supabaseClient = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
      ? new SupabaseMonitoringClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL.split('//')[1].split('.')[0],
          process.env.SUPABASE_SERVICE_ROLE_KEY
        )
      : null

    const status = {
      platform: 'WorkforceOne Global Admin',
      environment: process.env.NODE_ENV || 'development',
      version: '1.0.0',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      services: {} as any,
      overall_status: 'operational',
      incidents: [] as any[],
      maintenance: [] as any[]
    }

    // Check Vercel status
    if (vercelClient) {
      try {
        const vercelHealth = await vercelClient.checkHealth()
        
        status.services.vercel = {
          status: vercelHealth.status === 'healthy' ? 'operational' : 
                 vercelHealth.status === 'degraded' ? 'degraded' : 'outage',
          latency: vercelHealth.latency,
          last_checked: vercelHealth.timestamp.toISOString(),
          description: vercelHealth.status === 'healthy' ? 'All systems operational' :
                      vercelHealth.status === 'degraded' ? 'Performance degraded' : 'Service unavailable'
        }

        // Get additional Vercel data if available
        if (process.env.VERCEL_PROJECT_ID) {
          try {
            const projects = await vercelClient.getProjects()
            const deployments = await vercelClient.getDeployments(process.env.VERCEL_PROJECT_ID, 5)
            
            status.services.vercel.projects_count = projects.projects.length
            status.services.vercel.latest_deployment = deployments.deployments[0] ? {
              state: deployments.deployments[0].state,
              created_at: new Date(deployments.deployments[0].createdAt).toISOString(),
              url: deployments.deployments[0].url
            } : null
          } catch (error) {
            console.warn('Failed to get Vercel project data:', error)
          }
        }
      } catch (error) {
        status.services.vercel = {
          status: 'outage',
          latency: 0,
          last_checked: new Date().toISOString(),
          description: 'Service unavailable',
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      }
    }

    // Check Supabase status
    if (supabaseClient) {
      try {
        const supabaseHealth = await supabaseClient.getFullHealth()
        
        status.services.supabase = {
          status: supabaseHealth.status === 'healthy' ? 'operational' :
                 supabaseHealth.status === 'degraded' ? 'degraded' : 'outage',
          description: supabaseHealth.description,
          services: supabaseHealth.services,
          latency: supabaseHealth.latency,
          last_checked: new Date().toISOString()
        }

        // Get table information
        try {
          const tableSizes = await supabaseClient.getTableSizes()
          status.services.supabase.database = {
            tables_count: tableSizes.length,
            total_rows: tableSizes.reduce((sum, table) => sum + table.row_count, 0),
            total_size_mb: Math.round(tableSizes.reduce((sum, table) => sum + table.size_bytes, 0) / 1024 / 1024)
          }
        } catch (error) {
          console.warn('Failed to get Supabase table data:', error)
        }
      } catch (error) {
        status.services.supabase = {
          status: 'outage',
          description: 'Service unavailable',
          last_checked: new Date().toISOString(),
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      }
    }

    // Add system information
    status.services.system = {
      status: 'operational',
      node_version: process.version,
      platform: process.platform,
      arch: process.arch,
      memory_usage: process.memoryUsage(),
      uptime_seconds: process.uptime(),
      last_checked: new Date().toISOString()
    }

    // Calculate overall status
    const serviceStatuses = Object.values(status.services).map((service: any) => service.status)
    const hasOutage = serviceStatuses.includes('outage')
    const hasDegraded = serviceStatuses.includes('degraded')
    
    if (hasOutage) {
      status.overall_status = 'outage'
    } else if (hasDegraded) {
      status.overall_status = 'degraded'
    } else {
      status.overall_status = 'operational'
    }

    // Add mock incidents and maintenance
    status.incidents = [
      {
        id: 'INC-001',
        title: 'Elevated API Response Times',
        status: 'investigating',
        impact: 'minor',
        started_at: new Date(Date.now() - 45 * 60 * 1000).toISOString(), // 45 minutes ago
        services_affected: ['vercel'],
        updates: [
          {
            timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
            status: 'investigating',
            message: 'We are investigating reports of elevated API response times.'
          }
        ]
      }
    ].filter(() => Math.random() > 0.7) // 30% chance of having incidents

    status.maintenance = [
      {
        id: 'MAINT-001',
        title: 'Scheduled Database Maintenance',
        status: 'scheduled',
        impact: 'minor',
        scheduled_for: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days from now
        duration_minutes: 30,
        services_affected: ['supabase'],
        description: 'Routine database maintenance to improve performance.'
      }
    ].filter(() => Math.random() > 0.8) // 20% chance of having maintenance

    // Add recent metrics if requested
    if (includeMetrics) {
      try {
        const metricsResponse = await fetch(`${request.nextUrl.origin}/api/monitoring/metrics?hours=1`, {
          headers: {
            'Authorization': request.headers.get('Authorization') || ''
          }
        })
        
        if (metricsResponse.ok) {
          const metricsData = await metricsResponse.json()
          status.recent_metrics = metricsData.data.slice(0, 10) // Last 10 metrics
        }
      } catch (error) {
        console.warn('Failed to fetch recent metrics:', error)
      }
    }

    // Calculate health score
    const healthScores = {
      overall_health: serviceStatuses.filter(s => s === 'operational').length / serviceStatuses.length * 100,
      database_health: status.services.supabase?.status === 'operational' ? 95 : 
                      status.services.supabase?.status === 'degraded' ? 70 : 20,
      application_health: status.services.vercel?.status === 'operational' ? 95 :
                         status.services.vercel?.status === 'degraded' ? 70 : 20,
      infrastructure_health: 95 // Static for now
    }

    const response = {
      success: true,
      data: {
        ...status,
        health_score: healthScores,
        last_updated: new Date().toISOString()
      }
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Status check error:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to get system status',
      data: {
        platform: 'WorkforceOne Global Admin',
        overall_status: 'outage',
        timestamp: new Date().toISOString(),
        services: {},
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }, { status: 500 })
  }
}