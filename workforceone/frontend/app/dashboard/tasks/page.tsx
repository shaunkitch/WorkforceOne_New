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
  Target
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
  comments?: TaskComment[]
  attachments?: TaskAttachment[]
  _count?: {
    comments: number
    attachments: number
  }
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
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [assigneeFilter, setAssigneeFilter] = useState('all')
  const [viewMode, setViewMode] = useState<'list' | 'board'>('list')
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [userProfile, setUserProfile] = useState<any>(null)
  
  // Form state
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    priority: 'medium' as Task['priority'],
    assignee_id: '',
    project_id: '',
    due_date: '',
    estimated_hours: ''
  })
  
  const [newComment, setNewComment] = useState('')
  
  const supabase = createClient()

  useEffect(() => {
    fetchCurrentUser()
    fetchUserProfile()
    fetchTasks()
  }, [statusFilter, priorityFilter, assigneeFilter, searchTerm])

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

  const fetchTasks = async () => {
    try {
      const { data: user } = await supabase.auth.getUser()
      if (!user.user) return

      let query = supabase
        .from('tasks')
        .select(`
          *,
          assignee:profiles!tasks_assignee_id_fkey (
            full_name,
            email,
            avatar_url
          ),
          reporter:profiles!tasks_reporter_id_fkey (
            full_name,
            email
          ),
          project:projects (
            name
          ),
          _count:task_comments(count),
          _count:task_attachments(count)
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

      if (error) throw error
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

      const { data, error } = await supabase
        .from('tasks')
        .insert({
          title: taskForm.title,
          description: taskForm.description,
          priority: taskForm.priority,
          assignee_id: taskForm.assignee_id || null,
          reporter_id: user.user.id,
          project_id: taskForm.project_id || null,
          due_date: taskForm.due_date || null,
          estimated_hours: taskForm.estimated_hours ? parseFloat(taskForm.estimated_hours) : null,
          status: 'todo',
          actual_hours: 0
        })
        .select(`
          *,
          assignee:profiles!tasks_assignee_id_fkey (
            full_name,
            email,
            avatar_url
          ),
          reporter:profiles!tasks_reporter_id_fkey (
            full_name,
            email
          ),
          project:projects (
            name
          )
        `)
        .single()

      if (error) throw error

      setTasks(prev => [data, ...prev])
      setTaskForm({
        title: '',
        description: '',
        priority: 'medium',
        assignee_id: '',
        project_id: '',
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
        comments: [...(prev!.comments || []), data],
        _count: {
          ...prev!._count,
          comments: (prev!._count?.comments || 0) + 1
        }
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
                            <span>{task.assignee?.full_name || 'Unassigned'}</span>
                            {task.due_date && (
                              <span className={getDaysUntilDue(task.due_date)?.color}>
                                {getDaysUntilDue(task.due_date)?.text}
                              </span>
                            )}
                          </div>
                          {(task._count?.comments || task._count?.attachments) && (
                            <div className="flex items-center space-x-4 text-xs text-gray-500">
                              {task._count.comments > 0 && (
                                <span className="flex items-center">
                                  <MessageSquare className="h-3 w-3 mr-1" />
                                  {task._count.comments}
                                </span>
                              )}
                              {task._count.attachments > 0 && (
                                <span className="flex items-center">
                                  <Paperclip className="h-3 w-3 mr-1" />
                                  {task._count.attachments}
                                </span>
                              )}
                            </div>
                          )}
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
                          <Button variant="outline" size="sm">
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
                      Comments ({selectedTask._count?.comments || 0})
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
    </div>
  )
}