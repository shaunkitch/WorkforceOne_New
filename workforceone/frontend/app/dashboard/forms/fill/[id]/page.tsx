'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  ArrowLeft,
  Save,
  Send,
  Clock,
  CheckCircle,
  AlertCircle,
  Star
} from 'lucide-react'
import { format } from 'date-fns'

interface Form {
  id: string
  title: string
  description?: string
  fields: FormField[]
  status: string
  due_date?: string
}

interface FormField {
  id: string
  type: string
  label: string
  placeholder?: string
  required: boolean
  options?: string[]
  settings?: any
}

interface FormResponse {
  id?: string
  responses: Record<string, any>
  status: 'draft' | 'submitted'
  started_at?: string
  submitted_at?: string
}

interface Assignment {
  id: string
  is_mandatory: boolean
  due_date?: string
}

export default function FormFillPage() {
  const params = useParams()
  const router = useRouter()
  const formId = params.id as string
  
  const [form, setForm] = useState<Form | null>(null)
  const [assignment, setAssignment] = useState<Assignment | null>(null)
  const [existingResponse, setExistingResponse] = useState<FormResponse | null>(null)
  const [responses, setResponses] = useState<Record<string, any>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [startTime] = useState(new Date())

  const supabase = createClient()

  useEffect(() => {
    fetchForm()
    fetchExistingResponse()
  }, [formId])

  const fetchForm = async () => {
    try {
      const { data: user } = await supabase.auth.getUser()
      if (!user.user) return

      // Get form details
      const { data: formData, error: formError } = await supabase
        .from('forms')
        .select('*')
        .eq('id', formId)
        .single()

      if (formError) throw formError
      setForm(formData)

      // Get assignment details (if user is assigned)
      const { data: assignmentData } = await supabase
        .from('form_assignments')
        .select('id, is_mandatory, due_date')
        .eq('form_id', formId)
        .or(`assigned_to_user_id.eq.${user.user.id},assigned_to_team_id.in.(${await getUserTeamIds()}),assigned_to_role.eq.${await getUserRole()},assigned_to_department.eq.${await getUserDepartment()}`)
        .limit(1)
        .single()

      if (assignmentData) {
        setAssignment(assignmentData)
      }
    } catch (error) {
      console.error('Error fetching form:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchExistingResponse = async () => {
    try {
      const { data: user } = await supabase.auth.getUser()
      if (!user.user) return

      const { data, error } = await supabase
        .from('form_responses')
        .select('*')
        .eq('form_id', formId)
        .eq('respondent_id', user.user.id)
        .single()

      if (data) {
        setExistingResponse(data)
        setResponses(data.responses || {})
      }
    } catch (error) {
      // No existing response is fine
      console.log('No existing response found')
    }
  }

  const getUserTeamIds = async (): Promise<string> => {
    const { data: user } = await supabase.auth.getUser()
    if (!user.user) return ''

    const { data } = await supabase
      .from('team_members')
      .select('team_id')
      .eq('user_id', user.user.id)

    return data?.map(tm => tm.team_id).join(',') || ''
  }

  const getUserRole = async (): Promise<string> => {
    const { data: user } = await supabase.auth.getUser()
    if (!user.user) return ''

    const { data } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.user.id)
      .single()

    return data?.role || ''
  }

  const getUserDepartment = async (): Promise<string> => {
    const { data: user } = await supabase.auth.getUser()
    if (!user.user) return ''

    const { data } = await supabase
      .from('profiles')
      .select('department')
      .eq('id', user.user.id)
      .single()

    return data?.department || ''
  }

  const updateResponse = (fieldId: string, value: any) => {
    setResponses(prev => ({
      ...prev,
      [fieldId]: value
    }))
    
    // Clear error for this field
    if (errors[fieldId]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[fieldId]
        return newErrors
      })
    }
  }

  const validateForm = (): boolean => {
    if (!form) return false

    const newErrors: Record<string, string> = {}

    form.fields.forEach(field => {
      if (field.required && field.type !== 'section' && field.type !== 'html') {
        const value = responses[field.id]
        
        if (!value || (Array.isArray(value) && value.length === 0) || value === '') {
          newErrors[field.id] = `${field.label} is required`
        }
      }
    })

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const saveDraft = async () => {
    if (!form) return

    setSaving(true)
    try {
      const { data: user } = await supabase.auth.getUser()
      if (!user.user) return

      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.user.id)
        .single()

      if (!profile?.organization_id) return

      const responseData = {
        form_id: formId,
        respondent_id: user.user.id,
        assignment_id: assignment?.id || null,
        organization_id: profile.organization_id,
        responses: responses,
        status: 'draft'
      }

      if (existingResponse) {
        // Update existing response
        const { error } = await supabase
          .from('form_responses')
          .update(responseData)
          .eq('id', existingResponse.id)

        if (error) throw error
      } else {
        // Create new response
        const { data, error } = await supabase
          .from('form_responses')
          .insert(responseData)
          .select()
          .single()

        if (error) throw error
        setExistingResponse(data)
      }

      alert('Draft saved successfully!')
    } catch (error) {
      console.error('Error saving draft:', error)
      alert('Failed to save draft. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const submitResponse = async () => {
    if (!form || !validateForm()) return

    setSubmitting(true)
    try {
      const { data: user } = await supabase.auth.getUser()
      if (!user.user) return

      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.user.id)
        .single()

      if (!profile?.organization_id) return

      const completionTime = Math.floor((new Date().getTime() - startTime.getTime()) / 1000)
      const submittedAt = new Date().toISOString()

      const responseData = {
        form_id: formId,
        respondent_id: user.user.id,
        assignment_id: assignment?.id || null,
        organization_id: profile.organization_id,
        responses: responses,
        status: 'submitted',
        submitted_at: submittedAt,
        completion_time_seconds: completionTime
      }

      if (existingResponse) {
        // Update existing response
        const { error } = await supabase
          .from('form_responses')
          .update(responseData)
          .eq('id', existingResponse.id)

        if (error) throw error
      } else {
        // Create new response
        const { error } = await supabase
          .from('form_responses')
          .insert(responseData)

        if (error) throw error
      }

      alert('Form submitted successfully!')
      router.push('/dashboard/forms/my-forms')
    } catch (error) {
      console.error('Error submitting form:', error)
      alert('Failed to submit form. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const renderField = (field: FormField) => {
    const value = responses[field.id]
    const error = errors[field.id]

    const fieldWrapper = (children: React.ReactNode) => (
      <div className="space-y-3">
        {field.type !== 'section' && field.type !== 'html' && (
          <Label className="text-base font-semibold text-gray-800 flex items-center">
            {field.label}
            {field.required && <span className="text-red-500 ml-2 text-lg">*</span>}
          </Label>
        )}
        <div className="relative">
          {children}
        </div>
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center space-x-2">
            <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
            <p className="text-sm text-red-700 font-medium">{error}</p>
          </div>
        )}
      </div>
    )

    switch (field.type) {
      case 'text':
      case 'email':
        return fieldWrapper(
          <Input
            type={field.type}
            value={value || ''}
            onChange={(e) => updateResponse(field.id, e.target.value)}
            placeholder={field.placeholder}
            className={`h-12 text-base ${error ? 'border-red-300 focus:border-red-500 focus:ring-red-200' : 'border-gray-200 focus:border-blue-500 focus:ring-blue-200'} shadow-sm`}
          />
        )

      case 'textarea':
        return fieldWrapper(
          <Textarea
            value={value || ''}
            onChange={(e) => updateResponse(field.id, e.target.value)}
            placeholder={field.placeholder}
            rows={field.settings?.rows || 4}
            className={`text-base resize-none ${error ? 'border-red-300 focus:border-red-500 focus:ring-red-200' : 'border-gray-200 focus:border-blue-500 focus:ring-blue-200'} shadow-sm`}
          />
        )

      case 'number':
        return fieldWrapper(
          <Input
            type="number"
            value={value || ''}
            onChange={(e) => updateResponse(field.id, e.target.value)}
            placeholder={field.placeholder}
            min={field.settings?.min}
            max={field.settings?.max}
            step={field.settings?.step || 1}
            className={error ? 'border-red-500' : ''}
          />
        )

      case 'select':
        return fieldWrapper(
          <Select value={value || ''} onValueChange={(val) => updateResponse(field.id, val)}>
            <SelectTrigger className={`h-12 text-base ${error ? 'border-red-300 focus:border-red-500 focus:ring-red-200' : 'border-gray-200 focus:border-blue-500 focus:ring-blue-200'} shadow-sm`}>
              <SelectValue placeholder={field.placeholder || 'Select an option'} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((option, index) => (
                <SelectItem key={index} value={option} className="text-base py-3">
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )

      case 'radio':
        return fieldWrapper(
          <div className="space-y-3">
            {field.options?.map((option, index) => (
              <div key={index} className="bg-white border border-gray-200 rounded-lg p-4 hover:bg-blue-50 hover:border-blue-300 transition-all cursor-pointer shadow-sm">
                <div className="flex items-center space-x-3">
                  <input
                    type="radio"
                    id={`${field.id}_${index}`}
                    name={field.id}
                    value={option}
                    checked={value === option}
                    onChange={(e) => updateResponse(field.id, e.target.value)}
                    className="h-5 w-5 text-blue-600 focus:ring-blue-500 focus:ring-2"
                  />
                  <label htmlFor={`${field.id}_${index}`} className="text-base font-medium text-gray-700 cursor-pointer flex-1">
                    {option}
                  </label>
                </div>
              </div>
            ))}
          </div>
        )

      case 'checkbox':
        return fieldWrapper(
          <div className="space-y-3">
            {field.options?.map((option, index) => (
              <div key={index} className="bg-white border border-gray-200 rounded-lg p-4 hover:bg-blue-50 hover:border-blue-300 transition-all cursor-pointer shadow-sm">
                <div className="flex items-center space-x-3">
                  <Checkbox
                    checked={(value || []).includes(option)}
                    onCheckedChange={(checked) => {
                      const currentValues = value || []
                      if (checked) {
                        updateResponse(field.id, [...currentValues, option])
                      } else {
                        updateResponse(field.id, currentValues.filter((v: string) => v !== option))
                      }
                    }}
                    className="h-5 w-5"
                  />
                  <label className="text-base font-medium text-gray-700 cursor-pointer flex-1">
                    {option}
                  </label>
                </div>
              </div>
            ))}
          </div>
        )

      case 'date':
        return fieldWrapper(
          <Input
            type="date"
            value={value || ''}
            onChange={(e) => updateResponse(field.id, e.target.value)}
            min={field.settings?.minDate}
            max={field.settings?.maxDate}
            className={error ? 'border-red-500' : ''}
          />
        )

      case 'file':
        return fieldWrapper(
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <Input
              type="file"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) {
                  updateResponse(field.id, file.name)
                }
              }}
              accept={field.settings?.accept}
              multiple={field.settings?.multiple}
              className="hidden"
              id={`file_${field.id}`}
            />
            <label htmlFor={`file_${field.id}`} className="cursor-pointer">
              <div className="text-sm text-gray-600">
                Click to upload or drag and drop
              </div>
              {value && (
                <div className="text-sm text-blue-600 mt-1">
                  Selected: {value}
                </div>
              )}
            </label>
          </div>
        )

      case 'rating':
        const maxRating = field.settings?.max || 5
        return fieldWrapper(
          <div className="flex space-x-1">
            {Array.from({ length: maxRating }, (_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => updateResponse(field.id, i + 1)}
                className={`text-2xl ${(value || 0) > i ? 'text-yellow-400' : 'text-gray-300'} hover:text-yellow-400`}
              >
                <Star className="h-6 w-6 fill-current" />
              </button>
            ))}
            {value && (
              <span className="ml-2 text-sm text-gray-600">
                {value} out of {maxRating}
              </span>
            )}
          </div>
        )

      case 'likert':
        const scale = field.settings?.scale || ['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree']
        return fieldWrapper(
          <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
            {scale.map((option, index) => (
              <button
                key={index}
                type="button"
                onClick={() => updateResponse(field.id, option)}
                className={`p-2 text-xs border rounded text-center ${
                  value === option 
                    ? 'bg-blue-500 text-white border-blue-500' 
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        )

      case 'section':
        return (
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6 mb-6 shadow-sm">
            <h3 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
              {field.settings?.title || field.label}
            </h3>
            {field.settings?.description && (
              <p className="text-base text-gray-600 leading-relaxed">{field.settings.description}</p>
            )}
          </div>
        )

      case 'html':
        return (
          <div 
            className="prose prose-sm"
            dangerouslySetInnerHTML={{ __html: field.settings?.content || '' }}
          />
        )

      default:
        return (
          <div className="text-gray-400 italic">
            Unsupported field type: {field.type}
          </div>
        )
    }
  }

  const isFormComplete = () => {
    if (!form) return false
    
    return form.fields
      .filter(field => field.required && field.type !== 'section' && field.type !== 'html')
      .every(field => {
        const value = responses[field.id]
        return value !== undefined && value !== '' && (!Array.isArray(value) || value.length > 0)
      })
  }

  const isOverdue = () => {
    if (!assignment?.due_date) return false
    return new Date() > new Date(assignment.due_date)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading form...</div>
      </div>
    )
  }

  if (!form) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Form not found</h3>
        <p className="text-gray-500 mb-4">The requested form could not be found.</p>
        <Button onClick={() => router.push('/dashboard/forms')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Forms
        </Button>
      </div>
    )
  }

  if (form.status !== 'active') {
    return (
      <div className="text-center py-12">
        <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Form not available</h3>
        <p className="text-gray-500 mb-4">This form is not currently accepting responses.</p>
        <Button onClick={() => router.push('/dashboard/forms')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Forms
        </Button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white/95 backdrop-blur-sm border border-gray-200 px-6 py-4 shadow-lg rounded-lg">
          <div className="flex items-center justify-between">
            <Button 
              variant="outline" 
              onClick={() => router.push('/dashboard/forms')}
              className="hover:shadow-md transition-all border-blue-200 hover:bg-blue-50"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Forms
            </Button>
            <div className="flex items-center space-x-3 text-sm text-gray-600">
              <div className="bg-blue-50 px-3 py-1 rounded-full flex items-center space-x-2">
                <Clock className="h-4 w-4 text-blue-600" />
                <span className="font-medium">Started {format(startTime, 'HH:mm')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Form Status Indicators */}
        <div className="flex flex-wrap gap-3">
          {assignment?.is_mandatory && (
            <div className="bg-red-50 border border-red-200 px-4 py-2 rounded-full flex items-center space-x-2 text-sm text-red-700 font-medium shadow-sm">
              <AlertCircle className="h-4 w-4" />
              <span>Mandatory Form</span>
            </div>
          )}
          {assignment?.due_date && (
            <div className={`px-4 py-2 rounded-full flex items-center space-x-2 text-sm font-medium shadow-sm ${
              isOverdue() 
                ? 'bg-red-50 border border-red-200 text-red-700' 
                : 'bg-yellow-50 border border-yellow-200 text-yellow-700'
            }`}>
              <Clock className="h-4 w-4" />
              <span>
                Due {format(new Date(assignment.due_date), 'MMM d, yyyy')}
                {isOverdue() && ' (Overdue)'}
              </span>
            </div>
          )}
          {existingResponse?.status === 'submitted' && (
            <div className="bg-green-50 border border-green-200 px-4 py-2 rounded-full flex items-center space-x-2 text-sm text-green-700 font-medium shadow-sm">
              <CheckCircle className="h-4 w-4" />
              <span>Form Submitted</span>
            </div>
          )}
        </div>

        {/* Main Form */}
        <Card className="bg-white/95 backdrop-blur-sm shadow-xl border-0 ring-1 ring-gray-200">
          <CardHeader className="bg-gradient-to-r from-gray-50 to-blue-50 border-b border-gray-200 px-8 py-6">
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {form.title}
            </CardTitle>
            {form.description && (
              <p className="text-gray-600 mt-2 text-lg leading-relaxed">{form.description}</p>
            )}
          </CardHeader>
          <CardContent className="space-y-8 p-8">
            {form.fields.map(field => (
              <div key={field.id} className="bg-gray-50/50 rounded-lg p-6 border border-gray-100">
                {renderField(field)}
              </div>
            ))}

            {/* Form Actions */}
            <div className="bg-gradient-to-r from-gray-50 to-blue-50 border-t border-gray-200 p-6 rounded-b-lg">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                <Button 
                  variant="outline" 
                  onClick={saveDraft}
                  disabled={saving || existingResponse?.status === 'submitted'}
                  className="hover:shadow-md transition-all border-gray-300 hover:bg-gray-50 px-6 py-3"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? 'Saving Draft...' : 'Save as Draft'}
                </Button>

                <div className="flex flex-col lg:flex-row lg:items-center space-y-3 lg:space-y-0 lg:space-x-4">
                  <div className="bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full border border-gray-200 text-sm flex items-center shadow-sm">
                    {isFormComplete() ? (
                      <><CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                      <span className="text-green-700 font-medium">Ready to submit</span></>
                    ) : (
                      <><AlertCircle className="h-4 w-4 text-yellow-500 mr-2" />
                      <span className="text-yellow-700 font-medium">Complete required fields</span></>
                    )}
                  </div>
                  
                  <Button 
                    onClick={submitResponse}
                    disabled={submitting || !isFormComplete() || existingResponse?.status === 'submitted'}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all px-8 py-3 text-white font-semibold"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    {submitting ? 'Submitting Form...' : 'Submit Form'}
                  </Button>
                </div>
              </div>
            </div>
        </CardContent>
      </Card>
    </div>
  )
}