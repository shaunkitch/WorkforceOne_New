// ===================================
// app/dashboard/page.tsx - Modern Dashboard Overview
// ===================================
'use client'

import { useState, useEffect } from 'react'
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
  ClipboardList
} from 'lucide-react'
import { format } from 'date-fns'
import Link from 'next/link'

interface DashboardStats {
  totalEmployees: number
  activeProjects: number
  completedTasks: number
  pendingForms: number
  todayAttendance: {
    present: number
    absent: number
    late: number
  }
}

interface RecentActivity {
  id: string
  type: 'attendance' | 'task' | 'form' | 'project'
  user: string
  action: string
  time: string
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [userProfile, setUserProfile] = useState<any>(null)
  
  const supabase = createClient()

  useEffect(() => {
    fetchDashboardData()
  }, [])

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

      // Get pending forms
      const { count: pendingForms } = await supabase
        .from('form_assignments')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', profile.organization_id)
        .eq('status', 'pending')

      setStats({
        totalEmployees: totalEmployees || 0,
        activeProjects: 5, // Mock data
        completedTasks: 23, // Mock data
        pendingForms: pendingForms || 0,
        todayAttendance: attendanceStats
      })

      // Mock recent activity
      setRecentActivity([
        { id: '1', type: 'attendance', user: 'John Doe', action: 'checked in', time: '9:15 AM' },
        { id: '2', type: 'form', user: 'Sarah Smith', action: 'submitted Safety Form', time: '8:45 AM' },
        { id: '3', type: 'task', user: 'Mike Wilson', action: 'completed Project Review', time: '8:30 AM' },
        { id: '4', type: 'attendance', user: 'Emma Brown', action: 'checked out', time: 'Yesterday' },
      ])

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
        <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 bg-white/80 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Team Members</p>
                <p className="text-2xl font-bold">{stats?.totalEmployees || 0}</p>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
              <span className="text-green-600">+12%</span>
              <span className="text-muted-foreground ml-1">from last month</span>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 bg-white/80 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Present Today</p>
                <p className="text-2xl font-bold text-green-600">{stats?.todayAttendance.present || 0}</p>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-muted-foreground">
                {stats?.todayAttendance.late || 0} late, {stats?.todayAttendance.absent || 0} absent
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 bg-white/80 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Projects</p>
                <p className="text-2xl font-bold">{stats?.activeProjects || 0}</p>
              </div>
              <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center">
                <Activity className="h-6 w-6 text-purple-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-purple-600">3 due this week</span>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1 bg-white/80 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending Forms</p>
                <p className="text-2xl font-bold text-orange-600">{stats?.pendingForms || 0}</p>
              </div>
              <div className="h-12 w-12 bg-orange-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-orange-600" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-muted-foreground">Requires attention</span>
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
                {recentActivity.map((activity) => (
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
                ))}
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
              <CardTitle>Today's Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Check-ins</span>
                <Badge variant="secondary">{stats?.todayAttendance.present || 0}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Active Forms</span>
                <Badge variant="outline">{stats?.pendingForms || 0}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Projects Due</span>
                <Badge variant="destructive">3</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}