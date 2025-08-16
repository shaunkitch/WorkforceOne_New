'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
// Using native HTML table elements instead of Table components
import { 
  FileText, 
  Search,
  Filter,
  Eye,
  Download,
  Calendar,
  User,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  MapPin,
  ExternalLink,
  Copy,
  Printer,
  Mail,
  FileDown
} from 'lucide-react'
import { format, parseISO } from 'date-fns'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

interface FormResponse {
  id: string
  form_id: string
  respondent_id: string
  responses: any
  status: 'draft' | 'completed' | 'pending'
  submitted_at: string
  created_at: string
  updated_at: string
  location_latitude?: number
  location_longitude?: number
  location_accuracy?: number
  location_timestamp?: string
  form: {
    id: string
    title: string
    description?: string
    fields?: any[]
  }
  user: {
    id: string
    full_name: string
    email: string
  }
}

interface FilterState {
  form_id: string
  status: string
  user_id: string
  date_range: string
  search: string
}

export default function SubmissionsPage() {
  const [submissions, setSubmissions] = useState<FormResponse[]>([])
  const [forms, setForms] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [filters, setFilters] = useState<FilterState>({
    form_id: 'all',
    status: 'all',
    user_id: 'all',
    date_range: 'all',
    search: ''
  })

  const supabase = createClient()

  useEffect(() => {
    fetchUserProfile()
    fetchForms()
    fetchUsers()
    fetchSubmissions()
  }, [filters])

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
      // Error handled silently
    }
  }

  const fetchForms = async () => {
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
        .from('forms')
        .select('id, title, description, status')
        .eq('organization_id', profile.organization_id)
        .order('title')

      if (error) throw error
      setForms(data || [])
    } catch (error) {
      // Error handled silently
    }
  }

  const fetchUsers = async () => {
    try {
      const { data: user } = await supabase.auth.getUser()
      if (!user.user) return

      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id, role')
        .eq('id', user.user.id)
        .single()

      if (!profile?.organization_id) return

      // Only managers and admins can see all users
      if (profile.role === 'admin' || profile.role === 'manager') {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, full_name, email, role')
          .eq('organization_id', profile.organization_id)
          .order('full_name')

        if (error) throw error
        setUsers(data || [])
      }
    } catch (error) {
      // Error handled silently
    }
  }

  const fetchSubmissions = async () => {
    try {
      const { data: user } = await supabase.auth.getUser()
      if (!user.user) return

      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id, role')
        .eq('id', user.user.id)
        .single()

      if (!profile?.organization_id) return

      let query = supabase
        .from('form_responses')
        .select(`
          *,
          form:forms(id, title, description, fields),
          user:profiles!respondent_id(id, full_name, email)
        `)
        .eq('organization_id', profile.organization_id)
        .order('submitted_at', { ascending: false, nullsFirst: false })

      // Apply filters
      if (filters.form_id !== 'all') {
        query = query.eq('form_id', filters.form_id)
      }

      if (filters.status !== 'all') {
        query = query.eq('status', filters.status)
      }

      if (filters.user_id !== 'all') {
        query = query.eq('respondent_id', filters.user_id)
      }

      // Date range filter
      if (filters.date_range !== 'all') {
        const now = new Date()
        let startDate: Date

        switch (filters.date_range) {
          case 'today':
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
            break
          case 'week':
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
            break
          case 'month':
            startDate = new Date(now.getFullYear(), now.getMonth(), 1)
            break
          default:
            startDate = new Date(0)
        }

        query = query.gte('submitted_at', startDate.toISOString())
      }

      // For regular users, only show their own submissions
      if (profile.role === 'member') {
        query = query.eq('respondent_id', user.user.id)
      }

      const { data, error } = await query.limit(1000)

      if (error) {
        // Query error handled
        throw error
      }

      let processedData = data || []
      
      // Process submission data for display
      if (processedData.length > 0) {
        // Data validation passed
      }

      // Apply search filter client-side for better UX
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase()
        processedData = processedData.filter(submission => 
          submission.form?.title.toLowerCase().includes(searchTerm) ||
          submission.user?.full_name.toLowerCase().includes(searchTerm) ||
          submission.user?.email.toLowerCase().includes(searchTerm)
        )
      }

      setSubmissions(processedData)
    } catch (error) {
      // Error handled silently
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'draft':
        return <AlertCircle className="h-4 w-4 text-yellow-600" />
      case 'pending':
        return <Clock className="h-4 w-4 text-blue-600" />
      default:
        return <XCircle className="h-4 w-4 text-red-600" />
    }
  }

  const getStatusBadge = (status: string) => {
    const colors = {
      completed: 'bg-green-100 text-green-800',
      draft: 'bg-yellow-100 text-yellow-800',
      pending: 'bg-blue-100 text-blue-800'
    }

    return (
      <Badge className={colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-800'}>
        {status.toUpperCase()}
      </Badge>
    )
  }

  const exportToCSV = () => {
    const headers = ['Form Title', 'Submitted By', 'Status', 'Submitted At', 'Response Data']
    const csvContent = [
      headers.join(','),
      ...submissions.map(submission => [
        `"${submission.form?.title || 'Unknown Form'}"`,
        `"${submission.user?.full_name || 'Unknown User'}"`,
        submission.status,
        submission.submitted_at ? format(parseISO(submission.submitted_at), 'yyyy-MM-dd HH:mm:ss') : 'Not submitted',
        `"${JSON.stringify(submission.responses).replace(/"/g, '""')}"`
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `form-submissions-${format(new Date(), 'yyyy-MM-dd')}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const [selectedSubmission, setSelectedSubmission] = useState<FormResponse | null>(null)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [isPdfGenerating, setIsPdfGenerating] = useState(false)

  const viewSubmission = (submission: FormResponse) => {
    // Open submission for viewing
    // Submission: submission.id
    setSelectedSubmission(submission)
    setIsViewModalOpen(true)
  }

  const closeViewModal = () => {
    setIsViewModalOpen(false)
    setSelectedSubmission(null)
  }

  const formatFieldValue = (field: any, value: any) => {
    if (!value && value !== 0 && value !== false) return 'No response'
    
    switch (field?.type) {
      case 'multiselect':
      case 'checkbox':
      case 'checkboxes':
        return Array.isArray(value) ? value.join(', ') : String(value)
      case 'rating':
        return `${value}/5 stars`
      case 'likert':
        return String(value)
      case 'email':
        return (
          <a href={`mailto:${value}`} className="text-blue-600 hover:underline">
            {value}
          </a>
        )
      case 'phone':
        return (
          <a href={`tel:${value}`} className="text-blue-600 hover:underline">
            {value}
          </a>
        )
      case 'url':
        return (
          <a href={value} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center">
            {value} <ExternalLink className="h-3 w-3 ml-1" />
          </a>
        )
      case 'date':
        return value ? format(parseISO(value), 'MMM d, yyyy') : 'No date'
      case 'datetime':
        return value ? format(parseISO(value), 'MMM d, yyyy HH:mm') : 'No date'
      default:
        return String(value)
    }
  }

  const openGoogleMaps = (lat: number, lng: number) => {
    const url = `https://www.google.com/maps?q=${lat},${lng}&z=18&t=h`
    window.open(url, '_blank')
  }

  const getStaticMapUrl = (lat: number, lng: number, size = '100x100') => {
    // Using OpenStreetMap-based static map (free alternative to Google Maps)
    return `https://api.mapbox.com/styles/v1/mapbox/satellite-streets-v11/static/pin-s+ff0000(${lng},${lat})/${lng},${lat},15/${size}?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw`
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      // You could add a toast notification here
      // Successfully copied to clipboard
    } catch (err) {
      // Copy operation failed
    }
  }

  const handlePrint = () => {
    const printContent = generatePrintableContent(selectedSubmission!)
    const printWindow = window.open('', '_blank', 'width=800,height=600')
    
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Form Response - ${selectedSubmission?.form?.title}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
            .header { border-bottom: 2px solid #3b82f6; padding-bottom: 10px; margin-bottom: 20px; }
            .form-title { color: #1f2937; font-size: 24px; font-weight: bold; margin: 0; }
            .meta-info { color: #6b7280; font-size: 14px; margin-top: 5px; }
            .response-item { margin-bottom: 15px; border: 1px solid #e5e7eb; padding: 15px; border-radius: 8px; }
            .field-label { font-weight: bold; color: #374151; margin-bottom: 5px; }
            .field-value { color: #1f2937; font-size: 16px; }
            .gps-section { background: #eff6ff; padding: 15px; border-radius: 8px; margin: 20px 0; }
            .metadata-section { background: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0; }
            .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280; }
            @media print { .no-print { display: none; } }
          </style>
        </head>
        <body>
          ${printContent}
          <div class="footer">
            <p>Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}</p>
            <p>Form Response ID: ${selectedSubmission?.id}</p>
          </div>
        </body>
        </html>
      `)
      printWindow.document.close()
      printWindow.focus()
      printWindow.print()
      printWindow.close()
    }
  }

  const generatePrintableContent = (submission: FormResponse): string => {
    const responses = Object.entries(submission.responses || {})
      .filter(([key]) => key !== '_metadata')
      .map(([key, value]) => {
        const field = submission.form?.fields?.find(f => f.id === key)
        const fieldLabel = field?.label || key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
        
        return `
          <div class="response-item">
            <div class="field-label">${fieldLabel}</div>
            <div class="field-value">${typeof value === 'object' ? JSON.stringify(value) : String(value || 'No response')}</div>
          </div>
        `
      }).join('')

    const gpsSection = submission.location_latitude && submission.location_longitude ? `
      <div class="gps-section">
        <h3>📍 GPS Location</h3>
        <p><strong>Coordinates:</strong> ${submission.location_latitude.toFixed(6)}, ${submission.location_longitude.toFixed(6)}</p>
        ${submission.location_accuracy ? `<p><strong>Accuracy:</strong> ±${Math.round(submission.location_accuracy)}m</p>` : ''}
        <p><strong>View on Maps:</strong> <a href="https://www.google.com/maps?q=${submission.location_latitude},${submission.location_longitude}" target="_blank">Open in Google Maps</a></p>
      </div>
    ` : ''

    const metadataSection = submission.responses?._metadata ? `
      <div class="metadata-section">
        <h3>📋 Additional Information</h3>
        ${Object.entries(submission.responses._metadata).map(([key, value]) => `
          <p><strong>${key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}:</strong> ${String(value)}</p>
        `).join('')}
      </div>
    ` : ''

    return `
      <div class="header">
        <div class="form-title">📋 ${submission.form?.title || 'Form Response'}</div>
        <div class="meta-info">
          Submitted by: ${submission.user?.full_name || 'Unknown User'} (${submission.user?.email || 'No email'}) • 
          ${submission.submitted_at ? format(parseISO(submission.submitted_at), 'MMMM d, yyyy \'at\' h:mm a') : 'Not submitted'}
        </div>
      </div>
      
      <h2>Form Responses</h2>
      ${responses}
      
      ${gpsSection}
      ${metadataSection}
    `
  }

  const handleEmail = () => {
    if (!selectedSubmission) return
    
    const subject = encodeURIComponent(`Form Response: ${selectedSubmission.form?.title || 'Form Submission'}`)
    const body = encodeURIComponent(`
Form Response Details:

Form: ${selectedSubmission.form?.title || 'Unknown Form'}
Submitted by: ${selectedSubmission.user?.full_name || 'Unknown User'}
Date: ${selectedSubmission.submitted_at ? format(parseISO(selectedSubmission.submitted_at), 'MMMM d, yyyy \'at\' h:mm a') : 'Not submitted'}

Responses:
${Object.entries(selectedSubmission.responses || {})
  .filter(([key]) => key !== '_metadata')
  .map(([key, value]) => {
    const field = selectedSubmission.form?.fields?.find(f => f.id === key)
    const fieldLabel = field?.label || key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
    return `${fieldLabel}: ${typeof value === 'object' ? JSON.stringify(value) : String(value || 'No response')}`
  }).join('\n')}

${selectedSubmission.location_latitude && selectedSubmission.location_longitude ? 
  `\nGPS Location: ${selectedSubmission.location_latitude.toFixed(6)}, ${selectedSubmission.location_longitude.toFixed(6)}
View on Maps: https://www.google.com/maps?q=${selectedSubmission.location_latitude},${selectedSubmission.location_longitude}` : ''}

Form Response ID: ${selectedSubmission.id}
Generated: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}
    `)

    window.location.href = `mailto:?subject=${subject}&body=${body}`
  }

  const handleSavePDF = async () => {
    if (!selectedSubmission) return

    setIsPdfGenerating(true)
    try {
      // Create a temporary div with the content to convert to PDF
      const tempDiv = document.createElement('div')
      tempDiv.innerHTML = `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 800px;">
          ${generatePrintableContent(selectedSubmission)}
        </div>
      `
      tempDiv.style.position = 'absolute'
      tempDiv.style.left = '-9999px'
      tempDiv.style.background = 'white'
      document.body.appendChild(tempDiv)

      // Convert to canvas
      const canvas = await html2canvas(tempDiv, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      })

      // Remove temporary div
      document.body.removeChild(tempDiv)

      // Create PDF
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF('p', 'mm', 'a4')
      
      const imgWidth = 210 // A4 width in mm
      const pageHeight = 295 // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width
      let heightLeft = imgHeight

      let position = 0

      // Add first page
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
      heightLeft -= pageHeight

      // Add additional pages if needed
      while (heightLeft >= 0) {
        position = heightLeft - imgHeight
        pdf.addPage()
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
        heightLeft -= pageHeight
      }

      // Save the PDF
      const fileName = `form-response-${selectedSubmission.form?.title?.replace(/[^a-z0-9]/gi, '_') || 'submission'}-${format(new Date(), 'yyyy-MM-dd')}.pdf`
      pdf.save(fileName)

    } catch (error) {
      // PDF generation failed
      alert('Failed to generate PDF. Please try again.')
    } finally {
      setIsPdfGenerating(false)
    }
  }

  const getStats = () => {
    return {
      total: submissions.length,
      completed: submissions.filter(s => s.status === 'completed').length,
      draft: submissions.filter(s => s.status === 'draft').length,
      pending: submissions.filter(s => s.status === 'pending').length
    }
  }

  const stats = getStats()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Form Submissions</h1>
          <p className="text-gray-600">View and manage form responses from your team.</p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline" onClick={exportToCSV} disabled={submissions.length === 0}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <FileText className="h-8 w-8 text-blue-600 mx-auto mb-2" />
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-sm text-gray-600">Total Submissions</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <div className="text-2xl font-bold">{stats.completed}</div>
            <div className="text-sm text-gray-600">Completed</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Clock className="h-8 w-8 text-blue-600 mx-auto mb-2" />
            <div className="text-2xl font-bold">{stats.pending}</div>
            <div className="text-sm text-gray-600">Pending</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <AlertCircle className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
            <div className="text-2xl font-bold">{stats.draft}</div>
            <div className="text-sm text-gray-600">Draft</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search submissions..."
                value={filters.search}
                onChange={(e) => setFilters({...filters, search: e.target.value})}
                className="pl-10"
              />
            </div>
            
            <Select value={filters.form_id} onValueChange={(value) => setFilters({...filters, form_id: value})}>
              <SelectTrigger>
                <SelectValue placeholder="All Forms" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Forms</SelectItem>
                {forms.map(form => (
                  <SelectItem key={form.id} value={form.id}>
                    {form.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filters.status} onValueChange={(value) => setFilters({...filters, status: value})}>
              <SelectTrigger>
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
              </SelectContent>
            </Select>

            {users.length > 0 && (
              <Select value={filters.user_id} onValueChange={(value) => setFilters({...filters, user_id: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="All Users" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  {users.map(user => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.full_name || user.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            <Select value={filters.date_range} onValueChange={(value) => setFilters({...filters, date_range: value})}>
              <SelectTrigger>
                <SelectValue placeholder="All Time" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">Last 7 Days</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Submissions Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center">
              <div className="text-gray-500">Loading submissions...</div>
            </div>
          ) : submissions.length === 0 ? (
            <div className="p-8 text-center">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No submissions found</h3>
              <p className="text-gray-500">No form submissions match your current filters.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left p-3 font-medium">Form</th>
                    <th className="text-left p-3 font-medium">Submitted By</th>
                    <th className="text-left p-3 font-medium">Status</th>
                    <th className="text-left p-3 font-medium">Location</th>
                    <th className="text-left p-3 font-medium">Submitted</th>
                    <th className="text-left p-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {submissions.map((submission) => (
                    <tr key={submission.id} className="border-b hover:bg-gray-50">
                      <td className="p-3">
                        <div>
                          <div className="font-medium">{submission.form?.title || 'Unknown Form'}</div>
                          {submission.form?.description && (
                            <div className="text-sm text-gray-500 truncate max-w-xs">
                              {submission.form.description}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center">
                          <User className="h-4 w-4 text-gray-400 mr-2" />
                          <div>
                            <div className="font-medium">{submission.user?.full_name || 'Unknown User'}</div>
                            <div className="text-sm text-gray-500">{submission.user?.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center">
                          {getStatusIcon(submission.status)}
                          <span className="ml-2">{getStatusBadge(submission.status)}</span>
                        </div>
                      </td>
                      <td className="p-3">
                        {submission.location_latitude && submission.location_longitude ? (
                          <div className="flex items-center text-sm text-green-600">
                            <MapPin className="h-4 w-4 mr-1" />
                            GPS
                          </div>
                        ) : (
                          <div className="flex items-center text-sm text-gray-400">
                            <MapPin className="h-4 w-4 mr-1 opacity-30" />
                            No GPS
                          </div>
                        )}
                      </td>
                      <td className="p-3">
                        <div className="flex items-center text-sm">
                          <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                          {submission.submitted_at ? (
                            <div>
                              <div>{format(parseISO(submission.submitted_at), 'MMM d, yyyy')}</div>
                              <div className="text-gray-500">{format(parseISO(submission.submitted_at), 'HH:mm')}</div>
                            </div>
                          ) : (
                            <span className="text-gray-400">Not submitted</span>
                          )}
                        </div>
                      </td>
                      <td className="p-3">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => viewSubmission(submission)}
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          View
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Form Response View Modal - Simple Overlay */}
      {isViewModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={closeViewModal}>
          <div className="bg-white rounded-lg max-w-4xl max-h-[90vh] overflow-y-auto m-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Form Response Details</h2>
                <div className="flex items-center space-x-3">
                  {selectedSubmission && (
                    <>
                      <Badge className={
                        selectedSubmission.status === 'completed' ? 'bg-green-100 text-green-800' :
                        selectedSubmission.status === 'draft' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-blue-100 text-blue-800'
                      }>
                        {selectedSubmission.status.toUpperCase()}
                      </Badge>
                      
                      {/* Action Buttons */}
                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handlePrint}
                          className="flex items-center space-x-1"
                        >
                          <Printer className="h-4 w-4" />
                          <span>Print</span>
                        </Button>
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleEmail}
                          className="flex items-center space-x-1"
                        >
                          <Mail className="h-4 w-4" />
                          <span>Email</span>
                        </Button>
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleSavePDF}
                          disabled={isPdfGenerating}
                          className="flex items-center space-x-1"
                        >
                          {isPdfGenerating ? (
                            <>
                              <div className="animate-spin h-4 w-4 border-2 border-gray-300 border-t-blue-600 rounded-full"></div>
                              <span>Generating...</span>
                            </>
                          ) : (
                            <>
                              <FileDown className="h-4 w-4" />
                              <span>PDF</span>
                            </>
                          )}
                        </Button>
                      </div>
                    </>
                  )}
                  <button 
                    onClick={closeViewModal}
                    className="text-gray-400 hover:text-gray-600 text-2xl font-bold ml-4"
                  >
                    ×
                  </button>
                </div>
              </div>
            </div>
            
            <div className="p-6">
          {selectedSubmission ? (
            <div className="space-y-6">
              {/* Quick Summary */}
              <div className="p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
                <h3 className="text-lg font-bold text-blue-900 mb-2">
                  📋 {selectedSubmission.form?.title || 'Form Response'}
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-blue-700">Submitted by:</span>
                    <span className="ml-2 text-blue-900 font-semibold">{selectedSubmission.user?.full_name}</span>
                  </div>
                  <div>
                    <span className="font-medium text-blue-700">Date:</span>
                    <span className="ml-2 text-blue-900 font-semibold">
                      {selectedSubmission.submitted_at ? format(parseISO(selectedSubmission.submitted_at), 'MMM d, yyyy HH:mm') : 'Not submitted'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Debug Info */}
              <div className="p-4 bg-yellow-50 rounded border text-xs">
                <details>
                  <summary className="cursor-pointer font-medium">🔧 Debug Info (Click to expand)</summary>
                  <pre className="mt-2 text-xs overflow-auto max-h-32">
                    {JSON.stringify({
                      id: selectedSubmission.id,
                      responses: selectedSubmission.responses,
                      form_fields: selectedSubmission.form?.fields,
                      has_form: !!selectedSubmission.form,
                      has_responses: !!selectedSubmission.responses
                    }, null, 2)}
                  </pre>
                </details>
              </div>

              {/* Header Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-slate-50 rounded-lg border-2 border-slate-200">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Form Information</h3>
                  <div className="space-y-1 text-sm">
                    <div><span className="font-medium text-slate-700">Form:</span> <span className="text-slate-900">{selectedSubmission.form?.title || 'Unknown Form'}</span></div>
                    <div><span className="font-medium text-slate-700">Description:</span> <span className="text-slate-900">{selectedSubmission.form?.description || 'No description'}</span></div>
                    <div><span className="font-medium text-slate-700">Submission ID:</span> <span className="text-slate-900 font-mono text-xs">{selectedSubmission.id}</span></div>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Submission Details</h3>
                  <div className="space-y-1 text-sm">
                    <div><span className="font-medium text-slate-700">Submitted by:</span> <span className="text-slate-900">{selectedSubmission.user?.full_name || 'Unknown User'}</span></div>
                    <div><span className="font-medium text-slate-700">Email:</span> <span className="text-slate-900">{selectedSubmission.user?.email || 'No email'}</span></div>
                    <div><span className="font-medium text-slate-700">Submitted:</span> <span className="text-slate-900">{
                      selectedSubmission.submitted_at ? 
                      format(parseISO(selectedSubmission.submitted_at), 'MMM d, yyyy \'at\' HH:mm') : 
                      'Not submitted'
                    }</span></div>
                  </div>
                </div>
              </div>

              {/* GPS Location */}
              {selectedSubmission.location_latitude && selectedSubmission.location_longitude && (
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-gray-900 flex items-center">
                      <MapPin className="h-5 w-5 mr-2 text-blue-600" />
                      GPS Location
                    </h3>
                    <div className="flex space-x-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => copyToClipboard(`${selectedSubmission.location_latitude},${selectedSubmission.location_longitude}`)}
                      >
                        <Copy className="h-3 w-3 mr-1" />
                        Copy
                      </Button>
                      <Button 
                        size="sm"
                        onClick={() => openGoogleMaps(selectedSubmission.location_latitude!, selectedSubmission.location_longitude!)}
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        View on Maps
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-start space-x-4">
                    <div className="flex-1">
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="bg-white p-2 rounded border">
                          <span className="font-medium text-blue-700">Latitude:</span> 
                          <span className="ml-2 font-mono text-gray-900">{selectedSubmission.location_latitude.toFixed(6)}</span>
                        </div>
                        <div className="bg-white p-2 rounded border">
                          <span className="font-medium text-blue-700">Longitude:</span> 
                          <span className="ml-2 font-mono text-gray-900">{selectedSubmission.location_longitude.toFixed(6)}</span>
                        </div>
                        {selectedSubmission.location_accuracy && (
                          <div className="bg-white p-2 rounded border">
                            <span className="font-medium text-blue-700">Accuracy:</span> 
                            <span className="ml-2 text-gray-900">±{Math.round(selectedSubmission.location_accuracy)}m</span>
                          </div>
                        )}
                        {selectedSubmission.location_timestamp && (
                          <div className="bg-white p-2 rounded border">
                            <span className="font-medium text-blue-700">Captured:</span> 
                            <span className="ml-2 text-gray-900">{format(parseISO(selectedSubmission.location_timestamp), 'HH:mm:ss')}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      <img 
                        src={getStaticMapUrl(selectedSubmission.location_latitude, selectedSubmission.location_longitude, '150x150')}
                        alt="Location map"
                        className="w-[150px] h-[150px] rounded border border-gray-300 cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => openGoogleMaps(selectedSubmission.location_latitude!, selectedSubmission.location_longitude!)}
                        onError={(e) => {
                          // Fallback to a simple placeholder if map doesn't load
                          (e.target as HTMLImageElement).src = `data:image/svg+xml;base64,${btoa(`
                            <svg width="150" height="150" xmlns="http://www.w3.org/2000/svg">
                              <rect width="150" height="150" fill="#f3f4f6"/>
                              <text x="75" y="75" text-anchor="middle" dy=".3em" fill="#6b7280" font-size="12">Map Unavailable</text>
                              <text x="75" y="90" text-anchor="middle" dy=".3em" fill="#6b7280" font-size="10">Click to view</text>
                            </svg>
                          `)}`
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Form Responses */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-4">Form Responses</h3>
                
                <div className="space-y-4">
                  {selectedSubmission.responses && Object.keys(selectedSubmission.responses).length > 0 ? (
                    Object.entries(selectedSubmission.responses).map(([key, value]) => {
                      if (key === '_metadata') return null
                      
                      // Try to find the field definition to get proper label
                      const field = selectedSubmission.form?.fields?.find(f => f.id === key)
                      const fieldLabel = field?.label || key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
                      
                      return (
                        <div key={key} className="border-2 border-gray-200 rounded-lg p-4 bg-white shadow-sm">
                          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                            <div className="lg:col-span-1">
                              <label className="font-medium text-gray-900 block mb-1">
                                {fieldLabel}
                                {field?.required && <span className="text-red-500 ml-1">*</span>}
                              </label>
                              <div className="text-sm text-gray-500">
                                {field?.type && (
                                  <span>Type: <span className="font-mono bg-gray-100 px-1 rounded text-xs">{field.type}</span></span>
                                )}
                              </div>
                              <div className="text-xs text-gray-400 mt-1">
                                Field ID: <span className="font-mono">{key}</span>
                              </div>
                            </div>
                            <div className="lg:col-span-2">
                              <div className="p-4 bg-white rounded border-2 border-blue-200 min-h-[60px] flex items-center shadow-sm">
                                <div className="w-full break-words">
                                  {typeof value === 'object' ? (
                                    <pre className="text-sm font-mono bg-gray-100 p-3 rounded overflow-auto border">
                                      {JSON.stringify(value, null, 2)}
                                    </pre>
                                  ) : (
                                    <span className="text-xl font-semibold text-gray-900">{String(value || 'No response')}</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })
                  ) : (
                    <div className="p-8 text-center border-2 border-dashed border-gray-300 rounded-lg">
                      <p className="text-gray-500">No response data found</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Metadata */}
              {selectedSubmission.responses?._metadata && Object.keys(selectedSubmission.responses._metadata).length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-4">Additional Information</h3>
                  <div className="bg-blue-50 rounded-lg p-4 border-2 border-blue-200">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      {Object.entries(selectedSubmission.responses._metadata).map(([key, value]) => (
                        <div key={key} className="flex flex-col">
                          <span className="font-semibold text-blue-800 mb-2">
                            {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}:
                          </span>
                          <span className="text-gray-900 font-medium bg-white px-3 py-2 rounded border-2 border-blue-200 text-lg">
                            {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-8 text-center">
              <p className="text-gray-500">No submission data available</p>
            </div>
          )}
          
            </div>
            
            <div className="p-4 border-t bg-gray-50 flex justify-end">
              <Button variant="outline" onClick={closeViewModal}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}