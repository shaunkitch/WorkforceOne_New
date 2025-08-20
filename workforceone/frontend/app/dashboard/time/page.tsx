'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { 
  Clock, Calendar, Users, DollarSign, TrendingUp, CheckCircle,
  AlertCircle, ArrowRight, Plus, Settings, BarChart3, Play,
  Pause, MapPin, FileText, Bell, Timer, ClipboardList
} from 'lucide-react'

export default function TimeDashboard() {
  // Mock data - in real app would come from API
  const dashboardData = {
    employees: { total: 42, clocked_in: 28, on_break: 4, overtime: 6 },
    attendance: { present: 38, late: 3, absent: 1, on_leave: 2 },
    time_entries: { today: 156, pending_approval: 12, billable_hours: 234 },
    payroll: { hours_week: 1680, overtime_hours: 96, estimated_cost: 42850 },
    breaks: { compliance_rate: 96, missed_breaks: 2 },
    shifts: { scheduled_today: 45, active: 32, upcoming: 8 }
  }

  const quickActions = [
    {
      title: 'Start Time Tracker',
      description: 'Begin tracking work time',
      icon: Play,
      href: '/dashboard/time-tracker',
      color: 'green'
    },
    {
      title: 'Schedule Shifts',
      description: 'Manage employee work schedules',
      icon: Calendar,
      href: '/dashboard/shifts/schedule',
      color: 'blue'
    },
    {
      title: 'Review Attendance',
      description: 'Check daily attendance reports',
      icon: ClipboardList,
      href: '/dashboard/attendance',
      color: 'purple'
    },
    {
      title: 'Process Payroll',
      description: 'Generate payroll reports',
      icon: DollarSign,
      href: '/dashboard/payroll',
      color: 'indigo'
    }
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Time Dashboard</h1>
          <p className="text-gray-600">Time tracking & attendance management</p>
        </div>
        <Badge className="bg-green-600 text-lg px-4 py-2">
          <Clock className="h-4 w-4 mr-2" />
          Time Product
        </Badge>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Employees Clocked In</p>
                <p className="text-2xl font-bold text-gray-900">{dashboardData.employees.clocked_in}</p>
                <p className="text-xs text-gray-500">of {dashboardData.employees.total} total</p>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Users className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Attendance Today</p>
                <p className="text-2xl font-bold text-gray-900">{dashboardData.attendance.present}</p>
                <p className="text-xs text-red-500">{dashboardData.attendance.late} late arrivals</p>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Time Entries Today</p>
                <p className="text-2xl font-bold text-gray-900">{dashboardData.time_entries.today}</p>
                <p className="text-xs text-orange-500">{dashboardData.time_entries.pending_approval} pending</p>
              </div>
              <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Timer className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Weekly Hours</p>
                <p className="text-2xl font-bold text-gray-900">{dashboardData.payroll.hours_week.toLocaleString()}</p>
                <p className="text-xs text-gray-500">{dashboardData.payroll.overtime_hours}h overtime</p>
              </div>
              <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <Clock className="h-6 w-6 text-orange-600" />
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
                  <div className={`p-4 rounded-lg border-2 border-gray-200 hover:border-${action.color === 'green' ? 'green' : action.color === 'blue' ? 'blue' : action.color === 'purple' ? 'purple' : 'indigo'}-300 hover:bg-${action.color === 'green' ? 'green' : action.color === 'blue' ? 'blue' : action.color === 'purple' ? 'purple' : 'indigo'}-50 transition-all cursor-pointer group`}>
                    <div className="flex items-center mb-3">
                      <div className={`h-10 w-10 ${action.color === 'green' ? 'bg-green-100 group-hover:bg-green-200' : action.color === 'blue' ? 'bg-blue-100 group-hover:bg-blue-200' : action.color === 'purple' ? 'bg-purple-100 group-hover:bg-purple-200' : 'bg-indigo-100 group-hover:bg-indigo-200'} rounded-lg flex items-center justify-center mr-3`}>
                        <IconComponent className={`h-5 w-5 ${action.color === 'green' ? 'text-green-600' : action.color === 'blue' ? 'text-blue-600' : action.color === 'purple' ? 'text-purple-600' : 'text-indigo-600'}`} />
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
                <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                  <Play className="h-4 w-4 text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Sarah Johnson started time tracking</p>
                  <p className="text-xs text-gray-500">2 minutes ago</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <Calendar className="h-4 w-4 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Mike Chen clocked in for morning shift</p>
                  <p className="text-xs text-gray-500">8 minutes ago</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div className="h-8 w-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <FileText className="h-4 w-4 text-purple-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Overtime request approved for Team Alpha</p>
                  <p className="text-xs text-gray-500">15 minutes ago</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div className="h-8 w-8 bg-orange-100 rounded-full flex items-center justify-center">
                  <Bell className="h-4 w-4 text-orange-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Break reminder sent to 12 employees</p>
                  <p className="text-xs text-gray-500">32 minutes ago</p>
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
                  <span className="text-sm font-medium">Attendance Rate</span>
                  <span className="text-sm text-gray-600">95%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-green-600 h-2 rounded-full" style={{ width: '95%' }}></div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Time Accuracy</span>
                  <span className="text-sm text-gray-600">97%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full" style={{ width: '97%' }}></div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Break Compliance</span>
                  <span className="text-sm text-gray-600">96%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-purple-600 h-2 rounded-full" style={{ width: '96%' }}></div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Payroll Accuracy</span>
                  <span className="text-sm text-gray-600">99%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-indigo-600 h-2 rounded-full" style={{ width: '99%' }}></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Feature Access */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-6">
            <div className="flex items-center mb-4">
              <Timer className="h-8 w-8 text-green-600 mr-3" />
              <h3 className="font-bold text-lg text-green-900">Time Tracking</h3>
            </div>
            <p className="text-sm text-green-700 mb-4">
              GPS-enabled time clock with photo verification, offline capability, and automatic break detection.
            </p>
            <Link href="/dashboard/time-tracker">
              <Button className="w-full bg-green-600 hover:bg-green-700">
                Track Time
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-6">
            <div className="flex items-center mb-4">
              <Calendar className="h-8 w-8 text-blue-600 mr-3" />
              <h3 className="font-bold text-lg text-blue-900">Attendance Management</h3>
            </div>
            <p className="text-sm text-blue-700 mb-4">
              Real-time attendance tracking with automated notifications for tardiness and absence patterns.
            </p>
            <Link href="/dashboard/attendance">
              <Button className="w-full bg-blue-600 hover:bg-blue-700">
                View Attendance
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="border-purple-200 bg-purple-50">
          <CardContent className="p-6">
            <div className="flex items-center mb-4">
              <DollarSign className="h-8 w-8 text-purple-600 mr-3" />
              <h3 className="font-bold text-lg text-purple-900">Payroll Integration</h3>
            </div>
            <p className="text-sm text-purple-700 mb-4">
              Automated payroll processing with overtime calculations and direct export to payroll systems.
            </p>
            <Link href="/dashboard/payroll">
              <Button className="w-full bg-purple-600 hover:bg-purple-700">
                Process Payroll
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Time Overview Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-r from-green-50 to-green-100 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-green-800">Regular Hours</span>
              <Clock className="h-5 w-5 text-green-600" />
            </div>
            <p className="text-2xl font-bold text-green-900">1,584</p>
            <p className="text-xs text-green-600">This week</p>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-r from-orange-50 to-orange-100 border-orange-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-orange-800">Overtime Hours</span>
              <TrendingUp className="h-5 w-5 text-orange-600" />
            </div>
            <p className="text-2xl font-bold text-orange-900">96</p>
            <p className="text-xs text-orange-600">This week</p>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-blue-800">Break Time</span>
              <Pause className="h-5 w-5 text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-blue-900">234</p>
            <p className="text-xs text-blue-600">Hours this week</p>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-r from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-purple-800">Labor Cost</span>
              <DollarSign className="h-5 w-5 text-purple-600" />
            </div>
            <p className="text-2xl font-bold text-purple-900">${dashboardData.payroll.estimated_cost.toLocaleString()}</p>
            <p className="text-xs text-purple-600">This week</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}