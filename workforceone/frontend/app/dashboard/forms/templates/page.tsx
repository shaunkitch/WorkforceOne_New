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
  Plus,
  Eye,
  Copy,
  Edit,
  Trash2,
  Search,
  Filter,
  FileText,
  Star,
  Download,
  Upload
} from 'lucide-react'
import { format, parseISO } from 'date-fns'

interface FormTemplate {
  id: string
  title: string
  description?: string
  category: string
  fields: any[]
  is_active: boolean
  is_template: boolean
  created_by: string
  created_at: string
  updated_at: string
  _usage_count?: number
}

const TEMPLATE_CATEGORIES = [
  'feedback',
  'evaluation',
  'survey',
  'assessment',
  'onboarding',
  'hr',
  'performance',
  'training',
  'incident',
  'request',
  'custom'
]

const PREDEFINED_TEMPLATES = [
  {
    id: 'employee_feedback',
    title: 'Employee Feedback Form',
    description: 'Collect feedback from employees about workplace satisfaction, management, and improvement suggestions.',
    category: 'feedback',
    fields: [
      {
        id: 'section_1',
        type: 'section',
        label: 'Employee Information',
        settings: {
          title: 'Employee Information',
          description: 'Please provide some basic information about yourself.'
        }
      },
      {
        id: 'department',
        type: 'select',
        label: 'Department',
        required: true,
        options: ['Engineering', 'Sales', 'Marketing', 'HR', 'Finance', 'Operations', 'Customer Support']
      },
      {
        id: 'employment_duration',
        type: 'select',
        label: 'How long have you been with the company?',
        required: true,
        options: ['Less than 6 months', '6 months - 1 year', '1-2 years', '2-5 years', 'More than 5 years']
      },
      {
        id: 'section_2',
        type: 'section',
        label: 'Workplace Satisfaction',
        settings: {
          title: 'Workplace Satisfaction',
          description: 'Please rate your satisfaction with various aspects of your work environment.'
        }
      },
      {
        id: 'job_satisfaction',
        type: 'likert',
        label: 'Overall job satisfaction',
        required: true,
        settings: {
          scale: ['Very Dissatisfied', 'Dissatisfied', 'Neutral', 'Satisfied', 'Very Satisfied']
        }
      },
      {
        id: 'work_life_balance',
        type: 'likert',
        label: 'Work-life balance',
        required: true,
        settings: {
          scale: ['Very Poor', 'Poor', 'Fair', 'Good', 'Excellent']
        }
      },
      {
        id: 'management_effectiveness',
        type: 'likert',
        label: 'Management effectiveness',
        required: true,
        settings: {
          scale: ['Very Poor', 'Poor', 'Fair', 'Good', 'Excellent']
        }
      },
      {
        id: 'team_collaboration',
        type: 'likert',
        label: 'Team collaboration',
        required: true,
        settings: {
          scale: ['Very Poor', 'Poor', 'Fair', 'Good', 'Excellent']
        }
      },
      {
        id: 'communication',
        type: 'likert',
        label: 'Internal communication',
        required: true,
        settings: {
          scale: ['Very Poor', 'Poor', 'Fair', 'Good', 'Excellent']
        }
      },
      {
        id: 'section_3',
        type: 'section',
        label: 'Feedback and Suggestions',
        settings: {
          title: 'Feedback and Suggestions',
          description: 'Please share your thoughts and suggestions for improvement.'
        }
      },
      {
        id: 'improvements',
        type: 'textarea',
        label: 'What improvements would you like to see in the workplace?',
        required: false,
        settings: { rows: 4 }
      },
      {
        id: 'additional_comments',
        type: 'textarea',
        label: 'Additional comments or suggestions',
        required: false,
        settings: { rows: 3 }
      }
    ]
  },
  {
    id: 'performance_review',
    title: 'Performance Review Form',
    description: 'Annual or quarterly performance evaluation form for employee assessment.',
    category: 'evaluation',
    fields: [
      {
        id: 'section_1',
        type: 'section',
        label: 'Review Period',
        settings: {
          title: 'Review Period Information',
          description: 'Please specify the review period and basic information.'
        }
      },
      {
        id: 'review_period',
        type: 'select',
        label: 'Review Period',
        required: true,
        options: ['Q1 2024', 'Q2 2024', 'Q3 2024', 'Q4 2024', 'Annual 2024']
      },
      {
        id: 'employee_role',
        type: 'text',
        label: 'Employee Role/Position',
        required: true
      },
      {
        id: 'section_2',
        type: 'section',
        label: 'Performance Assessment',
        settings: {
          title: 'Performance Assessment',
          description: 'Rate the employee\'s performance in the following areas.'
        }
      },
      {
        id: 'quality_of_work',
        type: 'rating',
        label: 'Quality of Work',
        required: true,
        settings: { max: 5 }
      },
      {
        id: 'productivity',
        type: 'rating',
        label: 'Productivity',
        required: true,
        settings: { max: 5 }
      },
      {
        id: 'communication_skills',
        type: 'rating',
        label: 'Communication Skills',
        required: true,
        settings: { max: 5 }
      },
      {
        id: 'teamwork',
        type: 'rating',
        label: 'Teamwork and Collaboration',
        required: true,
        settings: { max: 5 }
      },
      {
        id: 'initiative',
        type: 'rating',
        label: 'Initiative and Innovation',
        required: true,
        settings: { max: 5 }
      },
      {
        id: 'section_3',
        type: 'section',
        label: 'Goals and Development',
        settings: {
          title: 'Goals and Development',
          description: 'Assess goal achievement and development areas.'
        }
      },
      {
        id: 'goals_achieved',
        type: 'textarea',
        label: 'Key goals achieved during this period',
        required: true,
        settings: { rows: 4 }
      },
      {
        id: 'areas_for_improvement',
        type: 'textarea',
        label: 'Areas for improvement',
        required: true,
        settings: { rows: 3 }
      },
      {
        id: 'development_goals',
        type: 'textarea',
        label: 'Development goals for next period',
        required: true,
        settings: { rows: 3 }
      },
      {
        id: 'overall_rating',
        type: 'select',
        label: 'Overall Performance Rating',
        required: true,
        options: ['Exceeds Expectations', 'Meets Expectations', 'Partially Meets Expectations', 'Below Expectations']
      }
    ]
  },
  {
    id: 'onboarding_checklist',
    title: 'Employee Onboarding Checklist',
    description: 'Comprehensive checklist for new employee onboarding process.',
    category: 'onboarding',
    fields: [
      {
        id: 'section_1',
        type: 'section',
        label: 'New Employee Information',
        settings: {
          title: 'New Employee Information',
          description: 'Basic information about the new hire.'
        }
      },
      {
        id: 'employee_name',
        type: 'text',
        label: 'Employee Name',
        required: true
      },
      {
        id: 'start_date',
        type: 'date',
        label: 'Start Date',
        required: true
      },
      {
        id: 'position',
        type: 'text',
        label: 'Position/Role',
        required: true
      },
      {
        id: 'department',
        type: 'select',
        label: 'Department',
        required: true,
        options: ['Engineering', 'Sales', 'Marketing', 'HR', 'Finance', 'Operations', 'Customer Support']
      },
      {
        id: 'section_2',
        type: 'section',
        label: 'Pre-boarding Tasks',
        settings: {
          title: 'Pre-boarding Tasks',
          description: 'Tasks to be completed before the first day.'
        }
      },
      {
        id: 'preboarding_tasks',
        type: 'checkbox',
        label: 'Pre-boarding tasks completed',
        required: true,
        options: [
          'Offer letter signed',
          'Background check completed',
          'Equipment ordered',
          'Email account created',
          'System accounts created',
          'Workspace prepared',
          'Welcome package sent'
        ]
      },
      {
        id: 'section_3',
        type: 'section',
        label: 'First Day Tasks',
        settings: {
          title: 'First Day Tasks',
          description: 'Tasks to be completed on the first day.'
        }
      },
      {
        id: 'first_day_tasks',
        type: 'checkbox',
        label: 'First day tasks completed',
        required: true,
        options: [
          'Office tour completed',
          'Team introductions made',
          'Company handbook reviewed',
          'IT setup completed',
          'HR documentation completed',
          'Security badge issued',
          'Parking arrangements made',
          'Lunch with team/manager'
        ]
      },
      {
        id: 'section_4',
        type: 'section',
        label: 'First Week Tasks',
        settings: {
          title: 'First Week Tasks',
          description: 'Tasks to be completed during the first week.'
        }
      },
      {
        id: 'first_week_tasks',
        type: 'checkbox',
        label: 'First week tasks completed',
        required: true,
        options: [
          'Role-specific training completed',
          'Company culture presentation',
          'Department overview session',
          'Project assignments discussed',
          'Mentor assigned',
          'Goal setting session',
          'Initial performance expectations set',
          'First week feedback session'
        ]
      },
      {
        id: 'onboarding_feedback',
        type: 'textarea',
        label: 'Onboarding experience feedback',
        required: false,
        settings: { rows: 4 }
      }
    ]
  }
]

