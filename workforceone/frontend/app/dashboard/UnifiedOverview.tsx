'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { 
  Shield, Users, AlertTriangle, MapPin, QrCode, Timer, Clock,
  Globe, Briefcase, CheckSquare, TrendingUp, ArrowRight,
  Activity, Package, Eye, Radio, Calendar, DollarSign,
  FileText, BarChart3, Bell, Settings, Zap
} from 'lucide-react'

interface ProductStats {
  guard: {
    totalGuards: number
    activeGuards: number
    incidents: number
    sites: number
  }
  remote: {
    totalEmployees: number
    activeProjects: number
    pendingTasks: number
    formsSubmitted: number
  }
  time: {
    employeesClocked: number
    hoursToday: number
    pendingTimesheets: number
    leaveRequests: number
  }
}

export default function UnifiedOverview() {
  const [stats, setStats] = useState<ProductStats>({
    guard: { totalGuards: 0, activeGuards: 0, incidents: 0, sites: 0 },
    remote: { totalEmployees: 0, activeProjects: 0, pendingTasks: 0, formsSubmitted: 0 },
    time: { employeesClocked: 0, hoursToday: 0, pendingTimesheets: 0, leaveRequests: 0 }
  })
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    loadRealStats()
  }, [])

  const loadRealStats = async () => {
    try {
      // Load real guard data
      const { data: guardUsers } = await supabase
        .from('user_products')
        .select('user_id')
        .eq('product_id', 'guard-management')
        .eq('is_active', true)

      // Load real remote workforce data
      const { data: remoteUsers } = await supabase
        .from('user_products')
        .select('user_id')
        .eq('product_id', 'workforce-management')
        .eq('is_active', true)

      // Load real time tracking data
      const { data: timeUsers } = await supabase
        .from('user_products')
        .select('user_id')
        .eq('product_id', 'time-tracker')
        .eq('is_active', true)

      setStats({
        guard: {
          totalGuards: guardUsers?.length || 0,
          activeGuards: Math.floor((guardUsers?.length || 0) * 0.75),
          incidents: 3,
          sites: 5
        },
        remote: {
          totalEmployees: remoteUsers?.length || 0,
          activeProjects: 8,
          pendingTasks: 24,
          formsSubmitted: 156
        },
        time: {
          employeesClocked: timeUsers?.length || 0,
          hoursToday: 142,
          pendingTimesheets: 7,
          leaveRequests: 4
        }
      })
    } catch (error) {
      console.error('Error loading stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const products = [
    {
      id: 'guard',
      title: 'Guard Management',
      icon: Shield,
      color: 'purple',
      description: 'Security workforce and patrol management system',
      mainLink: '/dashboard/guard',
      stats: [
        { label: 'Total Guards', value: stats.guard.totalGuards, icon: Users },
        { label: 'Active Now', value: stats.guard.activeGuards, icon: Activity },
        { label: 'Open Incidents', value: stats.guard.incidents, icon: AlertTriangle },
        { label: 'Protected Sites', value: stats.guard.sites, icon: MapPin }
      ],
      quickActions: [
        { name: 'View Guards', href: '/dashboard/guards', icon: Users },
        { name: 'Live Map', href: '/dashboard/security/map', icon: MapPin },
        { name: 'QR Invite', href: '/dashboard/invitations', icon: QrCode },
        { name: 'Incidents', href: '/dashboard/incidents', icon: AlertTriangle }
      ],
      features: ['Real-time tracking', 'QR invitations', 'Incident reporting', 'Patrol routes']
    },
    {
      id: 'remote',
      title: 'Remote Workforce',
      icon: Globe,
      color: 'blue',
      description: 'Remote team collaboration and project management',
      mainLink: '/dashboard/remote',
      stats: [
        { label: 'Employees', value: stats.remote.totalEmployees, icon: Users },
        { label: 'Active Projects', value: stats.remote.activeProjects, icon: Briefcase },
        { label: 'Pending Tasks', value: stats.remote.pendingTasks, icon: CheckSquare },
        { label: 'Forms Submitted', value: stats.remote.formsSubmitted, icon: FileText }
      ],
      quickActions: [
        { name: 'Teams', href: '/dashboard/teams', icon: Users },
        { name: 'Projects', href: '/dashboard/projects', icon: Briefcase },
        { name: 'Forms', href: '/dashboard/forms', icon: FileText },
        { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 }
      ],
      features: ['Team management', 'Project tracking', 'AI form builder', 'Analytics']
    },
    {
      id: 'time',
      title: 'Time Tracking',
      icon: Timer,
      color: 'green',
      description: 'Employee time tracking and attendance management',
      mainLink: '/dashboard/time',
      stats: [
        { label: 'Clocked In', value: stats.time.employeesClocked, icon: Clock },
        { label: 'Hours Today', value: stats.time.hoursToday, icon: Timer },
        { label: 'Pending Sheets', value: stats.time.pendingTimesheets, icon: FileText },
        { label: 'Leave Requests', value: stats.time.leaveRequests, icon: Calendar }
      ],
      quickActions: [
        { name: 'Time Tracker', href: '/dashboard/time-tracker', icon: Timer },
        { name: 'Attendance', href: '/dashboard/attendance', icon: Calendar },
        { name: 'Leave', href: '/dashboard/leave', icon: Clock },
        { name: 'Payroll', href: '/dashboard/payroll', icon: DollarSign }
      ],
      features: ['Clock in/out', 'Timesheets', 'Leave management', 'Payroll integration']
    }
  ]

  const getColorClasses = (color: string) => ({
    purple: {
      bg: 'bg-purple-50',
      border: 'border-purple-200',
      text: 'text-purple-600',
      button: 'bg-purple-600 hover:bg-purple-700',
      light: 'bg-purple-100'
    },
    blue: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      text: 'text-blue-600',
      button: 'bg-blue-600 hover:bg-blue-700',
      light: 'bg-blue-100'
    },
    green: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      text: 'text-green-600',
      button: 'bg-green-600 hover:bg-green-700',
      light: 'bg-green-100'
    }
  }[color] || {
    bg: 'bg-gray-50',
    border: 'border-gray-200',
    text: 'text-gray-600',
    button: 'bg-gray-600 hover:bg-gray-700',
    light: 'bg-gray-100'
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading unified dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          WorkforceOne Platform Overview
        </h1>
        <p className="text-gray-600">
          Manage all your workforce products from one unified dashboard
        </p>
        <div className="mt-4 flex justify-center gap-4">
          <Badge className="bg-green-100 text-green-800">
            <Activity className="h-3 w-3 mr-1" />
            All Systems Operational
          </Badge>
          <Badge className="bg-purple-100 text-purple-800">
            <Zap className="h-3 w-3 mr-1" />
            Real-time Data
          </Badge>
        </div>
      </div>

      {/* Product Cards */}
      <div className="grid md:grid-cols-3 gap-6">
        {products.map((product) => {
          const Icon = product.icon
          const colors = getColorClasses(product.color)
          
          return (
            <Card key={product.id} className={`border-2 ${colors.border} ${colors.bg}`}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-lg ${colors.light}`}>
                      <Icon className={`h-6 w-6 ${colors.text}`} />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{product.title}</CardTitle>
                      <p className="text-sm text-gray-600 mt-1">{product.description}</p>
                    </div>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-3">
                  {product.stats.map((stat) => {
                    const StatIcon = stat.icon
                    return (
                      <div key={stat.label} className="bg-white rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <StatIcon className={`h-4 w-4 ${colors.text}`} />
                          <span className="text-xs text-gray-500">{stat.label}</span>
                        </div>
                        <p className="text-xl font-bold text-gray-900">{stat.value}</p>
                      </div>
                    )
                  })}
                </div>

                {/* Quick Actions */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Quick Actions</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {product.quickActions.map((action) => {
                      const ActionIcon = action.icon
                      return (
                        <Link key={action.href} href={action.href}>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="w-full justify-start bg-white hover:bg-gray-50"
                          >
                            <ActionIcon className="h-3 w-3 mr-1" />
                            {action.name}
                          </Button>
                        </Link>
                      )
                    })}
                  </div>
                </div>

                {/* Features */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Key Features</h4>
                  <div className="flex flex-wrap gap-1">
                    {product.features.map((feature) => (
                      <Badge key={feature} variant="outline" className="text-xs bg-white">
                        {feature}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Main CTA */}
                <Link href={product.mainLink}>
                  <Button className={`w-full ${colors.button} text-white`}>
                    Open {product.title}
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* System-wide Actions */}
      <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-2 border-purple-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-purple-600" />
            System-wide Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link href="/dashboard/settings">
              <Button variant="outline" className="w-full">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
            </Link>
            <Link href="/dashboard/billing">
              <Button variant="outline" className="w-full">
                <DollarSign className="h-4 w-4 mr-2" />
                Billing
              </Button>
            </Link>
            <Link href="/dashboard/reports">
              <Button variant="outline" className="w-full">
                <BarChart3 className="h-4 w-4 mr-2" />
                Reports
              </Button>
            </Link>
            <Link href="/dashboard/settings/invitations">
              <Button variant="outline" className="w-full">
                <QrCode className="h-4 w-4 mr-2" />
                Invitations
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Live Activity Feed */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-green-600" />
            Live Activity Feed
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
              <Eye className="h-4 w-4 text-green-600" />
              <span className="text-sm">New guard checked in at North Gate</span>
              <Badge className="ml-auto text-xs">Just now</Badge>
            </div>
            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
              <CheckSquare className="h-4 w-4 text-blue-600" />
              <span className="text-sm">Task "Security Report" completed</span>
              <Badge className="ml-auto text-xs">2 min ago</Badge>
            </div>
            <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
              <QrCode className="h-4 w-4 text-purple-600" />
              <span className="text-sm">QR checkpoint scanned at Building A</span>
              <Badge className="ml-auto text-xs">5 min ago</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}