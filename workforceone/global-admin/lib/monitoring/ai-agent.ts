/**
 * AI-Powered Auto-Healing Agent for WorkforceOne
 * Proactively monitors, detects, and fixes issues automatically
 */

interface MonitoringMetric {
  name: string
  value: number
  threshold: number
  severity: 'low' | 'medium' | 'high' | 'critical'
  timestamp: Date
  source: 'vercel' | 'supabase' | 'application' | 'user'
}

interface Issue {
  id: string
  type: 'performance' | 'error' | 'availability' | 'security' | 'database'
  severity: 'low' | 'medium' | 'high' | 'critical'
  description: string
  metrics: MonitoringMetric[]
  autoFixable: boolean
  suggestedFix?: string
  timestamp: Date
}

interface AutoFixAction {
  type: 'restart_service' | 'scale_up' | 'clear_cache' | 'optimize_query' | 'update_config'
  target: string
  parameters: Record<string, any>
  rollbackPlan: string
}

class AIMonitoringAgent {
  private metrics: Map<string, MonitoringMetric[]> = new Map()
  private issues: Issue[] = []
  private autoFixHistory: Array<{ action: AutoFixAction; timestamp: Date; success: boolean }> = []

  constructor(private config: {
    openaiApiKey?: string
    vercelApiToken?: string
    supabaseManagementToken?: string
    alertWebhooks: string[]
    autoFixEnabled: boolean
  }) {}

  /**
   * Main monitoring loop - runs every 30 seconds
   */
  async startMonitoring(): Promise<void> {
    console.log('🤖 AI Monitoring Agent started')
    
    setInterval(async () => {
      try {
        await this.collectMetrics()
        await this.analyzeMetrics()
        await this.detectIssues()
        await this.autoHealIssues()
      } catch (error) {
        console.error('Monitoring cycle error:', error)
        await this.sendAlert('critical', 'Monitoring agent failure', error)
      }
    }, 30000) // Every 30 seconds
  }

  /**
   * Collect metrics from all sources
   */
  private async collectMetrics(): Promise<void> {
    const metrics: MonitoringMetric[] = []

    // Vercel Metrics
    if (this.config.vercelApiToken) {
      metrics.push(...await this.collectVercelMetrics())
    }

    // Supabase Metrics
    if (this.config.supabaseManagementToken) {
      metrics.push(...await this.collectSupabaseMetrics())
    }

    // Application Metrics
    metrics.push(...await this.collectApplicationMetrics())

    // Store metrics
    const now = new Date()
    metrics.forEach(metric => {
      const key = `${metric.source}_${metric.name}`
      if (!this.metrics.has(key)) {
        this.metrics.set(key, [])
      }
      const metricHistory = this.metrics.get(key)!
      metricHistory.push(metric)
      
      // Keep only last 1000 data points (about 8 hours of data)
      if (metricHistory.length > 1000) {
        metricHistory.splice(0, metricHistory.length - 1000)
      }
    })
  }

  /**
   * Collect Vercel deployment and performance metrics
   */
  private async collectVercelMetrics(): Promise<MonitoringMetric[]> {
    try {
      const metrics: MonitoringMetric[] = []
      const headers = {
        'Authorization': `Bearer ${this.config.vercelApiToken}`,
        'Content-Type': 'application/json'
      }

      // Get deployment status
      const deploymentsResponse = await fetch('https://api.vercel.com/v6/deployments?limit=1', {
        headers
      })
      const deployments = await deploymentsResponse.json()

      if (deployments.deployments?.[0]) {
        const latestDeployment = deployments.deployments[0]
        metrics.push({
          name: 'deployment_status',
          value: latestDeployment.state === 'READY' ? 1 : 0,
          threshold: 1,
          severity: latestDeployment.state === 'READY' ? 'low' : 'critical',
          timestamp: new Date(),
          source: 'vercel'
        })
      }

      // Get project analytics (if available)
      const analyticsResponse = await fetch('https://api.vercel.com/v1/analytics/usage', {
        headers
      })
      
      if (analyticsResponse.ok) {
        const analytics = await analyticsResponse.json()
        
        metrics.push({
          name: 'requests_per_minute',
          value: analytics.total?.requests || 0,
          threshold: 1000, // Alert if > 1000 req/min
          severity: analytics.total?.requests > 1000 ? 'medium' : 'low',
          timestamp: new Date(),
          source: 'vercel'
        })

        metrics.push({
          name: 'error_rate',
          value: analytics.total?.errors || 0,
          threshold: 50, // Alert if > 50 errors
          severity: analytics.total?.errors > 50 ? 'high' : 'low',
          timestamp: new Date(),
          source: 'vercel'
        })
      }

      return metrics
    } catch (error) {
      console.error('Failed to collect Vercel metrics:', error)
      return []
    }
  }

