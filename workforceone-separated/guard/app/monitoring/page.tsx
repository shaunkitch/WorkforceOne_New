'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import Navbar from '@/components/navigation/Navbar'
import { 
  Monitor, Users, MapPin, Clock, AlertTriangle, CheckCircle,
  TrendingUp, Radio, Shield, Activity, Eye, Calendar,
  Target, BarChart3, Zap, MessageSquare, Phone, Car
} from 'lucide-react'

interface GuardStatus {
  id: string
  name: string
  site: string
  status: 'active' | 'on-break' | 'off-duty' | 'emergency'
  location: string
  lastUpdate: string
  shift: string
  performance: number
}

interface SiteStatus {
  id: string
  name: string
  coverage: number
  required: number
  active: number
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
  lastIncident: string
  contractValue: number
}

interface LiveIncident {
  id: string
  type: string
  site: string
  guard: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  status: 'active' | 'investigating' | 'resolved'
  time: string
  duration: string
}

interface PerformanceMetric {
  label: string
  value: number
  target: number
  trend: 'up' | 'down' | 'stable'
  unit: string
}

export default function SecurityMonitoringDashboard() {
  const [currentTime, setCurrentTime] = useState(new Date())
  const [selectedFilter, setSelectedFilter] = useState('all')
  const [refreshInterval, setRefreshInterval] = useState(30)

  // Mock real-time data - in production this would come from WebSocket/API
  const [guardStatuses] = useState<GuardStatus[]>([
    {
      id: 'G001',
      name: 'Alex Rodriguez',
      site: 'Downtown Financial Plaza',
      status: 'active',
      location: 'Building Lobby',
      lastUpdate: '2 mins ago',
      shift: 'Night Shift',
      performance: 98
    },
    {
      id: 'G002', 
      name: 'Sarah Chen',
      site: 'Tech Campus North',
      status: 'on-break',
      location: 'Security Office',
      lastUpdate: '5 mins ago',
      shift: 'Day Shift',
      performance: 95
    },
    {
      id: 'G003',
      name: 'Marcus Williams',
      site: 'Retail Complex West',
      status: 'active',
      location: 'Parking Lot A',
      lastUpdate: '1 min ago',
      shift: 'Evening Shift',
      performance: 92
    },
    {
      id: 'G004',
      name: 'Emma Davis',
      site: 'Medical Center',
      status: 'emergency',
      location: 'Emergency Room',
      lastUpdate: 'Just now',
      shift: 'Night Shift',
      performance: 97
    }
  ])

  const [siteStatuses] = useState<SiteStatus[]>([
    {
      id: 'S001',
      name: 'Downtown Financial Plaza',
      coverage: 100,
      required: 3,
      active: 3,
      riskLevel: 'high',
      lastIncident: '2 hours ago',
      contractValue: 125000
    },
    {
      id: 'S002',
      name: 'Tech Campus North', 
      coverage: 75,
      required: 4,
      active: 3,
      riskLevel: 'medium',
      lastIncident: '6 hours ago',
      contractValue: 98000
    },
    {
      id: 'S003',
      name: 'Retail Complex West',
      coverage: 100,
      required: 2,
      active: 2,
      riskLevel: 'medium',
      lastIncident: '1 day ago',
      contractValue: 67000
    },
    {
      id: 'S004',
      name: 'Medical Center',
      coverage: 100,
      required: 2,
      active: 2,
      riskLevel: 'critical',
      lastIncident: '30 mins ago',
      contractValue: 156000
    }
  ])

  const [liveIncidents] = useState<LiveIncident[]>([
    {
      id: 'INC-001',
      type: 'Medical Emergency',
      site: 'Medical Center',
      guard: 'Emma Davis',
      severity: 'critical',
      status: 'active',
      time: '23:42',
      duration: '8 mins'
    },
    {
      id: 'INC-002',
      type: 'Suspicious Activity',
      site: 'Downtown Financial Plaza',
      guard: 'Alex Rodriguez',
      severity: 'medium',
      status: 'investigating',
      time: '23:15',
      duration: '35 mins'
    },
    {
      id: 'INC-003',
      type: 'Alarm Triggered',
      site: 'Tech Campus North',
      guard: 'Sarah Chen',
      severity: 'low',
      status: 'resolved',
      time: '22:30',
      duration: '15 mins'
    }
  ])

  const [performanceMetrics] = useState<PerformanceMetric[]>([
    { label: 'Response Time', value: 4.2, target: 5.0, trend: 'up', unit: 'mins' },
    { label: 'Site Coverage', value: 94, target: 95, trend: 'stable', unit: '%' },
    { label: 'Guard Utilization', value: 87, target: 85, trend: 'up', unit: '%' },
    { label: 'Incident Resolution', value: 96, target: 90, trend: 'up', unit: '%' },
    { label: 'Client Satisfaction', value: 4.8, target: 4.5, trend: 'up', unit: '/5' },
    { label: 'Equipment Status', value: 99, target: 98, trend: 'stable', unit: '%' }
  ])

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'on-break': return 'bg-yellow-100 text-yellow-800'
      case 'off-duty': return 'bg-gray-100 text-gray-800'
      case 'emergency': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'bg-green-100 text-green-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'  
      case 'high': return 'bg-orange-100 text-orange-800'
      case 'critical': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'bg-green-500'
      case 'medium': return 'bg-yellow-500'
      case 'high': return 'bg-orange-500'
      case 'critical': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-3 w-3 text-green-600" />
      case 'down': return <TrendingUp className="h-3 w-3 text-red-600 rotate-180" />
      case 'stable': return <BarChart3 className="h-3 w-3 text-blue-600" />
      default: return null
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* Command Center Header */}
        <Card className="bg-gradient-to-r from-slate-900 to-blue-900 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold flex items-center">
                  <Monitor className="h-8 w-8 mr-3" />
                  Security Command Center
                </h1>
                <p className="text-slate-300">Real-time operations monitoring and management</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-mono">
                  {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </div>
                <div className="text-sm text-slate-300">
                  {currentTime.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex space-x-6 text-sm">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></div>
                  Live Monitoring Active
                </div>
                <div className="flex items-center">
                  <Radio className="h-4 w-4 mr-1" />
                  All Channels Online
                </div>
                <div className="flex items-center">
                  <Shield className="h-4 w-4 mr-1" />
                  {guardStatuses.filter(g => g.status === 'active').length} Guards Active
                </div>
              </div>
              
              <div className="flex space-x-2">
                <Select value={refreshInterval.toString()} onValueChange={(value) => setRefreshInterval(parseInt(value))}>
                  <SelectTrigger className="w-32 bg-slate-800 border-slate-600">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10 seconds</SelectItem>
                    <SelectItem value="30">30 seconds</SelectItem>
                    <SelectItem value="60">1 minute</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" className="bg-slate-800 border-slate-600 text-white hover:bg-slate-700">
                  <Zap className="h-4 w-4 mr-2" />
                  Auto-Refresh
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Key Performance Indicators */}
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
          {performanceMetrics.map((metric, idx) => (
            <Card key={idx}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">{metric.label}</p>
                    <p className="text-2xl font-bold">
                      {metric.value}{metric.unit}
                    </p>
                    <p className="text-xs text-gray-500">
                      Target: {metric.target}{metric.unit}
                    </p>
                  </div>
                  <div className="flex flex-col items-center">
                    {getTrendIcon(metric.trend)}
                    <div className={`text-xs mt-1 ${
                      metric.value >= metric.target ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {metric.value >= metric.target ? 'On Target' : 'Below Target'}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Live Guard Status */}
          <Card className="xl:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="h-5 w-5 mr-2" />
                Live Guard Status
                <Badge className="ml-2 bg-green-100 text-green-800">
                  {guardStatuses.filter(g => g.status === 'active').length} Active
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 max-h-96 overflow-y-auto">
              {guardStatuses.map((guard) => (
                <div key={guard.id} className="border rounded-lg p-3 hover:bg-gray-50">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-medium">{guard.name}</div>
                    <Badge className={getStatusColor(guard.status)}>
                      {guard.status.replace('-', ' ').toUpperCase()}
                    </Badge>
                  </div>
                  <div className="text-sm text-gray-600 space-y-1">
                    <div className="flex items-center">
                      <MapPin className="h-3 w-3 mr-1" />
                      {guard.site} - {guard.location}
                    </div>
                    <div className="flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      {guard.shift} • Last update: {guard.lastUpdate}
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Performance:</span>
                      <div className="flex items-center">
                        <div className="w-16 bg-gray-200 rounded-full h-1.5 mr-2">
                          <div 
                            className="bg-green-600 h-1.5 rounded-full" 
                            style={{ width: `${guard.performance}%` }}
                          />
                        </div>
                        <span className="text-xs font-medium">{guard.performance}%</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex space-x-1 mt-2">
                    <Button size="sm" variant="outline" className="flex-1 h-6 text-xs">
                      <Eye className="h-3 w-3 mr-1" />
                      Track
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1 h-6 text-xs">
                      <Phone className="h-3 w-3 mr-1" />
                      Call
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Site Coverage Overview */}
          <Card className="xl:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Target className="h-5 w-5 mr-2" />
                Site Coverage Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 max-h-96 overflow-y-auto">
              {siteStatuses.map((site) => (
                <div key={site.id} className="border rounded-lg p-3 hover:bg-gray-50">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-medium">{site.name}</div>
                    <div className="flex items-center">
                      <div className={`w-2 h-2 rounded-full mr-1 ${getRiskColor(site.riskLevel)}`} />
                      <span className="text-xs text-gray-600">{site.riskLevel}</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Coverage:</span>
                      <span className={`font-medium ${
                        site.coverage === 100 ? 'text-green-600' : 
                        site.coverage >= 75 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {site.active}/{site.required} ({site.coverage}%)
                      </span>
                    </div>
                    <Progress value={site.coverage} className="h-2" />
                  </div>

                  <div className="text-xs text-gray-500 mt-2">
                    Contract: ${site.contractValue.toLocaleString()}/month
                  </div>
                  <div className="text-xs text-gray-500">
                    Last incident: {site.lastIncident}
                  </div>

                  <div className="flex space-x-1 mt-2">
                    <Button size="sm" variant="outline" className="flex-1 h-6 text-xs">
                      <MapPin className="h-3 w-3 mr-1" />
                      View
                    </Button>
                    {site.coverage < 100 && (
                      <Button size="sm" variant="outline" className="flex-1 h-6 text-xs bg-red-50">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Alert
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Live Incidents */}
          <Card className="xl:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2" />
                Live Incidents
                <Badge className="ml-2 bg-red-100 text-red-800">
                  {liveIncidents.filter(i => i.status === 'active').length} Active
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 max-h-96 overflow-y-auto">
              {liveIncidents.map((incident) => (
                <div key={incident.id} className="border rounded-lg p-3 hover:bg-gray-50">
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-medium text-sm">{incident.type}</div>
                    <Badge className={getSeverityColor(incident.severity)}>
                      {incident.severity}
                    </Badge>
                  </div>
                  
                  <div className="text-sm text-gray-600 space-y-1">
                    <div className="flex items-center">
                      <MapPin className="h-3 w-3 mr-1" />
                      {incident.site}
                    </div>
                    <div className="flex items-center">
                      <Shield className="h-3 w-3 mr-1" />
                      {incident.guard}
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Started: {incident.time}</span>
                      <span className="font-medium">Duration: {incident.duration}</span>
                    </div>
                  </div>

                  <div className="flex space-x-1 mt-2">
                    <Button size="sm" variant="outline" className="flex-1 h-6 text-xs">
                      <Eye className="h-3 w-3 mr-1" />
                      Monitor
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1 h-6 text-xs">
                      <MessageSquare className="h-3 w-3 mr-1" />
                      Contact
                    </Button>
                  </div>
                </div>
              ))}
              
              <div className="border-2 border-dashed border-gray-200 rounded-lg p-3 text-center">
                <Button size="sm" className="w-full bg-red-600 hover:bg-red-700 h-8">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  Emergency Dispatch
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Operations Control Panel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="h-5 w-5 mr-2" />
              Operations Control Panel
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
              <Button className="h-16 flex-col bg-blue-600 hover:bg-blue-700">
                <Radio className="h-5 w-5 mb-1" />
                Broadcast
              </Button>
              <Button className="h-16 flex-col bg-green-600 hover:bg-green-700">
                <Users className="h-5 w-5 mb-1" />
                Deploy
              </Button>
              <Button className="h-16 flex-col bg-orange-600 hover:bg-orange-700">
                <AlertTriangle className="h-5 w-5 mb-1" />
                Alert All
              </Button>
              <Button className="h-16 flex-col bg-purple-600 hover:bg-purple-700">
                <Calendar className="h-5 w-5 mb-1" />
                Scheduling
              </Button>
              <Button className="h-16 flex-col bg-red-600 hover:bg-red-700">
                <Phone className="h-5 w-5 mb-1" />
                Emergency
              </Button>
              <Button className="h-16 flex-col bg-teal-600 hover:bg-teal-700">
                <BarChart3 className="h-5 w-5 mb-1" />
                Reports
              </Button>
              <Button className="h-16 flex-col bg-indigo-600 hover:bg-indigo-700">
                <Car className="h-5 w-5 mb-1" />
                Vehicles
              </Button>
              <Button className="h-16 flex-col bg-slate-600 hover:bg-slate-700">
                <Monitor className="h-5 w-5 mb-1" />
                Cameras
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* System Status Summary */}
        <Card className="bg-gradient-to-r from-emerald-50 to-teal-50">
          <CardContent className="p-6">
            <h3 className="font-semibold text-emerald-900 mb-4">System Health & Status</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
              <div>
                <div className="text-2xl font-bold text-emerald-700">99.9%</div>
                <div className="text-sm text-emerald-600">System Uptime</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-emerald-700">847</div>
                <div className="text-sm text-emerald-600">Guards Managed</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-emerald-700">156</div>
                <div className="text-sm text-emerald-600">Active Sites</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-emerald-700">$2.4M</div>
                <div className="text-sm text-emerald-600">Monthly Contracts</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}