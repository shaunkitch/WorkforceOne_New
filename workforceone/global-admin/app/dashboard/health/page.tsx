'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Activity, Heart, Shield, Database, Server, Globe, Zap,
  CheckCircle, AlertTriangle, XCircle, Clock, RefreshCw,
  TrendingUp, TrendingDown, Monitor, Cpu, HardDrive,
  Wifi, Users, Calendar, BarChart3, PieChart
} from 'lucide-react'
import { formatDateTime } from '@/lib/utils'

interface ServiceHealth {
  name: string
  status: 'healthy' | 'warning' | 'critical' | 'unknown'
  uptime: number
  lastChecked: string
  responseTime: number
  details: string
  metrics?: {
    requests: number
    errors: number
    latency: number
  }
}

interface SystemMetric {
  name: string
  value: number
  unit: string
  status: 'normal' | 'warning' | 'critical'
  trend: 'up' | 'down' | 'stable'
  threshold: number
}

interface HealthCheck {
  id: string
  name: string
  type: 'endpoint' | 'database' | 'service' | 'integration'
  url?: string
  method?: string
  expectedStatus?: number
  timeout: number
  interval: number
  enabled: boolean
  lastRun?: string
  lastResult?: {
    success: boolean
    responseTime: number
    statusCode?: number
    error?: string
  }
}

const MOCK_SERVICES: ServiceHealth[] = [
  {
    name: 'Web Application',
    status: 'healthy',
    uptime: 99.9,
    lastChecked: new Date().toISOString(),
    responseTime: 245,
    details: 'All endpoints responding normally',
    metrics: { requests: 15420, errors: 3, latency: 245 }
  },
  {
    name: 'Database (Supabase)',
    status: 'healthy',
    uptime: 99.95,
    lastChecked: new Date().toISOString(),
    responseTime: 120,
    details: 'Connection pool healthy, queries performing well',
    metrics: { requests: 8930, errors: 0, latency: 120 }
  },
  {
    name: 'Authentication Service',
    status: 'warning',
    uptime: 98.2,
    lastChecked: new Date().toISOString(),
    responseTime: 890,
    details: 'Elevated response times detected',
    metrics: { requests: 2340, errors: 12, latency: 890 }
  },
  {
    name: 'Payment Gateway (Stripe)',
    status: 'healthy',
    uptime: 99.8,
    lastChecked: new Date().toISOString(),
    responseTime: 310,
    details: 'Webhook delivery successful',
    metrics: { requests: 156, errors: 0, latency: 310 }
  },
  {
    name: 'Email Service',
    status: 'critical',
    uptime: 95.1,
    lastChecked: new Date().toISOString(),
    responseTime: 0,
    details: 'Service unavailable - investigating',
    metrics: { requests: 89, errors: 45, latency: 0 }
  },
  {
    name: 'File Storage',
    status: 'healthy',
    uptime: 99.7,
    lastChecked: new Date().toISOString(),
    responseTime: 180,
    details: 'Upload and download operations normal',
    metrics: { requests: 445, errors: 2, latency: 180 }
  }
]

const MOCK_METRICS: SystemMetric[] = [
  {
    name: 'CPU Usage',
    value: 45,
    unit: '%',
    status: 'normal',
    trend: 'stable',
    threshold: 80
  },
  {
    name: 'Memory Usage',
    value: 68,
    unit: '%',
    status: 'warning',
    trend: 'up',
    threshold: 85
  },
  {
    name: 'Disk Usage',
    value: 32,
    unit: '%',
    status: 'normal',
    trend: 'stable',
    threshold: 90
  },
  {
    name: 'Network I/O',
    value: 156,
    unit: 'MB/s',
    status: 'normal',
    trend: 'down',
    threshold: 500
  },
  {
    name: 'Database Connections',
    value: 42,
    unit: 'active',
    status: 'normal',
    trend: 'stable',
    threshold: 100
  },
  {
    name: 'API Rate Limit',
    value: 15,
    unit: '%',
    status: 'normal',
    trend: 'stable',
    threshold: 80
  }
]

