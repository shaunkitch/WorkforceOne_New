'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

interface SystemMetric {
  metric_type: string
  value: number
  unit: string
  source: string
  recorded_at: string
}

interface SystemAlert {
  id: string
  title: string
  description: string
  severity: 'info' | 'warning' | 'critical' | 'error'
  status: string
  metric_type?: string
  current_value?: number
  threshold_value?: number
  source: string
  first_seen_at: string
  last_seen_at: string
}

interface HealthScore {
  overall_health: number
  database_health: number
  application_health: number
  infrastructure_health: number
  active_alerts: number
  critical_alerts: number
  warning_alerts: number
}

export default function MonitoringPage() {
  const [systemStatus, setSystemStatus] = useState<any>(null)
  const [healthScore, setHealthScore] = useState<HealthScore | null>(null)
  const [activeAlerts, setActiveAlerts] = useState<SystemAlert[]>([])
  const [recentMetrics, setRecentMetrics] = useState<SystemMetric[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchMonitoringData()
    
    // Set up real-time updates every 30 seconds
    const interval = setInterval(fetchMonitoringData, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchMonitoringData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Fetch system status
      const statusResponse = await fetch('/api/monitoring/status')
      if (!statusResponse.ok) {
        throw new Error('Failed to fetch system status')
      }
      const statusData = await statusResponse.json()
      setSystemStatus(statusData.data)

      // Fetch health score
      const healthResponse = await fetch('/api/monitoring/health')
      if (!healthResponse.ok) {
        throw new Error('Failed to fetch health score')
      }
      const healthData = await healthResponse.json()
      setHealthScore(healthData.data)

      // Fetch active alerts
      const alertsResponse = await fetch('/api/monitoring/alerts')
      if (!alertsResponse.ok) {
        throw new Error('Failed to fetch alerts')
      }
      const alertsData = await alertsResponse.json()
      setActiveAlerts(alertsData.data || [])

      // Fetch recent metrics
      const metricsResponse = await fetch('/api/monitoring/metrics?hours=1')
      if (!metricsResponse.ok) {
        throw new Error('Failed to fetch metrics')
      }
      const metricsData = await metricsResponse.json()
      setRecentMetrics(metricsData.data || [])

    } catch (err) {
      console.error('Error fetching monitoring data:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch monitoring data')
    } finally {
      setLoading(false)
    }
  }

  const acknowledgeAlert = async (alertId: string) => {
    try {
      const response = await fetch(`/api/monitoring/alerts/${alertId}/acknowledge`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          acknowledgedBy: 'Global Admin'
        })
      })

      if (response.ok) {
        fetchMonitoringData() // Refresh data
      }
    } catch (error) {
      console.error('Error acknowledging alert:', error)
    }
  }

  const resolveAlert = async (alertId: string) => {
    try {
      const response = await fetch(`/api/monitoring/alerts/${alertId}/resolve`, {
        method: 'POST'
      })

      if (response.ok) {
        fetchMonitoringData() // Refresh data
      }
    } catch (error) {
      console.error('Error resolving alert:', error)
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200'
      case 'error': return 'text-red-600 bg-red-50 border-red-200'
      case 'warning': return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'info': return 'text-blue-600 bg-blue-50 border-blue-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const getHealthColor = (score: number) => {
    if (score >= 90) return 'text-green-600'
    if (score >= 70) return 'text-yellow-600'
    return 'text-red-600'
  }

  const formatMetricValue = (metric: SystemMetric) => {
    const value = typeof metric.value === 'number' ? metric.value.toFixed(2) : metric.value
    return `${value} ${metric.unit}`
  }

  if (loading && !systemStatus) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error Loading Monitoring Data</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
              <div className="mt-4">
                <button
                  onClick={fetchMonitoringData}
                  className="bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1 rounded text-sm"
                >
                  Retry
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">System Monitoring</h1>
        <div className="flex space-x-2">
          <button
            onClick={fetchMonitoringData}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-md text-sm font-medium"
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
          <button
            onClick={() => fetch('/api/monitoring/collect', { method: 'POST' })}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium"
          >
            Collect Metrics
          </button>
        </div>
      </div>

      {/* Health Score Cards */}
      {healthScore && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Overall Health</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold ${getHealthColor(healthScore.overall_health)}`}>
                {healthScore.overall_health}%
              </div>
              <p className="text-sm text-gray-600 mt-1">System-wide health score</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Database Health</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold ${getHealthColor(healthScore.database_health)}`}>
                {healthScore.database_health}%
              </div>
              <p className="text-sm text-gray-600 mt-1">Supabase database performance</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Application Health</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold ${getHealthColor(healthScore.application_health)}`}>
                {healthScore.application_health}%
              </div>
              <p className="text-sm text-gray-600 mt-1">Application performance</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Infrastructure Health</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold ${getHealthColor(healthScore.infrastructure_health)}`}>
                {healthScore.infrastructure_health}%
              </div>
              <p className="text-sm text-gray-600 mt-1">Vercel infrastructure</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Active Alerts */}
      <Card>
        <CardHeader>
          <CardTitle>Active Alerts</CardTitle>
          <CardDescription>
            Critical system alerts requiring attention
          </CardDescription>
        </CardHeader>
        <CardContent>
          {activeAlerts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No active alerts - all systems operating normally</p>
            </div>
          ) : (
            <div className="space-y-4">
              {activeAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`p-4 rounded-lg border ${getSeverityColor(alert.severity)}`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-semibold">{alert.title}</h3>
                      <p className="text-sm mt-1">{alert.description}</p>
                      <div className="flex items-center space-x-4 mt-2 text-sm">
                        <span>Source: {alert.source}</span>
                        <span>First seen: {new Date(alert.first_seen_at).toLocaleString()}</span>
                        {alert.current_value && alert.threshold_value && (
                          <span>
                            Current: {alert.current_value} / Threshold: {alert.threshold_value}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex space-x-2 ml-4">
                      <button
                        onClick={() => acknowledgeAlert(alert.id)}
                        className="bg-yellow-100 hover:bg-yellow-200 text-yellow-800 px-3 py-1 rounded text-sm"
                      >
                        Acknowledge
                      </button>
                      <button
                        onClick={() => resolveAlert(alert.id)}
                        className="bg-green-100 hover:bg-green-200 text-green-800 px-3 py-1 rounded text-sm"
                      >
                        Resolve
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Metrics */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Metrics</CardTitle>
          <CardDescription>
            Latest system metrics from the past hour
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Metric</th>
                  <th className="text-left py-2">Value</th>
                  <th className="text-left py-2">Source</th>
                  <th className="text-left py-2">Recorded At</th>
                </tr>
              </thead>
              <tbody>
                {recentMetrics.slice(0, 10).map((metric, index) => (
                  <tr key={index} className="border-b">
                    <td className="py-2">{metric.metric_type.replace(/_/g, ' ')}</td>
                    <td className="py-2 font-mono">{formatMetricValue(metric)}</td>
                    <td className="py-2">{metric.source}</td>
                    <td className="py-2">{new Date(metric.recorded_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* System Status Summary */}
      {systemStatus && (
        <Card>
          <CardHeader>
            <CardTitle>System Status Summary</CardTitle>
            <CardDescription>
              Last updated: {new Date(systemStatus.last_updated).toLocaleString()}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h4 className="font-semibold mb-2">Health Metrics</h4>
                <div className="space-y-2 text-sm">
                  <div>Overall Health: <span className={getHealthColor(systemStatus.health_score?.overall_health || 0)}>{systemStatus.health_score?.overall_health || 0}%</span></div>
                  <div>Active Alerts: {systemStatus.health_score?.active_alerts || 0}</div>
                  <div>Critical Alerts: {systemStatus.health_score?.critical_alerts || 0}</div>
                </div>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Recent Activity</h4>
                <div className="space-y-2 text-sm">
                  <div>Metrics Collected: {systemStatus.recent_metrics?.length || 0}</div>
                  <div>Active Monitoring: ✅</div>
                  <div>Last Collection: {new Date().toLocaleString()}</div>
                </div>
              </div>
              <div>
                <h4 className="font-semibold mb-2">System Components</h4>
                <div className="space-y-2 text-sm">
                  <div>Database: {(healthScore?.database_health ?? 0) >= 90 ? '✅' : (healthScore?.database_health ?? 0) >= 70 ? '⚠️' : '❌'}</div>
                  <div>Application: {(healthScore?.application_health ?? 0) >= 90 ? '✅' : (healthScore?.application_health ?? 0) >= 70 ? '⚠️' : '❌'}</div>
                  <div>Infrastructure: {(healthScore?.infrastructure_health ?? 0) >= 90 ? '✅' : (healthScore?.infrastructure_health ?? 0) >= 70 ? '⚠️' : '❌'}</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}