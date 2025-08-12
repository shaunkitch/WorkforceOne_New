'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Zap, 
  Plus, 
  Play, 
  Pause, 
  Settings, 
  Trash2, 
  Edit, 
  Clock, 
  Target,
  Activity,
  BarChart3,
  Workflow,
  Loader2
} from 'lucide-react'

interface WorkflowTemplate {
  id: string
  name: string
  description: string | null
  category: string
  is_active: boolean
  trigger_type: string
  trigger_config: any
  created_at: string
  updated_at: string
}

interface WorkflowStats {
  totalTemplates: number
  activeTemplates: number
  runningInstances: number
  completedToday: number
}

export default function AutomationPage() {
  const [templates, setTemplates] = useState<WorkflowTemplate[]>([])
  const [stats, setStats] = useState<WorkflowStats>({
    totalTemplates: 0,
    activeTemplates: 0,
    runningInstances: 0,
    completedToday: 0
  })
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [userProfile, setUserProfile] = useState<any>(null)

  const supabase = createClient()

  useEffect(() => {
    fetchUserProfile()
    fetchWorkflowData()
  }, [])

  const fetchUserProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      setUserProfile(profile)
    } catch (error) {
      console.error('Error fetching user profile:', error)
    }
  }

  const fetchWorkflowData = async () => {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single()

      if (!profile?.organization_id) return

      // Fetch workflow templates
      const { data: templatesData, error: templatesError } = await supabase
        .from('workflow_templates')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .order('created_at', { ascending: false })

      if (templatesError) throw templatesError
      setTemplates(templatesData || [])

      // Fetch workflow statistics
      const today = new Date().toISOString().split('T')[0]
      
      const [activeTemplatesResult, runningInstancesResult, completedTodayResult] = await Promise.all([
        supabase
          .from('workflow_templates')
          .select('*', { count: 'exact' })
          .eq('organization_id', profile.organization_id)
          .eq('is_active', true),
        
        supabase
          .from('workflow_instances')
          .select('*', { count: 'exact' })
          .eq('organization_id', profile.organization_id)
          .in('status', ['active']),
        
        supabase
          .from('workflow_instances')
          .select('*', { count: 'exact' })
          .eq('organization_id', profile.organization_id)
          .eq('status', 'completed')
          .gte('completed_at', `${today}T00:00:00.000Z`)
          .lt('completed_at', `${today}T23:59:59.999Z`)
      ])

      setStats({
        totalTemplates: templatesData?.length || 0,
        activeTemplates: activeTemplatesResult.count || 0,
        runningInstances: runningInstancesResult.count || 0,
        completedToday: completedTodayResult.count || 0
      })

    } catch (error) {
      console.error('Error fetching workflow data:', error)
    } finally {
      setLoading(false)
    }
  }

  const canManageWorkflows = () => {
    return userProfile?.role === 'admin' || userProfile?.role === 'manager'
  }

  const toggleWorkflowStatus = async (templateId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('workflow_templates')
        .update({ is_active: !currentStatus })
        .eq('id', templateId)

      if (error) throw error
      await fetchWorkflowData()
    } catch (error) {
      console.error('Error toggling workflow:', error)
    }
  }

  const deleteWorkflow = async (templateId: string) => {
    if (!window.confirm('Are you sure you want to delete this workflow? This action cannot be undone.')) {
      return
    }

    try {
      const { error } = await supabase
        .from('workflow_templates')
        .delete()
        .eq('id', templateId)

      if (error) throw error
      await fetchWorkflowData()
    } catch (error) {
      console.error('Error deleting workflow:', error)
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'attendance': return <Clock className="h-4 w-4" />
      case 'leave': return <Target className="h-4 w-4" />
      case 'tasks': return <Activity className="h-4 w-4" />
      case 'forms': return <BarChart3 className="h-4 w-4" />
      default: return <Workflow className="h-4 w-4" />
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'attendance': return 'bg-blue-500'
      case 'leave': return 'bg-green-500'
      case 'tasks': return 'bg-orange-500'
      case 'forms': return 'bg-purple-500'
      default: return 'bg-gray-500'
    }
  }

  const getTriggerTypeLabel = (triggerType: string) => {
    switch (triggerType) {
      case 'time_based': return 'Scheduled'
      case 'event_based': return 'Event Triggered'
      case 'manual': return 'Manual'
      default: return triggerType
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-gray-600">Loading automation workflows...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Workflow Automation
          </h1>
          <p className="text-gray-600 mt-1">
            Automate your workforce management with intelligent workflows
          </p>
        </div>
        {canManageWorkflows() && (
          <Button 
            onClick={() => setShowCreateModal(true)}
            className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Workflow
          </Button>
        )}
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Workflows
            </CardTitle>
            <Workflow className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{stats.totalTemplates}</div>
            <p className="text-xs text-gray-500 mt-1">
              All workflow templates
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Active Workflows
            </CardTitle>
            <Play className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{stats.activeTemplates}</div>
            <p className="text-xs text-gray-500 mt-1">
              Currently enabled
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Running Now
            </CardTitle>
            <Activity className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{stats.runningInstances}</div>
            <p className="text-xs text-gray-500 mt-1">
              Active executions
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Completed Today
            </CardTitle>
            <BarChart3 className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{stats.completedToday}</div>
            <p className="text-xs text-gray-500 mt-1">
              Successful runs
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Workflow Templates */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-900">Your Workflows</h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {templates.map((template) => (
            <Card key={template.id} className="group hover:shadow-lg transition-all duration-200">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className={`p-2 rounded-full ${getCategoryColor(template.category)} text-white`}>
                      {getCategoryIcon(template.category)}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">{template.name}</h3>
                      <p className="text-sm text-gray-500 capitalize">{template.category}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {canManageWorkflows() && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleWorkflowStatus(template.id, template.is_active)}
                          className="h-8 w-8 p-0"
                        >
                          {template.is_active ? (
                            <Pause className="h-4 w-4 text-orange-600" />
                          ) : (
                            <Play className="h-4 w-4 text-green-600" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteWorkflow(template.id)}
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </CardTitle>
              </CardHeader>

              <CardContent>
                <div className="space-y-3">
                  <p className="text-sm text-gray-600">
                    {template.description || 'No description provided'}
                  </p>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Trigger:</span>
                    <span className="font-medium">{getTriggerTypeLabel(template.trigger_type)}</span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Status:</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      template.is_active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {template.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              </CardContent>

              <CardFooter>
                <Button variant="outline" className="w-full">
                  <Settings className="h-4 w-4 mr-2" />
                  View Details
                </Button>
              </CardFooter>
            </Card>
          ))}

          {/* Empty State */}
          {templates.length === 0 && (
            <div className="col-span-full">
              <Card className="border-dashed border-2 border-gray-300">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Zap className="h-12 w-12 text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No workflows yet</h3>
                  <p className="text-gray-600 text-center mb-4">
                    Create your first workflow to automate your workforce management
                  </p>
                  {canManageWorkflows() && (
                    <Button onClick={() => setShowCreateModal(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create First Workflow
                    </Button>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>

      {/* System Templates Section */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-900">Popular Templates</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <TemplateCard
            title="Late Check-in Alert"
            description="Automatically notify managers when employees check in late"
            category="attendance"
            triggerType="Event"
            icon={<Clock className="h-5 w-5" />}
            onUse={() => console.log('Use template')}
          />
          
          <TemplateCard
            title="Leave Approval Chain"
            description="Streamline leave request approvals with automatic routing"
            category="leave"
            triggerType="Event"
            icon={<Target className="h-5 w-5" />}
            onUse={() => console.log('Use template')}
          />
          
          <TemplateCard
            title="Overdue Task Reminder"
            description="Send reminders for tasks that are approaching or past due"
            category="tasks"
            triggerType="Schedule"
            icon={<Activity className="h-5 w-5" />}
            onUse={() => console.log('Use template')}
          />
        </div>
      </div>

      {/* Create Workflow Modal */}
      {showCreateModal && (
        <CreateWorkflowModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={fetchWorkflowData}
        />
      )}
    </div>
  )
}

// Template Card Component
interface TemplateCardProps {
  title: string
  description: string
  category: string
  triggerType: string
  icon: React.ReactNode
  onUse: () => void
}

function TemplateCard({ title, description, category, triggerType, icon, onUse }: TemplateCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
            {icon}
          </div>
          <div>
            <h3 className="text-sm font-semibold">{title}</h3>
            <p className="text-xs text-gray-500 capitalize">{category} • {triggerType}</p>
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <p className="text-sm text-gray-600">{description}</p>
      </CardContent>
      
      <CardFooter>
        <Button variant="outline" size="sm" className="w-full" onClick={onUse}>
          Use Template
        </Button>
      </CardFooter>
    </Card>
  )
}

// Create Workflow Modal Component
interface CreateWorkflowModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

function CreateWorkflowModal({ isOpen, onClose, onSuccess }: CreateWorkflowModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'general',
    trigger_type: 'event_based'
  })
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single()

      if (!profile?.organization_id) throw new Error('No organization found')

      const { error } = await supabase
        .from('workflow_templates')
        .insert([{
          ...formData,
          organization_id: profile.organization_id,
          created_by: user.id,
          trigger_config: {
            trigger_type: formData.trigger_type
          }
        }])

      if (error) throw error

      onSuccess()
      onClose()
    } catch (error) {
      console.error('Error creating workflow:', error)
      alert('Failed to create workflow. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Create Workflow</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Workflow Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter workflow name"
                required
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe what this workflow does"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="category">Category</Label>
              <select
                id="category"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="general">General</option>
                <option value="attendance">Attendance</option>
                <option value="leave">Leave Management</option>
                <option value="tasks">Task Management</option>
                <option value="forms">Forms</option>
              </select>
            </div>

            <div>
              <Label htmlFor="trigger_type">Trigger Type</Label>
              <select
                id="trigger_type"
                value={formData.trigger_type}
                onChange={(e) => setFormData({ ...formData, trigger_type: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="event_based">Event Based</option>
                <option value="time_based">Time Based</option>
                <option value="manual">Manual</option>
              </select>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading || !formData.name.trim()}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Workflow'
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}