'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
// Using native HTML table elements instead of Table components
import { 
  FileText, 
  Search,
  Filter,
  Eye,
  Download,
  Calendar,
  User,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle
} from 'lucide-react'
import { format, parseISO } from 'date-fns'

interface FormResponse {
  id: string
  form_id: string
  user_id: string
  outlet_id?: string
  responses: any
  status: 'draft' | 'completed' | 'pending'
  submitted_at: string
  created_at: string
  updated_at: string
  form: {
    id: string
    title: string
    description?: string
  }
  user: {
    id: string
    full_name: string
    email: string
  }
  outlet?: {
    id: string
    name: string
    address: string
  }
}

interface FilterState {
  form_id: string
  status: string
  user_id: string
  date_range: string
  search: string
}

export default function SubmissionsPage() {
  const [submissions, setSubmissions] = useState<FormResponse[]>([])
  const [forms, setForms] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [filters, setFilters] = useState<FilterState>({
    form_id: 'all',
    status: 'all',
    user_id: 'all',
    date_range: 'all',
    search: ''
  })

  const supabase = createClient()

  useEffect(() => {
    fetchUserProfile()
    fetchForms()
    fetchUsers()
    fetchSubmissions()
  }, [filters])

  const fetchUserProfile = async () => {
    try {
      const { data: user } = await supabase.auth.getUser()
      if (!user.user) return

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.user.id)
        .single()

      setUserProfile(profile)
    } catch (error) {
      console.error('Error fetching user profile:', error)
    }
  }

  const fetchForms = async () => {
    try {
      const { data: user } = await supabase.auth.getUser()
      if (!user.user) return

      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.user.id)
        .single()

      if (!profile?.organization_id) return

      const { data, error } = await supabase
        .from('forms')
        .select('id, title, description, status')
        .eq('organization_id', profile.organization_id)
        .order('title')

      if (error) throw error
      setForms(data || [])
    } catch (error) {
      console.error('Error fetching forms:', error)
    }
  }

  const fetchUsers = async () => {
    try {
      const { data: user } = await supabase.auth.getUser()
      if (!user.user) return

      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id, role')
        .eq('id', user.user.id)
        .single()

      if (!profile?.organization_id) return

      // Only managers and admins can see all users
      if (profile.role === 'admin' || profile.role === 'manager') {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, full_name, email, role')
          .eq('organization_id', profile.organization_id)
          .order('full_name')

        if (error) throw error
        setUsers(data || [])
      }
    } catch (error) {
      console.error('Error fetching users:', error)
    }
  }

  const fetchSubmissions = async () => {
    try {
      const { data: user } = await supabase.auth.getUser()
      if (!user.user) return

      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id, role')
        .eq('id', user.user.id)
        .single()

      if (!profile?.organization_id) return

      let query = supabase
        .from('form_responses')
        .select(`
          *,
          form:forms(id, title, description),
          user:profiles!form_responses_user_id_fkey(id, full_name, email),
          outlet:outlets(id, name, address)
        `)
        .eq('organization_id', profile.organization_id)
        .order('submitted_at', { ascending: false, nullsFirst: false })

      // Apply filters
      if (filters.form_id !== 'all') {
        query = query.eq('form_id', filters.form_id)
      }

      if (filters.status !== 'all') {
        query = query.eq('status', filters.status)
      }

      if (filters.user_id !== 'all') {
        query = query.eq('user_id', filters.user_id)
      }

      // Date range filter
      if (filters.date_range !== 'all') {
        const now = new Date()
        let startDate: Date

        switch (filters.date_range) {
          case 'today':
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
            break
          case 'week':
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
            break
          case 'month':
            startDate = new Date(now.getFullYear(), now.getMonth(), 1)
            break
          default:
            startDate = new Date(0)
        }

        query = query.gte('submitted_at', startDate.toISOString())
      }

      // For regular users, only show their own submissions
      if (profile.role === 'member') {
        query = query.eq('user_id', user.user.id)
      }

      const { data, error } = await query.limit(1000)

      if (error) throw error

      let processedData = data || []

      // Apply search filter client-side for better UX
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase()
        processedData = processedData.filter(submission => 
          submission.form?.title.toLowerCase().includes(searchTerm) ||
          submission.user?.full_name.toLowerCase().includes(searchTerm) ||
          submission.user?.email.toLowerCase().includes(searchTerm) ||
          submission.outlet?.name.toLowerCase().includes(searchTerm)
        )
      }

      setSubmissions(processedData)
    } catch (error) {
      console.error('Error fetching submissions:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'draft':
        return <AlertCircle className="h-4 w-4 text-yellow-600" />
      case 'pending':
        return <Clock className="h-4 w-4 text-blue-600" />
      default:
        return <XCircle className="h-4 w-4 text-red-600" />
    }
  }

  const getStatusBadge = (status: string) => {
    const colors = {
      completed: 'bg-green-100 text-green-800',
      draft: 'bg-yellow-100 text-yellow-800',
      pending: 'bg-blue-100 text-blue-800'
    }

    return (
      <Badge className={colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'}>
        {status.toUpperCase()}
      </Badge>
    )
  }

  const exportToCSV = () => {
    const headers = ['Form Title', 'Submitted By', 'Outlet', 'Status', 'Submitted At', 'Response Data']
    const csvContent = [
      headers.join(','),
      ...submissions.map(submission => [
        `"${submission.form?.title || 'Unknown Form'}"`,
        `"${submission.user?.full_name || 'Unknown User'}"`,
        `"${submission.outlet?.name || 'N/A'}"`,
        submission.status,
        submission.submitted_at ? format(parseISO(submission.submitted_at), 'yyyy-MM-dd HH:mm:ss') : 'Not submitted',
        `"${JSON.stringify(submission.responses).replace(/"/g, '""')}"`
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `form-submissions-${format(new Date(), 'yyyy-MM-dd')}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const viewSubmission = (submission: FormResponse) => {
    // Create a modal or navigate to detail view
    alert(`Viewing submission: ${submission.id}\n\nForm: ${submission.form?.title}\nUser: ${submission.user?.full_name}\nStatus: ${submission.status}\n\nResponse Data:\n${JSON.stringify(submission.responses, null, 2)}`)
  }

  const getStats = () => {
    return {
      total: submissions.length,
      completed: submissions.filter(s => s.status === 'completed').length,
      draft: submissions.filter(s => s.status === 'draft').length,
      pending: submissions.filter(s => s.status === 'pending').length
    }
  }

  const stats = getStats()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Form Submissions</h1>
          <p className="text-gray-600">View and manage form responses from your team.</p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline" onClick={exportToCSV} disabled={submissions.length === 0}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <FileText className="h-8 w-8 text-blue-600 mx-auto mb-2" />
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-sm text-gray-600">Total Submissions</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <div className="text-2xl font-bold">{stats.completed}</div>
            <div className="text-sm text-gray-600">Completed</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Clock className="h-8 w-8 text-blue-600 mx-auto mb-2" />
            <div className="text-2xl font-bold">{stats.pending}</div>
            <div className="text-sm text-gray-600">Pending</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <AlertCircle className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
            <div className="text-2xl font-bold">{stats.draft}</div>
            <div className="text-sm text-gray-600">Draft</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search submissions..."
                value={filters.search}
                onChange={(e) => setFilters({...filters, search: e.target.value})}
                className="pl-10"
              />
            </div>
            
            <Select value={filters.form_id} onValueChange={(value) => setFilters({...filters, form_id: value})}>
              <SelectTrigger>
                <SelectValue placeholder="All Forms" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Forms</SelectItem>
                {forms.map(form => (
                  <SelectItem key={form.id} value={form.id}>
                    {form.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filters.status} onValueChange={(value) => setFilters({...filters, status: value})}>
              <SelectTrigger>
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
              </SelectContent>
            </Select>

            {users.length > 0 && (
              <Select value={filters.user_id} onValueChange={(value) => setFilters({...filters, user_id: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="All Users" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  {users.map(user => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.full_name || user.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            <Select value={filters.date_range} onValueChange={(value) => setFilters({...filters, date_range: value})}>
              <SelectTrigger>
                <SelectValue placeholder="All Time" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">Last 7 Days</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Submissions Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center">
              <div className="text-gray-500">Loading submissions...</div>
            </div>
          ) : submissions.length === 0 ? (
            <div className="p-8 text-center">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No submissions found</h3>
              <p className="text-gray-500">No form submissions match your current filters.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left p-3 font-medium">Form</th>
                    <th className="text-left p-3 font-medium">Submitted By</th>
                    <th className="text-left p-3 font-medium">Outlet</th>
                    <th className="text-left p-3 font-medium">Status</th>
                    <th className="text-left p-3 font-medium">Submitted</th>
                    <th className="text-left p-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {submissions.map((submission) => (
                    <tr key={submission.id} className="border-b hover:bg-gray-50">
                      <td className="p-3">
                        <div>
                          <div className="font-medium">{submission.form?.title || 'Unknown Form'}</div>
                          {submission.form?.description && (
                            <div className="text-sm text-gray-500 truncate max-w-xs">
                              {submission.form.description}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center">
                          <User className="h-4 w-4 text-gray-400 mr-2" />
                          <div>
                            <div className="font-medium">{submission.user?.full_name || 'Unknown User'}</div>
                            <div className="text-sm text-gray-500">{submission.user?.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-3">
                        {submission.outlet ? (
                          <div>
                            <div className="font-medium">{submission.outlet.name}</div>
                            <div className="text-sm text-gray-500 truncate max-w-xs">{submission.outlet.address}</div>
                          </div>
                        ) : (
                          <span className="text-gray-400">N/A</span>
                        )}
                      </td>
                      <td className="p-3">
                        <div className="flex items-center">
                          {getStatusIcon(submission.status)}
                          <span className="ml-2">{getStatusBadge(submission.status)}</span>
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center text-sm">
                          <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                          {submission.submitted_at ? (
                            <div>
                              <div>{format(parseISO(submission.submitted_at), 'MMM d, yyyy')}</div>
                              <div className="text-gray-500">{format(parseISO(submission.submitted_at), 'HH:mm')}</div>
                            </div>
                          ) : (
                            <span className="text-gray-400">Not submitted</span>
                          )}
                        </div>
                      </td>
                      <td className="p-3">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => viewSubmission(submission)}
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          View
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}