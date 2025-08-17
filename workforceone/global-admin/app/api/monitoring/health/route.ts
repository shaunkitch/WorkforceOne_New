import { NextRequest, NextResponse } from 'next/server'
import { VercelClient } from '@/lib/monitoring/vercel-client'
import { SupabaseMonitoringClient } from '@/lib/monitoring/supabase-client'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const includeDetails = searchParams.get('details') === 'true'

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

    // Check Vercel health
    let vercelHealth = null
    if (vercelClient) {
      try {
        vercelHealth = await vercelClient.checkHealth()
      } catch (error) {
        vercelHealth = {
          status: 'down' as const,
          latency: 0,
          timestamp: new Date(),
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      }
    }

    // Check Supabase health
    let supabaseHealth = null
    if (supabaseClient) {
      try {
        supabaseHealth = await supabaseClient.getFullHealth()
      } catch (error) {
        supabaseHealth = {
          status: 'down' as const,
          description: 'Service unavailable',
          services: {
            database: 'outage' as const,
            auth: 'outage' as const,
            storage: 'outage' as const,
            realtime: 'outage' as const,
            edge_functions: 'outage' as const
          },
          latency: {
            database: 0,
            auth: 0,
            storage: 0,
            realtime: 0
          },
          error: error instanceof Error ? error.message : 'Unknown error'
        }
      }
    }

    // Calculate overall health
    const services = [
      vercelHealth ? { name: 'Vercel', status: vercelHealth.status } : null,
      supabaseHealth ? { name: 'Supabase', status: supabaseHealth.status } : null
    ].filter(Boolean)

    const healthyServices = services.filter(s => s!.status === 'healthy').length
    const totalServices = services.length
    const overallHealthPercentage = totalServices > 0 ? (healthyServices / totalServices) * 100 : 0

    let overallStatus = 'healthy'
    if (overallHealthPercentage < 50) {
      overallStatus = 'critical'
    } else if (overallHealthPercentage < 100) {
      overallStatus = 'degraded'
    }

    const response = {
      success: true,
      data: {
        overall_health: Math.round(overallHealthPercentage),
        database_health: supabaseHealth ? 
          (supabaseHealth.services.database === 'operational' ? 95 : 
           supabaseHealth.services.database === 'degraded' ? 70 : 20) : 0,
        application_health: vercelHealth ?
          (vercelHealth.status === 'healthy' ? 95 :
           vercelHealth.status === 'degraded' ? 70 : 20) : 0,
        infrastructure_health: 95, // Static for now
        status: overallStatus,
        active_alerts: services.filter(s => s!.status !== 'healthy').length,
        critical_alerts: services.filter(s => s!.status === 'down').length,
        warning_alerts: services.filter(s => s!.status === 'degraded').length,
        last_updated: new Date().toISOString(),
        services: {
          vercel: vercelHealth,
          supabase: supabaseHealth
        },
        ...(includeDetails && {
          details: {
            vercel: vercelHealth,
            supabase: supabaseHealth,
            checks_performed: services.length,
            response_time: Date.now()
          }
        })
      }
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Health check error:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to perform health check',
      data: {
        overall_health: 0,
        database_health: 0,
        application_health: 0,
        infrastructure_health: 0,
        status: 'critical',
        active_alerts: 1,
        critical_alerts: 1,
        warning_alerts: 0,
        last_updated: new Date().toISOString(),
        services: {},
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }, { status: 500 })
  }
}