export default function FormTemplatesPage() {
  const [templates, setTemplates] = useState<FormTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateTemplate, setShowCreateTemplate] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [showPredefined, setShowPredefined] = useState(false)
  const router = useRouter()

  // Template creation state
  const [templateData, setTemplateData] = useState({
    title: '',
    description: '',
    category: 'custom'
  })

  const supabase = createClient()

  useEffect(() => {
    fetchTemplates()
  }, [categoryFilter, searchTerm])

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

      let query = supabase
        .from('form_templates')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .eq('is_active', true)
        .order('created_at', { ascending: false })

      if (categoryFilter !== 'all') {
        query = query.eq('category', categoryFilter)
      }

      if (searchTerm) {
        query = query.ilike('title', `%${searchTerm}%`)
      }

      const { data, error } = await query

      if (error) throw error
      setTemplates(data || [])
    } catch (error) {
      console.error('Error fetching templates:', error)
    } finally {
      setLoading(false)
    }
  }

  const createTemplate = async () => {
    if (!templateData.title) return

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
        .insert({
          title: templateData.title,
          description: templateData.description,
          category: templateData.category,
          fields: [],
          is_active: true,
          is_template: true,
          organization_id: profile.organization_id,
          created_by: user.user.id
        })
        .select()
        .single()

      if (error) throw error

      setTemplates([data, ...templates])
      setTemplateData({ title: '', description: '', category: 'custom' })
      setShowCreateTemplate(false)
      
      // Navigate to template builder
      router.push(`/dashboard/forms/builder/${data.id}`)
    } catch (error) {
      console.error('Error creating template:', error)
      alert('Failed to create template. Please try again.')
    }
  }

  const createFromPredefined = async (predefinedTemplate: any) => {
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
        .insert({
          title: predefinedTemplate.title,
          description: predefinedTemplate.description,
          category: predefinedTemplate.category,
          fields: predefinedTemplate.fields,
          is_active: true,
          is_template: true,
          organization_id: profile.organization_id,
          created_by: user.user.id
        })
        .select()
        .single()

      if (error) throw error

      setTemplates([data, ...templates])
      setShowPredefined(false)
      
      alert('Template created successfully!')
      router.push(`/dashboard/forms/builder/${data.id}`)
    } catch (error) {
      console.error('Error creating template from predefined:', error)
      alert('Failed to create template. Please try again.')
    }
  }

  const duplicateTemplate = async (template: FormTemplate) => {
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
        .insert({
          title: `${template.title} (Copy)`,
          description: template.description,
          category: template.category,
          fields: template.fields,
          is_active: true,
          is_template: true,
          organization_id: profile.organization_id,
          created_by: user.user.id
        })
        .select()
        .single()

      if (error) throw error

      setTemplates([data, ...templates])
      alert('Template duplicated successfully!')
    } catch (error) {
      console.error('Error duplicating template:', error)
      alert('Failed to duplicate template. Please try again.')
    }
  }

  const deleteTemplate = async (templateId: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return

    try {
      const { error } = await supabase
        .from('form_templates')
        .delete()
        .eq('id', templateId)

      if (error) throw error

      setTemplates(templates.filter(t => t.id !== templateId))
    } catch (error) {
      console.error('Error deleting template:', error)
      alert('Failed to delete template. Please try again.')
    }
  }

  const exportTemplate = (template: FormTemplate) => {
    const exportData = {
      title: template.title,
      description: template.description,
      category: template.category,
      fields: template.fields,
      exported_at: new Date().toISOString(),
      version: '1.0'
    }

    const dataStr = JSON.stringify(exportData, null, 2)
    const blob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${template.title.replace(/[^a-zA-Z0-9]/g, '_')}_template.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const filteredTemplates = templates.filter(template =>
    template.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (template.description?.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Form Templates</h1>
          <p className="text-gray-600">Create and manage reusable form templates.</p>
        </div>
        <div className="flex space-x-3">
          <Button 
            variant="outline" 
            onClick={() => setShowPredefined(true)}
          >
            <Star className="h-4 w-4 mr-2" />
            Browse Predefined
          </Button>
          <Button onClick={() => setShowCreateTemplate(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Template
          </Button>
        </div>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardContent className="p-4">
          <div className="flex space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search templates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {TEMPLATE_CATEGORIES.map(category => (
                  <SelectItem key={category} value={category}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full text-center py-8">
            <div className="text-gray-500">Loading templates...</div>
          </div>
        ) : filteredTemplates.length === 0 ? (
          <div className="col-span-full text-center py-8">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No templates found</h3>
            <p className="text-gray-500 mb-4">Get started by creating your first template.</p>
            <Button onClick={() => setShowCreateTemplate(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Template
            </Button>
          </div>
        ) : (
          filteredTemplates.map(template => (
            <Card key={template.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg truncate">{template.title}</CardTitle>
                    {template.description && (
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">{template.description}</p>
                    )}
                  </div>
                  <Badge variant="outline">
                    {template.category}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="text-sm text-gray-600">
                    {template.fields?.length || 0} fields
                  </div>
                  
                  <div className="text-xs text-gray-500">
                    Created {format(parseISO(template.created_at), 'MMM d, yyyy')}
                  </div>

                  <div className="flex space-x-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="flex-1"
                      onClick={() => router.push(`/dashboard/forms/builder/${template.id}`)}
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      Preview
                    </Button>
                    <Button 
                      size="sm" 
                      className="flex-1"
                      onClick={() => {
                        // Create form from template
                        router.push(`/dashboard/forms?template=${template.id}`)
                      }}
                    >
                      <Copy className="h-3 w-3 mr-1" />
                      Use Template
                    </Button>
                  </div>

                  <div className="flex space-x-1">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => router.push(`/dashboard/forms/builder/${template.id}`)}
                      className="flex-1"
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => duplicateTemplate(template)}
                      className="flex-1"
                    >
                      <Copy className="h-3 w-3 mr-1" />
                      Duplicate
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => exportTemplate(template)}
                    >
                      <Download className="h-3 w-3" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => deleteTemplate(template.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Create Template Modal */}
      {showCreateTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-lg mx-4">
            <CardHeader>
              <CardTitle>Create New Template</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="templateTitle">Template Title</Label>
                <Input
                  id="templateTitle"
                  value={templateData.title}
                  onChange={(e) => setTemplateData({...templateData, title: e.target.value})}
                  placeholder="Enter template title"
                />
              </div>
              
              <div>
                <Label htmlFor="templateDescription">Description (Optional)</Label>
                <Textarea
                  id="templateDescription"
                  value={templateData.description}
                  onChange={(e) => setTemplateData({...templateData, description: e.target.value})}
                  placeholder="Enter template description"
                />
              </div>

              <div>
                <Label htmlFor="templateCategory">Category</Label>
                <Select 
                  value={templateData.category} 
                  onValueChange={(value) => setTemplateData({...templateData, category: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TEMPLATE_CATEGORIES.map(category => (
                      <SelectItem key={category} value={category}>
                        {category.charAt(0).toUpperCase() + category.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowCreateTemplate(false)
                    setTemplateData({ title: '', description: '', category: 'custom' })
                  }}
                >
                  Cancel
                </Button>
                <Button onClick={createTemplate}>
                  Create Template
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Predefined Templates Modal */}
      {showPredefined && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Predefined Templates</CardTitle>
              <p className="text-gray-600">Choose from our collection of ready-made templates.</p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {PREDEFINED_TEMPLATES.map(template => (
                  <Card key={template.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-base">{template.title}</CardTitle>
                          <p className="text-sm text-gray-600 mt-1">{template.description}</p>
                        </div>
                        <Badge variant="outline">
                          {template.category}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-500">
                          {template.fields.length} fields
                        </span>
                        <Button 
                          size="sm"
                          onClick={() => createFromPredefined(template)}
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Use Template
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  onClick={() => setShowPredefined(false)}
                >
                  Close
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}