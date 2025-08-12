'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Settings, 
  Plus, 
  Play, 
  Pause, 
  Trash2, 
  Edit, 
  Clock, 
  Target,
  Activity,
  BarChart3,
  Workflow,
  Loader2,
  AlertTriangle,
  CheckCircle,
  Zap
} from 'lucide-react'

interface TriggerConfig {
  id: string
  trigger_name: string
  trigger_type: string
  event_source: string
  template_name: string
  template_id: string
  is_active: boolean
  cooldown_minutes: number
  last_triggered_at: string | null
  conditions: any[]
  created_at: string
}

interface WorkflowTemplate {
  id: string
  name: string
  category: string
  is_active: boolean
}

export default function TriggersPage() {
  const [triggers, setTriggers] = useState<TriggerConfig[]>([])
  const [templates, setTemplates] = useState<WorkflowTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [userProfile, setUserProfile] = useState<any>(null)

  const supabase = createClient()

  useEffect(() => {
    fetchUserProfile()
    fetchTriggersData()
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

  const fetchTriggersData = async () => {
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

      // Fetch workflow trigger configurations with template names
      const { data: triggersData } = await supabase
        .from('workflow_trigger_config')
        .select(`
          *,
          workflow_templates (
            name,
            category,
            is_active
          )
        `)
        .eq('organization_id', profile.organization_id)
        .order('created_at', { ascending: false })

      // Transform the data to include template name
      const transformedTriggers = triggersData?.map(trigger => ({
        ...trigger,
        template_name: trigger.workflow_templates?.name || 'Unknown Template'
      })) || []

      setTriggers(transformedTriggers)

      // Fetch available workflow templates for creating new triggers
      const { data: templatesData } = await supabase
        .from('workflow_templates')
        .select('id, name, category, is_active')
        .eq('organization_id', profile.organization_id)
        .eq('is_active', true)

      setTemplates(templatesData || [])

    } catch (error) {
      console.error('Error fetching triggers data:', error)
    } finally {
      setLoading(false)
    }
  }

  const canManageTriggers = () => {
    return userProfile?.role === 'admin' || userProfile?.role === 'manager'
  }

  const toggleTriggerStatus = async (triggerId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('workflow_trigger_config')
        .update({ is_active: !currentStatus })
        .eq('id', triggerId)

      if (error) throw error
      await fetchTriggersData()
    } catch (error) {
      console.error('Error toggling trigger:', error)
    }
  }

  const deleteTrigger = async (triggerId: string) => {
    if (!window.confirm('Are you sure you want to delete this trigger? This action cannot be undone.')) {
      return
    }

    try {
      const { error } = await supabase
        .from('workflow_trigger_config')
        .delete()
        .eq('id', triggerId)

      if (error) throw error
      await fetchTriggersData()
    } catch (error) {
      console.error('Error deleting trigger:', error)
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
      case 'attendance_event': return 'Attendance Event'
      case 'leave_event': return 'Leave Event'
      case 'task_event': return 'Task Event'
      case 'form_event': return 'Form Event'
      case 'general_event': return 'General Event'
      default: return triggerType
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-gray-600">Loading workflow triggers...</p>
        </div>
      </div>
    )
  }

  if (!canManageTriggers()) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-orange-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Access Restricted</h3>
          <p className="text-gray-600">Only administrators and managers can manage workflow triggers.</p>
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
            Workflow Triggers
          </h1>
          <p className="text-gray-600 mt-1">
            Manage automated triggers for your workflow templates
          </p>
        </div>
        <Button 
          onClick={() => setShowCreateModal(true)}
          className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Trigger
        </Button>
      </div>

      {/* Trigger Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Active Triggers
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {triggers.filter(t => t.is_active).length}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Currently monitoring events
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Triggers
            </CardTitle>
            <Zap className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {triggers.length}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              All configured triggers
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Recently Triggered
            </CardTitle>
            <Activity className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {triggers.filter(t => t.last_triggered_at && 
                new Date(t.last_triggered_at) > new Date(Date.now() - 24 * 60 * 60 * 1000)
              ).length}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              In the last 24 hours
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Triggers List */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-900">Configured Triggers</h2>
        
        <div className="space-y-4">
          {triggers.map((trigger) => (
            <Card key={trigger.id} className="group hover:shadow-lg transition-all duration-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className={`p-3 rounded-full ${getCategoryColor(trigger.workflow_templates?.category || 'general')} text-white`}>
                      {getCategoryIcon(trigger.workflow_templates?.category || 'general')}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{trigger.trigger_name}</h3>
                      <p className="text-sm text-gray-600">Template: {trigger.template_name}</p>
                      <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                        <span>Type: {getTriggerTypeLabel(trigger.trigger_type)}</span>
                        <span>Source: {trigger.event_source}</span>
                        {trigger.cooldown_minutes > 0 && (
                          <span>Cooldown: {trigger.cooldown_minutes}m</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    {/* Status */}
                    <div className="text-right">
                      <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                        trigger.is_active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {trigger.is_active ? 'Active' : 'Inactive'}
                      </div>
                      {trigger.last_triggered_at && (
                        <p className="text-xs text-gray-500 mt-1">
                          Last: {new Date(trigger.last_triggered_at).toLocaleDateString()}
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleTriggerStatus(trigger.id, trigger.is_active)}
                        className="h-8 w-8 p-0"
                      >
                        {trigger.is_active ? (
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
                        onClick={() => deleteTrigger(trigger.id)}
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Empty State */}
          {triggers.length === 0 && (
            <Card className="border-dashed border-2 border-gray-300">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Zap className="h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No triggers configured</h3>
                <p className="text-gray-600 text-center mb-4">
                  Create your first trigger to automate workflow execution
                </p>
                <Button onClick={() => setShowCreateModal(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Trigger
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Create Trigger Modal */}
      {showCreateModal && (
        <CreateTriggerModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={fetchTriggersData}
          templates={templates}
        />
      )}
    </div>
  )
}

// Create Trigger Modal Component
interface CreateTriggerModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  templates: WorkflowTemplate[]
}

function CreateTriggerModal({ isOpen, onClose, onSuccess, templates }: CreateTriggerModalProps) {
  const [formData, setFormData] = useState({
    trigger_name: '',
    template_id: '',
    trigger_type: 'attendance_event',
    event_source: 'attendance',
    cooldown_minutes: 0
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
        .from('workflow_trigger_config')
        .insert([{
          ...formData,
          organization_id: profile.organization_id,
          conditions: []
        }])

      if (error) throw error

      onSuccess()
      onClose()
    } catch (error) {
      console.error('Error creating trigger:', error)
      alert('Failed to create trigger. Please try again.')
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
            <h2 className="text-xl font-semibold text-gray-900">Create Trigger</h2>
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
              <Label htmlFor="trigger_name">Trigger Name</Label>
              <Input
                id="trigger_name"
                value={formData.trigger_name}
                onChange={(e) => setFormData({ ...formData, trigger_name: e.target.value })}
                placeholder="Enter trigger name"
                required
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="template_id">Workflow Template</Label>
              <select
                id="template_id"
                value={formData.template_id}
                onChange={(e) => setFormData({ ...formData, template_id: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Select a template</option>
                {templates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.name} ({template.category})
                  </option>
                ))}
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
                <option value="attendance_event">Attendance Event</option>
                <option value="leave_event">Leave Event</option>
                <option value="task_event">Task Event</option>
                <option value="form_event">Form Event</option>
                <option value="general_event">General Event</option>
              </select>
            </div>

            <div>
              <Label htmlFor="event_source">Event Source</Label>
              <select
                id="event_source"
                value={formData.event_source}
                onChange={(e) => setFormData({ ...formData, event_source: e.target.value })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="attendance">Attendance</option>
                <option value="leave">Leave Management</option>
                <option value="tasks">Task Management</option>
                <option value="forms">Forms</option>
                <option value="general">General</option>
              </select>
            </div>

            <div>
              <Label htmlFor="cooldown_minutes">Cooldown Period (minutes)</Label>
              <Input
                id="cooldown_minutes"
                type="number"
                min="0"
                value={formData.cooldown_minutes}
                onChange={(e) => setFormData({ ...formData, cooldown_minutes: parseInt(e.target.value) || 0 })}
                placeholder="0"
                className="mt-1"
              />
              <p className="text-xs text-gray-500 mt-1">
                Minimum time between trigger executions (0 = no cooldown)
              </p>
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
                disabled={loading || !formData.trigger_name.trim() || !formData.template_id}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Trigger'
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}