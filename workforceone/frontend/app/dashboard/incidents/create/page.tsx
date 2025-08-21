'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { 
  AlertTriangle, Camera, MapPin, Clock, Upload,
  Save, Send, ArrowLeft, Plus, X
} from 'lucide-react'

export default function CreateIncidentPage() {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium',
    location: '',
    category: 'security',
    evidence: [] as File[]
  })

  const [currentLocation, setCurrentLocation] = useState<{lat: number, lng: number} | null>(null)

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    setFormData(prev => ({
      ...prev,
      evidence: [...prev.evidence, ...files]
    }))
  }

  const removeFile = (index: number) => {
    setFormData(prev => ({
      ...prev,
      evidence: prev.evidence.filter((_, i) => i !== index)
    }))
  }

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          })
          setFormData(prev => ({
            ...prev,
            location: `${position.coords.latitude.toFixed(6)}, ${position.coords.longitude.toFixed(6)}`
          }))
        },
        (error) => {
          console.error('Error getting location:', error)
        }
      )
    }
  }

  const handleSubmit = (isDraft: boolean = false) => {
    // In real app, this would submit to API
    console.log('Submitting incident:', { ...formData, isDraft, timestamp: new Date() })
    alert(isDraft ? 'Incident saved as draft!' : 'Incident reported successfully!')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <div className="h-10 w-10 bg-red-600 rounded-lg flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <h1 className="text-2xl font-bold text-gray-900">Report Security Incident</h1>
                <p className="text-sm text-gray-600">Document security incidents with evidence</p>
              </div>
            </div>
            <Link href="/incidents">
              <Button variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Incidents
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle>Incident Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Incident Title *
              </label>
              <input
                type="text"
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="Brief description of the incident"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              />
            </div>

            {/* Priority and Category */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Priority Level *
                </label>
                <select
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  value={formData.priority}
                  onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value }))}
                >
                  <option value="low">Low Priority</option>
                  <option value="medium">Medium Priority</option>
                  <option value="high">High Priority</option>
                  <option value="critical">Critical</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category *
                </label>
                <select
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                >
                  <option value="security">Security Breach</option>
                  <option value="equipment">Equipment Issue</option>
                  <option value="unauthorized">Unauthorized Access</option>
                  <option value="vandalism">Vandalism</option>
                  <option value="theft">Theft/Missing Property</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Detailed Description *
              </label>
              <textarea
                rows={5}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="Provide detailed information about what happened, when, who was involved, and any other relevant details..."
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location *
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="Building, floor, room number or coordinates"
                  value={formData.location}
                  onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                />
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={getCurrentLocation}
                  className="px-4"
                >
                  <MapPin className="h-4 w-4 mr-2" />
                  GPS
                </Button>
              </div>
              {currentLocation && (
                <p className="text-sm text-green-600 mt-1">
                  GPS location captured: {currentLocation.lat.toFixed(6)}, {currentLocation.lng.toFixed(6)}
                </p>
              )}
            </div>

            {/* Evidence Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Evidence (Photos, Videos, Documents)
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <input
                  type="file"
                  multiple
                  accept="image/*,video/*,.pdf,.doc,.docx"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="evidence-upload"
                />
                <label htmlFor="evidence-upload" className="cursor-pointer">
                  <Camera className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600">Click to upload photos, videos, or documents</p>
                  <p className="text-sm text-gray-500 mt-1">PNG, JPG, MP4, PDF up to 10MB each</p>
                </label>
              </div>

              {/* Uploaded Files */}
              {formData.evidence.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-medium text-gray-700 mb-2">Uploaded Evidence:</h4>
                  <div className="space-y-2">
                    {formData.evidence.map((file, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span className="text-sm text-gray-700">{file.name}</span>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeFile(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-between items-center">
          <div className="flex gap-4">
            <Button
              variant="outline"
              onClick={() => handleSubmit(true)}
            >
              <Save className="h-4 w-4 mr-2" />
              Save as Draft
            </Button>
          </div>

          <div className="flex gap-4">
            <Link href="/incidents">
              <Button variant="outline">
                Cancel
              </Button>
            </Link>
            <Button
              onClick={() => handleSubmit(false)}
              className="bg-red-600 hover:bg-red-700"
            >
              <Send className="h-4 w-4 mr-2" />
              Submit Report
            </Button>
          </div>
        </div>

        {/* Quick Info */}
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-6">
            <div className="flex items-start">
              <div className="h-8 w-8 bg-blue-100 rounded-lg flex items-center justify-center mr-3 mt-1">
                <AlertTriangle className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-blue-900 mb-2">Important Information</h3>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Fill in all required fields marked with *</li>
                  <li>• Upload photos or videos as evidence when possible</li>
                  <li>• Use GPS location for accurate incident mapping</li>
                  <li>• High priority incidents will notify management immediately</li>
                  <li>• Draft incidents can be completed and submitted later</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}