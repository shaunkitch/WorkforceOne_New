import { supabaseAdmin } from '../lib/supabase'
import axios from 'axios'
import { createLogger } from '../utils/logger'

export interface SystemMetric {
  metricType: string
  value: number
  unit: string
  source: string
  metadata?: Record<string, any>
}

export interface SystemAlert {
  id: string
  title: string
  description: string
  severity: 'info' | 'warning' | 'critical' | 'error'
  status: 'active' | 'resolved' | 'acknowledged' | 'suppressed'
  metricType?: string
  currentValue?: number
  thresholdValue?: number
  source: string
  firstSeenAt: string
  lastSeenAt: string
}

export class MonitoringService {
  private static instance: MonitoringService
  private metricsInterval: NodeJS.Timeout | null = null
  private vercelApiKey: string | null = null
  private vercelTeamId: string | null = null
  private logger = createLogger('monitoring-service')

  constructor() {
    this.vercelApiKey = process.env.VERCEL_API_KEY || null
    this.vercelTeamId = process.env.VERCEL_TEAM_ID || null
  }

  static getInstance(): MonitoringService {
    if (!MonitoringService.instance) {
      MonitoringService.instance = new MonitoringService()
    }
    return MonitoringService.instance
  }

  // Start monitoring with configurable interval (default 5 minutes)
  startMonitoring(intervalMinutes: number = 5): void {
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval)
    }

    this.metricsInterval = setInterval(async () => {
      try {
        await this.collectAllMetrics()
      } catch (error: unknown) {
        this.logger.error('Error collecting metrics', { error: error instanceof Error ? error.message : String(error) })
        await this.recordMetric({
          metricType: 'application_errors',
          value: 1,
          unit: 'count',
          source: 'monitoring_service',
          metadata: { error: error instanceof Error ? error.message : String(error), timestamp: new Date().toISOString() }
        })
      }
    }, intervalMinutes * 60 * 1000)

    // Initial collection
    this.collectAllMetrics()
  }

  stopMonitoring(): void {
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval)
      this.metricsInterval = null
    }
  }

  // Collect all metrics from different sources
  async collectAllMetrics(): Promise<void> {
    const tasks = [
      this.collectDatabaseMetrics(),
      this.collectApplicationMetrics(),
    ]

    // Only collect Vercel metrics if API key is available
    if (this.vercelApiKey) {
      tasks.push(this.collectVercelMetrics())
    }

    await Promise.allSettled(tasks)
  }

  // Collect Supabase database metrics
  async collectDatabaseMetrics(): Promise<void> {
    try {
      // Database connection count
      const { data: connectionData } = await supabaseAdmin
        .from('pg_stat_activity')
        .select('count(*)')
        .not('pid', 'is', null)

      if (connectionData && connectionData.length > 0) {
        await this.recordMetric({
          metricType: 'database_connections',
          value: connectionData.length,
          unit: 'count',
          source: 'supabase'
        })
      }

      // Database size
      const { data: sizeData } = await supabaseAdmin.rpc('get_database_size')
      if (sizeData) {
        await this.recordMetric({
          metricType: 'database_storage',
          value: sizeData / (1024 * 1024), // Convert to MB
          unit: 'MB',
          source: 'supabase'
        })
      }

      // Table sizes and record counts for health checking
      const tables = ['organizations', 'profiles', 'subscriptions', 'system_metrics']
      for (const table of tables) {
        try {
          const { count } = await supabaseAdmin
            .from(table)
            .select('*', { count: 'exact', head: true })

          await this.recordMetric({
            metricType: 'user_activity',
            value: count || 0,
            unit: 'count',
            source: 'database',
            metadata: { table, metric: 'record_count' }
          })
        } catch (error: unknown) {
          this.logger.warn(`Failed to get count for table ${table}`, { error: error instanceof Error ? error.message : String(error) })
        }
      }

      // Response time test
      const startTime = Date.now()
      await supabaseAdmin.from('organizations').select('id').limit(1).single()
      const responseTime = Date.now() - startTime

      await this.recordMetric({
        metricType: 'database_response_time',
        value: responseTime,
        unit: 'ms',
        source: 'supabase'
      })

    } catch (error: unknown) {
      this.logger.error('Error collecting database metrics', { error: error instanceof Error ? error.message : String(error) })
      await this.recordMetric({
        metricType: 'application_errors',
        value: 1,
        unit: 'count',
        source: 'database_monitoring',
        metadata: { error: error instanceof Error ? error.message : String(error) }
      })
    }
  }

  // Collect Node.js application metrics
  async collectApplicationMetrics(): Promise<void> {
    try {
      // Memory usage
      const memUsage = process.memoryUsage()
      await this.recordMetric({
        metricType: 'vercel_memory',
        value: memUsage.heapUsed / (1024 * 1024), // Convert to MB
        unit: 'MB',
        source: 'nodejs',
        metadata: {
          heapTotal: memUsage.heapTotal,
          heapUsed: memUsage.heapUsed,
          external: memUsage.external,
          rss: memUsage.rss
        }
      })

      // CPU usage (approximation)
      const cpuUsage = process.cpuUsage()
      await this.recordMetric({
        metricType: 'vercel_cpu',
        value: (cpuUsage.user + cpuUsage.system) / 1000000, // Convert to seconds
        unit: 'seconds',
        source: 'nodejs',
        metadata: cpuUsage
      })

      // Process uptime
      await this.recordMetric({
        metricType: 'api_latency',
        value: process.uptime(),
        unit: 'seconds',
        source: 'nodejs',
        metadata: { metric: 'uptime' }
      })

    } catch (error: unknown) {
      this.logger.error('Error collecting application metrics', { error: error instanceof Error ? error.message : String(error) })
    }
  }

  // Collect Vercel deployment metrics (if API key available)
  async collectVercelMetrics(): Promise<void> {
    if (!this.vercelApiKey) {
      return
    }

    try {
      const headers = {
        'Authorization': `Bearer ${this.vercelApiKey}`,
        'Content-Type': 'application/json'
      }

      // Get deployments
      const deploymentsUrl = this.vercelTeamId 
        ? `https://api.vercel.com/v6/deployments?teamId=${this.vercelTeamId}&limit=5`
        : 'https://api.vercel.com/v6/deployments?limit=5'

      const { data: deployments } = await axios.get(deploymentsUrl, { headers })

      if (deployments && deployments.deployments) {
        const activeDeployments = deployments.deployments.filter((d: any) => d.state === 'READY')
        
        await this.recordMetric({
          metricType: 'vercel_requests',
          value: activeDeployments.length,
          unit: 'count',
          source: 'vercel',
          metadata: { metric: 'active_deployments' }
        })
      }

      // Get project stats if available
      const projectsUrl = this.vercelTeamId
        ? `https://api.vercel.com/v9/projects?teamId=${this.vercelTeamId}&limit=10`
        : 'https://api.vercel.com/v9/projects?limit=10'

      const { data: projects } = await axios.get(projectsUrl, { headers })

      if (projects && projects.projects) {
        await this.recordMetric({
          metricType: 'vercel_requests',
          value: projects.projects.length,
          unit: 'count',
          source: 'vercel',
          metadata: { metric: 'total_projects' }
        })
      }

    } catch (error: unknown) {
      this.logger.error('Error collecting Vercel metrics', { error: error instanceof Error ? error.message : String(error) })
      // Don't record as error if it's just missing API key
      if ((error as any)?.response?.status !== 401) {
        await this.recordMetric({
          metricType: 'application_errors',
          value: 1,
          unit: 'count',
          source: 'vercel_monitoring',
          metadata: { error: error instanceof Error ? error.message : String(error) }
        })
      }
    }
  }

  // Record a metric to the database
  async recordMetric(metric: SystemMetric): Promise<string | null> {
    try {
      const { data, error } = await supabaseAdmin.rpc('record_system_metric', {
        p_metric_type: metric.metricType,
        p_value: metric.value,
        p_unit: metric.unit,
        p_source: metric.source,
        p_metadata: metric.metadata || {}
      })

      if (error) {
        this.logger.error('Error recording metric', { error })
        return null
      }

      return data
    } catch (error: unknown) {
      this.logger.error('Error recording metric', { error: error instanceof Error ? error.message : String(error) })
      return null
    }
  }

  // Get current system status
  async getSystemStatus(): Promise<any> {
    try {
      const { data, error } = await supabaseAdmin.rpc('get_system_status')
      
      if (error) {
        throw error
      }

      return data
    } catch (error: unknown) {
      this.logger.error('Error getting system status', { error: error instanceof Error ? error.message : String(error) })
      throw error
    }
  }

  // Get active alerts
  async getActiveAlerts(): Promise<SystemAlert[]> {
    try {
      const { data, error } = await supabaseAdmin
        .from('system_alerts')
        .select('*')
        .eq('status', 'active')
        .order('severity', { ascending: false })
        .order('first_seen_at', { ascending: false })

      if (error) {
        throw error
      }

      return data || []
    } catch (error: unknown) {
      this.logger.error('Error getting active alerts', { error: error instanceof Error ? error.message : String(error) })
      return []
    }
  }

  // Acknowledge an alert
  async acknowledgeAlert(alertId: string, acknowledgedBy: string): Promise<boolean> {
    try {
      const { error } = await supabaseAdmin
        .from('system_alerts')
        .update({
          status: 'acknowledged',
          acknowledged_at: new Date().toISOString(),
          acknowledged_by: acknowledgedBy,
          updated_at: new Date().toISOString()
        })
        .eq('id', alertId)

      return !error
    } catch (error: unknown) {
      this.logger.error('Error acknowledging alert', { error: error instanceof Error ? error.message : String(error) })
      return false
    }
  }

  // Resolve an alert
  async resolveAlert(alertId: string): Promise<boolean> {
    try {
      const { error } = await supabaseAdmin
        .from('system_alerts')
        .update({
          status: 'resolved',
          resolved_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', alertId)

      return !error
    } catch (error: unknown) {
      this.logger.error('Error resolving alert', { error: error instanceof Error ? error.message : String(error) })
      return false
    }
  }

  // Calculate health score
  async calculateHealthScore(): Promise<any> {
    try {
      const { data, error } = await supabaseAdmin.rpc('calculate_system_health_score')
      
      if (error) {
        throw error
      }

      return data
    } catch (error: unknown) {
      this.logger.error('Error calculating health score', { error: error instanceof Error ? error.message : String(error) })
      throw error
    }
  }

  // Get metrics history
  async getMetricsHistory(
    metricType?: string, 
    source?: string, 
    hours: number = 24
  ): Promise<any[]> {
    try {
      let query = supabaseAdmin
        .from('system_metrics')
        .select('*')
        .gte('recorded_at', new Date(Date.now() - hours * 60 * 60 * 1000).toISOString())
        .order('recorded_at', { ascending: false })

      if (metricType) {
        query = query.eq('metric_type', metricType)
      }

      if (source) {
        query = query.eq('source', source)
      }

      const { data, error } = await query

      if (error) {
        throw error
      }

      return data || []
    } catch (error: unknown) {
      this.logger.error('Error getting metrics history', { error: error instanceof Error ? error.message : String(error) })
      return []
    }
  }
}

// Export singleton instance
export const monitoringService = MonitoringService.getInstance()

// Helper function to create a database size function in Supabase
export const createDatabaseSizeFunction = `
CREATE OR REPLACE FUNCTION get_database_size()
RETURNS bigint AS $$
BEGIN
  RETURN pg_database_size(current_database());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
`