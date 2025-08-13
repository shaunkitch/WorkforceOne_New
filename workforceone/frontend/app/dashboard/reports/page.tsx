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

      const { start, end } = getDateRange()

      // Generate mock data for demonstration
      const mockTimeData: TimeData[] = []
      for (let i = 6; i >= 0; i--) {
        const date = subDays(new Date(), i)
        mockTimeData.push({
          date: format(date, 'MMM dd'),
          hours: Math.floor(Math.random() * 8) + 2,
          billableHours: Math.floor(Math.random() * 6) + 1
        })
      }
      setTimeData(mockTimeData)
    } catch (error) {
      console.error('Error fetching time data:', error)
    }
  }

  const fetchProjectData = async () => {
    try {
      // Mock project data
      const mockProjects = [
        { name: 'Website Redesign', hours: 45, percentage: 35, color: COLORS[0] },
        { name: 'Mobile App', hours: 32, percentage: 25, color: COLORS[1] },
        { name: 'Dashboard Updates', hours: 28, percentage: 22, color: COLORS[2] },
        { name: 'Bug Fixes', hours: 15, percentage: 12, color: COLORS[3] },
        { name: 'Documentation', hours: 8, percentage: 6, color: COLORS[4] }
      ]
      setProjectData(mockProjects)
    } catch (error) {
      console.error('Error fetching project data:', error)
    }
  }

  const fetchTeamData = async () => {
    try {
      // Mock team data
      const mockTeam = [
        { name: 'John Doe', totalHours: 38, productivity: 92, attendance: 95 },
        { name: 'Jane Smith', totalHours: 42, productivity: 88, attendance: 100 },
        { name: 'Mike Johnson', totalHours: 35, productivity: 85, attendance: 90 },
        { name: 'Sarah Wilson', totalHours: 40, productivity: 94, attendance: 98 }
      ]
      setTeamData(mockTeam)
    } catch (error) {
      console.error('Error fetching team data:', error)
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
            {teamData.map((member, index) => (
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
            ))}
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
              {projectData.map((project, index) => (
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
              ))}
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