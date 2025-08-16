// ===================================
// app/dashboard/page.tsx - Modern Dashboard Overview
// ===================================
'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Users, 
  Clock, 
  Calendar, 
  TrendingUp, 
  CheckCircle,
  AlertTriangle,
  Activity,
  BarChart3,
  Plus,
  ChevronRight,
  MapPin,
  ClipboardList,
  Phone,
  CheckSquare,
  UserCheck
} from 'lucide-react'
import { format } from 'date-fns'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface DashboardStats {
  totalEmployees: number
  activeProjects: number
  completedTasks: number
  pendingForms: number
  projectsDueThisWeek: number
  todayAttendance: {
    present: number
    absent: number
    late: number
  }
  myTasks: number
  checkedInToday: number
  checkedInThisWeek: number
  dailyCalls: number
}

interface RecentActivity {
  id: string
  type: 'attendance' | 'task' | 'form' | 'project'
  user: string
  action: string
  time: string
  timestamp: string
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [userProfile, setUserProfile] = useState<any>(null)
  
  const supabase = createClient()
  const router = useRouter()

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchRecentActivity = async (organizationId: string) => {
    try {
      const activities: RecentActivity[] = []

      // Get recent attendance records (last 24 hours)
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      const { data: attendanceData } = await supabase
        .from('attendance')
        .select(`
          id,
          status,
          check_in_time,
          check_out_time,
          date,
          user:profiles!attendance_user_id_fkey (
            full_name
          )
        `)
        .eq('organization_id', organizationId)
        .gte('created_at', yesterday.toISOString())
        .order('created_at', { ascending: false })
        .limit(5)

      attendanceData?.forEach(record => {
        if (record.user?.full_name) {
          const action = record.status === 'present' && record.check_out_time 
            ? 'checked out' 
            : 'checked in'
          const timestamp = record.check_in_time || record.date
          const time = format(new Date(timestamp), 'h:mm a')
          
          activities.push({
            id: `attendance_${record.id}`,
            type: 'attendance',
            user: record.user.full_name,
            action,
            time,
            timestamp
          })
        }
      })

      // Get recent completed tasks (last 7 days)
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      const { data: taskData } = await supabase
        .from('tasks')
        .select(`
          id,
          title,
          updated_at,
          assignee:profiles!tasks_assignee_id_fkey (
            full_name
          )
        `)
        .eq('status', 'completed')
        .gte('updated_at', weekAgo.toISOString())
        .order('updated_at', { ascending: false })
        .limit(5)

      taskData?.forEach(task => {
        if (task.assignee?.full_name) {
          activities.push({
            id: `task_${task.id}`,
            type: 'task',
            user: task.assignee.full_name,
            action: `completed "${task.title}"`,
            time: format(new Date(task.updated_at), 'h:mm a'),
            timestamp: task.updated_at
          })
        }
      })

      // Get recent form submissions (last 7 days) - with error handling
      try {
        const { data: formData } = await supabase
          .from('form_responses')
          .select(`
            id,
            created_at,
            form:forms!form_responses_form_id_fkey (
              title
            ),
            user:profiles!form_responses_user_id_fkey (
              full_name
            )
          `)
          .eq('organization_id', organizationId)
          .gte('created_at', weekAgo.toISOString())
          .order('created_at', { ascending: false })
          .limit(5)

        formData?.forEach(response => {
          if (response.user?.full_name && response.form?.title) {
            activities.push({
              id: `form_${response.id}`,
              type: 'form',
              user: response.user.full_name,
              action: `submitted ${response.form.title}`,
              time: format(new Date(response.created_at), 'h:mm a'),
              timestamp: response.created_at
            })
          }
        })
      } catch (error) {
        console.log('Form responses table not available:', error)
        // Skip form submissions if table doesn't exist
      }

      // Sort all activities by most recent first and limit to 8
      const sortedActivities = activities
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 8)

      setRecentActivity(sortedActivities)
    } catch (error) {
      console.error('Error fetching recent activity:', error)
      setRecentActivity([])
    }
  }

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      
      // Get user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      
      setUserProfile(profile)

      if (!profile?.organization_id) return

      // Get total employees
      const { count: totalEmployees } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', profile.organization_id)

      // Get today's attendance
      const today = format(new Date(), 'yyyy-MM-dd')
      const { data: attendanceData } = await supabase
        .from('attendance')
        .select('status')
        .eq('organization_id', profile.organization_id)
        .eq('date', today)

      const attendanceStats = attendanceData?.reduce((acc, record) => {
        if (record.status === 'present') acc.present++
        else if (record.status === 'late') acc.late++
        else acc.absent++
        return acc
      }, { present: 0, absent: 0, late: 0 }) || { present: 0, absent: 0, late: 0 }

      // Get pending forms (with error handling for missing table)
      let pendingForms = 0
      try {
        const { count } = await supabase
          .from('form_assignments')
          .select('*', { count: 'exact', head: true })
          .eq('organization_id', profile.organization_id)
          .eq('status', 'pending')
        pendingForms = count || 0
      } catch (error) {
        console.log('Form assignments table not available:', error)
        pendingForms = 0
      }

      // Get active projects
      const { count: activeProjects } = await supabase
        .from('projects')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', profile.organization_id)
        .eq('status', 'active')

      // Get completed tasks
      const { count: completedTasks } = await supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'completed')

      // Get projects due this week
      const oneWeekFromNow = new Date()
      oneWeekFromNow.setDate(oneWeekFromNow.getDate() + 7)
      const { count: projectsDueThisWeek } = await supabase
        .from('projects')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', profile.organization_id)
        .in('status', ['active', 'planning'])
        .lte('end_date', oneWeekFromNow.toISOString().split('T')[0])

      // Get my tasks (assigned to current user)
      const { count: myTasks } = await supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .eq('assignee_id', user.id)
        .in('status', ['assigned', 'in_progress'])

      // Get check-ins for current user today
      const { count: checkedInToday } = await supabase
        .from('attendance')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('date', today)
        .eq('status', 'present')

      // Get check-ins for current user this week
      const startOfWeek = new Date()
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay())
      const startOfWeekStr = format(startOfWeek, 'yyyy-MM-dd')
      
      const { count: checkedInThisWeek } = await supabase
        .from('attendance')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('date', startOfWeekStr)
        .eq('status', 'present')

      // Get daily calls (outlet visits) for current user today
      let dailyCalls = 0
      try {
        const { count } = await supabase
          .from('outlet_visits')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .gte('check_in_time', `${today}T00:00:00`)
          .lt('check_in_time', `${today}T23:59:59`)
        dailyCalls = count || 0
      } catch (error) {
        console.log('Outlet visits table not available:', error)
        dailyCalls = 0
      }

      setStats({
        totalEmployees: totalEmployees || 0,
        activeProjects: activeProjects || 0,
        completedTasks: completedTasks || 0,
        pendingForms: pendingForms,
        projectsDueThisWeek: projectsDueThisWeek || 0,
        todayAttendance: attendanceStats,
        myTasks: myTasks || 0,
        checkedInToday: checkedInToday || 0,
        checkedInThisWeek: checkedInThisWeek || 0,
        dailyCalls: dailyCalls
      })

      // Get real recent activity
      await fetchRecentActivity(profile.organization_id)

    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 17) return 'Good afternoon'
    return 'Good evening'
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'attendance': return <Clock className="h-4 w-4 text-blue-500" />
      case 'form': return <ClipboardList className="h-4 w-4 text-green-500" />
      case 'task': return <CheckCircle className="h-4 w-4 text-purple-500" />
      case 'project': return <Activity className="h-4 w-4 text-orange-500" />
      default: return <Activity className="h-4 w-4" />
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-pulse text-muted-foreground">Loading dashboard...</div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            {getGreeting()}{userProfile?.full_name ? `, ${userProfile.full_name.split(' ')[0]}` : ''}
          </h1>
          <p className="text-gray-600 mt-2">
            Welcome to your workspace dashboard
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button asChild className="bg-blue-600 hover:bg-blue-700">
            <Link href="/dashboard/forms">
              <Plus className="h-4 w-4 mr-2" />
              Quick Actions
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* My Tasks - Clickable */}
        <Card 
          className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 bg-white/80 backdrop-blur-sm cursor-pointer group"
          onClick={() => router.push('/dashboard/tasks')}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">My Tasks</p>
                <p className="text-2xl font-bold text-blue-600">{stats?.myTasks || 0}</p>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                <CheckSquare className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Active assignments</span>
              <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-blue-600 transition-colors" />
            </div>
          </CardContent>
        </Card>

        {/* Checked In Today - Clickable */}
        <Card 
          className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 bg-white/80 backdrop-blur-sm cursor-pointer group"
          onClick={() => router.push('/dashboard/attendance')}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Checked In Today</p>
                <p className="text-2xl font-bold text-green-600">{stats?.checkedInToday || 0}</p>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center group-hover:bg-green-200 transition-colors">
                <UserCheck className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Your attendance</span>
              <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-green-600 transition-colors" />
            </div>
          </CardContent>
        </Card>

        {/* This Week Attendance - Clickable */}
        <Card 
          className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 bg-white/80 backdrop-blur-sm cursor-pointer group"
          onClick={() => router.push('/dashboard/attendance?period=week')}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">This Week</p>
                <p className="text-2xl font-bold text-purple-600">{stats?.checkedInThisWeek || 0}</p>
              </div>
              <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                <Calendar className="h-6 w-6 text-purple-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Days attended</span>
              <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-purple-600 transition-colors" />
            </div>
          </CardContent>
        </Card>

        {/* Daily Calls - Clickable */}
        <Card 
          className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 bg-white/80 backdrop-blur-sm cursor-pointer group"
          onClick={() => router.push('/dashboard/daily-calls')}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Daily Calls</p>
                <p className="text-2xl font-bold text-orange-600">{stats?.dailyCalls || 0}</p>
              </div>
              <div className="h-12 w-12 bg-orange-100 rounded-full flex items-center justify-center group-hover:bg-orange-200 transition-colors">
                <Phone className="h-6 w-6 text-orange-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Visits today</span>
              <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-orange-600 transition-colors" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Activity */}
        <div className="lg:col-span-2">
          <Card className="bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Recent Activity
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/dashboard/reports">
                    View all
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Link>
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentActivity.length === 0 ? (
                  <div className="text-center py-8">
                    <Activity className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No recent activity</p>
                  </div>
                ) : (
                  recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-center space-x-4 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                      {getActivityIcon(activity.type)}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">
                          {activity.user} {activity.action}
                        </p>
                        <p className="text-xs text-muted-foreground">{activity.time}</p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="space-y-6">
          <Card className="bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href="/dashboard/attendance">
                  <Calendar className="h-4 w-4 mr-2" />
                  Check Attendance
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href="/dashboard/forms">
                  <ClipboardList className="h-4 w-4 mr-2" />
                  Create Form
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href="/dashboard/maps">
                  <MapPin className="h-4 w-4 mr-2" />
                  Team Locations
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href="/dashboard/reports">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  View Reports
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Your Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">My Tasks</span>
                <Badge variant={stats?.myTasks ? "destructive" : "secondary"}>
                  {stats?.myTasks || 0}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Daily Calls</span>
                <Badge variant="outline">{stats?.dailyCalls || 0}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">This Week</span>
                <Badge variant="secondary">
                  {stats?.checkedInThisWeek || 0} days
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Checked In</span>
                <Badge variant={stats?.checkedInToday ? "default" : "secondary"}>
                  {stats?.checkedInToday ? 'Yes' : 'No'}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}