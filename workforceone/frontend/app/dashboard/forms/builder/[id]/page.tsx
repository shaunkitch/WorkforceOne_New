'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  Plus,
  Trash2,
  Move,
  Eye,
  Save,
  ArrowLeft,
  Settings,
  Copy,
  GripVertical
} from 'lucide-react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import SortableFieldItem from '@/components/form-builder/SortableFieldItem'

interface FormField {
  id: string
  type: string
  label: string
  placeholder?: string
  required: boolean
  options?: string[]
  validation?: any
  settings?: any
}

interface Form {
  id: string
  title: string
  description?: string
  fields: FormField[]
  settings: any
  status: string
}

interface FieldType {
  id: string
  name: string
  description: string
  default_settings: any
}

export default function FormBuilderPage() {
  const params = useParams()
  const router = useRouter()
  const formId = params.id as string
  
  const [form, setForm] = useState<Form | null>(null)
  const [fieldTypes, setFieldTypes] = useState<FieldType[]>([])
  const [selectedField, setSelectedField] = useState<FormField | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [previewMode, setPreviewMode] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    fetchForm()
    fetchFieldTypes()
  }, [formId])

  const fetchForm = async () => {
    try {
      const { data, error } = await supabase
        .from('forms')
        .select('*')
        .eq('id', formId)
        .single()

      if (error) throw error
      setForm(data)
    } catch (error) {
      console.error('Error fetching form:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchFieldTypes = async () => {
    try {
      const { data, error } = await supabase
        .from('form_field_types')
        .select('*')
        .eq('is_active', true)
        .order('name')

      if (error) throw error
      setFieldTypes(data || [])
    } catch (error) {
      console.error('Error fetching field types:', error)
    }
  }

  const saveForm = async () => {
    if (!form) return

    setSaving(true)
    try {
      const { error } = await supabase
        .from('forms')
        .update({
          title: form.title,
          description: form.description,
          fields: form.fields,
          settings: form.settings,
          updated_at: new Date().toISOString()
        })
        .eq('id', formId)

      if (error) throw error
      alert('Form saved successfully!')
    } catch (error) {
      console.error('Error saving form:', error)
      alert('Failed to save form. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const addField = (fieldTypeId: string) => {
    if (!form) return

    const fieldType = fieldTypes.find(ft => ft.id === fieldTypeId)
    if (!fieldType) return

    const newField: FormField = {
      id: `field_${Date.now()}`,
      type: fieldTypeId,
      label: `New ${fieldType.name}`,
      required: false,
      ...fieldType.default_settings
    }

    setForm({
      ...form,
      fields: [...form.fields, newField]
    })
    setSelectedField(newField)
  }

  const updateField = (fieldId: string, updates: Partial<FormField>) => {
    if (!form) return

    const updatedFields = form.fields.map(field =>
      field.id === fieldId ? { ...field, ...updates } : field
    )

    setForm({
      ...form,
      fields: updatedFields
    })

    if (selectedField?.id === fieldId) {
      setSelectedField({ ...selectedField, ...updates })
    }
  }

  const deleteField = (fieldId: string) => {
    if (!form) return

    setForm({
      ...form,
      fields: form.fields.filter(field => field.id !== fieldId)
    })

    if (selectedField?.id === fieldId) {
      setSelectedField(null)
    }
  }

  const duplicateField = (fieldId: string) => {
    if (!form) return

    const field = form.fields.find(f => f.id === fieldId)
    if (!field) return

    const duplicatedField: FormField = {
      ...field,
      id: `field_${Date.now()}`,
      label: `${field.label} (Copy)`
    }

    const fieldIndex = form.fields.findIndex(f => f.id === fieldId)
    const newFields = [...form.fields]
    newFields.splice(fieldIndex + 1, 0, duplicatedField)

    setForm({
      ...form,
      fields: newFields
    })
  }

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = (event: any) => {
    const { active, over } = event

    if (active.id !== over?.id && form) {
      const oldIndex = form.fields.findIndex(field => field.id === active.id)
      const newIndex = form.fields.findIndex(field => field.id === over.id)

      setForm({
        ...form,
        fields: arrayMove(form.fields, oldIndex, newIndex)
      })
    }
  }

  const renderFieldPreview = (field: FormField) => {
    switch (field.type) {
      case 'text':
      case 'email':
        return (
          <Input 
            placeholder={field.placeholder || field.label}
            disabled
          />
        )
      case 'textarea':
        return (
          <Textarea 
            placeholder={field.placeholder || field.label}
            disabled
            rows={field.settings?.rows || 4}
          />
        )
      case 'number':
        return (
          <Input 
            type="number"
            placeholder={field.placeholder || field.label}
            disabled
          />
        )
      case 'select':
        return (
          <Select disabled>
            <SelectTrigger>
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
        )
      case 'radio':
        return (
          <div className="space-y-2">
            {field.options?.map((option, index) => (
              <div key={index} className="flex items-center space-x-2">
                <input type="radio" disabled />
                <label className="text-sm">{option}</label>
              </div>
            ))}
          </div>
        )
      case 'checkbox':
        return (
          <div className="space-y-2">
            {field.options?.map((option, index) => (
              <div key={index} className="flex items-center space-x-2">
                <input type="checkbox" disabled />
                <label className="text-sm">{option}</label>
              </div>
            ))}
          </div>
        )
      case 'date':
        return <Input type="date" disabled />
      case 'file':
        return (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
            <p className="text-sm text-gray-500">Click to upload or drag and drop</p>
          </div>
        )
      case 'rating':
        return (
          <div className="flex space-x-1">
            {Array.from({ length: field.settings?.max || 5 }, (_, i) => (
              <span key={i} className="text-yellow-400 text-xl">☆</span>
            ))}
          </div>
        )
      case 'section':
        return (
          <div className="border-b pb-2 mb-4">
            <h3 className="text-lg font-semibold">{field.settings?.title || field.label}</h3>
            {field.settings?.description && (
              <p className="text-sm text-gray-600">{field.settings.description}</p>
            )}
          </div>
        )
      default:
        return <div className="text-gray-400">Unsupported field type</div>
    }
  }

  const renderFieldEditor = () => {
    if (!selectedField) {
      return (
        <div className="text-center py-12">
          <div className="bg-gradient-to-br from-gray-100 to-gray-200 rounded-full p-4 w-16 h-16 mx-auto mb-6">
            <Settings className="h-8 w-8 text-gray-500 mx-auto" />
          </div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">No Field Selected</h3>
          <p className="text-gray-600 text-sm leading-relaxed">
            Click on a field in your form to edit its properties and settings.
          </p>
        </div>
      )
    }

    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="fieldLabel" className="text-sm font-semibold text-gray-800">
            Field Label
          </Label>
          <Input
            id="fieldLabel"
            value={selectedField.label}
            onChange={(e) => updateField(selectedField.id, { label: e.target.value })}
            className="h-10 border-gray-200 focus:border-blue-500 focus:ring-blue-200 shadow-sm"
          />
        </div>

        {['text', 'textarea', 'email', 'number'].includes(selectedField.type) && (
          <div className="space-y-2">
            <Label htmlFor="fieldPlaceholder" className="text-sm font-semibold text-gray-800">
              Placeholder Text
            </Label>
            <Input
              id="fieldPlaceholder"
              value={selectedField.placeholder || ''}
              onChange={(e) => updateField(selectedField.id, { placeholder: e.target.value })}
              placeholder="Enter placeholder text..."
              className="h-10 border-gray-200 focus:border-blue-500 focus:ring-blue-200 shadow-sm"
            />
          </div>
        )}

        {['select', 'radio', 'checkbox', 'multiselect'].includes(selectedField.type) && (
          <div>
            <Label>Options</Label>
            <div className="space-y-2">
              {selectedField.options?.map((option, index) => (
                <div key={index} className="flex space-x-2">
                  <Input
                    value={option}
                    onChange={(e) => {
                      const newOptions = [...(selectedField.options || [])]
                      newOptions[index] = e.target.value
                      updateField(selectedField.id, { options: newOptions })
                    }}
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const newOptions = selectedField.options?.filter((_, i) => i !== index)
                      updateField(selectedField.id, { options: newOptions })
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  const newOptions = [...(selectedField.options || []), 'New Option']
                  updateField(selectedField.id, { options: newOptions })
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Option
              </Button>
            </div>
          </div>
        )}

        {selectedField.type === 'textarea' && (
          <div>
            <Label htmlFor="textareaRows">Rows</Label>
            <Input
              id="textareaRows"
              type="number"
              value={selectedField.settings?.rows || 4}
              onChange={(e) => updateField(selectedField.id, { 
                settings: { ...selectedField.settings, rows: parseInt(e.target.value) }
              })}
            />
          </div>
        )}

        {selectedField.type === 'number' && (
          <>
            <div>
              <Label htmlFor="numberMin">Minimum Value</Label>
              <Input
                id="numberMin"
                type="number"
                value={selectedField.settings?.min || ''}
                onChange={(e) => updateField(selectedField.id, { 
                  settings: { ...selectedField.settings, min: e.target.value ? parseInt(e.target.value) : null }
                })}
              />
            </div>
            <div>
              <Label htmlFor="numberMax">Maximum Value</Label>
              <Input
                id="numberMax"
                type="number"
                value={selectedField.settings?.max || ''}
                onChange={(e) => updateField(selectedField.id, { 
                  settings: { ...selectedField.settings, max: e.target.value ? parseInt(e.target.value) : null }
                })}
              />
            </div>
          </>
        )}

        {selectedField.type === 'rating' && (
          <div>
            <Label htmlFor="ratingMax">Maximum Rating</Label>
            <Input
              id="ratingMax"
              type="number"
              value={selectedField.settings?.max || 5}
              onChange={(e) => updateField(selectedField.id, { 
                settings: { ...selectedField.settings, max: parseInt(e.target.value) }
              })}
            />
          </div>
        )}

        {selectedField.type === 'section' && (
          <>
            <div>
              <Label htmlFor="sectionTitle">Section Title</Label>
              <Input
                id="sectionTitle"
                value={selectedField.settings?.title || ''}
                onChange={(e) => updateField(selectedField.id, { 
                  settings: { ...selectedField.settings, title: e.target.value }
                })}
              />
            </div>
            <div>
              <Label htmlFor="sectionDescription">Section Description</Label>
              <Textarea
                id="sectionDescription"
                value={selectedField.settings?.description || ''}
                onChange={(e) => updateField(selectedField.id, { 
                  settings: { ...selectedField.settings, description: e.target.value }
                })}
              />
            </div>
          </>
        )}

        {selectedField.type !== 'section' && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <Switch
                checked={selectedField.required}
                onCheckedChange={(checked) => updateField(selectedField.id, { required: checked })}
                className="data-[state=checked]:bg-blue-600"
              />
              <div>
                <Label className="text-sm font-semibold text-gray-800">Required Field</Label>
                <p className="text-xs text-gray-600 mt-1">
                  Users must fill out this field before submitting the form
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading form builder...</div>
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

  return (
    <div className="space-y-6 bg-gradient-to-br from-gray-50 to-blue-50 min-h-screen">
      {/* Header */}
      <div className="bg-white/95 backdrop-blur-sm border-b border-gray-200 px-6 py-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button 
              variant="outline" 
              onClick={() => router.push('/dashboard/forms')}
              className="hover:shadow-md transition-all"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {form.title}
              </h1>
              <p className="text-gray-600 flex items-center">
                <Settings className="h-4 w-4 mr-1" />
                Form Builder
              </p>
            </div>
          </div>
          <div className="flex space-x-3">
            <Button 
              variant="outline" 
              onClick={() => setPreviewMode(!previewMode)}
              className="hover:shadow-md transition-all border-blue-200 hover:bg-blue-50"
            >
              <Eye className="h-4 w-4 mr-2" />
              {previewMode ? 'Edit' : 'Preview'}
            </Button>
            <Button 
              onClick={saveForm} 
              disabled={saving}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all"
            >
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>
      </div>

      <div className="px-6 pb-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Field Palette */}
          {!previewMode && (
            <Card className="lg:col-span-1 bg-white/80 backdrop-blur-sm shadow-lg border-0 ring-1 ring-gray-200">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50">
                <CardTitle className="text-gray-800 flex items-center">
                  <Plus className="h-5 w-5 mr-2 text-blue-600" />
                  Add Fields
                </CardTitle>
                <p className="text-sm text-gray-600">Drag fields to your form</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {fieldTypes.map(fieldType => (
                    <Button
                      key={fieldType.id}
                      variant="outline"
                      className="w-full justify-start hover:shadow-md hover:scale-105 transition-all border-gray-200 hover:border-blue-300 hover:bg-blue-50"
                      onClick={() => addField(fieldType.id)}
                    >
                      <Plus className="h-4 w-4 mr-2 text-blue-600" />
                      {fieldType.name}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Form Builder */}
          <Card className={`${previewMode ? "lg:col-span-4" : "lg:col-span-2"} bg-white/90 backdrop-blur-sm shadow-xl border-0 ring-1 ring-gray-200`}>
            <CardHeader className="bg-gradient-to-r from-gray-50 to-blue-50 border-b">
              <div>
                <Input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="text-xl font-bold border-none bg-transparent p-0 focus:ring-0 placeholder-gray-400"
                  placeholder="Enter form title..."
                />
                <Textarea
                  value={form.description || ''}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="mt-2 border-none bg-transparent p-0 focus:ring-0 resize-none placeholder-gray-400"
                  placeholder="Add a description to help users understand this form..."
                  rows={2}
                />
              </div>
            </CardHeader>
          <CardContent>
            {form.fields.length === 0 ? (
              <div className="text-center py-16 bg-gradient-to-br from-gray-50 to-blue-50 rounded-xl border-2 border-dashed border-gray-300">
                <div className="bg-gradient-to-br from-gray-200 to-gray-300 rounded-full p-6 w-24 h-24 mx-auto mb-6">
                  <Plus className="h-12 w-12 text-gray-500 mx-auto" />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-3">Start Building Your Form</h3>
                <p className="text-gray-600 text-lg max-w-md mx-auto leading-relaxed">
                  Add fields from the palette on the left to start creating your form. Drag and drop to reorder fields.
                </p>
              </div>
            ) : (
              <DndContext 
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext 
                  items={form.fields.map(f => f.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-4">
                    {form.fields.map((field) => (
                      <SortableFieldItem
                        key={field.id}
                        field={field}
                        fieldTypes={fieldTypes}
                        selectedField={selectedField}
                        onSelect={setSelectedField}
                        onDuplicate={duplicateField}
                        onDelete={deleteField}
                        previewMode={previewMode}
                      >
                        {renderFieldPreview(field)}
                      </SortableFieldItem>
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}
          </CardContent>
        </Card>

        {/* Field Editor */}
        {!previewMode && (
          <Card className="lg:col-span-1 bg-white/90 backdrop-blur-sm shadow-lg border-0 ring-1 ring-gray-200">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-blue-50 border-b">
              <CardTitle className="text-gray-800 flex items-center">
                <Settings className="h-5 w-5 mr-2 text-purple-600" />
                Field Properties
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {renderFieldEditor()}
            </CardContent>
          </Card>
        )}
      </div>
      </div>
    </div>
  )
}