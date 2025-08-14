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
  CheckSquare,
  Square,
  Plus,
  Search,
  Filter,
  Calendar,
  User,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  Edit,
  Trash2,
  MoreVertical,
  Flag,
  MessageSquare,
  Paperclip,
  Eye,
  Play,
  Pause,
  Timer,
  BarChart3,
  Target,
  MapPin,
  Users,
  UserCheck
} from 'lucide-react'
import { format, parseISO, differenceInDays, isAfter, isBefore, isToday } from 'date-fns'

interface Task {
  id: string
  title: string
  description?: string
  status: 'todo' | 'in_progress' | 'review' | 'completed' | 'cancelled'
  priority: 'low' | 'medium' | 'high' | 'critical'
  assignee_id?: string
  reporter_id: string
  project_id?: string
  outlet_id?: string
  due_date?: string
  estimated_hours?: number
  actual_hours?: number
  created_at: string
  updated_at: string
  assignee?: {
    full_name: string
    email: string
    avatar_url?: string
  }
  reporter?: {
    full_name: string
    email: string
  }
  project?: {
    name: string
  }
  outlet?: {
    name: string
    address?: string
  }
  comments?: TaskComment[]
  attachments?: TaskAttachment[]
}

interface TaskComment {
  id: string
  content: string
  user_id: string
  created_at: string
  user: {
    full_name: string
    avatar_url?: string
  }
}

interface TaskAttachment {
  id: string
  filename: string
  file_url: string
  file_size: number
  uploaded_by: string
  created_at: string
}

interface TaskStats {
  totalTasks: number
  todoTasks: number
  inProgressTasks: number
  completedTasks: number
  overdueTasks: number
  myTasks: number
  avgCompletionTime: number
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [taskStats, setTaskStats] = useState<TaskStats>({
    totalTasks: 0,
    todoTasks: 0,
    inProgressTasks: 0,
    completedTasks: 0,
    overdueTasks: 0,
    myTasks: 0,
    avgCompletionTime: 0
  })
  const [loading, setLoading] = useState(true)
  const [showCreateTask, setShowCreateTask] = useState(false)
  const [showEditTask, setShowEditTask] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [assigneeFilter, setAssigneeFilter] = useState('all')
  const [viewMode, setViewMode] = useState<'list' | 'board'>('list')
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [outlets, setOutlets] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [teams, setTeams] = useState<any[]>([])
  const [assignmentType, setAssignmentType] = useState<'user' | 'team'>('user')
  const [userSearchQuery, setUserSearchQuery] = useState('')
  const [showUserDropdown, setShowUserDropdown] = useState(false)
  const [outletSearchQuery, setOutletSearchQuery] = useState('')
  const [showOutletDropdown, setShowOutletDropdown] = useState(false)
  
