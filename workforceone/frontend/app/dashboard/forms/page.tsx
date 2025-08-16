'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
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
  FileText, 
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  Users,
  Calendar,
  BarChart3,
  Send,
  Copy,
  Settings,
  Scan
} from 'lucide-react'
import { format, parseISO } from 'date-fns'

interface Form {
  id: string
  title: string
  description?: string
  status: 'draft' | 'active' | 'paused' | 'completed' | 'archived'
  fields: any[]
  settings: any
  start_date?: string
  end_date?: string
  created_by: string
  created_at: string
  updated_at: string
  _count?: {
    assignments: number
    responses: number
  }
  analytics?: {
    completion_rate: number
    total_assigned: number
    total_completed: number
  }
}

interface FormTemplate {
  id: string
  title: string
  description?: string
  category: string
  fields: any[]
  is_active: boolean
  created_at: string
}

export default function FormsPage() {
  const [forms, setForms] = useState<Form[]>([])
  const [templates, setTemplates] = useState<FormTemplate[]>([])
  const [selectedForm, setSelectedForm] = useState<Form | null>(null)
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [showCreateTemplate, setShowCreateTemplate] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [view, setView] = useState<'forms' | 'templates'>('forms')
  const [userProfile, setUserProfile] = useState<any>(null)
  
  // Form creation state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'custom',
    template_id: '',
    start_date: '',
    end_date: ''
  })

  const supabase = createClient()
  const router = useRouter()

  const categories = [
    'feedback',
    'evaluation', 
    'survey',
    'assessment',
    'onboarding',
    'custom'
  ]

  useEffect(() => {
    fetchUserProfile()
    fetchForms()
    fetchTemplates()
  }, [statusFilter, searchTerm])

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
  const canCreateForms = () => {
    return userProfile?.role === 'admin' || userProfile?.role === 'manager'
  }

  const canEditForms = () => {
    return userProfile?.role === 'admin' || userProfile?.role === 'manager'
  }

  const canDeleteForms = () => {
    return userProfile?.role === 'admin'
  }

  const fetchForms = async () => {
    try {
      const { data: user } = await supabase.auth.getUser()
      if (!user.user) return

      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id, role')
        .eq('id', user.user.id)
        .single()

      if (!profile?.organization_id) return

      // For members, only show forms assigned to them
      // For managers/admins, show all forms in organization
      let query

      if (profile.role === 'member') {
        // Members only see forms assigned to them
        query = supabase
          .from('forms')
          .select(`
            *,
            form_assignments!inner(user_id),
            form_responses(count)
          `)
          .eq('organization_id', profile.organization_id)
          .eq('form_assignments.user_id', user.user.id)
          .order('created_at', { ascending: false })
      } else {
        // Managers and admins see all forms in their organization
        query = supabase
          .from('forms')
          .select(`
            *,
            form_assignments(count),
            form_responses(count)
          `)
          .eq('organization_id', profile.organization_id)
          .order('created_at', { ascending: false })
      }

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter)
      }

      if (searchTerm) {
        query = query.ilike('title', `%${searchTerm}%`)
      }

      const { data, error } = await query

      if (error) throw error

      // Process the data to include counts
      const processedForms = data?.map(form => ({
        ...form,
        _count: {
          assignments: form.form_assignments?.length || 0,
          responses: form.form_responses?.length || 0
        }
      })) || []

      setForms(processedForms)
    } catch (error) {
      console.error('Error fetching forms:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchTemplates = async () => {
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
        .from('form_templates')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (error) throw error
      setTemplates(data || [])
    } catch (error) {
      console.error('Error fetching templates:', error)
    }
  }

  const createForm = async () => {
    if (!formData.title) return

    try {
      const { data: user } = await supabase.auth.getUser()
      if (!user.user) return

      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.user.id)
        .single()

      if (!profile?.organization_id) return

      // Get template fields if creating from template
      let fields: any[] = []
      if (formData.template_id && formData.template_id !== 'none') {
        const { data: template } = await supabase
          .from('form_templates')
          .select('fields')
          .eq('id', formData.template_id)
          .single()
        
        fields = template?.fields || []
      }

      const { data, error } = await supabase
        .from('forms')
        .insert({
          title: formData.title,
          description: formData.description,
          organization_id: profile.organization_id,
          template_id: (formData.template_id && formData.template_id !== 'none') ? formData.template_id : null,
          fields: fields,
          settings: {},
          status: 'draft',
          start_date: formData.start_date || null,
          end_date: formData.end_date || null,
          created_by: user.user.id
        })
        .select()
        .single()

      if (error) throw error

      setForms([data, ...forms])
      setFormData({ title: '', description: '', category: 'custom', template_id: '', start_date: '', end_date: '' })
      setShowCreateForm(false)
    } catch (error) {
      console.error('Error creating form:', error)
      alert('Failed to create form. Please try again.')
    }
  }

  const deleteForm = async (formId: string) => {
    if (!confirm('Are you sure you want to delete this form?')) return

    try {
      const { error } = await supabase
        .from('forms')
        .delete()
        .eq('id', formId)

      if (error) throw error

      setForms(forms.filter(f => f.id !== formId))
      if (selectedForm?.id === formId) {
        setSelectedForm(null)
      }
    } catch (error) {
      console.error('Error deleting form:', error)
      alert('Failed to delete form. Please try again.')
    }
  }

  const updateFormStatus = async (formId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('forms')
        .update({ status: newStatus })
        .eq('id', formId)

      if (error) throw error

      setForms(forms.map(f => 
        f.id === formId ? { ...f, status: newStatus as any } : f
      ))
    } catch (error) {
      console.error('Error updating form status:', error)
      alert('Failed to update form status. Please try again.')
    }
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      draft: 'secondary',
      active: 'default',
      paused: 'outline',
      completed: 'success',
      archived: 'muted'
    } as const

    const colors = {
      draft: 'bg-gray-100 text-gray-800',
      active: 'bg-green-100 text-green-800',
      paused: 'bg-yellow-100 text-yellow-800',
      completed: 'bg-blue-100 text-blue-800',
      archived: 'bg-gray-100 text-gray-600'
    }

    return (
      <Badge className={colors[status as keyof typeof colors]}>
        {status.toUpperCase()}
      </Badge>
    )
  }

  const getFormCounts = () => {
    return {
      all: forms.length,
      draft: forms.filter(f => f.status === 'draft').length,
      active: forms.filter(f => f.status === 'active').length,
      completed: forms.filter(f => f.status === 'completed').length,
    }
  }

  const formCounts = getFormCounts()
  const filteredForms = forms.filter(form =>
    form.title.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Forms</h1>
          <p className="text-gray-600">Create and manage custom forms for your organization.</p>
        </div>
        <div className="flex space-x-3">
          <Button 
            variant="outline" 
            onClick={() => window.open('/dashboard/forms/templates', '_blank')}
          >
            View Templates
          </Button>
          <Button 
            variant="outline" 
            onClick={() => window.open('/dashboard/forms/my-forms', '_blank')}
          >
            My Forms
          </Button>
          {canCreateForms() && (
            <>
              <Button onClick={() => setShowCreateForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Form
              </Button>
              <Button 
                variant="outline" 
                onClick={() => router.push('/dashboard/forms/scan')}
              >
                <Scan className="h-4 w-4 mr-2" />
                Scan Form
              </Button>
            </>
          )}
        </div>
      </div>

      {view === 'forms' && (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <FileText className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <div className="text-2xl font-bold">{formCounts.all}</div>
                <div className="text-sm text-gray-600">Total Forms</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <Calendar className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <div className="text-2xl font-bold">{formCounts.active}</div>
                <div className="text-sm text-gray-600">Active Forms</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <Users className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                <div className="text-2xl font-bold">
                  {forms.reduce((sum, f) => sum + (f._count?.responses || 0), 0)}
                </div>
                <div className="text-sm text-gray-600">Total Responses</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <BarChart3 className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                <div className="text-2xl font-bold">{formCounts.completed}</div>
                <div className="text-sm text-gray-600">Completed Forms</div>
              </CardContent>
            </Card>
          </div>

          {/* Search and Filter */}
          <Card>
            <CardContent className="p-4">
              <div className="flex space-x-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search forms..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="paused">Paused</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Forms List */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {loading ? (
              <div className="col-span-full text-center py-8">
                <div className="text-gray-500">Loading forms...</div>
              </div>
            ) : filteredForms.length === 0 ? (
              <div className="col-span-full text-center py-8">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No forms found</h3>
                <p className="text-gray-500 mb-4">Get started by creating your first form.</p>
                {canCreateForms() && (
                  <div className="flex gap-2 justify-center">
                    <Button onClick={() => setShowCreateForm(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Form
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => router.push('/dashboard/forms/scan')}
                    >
                      <Scan className="h-4 w-4 mr-2" />
                      Scan Form
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              filteredForms.map(form => (
                <Card key={form.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg truncate">{form.title}</CardTitle>
                        {form.description && (
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">{form.description}</p>
                        )}
                      </div>
                      <div className="ml-2">
                        {getStatusBadge(form.status)}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>Assignments: {form._count?.assignments || 0}</span>
                        <span>Responses: {form._count?.responses || 0}</span>
                      </div>
                      
                      <div className="text-xs text-gray-500">
                        Created {format(parseISO(form.created_at), 'MMM d, yyyy')}
                      </div>

                      <div className="flex space-x-2">
                        {/* Members can fill assigned forms, managers/admins can view analytics */}
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="flex-1"
                          onClick={() => window.open(
                            userProfile?.role === 'member' 
                              ? `/dashboard/forms/fill/${form.id}` 
                              : `/dashboard/forms/analytics/${form.id}`, 
                            '_blank'
                          )}
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          {userProfile?.role === 'member' ? 'Fill' : 'View'}
                        </Button>
                        
                        {/* Only managers and admins can edit forms */}
                        {canEditForms() && (
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="flex-1"
                            onClick={() => window.open(`/dashboard/forms/builder/${form.id}`, '_blank')}
                          >
                            <Edit className="h-3 w-3 mr-1" />
                            Edit
                          </Button>
                        )}
                        
                        {/* Only managers and admins can assign forms */}
                        {canEditForms() && (
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="flex-1"
                            onClick={() => window.open(`/dashboard/forms/assign/${form.id}`, '_blank')}
                          >
                            <Users className="h-3 w-3 mr-1" />
                            Assign
                          </Button>
                        )}
                      </div>

                      {/* Only managers and admins can manage form status and delete */}
                      {canEditForms() && (
                        <div className="flex space-x-1">
                          {form.status === 'draft' && (
                            <Button 
                              size="sm" 
                              onClick={() => updateFormStatus(form.id, 'active')}
                              className="flex-1"
                            >
                              <Send className="h-3 w-3 mr-1" />
                              Publish
                            </Button>
                          )}
                          {form.status === 'active' && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => updateFormStatus(form.id, 'paused')}
                              className="flex-1"
                            >
                              Pause
                            </Button>
                          )}
                          {canDeleteForms() && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => deleteForm(form.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </>
      )}

      {view === 'templates' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {templates.map(template => (
            <Card key={template.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <CardTitle className="text-lg">{template.title}</CardTitle>
                {template.description && (
                  <p className="text-sm text-gray-600">{template.description}</p>
                )}
                <Badge variant="outline">{template.category}</Badge>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="text-sm text-gray-600">
                    {template.fields.length} fields
                  </div>
                  
                  <div className="text-xs text-gray-500">
                    Created {format(parseISO(template.created_at), 'MMM d, yyyy')}
                  </div>

                  <div className="flex space-x-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="flex-1"
                      onClick={() => window.open(`/dashboard/forms/builder/${template.id}`, '_blank')}
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      Preview
                    </Button>
                    {canCreateForms() && (
                      <Button 
                        size="sm" 
                        className="flex-1"
                        onClick={() => {
                          setFormData({...formData, template_id: template.id, title: template.title})
                          setShowCreateForm(true)
                        }}
                      >
                        <Copy className="h-3 w-3 mr-1" />
                        Use Template
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Form Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Create New Form</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="formTitle">Form Title</Label>
                <Input
                  id="formTitle"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  placeholder="Enter form title"
                />
              </div>
              
              <div>
                <Label htmlFor="formDescription">Description (Optional)</Label>
                <Textarea
                  id="formDescription"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Enter form description"
                />
              </div>

              <div>
                <Label htmlFor="template">Use Template (Optional)</Label>
                <Select 
                  value={formData.template_id} 
                  onValueChange={(value) => setFormData({...formData, template_id: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a template" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Template</SelectItem>
                    {templates.map(template => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.title} ({template.category})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startDate">Start Date (Optional)</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="endDate">End Date (Optional)</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowCreateForm(false)
                    setFormData({ title: '', description: '', category: 'custom', template_id: '', start_date: '', end_date: '' })
                  }}
                >
                  Cancel
                </Button>
                <Button onClick={createForm}>
                  Create Form
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}