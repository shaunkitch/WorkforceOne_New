'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
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
import { 
  FileText,
  Clock,
  CheckCircle,
  AlertTriangle,
  Calendar,
  Play,
  Eye,
  Search,
  Filter,
  RefreshCw
} from 'lucide-react'
import { format, parseISO, isAfter, isBefore, addDays } from 'date-fns'

interface AssignedForm {
  id: string
  form_id: string
  is_mandatory: boolean
  due_date?: string
  assigned_at: string
  forms: {
    id: string
    title: string
    description?: string
    status: string
  }
  form_responses?: {
    id: string
    status: 'draft' | 'submitted'
    started_at: string
    submitted_at?: string
    completion_time_seconds?: number
  }[]
}

export default function MyFormsPage() {
  const [assignedForms, setAssignedForms] = useState<AssignedForm[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [dueDateFilter, setDueDateFilter] = useState('all')
  const router = useRouter()

  const supabase = createClient()

  useEffect(() => {
    fetchAssignedForms()
  }, [])

  const fetchAssignedForms = async () => {
    try {
      const { data: user } = await supabase.auth.getUser()
      if (!user.user) return

      // Get user's teams and profile info
      const [{ data: profile }, { data: teamMemberships }] = await Promise.all([
        supabase
          .from('profiles')
          .select('role, department, organization_id')
          .eq('id', user.user.id)
          .single(),
        supabase
          .from('team_members')
          .select('team_id')
          .eq('user_id', user.user.id)
      ])

      if (!profile) return

      const teamIds = teamMemberships?.map(tm => tm.team_id) || []

      // Build the assignment query to find all forms assigned to this user
      let assignmentQuery = supabase
        .from('form_assignments')
        .select(`
          id,
          form_id,
          is_mandatory,
          due_date,
          assigned_at,
          forms!inner(
            id,
            title,
            description,
            status
          )
        `)
        .eq('organization_id', profile.organization_id)

      // Add OR conditions for different assignment types
      const orConditions = [
        `assigned_to_user_id.eq.${user.user.id}`,
        `assigned_to_role.eq.${profile.role}`
      ]

      if (profile.department) {
        orConditions.push(`assigned_to_department.eq.${profile.department}`)
      }

      if (teamIds.length > 0) {
        orConditions.push(`assigned_to_team_id.in.(${teamIds.join(',')})`)
      }

      const { data: assignments, error: assignmentError } = await assignmentQuery
        .or(orConditions.join(','))
        .order('assigned_at', { ascending: false })

      if (assignmentError) throw assignmentError

      // Get responses for these forms
      const formIds = assignments?.map(a => a.form_id) || []
      
      if (formIds.length > 0) {
        const { data: responses, error: responseError } = await supabase
          .from('form_responses')
          .select('form_id, status, started_at, submitted_at, completion_time_seconds')
          .eq('respondent_id', user.user.id)
          .in('form_id', formIds)

        if (responseError) throw responseError

        // Combine assignments with responses
        const assignedFormsWithResponses = assignments?.map(assignment => ({
          ...assignment,
          form_responses: responses?.filter(r => r.form_id === assignment.form_id) || []
        })) || []

        setAssignedForms(assignedFormsWithResponses)
      } else {
        setAssignedForms([])
      }
    } catch (error) {
      console.error('Error fetching assigned forms:', error)
    } finally {
      setLoading(false)
    }
  }

  const getFormStatus = (form: AssignedForm) => {
    const response = form.form_responses?.[0]
    
    if (response?.status === 'submitted') {
      return { status: 'completed', label: 'Completed', color: 'bg-green-100 text-green-800', icon: CheckCircle }
    }
    
    if (response?.status === 'draft') {
      return { status: 'in_progress', label: 'In Progress', color: 'bg-blue-100 text-blue-800', icon: Clock }
    }
    
    if (form.due_date && isAfter(new Date(), new Date(form.due_date))) {
      return { status: 'overdue', label: 'Overdue', color: 'bg-red-100 text-red-800', icon: AlertTriangle }
    }
    
    if (form.due_date && isBefore(new Date(), addDays(new Date(form.due_date), -3))) {
      return { status: 'due_soon', label: 'Due Soon', color: 'bg-yellow-100 text-yellow-800', icon: Clock }
    }
    
    return { status: 'pending', label: 'Not Started', color: 'bg-gray-100 text-gray-800', icon: FileText }
  }

  const getCompletionTime = (seconds?: number) => {
    if (!seconds) return null
    
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    
    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`
    }
    return `${remainingSeconds}s`
  }

  const filteredForms = assignedForms.filter(form => {
    const matchesSearch = form.forms.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (form.forms.description?.toLowerCase().includes(searchTerm.toLowerCase()))
    
    if (!matchesSearch) return false
    
    const formStatus = getFormStatus(form)
    
    if (statusFilter !== 'all' && formStatus.status !== statusFilter) return false
    
    if (dueDateFilter !== 'all') {
      if (dueDateFilter === 'overdue' && formStatus.status !== 'overdue') return false
      if (dueDateFilter === 'due_soon' && formStatus.status !== 'due_soon') return false
      if (dueDateFilter === 'no_due_date' && form.due_date) return false
    }
    
    return true
  })

  const getFormCounts = () => {
    return {
      total: assignedForms.length,
      completed: assignedForms.filter(f => getFormStatus(f).status === 'completed').length,
      pending: assignedForms.filter(f => getFormStatus(f).status === 'pending').length,
      overdue: assignedForms.filter(f => getFormStatus(f).status === 'overdue').length,
      in_progress: assignedForms.filter(f => getFormStatus(f).status === 'in_progress').length,
    }
  }

  const formCounts = getFormCounts()

  return (
    <div className="space-y-6 bg-gradient-to-br from-gray-50 to-blue-50 min-h-screen p-6">
      <div className="bg-white/95 backdrop-blur-sm border-b border-gray-200 px-6 py-6 shadow-sm rounded-lg mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              My Forms
            </h1>
            <p className="text-gray-600 mt-2 flex items-center">
              <FileText className="h-4 w-4 mr-2" />
              Forms assigned to you and your teams
            </p>
          </div>
          <Button 
            onClick={fetchAssignedForms} 
            variant="outline"
            className="hover:shadow-md transition-all border-blue-200 hover:bg-blue-50"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="bg-white/80 backdrop-blur-sm shadow-lg border-0 ring-1 ring-gray-200 hover:shadow-xl transition-all">
          <CardContent className="p-6 text-center">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-full p-3 w-16 h-16 mx-auto mb-4 shadow-lg">
              <FileText className="h-10 w-10 text-white" />
            </div>
            <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
              {formCounts.total}
            </div>
            <div className="text-sm text-gray-600 font-medium">Total Assigned</div>
          </CardContent>
        </Card>
        <Card className="bg-white/80 backdrop-blur-sm shadow-lg border-0 ring-1 ring-gray-200 hover:shadow-xl transition-all">
          <CardContent className="p-6 text-center">
            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-full p-3 w-16 h-16 mx-auto mb-4 shadow-lg">
              <CheckCircle className="h-10 w-10 text-white" />
            </div>
            <div className="text-3xl font-bold bg-gradient-to-r from-green-600 to-green-700 bg-clip-text text-transparent">
              {formCounts.completed}
            </div>
            <div className="text-sm text-gray-600 font-medium">Completed</div>
          </CardContent>
        </Card>
        <Card className="bg-white/80 backdrop-blur-sm shadow-lg border-0 ring-1 ring-gray-200 hover:shadow-xl transition-all">
          <CardContent className="p-6 text-center">
            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full p-3 w-16 h-16 mx-auto mb-4 shadow-lg">
              <Clock className="h-10 w-10 text-white" />
            </div>
            <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-700 bg-clip-text text-transparent">
              {formCounts.in_progress}
            </div>
            <div className="text-sm text-gray-600 font-medium">In Progress</div>
          </CardContent>
        </Card>
        <Card className="bg-white/80 backdrop-blur-sm shadow-lg border-0 ring-1 ring-gray-200 hover:shadow-xl transition-all">
          <CardContent className="p-6 text-center">
            <div className="bg-gradient-to-br from-gray-500 to-gray-600 rounded-full p-3 w-16 h-16 mx-auto mb-4 shadow-lg">
              <FileText className="h-10 w-10 text-white" />
            </div>
            <div className="text-3xl font-bold bg-gradient-to-r from-gray-600 to-gray-700 bg-clip-text text-transparent">
              {formCounts.pending}
            </div>
            <div className="text-sm text-gray-600 font-medium">Not Started</div>
          </CardContent>
        </Card>
        <Card className="bg-white/80 backdrop-blur-sm shadow-lg border-0 ring-1 ring-gray-200 hover:shadow-xl transition-all">
          <CardContent className="p-6 text-center">
            <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-full p-3 w-16 h-16 mx-auto mb-4 shadow-lg">
              <AlertTriangle className="h-10 w-10 text-white" />
            </div>
            <div className="text-3xl font-bold bg-gradient-to-r from-red-600 to-red-700 bg-clip-text text-transparent">
              {formCounts.overdue}
            </div>
            <div className="text-sm text-gray-600 font-medium">Overdue</div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <Card className="bg-white/90 backdrop-blur-sm shadow-lg border-0 ring-1 ring-gray-200">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row space-y-4 lg:space-y-0 lg:space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                placeholder="Search forms by title or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 h-12 border-gray-200 focus:border-blue-400 focus:ring-blue-400 shadow-sm"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full lg:w-48 h-12 border-gray-200 shadow-sm">
                <Filter className="h-4 w-4 mr-2 text-blue-600" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Not Started</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
                <SelectItem value="due_soon">Due Soon</SelectItem>
              </SelectContent>
            </Select>
            <Select value={dueDateFilter} onValueChange={setDueDateFilter}>
              <SelectTrigger className="w-full lg:w-48 h-12 border-gray-200 shadow-sm">
                <Calendar className="h-4 w-4 mr-2 text-purple-600" />
                <SelectValue placeholder="Filter by due date" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Due Dates</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
                <SelectItem value="due_soon">Due Soon</SelectItem>
                <SelectItem value="no_due_date">No Due Date</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Forms List */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-8">
            <div className="text-gray-500">Loading your forms...</div>
          </div>
        ) : filteredForms.length === 0 ? (
          <Card className="bg-white/90 backdrop-blur-sm shadow-lg border-0 ring-1 ring-gray-200">
            <CardContent className="p-16 text-center">
              <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-full p-6 w-24 h-24 mx-auto mb-6">
                <FileText className="h-12 w-12 text-gray-400 mx-auto" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">No forms found</h3>
              <p className="text-gray-600 max-w-md mx-auto">
                {assignedForms.length === 0 
                  ? "You don't have any assigned forms yet. Forms assigned to you will appear here." 
                  : "No forms match your current filters. Try adjusting your search or filter criteria."}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredForms.map(form => {
            const formStatus = getFormStatus(form)
            const IconComponent = formStatus.icon
            const response = form.form_responses?.[0]
            
            return (
              <Card key={form.id} className="bg-white/90 backdrop-blur-sm shadow-lg border-0 ring-1 ring-gray-200 hover:shadow-xl hover:scale-[1.02] transition-all duration-200">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3 mb-3">
                        <h3 className="text-xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent truncate">
                          {form.forms.title}
                        </h3>
                        <Badge className={`${formStatus.color} shadow-sm px-3 py-1 font-semibold`}>
                          <IconComponent className="h-4 w-4 mr-1" />
                          {formStatus.label}
                        </Badge>
                        {form.is_mandatory && (
                          <Badge variant="outline" className="border-red-300 bg-red-50 text-red-700 shadow-sm px-3 py-1 font-semibold">
                            Mandatory
                          </Badge>
                        )}
                      </div>
                      
                      {form.forms.description && (
                        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                          {form.forms.description}
                        </p>
                      )}
                      
                      <div className="flex items-center space-x-6 text-sm text-gray-500">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          Assigned {format(parseISO(form.assigned_at), 'MMM d, yyyy')}
                        </div>
                        
                        {form.due_date && (
                          <div className={`flex items-center ${
                            isAfter(new Date(), new Date(form.due_date)) ? 'text-red-600' : ''
                          }`}>
                            <Clock className="h-4 w-4 mr-1" />
                            Due {format(parseISO(form.due_date), 'MMM d, yyyy')}
                          </div>
                        )}
                        
                        {response?.submitted_at && (
                          <div className="flex items-center text-green-600">
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Completed {format(parseISO(response.submitted_at), 'MMM d, yyyy')}
                          </div>
                        )}
                        
                        {response?.completion_time_seconds && (
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-1" />
                            {getCompletionTime(response.completion_time_seconds)}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex space-x-3 ml-4">
                      {form.forms.status === 'active' && formStatus.status !== 'completed' && (
                        <Button
                          onClick={() => router.push(`/dashboard/forms/fill/${form.form_id}`)}
                          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all px-6 py-2"
                        >
                          <Play className="h-4 w-4 mr-2" />
                          {formStatus.status === 'in_progress' ? 'Continue' : 'Start Form'}
                        </Button>
                      )}
                      
                      {formStatus.status === 'completed' && (
                        <Button
                          variant="outline"
                          onClick={() => router.push(`/dashboard/forms/fill/${form.form_id}`)}
                          className="border-green-300 text-green-700 hover:bg-green-50 shadow-md hover:shadow-lg transition-all px-6 py-2"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Response
                        </Button>
                      )}
                      
                      {form.forms.status !== 'active' && (
                        <Button variant="outline" disabled className="border-gray-300 text-gray-500 px-6 py-2">
                          Form Inactive
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}