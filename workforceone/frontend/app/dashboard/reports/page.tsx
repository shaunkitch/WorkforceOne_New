'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart
} from 'recharts'
import { 
  BarChart3, 
  TrendingUp, 
  Clock, 
  Users, 
  Calendar,
  Download,
  Filter,
  RefreshCw,
  Plus,
  Settings
} from 'lucide-react'
import { format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from 'date-fns'

interface TimeData {
  date: string
  hours: number
  billableHours: number
}

interface ProjectData {
  name: string
  hours: number
  percentage: number
  color: string
}

interface TeamMember {
  name: string
  totalHours: number
  productivity: number
  attendance: number
}

export default function ReportsPage() {
  const [timeData, setTimeData] = useState<TimeData[]>([])
  const [projectData, setProjectData] = useState<ProjectData[]>([])
  const [teamData, setTeamData] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState('7d')
  const [reportType, setReportType] = useState('time')

  const supabase = createClient()

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#F97316']

  useEffect(() => {
    fetchReportData()
  }, [dateRange])

  const fetchReportData = async () => {
    setLoading(true)
    try {
      await Promise.all([
        fetchTimeData(),
        fetchProjectData(),
        fetchTeamData()
      ])
    } catch (error) {
      console.error('Error fetching report data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getDateRange = () => {
    const now = new Date()
    switch (dateRange) {
      case '7d':
        return { start: subDays(now, 7), end: now }
      case '1m':
        return { start: startOfMonth(now), end: endOfMonth(now) }
      case '3m':
        return { start: subDays(now, 90), end: now }
      default:
        return { start: subDays(now, 7), end: now }
    }
  }

  const fetchTimeData = async () => {
    try {
      const { data: user } = await supabase.auth.getUser()
      if (!user.user) return

      // Get user profile for organization filtering
      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.user.id)
        .single()

      if (!profile?.organization_id) return

      const { start, end } = getDateRange()

      // Fetch real time entries from database
      const { data: timeEntries } = await supabase
        .from('time_entries')
        .select('duration, is_billable, start_time')
        .gte('start_time', start.toISOString())
        .lte('start_time', end.toISOString())
        .eq('status', 'completed')

      // Group by date and calculate totals
      const dateMap: { [key: string]: { hours: number; billableHours: number } } = {}
      
      // Initialize all dates in range
      for (let i = 6; i >= 0; i--) {
        const date = subDays(new Date(), i)
        const dateKey = format(date, 'yyyy-MM-dd')
        dateMap[dateKey] = { hours: 0, billableHours: 0 }
      }

      // Aggregate time entries by date
      timeEntries?.forEach(entry => {
        if (entry.duration && entry.start_time) {
          const dateKey = format(new Date(entry.start_time), 'yyyy-MM-dd')
          const hours = entry.duration / 60 // Convert minutes to hours
          
          if (dateMap[dateKey]) {
            dateMap[dateKey].hours += hours
            if (entry.is_billable) {
              dateMap[dateKey].billableHours += hours
            }
          }
        }
      })

      // Convert to array format for charts
      const timeData: TimeData[] = Object.entries(dateMap).map(([dateKey, data]) => ({
        date: format(new Date(dateKey), 'MMM dd'),
        hours: Math.round(data.hours * 10) / 10, // Round to 1 decimal
        billableHours: Math.round(data.billableHours * 10) / 10
      }))

      setTimeData(timeData)
    } catch (error) {
      console.error('Error fetching time data:', error)
      setTimeData([])
    }
  }

  const fetchProjectData = async () => {
    try {
      const { data: user } = await supabase.auth.getUser()
      if (!user.user) return

      // Get user profile for organization filtering
      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.user.id)
        .single()

      if (!profile?.organization_id) return

      const { start, end } = getDateRange()

      // Fetch time entries with project information
      const { data: timeEntries } = await supabase
        .from('time_entries')
        .select(`
          duration,
          project:projects (
            id,
            name
          )
        `)
        .gte('start_time', start.toISOString())
        .lte('start_time', end.toISOString())
        .eq('status', 'completed')
        .not('project_id', 'is', null)

      // Aggregate hours by project
      const projectHours: { [key: string]: { name: string; hours: number } } = {}
      let totalHours = 0

      timeEntries?.forEach(entry => {
        if (entry.duration && entry.project) {
          const hours = entry.duration / 60 // Convert minutes to hours
          totalHours += hours
          
          if (projectHours[entry.project.id]) {
            projectHours[entry.project.id].hours += hours
          } else {
            projectHours[entry.project.id] = {
              name: entry.project.name,
              hours: hours
            }
          }
        }
      })

      // Convert to array and calculate percentages
      const projectData: ProjectData[] = Object.values(projectHours)
        .map((project, index) => ({
          name: project.name,
          hours: Math.round(project.hours * 10) / 10,
          percentage: totalHours > 0 ? Math.round((project.hours / totalHours) * 100) : 0,
          color: COLORS[index % COLORS.length]
        }))
        .sort((a, b) => b.hours - a.hours) // Sort by hours descending
        .slice(0, 6) // Limit to top 6 projects

      setProjectData(projectData)
    } catch (error) {
      console.error('Error fetching project data:', error)
      setProjectData([])
    }
  }

  const fetchTeamData = async () => {
    try {
      const { data: user } = await supabase.auth.getUser()
      if (!user.user) return

      // Get user profile for organization filtering
      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.user.id)
        .single()

      if (!profile?.organization_id) return

      const { start, end } = getDateRange()

      // Fetch team members from the same organization
      const { data: teamMembers } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('organization_id', profile.organization_id)
        .not('full_name', 'is', null)

      if (!teamMembers || teamMembers.length === 0) {
        setTeamData([])
        return
      }

      // Fetch time entries for team members
      const { data: timeEntries } = await supabase
        .from('time_entries')
        .select('user_id, duration, is_billable')
        .in('user_id', teamMembers.map(m => m.id))
        .gte('start_time', start.toISOString())
        .lte('start_time', end.toISOString())
        .eq('status', 'completed')

      // Fetch attendance data for team members  
      const { data: attendanceData } = await supabase
        .from('attendance')
        .select('user_id, status')
        .in('user_id', teamMembers.map(m => m.id))
        .gte('date', format(start, 'yyyy-MM-dd'))
        .lte('date', format(end, 'yyyy-MM-dd'))

      // Calculate metrics for each team member
      const teamData: TeamMember[] = teamMembers.map(member => {
        // Calculate total hours and billable hours
        const memberTimeEntries = timeEntries?.filter(entry => entry.user_id === member.id) || []
        const totalMinutes = memberTimeEntries.reduce((sum, entry) => sum + (entry.duration || 0), 0)
        const billableMinutes = memberTimeEntries
          .filter(entry => entry.is_billable)
          .reduce((sum, entry) => sum + (entry.duration || 0), 0)
        
        const totalHours = Math.round((totalMinutes / 60) * 10) / 10
        const productivity = totalMinutes > 0 ? Math.round((billableMinutes / totalMinutes) * 100) : 0

        // Calculate attendance percentage
        const memberAttendance = attendanceData?.filter(att => att.user_id === member.id) || []
        const workingDays = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)))
        const presentDays = memberAttendance.filter(att => att.status === 'present' || att.status === 'late').length
        const attendance = Math.round((presentDays / workingDays) * 100)

        return {
          name: member.full_name,
          totalHours,
          productivity,
          attendance: Math.min(100, attendance) // Cap at 100%
        }
      }).filter(member => member.totalHours > 0) // Only show members with logged time
        .sort((a, b) => b.totalHours - a.totalHours) // Sort by total hours descending

      setTeamData(teamData)
    } catch (error) {
      console.error('Error fetching team data:', error)
      setTeamData([])
    }
  }

  const exportReport = () => {
    // Mock export functionality
    const data = {
      timeData,
      projectData,
      teamData,
      dateRange,
      generatedAt: new Date().toISOString()
    }
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `workforce-report-${format(new Date(), 'yyyy-MM-dd')}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const totalHours = timeData.reduce((sum, day) => sum + day.hours, 0)
  const totalBillableHours = timeData.reduce((sum, day) => sum + day.billableHours, 0)
  const productivity = totalHours > 0 ? Math.round((totalBillableHours / totalHours) * 100) : 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-600">Track performance and productivity insights.</p>
        </div>
        <div className="flex items-center space-x-4">
          <Button 
            onClick={() => window.location.href = '/dashboard/reports/builder'}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Custom Report
          </Button>
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="1m">This month</SelectItem>
              <SelectItem value="3m">Last 3 months</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={fetchReportData} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={exportReport} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Hours</CardTitle>
            <Clock className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalHours}h</div>
            <p className="text-xs text-gray-500 mt-1">
              {dateRange === '7d' ? 'This week' : dateRange === '1m' ? 'This month' : 'Last 3 months'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Billable Hours</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalBillableHours}h</div>
            <p className="text-xs text-gray-500 mt-1">{productivity}% productivity</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Active Projects</CardTitle>
            <BarChart3 className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{projectData.length}</div>
            <p className="text-xs text-gray-500 mt-1">Currently tracking</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Team Members</CardTitle>
            <Users className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teamData.length}</div>
            <p className="text-xs text-gray-500 mt-1">Active this period</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Time Tracking Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="h-5 w-5 mr-2" />
              Daily Time Tracking
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              {timeData.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <Clock className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No time data available</p>
                    <p className="text-sm text-gray-400">Time entries will appear here once logged</p>
                  </div>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={timeData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="hours" stackId="1" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.8} />
                    <Area type="monotone" dataKey="billableHours" stackId="2" stroke="#10B981" fill="#10B981" fillOpacity={0.8} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Project Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="h-5 w-5 mr-2" />
              Project Time Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              {projectData.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <BarChart3 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No project data available</p>
                    <p className="text-sm text-gray-400">Project time distribution will appear here</p>
                  </div>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={projectData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percentage }) => `${name}: ${percentage}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="hours"
                    >
                      {projectData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Team Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="h-5 w-5 mr-2" />
            Team Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {teamData.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No team performance data available</p>
                <p className="text-sm text-gray-400">Team metrics will appear here once time is logged</p>
              </div>
            ) : (
              teamData.map((member, index) => (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <h3 className="font-medium">{member.name}</h3>
                    <div className="grid grid-cols-3 gap-4 mt-2 text-sm text-gray-600">
                      <div>
                        <span className="block text-xs text-gray-500">Hours</span>
                        <span className="font-medium">{member.totalHours}h</span>
                      </div>
                      <div>
                        <span className="block text-xs text-gray-500">Productivity</span>
                        <div className="flex items-center">
                          <div className="flex-1 bg-gray-200 rounded-full h-2 mr-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full" 
                              style={{ width: `${member.productivity}%` }}
                            />
                          </div>
                          <span className="text-xs font-medium">{member.productivity}%</span>
                        </div>
                      </div>
                      <div>
                        <span className="block text-xs text-gray-500">Attendance</span>
                        <div className="flex items-center">
                          <div className="flex-1 bg-gray-200 rounded-full h-2 mr-2">
                            <div 
                              className="bg-green-600 h-2 rounded-full" 
                              style={{ width: `${member.attendance}%` }}
                            />
                          </div>
                          <span className="text-xs font-medium">{member.attendance}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Detailed Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Project Hours Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {projectData.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-gray-500 text-sm">No project hours to display</p>
                </div>
              ) : (
                projectData.map((project, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div 
                        className="w-3 h-3 rounded-full mr-3"
                        style={{ backgroundColor: project.color }}
                      />
                      <span className="text-sm font-medium">{project.name}</span>
                    </div>
                    <div className="text-sm text-gray-600">
                      {project.hours}h ({project.percentage}%)
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Productivity Insights</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Average daily hours</span>
                <span className="font-medium">{(totalHours / 7).toFixed(1)}h</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Billability rate</span>
                <span className="font-medium">{productivity}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Most productive day</span>
                <span className="font-medium">
                  {timeData.reduce((max, day) => day.hours > max.hours ? day : max, timeData[0])?.date || 'N/A'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Team average productivity</span>
                <span className="font-medium">
                  {teamData.length > 0 ? Math.round(teamData.reduce((sum, member) => sum + member.productivity, 0) / teamData.length) : 0}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}