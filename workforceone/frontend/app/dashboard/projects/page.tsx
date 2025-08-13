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
  FolderOpen,
  Plus,
  Search,
  Filter,
  Calendar,
  Users,
  Clock,
  Target,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  XCircle,
  Edit,
  Trash2,
  MoreVertical,
  User,
  DollarSign,
  BarChart3,
  FileText
} from 'lucide-react'
import { format, parseISO, differenceInDays, isAfter, isBefore } from 'date-fns'

interface Project {
  id: string
  name: string
  description?: string
  status: 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled'
  priority: 'low' | 'medium' | 'high' | 'critical'
  start_date: string
  end_date?: string
  budget?: number
  spent_budget?: number
  progress: number
  team_id?: string
  project_manager_id?: string
  created_at: string
  updated_at: string
  team?: {
    name: string
  }
  project_manager?: {
    full_name: string
    email: string
  }
  tasks?: Task[]
  _count?: {
    tasks: number
  }
}

interface Task {
  id: string
  title: string
  status: 'todo' | 'in_progress' | 'completed'
  assignee_id?: string
  due_date?: string
}

interface ProjectStats {
  totalProjects: number
  activeProjects: number
  completedProjects: number
  overdueProjects: number
  totalBudget: number
  spentBudget: number
  avgProgress: number
}

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [projectStats, setProjectStats] = useState<ProjectStats>({
    totalProjects: 0,
    activeProjects: 0,
    completedProjects: 0,
    overdueProjects: 0,
    totalBudget: 0,
    spentBudget: 0,
    avgProgress: 0
  })
  const [loading, setLoading] = useState(true)
  const [showCreateProject, setShowCreateProject] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [priorityFilter, setPriorityFilter] = useState('all')
  const [organizationSettings, setOrganizationSettings] = useState<any>(null)
  
  // Form state
  const [projectForm, setProjectForm] = useState({
    name: '',
    description: '',
    status: 'planning' as Project['status'],
    priority: 'medium' as Project['priority'],
    start_date: '',
    end_date: '',
    budget: '',
    team_id: ''
  })
  
  const supabase = createClient()

  useEffect(() => {
    fetchOrganizationSettings()
    fetchProjects()
  }, [statusFilter, priorityFilter, searchTerm])

  const fetchOrganizationSettings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single()

      if (profile?.organization_id) {
        const { data: orgSettings } = await supabase
          .from('organization_settings')
          .select('*')
          .eq('organization_id', profile.organization_id)
          .single()

        if (orgSettings) {
          setOrganizationSettings(orgSettings)
        }
      }
    } catch (error) {
      console.error('Error fetching organization settings:', error)
    }
  }

  useEffect(() => {
    calculateStats()
  }, [projects])

  const fetchProjects = async () => {
    try {
      const { data: user } = await supabase.auth.getUser()
      if (!user.user) return

      let query = supabase
        .from('projects')
        .select(`
          *,
          team:teams (
            name
          ),
          project_manager:profiles!projects_project_manager_id_fkey (
            full_name,
            email
          ),
          _count:tasks(count)
        `)
        .order('created_at', { ascending: false })

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter)
      }

      if (priorityFilter !== 'all') {
        query = query.eq('priority', priorityFilter)
      }

      if (searchTerm) {
        query = query.ilike('name', `%${searchTerm}%`)
      }

      const { data, error } = await query

      if (error) throw error
      setProjects(data || [])
      
      // Auto-select first project if none selected
      if (!selectedProject && data && data.length > 0) {
        setSelectedProject(data[0])
      }
    } catch (error) {
      console.error('Error fetching projects:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateStats = () => {
    if (projects.length === 0) return

    const stats = {
      totalProjects: projects.length,
      activeProjects: projects.filter(p => p.status === 'active').length,
      completedProjects: projects.filter(p => p.status === 'completed').length,
      overdueProjects: projects.filter(p => 
        p.end_date && isAfter(new Date(), parseISO(p.end_date)) && p.status !== 'completed'
      ).length,
      totalBudget: projects.reduce((sum, p) => sum + (p.budget || 0), 0),
      spentBudget: projects.reduce((sum, p) => sum + (p.spent_budget || 0), 0),
      avgProgress: projects.reduce((sum, p) => sum + p.progress, 0) / projects.length
    }

    setProjectStats(stats)
  }

  const createProject = async () => {
    if (!projectForm.name || !projectForm.start_date) return

    try {
      const { data: user } = await supabase.auth.getUser()
      if (!user.user) return

      // Get user's organization_id from profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.user.id)
        .single()

      // If no profile or organization, get default organization
      let organizationId = profile?.organization_id
      
      if (!organizationId) {
        const { data: defaultOrg } = await supabase
          .from('organizations')
          .select('id')
          .limit(1)
          .single()
        
        organizationId = defaultOrg?.id
      }

      if (!organizationId) {
        throw new Error('No organization found. Please contact your administrator.')
      }

      const { data, error } = await supabase
        .from('projects')
        .insert({
          name: projectForm.name,
          description: projectForm.description,
          status: projectForm.status,
          priority: projectForm.priority,
          start_date: projectForm.start_date,
          end_date: projectForm.end_date || null,
          budget: projectForm.budget ? parseFloat(projectForm.budget) : null,
          project_manager_id: user.user.id,
          team_id: projectForm.team_id || null,
          organization_id: organizationId,
          progress: 0,
          spent_budget: 0
        })
        .select(`
          *,
          team:teams (
            name
          ),
          project_manager:profiles!projects_project_manager_id_fkey (
            full_name,
            email
          )
        `)
        .single()

      if (error) throw error

      setProjects(prev => [data, ...prev])
      setProjectForm({
        name: '',
        description: '',
        status: 'planning',
        priority: 'medium',
        start_date: '',
        end_date: '',
        budget: '',
        team_id: ''
      })
      setShowCreateProject(false)
      setSelectedProject(data)
    } catch (error) {
      console.error('Error creating project:', error)
      alert('Failed to create project. Please try again.')
    }
  }

  const updateProjectProgress = async (projectId: string, progress: number) => {
    try {
      const { error } = await supabase
        .from('projects')
        .update({ 
          progress,
          status: progress === 100 ? 'completed' : 'active'
        })
        .eq('id', projectId)

      if (error) throw error

      setProjects(prev =>
        prev.map(p => p.id === projectId ? { 
          ...p, 
          progress, 
          status: progress === 100 ? 'completed' : 'active' 
        } : p)
      )

      if (selectedProject && selectedProject.id === projectId) {
        setSelectedProject(prev => prev ? { 
          ...prev, 
          progress, 
          status: progress === 100 ? 'completed' : 'active' 
        } : null)
      }
    } catch (error) {
      console.error('Error updating project progress:', error)
    }
  }

  const deleteProject = async (projectId: string) => {
    if (!confirm('Are you sure you want to delete this project? This action cannot be undone.')) return

    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId)

      if (error) throw error

      setProjects(prev => prev.filter(p => p.id !== projectId))
      if (selectedProject && selectedProject.id === projectId) {
        setSelectedProject(null)
      }
    } catch (error) {
      console.error('Error deleting project:', error)
      alert('Failed to delete project. Please try again.')
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <Clock className="h-4 w-4 text-blue-600" />
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'on_hold':
        return <XCircle className="h-4 w-4 text-yellow-600" />
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-red-600" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      planning: 'secondary',
      active: 'default',
      on_hold: 'secondary',
      completed: 'default',
      cancelled: 'destructive'
    } as const

    const colors = {
      planning: 'bg-gray-100 text-gray-800',
      active: 'bg-blue-100 text-blue-800',
      on_hold: 'bg-yellow-100 text-yellow-800',
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
        {priority.toUpperCase()}
      </Badge>
    )
  }

  const getDaysRemaining = (endDate: string | null) => {
    if (!endDate) return null
    const days = differenceInDays(parseISO(endDate), new Date())
    return days >= 0 ? `${days} days left` : `${Math.abs(days)} days overdue`
  }

  const getBudgetPercentage = (spent: number, total: number) => {
    if (!total) return 0
    return Math.min((spent / total) * 100, 100)
  }

  const formatCurrency = (amount: number) => {
    const currencySymbol = organizationSettings?.currency_symbol || '$'
    return `${currencySymbol}${amount.toLocaleString()}`
  }

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || project.status === statusFilter
    const matchesPriority = priorityFilter === 'all' || project.priority === priorityFilter
    return matchesSearch && matchesStatus && matchesPriority
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
          <p className="text-gray-600">Manage and track your projects.</p>
        </div>
        <Button onClick={() => setShowCreateProject(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Project
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <FolderOpen className="h-8 w-8 text-blue-600 mx-auto mb-2" />
            <div className="text-2xl font-bold">{projectStats.totalProjects}</div>
            <div className="text-sm text-gray-600">Total</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Clock className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <div className="text-2xl font-bold">{projectStats.activeProjects}</div>
            <div className="text-sm text-gray-600">Active</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <CheckCircle className="h-8 w-8 text-blue-600 mx-auto mb-2" />
            <div className="text-2xl font-bold">{projectStats.completedProjects}</div>
            <div className="text-sm text-gray-600">Completed</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <AlertCircle className="h-8 w-8 text-red-600 mx-auto mb-2" />
            <div className="text-2xl font-bold">{projectStats.overdueProjects}</div>
            <div className="text-sm text-gray-600">Overdue</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <DollarSign className="h-8 w-8 text-purple-600 mx-auto mb-2" />
            <div className="text-2xl font-bold">{formatCurrency(projectStats.totalBudget)}</div>
            <div className="text-sm text-gray-600">Budget</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <BarChart3 className="h-8 w-8 text-orange-600 mx-auto mb-2" />
            <div className="text-2xl font-bold">{formatCurrency(projectStats.spentBudget)}</div>
            <div className="text-sm text-gray-600">Spent</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <TrendingUp className="h-8 w-8 text-indigo-600 mx-auto mb-2" />
            <div className="text-2xl font-bold">{projectStats.avgProgress.toFixed(0)}%</div>
            <div className="text-sm text-gray-600">Avg Progress</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Projects List */}
        <div className="lg:col-span-1 space-y-4">
          {/* Search and Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search projects..."
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
                      <SelectItem value="planning">Planning</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="on_hold">On Hold</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                    <SelectTrigger>
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
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Projects List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FolderOpen className="h-5 w-5 mr-2" />
                Projects ({filteredProjects.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="p-4 text-center text-gray-500">Loading projects...</div>
              ) : filteredProjects.length === 0 ? (
                <div className="p-4 text-center text-gray-500">No projects found</div>
              ) : (
                <div className="space-y-1">
                  {filteredProjects.map(project => (
                    <button
                      key={project.id}
                      onClick={() => setSelectedProject(project)}
                      className={`w-full text-left p-4 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 ${
                        selectedProject?.id === project.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium truncate">{project.name}</h3>
                            <p className="text-sm text-gray-500 line-clamp-2">{project.description}</p>
                          </div>
                          {getStatusIcon(project.status)}
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex space-x-1">
                            {getStatusBadge(project.status)}
                            {getPriorityBadge(project.priority)}
                          </div>
                          <span className="text-xs text-gray-500">{project.progress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${project.progress}%` }}
                          />
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Project Details */}
        <div className="lg:col-span-2 space-y-6">
          {selectedProject ? (
            <>
              {/* Project Header */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <CardTitle>{selectedProject.name}</CardTitle>
                        {getStatusBadge(selectedProject.status)}
                        {getPriorityBadge(selectedProject.priority)}
                      </div>
                      <p className="text-gray-600">{selectedProject.description}</p>
                      <div className="flex items-center space-x-6 mt-3 text-sm text-gray-500">
                        {selectedProject.project_manager && (
                          <span className="flex items-center">
                            <User className="h-4 w-4 mr-1" />
                            {selectedProject.project_manager.full_name}
                          </span>
                        )}
                        {selectedProject.team && (
                          <span className="flex items-center">
                            <Users className="h-4 w-4 mr-1" />
                            {selectedProject.team.name}
                          </span>
                        )}
                        <span className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          {format(parseISO(selectedProject.start_date), 'MMM d, yyyy')}
                          {selectedProject.end_date && ` - ${format(parseISO(selectedProject.end_date), 'MMM d, yyyy')}`}
                        </span>
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteProject(selectedProject.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Progress Section */}
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Label>Progress</Label>
                        <span className="text-sm font-medium">{selectedProject.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div
                          className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                          style={{ width: `${selectedProject.progress}%` }}
                        />
                      </div>
                      <div className="flex space-x-2 mt-2">
                        {[0, 25, 50, 75, 100].map(percent => (
                          <Button
                            key={percent}
                            size="sm"
                            variant="outline"
                            onClick={() => updateProjectProgress(selectedProject.id, percent)}
                          >
                            {percent}%
                          </Button>
                        ))}
                      </div>
                    </div>

                    {/* Budget Information */}
                    {selectedProject.budget && (
                      <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                        <div>
                          <div className="text-sm text-gray-600">Total Budget</div>
                          <div className="text-lg font-medium">{formatCurrency(selectedProject.budget)}</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-600">Spent</div>
                          <div className="text-lg font-medium">{formatCurrency(selectedProject.spent_budget || 0)}</div>
                        </div>
                        <div className="col-span-2">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-gray-600">Budget Usage</span>
                            <span className="text-sm font-medium">
                              {getBudgetPercentage(selectedProject.spent_budget || 0, selectedProject.budget).toFixed(1)}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full transition-all duration-300 ${
                                getBudgetPercentage(selectedProject.spent_budget || 0, selectedProject.budget) > 90
                                  ? 'bg-red-600'
                                  : getBudgetPercentage(selectedProject.spent_budget || 0, selectedProject.budget) > 75
                                  ? 'bg-yellow-600'
                                  : 'bg-green-600'
                              }`}
                              style={{ 
                                width: `${getBudgetPercentage(selectedProject.spent_budget || 0, selectedProject.budget)}%` 
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Timeline */}
                    {selectedProject.end_date && (
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-sm text-gray-600">Timeline</div>
                            <div className="font-medium">
                              {format(parseISO(selectedProject.start_date), 'MMM d, yyyy')} - {format(parseISO(selectedProject.end_date), 'MMM d, yyyy')}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-gray-600">Status</div>
                            <div className={`font-medium ${
                              getDaysRemaining(selectedProject.end_date)?.includes('overdue') 
                                ? 'text-red-600' 
                                : 'text-green-600'
                            }`}>
                              {getDaysRemaining(selectedProject.end_date)}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Task Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center">
                      <Target className="h-5 w-5 mr-2" />
                      Tasks ({selectedProject._count?.tasks || 0})
                    </span>
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Task
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">Task management integration coming soon</p>
                    <p className="text-sm text-gray-400 mt-2">
                      Tasks will be displayed here once the Tasks module is integrated
                    </p>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <FolderOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No project selected</h3>
                <p className="text-gray-500">Select a project from the list to view details and manage tasks.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Create Project Modal */}
      {showCreateProject && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Create New Project</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="projectName">Project Name</Label>
                  <Input
                    id="projectName"
                    value={projectForm.name}
                    onChange={(e) => setProjectForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter project name"
                  />
                </div>
                <div>
                  <Label htmlFor="budget">Budget (Optional)</Label>
                  <Input
                    id="budget"
                    type="number"
                    value={projectForm.budget}
                    onChange={(e) => setProjectForm(prev => ({ ...prev, budget: e.target.value }))}
                    placeholder="0"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={projectForm.description}
                  onChange={(e) => setProjectForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter project description"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={projectForm.status}
                    onValueChange={(value: Project['status']) => setProjectForm(prev => ({ ...prev, status: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="planning">Planning</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="on_hold">On Hold</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="priority">Priority</Label>
                  <Select
                    value={projectForm.priority}
                    onValueChange={(value: Project['priority']) => setProjectForm(prev => ({ ...prev, priority: value }))}
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
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={projectForm.start_date}
                    onChange={(e) => setProjectForm(prev => ({ ...prev, start_date: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="endDate">End Date (Optional)</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={projectForm.end_date}
                    onChange={(e) => setProjectForm(prev => ({ ...prev, end_date: e.target.value }))}
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setShowCreateProject(false)}
                >
                  Cancel
                </Button>
                <Button onClick={createProject}>
                  Create Project
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}