const MOCK_HEALTH_CHECKS: HealthCheck[] = [
  {
    id: '1',
    name: 'Frontend Health',
    type: 'endpoint',
    url: 'https://app.workforceone.com/health',
    method: 'GET',
    expectedStatus: 200,
    timeout: 5000,
    interval: 60,
    enabled: true,
    lastRun: new Date().toISOString(),
    lastResult: {
      success: true,
      responseTime: 245,
      statusCode: 200
    }
  },
  {
    id: '2',
    name: 'Database Connectivity',
    type: 'database',
    timeout: 3000,
    interval: 30,
    enabled: true,
    lastRun: new Date().toISOString(),
    lastResult: {
      success: true,
      responseTime: 120
    }
  },
  {
    id: '3',
    name: 'Stripe API',
    type: 'integration',
    url: 'https://api.stripe.com/v1/account',
    method: 'GET',
    expectedStatus: 200,
    timeout: 10000,
    interval: 300,
    enabled: true,
    lastRun: new Date().toISOString(),
    lastResult: {
      success: true,
      responseTime: 310,
      statusCode: 200
    }
  }
]

export default function HealthPage() {
  const [services, setServices] = useState<ServiceHealth[]>(MOCK_SERVICES)
  const [metrics, setMetrics] = useState<SystemMetric[]>(MOCK_METRICS)
  const [healthChecks, setHealthChecks] = useState<HealthCheck[]>(MOCK_HEALTH_CHECKS)
  const [loading, setLoading] = useState(false)
  const [lastUpdated, setLastUpdated] = useState(new Date())

  const refreshHealthData = async () => {
    setLoading(true)
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      setLastUpdated(new Date())
    } catch (error) {
      console.error('Error refreshing health data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'normal':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />
      case 'critical':
        return <XCircle className="w-5 h-5 text-red-500" />
      default:
        return <Clock className="w-5 h-5 text-gray-500" />
    }
  }

  const getStatusBadge = (status: string) => {
    const configs = {
      healthy: { color: 'bg-green-100 text-green-800', label: 'Healthy' },
      normal: { color: 'bg-green-100 text-green-800', label: 'Normal' },
      warning: { color: 'bg-yellow-100 text-yellow-800', label: 'Warning' },
      critical: { color: 'bg-red-100 text-red-800', label: 'Critical' },
      unknown: { color: 'bg-gray-100 text-gray-800', label: 'Unknown' }
    }
    const config = configs[status as keyof typeof configs] || configs.unknown
    return <Badge className={config.color}>{config.label}</Badge>
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-red-500" />
      case 'down':
        return <TrendingDown className="w-4 h-4 text-green-500" />
      default:
        return <div className="w-4 h-4" />
    }
  }

  const getOverallHealth = () => {
    const healthyCount = services.filter(s => s.status === 'healthy').length
    const totalCount = services.length
    const percentage = (healthyCount / totalCount) * 100
    
    if (percentage >= 90) return { status: 'healthy', color: 'text-green-600' }
    if (percentage >= 70) return { status: 'warning', color: 'text-yellow-600' }
    return { status: 'critical', color: 'text-red-600' }
  }

  const overallHealth = getOverallHealth()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">System Health</h1>
          <p className="text-gray-600 mt-1">Monitor platform health and performance metrics</p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="text-sm text-gray-500">
            Last updated: {formatDateTime(lastUpdated.toISOString())}
          </div>
          <Button
            onClick={refreshHealthData}
            disabled={loading}
            variant="outline"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Overall Health Status */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                <Heart className={`w-8 h-8 ${overallHealth.color}`} />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">System Status</h2>
                <p className={`text-lg font-semibold ${overallHealth.color}`}>
                  {overallHealth.status === 'healthy' ? 'All Systems Operational' :
                   overallHealth.status === 'warning' ? 'Some Issues Detected' :
                   'Critical Issues Require Attention'}
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className={`text-4xl font-bold ${overallHealth.color}`}>
                {Math.round((services.filter(s => s.status === 'healthy').length / services.length) * 100)}%
              </div>
              <div className="text-sm text-gray-600">Services Healthy</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* System Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {metrics.map((metric, index) => (
          <Card key={index}>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-between text-sm font-medium text-gray-600">
                <span>{metric.name}</span>
                {getTrendIcon(metric.trend)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold text-gray-900">
                    {metric.value}
                    <span className="text-lg text-gray-500 ml-1">{metric.unit}</span>
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    Threshold: {metric.threshold}{metric.unit}
                  </div>
                </div>
                <div className="text-right">
                  {getStatusIcon(metric.status)}
                  <div className="mt-1">
                    {getStatusBadge(metric.status)}
                  </div>
                </div>
              </div>
              <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-500 ${
                    metric.status === 'critical' ? 'bg-red-500' :
                    metric.status === 'warning' ? 'bg-yellow-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${Math.min((metric.value / metric.threshold) * 100, 100)}%` }}
                ></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Service Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Monitor className="w-5 h-5 mr-2" />
            Service Status
          </CardTitle>
          <CardDescription>
            Real-time status of all platform services
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {services.map((service, index) => (
              <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center space-x-4">
                  {getStatusIcon(service.status)}
                  <div>
                    <h4 className="font-semibold text-gray-900">{service.name}</h4>
                    <p className="text-sm text-gray-600">{service.details}</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-6">
                  <div className="text-center">
                    <div className="text-sm font-medium text-gray-900">{service.uptime}%</div>
                    <div className="text-xs text-gray-500">Uptime</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="text-sm font-medium text-gray-900">{service.responseTime}ms</div>
                    <div className="text-xs text-gray-500">Response</div>
                  </div>
                  
                  {service.metrics && (
                    <div className="text-center">
                      <div className="text-sm font-medium text-gray-900">
                        {service.metrics.errors > 0 ? (
                          <span className="text-red-600">{service.metrics.errors}</span>
                        ) : (
                          <span className="text-green-600">0</span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500">Errors</div>
                    </div>
                  )}
                  
                  <div>
                    {getStatusBadge(service.status)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Health Checks */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Activity className="w-5 h-5 mr-2" />
            Automated Health Checks
          </CardTitle>
          <CardDescription>
            Configured health checks and their results
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Check Name</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Type</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Response Time</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Last Run</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Interval</th>
                </tr>
              </thead>
              <tbody>
                {healthChecks.map((check) => (
                  <tr key={check.id} className="border-b hover:bg-gray-50">
                    <td className="py-4 px-4">
                      <div>
                        <div className="font-medium text-gray-900">{check.name}</div>
                        {check.url && (
                          <div className="text-sm text-gray-500">{check.url}</div>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <Badge variant="outline" className="capitalize">
                        {check.type}
                      </Badge>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center space-x-2">
                        {check.lastResult?.success ? (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-500" />
                        )}
                        <span className={`text-sm font-medium ${
                          check.lastResult?.success ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {check.lastResult?.success ? 'Passing' : 'Failing'}
                        </span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-sm font-medium">
                        {check.lastResult?.responseTime || 0}ms
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-sm text-gray-600">
                        {check.lastRun ? formatDateTime(check.lastRun) : 'Never'}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-sm text-gray-600">
                        Every {check.interval}s
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Health Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="w-5 h-5 mr-2" />
              Performance Trends
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                  <h4 className="font-semibold text-green-900">Improving</h4>
                </div>
                <p className="text-sm text-green-700">
                  Database response times have improved by 15% over the last 24 hours.
                </p>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-600" />
                  <h4 className="font-semibold text-yellow-900">Attention Required</h4>
                </div>
                <p className="text-sm text-yellow-700">
                  Memory usage has been trending upward. Consider scaling or optimization.
                </p>
              </div>

              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <XCircle className="w-5 h-5 text-red-600" />
                  <h4 className="font-semibold text-red-900">Critical Issue</h4>
                </div>
                <p className="text-sm text-red-700">
                  Email service is experiencing outages. Notifications may be delayed.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <PieChart className="w-5 h-5 mr-2" />
              Service Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm font-medium">Healthy Services</span>
                </div>
                <span className="text-sm font-bold">
                  {services.filter(s => s.status === 'healthy').length} / {services.length}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <span className="text-sm font-medium">Warning Services</span>
                </div>
                <span className="text-sm font-bold">
                  {services.filter(s => s.status === 'warning').length} / {services.length}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span className="text-sm font-medium">Critical Services</span>
                </div>
                <span className="text-sm font-bold">
                  {services.filter(s => s.status === 'critical').length} / {services.length}
                </span>
              </div>

              <div className="pt-4 border-t">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-900">Overall Health Score</span>
                  <span className={`text-2xl font-bold ${overallHealth.color}`}>
                    {Math.round((services.filter(s => s.status === 'healthy').length / services.length) * 100)}%
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}