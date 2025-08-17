'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  AlertTriangle, CheckCircle, Clock, Eye, Brain, Mail,
  RefreshCw, Search, Filter, Zap, Database, Globe,
  TrendingUp, Activity, Settings, Code
} from 'lucide-react'
import { formatDateTime } from '@/lib/utils'

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
  ai_analysis?: {
    probable_cause: string
    recommended_actions: string[]
    fix_confidence: number
    auto_fixable: boolean
  }
}

export default function IncidentsPage() {
  const [incidents, setIncidents] = useState<Incident[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null)
  const [statusFilter, setStatusFilter] = useState('all')
  const [severityFilter, setSeverityFilter] = useState('all')

  useEffect(() => {
    fetchIncidents()
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchIncidents, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchIncidents = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/monitoring/incidents?analysis=true')
      const data = await response.json()
      
      if (data.success) {
        setIncidents(data.data)
      }
    } catch (error) {
      console.error('Error fetching incidents:', error)
    } finally {
      setLoading(false)
    }
  }

  const analyzeCurrentLogs = async () => {
    try {
      const response = await fetch('/api/monitoring/incidents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'analyze_logs' })
      })
      
      const data = await response.json()
      if (data.success) {
        alert(`Log analysis complete. Found ${data.data.length} new incidents.`)
        fetchIncidents()
      }
    } catch (error) {
      console.error('Error analyzing logs:', error)
      alert('Failed to analyze logs')
    }
  }

  const sendTestAlert = async () => {
    try {
      const response = await fetch('/api/monitoring/incidents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'send_test_alert' })
      })
      
      const data = await response.json()
      if (data.success) {
        alert('Test alert email sent to admin@workforceone.co.za')
      } else {
        alert('Failed to send test alert: ' + data.error)
      }
    } catch (error) {
      console.error('Error sending test alert:', error)
      alert('Failed to send test alert')
    }
  }

  const resolveIncident = async (incident: Incident) => {
    const resolution = prompt('Enter resolution details:')
    if (!resolution) return

    try {
      const response = await fetch('/api/monitoring/incidents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'resolve',
          incident_id: incident.id,
          data: { resolution }
        })
      })
      
      const data = await response.json()
      if (data.success) {
        alert('Incident resolved successfully')
        fetchIncidents()
        setSelectedIncident(null)
      } else {
        alert('Failed to resolve incident: ' + data.error)
      }
    } catch (error) {
      console.error('Error resolving incident:', error)
      alert('Failed to resolve incident')
    }
  }

  const getSeverityBadge = (severity: string) => {
    const severityConfig = {
      low: { color: 'bg-blue-100 text-blue-800', icon: '🔵' },
      medium: { color: 'bg-yellow-100 text-yellow-800', icon: '🟡' },
      high: { color: 'bg-orange-100 text-orange-800', icon: '🟠' },
      critical: { color: 'bg-red-100 text-red-800', icon: '🔴' }
    }
    const config = severityConfig[severity as keyof typeof severityConfig]
    return (
      <Badge className={config.color}>
        {config.icon} {severity.toUpperCase()}
      </Badge>
    )
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      investigating: { color: 'bg-blue-100 text-blue-800', icon: '🔍' },
      identified: { color: 'bg-yellow-100 text-yellow-800', icon: '🎯' },
      monitoring: { color: 'bg-purple-100 text-purple-800', icon: '👁️' },
      resolved: { color: 'bg-green-100 text-green-800', icon: '✅' }
    }
    const config = statusConfig[status as keyof typeof statusConfig]
    return (
      <Badge className={config.color}>
        {config.icon} {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  const getServiceIcon = (service: string) => {
    const icons = {
      vercel: <Globe className="w-4 h-4" />,
      supabase: <Database className="w-4 h-4" />,
      database: <Database className="w-4 h-4" />,
      api: <Code className="w-4 h-4" />,
      system: <Settings className="w-4 h-4" />
    }
    return icons[service as keyof typeof icons] || <Activity className="w-4 h-4" />
  }

  const filteredIncidents = incidents.filter(incident => {
    if (statusFilter !== 'all' && incident.status !== statusFilter) return false
    if (severityFilter !== 'all' && incident.severity !== severityFilter) return false
    return true
  })

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">AI Incident Management</h1>
          <p className="text-gray-600 mt-1">Intelligent incident detection and automated response system</p>
        </div>
        <div className="flex space-x-3">
          <Button onClick={analyzeCurrentLogs} variant="outline">
            <Brain className="w-4 h-4 mr-2" />
            Analyze Logs
          </Button>
          <Button onClick={sendTestAlert} variant="outline">
            <Mail className="w-4 h-4 mr-2" />
            Test Alert
          </Button>
          <Button onClick={fetchIncidents}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Incidents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-900">{incidents.length}</div>
            <div className="text-sm text-gray-600 mt-1">All time</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Critical/High</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">
              {incidents.filter(i => i.severity === 'critical' || i.severity === 'high').length}
            </div>
            <div className="text-sm text-gray-600 mt-1">Needs attention</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Active</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">
              {incidents.filter(i => i.status !== 'resolved').length}
            </div>
            <div className="text-sm text-gray-600 mt-1">Under investigation</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Resolved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {incidents.filter(i => i.status === 'resolved').length}
            </div>
            <div className="text-sm text-gray-600 mt-1">Completed</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <span className="text-sm font-medium text-gray-600">Filters:</span>
            </div>
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-admin-500 focus:border-admin-500"
            >
              <option value="all">All Statuses</option>
              <option value="investigating">Investigating</option>
              <option value="identified">Identified</option>
              <option value="monitoring">Monitoring</option>
              <option value="resolved">Resolved</option>
            </select>

            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-admin-500 focus:border-admin-500"
            >
              <option value="all">All Severities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>

            <div className="text-sm text-gray-600">
              Showing {filteredIncidents.length} of {incidents.length} incidents
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Incidents List */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Incidents</CardTitle>
          <CardDescription>
            AI-detected incidents with automated analysis and recommendations
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredIncidents.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle className="mx-auto h-12 w-12 text-green-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No incidents found</h3>
              <p className="mt-1 text-sm text-gray-500">
                All systems are operating normally or no incidents match your filters.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredIncidents.map((incident) => (
                <div key={incident.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        {getSeverityBadge(incident.severity)}
                        {getStatusBadge(incident.status)}
                        <span className="text-sm text-gray-500">
                          {formatDateTime(incident.started_at)}
                        </span>
                      </div>
                      
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {incident.title}
                      </h3>
                      
                      <p className="text-gray-600 mb-3">{incident.description}</p>
                      
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <div className="flex items-center space-x-1">
                          <span>Services:</span>
                          {incident.affected_services.map((service, idx) => (
                            <div key={idx} className="flex items-center space-x-1">
                              {getServiceIcon(service)}
                              <span>{service}</span>
                            </div>
                          ))}
                        </div>
                        
                        {incident.ai_analysis && (
                          <div className="flex items-center space-x-1">
                            <Brain className="w-4 h-4" />
                            <span>AI Confidence: {incident.ai_analysis.fix_confidence}%</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex space-x-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedIncident(incident)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      
                      {incident.status !== 'resolved' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => resolveIncident(incident)}
                        >
                          <CheckCircle className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Incident Details Modal */}
      {selectedIncident && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Incident Details</h2>
                <Button variant="outline" onClick={() => setSelectedIncident(null)}>
                  Close
                </Button>
              </div>

              <div className="space-y-6">
                {/* Basic Info */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Incident ID</label>
                    <div className="text-lg font-mono">{selectedIncident.id}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Started</label>
                    <div className="text-lg">{formatDateTime(selectedIncident.started_at)}</div>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600">Title</label>
                  <div className="text-xl font-semibold">{selectedIncident.title}</div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600">Impact</label>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    {selectedIncident.impact}
                  </div>
                </div>

                {/* AI Analysis */}
                {selectedIncident.ai_analysis && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Brain className="w-5 h-5 mr-2" />
                        AI Analysis
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-medium text-gray-600">Probable Cause</label>
                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                            {selectedIncident.ai_analysis.probable_cause}
                          </div>
                        </div>

                        <div>
                          <label className="text-sm font-medium text-gray-600">Recommended Actions</label>
                          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                            <ol className="list-decimal list-inside space-y-1">
                              {selectedIncident.ai_analysis.recommended_actions.map((action, idx) => (
                                <li key={idx}>{action}</li>
                              ))}
                            </ol>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-sm font-medium text-gray-600">Fix Confidence</label>
                            <div className="text-lg font-semibold">{selectedIncident.ai_analysis.fix_confidence}%</div>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-gray-600">Auto-fixable</label>
                            <div className="text-lg font-semibold">
                              {selectedIncident.ai_analysis.auto_fixable ? '✅ Yes' : '❌ No'}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}