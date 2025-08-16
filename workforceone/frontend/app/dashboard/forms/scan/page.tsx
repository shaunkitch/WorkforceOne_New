'use client'

import { useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  Upload,
  Camera,
  Scan,
  Eye,
  Edit3,
  Save,
  ArrowLeft,
  AlertCircle,
  CheckCircle,
  Trash2,
  Settings,
  Wand2,
  Image as ImageIcon,
  FileText,
  Zap
} from 'lucide-react'
import { DetectedField, FormAnalysisResult } from '@/lib/claude-form-scanner'
import Image from 'next/image'

interface FormScannerStep {
  id: string
  title: string
  description: string
  icon: React.ReactNode
  status: 'pending' | 'active' | 'completed' | 'error'
}

export default function FormScannerPage() {
  const router = useRouter()
  const supabase = createClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [currentStep, setCurrentStep] = useState(0)
  const [uploadedImage, setUploadedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [analysisResult, setAnalysisResult] = useState<FormAnalysisResult | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisProgress, setAnalysisProgress] = useState(0)
  const [editedForm, setEditedForm] = useState<{
    title: string
    description: string
    fields: DetectedField[]
  } | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const steps: FormScannerStep[] = [
    {
      id: 'upload',
      title: 'Upload Form Image',
      description: 'Take a photo or upload an image of your paper form',
      icon: <Upload className="h-5 w-5" />,
      status: currentStep === 0 ? 'active' : currentStep > 0 ? 'completed' : 'pending'
    },
    {
      id: 'analyze',
      title: 'AI Analysis',
      description: 'Claude AI analyzes your form structure and fields',
      icon: <Wand2 className="h-5 w-5" />,
      status: currentStep === 1 ? 'active' : currentStep > 1 ? 'completed' : 'pending'
    },
    {
      id: 'review',
      title: 'Review & Edit',
      description: 'Review detected fields and make adjustments',
      icon: <Edit3 className="h-5 w-5" />,
      status: currentStep === 2 ? 'active' : currentStep > 2 ? 'completed' : 'pending'
    },
    {
      id: 'save',
      title: 'Save Form',
      description: 'Save your digital form to the library',
      icon: <Save className="h-5 w-5" />,
      status: currentStep === 3 ? 'active' : currentStep > 3 ? 'completed' : 'pending'
    }
  ]

  const handleFileSelect = useCallback((file: File) => {
    // Validate file
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file')
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB')
      return
    }

    setUploadedImage(file)
    
    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleFileSelect(files[0])
    }
  }, [handleFileSelect])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
  }, [])

  const startAnalysis = async () => {
    if (!uploadedImage) return

    setIsAnalyzing(true)
    setAnalysisProgress(0)
    setCurrentStep(1)

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setAnalysisProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 500)

      const formData = new FormData()
      formData.append('image', uploadedImage)

      const response = await fetch('/api/forms/scan', {
        method: 'POST',
        body: formData
      })

      clearInterval(progressInterval)
      setAnalysisProgress(100)

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Analysis failed')
      }

      const result: FormAnalysisResult = await response.json()
      
      if (!result.success) {
        throw new Error(result.error || 'Analysis failed')
      }

      setAnalysisResult(result)
      setEditedForm({
        title: result.title,
        description: result.description,
        fields: result.fields
      })
      
      setTimeout(() => {
        setCurrentStep(2)
        setIsAnalyzing(false)
      }, 1000)

    } catch (error) {
      console.error('Analysis error:', error)
      alert(error instanceof Error ? error.message : 'Analysis failed')
      setIsAnalyzing(false)
      setCurrentStep(0)
    }
  }

  const updateField = (fieldId: string, updates: Partial<DetectedField>) => {
    if (!editedForm) return

    setEditedForm({
      ...editedForm,
      fields: editedForm.fields.map(field =>
        field.id === fieldId ? { ...field, ...updates } : field
      )
    })
  }

  const removeField = (fieldId: string) => {
    if (!editedForm) return

    setEditedForm({
      ...editedForm,
      fields: editedForm.fields.filter(field => field.id !== fieldId)
    })
  }

  const addField = () => {
    if (!editedForm) return

    const newField: DetectedField = {
      id: `field_${Date.now()}`,
      type: 'text',
      label: 'New Field',
      required: false,
      confidence: 1.0
    }

    setEditedForm({
      ...editedForm,
      fields: [...editedForm.fields, newField]
    })
  }

  const saveForm = async () => {
    if (!editedForm) return

    setIsSaving(true)
    setCurrentStep(3)

    try {
      const { data: user } = await supabase.auth.getUser()
      if (!user.user) throw new Error('Not authenticated')

      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.user.id)
        .single()

      if (!profile?.organization_id) throw new Error('No organization found')

      // Create the form
      const { data: form, error } = await supabase
        .from('forms')
        .insert({
          title: editedForm.title,
          description: editedForm.description,
          fields: editedForm.fields,
          organization_id: profile.organization_id,
          created_by: user.user.id,
          status: 'draft',
          settings: {
            source: 'ai_scan',
            originalConfidence: analysisResult?.confidence,
            layoutType: analysisResult?.layoutType
          }
        })
        .select()
        .single()

      if (error) throw error

      alert('Form saved successfully!')
      router.push(`/dashboard/forms/builder/${form.id}`)

    } catch (error) {
      console.error('Save error:', error)
      alert(error instanceof Error ? error.message : 'Failed to save form')
    } finally {
      setIsSaving(false)
    }
  }

  const getFieldTypeIcon = (type: string) => {
    const icons: Record<string, React.ReactNode> = {
      text: <FileText className="h-4 w-4" />,
      textarea: <FileText className="h-4 w-4" />,
      email: <FileText className="h-4 w-4" />,
      number: <FileText className="h-4 w-4" />,
      select: <FileText className="h-4 w-4" />,
      radio: <FileText className="h-4 w-4" />,
      checkbox: <FileText className="h-4 w-4" />,
      signature: <Edit3 className="h-4 w-4" />,
      file: <Upload className="h-4 w-4" />,
      rating: <FileText className="h-4 w-4" />
    }
    return icons[type] || <FileText className="h-4 w-4" />
  }

  const getStepIcon = (step: FormScannerStep) => {
    if (step.status === 'completed') {
      return <CheckCircle className="h-5 w-5 text-green-600" />
    }
    if (step.status === 'error') {
      return <AlertCircle className="h-5 w-5 text-red-600" />
    }
    return step.icon
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              onClick={() => router.push('/dashboard/forms')}
              className="hover:shadow-md transition-all"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Forms
            </Button>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                AI Form Scanner
              </h1>
              <p className="text-gray-600 flex items-center">
                <Zap className="h-4 w-4 mr-1 text-yellow-500" />
                Powered by Claude AI
              </p>
            </div>
          </div>
        </div>

        {/* Progress Steps */}
        <Card className="bg-white/80 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              {steps.map((step, index) => (
                <div key={step.id} className="flex items-center">
                  <div className={`flex items-center space-x-3 ${
                    step.status === 'active' ? 'text-blue-600' : 
                    step.status === 'completed' ? 'text-green-600' : 
                    'text-gray-400'
                  }`}>
                    <div className={`p-3 rounded-full ${
                      step.status === 'active' ? 'bg-blue-100' :
                      step.status === 'completed' ? 'bg-green-100' :
                      'bg-gray-100'
                    }`}>
                      {getStepIcon(step)}
                    </div>
                    <div>
                      <h3 className="font-semibold">{step.title}</h3>
                      <p className="text-sm opacity-70">{step.description}</p>
                    </div>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`w-16 h-0.5 mx-4 ${
                      step.status === 'completed' ? 'bg-green-300' : 'bg-gray-200'
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Step Content */}
        {currentStep === 0 && (
          <Card className="bg-white/90 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center">
                <ImageIcon className="h-5 w-5 mr-2 text-blue-600" />
                Upload Form Image
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!uploadedImage ? (
                <div
                  className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-blue-400 transition-colors cursor-pointer"
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                    className="hidden"
                  />
                  <div className="space-y-4">
                    <div className="flex justify-center space-x-4">
                      <div className="p-4 bg-blue-100 rounded-full">
                        <Upload className="h-8 w-8 text-blue-600" />
                      </div>
                      <div className="p-4 bg-green-100 rounded-full">
                        <Camera className="h-8 w-8 text-green-600" />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-800 mb-2">
                        Upload or Scan Your Form
                      </h3>
                      <p className="text-gray-600 mb-4">
                        Take a photo of your paper form or upload an existing image
                      </p>
                      <Button className="bg-gradient-to-r from-blue-600 to-purple-600">
                        <Upload className="h-4 w-4 mr-2" />
                        Choose Image
                      </Button>
                    </div>
                    <div className="text-sm text-gray-500">
                      <p>Supported formats: JPEG, PNG, WebP</p>
                      <p>Maximum size: 10MB</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="relative">
                    <Image
                      src={imagePreview!}
                      alt="Uploaded form"
                      width={800}
                      height={600}
                      className="w-full max-w-2xl mx-auto rounded-lg shadow-lg"
                    />
                  </div>
                  <div className="flex justify-center space-x-4">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setUploadedImage(null)
                        setImagePreview(null)
                      }}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Remove Image
                    </Button>
                    <Button
                      onClick={startAnalysis}
                      className="bg-gradient-to-r from-blue-600 to-purple-600"
                    >
                      <Scan className="h-4 w-4 mr-2" />
                      Analyze Form
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {currentStep === 1 && isAnalyzing && (
          <Card className="bg-white/90 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Wand2 className="h-5 w-5 mr-2 text-purple-600" />
                AI Analysis in Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-600 mx-auto mb-4"></div>
                  <h3 className="text-lg font-semibold mb-2">Analyzing Your Form</h3>
                  <p className="text-gray-600">
                    Claude AI is examining your form to identify fields, labels, and structure...
                  </p>
                </div>
                <Progress value={analysisProgress} className="w-full" />
                <div className="text-center text-sm text-gray-500">
                  {analysisProgress}% complete
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {currentStep === 2 && editedForm && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Form Preview */}
            <Card className="bg-white/90 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Eye className="h-5 w-5 mr-2 text-green-600" />
                  Original Image
                </CardTitle>
              </CardHeader>
              <CardContent>
                {imagePreview && (
                  <Image
                    src={imagePreview}
                    alt="Original form"
                    width={400}
                    height={300}
                    className="w-full rounded-lg shadow-md"
                  />
                )}
              </CardContent>
            </Card>

            {/* Form Editor */}
            <Card className="bg-white/90 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Edit3 className="h-5 w-5 mr-2 text-blue-600" />
                  Detected Form Structure
                </CardTitle>
                {analysisResult && (
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline">
                      Confidence: {Math.round(analysisResult.confidence * 100)}%
                    </Badge>
                    <Badge variant="outline">
                      Layout: {analysisResult.layoutType}
                    </Badge>
                  </div>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="formTitle">Form Title</Label>
                  <Input
                    id="formTitle"
                    value={editedForm.title}
                    onChange={(e) => setEditedForm({
                      ...editedForm,
                      title: e.target.value
                    })}
                  />
                </div>

                <div>
                  <Label htmlFor="formDescription">Description</Label>
                  <Textarea
                    id="formDescription"
                    value={editedForm.description}
                    onChange={(e) => setEditedForm({
                      ...editedForm,
                      description: e.target.value
                    })}
                    rows={2}
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold">Detected Fields ({editedForm.fields.length})</h4>
                    <Button size="sm" variant="outline" onClick={addField}>
                      <FileText className="h-4 w-4 mr-1" />
                      Add Field
                    </Button>
                  </div>
                  
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {editedForm.fields.map((field, index) => (
                      <div key={field.id} className="border rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <span className="text-blue-600">{getFieldTypeIcon(field.type)}</span>
                            <Badge variant="outline" className="text-xs">
                              {field.type}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {Math.round(field.confidence * 100)}%
                            </Badge>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => removeField(field.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        
                        <div className="space-y-2">
                          <Input
                            value={field.label}
                            onChange={(e) => updateField(field.id, { label: e.target.value })}
                            placeholder="Field label"
                            className="text-sm"
                          />
                          
                          {field.options && (
                            <div>
                              <Label className="text-xs">Options</Label>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {field.options.map((option, optIndex) => (
                                  <Badge key={optIndex} variant="secondary" className="text-xs">
                                    {option}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex justify-center space-x-4 pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentStep(0)}
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                  </Button>
                  <Button
                    onClick={saveForm}
                    disabled={isSaving}
                    className="bg-gradient-to-r from-green-600 to-blue-600"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {isSaving ? 'Saving...' : 'Save Form'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}