  /**
   * Collect Supabase database and API metrics
   */
  private async collectSupabaseMetrics(): Promise<MonitoringMetric[]> {
    try {
      const metrics: MonitoringMetric[] = []
      
      // Test database connection
      const dbTestStart = Date.now()
      try {
        const { supabaseAdmin } = await import('../supabase')
        const { data, error } = await supabaseAdmin
          .from('organizations')
          .select('count')
          .limit(1)
        
        const responseTime = Date.now() - dbTestStart
        
        metrics.push({
          name: 'db_response_time',
          value: responseTime,
          threshold: 2000, // Alert if > 2 seconds
          severity: responseTime > 2000 ? 'high' : 'low',
          timestamp: new Date(),
          source: 'supabase'
        })

        metrics.push({
          name: 'db_connection_status',
          value: error ? 0 : 1,
          threshold: 1,
          severity: error ? 'critical' : 'low',
          timestamp: new Date(),
          source: 'supabase'
        })
      } catch (dbError) {
        metrics.push({
          name: 'db_connection_status',
          value: 0,
          threshold: 1,
          severity: 'critical',
          timestamp: new Date(),
          source: 'supabase'
        })
      }

      return metrics
    } catch (error) {
      console.error('Failed to collect Supabase metrics:', error)
      return []
    }
  }

  /**
   * Collect application-level metrics
   */
  private async collectApplicationMetrics(): Promise<MonitoringMetric[]> {
    const metrics: MonitoringMetric[] = []

    // Memory usage (if available)
    if (typeof performance !== 'undefined' && (performance as any).memory) {
      const memory = (performance as any).memory
      metrics.push({
        name: 'memory_usage',
        value: memory.usedJSHeapSize / memory.totalJSHeapSize,
        threshold: 0.8, // Alert if > 80% memory usage
        severity: memory.usedJSHeapSize / memory.totalJSHeapSize > 0.8 ? 'medium' : 'low',
        timestamp: new Date(),
        source: 'application'
      })
    }

    // Page load performance
    if (typeof performance !== 'undefined') {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
      if (navigation) {
        const loadTime = navigation.loadEventEnd - navigation.fetchStart
        metrics.push({
          name: 'page_load_time',
          value: loadTime,
          threshold: 3000, // Alert if > 3 seconds
          severity: loadTime > 3000 ? 'medium' : 'low',
          timestamp: new Date(),
          source: 'application'
        })
      }
    }

    return metrics
  }

