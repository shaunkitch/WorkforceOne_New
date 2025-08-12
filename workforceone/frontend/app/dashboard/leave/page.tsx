'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  Calendar,
  Plus,
  Search,
  Filter,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Edit,
  Trash2,
  Eye,
  User,
  CalendarDays,
  Plane,
  Heart,
  Building,
  FileText,
  TrendingUp,
  Users
} from 'lucide-react'
import { format, parseISO, differenceInDays, startOfYear, endOfYear, isWithinInterval } from 'date-fns'

interface LeaveRequest {
  id: string
  employee_id: string
  leave_type: 'vacation' | 'sick' | 'personal' | 'maternity' | 'paternity' | 'bereavement' | 'other'
  start_date: string
  end_date: string
  days_requested: number
  status: 'pending' | 'approved' | 'rejected' | 'cancelled'
  reason: string
  manager_comments?: string
  approved_by?: string
  approved_at?: string
  created_at: string
  updated_at: string
  employee: {
    full_name: string
    email: string
    avatar_url?: string
  }
  approver?: {
    full_name: string
    email: string
  }
}

interface LeaveBalance {
  id: string
  employee_id: string
  year: number
  vacation_days_allocated: number
  vacation_days_used: number
  sick_days_allocated: number
  sick_days_used: number
  personal_days_allocated: number
  personal_days_used: number
  created_at: string
  updated_at: string
}

interface LeaveStats {
  totalRequests: number
  pendingRequests: number
  approvedRequests: number
  rejectedRequests: number
  totalDaysRequested: number
  avgRequestDays: number
  upcomingLeaves: number
}