  // Form state
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    priority: 'medium' as Task['priority'],
    assignee_id: '',
    team_id: '',
    project_id: '',
    outlet_id: '',
    due_date: '',
    estimated_hours: ''
  })
  
  const [newComment, setNewComment] = useState('')
  
  const supabase = createClient()

  useEffect(() => {
    fetchCurrentUser()
    fetchUserProfile()
    fetchTasks()
    fetchOutlets()
    fetchUsers()
    fetchTeams()
  }, [statusFilter, priorityFilter, assigneeFilter, searchTerm])

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showUserDropdown && !(event.target as Element).closest('.user-dropdown-container')) {
        setShowUserDropdown(false)
        setUserSearchQuery('')
      }
      if (showOutletDropdown && !(event.target as Element).closest('.outlet-dropdown-container')) {
        setShowOutletDropdown(false)
        setOutletSearchQuery('')
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showUserDropdown, showOutletDropdown])

  const fetchUserProfile = async () => {
    try {
      const { data: user } = await supabase.auth.getUser()
      if (!user.user) {
        console.log('No authenticated user found')
        return
      }

      console.log('Fetching user profile from database...')
      
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.user.id)
        .single()

      if (error) {
        console.error('Error fetching user profile:', error)
        setUserProfile(null)
        return
      }

      console.log('Successfully fetched user profile:', profile)
      setUserProfile(profile)
      
    } catch (error) {
      console.error('Critical error in fetchUserProfile:', error)
      setUserProfile(null)
    }
  }

  // Permission helper functions
  const canCreateTasks = () => {
    return userProfile?.role === 'admin' || userProfile?.role === 'manager'
  }

  const canEditTasks = () => {
    return userProfile?.role === 'admin' || userProfile?.role === 'manager'
  }

  const canDeleteTasks = () => {
    return userProfile?.role === 'admin'
  }

  // Filter users based on search query
  const filteredUsers = users.filter(user => 
    user.full_name?.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
    user.email?.toLowerCase().includes(userSearchQuery.toLowerCase())
  )

  // Filter outlets based on search query
  const filteredOutlets = outlets.filter(outlet => 
    outlet.name?.toLowerCase().includes(outletSearchQuery.toLowerCase()) ||
    outlet.address?.toLowerCase().includes(outletSearchQuery.toLowerCase())
  )

  // Get selected user display name
  const getSelectedUserDisplay = () => {
    if (!taskForm.assignee_id || taskForm.assignee_id === 'none') return 'Unassigned'
    const selectedUser = users.find(u => u.id === taskForm.assignee_id)
    return selectedUser ? `${selectedUser.full_name} - ${selectedUser.email}` : 'Select user'
  }

  // Get selected outlet display name
  const getSelectedOutletDisplay = () => {
    if (!taskForm.outlet_id || taskForm.outlet_id === 'none') return 'No outlet'
    const selectedOutlet = outlets.find(o => o.id === taskForm.outlet_id)
    return selectedOutlet ? `${selectedOutlet.name} - ${selectedOutlet.address || 'No address'}` : 'Select outlet'
  }

  useEffect(() => {
    calculateStats()
  }, [tasks, currentUser])

  const fetchCurrentUser = async () => {
    try {
      const { data: user } = await supabase.auth.getUser()
      if (user.user) {
        setCurrentUser(user.user)
      }
    } catch (error) {
      console.error('Error fetching current user:', error)
    }
  }

  const fetchOutlets = async () => {
    try {
      const { data: user } = await supabase.auth.getUser()
      if (!user.user) return

      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.user.id)
        .single()

      if (!profile?.organization_id) return

      const { data: outlets } = await supabase
        .from('outlets')
        .select('id, name, address')
        .eq('organization_id', profile.organization_id)
        .order('name')

      setOutlets(outlets || [])
    } catch (error) {
      console.error('Error fetching outlets:', error)
    }
  }

  const fetchUsers = async () => {
    try {
      const { data: user } = await supabase.auth.getUser()
      if (!user.user) {
        console.log('No authenticated user found')
        return
      }

      console.log('Fetching users from database...')
      
      // Get current user's organization first
      const { data: currentProfile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.user.id)
        .single()

      // Fetch users from same organization
      let query = supabase
        .from('profiles')
        .select('id, full_name, email, avatar_url, role, organization_id')
        .not('full_name', 'is', null)
        .order('full_name')

      // If user has organization, filter by it
      if (currentProfile?.organization_id) {
        query = query.eq('organization_id', currentProfile.organization_id)
      }

      const { data: users, error } = await query

      if (error) {
        console.error('Error fetching users:', error)
        setUsers([]) // Set empty array on error
        return
      }

      console.log('Successfully fetched users:', users?.length || 0, 'users')
      console.log('Users:', users?.map(u => ({ id: u.id, name: u.full_name, email: u.email })))
      setUsers(users || [])

    } catch (error) {
      console.error('Critical error in fetchUsers:', error)
      setUsers([]) // Set empty array on critical error
    }
  }

  const fetchTeams = async () => {
    try {
      const { data: user } = await supabase.auth.getUser()
      if (!user.user) return

      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.user.id)
        .single()

      if (!profile?.organization_id) return

      const { data: teams } = await supabase
        .from('teams')
        .select('id, name, description')
        .eq('organization_id', profile.organization_id)
        .order('name')

      setTeams(teams || [])
    } catch (error) {
      console.error('Error fetching teams:', error)
    }
  }

  const fetchTasks = async () => {
    try {
      const { data: user } = await supabase.auth.getUser()
      if (!user.user) return

      // Fetch tasks with assignee information
      let query = supabase
        .from('tasks')
        .select(`
          *,
          assignee:profiles!assignee_id(full_name, email, avatar_url),
          reporter:profiles!reporter_id(full_name, email),
          project:projects(name),
          outlet:outlets(name, address)
        `)
        .order('created_at', { ascending: false })

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter)
      }

      if (priorityFilter !== 'all') {
        query = query.eq('priority', priorityFilter)
      }

      if (assigneeFilter !== 'all') {
        if (assigneeFilter === 'me') {
          query = query.eq('assignee_id', user.user.id)
        } else if (assigneeFilter === 'unassigned') {
          query = query.is('assignee_id', null)
        } else {
          query = query.eq('assignee_id', assigneeFilter)
        }
      }

      if (searchTerm) {
        query = query.ilike('title', `%${searchTerm}%`)
      }

      const { data, error } = await query

      if (error) {
        console.error('Error fetching tasks:', error)
        // If tasks table doesn't exist, just set empty array
        if (error.code === 'PGRST204' || error.message?.includes('relation') || error.message?.includes('does not exist')) {
          console.log('Tasks table does not exist yet. Please run database migrations.')
          setTasks([])
          setLoading(false)
          return
        }
        throw error
      }
      setTasks(data || [])
      
      // Auto-select first task if none selected
      if (!selectedTask && data && data.length > 0) {
        setSelectedTask(data[0])
      }
    } catch (error) {
      console.error('Error fetching tasks:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateStats = () => {
    if (tasks.length === 0) return

    const stats = {
      totalTasks: tasks.length,
      todoTasks: tasks.filter(t => t.status === 'todo').length,
      inProgressTasks: tasks.filter(t => t.status === 'in_progress').length,
      completedTasks: tasks.filter(t => t.status === 'completed').length,
      overdueTasks: tasks.filter(t => 
        t.due_date && isAfter(new Date(), parseISO(t.due_date)) && t.status !== 'completed'
      ).length,
      myTasks: currentUser ? tasks.filter(t => t.assignee_id === currentUser.id).length : 0,
      avgCompletionTime: 2.5 // Mock average in days
    }

    setTaskStats(stats)
  }

  const createTask = async () => {
    if (!taskForm.title) return

    try {
      const { data: user } = await supabase.auth.getUser()
      if (!user.user) return

      // Handle assignment based on type
      const assigneeId = assignmentType === 'user' 
        ? (taskForm.assignee_id && taskForm.assignee_id !== 'none' ? taskForm.assignee_id : null)
        : null // For team assignments, we'll handle separately

      const { data, error } = await supabase
        .from('tasks')
        .insert({
          title: taskForm.title,
          description: taskForm.description,
          priority: taskForm.priority,
          assignee_id: assigneeId,
          reporter_id: user.user.id,
          project_id: taskForm.project_id && taskForm.project_id !== 'none' ? taskForm.project_id : null,
          outlet_id: taskForm.outlet_id && taskForm.outlet_id !== 'none' ? taskForm.outlet_id : null,
          due_date: taskForm.due_date || null,
          estimated_hours: taskForm.estimated_hours ? parseFloat(taskForm.estimated_hours) : null,
          status: 'todo',
          actual_hours: 0
        })
        .select('*')
        .single()

      if (error) throw error

      // If assigning to team, create task assignments for all team members
      if (assignmentType === 'team' && taskForm.team_id && taskForm.team_id !== 'none') {
        const { data: teamMembers } = await supabase
          .from('team_members')
          .select('user_id')
          .eq('team_id', taskForm.team_id)

        if (teamMembers && teamMembers.length > 0) {
          // Create task assignments for each team member
          const taskAssignments = teamMembers.map(member => ({
            task_id: data.id,
            user_id: member.user_id,
            assigned_at: new Date().toISOString(),
            assigned_by: user.user.id
          }))

          await supabase
            .from('task_assignments')
            .insert(taskAssignments)
        }
      }

      setTasks(prev => [data, ...prev])
      setTaskForm({
        title: '',
        description: '',
        priority: 'medium',
        assignee_id: 'none',
        team_id: 'none',
        project_id: 'none',
        outlet_id: 'none',
        due_date: '',
        estimated_hours: ''
      })
      setShowCreateTask(false)
      setSelectedTask(data)
    } catch (error) {
      console.error('Error creating task:', error)
      alert('Failed to create task. Please try again.')
    }
  }

  const startEditTask = (task: Task) => {
    setEditingTask(task)
    setTaskForm({
      title: task.title,
      description: task.description || '',
      priority: task.priority,
      assignee_id: task.assignee_id || 'none',
      team_id: '',
      project_id: task.project_id || 'none',
      outlet_id: task.outlet_id || 'none',
      due_date: task.due_date || '',
      estimated_hours: task.estimated_hours?.toString() || ''
    })
    setShowEditTask(true)
  }

  const updateTask = async () => {
    if (!editingTask || !taskForm.title) return

    try {
      const assigneeId = taskForm.assignee_id && taskForm.assignee_id !== 'none' ? taskForm.assignee_id : null

      const { data, error } = await supabase
        .from('tasks')
        .update({
          title: taskForm.title,
          description: taskForm.description,
          priority: taskForm.priority,
          assignee_id: assigneeId,
          project_id: taskForm.project_id && taskForm.project_id !== 'none' ? taskForm.project_id : null,
          outlet_id: taskForm.outlet_id && taskForm.outlet_id !== 'none' ? taskForm.outlet_id : null,
          due_date: taskForm.due_date || null,
          estimated_hours: taskForm.estimated_hours ? parseFloat(taskForm.estimated_hours) : null,
        })
        .eq('id', editingTask.id)
        .select('*')
        .single()

      if (error) throw error

      const updatedTask = { ...data, assignee: taskForm.assignee_id !== 'none' ? users.find(u => u.id === taskForm.assignee_id) : null }

      setTasks(prev => prev.map(t => t.id === editingTask.id ? updatedTask : t))
      if (selectedTask?.id === editingTask.id) {
        setSelectedTask(updatedTask)
      }

      setTaskForm({
        title: '',
        description: '',
        priority: 'medium',
        assignee_id: 'none',
        team_id: 'none',
        project_id: 'none',
        outlet_id: 'none',
        due_date: '',
        estimated_hours: ''
      })
      setShowEditTask(false)
      setEditingTask(null)
    } catch (error) {
      console.error('Error updating task:', error)
      alert('Failed to update task. Please try again.')
    }
  }

  const updateTaskStatus = async (taskId: string, status: Task['status']) => {
    try {
      const updateData: any = { status }
      
      // If marking as completed, record completion time
      if (status === 'completed') {
        updateData.completed_at = new Date().toISOString()
      }

      const { error } = await supabase
        .from('tasks')
        .update(updateData)
        .eq('id', taskId)

      if (error) throw error

      setTasks(prev =>
        prev.map(t => t.id === taskId ? { ...t, status } : t)
      )

      if (selectedTask && selectedTask.id === taskId) {
        setSelectedTask(prev => prev ? { ...prev, status } : null)
      }
    } catch (error) {
      console.error('Error updating task status:', error)
    }
  }

  const deleteTask = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task? This action cannot be undone.')) return

    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId)

      if (error) throw error

      setTasks(prev => prev.filter(t => t.id !== taskId))
      if (selectedTask && selectedTask.id === taskId) {
        setSelectedTask(null)
      }
    } catch (error) {
      console.error('Error deleting task:', error)
      alert('Failed to delete task. Please try again.')
    }
  }

  const addComment = async () => {
    if (!newComment.trim() || !selectedTask || !currentUser) return

    try {
      const { data, error } = await supabase
        .from('task_comments')
        .insert({
          task_id: selectedTask.id,
          content: newComment.trim(),
          user_id: currentUser.id
        })
        .select(`
          *,
          user:profiles (
            full_name,
            avatar_url
          )
        `)
        .single()

      if (error) throw error

      // Update selected task comments
      setSelectedTask(prev => ({
        ...prev!,
        comments: [...(prev!.comments || []), data]
      }))

      setNewComment('')
    } catch (error) {
      console.error('Error adding comment:', error)
      alert('Failed to add comment. Please try again.')
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'todo':
        return <Square className="h-4 w-4 text-gray-600" />
      case 'in_progress':
        return <Clock className="h-4 w-4 text-blue-600" />
      case 'review':
        return <Eye className="h-4 w-4 text-yellow-600" />
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-red-600" />
      default:
        return <Square className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      todo: 'secondary',
      in_progress: 'default',
      review: 'secondary',
      completed: 'default',
      cancelled: 'destructive'
    } as const

    const colors = {
      todo: 'bg-gray-100 text-gray-800',
      in_progress: 'bg-blue-100 text-blue-800',
      review: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    }

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'secondary'} className={colors[status as keyof typeof colors]}>
        {status.replace('_', ' ').toUpperCase()}
      </Badge>
    )
  }

  const getPriorityBadge = (priority: string) => {
    const colors = {
      low: 'bg-green-100 text-green-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-orange-100 text-orange-800',
      critical: 'bg-red-100 text-red-800'
    }

    return (
      <Badge variant="outline" className={colors[priority as keyof typeof colors]}>
        <Flag className="h-3 w-3 mr-1" />
        {priority.toUpperCase()}
      </Badge>
    )
  }

  const getDaysUntilDue = (dueDate: string | null) => {
    if (!dueDate) return null
    const days = differenceInDays(parseISO(dueDate), new Date())
    
    if (days < 0) return { text: `${Math.abs(days)} days overdue`, color: 'text-red-600' }
    if (days === 0) return { text: 'Due today', color: 'text-orange-600' }
    if (days === 1) return { text: 'Due tomorrow', color: 'text-yellow-600' }
    return { text: `${days} days left`, color: 'text-gray-600' }
  }

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesSearch
  })

  const groupedTasks = viewMode === 'board' ? {
    todo: filteredTasks.filter(t => t.status === 'todo'),
    in_progress: filteredTasks.filter(t => t.status === 'in_progress'),
    review: filteredTasks.filter(t => t.status === 'review'),
    completed: filteredTasks.filter(t => t.status === 'completed')
  } : null

  const statusOptions = [
    { value: 'todo', label: 'To Do', color: 'bg-gray-100' },
    { value: 'in_progress', label: 'In Progress', color: 'bg-blue-100' },
    { value: 'review', label: 'Review', color: 'bg-yellow-100' },
    { value: 'completed', label: 'Completed', color: 'bg-green-100' }
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tasks</h1>
          <p className="text-gray-600">Manage and track your tasks and assignments.</p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex bg-gray-100 rounded-lg">
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              List
            </Button>
            <Button
              variant={viewMode === 'board' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('board')}
            >
              Board
            </Button>
          </div>
          {canCreateTasks() && (
            <Button onClick={() => setShowCreateTask(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Task
            </Button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-7 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <CheckSquare className="h-8 w-8 text-blue-600 mx-auto mb-2" />
            <div className="text-2xl font-bold">{taskStats.totalTasks}</div>
            <div className="text-sm text-gray-600">Total</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Square className="h-8 w-8 text-gray-600 mx-auto mb-2" />
            <div className="text-2xl font-bold">{taskStats.todoTasks}</div>
            <div className="text-sm text-gray-600">To Do</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Clock className="h-8 w-8 text-blue-600 mx-auto mb-2" />
            <div className="text-2xl font-bold">{taskStats.inProgressTasks}</div>
            <div className="text-sm text-gray-600">In Progress</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <div className="text-2xl font-bold">{taskStats.completedTasks}</div>
            <div className="text-sm text-gray-600">Completed</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <AlertCircle className="h-8 w-8 text-red-600 mx-auto mb-2" />
            <div className="text-2xl font-bold">{taskStats.overdueTasks}</div>
            <div className="text-sm text-gray-600">Overdue</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <User className="h-8 w-8 text-purple-600 mx-auto mb-2" />
            <div className="text-2xl font-bold">{taskStats.myTasks}</div>
            <div className="text-sm text-gray-600">Assigned to Me</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <BarChart3 className="h-8 w-8 text-orange-600 mx-auto mb-2" />
            <div className="text-2xl font-bold">{taskStats.avgCompletionTime}d</div>
            <div className="text-sm text-gray-600">Avg Completion</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search tasks..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="todo">To Do</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="review">Review</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
              </SelectContent>
            </Select>
            <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Assignees</SelectItem>
                <SelectItem value="me">Assigned to Me</SelectItem>
                <SelectItem value="unassigned">Unassigned</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tasks Content */}
      {viewMode === 'list' ? (
        /* List View */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Tasks List */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CheckSquare className="h-5 w-5 mr-2" />
                  Tasks ({filteredTasks.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {loading ? (
                  <div className="p-4 text-center text-gray-500">Loading tasks...</div>
                ) : filteredTasks.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">No tasks found</div>
                ) : (
                  <div className="space-y-1">
                    {filteredTasks.map(task => (
                      <button
                        key={task.id}
                        onClick={() => setSelectedTask(task)}
                        className={`w-full text-left p-4 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 ${
                          selectedTask?.id === task.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                        }`}
                      >
                        <div className="space-y-2">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start space-x-2 flex-1 min-w-0">
                              {getStatusIcon(task.status)}
                              <div className="flex-1 min-w-0">
                                <h3 className="font-medium truncate">{task.title}</h3>
                                <p className="text-sm text-gray-500 line-clamp-2">{task.description}</p>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              {getStatusBadge(task.status)}
                              {getPriorityBadge(task.priority)}
                            </div>
                          </div>
                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <div className="flex items-center space-x-2">
                              <span>{task.assignee?.full_name || 'Unassigned'}</span>
                              {task.outlet && (
                                <span className="flex items-center text-blue-600">
                                  <MapPin className="h-3 w-3 mr-1" />
                                  {task.outlet.name}
                                </span>
                              )}
                            </div>
                            {task.due_date && (
                              <span className={getDaysUntilDue(task.due_date)?.color}>
                                {getDaysUntilDue(task.due_date)?.text}
                              </span>
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Task Details */}
          <div className="lg:col-span-2">
            {selectedTask ? (
              <div className="space-y-6">
                {/* Task Header */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <CardTitle>{selectedTask.title}</CardTitle>
                          {getStatusBadge(selectedTask.status)}
                          {getPriorityBadge(selectedTask.priority)}
                        </div>
                        <p className="text-gray-600">{selectedTask.description}</p>
                        <div className="flex items-center space-x-6 mt-3 text-sm text-gray-500">
                          <span className="flex items-center">
                            <User className="h-4 w-4 mr-1" />
                            Assigned: {selectedTask.assignee?.full_name || 'Unassigned'}
                          </span>
                          <span className="flex items-center">
                            <User className="h-4 w-4 mr-1" />
                            Reporter: {selectedTask.reporter?.full_name}
                          </span>
                          {selectedTask.project && (
                            <span className="flex items-center">
                              <Target className="h-4 w-4 mr-1" />
                              {selectedTask.project.name}
                            </span>
                          )}
                          {selectedTask.outlet && (
                            <span className="flex items-center">
                              <MapPin className="h-4 w-4 mr-1" />
                              {selectedTask.outlet.name}
                            </span>
                          )}
                          {selectedTask.due_date && (
                            <span className="flex items-center">
                              <Calendar className="h-4 w-4 mr-1" />
                              Due: {format(parseISO(selectedTask.due_date), 'MMM d, yyyy')}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        {canEditTasks() && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => startEditTask(selectedTask)}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </Button>
                        )}
                        {canDeleteTasks() && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deleteTask(selectedTask.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Status Update */}
                      <div>
                        <Label>Update Status</Label>
                        <div className="flex space-x-2 mt-2">
                          {statusOptions.map(status => (
                            <Button
                              key={status.value}
                              size="sm"
                              variant={selectedTask.status === status.value ? 'default' : 'outline'}
                              onClick={() => updateTaskStatus(selectedTask.id, status.value as Task['status'])}
                            >
                              {status.label}
                            </Button>
                          ))}
                        </div>
                      </div>

                      {/* Time Tracking */}
                      {(selectedTask.estimated_hours || selectedTask.actual_hours) && (
                        <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                          <div>
                            <div className="text-sm text-gray-600">Estimated Hours</div>
                            <div className="text-lg font-medium">{selectedTask.estimated_hours || 0}h</div>
                          </div>
                          <div>
                            <div className="text-sm text-gray-600">Actual Hours</div>
                            <div className="text-lg font-medium">{selectedTask.actual_hours || 0}h</div>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Comments */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <MessageSquare className="h-5 w-5 mr-2" />
                      Comments
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex space-x-3">
                        <div className="h-8 w-8 bg-gray-200 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-gray-700">
                            {currentUser?.email?.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="flex-1 space-y-2">
                          <Textarea
                            placeholder="Add a comment..."
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            rows={3}
                          />
                          <Button size="sm" onClick={addComment}>
                            <MessageSquare className="h-4 w-4 mr-2" />
                            Add Comment
                          </Button>
                        </div>
                      </div>
                      
                      {/* Comments List */}
                      <div className="space-y-4">
                        {selectedTask.comments?.length === 0 ? (
                          <p className="text-center text-gray-500 py-4">No comments yet</p>
                        ) : (
                          selectedTask.comments?.map(comment => (
                            <div key={comment.id} className="flex space-x-3">
                              <div className="h-8 w-8 bg-gray-200 rounded-full flex items-center justify-center">
                                <span className="text-sm font-medium text-gray-700">
                                  {comment.user.full_name.charAt(0)}
                                </span>
                              </div>
                              <div className="flex-1">
                                <div className="bg-gray-50 rounded-lg p-3">
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="font-medium text-sm">{comment.user.full_name}</span>
                                    <span className="text-xs text-gray-500">
                                      {format(parseISO(comment.created_at), 'MMM d, yyyy • HH:mm')}
                                    </span>
                                  </div>
                                  <p className="text-sm">{comment.content}</p>
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <CheckSquare className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No task selected</h3>
                  <p className="text-gray-500">Select a task from the list to view details and manage it.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      ) : (
        /* Board View */
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {statusOptions.map(status => (
            <Card key={status.value}>
              <CardHeader className={`${status.color}`}>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center">
                    {getStatusIcon(status.value)}
                    <span className="ml-2">{status.label}</span>
                  </span>
                  <Badge variant="outline">
                    {groupedTasks?.[status.value as keyof typeof groupedTasks]?.length || 0}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 max-h-96 overflow-y-auto">
                {groupedTasks?.[status.value as keyof typeof groupedTasks]?.map(task => (
                  <Card
                    key={task.id}
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => setSelectedTask(task)}
                  >
                    <CardContent className="p-4 space-y-2">
                      <h4 className="font-medium line-clamp-2">{task.title}</h4>
                      {task.description && (
                        <p className="text-sm text-gray-500 line-clamp-2">{task.description}</p>
                      )}
                      <div className="flex items-center justify-between">
                        {getPriorityBadge(task.priority)}
                        {task.assignee && (
                          <div className="h-6 w-6 bg-gray-200 rounded-full flex items-center justify-center">
                            <span className="text-xs font-medium text-gray-700">
                              {task.assignee.full_name.charAt(0)}
                            </span>
                          </div>
                        )}
                      </div>
                      {task.due_date && (
                        <div className={`text-xs ${getDaysUntilDue(task.due_date)?.color}`}>
                          <Calendar className="h-3 w-3 inline mr-1" />
                          {getDaysUntilDue(task.due_date)?.text}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )) || (
                  <div className="text-center text-gray-400 py-8">
                    No tasks
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Task Modal */}
      {showCreateTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Create New Task</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="taskTitle">Task Title</Label>
                <Input
                  id="taskTitle"
                  value={taskForm.title}
                  onChange={(e) => setTaskForm(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter task title"
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={taskForm.description}
                  onChange={(e) => setTaskForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter task description"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="priority">Priority</Label>
                  <Select
                    value={taskForm.priority}
                    onValueChange={(value: Task['priority']) => setTaskForm(prev => ({ ...prev, priority: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="estimatedHours">Estimated Hours</Label>
                  <Input
                    id="estimatedHours"
                    type="number"
                    value={taskForm.estimated_hours}
                    onChange={(e) => setTaskForm(prev => ({ ...prev, estimated_hours: e.target.value }))}
                    placeholder="0"
                  />
                </div>
              </div>

              {/* Outlet Selection with Search */}
              <div className="outlet-dropdown-container">
                <Label htmlFor="outlet">
                  <MapPin className="h-4 w-4 inline mr-2" />
                  Outlet (Optional)
                </Label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowOutletDropdown(!showOutletDropdown)}
                    className="w-full flex items-center justify-between px-3 py-2 text-sm border border-gray-300 rounded-md bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <span className="truncate">{getSelectedOutletDisplay()}</span>
                    <Search className="h-4 w-4 text-gray-400" />
                  </button>
                  
                  {showOutletDropdown && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
                      <div className="p-2 border-b">
                        <Input
                          placeholder="Search outlets..."
                          value={outletSearchQuery}
                          onChange={(e) => setOutletSearchQuery(e.target.value)}
                          className="w-full"
                        />
                      </div>
                      <div className="max-h-60 overflow-auto">
                        <div
                          className="px-3 py-2 text-sm hover:bg-gray-100 cursor-pointer"
                          onClick={() => {
                            setTaskForm(prev => ({ ...prev, outlet_id: 'none' }))
                            setShowOutletDropdown(false)
                            setOutletSearchQuery('')
                          }}
                        >
                          <span className="font-medium text-gray-500">No outlet</span>
                        </div>
                        {filteredOutlets.map(outlet => (
                          <div
                            key={outlet.id}
                            className="px-3 py-2 text-sm hover:bg-gray-100 cursor-pointer"
                            onClick={() => {
                              setTaskForm(prev => ({ ...prev, outlet_id: outlet.id }))
                              setShowOutletDropdown(false)
                              setOutletSearchQuery('')
                            }}
                          >
                            <div className="flex items-center space-x-2">
                              <MapPin className="h-4 w-4 text-gray-400" />
                              <div>
                                <div className="font-medium">{outlet.name}</div>
                                {outlet.address && (
                                  <div className="text-gray-500 text-xs">{outlet.address}</div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                        {filteredOutlets.length === 0 && outletSearchQuery && (
                          <div className="px-3 py-2 text-sm text-gray-500">
                            No outlets found matching "{outletSearchQuery}"
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Assignment Type Selection */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <Label className="text-base font-semibold flex items-center">
                  <UserCheck className="h-4 w-4 mr-2" />
                  Assignment
                </Label>
                <div className="flex space-x-4 mt-2">
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="assignmentType"
                      value="user"
                      checked={assignmentType === 'user'}
                      onChange={(e) => setAssignmentType(e.target.value as 'user' | 'team')}
                      className="rounded"
                    />
                    <span className="flex items-center">
                      <User className="h-4 w-4 mr-1" />
                      Assign to User
                    </span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="assignmentType"
                      value="team"
                      checked={assignmentType === 'team'}
                      onChange={(e) => setAssignmentType(e.target.value as 'user' | 'team')}
                      className="rounded"
                    />
                    <span className="flex items-center">
                      <Users className="h-4 w-4 mr-1" />
                      Assign to Team
                    </span>
                  </label>
                </div>

                {/* User Assignment with Search */}
                {assignmentType === 'user' && (
                  <div className="mt-3 relative user-dropdown-container">
                    <Label htmlFor="assignee">Select User</Label>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setShowUserDropdown(!showUserDropdown)}
                        className="w-full flex items-center justify-between px-3 py-2 text-sm border border-gray-300 rounded-md bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <span className="truncate">{getSelectedUserDisplay()}</span>
                        <Search className="h-4 w-4 text-gray-400" />
                      </button>
                      
                      {showUserDropdown && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
                          <div className="p-2 border-b">
                            <Input
                              placeholder="Search users..."
                              value={userSearchQuery}
                              onChange={(e) => setUserSearchQuery(e.target.value)}
                              className="w-full"
                            />
                          </div>
                          <div className="max-h-60 overflow-auto">
                            <div
                              className="px-3 py-2 text-sm hover:bg-gray-100 cursor-pointer"
                              onClick={() => {
                                setTaskForm(prev => ({ ...prev, assignee_id: 'none' }))
                                setShowUserDropdown(false)
                                setUserSearchQuery('')
                              }}
                            >
                              <span className="font-medium text-gray-500">Unassigned</span>
                            </div>
                            {filteredUsers.map(user => (
                              <div
                                key={user.id}
                                className="px-3 py-2 text-sm hover:bg-gray-100 cursor-pointer"
                                onClick={() => {
                                  setTaskForm(prev => ({ ...prev, assignee_id: user.id }))
                                  setShowUserDropdown(false)
                                  setUserSearchQuery('')
                                }}
                              >
                                <div className="flex items-center space-x-2">
                                  {user.avatar_url ? (
                                    <img src={user.avatar_url} alt="" className="h-6 w-6 rounded-full" />
                                  ) : (
                                    <div className="h-6 w-6 rounded-full bg-gray-300 flex items-center justify-center">
                                      <User className="h-3 w-3 text-gray-600" />
                                    </div>
                                  )}
                                  <div>
                                    <div className="font-medium">{user.full_name}</div>
                                    <div className="text-gray-500 text-xs">{user.email}</div>
                                    <Badge variant="secondary" className="text-xs mt-1">
                                      {user.role}
                                    </Badge>
                                  </div>
                                </div>
                              </div>
                            ))}
                            {filteredUsers.length === 0 && userSearchQuery && (
                              <div className="px-3 py-2 text-sm text-gray-500">
                                No users found matching "{userSearchQuery}"
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Team Assignment */}
                {assignmentType === 'team' && (
                  <div className="mt-3">
                    <Label htmlFor="team">Select Team</Label>
                    <Select
                      value={taskForm.team_id}
                      onValueChange={(value) => setTaskForm(prev => ({ ...prev, team_id: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select team" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No team</SelectItem>
                        {teams.map(team => (
                          <SelectItem key={team.id} value={team.id}>
                            {team.name} {team.description && `- ${team.description}`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              <div>
                <Label htmlFor="dueDate">Due Date</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={taskForm.due_date}
                  onChange={(e) => setTaskForm(prev => ({ ...prev, due_date: e.target.value }))}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setShowCreateTask(false)}
                >
                  Cancel
                </Button>
                <Button onClick={createTask}>
                  Create Task
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Edit Task Modal */}
      {showEditTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Edit Task</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="editTaskTitle">Task Title</Label>
                <Input
                  id="editTaskTitle"
                  value={taskForm.title}
                  onChange={(e) => setTaskForm(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Enter task title"
                />
              </div>
              <div>
                <Label htmlFor="editDescription">Description</Label>
                <Textarea
                  id="editDescription"
                  value={taskForm.description}
                  onChange={(e) => setTaskForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter task description"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="editPriority">Priority</Label>
                  <Select
                    value={taskForm.priority}
                    onValueChange={(value: Task['priority']) => setTaskForm(prev => ({ ...prev, priority: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="editEstimatedHours">Estimated Hours</Label>
                  <Input
                    id="editEstimatedHours"
                    type="number"
                    value={taskForm.estimated_hours}
                    onChange={(e) => setTaskForm(prev => ({ ...prev, estimated_hours: e.target.value }))}
                    placeholder="0"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="editAssignee">Assignee</Label>
                <Select
                  value={taskForm.assignee_id}
                  onValueChange={(value) => setTaskForm(prev => ({ ...prev, assignee_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select assignee" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Unassigned</SelectItem>
                    {users.map(user => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.full_name} - {user.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="editDueDate">Due Date</Label>
                <Input
                  id="editDueDate"
                  type="date"
                  value={taskForm.due_date}
                  onChange={(e) => setTaskForm(prev => ({ ...prev, due_date: e.target.value }))}
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowEditTask(false)
                    setEditingTask(null)
                    setTaskForm({
                      title: '',
                      description: '',
                      priority: 'medium',
                      assignee_id: 'none',
                      team_id: 'none',
                      project_id: 'none',
                      outlet_id: 'none',
                      due_date: '',
                      estimated_hours: ''
                    })
                  }}
                >
                  Cancel
                </Button>
                <Button onClick={updateTask}>
                  Update Task
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}