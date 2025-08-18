import { NextRequest, NextResponse } from 'next/server'
import { VercelClient } from '@/lib/monitoring/vercel-client'
import { SupabaseMonitoringClient } from '@/lib/monitoring/supabase-client'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const { sources = ['vercel', 'supabase', 'system'], force = false } = body

    const results = {
      timestamp: new Date().toISOString(),
      sources_requested: sources,
      metrics_collected: 0,
      errors: [] as string[],
      success: true,
      data: {} as any
    }

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

    // Collect Vercel metrics
    if (sources.includes('vercel') && vercelClient) {
      try {
        const startTime = Date.now()
        
        // Basic health check
        const health = await vercelClient.checkHealth()
        results.data.vercel = {
          health_check: health,
          collection_time_ms: Date.now() - startTime
        }

        results.metrics_collected += 3 // status, latency, timestamp

        // Get project analytics if available
        if (process.env.VERCEL_PROJECT_ID) {
          try {
            const endTime = new Date()
            const startTimeAnalytics = new Date(endTime.getTime() - (24 * 60 * 60 * 1000)) // Last 24 hours

            const analytics = await vercelClient.getAnalytics(
              process.env.VERCEL_PROJECT_ID,
              startTimeAnalytics,
              endTime
            )

            const bandwidth = await vercelClient.getBandwidthUsage(
              process.env.VERCEL_PROJECT_ID,
              startTimeAnalytics,
              endTime
            )

            results.data.vercel.analytics = analytics
            results.data.vercel.bandwidth = bandwidth
            results.metrics_collected += 6 // requests, errors, bandwidth, cache hit rate, etc.

            // Get deployment information
            const deployments = await vercelClient.getDeployments(process.env.VERCEL_PROJECT_ID, 5)
            results.data.vercel.recent_deployments = deployments.deployments.map(d => ({
              uid: d.uid,
              state: d.state,
              created_at: new Date(d.createdAt).toISOString(),
              url: d.url
            }))
            results.metrics_collected += deployments.deployments.length

          } catch (error) {
            results.errors.push(`Vercel analytics error: ${error instanceof Error ? error.message : 'Unknown'}`)
          }
        }

      } catch (error) {
        results.errors.push(`Vercel collection error: ${error instanceof Error ? error.message : 'Unknown'}`)
        results.success = false
      }
    }

    // Collect Supabase metrics
    if (sources.includes('supabase') && supabaseClient) {
      try {
        const startTime = Date.now()
        
        // Health checks for all services
        const health = await supabaseClient.getFullHealth()
        results.data.supabase = {
          health_check: health,
          collection_time_ms: Date.now() - startTime
        }

        results.metrics_collected += Object.keys(health.services).length + Object.keys(health.latency).length

        // Database metrics
        try {
          const dbMetrics = await supabaseClient.getDatabaseMetrics()
          results.data.supabase.database_metrics = dbMetrics
          results.metrics_collected += Object.keys(dbMetrics).length

          const tableSizes = await supabaseClient.getTableSizes()
          results.data.supabase.table_sizes = tableSizes
          results.metrics_collected += tableSizes.length

        } catch (error) {
          results.errors.push(`Supabase database metrics error: ${error instanceof Error ? error.message : 'Unknown'}`)
        }

        // If management API access token is available, get usage stats
        if (process.env.SUPABASE_MANAGEMENT_TOKEN) {
          try {
            const usage = await supabaseClient.getProjectUsage(process.env.SUPABASE_MANAGEMENT_TOKEN)
            results.data.supabase.usage = usage
            results.metrics_collected += Object.keys(usage).length

            const stats = await supabaseClient.getProjectStats(process.env.SUPABASE_MANAGEMENT_TOKEN)
            results.data.supabase.stats = stats
            results.metrics_collected += Object.keys(stats).length

            // Get API usage for the last 24 hours
            const endTime = new Date()
            const startTimeAPI = new Date(endTime.getTime() - (24 * 60 * 60 * 1000))
            const apiUsage = await supabaseClient.getAPIUsage(
              process.env.SUPABASE_MANAGEMENT_TOKEN,
              startTimeAPI,
              endTime
            )
            results.data.supabase.api_usage = apiUsage
            results.metrics_collected += Object.keys(apiUsage.breakdown).length + 2

          } catch (error) {
            results.errors.push(`Supabase management API error: ${error instanceof Error ? error.message : 'Unknown'}`)
          }
        }

      } catch (error) {
        results.errors.push(`Supabase collection error: ${error instanceof Error ? error.message : 'Unknown'}`)
        results.success = false
      }
    }

    // Collect system metrics
    if (sources.includes('system')) {
      try {
        const memUsage = process.memoryUsage()
        const cpuUsage = process.cpuUsage()
        
        results.data.system = {
          memory: {
            rss: memUsage.rss,
            heap_used: memUsage.heapUsed,
            heap_total: memUsage.heapTotal,
            external: memUsage.external,
            usage_percentage: (memUsage.heapUsed / memUsage.heapTotal) * 100
          },
          cpu: {
            user: cpuUsage.user,
            system: cpuUsage.system
          },
          uptime: process.uptime(),
          platform: process.platform,
          arch: process.arch,
          node_version: process.version,
          pid: process.pid,
          timestamp: new Date().toISOString()
        }

        results.metrics_collected += 10 // All system metrics

        // Environment info
        results.data.system.environment = {
          node_env: process.env.NODE_ENV,
          has_vercel_token: !!process.env.VERCEL_API_TOKEN,
          has_supabase_key: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
          has_management_token: !!process.env.SUPABASE_MANAGEMENT_TOKEN
        }

      } catch (error) {
        results.errors.push(`System metrics error: ${error instanceof Error ? error.message : 'Unknown'}`)
        results.success = false
      }
    }

    // Calculate collection efficiency
    results.data.collection_summary = {
      total_metrics: results.metrics_collected,
      sources_successful: sources.filter((source: string) => 
        results.data[source] && !results.errors.some((err: string) => err.includes(source))
      ).length,
      sources_failed: results.errors.length,
      collection_duration_ms: Date.now() - new Date(results.timestamp).getTime(),
      efficiency_score: Math.max(0, 100 - (results.errors.length * 20)) // Penalty for errors
    }

    // Store metrics (in a real implementation, this would go to a database)
    console.log(`Metrics collection completed: ${results.metrics_collected} metrics from ${sources.join(', ')}`)

    return NextResponse.json({
      success: results.success,
      message: `Collected ${results.metrics_collected} metrics from ${sources.length} sources`,
      data: results,
      errors: results.errors.length > 0 ? results.errors : undefined
    })

  } catch (error) {
    console.error('Metrics collection error:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to collect metrics',
      message: error instanceof Error ? error.message : 'Unknown error',
      data: {
        timestamp: new Date().toISOString(),
        metrics_collected: 0,
        sources_requested: [],
        errors: [error instanceof Error ? error.message : 'Unknown error']
      }
    }, { status: 500 })
  }
}