export default function LeavePage() {
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([])
  const [leaveBalance, setLeaveBalance] = useState<LeaveBalance | null>(null)
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null)
  const [leaveStats, setLeaveStats] = useState<LeaveStats>({
    totalRequests: 0,
    pendingRequests: 0,
    approvedRequests: 0,
    rejectedRequests: 0,
    totalDaysRequested: 0,
    avgRequestDays: 0,
    upcomingLeaves: 0
  })
  const [loading, setLoading] = useState(true)
  const [showCreateRequest, setShowCreateRequest] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [viewMode, setViewMode] = useState<'my_requests' | 'team_requests' | 'all_requests'>('my_requests')
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [showCommentModal, setShowCommentModal] = useState(false)
  const [pendingAction, setPendingAction] = useState<{requestId: string, status: 'approved' | 'rejected'} | null>(null)
  const [managerComment, setManagerComment] = useState('')
  
  // Form state
  const [requestForm, setRequestForm] = useState({
    leave_type: 'vacation' as LeaveRequest['leave_type'],
    start_date: '',
    end_date: '',
    reason: ''
  })
  
  const supabase = createClient()

  // Permission helper functions
  const canApproveRequests = () => {
    return currentUser?.profile?.role === 'admin' || currentUser?.profile?.role === 'manager'
  }

  const canViewTeamRequests = () => {
    return currentUser?.profile?.role === 'admin' || currentUser?.profile?.role === 'manager'
  }

  const handleApprovalAction = (requestId: string, status: 'approved' | 'rejected') => {
    setPendingAction({ requestId, status })
    setShowCommentModal(true)
  }

  const submitApproval = async () => {
    if (!pendingAction) return
    
    await updateRequestStatus(pendingAction.requestId, pendingAction.status, managerComment)
    
    // Reset modal state
    setShowCommentModal(false)
    setPendingAction(null)
    setManagerComment('')
  }

  const leaveTypes = [
    { value: 'vacation', label: 'Vacation', icon: Plane, color: 'bg-blue-100 text-blue-800' },
    { value: 'sick', label: 'Sick Leave', icon: Heart, color: 'bg-red-100 text-red-800' },
    { value: 'personal', label: 'Personal', icon: User, color: 'bg-green-100 text-green-800' },
    { value: 'maternity', label: 'Maternity', icon: Heart, color: 'bg-pink-100 text-pink-800' },
    { value: 'paternity', label: 'Paternity', icon: Heart, color: 'bg-purple-100 text-purple-800' },
    { value: 'bereavement', label: 'Bereavement', icon: Heart, color: 'bg-gray-100 text-gray-800' },
    { value: 'other', label: 'Other', icon: FileText, color: 'bg-yellow-100 text-yellow-800' }
  ]

  useEffect(() => {
    fetchCurrentUser()
    fetchLeaveRequests()
    fetchLeaveBalance()
  }, [statusFilter, typeFilter, searchTerm, viewMode])

  useEffect(() => {
    calculateStats()
  }, [leaveRequests])

  const fetchCurrentUser = async () => {
    try {
      const { data: user } = await supabase.auth.getUser()
      if (user.user) {
        // Fetch user profile with role information
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.user.id)
          .single()
        
        setCurrentUser({
          ...user.user,
          profile: profile
        })
      }
    } catch (error) {
      console.error('Error fetching current user:', error)
    }
  }

  const fetchLeaveRequests = async () => {
    try {
      const { data: user } = await supabase.auth.getUser()
      if (!user.user) return

      // Get user's profile for organization_id
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('organization_id, role')
        .eq('id', user.user.id)
        .single()

      if (!userProfile?.organization_id) return

      let query = supabase
        .from('leave_requests')
        .select(`
          *,
          employee:profiles!leave_requests_employee_id_fkey (
            full_name,
            email,
            avatar_url
          ),
          approver:profiles!leave_requests_approved_by_fkey (
            full_name,
            email
          )
        `)
        .order('created_at', { ascending: false })

      // Filter based on view mode and user role
      if (viewMode === 'my_requests') {
        query = query.eq('employee_id', user.user.id)
      } else if (viewMode === 'team_requests' && canViewTeamRequests()) {
        // For managers/admins, show all requests in their organization (excluding their own)
        query = query
          .eq('organization_id', userProfile.organization_id)
          .neq('employee_id', user.user.id)
      } else if (viewMode === 'all_requests' && currentUser?.profile?.role === 'admin') {
        // Only admins can see all requests in the organization
        query = query.eq('organization_id', userProfile.organization_id)
      } else {
        // Default to user's own requests
        query = query.eq('employee_id', user.user.id)
      }

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter)
      }

      if (typeFilter !== 'all') {
        query = query.eq('leave_type', typeFilter)
      }

      if (searchTerm) {
        query = query.ilike('reason', `%${searchTerm}%`)
      }

      const { data, error } = await query

      if (error) throw error
      setLeaveRequests(data || [])
      
      // Auto-select first request if none selected
      if (!selectedRequest && data && data.length > 0) {
        setSelectedRequest(data[0])
      }
    } catch (error) {
      console.error('Error fetching leave requests:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchLeaveBalance = async () => {
    try {
      const { data: user } = await supabase.auth.getUser()
      if (!user.user) return

      const currentYear = new Date().getFullYear()

      const { data, error } = await supabase
        .from('leave_balances')
        .select('*')
        .eq('employee_id', user.user.id)
        .eq('year', currentYear)
        .single()

      if (error && error.code !== 'PGRST116') throw error
      
      // If no balance exists, create default one
      if (!data) {
        const defaultBalance = {
          employee_id: user.user.id,
          year: currentYear,
          vacation_days_allocated: 20,
          vacation_days_used: 0,
          sick_days_allocated: 10,
          sick_days_used: 0,
          personal_days_allocated: 5,
          personal_days_used: 0
        }

        const { data: newBalance, error: createError } = await supabase
          .from('leave_balances')
          .insert(defaultBalance)
          .select()
          .single()

        if (createError) throw createError
        setLeaveBalance(newBalance)
      } else {
        setLeaveBalance(data)
      }
    } catch (error) {
      console.error('Error fetching leave balance:', error)
    }
  }

  const calculateStats = () => {
    if (leaveRequests.length === 0) return

    const currentYear = new Date().getFullYear()
    const currentYearRequests = leaveRequests.filter(req => 
      new Date(req.start_date).getFullYear() === currentYear
    )

    const stats = {
      totalRequests: currentYearRequests.length,
      pendingRequests: currentYearRequests.filter(r => r.status === 'pending').length,
      approvedRequests: currentYearRequests.filter(r => r.status === 'approved').length,
      rejectedRequests: currentYearRequests.filter(r => r.status === 'rejected').length,
      totalDaysRequested: currentYearRequests.reduce((sum, r) => sum + r.days_requested, 0),
      avgRequestDays: currentYearRequests.length > 0 ? 
        currentYearRequests.reduce((sum, r) => sum + r.days_requested, 0) / currentYearRequests.length : 0,
      upcomingLeaves: currentYearRequests.filter(r => 
        r.status === 'approved' && new Date(r.start_date) > new Date()
      ).length
    }

    setLeaveStats(stats)
  }

  const createLeaveRequest = async () => {
    if (!requestForm.start_date || !requestForm.end_date || !requestForm.reason) return

    try {
      const { data: user } = await supabase.auth.getUser()
      if (!user.user) return

      // Get user's organization_id
      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.user.id)
        .single()

      if (!profile?.organization_id) {
        alert('Unable to determine your organization. Please contact an administrator.')
        return
      }

      const startDate = new Date(requestForm.start_date)
      const endDate = new Date(requestForm.end_date)
      const daysRequested = differenceInDays(endDate, startDate) + 1

      const { data, error } = await supabase
        .from('leave_requests')
        .insert({
          employee_id: user.user.id,
          organization_id: profile.organization_id,
          leave_type: requestForm.leave_type,
          start_date: requestForm.start_date,
          end_date: requestForm.end_date,
          days_requested: daysRequested,
          reason: requestForm.reason,
          status: 'pending'
        })
        .select(`
          *,
          employee:profiles!leave_requests_employee_id_fkey (
            full_name,
            email,
            avatar_url
          )
        `)
        .single()

      if (error) throw error

      setLeaveRequests(prev => [data, ...prev])
      setRequestForm({
        leave_type: 'vacation',
        start_date: '',
        end_date: '',
        reason: ''
      })
      setShowCreateRequest(false)
      setSelectedRequest(data)
    } catch (error) {
      console.error('Error creating leave request:', error)
      alert('Failed to create leave request. Please try again.')
    }
  }

  const updateRequestStatus = async (requestId: string, status: LeaveRequest['status'], comments?: string) => {
    try {
      const updateData: any = { 
        status,
        manager_comments: comments
      }
      
      if (status === 'approved' && currentUser) {
        updateData.approved_by = currentUser.id
        updateData.approved_at = new Date().toISOString()
      }

      const { error } = await supabase
        .from('leave_requests')
        .update(updateData)
        .eq('id', requestId)

      if (error) throw error

      setLeaveRequests(prev =>
        prev.map(r => r.id === requestId ? { ...r, status, manager_comments: comments } : r)
      )

      if (selectedRequest && selectedRequest.id === requestId) {
        setSelectedRequest(prev => prev ? { ...prev, status, manager_comments: comments } : null)
      }

      // Update leave balance if approved
      if (status === 'approved' && selectedRequest) {
        await updateLeaveBalance(selectedRequest)
      }
    } catch (error) {
      console.error('Error updating request status:', error)
    }
  }

  const updateLeaveBalance = async (request: LeaveRequest) => {
    if (!leaveBalance) return

    try {
      const updatedBalance = { ...leaveBalance }
      
      switch (request.leave_type) {
        case 'vacation':
          updatedBalance.vacation_days_used += request.days_requested
          break
        case 'sick':
          updatedBalance.sick_days_used += request.days_requested
          break
        case 'personal':
          updatedBalance.personal_days_used += request.days_requested
          break
      }

      const { error } = await supabase
        .from('leave_balances')
        .update({
          vacation_days_used: updatedBalance.vacation_days_used,
          sick_days_used: updatedBalance.sick_days_used,
          personal_days_used: updatedBalance.personal_days_used
        })
        .eq('id', leaveBalance.id)

      if (error) throw error
      setLeaveBalance(updatedBalance)
    } catch (error) {
      console.error('Error updating leave balance:', error)
    }
  }

  const deleteRequest = async (requestId: string) => {
    if (!confirm('Are you sure you want to delete this leave request?')) return

    try {
      const { error } = await supabase
        .from('leave_requests')
        .delete()
        .eq('id', requestId)

      if (error) throw error

      setLeaveRequests(prev => prev.filter(r => r.id !== requestId))
      if (selectedRequest && selectedRequest.id === requestId) {
        setSelectedRequest(null)
      }
    } catch (error) {
      console.error('Error deleting request:', error)
      alert('Failed to delete request. Please try again.')
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-600" />
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-gray-600" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: 'secondary',
      approved: 'default',
      rejected: 'destructive',
      cancelled: 'outline'
    } as const

    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      cancelled: 'bg-gray-100 text-gray-800'
    }

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'secondary'} className={colors[status as keyof typeof colors]}>
        {status.toUpperCase()}
      </Badge>
    )
  }

  const getLeaveTypeBadge = (type: string) => {
    const leaveType = leaveTypes.find(t => t.value === type)
    if (!leaveType) return null

    const Icon = leaveType.icon

    return (
      <Badge variant="outline" className={leaveType.color}>
        <Icon className="h-3 w-3 mr-1" />
        {leaveType.label}
      </Badge>
    )
  }

  const getDaysText = (days: number) => {
    return days === 1 ? '1 day' : `${days} days`
  }

  const isUpcoming = (startDate: string) => {
    return new Date(startDate) > new Date()
  }

  const isActive = (startDate: string, endDate: string) => {
    const now = new Date()
    return now >= new Date(startDate) && now <= new Date(endDate)
  }

  const filteredRequests = leaveRequests.filter(request => {
    const matchesSearch = request.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         request.employee.full_name.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSearch
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Leave Requests</h1>
          <p className="text-gray-600">Manage your leave requests and time off.</p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex bg-gray-100 rounded-lg">
            <Button
              variant={viewMode === 'my_requests' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('my_requests')}
            >
              My Requests
            </Button>
            {canViewTeamRequests() && (
              <Button
                variant={viewMode === 'team_requests' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('team_requests')}
              >
                Team Requests
              </Button>
            )}
            {currentUser?.profile?.role === 'admin' && (
              <Button
                variant={viewMode === 'all_requests' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('all_requests')}
              >
                All Requests
              </Button>
            )}
          </div>
          <Button onClick={() => setShowCreateRequest(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Request Leave
          </Button>
        </div>
      </div>

      {/* Leave Balance Cards */}
      {leaveBalance && viewMode === 'my_requests' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-600">Vacation Days</div>
                  <div className="text-2xl font-bold">
                    {leaveBalance.vacation_days_allocated - leaveBalance.vacation_days_used}
                  </div>
                  <div className="text-sm text-gray-500">
                    of {leaveBalance.vacation_days_allocated} available
                  </div>
                </div>
                <Plane className="h-8 w-8 text-blue-600" />
              </div>
              <div className="mt-4">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ 
                      width: `${Math.min((leaveBalance.vacation_days_used / leaveBalance.vacation_days_allocated) * 100, 100)}%` 
                    }}
                  />
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {leaveBalance.vacation_days_used} used
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-600">Sick Days</div>
                  <div className="text-2xl font-bold">
                    {leaveBalance.sick_days_allocated - leaveBalance.sick_days_used}
                  </div>
                  <div className="text-sm text-gray-500">
                    of {leaveBalance.sick_days_allocated} available
                  </div>
                </div>
                <Heart className="h-8 w-8 text-red-600" />
              </div>
              <div className="mt-4">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-red-600 h-2 rounded-full transition-all duration-300"
                    style={{ 
                      width: `${Math.min((leaveBalance.sick_days_used / leaveBalance.sick_days_allocated) * 100, 100)}%` 
                    }}
                  />
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {leaveBalance.sick_days_used} used
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-600">Personal Days</div>
                  <div className="text-2xl font-bold">
                    {leaveBalance.personal_days_allocated - leaveBalance.personal_days_used}
                  </div>
                  <div className="text-sm text-gray-500">
                    of {leaveBalance.personal_days_allocated} available
                  </div>
                </div>
                <User className="h-8 w-8 text-green-600" />
              </div>
              <div className="mt-4">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-600 h-2 rounded-full transition-all duration-300"
                    style={{ 
                      width: `${Math.min((leaveBalance.personal_days_used / leaveBalance.personal_days_allocated) * 100, 100)}%` 
                    }}
                  />
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {leaveBalance.personal_days_used} used
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Calendar className="h-8 w-8 text-blue-600 mx-auto mb-2" />
            <div className="text-2xl font-bold">{leaveStats.totalRequests}</div>
            <div className="text-sm text-gray-600">Total Requests</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Clock className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
            <div className="text-2xl font-bold">{leaveStats.pendingRequests}</div>
            <div className="text-sm text-gray-600">Pending</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <div className="text-2xl font-bold">{leaveStats.approvedRequests}</div>
            <div className="text-sm text-gray-600">Approved</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <XCircle className="h-8 w-8 text-red-600 mx-auto mb-2" />
            <div className="text-2xl font-bold">{leaveStats.rejectedRequests}</div>
            <div className="text-sm text-gray-600">Rejected</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <CalendarDays className="h-8 w-8 text-purple-600 mx-auto mb-2" />
            <div className="text-2xl font-bold">{leaveStats.totalDaysRequested}</div>
            <div className="text-sm text-gray-600">Days Requested</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <TrendingUp className="h-8 w-8 text-orange-600 mx-auto mb-2" />
            <div className="text-2xl font-bold">{leaveStats.avgRequestDays.toFixed(1)}</div>
            <div className="text-sm text-gray-600">Avg Request</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Plane className="h-8 w-8 text-indigo-600 mx-auto mb-2" />
            <div className="text-2xl font-bold">{leaveStats.upcomingLeaves}</div>
            <div className="text-sm text-gray-600">Upcoming</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Requests List */}
        <div className="lg:col-span-1 space-y-4">
          {/* Search and Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search requests..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      {leaveTypes.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Requests List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="h-5 w-5 mr-2" />
                Requests ({filteredRequests.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="p-4 text-center text-gray-500">Loading requests...</div>
              ) : filteredRequests.length === 0 ? (
                <div className="p-4 text-center text-gray-500">No requests found</div>
              ) : (
                <div className="space-y-1">
                  {filteredRequests.map(request => (
                    <button
                      key={request.id}
                      onClick={() => setSelectedRequest(request)}
                      className={`w-full text-left p-4 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 ${
                        selectedRequest?.id === request.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 mb-1">
                              {getStatusIcon(request.status)}
                              <h3 className="font-medium truncate">
                                {format(parseISO(request.start_date), 'MMM d')} - {format(parseISO(request.end_date), 'MMM d')}
                              </h3>
                            </div>
                            <p className="text-sm text-gray-500 line-clamp-2">{request.reason}</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            {getStatusBadge(request.status)}
                            {getLeaveTypeBadge(request.leave_type)}
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>{getDaysText(request.days_requested)}</span>
                          {isActive(request.start_date, request.end_date) ? (
                            <Badge variant="default" className="bg-green-100 text-green-800">Active</Badge>
                          ) : isUpcoming(request.start_date) ? (
                            <Badge variant="outline" className="bg-blue-100 text-blue-800">Upcoming</Badge>
                          ) : null}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Request Details */}
        <div className="lg:col-span-2">
          {selectedRequest ? (
            <div className="space-y-6">
              {/* Request Header */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <CardTitle>
                          {format(parseISO(selectedRequest.start_date), 'MMMM d, yyyy')} - {format(parseISO(selectedRequest.end_date), 'MMMM d, yyyy')}
                        </CardTitle>
                        {getStatusBadge(selectedRequest.status)}
                        {getLeaveTypeBadge(selectedRequest.leave_type)}
                      </div>
                      <p className="text-gray-600">{selectedRequest.reason}</p>
                      <div className="flex items-center space-x-6 mt-3 text-sm text-gray-500">
                        <span className="flex items-center">
                          <User className="h-4 w-4 mr-1" />
                          {selectedRequest.employee.full_name}
                        </span>
                        <span className="flex items-center">
                          <CalendarDays className="h-4 w-4 mr-1" />
                          {getDaysText(selectedRequest.days_requested)}
                        </span>
                        <span className="flex items-center">
                          <Clock className="h-4 w-4 mr-1" />
                          Requested: {format(parseISO(selectedRequest.created_at), 'MMM d, yyyy')}
                        </span>
                      </div>
                      {selectedRequest.approved_by && selectedRequest.approved_at && (
                        <div className="mt-2 text-sm text-gray-500">
                          <span className="flex items-center">
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Approved by {selectedRequest.approver?.full_name} on {format(parseISO(selectedRequest.approved_at), 'MMM d, yyyy')}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex space-x-2">
                      {selectedRequest.status === 'pending' && currentUser?.id === selectedRequest.employee_id && (
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                      )}
                      {selectedRequest.status === 'pending' && canApproveRequests() && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => handleApprovalAction(selectedRequest.id, 'approved')}
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Approve
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleApprovalAction(selectedRequest.id, 'rejected')}
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            Reject
                          </Button>
                        </>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteRequest(selectedRequest.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Request Details */}
                    <div className="space-y-4">
                      <div>
                        <Label className="text-sm font-medium">Leave Period</Label>
                        <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                          <div className="text-sm">
                            <div className="flex justify-between">
                              <span>Start Date:</span>
                              <span className="font-medium">{format(parseISO(selectedRequest.start_date), 'EEEE, MMMM d, yyyy')}</span>
                            </div>
                            <div className="flex justify-between mt-1">
                              <span>End Date:</span>
                              <span className="font-medium">{format(parseISO(selectedRequest.end_date), 'EEEE, MMMM d, yyyy')}</span>
                            </div>
                            <div className="flex justify-between mt-1">
                              <span>Duration:</span>
                              <span className="font-medium">{getDaysText(selectedRequest.days_requested)}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {selectedRequest.manager_comments && (
                        <div>
                          <Label className="text-sm font-medium">Manager Comments</Label>
                          <div className="mt-1 p-3 bg-gray-50 rounded-lg">
                            <p className="text-sm">{selectedRequest.manager_comments}</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Timeline */}
                    <div>
                      <Label className="text-sm font-medium">Request Timeline</Label>
                      <div className="mt-1 space-y-3">
                        <div className="flex items-start space-x-3">
                          <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                            <FileText className="h-3 w-3 text-blue-600" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium">Request Submitted</p>
                            <p className="text-xs text-gray-500">
                              {format(parseISO(selectedRequest.created_at), 'MMM d, yyyy • HH:mm')}
                            </p>
                          </div>
                        </div>

                        {selectedRequest.status !== 'pending' && (
                          <div className="flex items-start space-x-3">
                            <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
                              selectedRequest.status === 'approved' ? 'bg-green-100' :
                              selectedRequest.status === 'rejected' ? 'bg-red-100' : 'bg-gray-100'
                            }`}>
                              {selectedRequest.status === 'approved' ? (
                                <CheckCircle className="h-3 w-3 text-green-600" />
                              ) : selectedRequest.status === 'rejected' ? (
                                <XCircle className="h-3 w-3 text-red-600" />
                              ) : (
                                <XCircle className="h-3 w-3 text-gray-600" />
                              )}
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium">
                                Request {selectedRequest.status.charAt(0).toUpperCase() + selectedRequest.status.slice(1)}
                              </p>
                              <p className="text-xs text-gray-500">
                                {selectedRequest.approved_at ? 
                                  format(parseISO(selectedRequest.approved_at), 'MMM d, yyyy • HH:mm') :
                                  format(parseISO(selectedRequest.updated_at), 'MMM d, yyyy • HH:mm')
                                }
                              </p>
                            </div>
                          </div>
                        )}

                        {selectedRequest.status === 'approved' && isUpcoming(selectedRequest.start_date) && (
                          <div className="flex items-start space-x-3">
                            <div className="flex-shrink-0 w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center">
                              <Clock className="h-3 w-3 text-orange-600" />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium">Leave Starts</p>
                              <p className="text-xs text-gray-500">
                                {format(parseISO(selectedRequest.start_date), 'MMM d, yyyy')}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No request selected</h3>
                <p className="text-gray-500">Select a leave request from the list to view details and manage it.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Create Request Modal */}
      {showCreateRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Request Leave</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="leaveType">Leave Type</Label>
                <Select
                  value={requestForm.leave_type}
                  onValueChange={(value: LeaveRequest['leave_type']) => 
                    setRequestForm(prev => ({ ...prev, leave_type: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {leaveTypes.map(type => {
                      const Icon = type.icon
                      return (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex items-center">
                            <Icon className="h-4 w-4 mr-2" />
                            {type.label}
                          </div>
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={requestForm.start_date}
                    onChange={(e) => setRequestForm(prev => ({ ...prev, start_date: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="endDate">End Date</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={requestForm.end_date}
                    onChange={(e) => setRequestForm(prev => ({ ...prev, end_date: e.target.value }))}
                  />
                </div>
              </div>
              {requestForm.start_date && requestForm.end_date && (
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <CalendarDays className="h-4 w-4 inline mr-1" />
                    Total days requested: {getDaysText(
                      differenceInDays(new Date(requestForm.end_date), new Date(requestForm.start_date)) + 1
                    )}
                  </p>
                </div>
              )}
              <div>
                <Label htmlFor="reason">Reason for Leave</Label>
                <Textarea
                  id="reason"
                  value={requestForm.reason}
                  onChange={(e) => setRequestForm(prev => ({ ...prev, reason: e.target.value }))}
                  placeholder="Please provide a reason for your leave request..."
                  rows={4}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setShowCreateRequest(false)}
                >
                  Cancel
                </Button>
                <Button onClick={createLeaveRequest}>
                  Submit Request
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Manager Comment Modal */}
      {showCommentModal && pendingAction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>
                {pendingAction.status === 'approved' ? 'Approve' : 'Reject'} Leave Request
              </CardTitle>
              <p className="text-sm text-gray-600">
                Add comments for this {pendingAction.status === 'approved' ? 'approval' : 'rejection'} (optional)
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="managerComment">Manager Comments</Label>
                <Textarea
                  id="managerComment"
                  value={managerComment}
                  onChange={(e) => setManagerComment(e.target.value)}
                  placeholder={`Add ${pendingAction.status === 'approved' ? 'approval' : 'rejection'} comments...`}
                  rows={3}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowCommentModal(false)
                    setPendingAction(null)
                    setManagerComment('')
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={submitApproval}
                  className={pendingAction.status === 'approved' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  {pendingAction.status === 'approved' ? 'Approve' : 'Reject'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}