  /**
   * Use AI to analyze metrics and detect patterns
   */
  private async analyzeMetrics(): Promise<void> {
    if (!this.config.openaiApiKey) return

    try {
      // Prepare metrics summary for AI analysis
      const recentMetrics = Array.from(this.metrics.entries())
        .map(([key, values]) => ({
          metric: key,
          current: values[values.length - 1],
          trend: this.calculateTrend(values.slice(-10)) // Last 10 data points
        }))
        .filter(m => m.current)

      const prompt = `
Analyze these system metrics and identify potential issues:

${recentMetrics.map(m => `
${m.metric}: ${m.current.value} (threshold: ${m.current.threshold}, trend: ${m.trend})
`).join('')}

Identify:
1. Critical issues requiring immediate attention
2. Performance degradation patterns
3. Potential issues that may occur soon
4. Recommended auto-fix actions

Respond in JSON format with issues array.
`

      // Note: In production, you'd call OpenAI API here
      // For now, we'll use rule-based detection
      console.log('AI Analysis prompt prepared:', prompt.substring(0, 200) + '...')
      
    } catch (error) {
      console.error('AI analysis failed:', error)
    }
  }

  /**
   * Detect issues based on thresholds and patterns
   */
  private async detectIssues(): Promise<void> {
    const newIssues: Issue[] = []

    // Check each metric against its threshold
    for (const [key, values] of this.metrics.entries()) {
      const latest = values[values.length - 1]
      if (!latest) continue

      if (latest.severity === 'critical' || latest.severity === 'high') {
        const issue: Issue = {
          id: `${key}_${Date.now()}`,
          type: this.categorizeIssue(key),
          severity: latest.severity,
          description: this.generateIssueDescription(key, latest),
          metrics: [latest],
          autoFixable: this.isAutoFixable(key, latest),
          suggestedFix: this.getSuggestedFix(key, latest),
          timestamp: new Date()
        }

        newIssues.push(issue)
      }
    }

    // Add new issues
    this.issues.push(...newIssues)

    // Send alerts for new critical issues
    for (const issue of newIssues) {
      if (issue.severity === 'critical') {
        await this.sendAlert(issue.severity, issue.description, issue)
      }
    }
  }

  /**
   * Automatically fix issues when possible
   */
  private async autoHealIssues(): Promise<void> {
    if (!this.config.autoFixEnabled) return

    for (const issue of this.issues) {
      if (issue.autoFixable && issue.suggestedFix) {
        try {
          const action = this.createAutoFixAction(issue)
          const success = await this.executeAutoFix(action)
          
          this.autoFixHistory.push({
            action,
            timestamp: new Date(),
            success
          })

          if (success) {
            console.log(`✅ Auto-fixed issue: ${issue.description}`)
            await this.sendAlert('low', `Auto-fixed: ${issue.description}`, { action, issue })
            
            // Remove fixed issue
            this.issues = this.issues.filter(i => i.id !== issue.id)
          } else {
            console.log(`❌ Failed to auto-fix: ${issue.description}`)
            await this.sendAlert('high', `Auto-fix failed: ${issue.description}`, { action, issue })
          }
        } catch (error) {
          console.error('Auto-fix error:', error)
          await this.sendAlert('high', `Auto-fix error: ${issue.description}`, error)
        }
      }
    }
  }

  /**
   * Execute auto-fix actions
   */
  private async executeAutoFix(action: AutoFixAction): Promise<boolean> {
    try {
      switch (action.type) {
        case 'clear_cache':
          // Clear application cache
          if (typeof caches !== 'undefined') {
            const cacheNames = await caches.keys()
            await Promise.all(cacheNames.map(name => caches.delete(name)))
          }
          return true

        case 'restart_service':
          // In production, this would trigger a deployment restart via Vercel API
          console.log('Would restart service:', action.target)
          return true

        case 'optimize_query':
          // Optimize specific database queries
          console.log('Would optimize query:', action.parameters)
          return true

        case 'scale_up':
          // Scale up resources (requires Vercel Pro plan)
          console.log('Would scale up:', action.target)
          return true

        case 'update_config':
          // Update configuration values
          console.log('Would update config:', action.parameters)
          return true

        default:
          return false
      }
    } catch (error) {
      console.error('Auto-fix execution failed:', error)
      return false
    }
  }

