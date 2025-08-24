'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  ArrowLeft, Printer, Download, Share2, MapPin, Clock, 
  User, Camera, AlertTriangle, CheckCircle, ExternalLink,
  FileText, Calendar, Shield, Tag
} from 'lucide-react'

interface Incident {
  id: string;
  title: string;
  description: string;
  status: string;
  category: string;
  severity: string;
  latitude?: number;
  longitude?: number;
  address?: string;
  guard_id?: string;
  guard_name?: string;
  created_at: string;
  updated_at: string;
  resolved_at?: string;
  resolved_by?: string;
  metadata?: any;
  source?: string;
}

export default function IncidentDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [incident, setIncident] = useState<Incident | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null)
  const [photoModalOpen, setPhotoModalOpen] = useState(false)

  useEffect(() => {
    if (params.id) {
      loadIncident(params.id as string)
    }
  }, [params.id])

  const loadIncident = async (incidentId: string) => {
    try {
      console.log('🔄 Loading incident details for:', incidentId)
      const response = await fetch('/api/incidents')
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const result = await response.json()
      
      if (result.success) {
        const foundIncident = result.data.find((inc: Incident) => inc.id === incidentId)
        if (foundIncident) {
          setIncident(foundIncident)
          console.log('✅ Loaded incident:', foundIncident.title)
          console.log('📸 Incident metadata:', foundIncident.metadata)
          console.log('📸 Photo count:', foundIncident.metadata?.photos)
          console.log('📸 Photo URLs:', foundIncident.metadata?.photo_urls)
        } else {
          console.error('❌ Incident not found:', incidentId)
        }
      } else {
        console.error('❌ API returned error:', result.error)
      }
    } catch (error) {
      console.error('❌ Failed to load incident:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted':
      case 'open': return 'bg-red-100 text-red-800 border-red-200'
      case 'investigating':
      case 'in_progress': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'resolved': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-600 text-white'
      case 'medium': return 'bg-yellow-600 text-white'
      case 'low': return 'bg-green-600 text-white'
      default: return 'bg-gray-600 text-white'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'submitted':
      case 'open': return <AlertTriangle className="h-4 w-4" />
      case 'investigating':
      case 'in_progress': return <Clock className="h-4 w-4" />
      case 'resolved': return <CheckCircle className="h-4 w-4" />
      default: return <FileText className="h-4 w-4" />
    }
  }

  const formatDateTime = (timestamp: string) => {
    const date = new Date(timestamp)
    return {
      date: date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }),
      time: date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      })
    }
  }

  const handlePrint = () => {
    window.print()
  }

  const handleSave = async () => {
    if (!incident) return
    
    try {
      // Import jsPDF dynamically
      const { default: jsPDF } = await import('jspdf')
      const pdf = new jsPDF()
      
      // Add title
      pdf.setFontSize(20)
      pdf.setFont(undefined, 'bold')
      pdf.text('Security Incident Report', 20, 30)
      
      // Add incident details
      pdf.setFontSize(12)
      pdf.setFont(undefined, 'normal')
      
      let yPosition = 50
      const lineHeight = 8
      
      // Basic incident information
      pdf.text(`Incident ID: ${incident.id}`, 20, yPosition)
      yPosition += lineHeight
      
      pdf.text(`Title: ${incident.title}`, 20, yPosition)
      yPosition += lineHeight
      
      pdf.text(`Status: ${incident.status.toUpperCase()}`, 20, yPosition)
      yPosition += lineHeight
      
      pdf.text(`Severity: ${incident.severity.toUpperCase()}`, 20, yPosition)
      yPosition += lineHeight
      
      pdf.text(`Category: ${incident.category}`, 20, yPosition)
      yPosition += lineHeight
      
      if (incident.address) {
        pdf.text(`Location: ${incident.address}`, 20, yPosition)
        yPosition += lineHeight
      }
      
      if (incident.guard_name) {
        pdf.text(`Reported by: ${incident.guard_name}`, 20, yPosition)
        yPosition += lineHeight
      }
      
      pdf.text(`Created: ${formatDateTime(incident.created_at).date} ${formatDateTime(incident.created_at).time}`, 20, yPosition)
      yPosition += lineHeight * 2
      
      // Description
      pdf.setFont(undefined, 'bold')
      pdf.text('Description:', 20, yPosition)
      yPosition += lineHeight
      
      pdf.setFont(undefined, 'normal')
      const splitDescription = pdf.splitTextToSize(incident.description, 170)
      pdf.text(splitDescription, 20, yPosition)
      yPosition += (splitDescription.length * lineHeight) + lineHeight
      
      // Evidence photos section
      if (incident.metadata?.photos > 0) {
        pdf.setFont(undefined, 'bold')
        pdf.text('Evidence Photos:', 20, yPosition)
        yPosition += lineHeight
        
        pdf.setFont(undefined, 'normal')
        pdf.text(`${incident.metadata.photos} photo${incident.metadata.photos > 1 ? 's' : ''} attached to this incident`, 20, yPosition)
        yPosition += lineHeight * 2
        
        // Include actual photos in PDF if available
        if (incident.metadata?.photo_urls && Array.isArray(incident.metadata.photo_urls)) {
          for (let i = 0; i < incident.metadata.photo_urls.length; i++) {
            const photoUrl = incident.metadata.photo_urls[i]
            
            try {
              // Check if we need a new page
              if (yPosition > 200) {
                pdf.addPage()
                yPosition = 30
              }
              
              // Add photo to PDF
              const maxWidth = 70
              const maxHeight = 50
              
              pdf.setFont(undefined, 'bold')
              pdf.text(`Evidence Photo ${i + 1}:`, 20, yPosition)
              yPosition += 8
              
              // Add the base64 image to PDF
              if (photoUrl.startsWith('data:image/')) {
                // Add image with border
                pdf.setDrawColor(200, 200, 200)
                pdf.rect(19, yPosition - 1, maxWidth + 2, maxHeight + 2)
                pdf.addImage(photoUrl, 'JPEG', 20, yPosition, maxWidth, maxHeight)
                yPosition += maxHeight + 15
              } else {
                pdf.setFont(undefined, 'normal')
                pdf.text(`Photo URL: ${photoUrl.substring(0, 50)}...`, 20, yPosition)
                yPosition += lineHeight + 5
              }
              
            } catch (photoError) {
              console.error('Failed to add photo to PDF:', photoError)
              pdf.text(`Photo ${i + 1}: Error loading image`, 20, yPosition)
              yPosition += lineHeight
            }
          }
        } else {
          pdf.text('Photos are available on mobile device. Contact reporting guard for access.', 20, yPosition)
          yPosition += lineHeight
        }
        
        yPosition += lineHeight
      }
      
      // Footer - position at bottom of page
      const pageHeight = pdf.internal.pageSize.height
      const footerY = Math.max(yPosition + 20, pageHeight - 30)
      
      pdf.setFontSize(10)
      pdf.setFont(undefined, 'normal')
      pdf.text(`Generated on: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, 20, footerY)
      pdf.text('Generated with WorkforceOne Security Management System', 20, footerY + 5)
      
      // Add page numbers if multiple pages
      const totalPages = pdf.getNumberOfPages()
      if (totalPages > 1) {
        for (let i = 1; i <= totalPages; i++) {
          pdf.setPage(i)
          pdf.text(`Page ${i} of ${totalPages}`, pdf.internal.pageSize.width - 40, footerY + 10)
        }
      }
      
      // Save the PDF
      pdf.save(`incident-report-${incident.id}.pdf`)
      
    } catch (error) {
      console.error('Failed to generate PDF:', error)
      
      // Fallback to JSON export
      const reportData = {
        ...incident,
        exported_at: new Date().toISOString(),
        exported_by: 'Admin User'
      }
      
      const blob = new Blob([JSON.stringify(reportData, null, 2)], { 
        type: 'application/json' 
      })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `incident-${incident.id}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      
      alert('PDF generation failed, exported as JSON instead.')
    }
  }

  const handleShare = async () => {
    if (!incident) return
    
    const shareData = {
      title: `Security Incident: ${incident.title}`,
      text: `Incident ID: ${incident.id}\nStatus: ${incident.status}\nSeverity: ${incident.severity}\nLocation: ${incident.address || 'Unknown'}\nReported: ${formatDateTime(incident.created_at).date}`,
      url: window.location.href
    }
    
    try {
      if (navigator.share && navigator.canShare(shareData)) {
        await navigator.share(shareData)
      } else {
        // Fallback to clipboard
        await navigator.clipboard.writeText(
          `${shareData.title}\n\n${shareData.text}\n\nView details: ${shareData.url}`
        )
        alert('Incident details copied to clipboard!')
      }
    } catch (error) {
      console.error('Error sharing:', error)
      // Fallback to clipboard
      try {
        await navigator.clipboard.writeText(
          `${shareData.title}\n\n${shareData.text}\n\nView details: ${shareData.url}`
        )
        alert('Incident details copied to clipboard!')
      } catch (clipboardError) {
        alert('Unable to share. Please copy the URL manually.')
      }
    }
  }

  const openMap = () => {
    if (incident?.latitude && incident?.longitude) {
      const mapUrl = `https://www.google.com/maps?q=${incident.latitude},${incident.longitude}&z=16`
      window.open(mapUrl, '_blank', 'noopener,noreferrer')
    }
  }

  const handlePhotoClick = (photoUrl: string) => {
    console.log('🖼️ Photo clicked:', photoUrl.substring(0, 50) + '...')
    console.log('🔧 Setting modal state...')
    setSelectedPhoto(photoUrl)
    setPhotoModalOpen(true)
    console.log('✅ Modal should now be open')
  }

  const closePhotoModal = () => {
    setPhotoModalOpen(false)
    setSelectedPhoto(null)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center py-20">
            <div className="text-gray-500">Loading incident details...</div>
          </div>
        </div>
      </div>
    )
  }

  if (!incident) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-20">
            <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Incident Not Found</h1>
            <p className="text-gray-600 mb-6">The requested incident could not be found.</p>
            <Button onClick={() => router.push('/dashboard/incidents')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Incidents
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const createdDateTime = formatDateTime(incident.created_at)
  const updatedDateTime = formatDateTime(incident.updated_at)
  const resolvedDateTime = incident.resolved_at ? formatDateTime(incident.resolved_at) : null

  // Debug modal state
  console.log('🔍 Modal Debug - photoModalOpen:', photoModalOpen, 'selectedPhoto:', selectedPhoto ? 'has photo' : 'null')

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-50">
      {/* Print Styles */}
      <style jsx>{`
        @media print {
          .no-print { display: none !important; }
          .print-only { display: block !important; }
          body { background: white !important; }
          .bg-gradient-to-br { background: white !important; }
        }
        .print-only { display: none; }
      `}</style>
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 no-print">
          <div className="flex items-center gap-4">
            <Button 
              variant="outline" 
              onClick={() => router.push('/dashboard/incidents')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Incidents
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Incident Details</h1>
              <p className="text-gray-600">#{incident.id}</p>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button variant="outline" onClick={handlePrint}>
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
            <Button variant="outline" onClick={handleSave}>
              <Download className="h-4 w-4 mr-2" />
              Save PDF
            </Button>
            <Button variant="outline" onClick={handleShare}>
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
          </div>
        </div>

        {/* Print Header */}
        <div className="print-only mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Security Incident Report</h1>
          <p className="text-gray-600">Generated on {new Date().toLocaleDateString()}</p>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Main Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Incident Overview */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-xl mb-2">{incident.title}</CardTitle>
                    <div className="flex items-center gap-3">
                      <Badge className={`${getStatusColor(incident.status)} border`}>
                        {getStatusIcon(incident.status)}
                        <span className="ml-1">{incident.status.replace('_', ' ').toUpperCase()}</span>
                      </Badge>
                      <Badge className={getSeverityColor(incident.severity)}>
                        {incident.severity.toUpperCase()} PRIORITY
                      </Badge>
                      <Badge variant="outline" className="capitalize">
                        <Tag className="h-3 w-3 mr-1" />
                        {incident.category}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
                    <p className="text-gray-700 leading-relaxed">{incident.description}</p>
                  </div>
                  
                  {incident.address && (
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2 flex items-center">
                        <MapPin className="h-4 w-4 mr-2" />
                        Location
                      </h3>
                      <div className="flex items-center justify-between">
                        <p className="text-gray-700">{incident.address}</p>
                        {incident.latitude && incident.longitude && (
                          <Button variant="outline" size="sm" onClick={openMap} className="no-print">
                            <ExternalLink className="h-4 w-4 mr-1" />
                            View on Map
                          </Button>
                        )}
                      </div>
                      {incident.latitude && incident.longitude && (
                        <p className="text-sm text-gray-500 mt-1">
                          Coordinates: {incident.latitude.toFixed(6)}, {incident.longitude.toFixed(6)}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Evidence Photos */}
            {incident.metadata?.photos > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Camera className="h-5 w-5 mr-2" />
                    Evidence Photos ({incident.metadata.photos})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {console.log('🖼️ DEBUG: Photos section rendering')}
                  {console.log('🖼️ Photo count:', incident.metadata.photos)}
                  {console.log('🖼️ Has photo_urls:', incident.metadata?.photo_urls ? 'YES' : 'NO')}
                  {console.log('🖼️ Photo URLs:', incident.metadata?.photo_urls)}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {incident.metadata?.photo_urls ? (
                      // Display actual photos if available
                      incident.metadata.photo_urls.map((photoUrl: string, index: number) => (
                        <div 
                          key={index} 
                          className="relative group cursor-pointer"
                          onClick={() => {
                            console.log('📱 DIV clicked for photo', index + 1)
                            handlePhotoClick(photoUrl)
                          }}
                        >
                          <img
                            src={photoUrl}
                            alt={`Evidence photo ${index + 1}`}
                            className="w-full h-48 object-cover rounded-lg border shadow-sm hover:shadow-md transition-shadow"
                            onClick={(e) => {
                              console.log('🖼️ IMG clicked for photo', index + 1)
                              e.stopPropagation()
                              handlePhotoClick(photoUrl)
                            }}
                            onLoad={() => console.log('✅ Photo loaded:', index + 1)}
                            onError={(e) => {
                              console.log('❌ Photo failed to load:', index + 1)
                              // Fallback to placeholder if image fails to load
                              e.currentTarget.src = `data:image/svg+xml;base64,${btoa(`
                                <svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
                                  <rect width="100" height="100" fill="#f3f4f6"/>
                                  <text x="50" y="50" text-anchor="middle" dy=".3em" fill="#6b7280" font-family="sans-serif" font-size="12">Photo ${index + 1}</text>
                                </svg>
                              `)}`
                            }}
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
                            <div className="bg-white bg-opacity-90 px-3 py-1 rounded-full">
                              <span className="text-sm font-medium text-gray-800">Click to enlarge</span>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      // Display placeholder photos when only count is available
                      Array.from({ length: incident.metadata.photos }, (_, index) => (
                        <div key={index} className="relative">
                          <div className="w-full h-48 bg-gray-100 rounded-lg border border-dashed border-gray-300 flex flex-col items-center justify-center">
                            <Camera className="h-8 w-8 text-gray-400 mb-2" />
                            <p className="text-sm text-gray-500">Evidence Photo {index + 1}</p>
                            <p className="text-xs text-gray-400 mt-1">Photo not available in web portal</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  
                  {/* Photo metadata */}
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">
                      <strong>Evidence Summary:</strong> {incident.metadata.photos} photo{incident.metadata.photos > 1 ? 's' : ''} attached to this incident
                      {incident.metadata?.device_info && (
                        <span className="ml-2">• Captured on {incident.metadata.device_info} device</span>
                      )}
                    </p>
                    {!incident.metadata?.photo_urls && (
                      <p className="text-xs text-gray-500 mt-1">
                        Note: Photos were captured on mobile device but are not currently available in the web portal. Contact the reporting guard for access to original photos.
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Timeline */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Clock className="h-5 w-5 mr-2" />
                  Timeline
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="h-2 w-2 bg-blue-500 rounded-full mt-2"></div>
                    <div>
                      <p className="font-medium text-gray-900">Incident Reported</p>
                      <p className="text-sm text-gray-600">{createdDateTime.date}</p>
                      <p className="text-sm text-gray-500">{createdDateTime.time}</p>
                    </div>
                  </div>
                  
                  {incident.updated_at !== incident.created_at && (
                    <div className="flex items-start gap-3">
                      <div className="h-2 w-2 bg-yellow-500 rounded-full mt-2"></div>
                      <div>
                        <p className="font-medium text-gray-900">Last Updated</p>
                        <p className="text-sm text-gray-600">{updatedDateTime.date}</p>
                        <p className="text-sm text-gray-500">{updatedDateTime.time}</p>
                      </div>
                    </div>
                  )}
                  
                  {resolvedDateTime && (
                    <div className="flex items-start gap-3">
                      <div className="h-2 w-2 bg-green-500 rounded-full mt-2"></div>
                      <div>
                        <p className="font-medium text-gray-900">Resolved</p>
                        <p className="text-sm text-gray-600">{resolvedDateTime.date}</p>
                        <p className="text-sm text-gray-500">{resolvedDateTime.time}</p>
                        {incident.resolved_by && (
                          <p className="text-sm text-gray-500">by {incident.resolved_by}</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Metadata */}
          <div className="space-y-6">
            {/* Guard Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="h-5 w-5 mr-2" />
                  Guard Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Guard Name</p>
                    <p className="text-gray-900">{incident.guard_name || 'Unknown'}</p>
                  </div>
                  {incident.guard_id && (
                    <div>
                      <p className="text-sm font-medium text-gray-600">Guard ID</p>
                      <p className="text-gray-900 font-mono text-sm">{incident.guard_id}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Technical Details */}
            <Card>
              <CardHeader>
                <CardTitle>Technical Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Incident ID</p>
                    <p className="text-gray-900 font-mono text-sm">{incident.id}</p>
                  </div>
                  {incident.source && (
                    <div>
                      <p className="text-sm font-medium text-gray-600">Source</p>
                      <Badge variant="outline" className="capitalize">
                        {incident.source}
                      </Badge>
                    </div>
                  )}
                  {incident.metadata?.device_info && (
                    <div>
                      <p className="text-sm font-medium text-gray-600">Device</p>
                      <p className="text-gray-900 capitalize">{incident.metadata.device_info}</p>
                    </div>
                  )}
                  {incident.metadata?.photos && (
                    <div>
                      <p className="text-sm font-medium text-gray-600">Evidence</p>
                      <div className="flex items-center gap-1 text-blue-600">
                        <Camera className="h-4 w-4" />
                        <span className="text-sm">
                          {incident.metadata.photos} photo{incident.metadata.photos > 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Photo Viewer Modal */}
      {photoModalOpen && selectedPhoto && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 no-print"
          onClick={closePhotoModal}
          style={{display: 'flex'}} // Force display to ensure it's visible
        >
          <div className="relative max-w-4xl max-h-full p-4">
            <button
              onClick={closePhotoModal}
              className="absolute top-2 right-2 z-10 bg-white bg-opacity-90 hover:bg-opacity-100 rounded-full p-2 transition-all"
            >
              <span className="text-gray-800 text-xl font-bold">✕</span>
            </button>
            <img
              src={selectedPhoto}
              alt="Evidence photo - full size"
              className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
            <div className="absolute bottom-4 left-4 bg-black bg-opacity-60 text-white px-3 py-1 rounded-full text-sm">
              Click outside to close
            </div>
          </div>
        </div>
      )}
    </div>
  )
}