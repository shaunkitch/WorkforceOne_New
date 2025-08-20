'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { 
  Users, Target, FileText, MapPin, Route, Building2, 
  TrendingUp, CheckCircle, Clock, AlertCircle, 
  ArrowRight, Plus, Settings, BarChart3
} from 'lucide-react'

export default function RemoteDashboard() {
  // Mock data - in real app would come from API
  const dashboardData = {
    teams: { total: 8, active: 6 },
    tasks: { pending: 23, completed: 187, overdue: 3 },
    projects: { active: 12, completed: 45 },
    outlets: { total: 15, visited_today: 8 },
    routes: { optimized: 5, in_progress: 3 },
    forms: { submitted_today: 42, pending_review: 7 }
  }

  const quickActions = [
    {
      title: 'Create Task',
      description: 'Assign new task to team members',
      icon: Target,
      href: '/dashboard/tasks/create',
      color: 'blue'
    },
    {
      title: 'Build Form',
      description: 'Create custom form with drag & drop',
      icon: FileText,
      href: '/dashboard/forms/builder/new',
      color: 'green'
    },
    {
      title: 'Optimize Route',
      description: 'Plan efficient routes for field teams',
      icon: Route,
      href: '/dashboard/routes/create',
      color: 'purple'
    },
    {
      title: 'Add Team Member',
      description: 'Invite new team members',
      icon: Users,
      href: '/dashboard/teams/invite',
      color: 'indigo'
    }
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Remote Dashboard</h1>
          <p className="text-gray-600">Team & task management for distributed workforces</p>
        </div>
        <Badge className="bg-blue-600 text-lg px-4 py-2">
          <Users className="h-4 w-4 mr-2" />
          Remote Product
        </Badge>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Teams</p>
                <p className="text-2xl font-bold text-gray-900">{dashboardData.teams.active}</p>
                <p className="text-xs text-gray-500">of {dashboardData.teams.total} total</p>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Tasks</p>
                <p className="text-2xl font-bold text-gray-900">{dashboardData.tasks.pending}</p>
                <p className="text-xs text-red-500">{dashboardData.tasks.overdue} overdue</p>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Target className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Projects</p>
                <p className="text-2xl font-bold text-gray-900">{dashboardData.projects.active}</p>
                <p className="text-xs text-gray-500">{dashboardData.projects.completed} completed</p>
              </div>
              <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <BarChart3 className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Outlets Visited</p>
                <p className="text-2xl font-bold text-gray-900">{dashboardData.outlets.visited_today}</p>
                <p className="text-xs text-gray-500">of {dashboardData.outlets.total} today</p>
              </div>
              <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Building2 className="h-6 w-6 text-orange-600" />
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
                  <div className={`p-4 rounded-lg border-2 border-gray-200 hover:border-${action.color}-300 hover:bg-${action.color}-50 transition-all cursor-pointer group`}>
                    <div className="flex items-center mb-3">
                      <div className={`h-10 w-10 bg-${action.color}-100 group-hover:bg-${action.color}-200 rounded-lg flex items-center justify-center mr-3`}>
                        <IconComponent className={`h-5 w-5 text-${action.color}-600`} />
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
                <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <Target className="h-4 w-4 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">New task assigned to Marketing Team</p>
                  <p className="text-xs text-gray-500">2 minutes ago</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Route optimization completed</p>
                  <p className="text-xs text-gray-500">15 minutes ago</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div className="h-8 w-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <FileText className="h-4 w-4 text-purple-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">New form submission received</p>
                  <p className="text-xs text-gray-500">1 hour ago</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div className="h-8 w-8 bg-orange-100 rounded-full flex items-center justify-center">
                  <Building2 className="h-4 w-4 text-orange-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Outlet visit completed at Downtown Location</p>
                  <p className="text-xs text-gray-500">3 hours ago</p>
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
                  <span className="text-sm font-medium">Task Completion Rate</span>
                  <span className="text-sm text-gray-600">87%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-green-600 h-2 rounded-full" style={{ width: '87%' }}></div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Route Efficiency</span>
                  <span className="text-sm text-gray-600">92%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full" style={{ width: '92%' }}></div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Form Response Rate</span>
                  <span className="text-sm text-gray-600">78%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-purple-600 h-2 rounded-full" style={{ width: '78%' }}></div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Team Productivity</span>
                  <span className="text-sm text-gray-600">85%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-indigo-600 h-2 rounded-full" style={{ width: '85%' }}></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Feature Access */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-6">
            <div className="flex items-center mb-4">
              <Users className="h-8 w-8 text-blue-600 mr-3" />
              <h3 className="font-bold text-lg text-blue-900">Team Management</h3>
            </div>
            <p className="text-sm text-blue-700 mb-4">
              Manage your distributed teams with advanced role-based permissions and hierarchy structures.
            </p>
            <Link href="/dashboard/teams">
              <Button className="w-full bg-blue-600 hover:bg-blue-700">
                Manage Teams
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-6">
            <div className="flex items-center mb-4">
              <FileText className="h-8 w-8 text-green-600 mr-3" />
              <h3 className="font-bold text-lg text-green-900">Dynamic Forms</h3>
            </div>
            <p className="text-sm text-green-700 mb-4">
              Create custom forms with our drag & drop builder. Perfect for inspections, surveys, and data collection.
            </p>
            <Link href="/dashboard/forms">
              <Button className="w-full bg-green-600 hover:bg-green-700">
                Build Forms
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="border-purple-200 bg-purple-50">
          <CardContent className="p-6">
            <div className="flex items-center mb-4">
              <Route className="h-8 w-8 text-purple-600 mr-3" />
              <h3 className="font-bold text-lg text-purple-900">Route Optimization</h3>
            </div>
            <p className="text-sm text-purple-700 mb-4">
              AI-powered route planning reduces travel time and fuel costs for your field teams.
            </p>
            <Link href="/dashboard/routes">
              <Button className="w-full bg-purple-600 hover:bg-purple-700">
                Optimize Routes
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}