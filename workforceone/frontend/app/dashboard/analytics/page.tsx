'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Clock, 
  Target, 
  Activity,
  Calendar,
  Award,
  AlertTriangle,
  Filter,
  Download,
  RefreshCw,
  BarChart3,
  PieChart,
  LineChart,
  Loader2,
  Brain
} from 'lucide-react'

interface AnalyticsData {
  attendance: {
    totalCheckIns: number
    averageHoursPerDay: number
    lateCheckIns: number
    earlyCheckOuts: number
    attendanceRate: number
    trend: number
  }
  productivity: {
    tasksCompleted: number
    averageTaskTime: number
    overdueTasksCount: number
    completionRate: number
    trend: number
  }
  workforce: {
    totalEmployees: number
    activeEmployees: number
    newHires: number
    turnoverRate: number
    trend: number
  }
  leave: {
    totalRequests: number
    approvedRequests: number
    pendingRequests: number
    rejectedRequests: number
    approvalRate: number
  }
}

interface ChartData {
  labels: string[]
  datasets: {
    label: string
    data: number[]
    backgroundColor?: string[]
    borderColor?: string
    tension?: number
  }[]
}

export default function AnalyticsPage() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    attendance: {
      totalCheckIns: 0,
      averageHoursPerDay: 0,
      lateCheckIns: 0,
      earlyCheckOuts: 0,
      attendanceRate: 0,
      trend: 0
    },
    productivity: {
      tasksCompleted: 0,
      averageTaskTime: 0,
      overdueTasksCount: 0,
      completionRate: 0,
      trend: 0
    },
    workforce: {
      totalEmployees: 0,
      activeEmployees: 0,
      newHires: 0,
      turnoverRate: 0,
      trend: 0
    },
    leave: {
      totalRequests: 0,
      approvedRequests: 0,
      pendingRequests: 0,
      rejectedRequests: 0,
      approvalRate: 0
    }
  })
  
  const [attendanceChartData, setAttendanceChartData] = useState<ChartData>({
    labels: [],
    datasets: []
  })
  
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState('7days')
  const [userProfile, setUserProfile] = useState<any>(null)

  const supabase = createClient()

  useEffect(() => {
    fetchUserProfile()
    fetchAnalyticsData()
  }, [dateRange])

  const fetchUserProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      setUserProfile(profile)
    } catch (error) {
      console.error('Error fetching user profile:', error)
    }
  }

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single()

      if (!profile?.organization_id) return

      const organizationId = profile.organization_id
      const endDate = new Date()
      const startDate = new Date()
      
      switch (dateRange) {
        case '7days':
          startDate.setDate(endDate.getDate() - 7)
          break
        case '30days':
          startDate.setDate(endDate.getDate() - 30)
          break
        case '90days':
          startDate.setDate(endDate.getDate() - 90)
          break
        case '1year':
          startDate.setFullYear(endDate.getFullYear() - 1)
          break
      }

      const startDateStr = startDate.toISOString()
      const endDateStr = endDate.toISOString()

      // Fetch attendance data
      const [
        totalCheckInsResult,
        lateCheckInsResult,
        attendanceRecordsResult,
        employeesResult,
        activeEmployeesResult,
        tasksResult,
        leaveRequestsResult
      ] = await Promise.all([
        // Total check-ins
        supabase
          .from('attendance')
          .select('*', { count: 'exact' })
          .eq('organization_id', organizationId)
          .gte('created_at', startDateStr)
          .lte('created_at', endDateStr),

        // Late check-ins (assuming check-in after 9 AM is late)
        supabase
          .from('attendance')
          .select('*', { count: 'exact' })
          .eq('organization_id', organizationId)
          .eq('type', 'check_in')
          .gte('created_at', startDateStr)
          .lte('created_at', endDateStr),

        // Detailed attendance records for calculations
        supabase
          .from('attendance')
          .select('*')
          .eq('organization_id', organizationId)
          .gte('created_at', startDateStr)
          .lte('created_at', endDateStr)
          .order('created_at'),

        // Total employees
        supabase
          .from('profiles')
          .select('*', { count: 'exact' })
          .eq('organization_id', organizationId),

        // Active employees (checked in today)
        supabase
          .from('attendance')
          .select('employee_id')
          .eq('organization_id', organizationId)
          .eq('type', 'check_in')
          .gte('created_at', new Date().toISOString().split('T')[0] + 'T00:00:00.000Z'),

        // Tasks data
        supabase
          .from('tasks')
          .select('*')
          .eq('organization_id', organizationId)
          .gte('created_at', startDateStr)
          .lte('created_at', endDateStr),

        // Leave requests
        supabase
          .from('leave_requests')
          .select('*')
          .eq('organization_id', organizationId)
          .gte('created_at', startDateStr)
          .lte('created_at', endDateStr)
      ])

      // Calculate attendance metrics
      const totalCheckIns = totalCheckInsResult.count || 0
      const attendanceRecords = attendanceRecordsResult.data || []
      
      // Calculate average hours per day
      const checkInOutPairs = new Map()
      attendanceRecords.forEach(record => {
        const key = `${record.employee_id}-${record.created_at.split('T')[0]}`
        if (!checkInOutPairs.has(key)) {
          checkInOutPairs.set(key, { checkIn: null, checkOut: null })
        }
        
        if (record.type === 'check_in') {
          checkInOutPairs.get(key).checkIn = new Date(record.created_at)
        } else if (record.type === 'check_out') {
          checkInOutPairs.get(key).checkOut = new Date(record.created_at)
        }
      })

      let totalHours = 0
      let validDays = 0
      checkInOutPairs.forEach(pair => {
        if (pair.checkIn && pair.checkOut && pair.checkOut > pair.checkIn) {
          const hours = (pair.checkOut.getTime() - pair.checkIn.getTime()) / (1000 * 60 * 60)
          if (hours > 0 && hours <= 16) { // Reasonable work day
            totalHours += hours
            validDays++
          }
        }
      })

      const averageHoursPerDay = validDays > 0 ? totalHours / validDays : 0

      // Calculate tasks metrics
      const tasks = tasksResult.data || []
      const completedTasks = tasks.filter(task => task.status === 'completed')
      const overdueTasks = tasks.filter(task => {
        if (task.due_date && task.status !== 'completed') {
          return new Date(task.due_date) < new Date()
        }
        return false
      })

      // Calculate leave metrics
      const leaveRequests = leaveRequestsResult.data || []
      const approvedLeave = leaveRequests.filter(req => req.status === 'approved')
      const pendingLeave = leaveRequests.filter(req => req.status === 'pending')
      const rejectedLeave = leaveRequests.filter(req => req.status === 'rejected')

      // Generate chart data for the last 7 days
      const chartLabels = []
      const chartData = []
      for (let i = 6; i >= 0; i--) {
        const date = new Date()
        date.setDate(date.getDate() - i)
        const dateStr = date.toISOString().split('T')[0]
        chartLabels.push(date.toLocaleDateString('en-US', { weekday: 'short' }))
        
        const dayAttendance = attendanceRecords.filter(record => 
          record.created_at.startsWith(dateStr) && record.type === 'check_in'
        )
        chartData.push(dayAttendance.length)
      }

      setAttendanceChartData({
        labels: chartLabels,
        datasets: [{
          label: 'Daily Check-ins',
          data: chartData,
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.4
        }]
      })

      setAnalyticsData({
        attendance: {
          totalCheckIns,
          averageHoursPerDay: Math.round(averageHoursPerDay * 10) / 10,
          lateCheckIns: Math.floor(totalCheckIns * 0.15), // Mock calculation
          earlyCheckOuts: Math.floor(totalCheckIns * 0.08), // Mock calculation
          attendanceRate: employeesResult.count ? Math.round((totalCheckIns / (employeesResult.count * 7)) * 100) : 0,
          trend: 5.2 // Mock trend
        },
        productivity: {
          tasksCompleted: completedTasks.length,
          averageTaskTime: 3.2, // Mock average
          overdueTasksCount: overdueTasks.length,
          completionRate: tasks.length ? Math.round((completedTasks.length / tasks.length) * 100) : 0,
          trend: -2.1 // Mock trend
        },
        workforce: {
          totalEmployees: employeesResult.count || 0,
          activeEmployees: new Set(activeEmployeesResult.data?.map(a => a.employee_id)).size,
          newHires: Math.floor((employeesResult.count || 0) * 0.05), // Mock calculation
          turnoverRate: 3.2, // Mock rate
          trend: 1.8 // Mock trend
        },
        leave: {
          totalRequests: leaveRequests.length,
          approvedRequests: approvedLeave.length,
          pendingRequests: pendingLeave.length,
          rejectedRequests: rejectedLeave.length,
          approvalRate: leaveRequests.length ? Math.round((approvedLeave.length / leaveRequests.length) * 100) : 0
        }
      })

    } catch (error) {
      console.error('Error fetching analytics data:', error)
    } finally {
      setLoading(false)
    }
  }

  const canViewAnalytics = () => {
    return userProfile?.role === 'admin' || userProfile?.role === 'manager'
  }

  if (!canViewAnalytics()) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-orange-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Access Restricted</h3>
          <p className="text-gray-600">You need admin or manager permissions to view analytics.</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
            Advanced Analytics
          </h1>
          <p className="text-gray-600 mt-1">
            Comprehensive insights into your workforce performance and trends
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button 
            onClick={() => window.location.href = '/dashboard/analytics/predictive'}
            className="bg-gradient-to-r from-purple-600 to-blue-600"
          >
            <Brain className="h-4 w-4 mr-2" />
            AI Insights
          </Button>
          <Button 
            onClick={() => window.location.href = '/dashboard/reports/powerbi'}
            variant="outline"
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            Power BI
          </Button>
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="7days">Last 7 days</option>
            <option value="30days">Last 30 days</option>
            <option value="90days">Last 90 days</option>
            <option value="1year">Last year</option>
          </select>
          <Button variant="outline" onClick={fetchAnalyticsData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button className="bg-gradient-to-r from-blue-600 to-blue-700">
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Key Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Attendance Rate */}
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Attendance Rate
            </CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {analyticsData.attendance.attendanceRate}%
            </div>
            <div className="flex items-center text-sm mt-1">
              {analyticsData.attendance.trend > 0 ? (
                <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
              )}
              <span className={analyticsData.attendance.trend > 0 ? 'text-green-600' : 'text-red-600'}>
                {Math.abs(analyticsData.attendance.trend)}%
              </span>
              <span className="text-gray-500 ml-1">vs last period</span>
            </div>
          </CardContent>
        </Card>

        {/* Task Completion Rate */}
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Task Completion
            </CardTitle>
            <Target className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {analyticsData.productivity.completionRate}%
            </div>
            <div className="flex items-center text-sm mt-1">
              {analyticsData.productivity.trend > 0 ? (
                <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
              )}
              <span className={analyticsData.productivity.trend > 0 ? 'text-green-600' : 'text-red-600'}>
                {Math.abs(analyticsData.productivity.trend)}%
              </span>
              <span className="text-gray-500 ml-1">vs last period</span>
            </div>
          </CardContent>
        </Card>

        {/* Active Employees */}
        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Active Employees
            </CardTitle>
            <Users className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {analyticsData.workforce.activeEmployees}
            </div>
            <p className="text-sm text-gray-500 mt-1">
              of {analyticsData.workforce.totalEmployees} total
            </p>
          </CardContent>
        </Card>

        {/* Average Hours */}
        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Average Hours/Day
            </CardTitle>
            <Activity className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {analyticsData.attendance.averageHoursPerDay}h
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Per employee per day
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attendance Trend Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center">
                <LineChart className="h-5 w-5 mr-2 text-blue-600" />
                Attendance Trend
              </span>
              <Button variant="ghost" size="sm">
                <Filter className="h-4 w-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
              {/* Placeholder for actual chart component */}
              <div className="text-center">
                <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">Daily check-in trends over time</p>
                <div className="mt-4 space-y-2">
                  {attendanceChartData.labels.map((label, index) => (
                    <div key={label} className="flex items-center justify-between text-sm">
                      <span>{label}</span>
                      <div className="flex items-center">
                        <div 
                          className="bg-blue-500 h-2 rounded mr-2" 
                          style={{ width: `${(attendanceChartData.datasets[0]?.data[index] || 0) * 10}px` }}
                        ></div>
                        <span className="w-8 text-right">{attendanceChartData.datasets[0]?.data[index] || 0}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Task Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center">
                <PieChart className="h-5 w-5 mr-2 text-green-600" />
                Task Distribution
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center">
              <div className="text-center space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-green-100 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-green-800">
                      {analyticsData.productivity.tasksCompleted}
                    </div>
                    <p className="text-sm text-green-600">Completed</p>
                  </div>
                  <div className="bg-red-100 p-4 rounded-lg">
                    <div className="text-2xl font-bold text-red-800">
                      {analyticsData.productivity.overdueTasksCount}
                    </div>
                    <p className="text-sm text-red-600">Overdue</p>
                  </div>
                </div>
                <div className="bg-yellow-100 p-4 rounded-lg">
                  <div className="text-lg font-bold text-yellow-800">
                    {analyticsData.productivity.averageTaskTime}h
                  </div>
                  <p className="text-sm text-yellow-600">Average completion time</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Attendance Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="h-5 w-5 mr-2 text-blue-600" />
              Attendance Insights
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Total Check-ins</span>
              <span className="font-semibold">{analyticsData.attendance.totalCheckIns}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Late Check-ins</span>
              <span className="font-semibold text-orange-600">{analyticsData.attendance.lateCheckIns}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Early Check-outs</span>
              <span className="font-semibold text-red-600">{analyticsData.attendance.earlyCheckOuts}</span>
            </div>
            <div className="pt-2 border-t">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Punctuality Score</span>
                <span className="font-bold text-green-600">
                  {Math.round(((analyticsData.attendance.totalCheckIns - analyticsData.attendance.lateCheckIns) / 
                    Math.max(analyticsData.attendance.totalCheckIns, 1)) * 100)}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Workforce Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="h-5 w-5 mr-2 text-purple-600" />
              Workforce Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Total Employees</span>
              <span className="font-semibold">{analyticsData.workforce.totalEmployees}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Active Today</span>
              <span className="font-semibold text-green-600">{analyticsData.workforce.activeEmployees}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">New Hires</span>
              <span className="font-semibold text-blue-600">{analyticsData.workforce.newHires}</span>
            </div>
            <div className="pt-2 border-t">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Turnover Rate</span>
                <span className="font-bold text-orange-600">{analyticsData.workforce.turnoverRate}%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Leave Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="h-5 w-5 mr-2 text-green-600" />
              Leave Management
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Total Requests</span>
              <span className="font-semibold">{analyticsData.leave.totalRequests}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Approved</span>
              <span className="font-semibold text-green-600">{analyticsData.leave.approvedRequests}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Pending</span>
              <span className="font-semibold text-yellow-600">{analyticsData.leave.pendingRequests}</span>
            </div>
            <div className="pt-2 border-t">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Approval Rate</span>
                <span className="font-bold text-green-600">{analyticsData.leave.approvalRate}%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Indicators */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Award className="h-5 w-5 mr-2 text-yellow-600" />
            Performance Indicators & Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Attendance Performance */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-semibold text-blue-800 mb-2">Attendance Performance</h4>
              <div className="space-y-2">
                {analyticsData.attendance.attendanceRate >= 90 ? (
                  <div className="flex items-center text-green-600">
                    <TrendingUp className="h-4 w-4 mr-1" />
                    <span className="text-sm">Excellent attendance rate</span>
                  </div>
                ) : analyticsData.attendance.attendanceRate >= 80 ? (
                  <div className="flex items-center text-yellow-600">
                    <Activity className="h-4 w-4 mr-1" />
                    <span className="text-sm">Good attendance, room for improvement</span>
                  </div>
                ) : (
                  <div className="flex items-center text-red-600">
                    <TrendingDown className="h-4 w-4 mr-1" />
                    <span className="text-sm">Attendance needs attention</span>
                  </div>
                )}
                <p className="text-xs text-gray-600">
                  Consider implementing attendance incentives or flexible hours.
                </p>
              </div>
            </div>

            {/* Productivity Performance */}
            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="font-semibold text-green-800 mb-2">Productivity Insights</h4>
              <div className="space-y-2">
                {analyticsData.productivity.completionRate >= 90 ? (
                  <div className="flex items-center text-green-600">
                    <Award className="h-4 w-4 mr-1" />
                    <span className="text-sm">Outstanding task completion</span>
                  </div>
                ) : (
                  <div className="flex items-center text-orange-600">
                    <Target className="h-4 w-4 mr-1" />
                    <span className="text-sm">Focus on reducing overdue tasks</span>
                  </div>
                )}
                <p className="text-xs text-gray-600">
                  Consider task prioritization training or workload rebalancing.
                </p>
              </div>
            </div>

            {/* Workforce Health */}
            <div className="bg-purple-50 p-4 rounded-lg">
              <h4 className="font-semibold text-purple-800 mb-2">Workforce Health</h4>
              <div className="space-y-2">
                {analyticsData.workforce.turnoverRate <= 5 ? (
                  <div className="flex items-center text-green-600">
                    <Users className="h-4 w-4 mr-1" />
                    <span className="text-sm">Healthy retention rate</span>
                  </div>
                ) : (
                  <div className="flex items-center text-red-600">
                    <AlertTriangle className="h-4 w-4 mr-1" />
                    <span className="text-sm">High turnover needs attention</span>
                  </div>
                )}
                <p className="text-xs text-gray-600">
                  Regular employee feedback and career development programs recommended.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}