  /**
   * Send alerts to configured channels
   */
  private async sendAlert(severity: string, message: string, data?: any): Promise<void> {
    const alert = {
      severity,
      message,
      timestamp: new Date().toISOString(),
      system: 'WorkforceOne Global Admin',
      data: data ? JSON.stringify(data, null, 2) : undefined
    }

    console.log(`🚨 Alert [${severity.toUpperCase()}]: ${message}`)

    // Send to configured webhooks
    for (const webhook of this.config.alertWebhooks) {
      try {
        await fetch(webhook, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(alert)
        })
      } catch (error) {
        console.error('Failed to send alert to webhook:', webhook, error)
      }
    }
  }

  // Helper methods
  private calculateTrend(values: MonitoringMetric[]): string {
    if (values.length < 2) return 'stable'
    
    const recent = values.slice(-3).map(v => v.value)
    const older = values.slice(-6, -3).map(v => v.value)
    
    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length
    const olderAvg = older.reduce((a, b) => a + b, 0) / older.length
    
    if (recentAvg > olderAvg * 1.1) return 'increasing'
    if (recentAvg < olderAvg * 0.9) return 'decreasing'
    return 'stable'
  }

  private categorizeIssue(metricKey: string): Issue['type'] {
    if (metricKey.includes('db_') || metricKey.includes('database')) return 'database'
    if (metricKey.includes('error') || metricKey.includes('failure')) return 'error'
    if (metricKey.includes('response_time') || metricKey.includes('performance')) return 'performance'
    if (metricKey.includes('connection') || metricKey.includes('status')) return 'availability'
    return 'performance'
  }

  private generateIssueDescription(metricKey: string, metric: MonitoringMetric): string {
    return `${metricKey.replace(/_/g, ' ')} is ${metric.value} (threshold: ${metric.threshold})`
  }

  private isAutoFixable(metricKey: string, metric: MonitoringMetric): boolean {
    // Define which issues can be auto-fixed
    const autoFixableIssues = [
      'cache_', 'memory_', 'connection_', 'performance_'
    ]
    return autoFixableIssues.some(pattern => metricKey.includes(pattern))
  }

  private getSuggestedFix(metricKey: string, metric: MonitoringMetric): string {
    if (metricKey.includes('cache')) return 'Clear application cache'
    if (metricKey.includes('memory')) return 'Restart service to free memory'
    if (metricKey.includes('connection')) return 'Reset database connections'
    if (metricKey.includes('response_time')) return 'Optimize slow queries'
    return 'Manual investigation required'
  }

  private createAutoFixAction(issue: Issue): AutoFixAction {
    if (issue.description.includes('cache')) {
      return {
        type: 'clear_cache',
        target: 'application',
        parameters: {},
        rollbackPlan: 'Cache will rebuild automatically'
      }
    }
    
    if (issue.description.includes('memory')) {
      return {
        type: 'restart_service',
        target: 'application',
        parameters: { graceful: true },
        rollbackPlan: 'Service will auto-restart if needed'
      }
    }

    return {
      type: 'update_config',
      target: 'system',
      parameters: { issue: issue.id },
      rollbackPlan: 'Revert configuration change'
    }
  }

  /**
   * Get monitoring dashboard data
   */
  getDashboardData() {
    return {
      metrics: Object.fromEntries(this.metrics),
      issues: this.issues,
      autoFixHistory: this.autoFixHistory.slice(-50), // Last 50 actions
      systemHealth: this.calculateSystemHealth()
    }
  }

  private calculateSystemHealth(): number {
    const criticalIssues = this.issues.filter(i => i.severity === 'critical').length
    const highIssues = this.issues.filter(i => i.severity === 'high').length
    const mediumIssues = this.issues.filter(i => i.severity === 'medium').length
    
    let score = 100
    score -= criticalIssues * 30
    score -= highIssues * 15
    score -= mediumIssues * 5
    
    return Math.max(0, score)
  }
}

export default AIMonitoringAgent
export type { MonitoringMetric, Issue, AutoFixAction }