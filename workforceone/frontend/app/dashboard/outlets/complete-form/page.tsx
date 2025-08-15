'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  ArrowLeft, 
  MapPin, 
  FileText, 
  CheckCircle2, 
  Clock,
  AlertCircle,
  Save,
  Send
} from 'lucide-react'
import { format } from 'date-fns'

interface FormField {
  id: string
  type: 'text' | 'textarea' | 'number' | 'email' | 'phone' | 'select' | 'radio' | 'checkbox' | 'date' | 'time' | 'rating'
  label: string
  placeholder?: string
  required: boolean
  options?: string[]
  min?: number
  max?: number
  validation?: {
    minLength?: number
    maxLength?: number
    pattern?: string
    message?: string
  }
}

interface Form {
  id: string
  title: string
  description?: string
  fields: FormField[]
  organization_id: string
  created_by: string
}

interface Outlet {
  id: string
  name: string
  address?: string
  group_name?: string
}

interface OutletVisit {
  id: string
  outlet_id: string
  user_id: string
  route_stop_id?: string
  organization_id: string
  check_in_time: string
  check_out_time?: string
  form_completed: boolean
  form_response_id?: string
}

function CompleteFormPageContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [form, setForm] = useState<Form | null>(null)
  const [outlet, setOutlet] = useState<Outlet | null>(null)
  const [visit, setVisit] = useState<OutletVisit | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formResponses, setFormResponses] = useState<Record<string, any>>({})
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const [userProfile, setUserProfile] = useState<any>(null)

  const supabase = createClient()

  // Get URL parameters
  const formId = searchParams.get('form')
  const outletId = searchParams.get('outlet')
  const visitId = searchParams.get('visit')

  useEffect(() => {
    if (formId && outletId) {
      fetchData()
    }
  }, [formId, outletId, visitId])

  const fetchData = async () => {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (!profile?.organization_id) throw new Error('No organization found')
      setUserProfile(profile)

      // Fetch form details
      const { data: formData, error: formError } = await supabase
        .from('forms')
        .select('*')
        .eq('id', formId)
        .eq('organization_id', profile.organization_id)
        .single()

      if (formError) throw formError
      setForm(formData)

      // Fetch outlet details
      const { data: outletData, error: outletError } = await supabase
        .from('outlets')
        .select('*')
        .eq('id', outletId)
        .eq('organization_id', profile.organization_id)
        .single()

      if (outletError) throw outletError
      setOutlet(outletData)

      // Fetch visit details if visitId provided
      if (visitId) {
        const { data: visitData, error: visitError } = await supabase
          .from('outlet_visits')
          .select('*')
          .eq('id', visitId)
          .eq('user_id', user.id)
          .single()

        if (visitError) {
          console.warn('Visit not found, will create new one')
        } else {
          setVisit(visitData)

          // If there's already a form response, load it
          if (visitData.form_response_id) {
            const { data: responseData } = await supabase
              .from('form_responses')
              .select('*')
              .eq('id', visitData.form_response_id)
              .single()

            if (responseData?.responses) {
              setFormResponses(responseData.responses)
            }
          }
        }
      }

    } catch (error) {
      console.error('Error fetching data:', error)
      alert('Failed to load form data')
      router.back()
    } finally {
      setLoading(false)
    }
  }

  const handleFieldChange = (fieldId: string, value: any) => {
    setFormResponses(prev => ({
      ...prev,
      [fieldId]: value
    }))

    // Clear validation error for this field
    if (validationErrors[fieldId]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[fieldId]
        return newErrors
      })
    }
  }

  const validateField = (field: FormField, value: any): string | null => {
    // Check required fields
    if (field.required && (!value || (typeof value === 'string' && value.trim() === ''))) {
      return `${field.label} is required`
    }

    // Type-specific validation
    if (value && typeof value === 'string' && value.trim() !== '') {
      switch (field.type) {
        case 'email':
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
          if (!emailRegex.test(value)) {
            return 'Please enter a valid email address'
          }
          break
        case 'phone':
          const phoneRegex = /^\+?[\d\s\-\(\)]+$/
          if (!phoneRegex.test(value)) {
            return 'Please enter a valid phone number'
          }
          break
        case 'number':
          const numValue = parseFloat(value)
          if (isNaN(numValue)) {
            return 'Please enter a valid number'
          }
          if (field.min !== undefined && numValue < field.min) {
            return `Value must be at least ${field.min}`
          }
          if (field.max !== undefined && numValue > field.max) {
            return `Value must be at most ${field.max}`
          }
          break
      }

      // Custom validation rules
      if (field.validation) {
        if (field.validation.minLength && value.length < field.validation.minLength) {
          return `Must be at least ${field.validation.minLength} characters`
        }
        if (field.validation.maxLength && value.length > field.validation.maxLength) {
          return `Must be at most ${field.validation.maxLength} characters`
        }
        if (field.validation.pattern) {
          const regex = new RegExp(field.validation.pattern)
          if (!regex.test(value)) {
            return field.validation.message || 'Invalid format'
          }
        }
      }
    }

    return null
  }

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {}
    
    form?.fields.forEach(field => {
      const value = formResponses[field.id]
      const error = validateField(field, value)
      if (error) {
        errors[field.id] = error
      }
    })

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const saveDraft = async () => {
    if (!form || !outlet || !userProfile) return

    setSaving(true)
    try {
      // Create or get visit record
      let currentVisit = visit
      if (!currentVisit) {
        const { data: newVisit, error: visitError } = await supabase
          .from('outlet_visits')
          .insert({
            outlet_id: outlet.id,
            user_id: userProfile.id,
            organization_id: userProfile.organization_id,
            check_in_time: new Date().toISOString(),
            form_completed: false
          })
          .select()
          .single()

        if (visitError) throw visitError
        currentVisit = newVisit
        setVisit(newVisit)
      }

      // Save or update form response (using actual schema)
      const responseData: any = {
        form_id: form.id,
        organization_id: userProfile.organization_id,
        respondent_id: userProfile.id,
        responses: {
          ...formResponses,
          _metadata: {
            user_name: userProfile.full_name,
            outlet_visit_id: currentVisit.id,
            outlet_id: outlet.id,
            completed_at: new Date().toISOString()
          }
        },
        status: 'draft'
      }
      
      // Add user_id if the column exists (for compatibility)
      responseData.user_id = userProfile.id

      let formResponseId = currentVisit.form_response_id

      if (formResponseId) {
        // Update existing response
        const { error } = await supabase
          .from('form_responses')
          .update(responseData)
          .eq('id', formResponseId)

        if (error) throw error
      } else {
        // Create new response
        const { data: newResponse, error } = await supabase
          .from('form_responses')
          .insert(responseData)
          .select()
          .single()

        if (error) throw error
        formResponseId = newResponse.id

        // Update visit with form response ID
        await supabase
          .from('outlet_visits')
          .update({ form_response_id: formResponseId })
          .eq('id', currentVisit.id)
      }

      alert('Draft saved successfully!')

    } catch (error) {
      console.error('Error saving draft:', error)
      alert('Failed to save draft')
    } finally {
      setSaving(false)
    }
  }

  const submitForm = async () => {
    if (!validateForm()) {
      alert('Please fix the validation errors before submitting')
      return
    }

    if (!form || !outlet || !userProfile) return

    setSubmitting(true)
    try {
      // Create or get visit record
      let currentVisit = visit
      if (!currentVisit) {
        const { data: newVisit, error: visitError } = await supabase
          .from('outlet_visits')
          .insert({
            outlet_id: outlet.id,
            user_id: userProfile.id,
            organization_id: userProfile.organization_id,
            check_in_time: new Date().toISOString(),
            form_completed: false
          })
          .select()
          .single()

        if (visitError) throw visitError
        currentVisit = newVisit
        setVisit(newVisit)
      }

      // Submit form response (using actual schema)
      const responseData: any = {
        form_id: form.id,
        organization_id: userProfile.organization_id,
        respondent_id: userProfile.id,
        responses: {
          ...formResponses,
          _metadata: {
            user_name: userProfile.full_name,
            outlet_visit_id: currentVisit.id,
            outlet_id: outlet.id,
            completed_at: new Date().toISOString()
          }
        },
        status: 'completed',
        submitted_at: new Date().toISOString()
      }
      
      // Add user_id if the column exists (for compatibility)
      responseData.user_id = userProfile.id

      let formResponseId = currentVisit.form_response_id

      if (formResponseId) {
        // Update existing response
        const { error } = await supabase
          .from('form_responses')
          .update(responseData)
          .eq('id', formResponseId)

        if (error) throw error
      } else {
        // Create new response
        const { data: newResponse, error } = await supabase
          .from('form_responses')
          .insert(responseData)
          .select()
          .single()

        if (error) throw error
        formResponseId = newResponse.id
      }

      // Update visit as completed
      await supabase
        .from('outlet_visits')
        .update({
          form_completed: true,
          form_response_id: formResponseId,
          check_out_time: new Date().toISOString()
        })
        .eq('id', currentVisit.id)

      // Mark route stop as completed if applicable
      if (currentVisit.route_stop_id) {
        await supabase
          .from('route_stops')
          .update({
            status: 'completed',
            actual_departure_time: new Date().toISOString()
          })
          .eq('id', currentVisit.route_stop_id)
      }

      alert('Form submitted successfully!')
      router.push('/dashboard/outlets')

    } catch (error) {
      console.error('Error submitting form:', error)
      alert('Failed to submit form')
    } finally {
      setSubmitting(false)
    }
  }

  const renderField = (field: FormField) => {
    const value = formResponses[field.id] || ''
    const hasError = !!validationErrors[field.id]

    switch (field.type) {
      case 'text':
      case 'email':
      case 'phone':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id}>
              {field.label} {field.required && <span className="text-red-500">*</span>}
            </Label>
            <Input
              id={field.id}
              type={field.type}
              placeholder={field.placeholder}
              value={value}
              onChange={(e) => handleFieldChange(field.id, e.target.value)}
              className={hasError ? 'border-red-500' : ''}
            />
            {hasError && (
              <p className="text-sm text-red-500">{validationErrors[field.id]}</p>
            )}
          </div>
        )

      case 'number':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id}>
              {field.label} {field.required && <span className="text-red-500">*</span>}
            </Label>
            <Input
              id={field.id}
              type="number"
              placeholder={field.placeholder}
              min={field.min}
              max={field.max}
              value={value}
              onChange={(e) => handleFieldChange(field.id, e.target.value)}
              className={hasError ? 'border-red-500' : ''}
            />
            {hasError && (
              <p className="text-sm text-red-500">{validationErrors[field.id]}</p>
            )}
          </div>
        )

      case 'textarea':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id}>
              {field.label} {field.required && <span className="text-red-500">*</span>}
            </Label>
            <Textarea
              id={field.id}
              placeholder={field.placeholder}
              value={value}
              onChange={(e) => handleFieldChange(field.id, e.target.value)}
              className={hasError ? 'border-red-500' : ''}
              rows={4}
            />
            {hasError && (
              <p className="text-sm text-red-500">{validationErrors[field.id]}</p>
            )}
          </div>
        )

      case 'select':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id}>
              {field.label} {field.required && <span className="text-red-500">*</span>}
            </Label>
            <Select value={value} onValueChange={(newValue) => handleFieldChange(field.id, newValue)}>
              <SelectTrigger className={hasError ? 'border-red-500' : ''}>
                <SelectValue placeholder={field.placeholder || 'Select an option'} />
              </SelectTrigger>
              <SelectContent>
                {field.options?.map((option, index) => (
                  <SelectItem key={index} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {hasError && (
              <p className="text-sm text-red-500">{validationErrors[field.id]}</p>
            )}
          </div>
        )

      case 'radio':
        return (
          <div key={field.id} className="space-y-2">
            <Label>
              {field.label} {field.required && <span className="text-red-500">*</span>}
            </Label>
            <RadioGroup
              value={value}
              onValueChange={(newValue) => handleFieldChange(field.id, newValue)}
              className={hasError ? 'border border-red-500 rounded p-2' : ''}
            >
              {field.options?.map((option, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <RadioGroupItem value={option} id={`${field.id}-${index}`} />
                  <Label htmlFor={`${field.id}-${index}`}>{option}</Label>
                </div>
              ))}
            </RadioGroup>
            {hasError && (
              <p className="text-sm text-red-500">{validationErrors[field.id]}</p>
            )}
          </div>
        )

      case 'checkbox':
        return (
          <div key={field.id} className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id={field.id}
                checked={!!value}
                onCheckedChange={(checked) => handleFieldChange(field.id, checked)}
              />
              <Label htmlFor={field.id} className="cursor-pointer">
                {field.label} {field.required && <span className="text-red-500">*</span>}
              </Label>
            </div>
            {hasError && (
              <p className="text-sm text-red-500">{validationErrors[field.id]}</p>
            )}
          </div>
        )

      case 'date':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id}>
              {field.label} {field.required && <span className="text-red-500">*</span>}
            </Label>
            <Input
              id={field.id}
              type="date"
              value={value}
              onChange={(e) => handleFieldChange(field.id, e.target.value)}
              className={hasError ? 'border-red-500' : ''}
            />
            {hasError && (
              <p className="text-sm text-red-500">{validationErrors[field.id]}</p>
            )}
          </div>
        )

      case 'time':
        return (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id}>
              {field.label} {field.required && <span className="text-red-500">*</span>}
            </Label>
            <Input
              id={field.id}
              type="time"
              value={value}
              onChange={(e) => handleFieldChange(field.id, e.target.value)}
              className={hasError ? 'border-red-500' : ''}
            />
            {hasError && (
              <p className="text-sm text-red-500">{validationErrors[field.id]}</p>
            )}
          </div>
        )

      case 'rating':
        return (
          <div key={field.id} className="space-y-2">
            <Label>
              {field.label} {field.required && <span className="text-red-500">*</span>}
            </Label>
            <div className="flex space-x-2">
              {[1, 2, 3, 4, 5].map((rating) => (
                <Button
                  key={rating}
                  type="button"
                  variant={value === rating ? 'default' : 'outline'}
                  onClick={() => handleFieldChange(field.id, rating)}
                  className="w-12 h-12"
                >
                  {rating}
                </Button>
              ))}
            </div>
            {hasError && (
              <p className="text-sm text-red-500">{validationErrors[field.id]}</p>
            )}
          </div>
        )

      default:
        return null
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-gray-600">Loading form...</p>
        </div>
      </div>
    )
  }

  if (!form || !outlet) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Form Not Found</h1>
          <p className="text-gray-600 mb-4">The requested form could not be loaded.</p>
          <Button onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Go Back
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Button 
            variant="ghost" 
            onClick={() => router.back()}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Outlets
          </Button>
          
          <div className="flex items-center space-x-4 mb-4">
            <div className="flex items-center space-x-2 text-gray-600">
              <MapPin className="h-5 w-5" />
              <span className="font-medium">{outlet.name}</span>
              {outlet.address && <span className="text-sm">• {outlet.address}</span>}
              {outlet.group_name && (
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                  {outlet.group_name}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <FileText className="h-6 w-6 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">{form.title}</h1>
          </div>
          
          {form.description && (
            <p className="text-gray-600 mt-2">{form.description}</p>
          )}

          {visit && (
            <div className="mt-4 flex items-center space-x-2 text-sm text-gray-500">
              <Clock className="h-4 w-4" />
              <span>
                Check-in: {format(new Date(visit.check_in_time), 'MMM dd, yyyy HH:mm')}
              </span>
              {visit.form_completed && (
                <div className="flex items-center space-x-1 text-green-600">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Completed</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle>Complete Form</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {form.fields && form.fields.length > 0 ? (
                form.fields.map(field => renderField(field))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>This form has no fields configured.</p>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 mt-8 pt-6 border-t">
              <Button
                variant="outline"
                onClick={saveDraft}
                disabled={saving || submitting}
                className="flex-1"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Draft
                  </>
                )}
              </Button>
              
              <Button
                onClick={submitForm}
                disabled={saving || submitting}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Submit Form
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function CompleteFormPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-gray-600">Loading form...</p>
        </div>
      </div>
    }>
      <CompleteFormPageContent />
    </Suspense>
  )
}