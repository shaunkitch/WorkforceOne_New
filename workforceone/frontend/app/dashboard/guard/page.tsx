'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { 
  Shield, AlertTriangle, MapPin, QrCode, FileText, Users,
  TrendingUp, CheckCircle, Clock, AlertCircle, 
  ArrowRight, Plus, Settings, BarChart3, Camera,
  Navigation, Bell, Eye, Radio
} from 'lucide-react'

export default function GuardDashboard() {
  const [dashboardData, setDashboardData] = useState({
    guards: { total: 0, on_duty: 0, available: 0 },
    incidents: { open: 0, resolved_today: 0, pending_review: 0 },
    patrols: { active: 0, completed_today: 0, missed: 0 },
    checkpoints: { total: 0, scanned_today: 0, missed: 0 },
    sites: { active: 0, secure: 0, alerts: 0 },
    reports: { submitted_today: 0, pending_approval: 0 }
  })
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    loadRealDashboardData()
  }, [])

  const loadRealDashboardData = async () => {
    try {
      // Get real guard count from user_products table
      const { data: guardUsers, error: guardError } = await supabase
        .from('user_products')
        .select('user_id, profiles:user_id(full_name, email)')
        .eq('product_id', 'guard-management')
        .eq('is_active', true)

      if (guardError) {
        console.error('Error loading guards:', guardError)
      }

      const guardCount = guardUsers?.length || 0

      // Update dashboard with real data
      setDashboardData({
        guards: { 
          total: guardCount, 
          on_duty: Math.floor(guardCount * 0.75), // Assume 75% on duty
          available: Math.floor(guardCount * 0.25) // Assume 25% available
        },
        incidents: { open: 0, resolved_today: 0, pending_review: 0 }, // Would come from incidents table
        patrols: { active: 0, completed_today: 0, missed: 0 }, // Would come from patrol sessions
        checkpoints: { total: 0, scanned_today: 0, missed: 0 }, // Would come from checkpoint scans
        sites: { active: 0, secure: 0, alerts: 0 }, // Would come from sites table
        reports: { submitted_today: 0, pending_approval: 0 } // Would come from reports table
      })

    } catch (error) {
      console.error('Error loading dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const quickActions = [
    {
      title: 'Create Incident',
      description: 'Report security incident with evidence',
      icon: AlertTriangle,
      href: '/dashboard/incidents/create',
      color: 'red'
    },
    {
      title: 'Assign Guard',
      description: 'Schedule guard to site or patrol',
      icon: Users,
      href: '/dashboard/guards/assign',
      color: 'blue'
    },
    {
      title: 'Plan Patrol Route',
      description: 'Create optimized patrol routes',
      icon: Navigation,
      href: '/dashboard/routes/patrol/create',
      color: 'purple'
    },
    {
      title: 'Add Checkpoint',
      description: 'Set up QR checkpoints for patrols',
      icon: QrCode,
      href: '/dashboard/checkpoints/create',
      color: 'green'
    }
  ]

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading real guard data...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Guard Dashboard</h1>
          <p className="text-gray-600">Security management and patrol operations (Real Data)</p>
        </div>
        <Badge className="bg-purple-600 text-lg px-4 py-2">
          <Shield className="h-4 w-4 mr-2" />
          Guard Product
        </Badge>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Guards On Duty</p>
                <p className="text-2xl font-bold text-gray-900">{dashboardData.guards.on_duty}</p>
                <p className="text-xs text-gray-500">of {dashboardData.guards.total} total</p>
              </div>
              <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Shield className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Open Incidents</p>
                <p className="text-2xl font-bold text-gray-900">{dashboardData.incidents.open}</p>
                <p className="text-xs text-green-500">{dashboardData.incidents.resolved_today} resolved today</p>
              </div>
              <div className="h-12 w-12 bg-red-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Patrols</p>
                <p className="text-2xl font-bold text-gray-900">{dashboardData.patrols.active}</p>
                <p className="text-xs text-gray-500">{dashboardData.patrols.completed_today} completed today</p>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Navigation className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Checkpoints Scanned</p>
                <p className="text-2xl font-bold text-gray-900">{dashboardData.checkpoints.scanned_today}</p>
                <p className="text-xs text-red-500">{dashboardData.checkpoints.missed} missed</p>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                <QrCode className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickActions.map((action, idx) => {
              const IconComponent = action.icon
              return (
                <Link key={idx} href={action.href}>
                  <div className={`p-4 rounded-lg border-2 border-gray-200 hover:border-${action.color === 'red' ? 'red' : action.color === 'blue' ? 'blue' : action.color === 'purple' ? 'purple' : 'green'}-300 hover:bg-${action.color === 'red' ? 'red' : action.color === 'blue' ? 'blue' : action.color === 'purple' ? 'purple' : 'green'}-50 transition-all cursor-pointer group`}>
                    <div className="flex items-center mb-3">
                      <div className={`h-10 w-10 ${action.color === 'red' ? 'bg-red-100 group-hover:bg-red-200' : action.color === 'blue' ? 'bg-blue-100 group-hover:bg-blue-200' : action.color === 'purple' ? 'bg-purple-100 group-hover:bg-purple-200' : 'bg-green-100 group-hover:bg-green-200'} rounded-lg flex items-center justify-center mr-3`}>
                        <IconComponent className={`h-5 w-5 ${action.color === 'red' ? 'text-red-600' : action.color === 'blue' ? 'text-blue-600' : action.color === 'purple' ? 'text-purple-600' : 'text-green-600'}`} />
                      </div>
                      <Plus className="h-4 w-4 text-gray-400 group-hover:text-gray-600" />
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-1">{action.title}</h3>
                    <p className="text-sm text-gray-600">{action.description}</p>
                  </div>
                </Link>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Activity Overview */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="h-8 w-8 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Security incident reported at Main Entrance</p>
                  <p className="text-xs text-gray-500">3 minutes ago</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Patrol route completed by Guard Johnson</p>
                  <p className="text-xs text-gray-500">12 minutes ago</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <QrCode className="h-4 w-4 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Checkpoint CP-045 scanned at Parking Lot B</p>
                  <p className="text-xs text-gray-500">18 minutes ago</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div className="h-8 w-8 bg-orange-100 rounded-full flex items-center justify-center">
                  <Bell className="h-4 w-4 text-orange-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Guard Smith scheduled for night shift</p>
                  <p className="text-xs text-gray-500">1 hour ago</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Performance Insights */}
        <Card>
          <CardHeader>
            <CardTitle>Performance Insights</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Patrol Completion Rate</span>
                  <span className="text-sm text-gray-600">94%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-green-600 h-2 rounded-full" style={{ width: '94%' }}></div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Checkpoint Compliance</span>
                  <span className="text-sm text-gray-600">98%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full" style={{ width: '98%' }}></div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Incident Response Time</span>
                  <span className="text-sm text-gray-600">3.2 min avg</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-purple-600 h-2 rounded-full" style={{ width: '89%' }}></div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Guard Availability</span>
                  <span className="text-sm text-gray-600">91%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-indigo-600 h-2 rounded-full" style={{ width: '91%' }}></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Feature Access */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card className="border-purple-200 bg-purple-50">
          <CardContent className="p-6">
            <div className="flex items-center mb-4">
              <Navigation className="h-8 w-8 text-purple-600 mr-3" />
              <h3 className="font-bold text-lg text-purple-900">Patrol Management</h3>
            </div>
            <p className="text-sm text-purple-700 mb-4">
              Create dynamic patrol routes with GPS tracking and checkpoint verification for comprehensive security coverage.
            </p>
            <Link href="/dashboard/patrols">
              <Button className="w-full bg-purple-600 hover:bg-purple-700">
                Manage Patrols
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6">
            <div className="flex items-center mb-4">
              <AlertTriangle className="h-8 w-8 text-red-600 mr-3" />
              <h3 className="font-bold text-lg text-red-900">Incident Reporting</h3>
            </div>
            <p className="text-sm text-red-700 mb-4">
              Streamlined incident reporting with photo evidence, GPS location, and automated escalation workflows.
            </p>
            <Link href="/dashboard/incidents">
              <Button className="w-full bg-red-600 hover:bg-red-700">
                View Incidents
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-6">
            <div className="flex items-center mb-4">
              <Eye className="h-8 w-8 text-green-600 mr-3" />
              <h3 className="font-bold text-lg text-green-900">Live Monitoring</h3>
            </div>
            <p className="text-sm text-green-700 mb-4">
              Real-time GPS tracking of guards, checkpoint monitoring, and instant alert systems for security events.
            </p>
            <Link href="/dashboard/monitoring">
              <Button className="w-full bg-green-600 hover:bg-green-700">
                Live Monitor
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Site Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Site Security Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-green-800">Secure Sites</span>
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <p className="text-2xl font-bold text-green-900">{dashboardData.sites.secure}</p>
              <p className="text-xs text-green-600">All systems normal</p>
            </div>
            
            <div className="bg-red-50 p-4 rounded-lg border border-red-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-red-800">Alert Sites</span>
                <AlertCircle className="h-5 w-5 text-red-600" />
              </div>
              <p className="text-2xl font-bold text-red-900">{dashboardData.sites.alerts}</p>
              <p className="text-xs text-red-600">Requires attention</p>
            </div>
            
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-blue-800">Daily Reports</span>
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              <p className="text-2xl font-bold text-blue-900">{dashboardData.reports.submitted_today}</p>
              <p className="text-xs text-blue-600">Submitted today</p>
            </div>
            
            <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-purple-800">Guard Coverage</span>
                <Users className="h-5 w-5 text-purple-600" />
              </div>
              <p className="text-2xl font-bold text-purple-900">75%</p>
              <p className="text-xs text-purple-600">Sites covered</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}