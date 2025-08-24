'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  ArrowLeft,
  Users,
  Clock,
  CheckCircle,
  BarChart3,
  Download,
  Filter,
  TrendingUp,
  Eye,
  Calendar
} from 'lucide-react'
import { format, parseISO } from 'date-fns'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts'

interface Form {
  id: string
  title: string
  description?: string
  status: string
  created_at: string
}

interface FormAnalytics {
  total_assigned: number
  total_started: number
  total_completed: number
  completion_rate: number
  average_completion_time_seconds: number
  calculated_at: string
}

interface FormResponse {
  id: string
  respondent_id: string
  responses: any
  status: string
  submitted_at?: string
  completion_time_seconds?: number
  profiles: {
    full_name: string
    email: string
    role: string
    department?: string
  }
}

interface Assignment {
  id: string
  assigned_to_user_id?: string
  assigned_to_team_id?: string
  assigned_to_role?: string
  assigned_to_department?: string
  is_mandatory: boolean
  due_date?: string
  assigned_at: string
  profiles?: { full_name: string; email: string }
  teams?: { name: string }
}

interface FieldAnalytics {
  field_id: string
  field_label: string
  field_type: string
  response_count: number
  completion_rate: number
  common_responses: Array<{ value: string; count: number }>
}

export default function FormAnalyticsPage() {
  const params = useParams()
  const router = useRouter()
  const formId = params.id as string
  
  const [form, setForm] = useState<Form | null>(null)
  const [analytics, setAnalytics] = useState<FormAnalytics | null>(null)
  const [responses, setResponses] = useState<FormResponse[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [fieldAnalytics, setFieldAnalytics] = useState<FieldAnalytics[]>([])
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('all')
  const [departmentFilter, setDepartmentFilter] = useState('all')

  const supabase = createClient()

  useEffect(() => {
    fetchFormData()
  }, [formId, timeRange, departmentFilter])

  const fetchFormData = async () => {
    try {
      await Promise.all([
        fetchForm(),
        fetchAnalytics(),
        fetchResponses(),
        fetchAssignments(),
        fetchFieldAnalytics()
      ])
    } catch (error) {
      console.error('Error fetching form data:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchForm = async () => {
    const { data, error } = await supabase
      .from('forms')
      .select('*')
      .eq('id', formId)
      .single()

    if (error) throw error
    setForm(data)
  }

  const fetchAnalytics = async () => {
    const { data, error } = await supabase
      .from('form_analytics')
      .select('*')
      .eq('form_id', formId)
      .single()

    if (error) {
      devLog('No analytics found, will calculate');
      return
    }
    setAnalytics(data)
  }

  const fetchResponses = async () => {
    let query = supabase
      .from('form_responses')
      .select(`
        id,
        respondent_id,
        responses,
        status,
        submitted_at,
        completion_time_seconds,
        profiles!form_responses_respondent_id_fkey(
          full_name,
          email,
          role,
          department
        )
      `)
      .eq('form_id', formId)
      .order('submitted_at', { ascending: false })

    // Apply time filter
    if (timeRange !== 'all') {
      const date = new Date()
      if (timeRange === '7d') {
        date.setDate(date.getDate() - 7)
      } else if (timeRange === '30d') {
        date.setDate(date.getDate() - 30)
      } else if (timeRange === '90d') {
        date.setDate(date.getDate() - 90)
      }
      query = query.gte('submitted_at', date.toISOString())
    }

    const { data, error } = await query

    if (error) throw error
    
    let filteredData = data || []
    
    // Apply department filter
    if (departmentFilter !== 'all') {
      filteredData = filteredData.filter(r => r.profiles?.department === departmentFilter)
    }
    
    setResponses(filteredData)
  }

  const fetchAssignments = async () => {
    const { data, error } = await supabase
      .from('form_assignments')
      .select(`
        *,
        profiles:assigned_to_user_id(full_name, email),
        teams:assigned_to_team_id(name)
      `)
      .eq('form_id', formId)
      .order('assigned_at', { ascending: false })

    if (error) throw error
    setAssignments(data || [])
  }

  const fetchFieldAnalytics = async () => {
    if (!form) return

    const analytics: FieldAnalytics[] = []
    
    for (const field of form.fields || []) {
      if (field.type === 'section' || field.type === 'html') continue

      const fieldResponses = responses
        .filter(r => r.responses[field.id] !== undefined && r.responses[field.id] !== '')
        .map(r => r.responses[field.id])

      const responseCount = fieldResponses.length
      const completionRate = responses.length > 0 ? (responseCount / responses.length) * 100 : 0

      // Calculate common responses
      const responseCounts: Record<string, number> = {}
      fieldResponses.forEach(response => {
        const value = Array.isArray(response) ? response.join(', ') : String(response)
        responseCounts[value] = (responseCounts[value] || 0) + 1
      })

      const commonResponses = Object.entries(responseCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([value, count]) => ({ value, count }))

      analytics.push({
        field_id: field.id,
        field_label: field.label,
        field_type: field.type,
        response_count: responseCount,
        completion_rate: Math.round(completionRate),
        common_responses: commonResponses
      })
    }

    setFieldAnalytics(analytics)
  }

  const getCompletionRateData = () => {
    const completed = responses.filter(r => r.status === 'submitted').length
    const started = responses.filter(r => r.status === 'draft').length
    const notStarted = Math.max(0, (analytics?.total_assigned || 0) - responses.length)

    return [
      { name: 'Completed', value: completed, color: '#10b981' },
      { name: 'Started', value: started, color: '#3b82f6' },
      { name: 'Not Started', value: notStarted, color: '#6b7280' }
    ]
  }

  const getCompletionTimeData = () => {
    const completedResponses = responses.filter(r => r.status === 'submitted' && r.completion_time_seconds)
    
    const timeRanges = [
      { range: '0-5 min', min: 0, max: 300 },
      { range: '5-15 min', min: 300, max: 900 },
      { range: '15-30 min', min: 900, max: 1800 },
      { range: '30+ min', min: 1800, max: Infinity }
    ]

    return timeRanges.map(({ range, min, max }) => ({
      range,
      count: completedResponses.filter(r => 
        r.completion_time_seconds! >= min && r.completion_time_seconds! < max
      ).length
    }))
  }

  const getResponsesByDate = () => {
    const dateMap: Record<string, number> = {}
    
    responses.forEach(response => {
      if (response.submitted_at) {
        const date = format(parseISO(response.submitted_at), 'MMM dd')
        dateMap[date] = (dateMap[date] || 0) + 1
      }
    })

    return Object.entries(dateMap)
      .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
      .map(([date, count]) => ({ date, responses: count }))
  }

  const getDepartments = () => {
    const departments = new Set<string>()
    responses.forEach(r => {
      if (r.profiles?.department) {
        departments.add(r.profiles.department)
      }
    })
    return Array.from(departments).sort()
  }

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return minutes > 0 ? `${minutes}m ${remainingSeconds}s` : `${remainingSeconds}s`
  }

  const exportData = () => {
    const csvData = responses.map(response => ({
      'Respondent Name': response.profiles?.full_name || 'Unknown',
      'Email': response.profiles?.email || 'Unknown',
      'Department': response.profiles?.department || 'Unknown',
      'Role': response.profiles?.role || 'Unknown',
      'Status': response.status,
      'Submitted At': response.submitted_at ? format(parseISO(response.submitted_at), 'yyyy-MM-dd HH:mm:ss') : 'Not submitted',
      'Completion Time': response.completion_time_seconds ? formatTime(response.completion_time_seconds) : 'N/A',
      ...Object.entries(response.responses).reduce((acc, [fieldId, value]) => {
        const field = form?.fields?.find(f => f.id === fieldId)
        const fieldLabel = field?.label || fieldId
        acc[fieldLabel] = Array.isArray(value) ? value.join(', ') : String(value)
        return acc
      }, {} as Record<string, string>)
    }))

    const csvContent = [
      Object.keys(csvData[0] || {}).join(','),
      ...csvData.map(row => Object.values(row).map(value => `"${value}"`).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${form?.title || 'form'}_responses.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading analytics...</div>
      </div>
    )
  }

  if (!form) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Form not found</h3>
        <p className="text-gray-500 mb-4">The requested form could not be found.</p>
        <Button onClick={() => router.push('/dashboard/forms')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Forms
        </Button>
      </div>
    )
  }

  const completionRateData = getCompletionRateData()
  const completionTimeData = getCompletionTimeData()
  const responsesByDate = getResponsesByDate()
  const departments = getDepartments()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button 
            variant="outline" 
            onClick={() => router.push('/dashboard/forms')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Form Analytics</h1>
            <p className="text-gray-600">{form.title}</p>
          </div>
        </div>
        <div className="flex space-x-3">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          
          {departments.length > 0 && (
            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger className="w-40">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {departments.map(dept => (
                  <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          
          <Button onClick={exportData} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Users className="h-8 w-8 text-blue-600 mx-auto mb-2" />
            <div className="text-2xl font-bold">{analytics?.total_assigned || assignments.length}</div>
            <div className="text-sm text-gray-600">Total Assigned</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <div className="text-2xl font-bold">{responses.filter(r => r.status === 'submitted').length}</div>
            <div className="text-sm text-gray-600">Completed</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <TrendingUp className="h-8 w-8 text-purple-600 mx-auto mb-2" />
            <div className="text-2xl font-bold">
              {analytics?.completion_rate || Math.round((responses.filter(r => r.status === 'submitted').length / (analytics?.total_assigned || 1)) * 100)}%
            </div>
            <div className="text-sm text-gray-600">Completion Rate</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Clock className="h-8 w-8 text-orange-600 mx-auto mb-2" />
            <div className="text-2xl font-bold">
              {analytics?.average_completion_time_seconds 
                ? formatTime(analytics.average_completion_time_seconds)
                : 'N/A'
              }
            </div>
            <div className="text-sm text-gray-600">Avg. Time</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Completion Status */}
        <Card>
          <CardHeader>
            <CardTitle>Completion Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={completionRateData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {completionRateData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center space-x-4 mt-4">
              {completionRateData.map((entry, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="text-sm">{entry.name}: {entry.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Completion Time Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Completion Time Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={completionTimeData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="range" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Responses Over Time */}
        {responsesByDate.length > 0 && (
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Responses Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={responsesByDate}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="responses" stroke="#10b981" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Field Analytics */}
      {fieldAnalytics.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Field Analytics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {fieldAnalytics.map(field => (
                <div key={field.field_id} className="border-b pb-4 last:border-b-0">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">{field.field_label}</h4>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline">{field.field_type}</Badge>
                      <span className="text-sm text-gray-500">
                        {field.completion_rate}% completion rate
                      </span>
                    </div>
                  </div>
                  
                  {field.common_responses.length > 0 && (
                    <div>
                      <h5 className="text-sm font-medium text-gray-700 mb-2">Most Common Responses:</h5>
                      <div className="space-y-1">
                        {field.common_responses.map((response, index) => (
                          <div key={index} className="flex items-center justify-between text-sm">
                            <span className="truncate max-w-xs">{response.value}</span>
                            <span className="text-gray-500">{response.count} responses</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Responses */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Responses ({responses.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {responses.length === 0 ? (
            <div className="text-center py-8">
              <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No responses yet</h3>
              <p className="text-gray-500">Responses will appear here once users start filling the form.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {responses.slice(0, 10).map(response => (
                <div key={response.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="flex-1">
                      <div className="font-medium">{response.profiles?.full_name || 'Unknown'}</div>
                      <div className="text-sm text-gray-500">
                        {response.profiles?.email} • {response.profiles?.role}
                        {response.profiles?.department && ` • ${response.profiles.department}`}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <Badge 
                      className={response.status === 'submitted' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}
                    >
                      {response.status === 'submitted' ? 'Completed' : 'Draft'}
                    </Badge>
                    {response.submitted_at && (
                      <span className="text-sm text-gray-500">
                        {format(parseISO(response.submitted_at), 'MMM d, yyyy')}
                      </span>
                    )}
                    {response.completion_time_seconds && (
                      <span className="text-sm text-gray-500">
                        {formatTime(response.completion_time_seconds)}
                      </span>
                    )}
                    <Button size="sm" variant="outline">
                      <Eye className="h-3 w-3 mr-1" />
                      View
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}