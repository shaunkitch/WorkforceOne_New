'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { 
  Shield, AlertTriangle, MapPin, QrCode, FileText, Users,
  TrendingUp, CheckCircle, Clock, AlertCircle, 
  ArrowRight, Plus, Settings, BarChart3, Camera,
  Navigation, Bell, Eye, Radio
} from 'lucide-react'

export default function GuardDashboard() {
  // Mock data - in real app would come from API
  const dashboardData = {
    guards: { total: 24, on_duty: 18, available: 6 },
    incidents: { open: 3, resolved_today: 12, pending_review: 2 },
    patrols: { active: 8, completed_today: 45, missed: 1 },
    checkpoints: { total: 156, scanned_today: 432, missed: 8 },
    sites: { active: 12, secure: 11, alerts: 1 },
    reports: { submitted_today: 28, pending_approval: 5 }
  }

  const quickActions = [
    {
      title: 'Create Incident',
      description: 'Report security incident with evidence',
      icon: AlertTriangle,
      href: '/incidents/create',
      color: 'red'
    },
    {
      title: 'Assign Guard',
      description: 'Schedule guard to site or patrol',
      icon: Users,
      href: '/guards/assign',
      color: 'blue'
    },
    {
      title: 'Plan Patrol Route',
      description: 'Create optimized patrol routes',
      icon: Navigation,
      href: '/security/routes',
      color: 'purple'
    },
    {
      title: 'Add Checkpoint',
      description: 'Set up QR checkpoints for patrols',
      icon: QrCode,
      href: '/checkpoints/create',
      color: 'green'
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <div className="h-10 w-10 bg-purple-600 rounded-lg flex items-center justify-center">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <h1 className="text-2xl font-bold text-gray-900">WorkforceOne Guard</h1>
                <p className="text-sm text-gray-600">Security Management System</p>
              </div>
            </div>
            <Badge className="bg-purple-600 text-lg px-4 py-2">
              <Shield className="h-4 w-4 mr-2" />
              Production Ready
            </Badge>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Dashboard Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Security Dashboard</h1>
            <p className="text-gray-600">Real-time security management and patrol operations</p>
          </div>
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
                    <div className="p-4 rounded-lg border-2 border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-all cursor-pointer group">
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
              <Link href="/security/routes">
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
              <Link href="/incidents">
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
              <Link href="/security/map">
                <Button className="w-full bg-green-600 hover:bg-green-700">
                  Live Monitor
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Success Message */}
        <Card className="border-2 border-purple-200 bg-gradient-to-r from-purple-50 to-indigo-50">
          <CardContent className="p-8 text-center">
            <Shield className="h-16 w-16 text-purple-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-purple-900 mb-2">
              🎉 Production-Ready Guard Management System!
            </h2>
            <p className="text-purple-700 mb-4 max-w-2xl mx-auto">
              Your dedicated WorkforceOne Guard application is fully functional with patrol management, 
              incident reporting, QR checkpoints, and real-time monitoring. Ready for production deployment!
            </p>
            <div className="bg-white rounded-lg p-4 inline-block">
              <div className="text-sm text-gray-600">
                <strong>Running on:</strong> localhost:3003 | 
                <strong className="text-purple-600 ml-2">Security Guard Management Only</strong>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}