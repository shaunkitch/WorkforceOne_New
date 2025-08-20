'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { 
  AlertTriangle, Plus, Search, Filter, MapPin, 
  Clock, User, Camera, FileText, CheckCircle,
  AlertCircle, ExternalLink
} from 'lucide-react'

export default function IncidentsPage() {
  // Mock incidents data - in real app would come from API
  const [incidents] = useState([
    {
      id: 'INC-001',
      title: 'Suspicious Activity Reported',
      description: 'Unidentified person attempting to access restricted area',
      status: 'open',
      priority: 'high',
      location: 'Main Entrance',
      reportedBy: 'Guard Johnson',
      timestamp: new Date('2025-08-20T10:30:00'),
      hasEvidence: true,
      coordinates: { lat: 40.7128, lng: -74.0060 }
    },
    {
      id: 'INC-002', 
      title: 'Equipment Malfunction',
      description: 'Security camera in Sector B is offline',
      status: 'in_progress',
      priority: 'medium',
      location: 'Parking Lot B',
      reportedBy: 'Guard Smith',
      timestamp: new Date('2025-08-20T09:15:00'),
      hasEvidence: false,
      coordinates: { lat: 40.7130, lng: -74.0058 }
    },
    {
      id: 'INC-003',
      title: 'Unauthorized Vehicle',
      description: 'Vehicle parked in restricted area without permit',
      status: 'resolved',
      priority: 'low',
      location: 'Executive Parking',
      reportedBy: 'Guard Wilson',
      timestamp: new Date('2025-08-20T08:45:00'),
      hasEvidence: true,
      coordinates: { lat: 40.7125, lng: -74.0062 }
    }
  ])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-red-100 text-red-800'
      case 'in_progress': return 'bg-yellow-100 text-yellow-800'
      case 'resolved': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-600'
      case 'medium': return 'bg-yellow-600'
      case 'low': return 'bg-green-600'
      default: return 'bg-gray-600'
    }
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
                <h1 className="text-2xl font-bold text-gray-900">Incident Management</h1>
                <p className="text-sm text-gray-600">Report and track security incidents</p>
              </div>
            </div>
            <Link href="/">
              <Button variant="outline">
                ← Back to Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Actions Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Security Incidents</h1>
            <p className="text-gray-600">Monitor and manage all security incidents</p>
          </div>
          <Link href="/incidents/create">
            <Button className="bg-red-600 hover:bg-red-700">
              <Plus className="h-4 w-4 mr-2" />
              Report Incident
            </Button>
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Open Incidents</p>
                  <p className="text-2xl font-bold text-red-600">3</p>
                </div>
                <div className="h-12 w-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <AlertCircle className="h-6 w-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">In Progress</p>
                  <p className="text-2xl font-bold text-yellow-600">5</p>
                </div>
                <div className="h-12 w-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Clock className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Resolved Today</p>
                  <p className="text-2xl font-bold text-green-600">12</p>
                </div>
                <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Avg Response Time</p>
                  <p className="text-2xl font-bold text-purple-600">3.2 min</p>
                </div>
                <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Clock className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Incidents List */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Recent Incidents</CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Search className="h-4 w-4 mr-2" />
                  Search
                </Button>
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-2" />
                  Filter
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {incidents.map((incident) => (
                <div key={incident.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`h-3 w-3 rounded-full ${getPriorityColor(incident.priority)}`}></div>
                        <h3 className="font-semibold text-gray-900">{incident.title}</h3>
                        <Badge className={getStatusColor(incident.status)}>
                          {incident.status.replace('_', ' ')}
                        </Badge>
                        <span className="text-sm text-gray-500">#{incident.id}</span>
                      </div>
                      
                      <p className="text-gray-600 mb-3">{incident.description}</p>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {incident.location}
                        </div>
                        <div className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          {incident.reportedBy}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {incident.timestamp.toLocaleTimeString()}
                        </div>
                        {incident.hasEvidence && (
                          <div className="flex items-center gap-1 text-blue-600">
                            <Camera className="h-4 w-4" />
                            Evidence
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex gap-2 ml-4">
                      <Button variant="outline" size="sm">
                        <FileText className="h-4 w-4 mr-1" />
                        View
                      </Button>
                      <Button variant="outline" size="sm">
                        <ExternalLink className="h-4 w-4 mr-1" />
                        Map
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-3 gap-6">
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-6">
              <div className="flex items-center mb-4">
                <Plus className="h-8 w-8 text-red-600 mr-3" />
                <h3 className="font-bold text-lg text-red-900">Report New Incident</h3>
              </div>
              <p className="text-sm text-red-700 mb-4">
                Quickly report security incidents with photo evidence and GPS location.
              </p>
              <Link href="/incidents/create">
                <Button className="w-full bg-red-600 hover:bg-red-700">
                  Create Report
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="border-yellow-200 bg-yellow-50">
            <CardContent className="p-6">
              <div className="flex items-center mb-4">
                <AlertTriangle className="h-8 w-8 text-yellow-600 mr-3" />
                <h3 className="font-bold text-lg text-yellow-900">Emergency Alert</h3>
              </div>
              <p className="text-sm text-yellow-700 mb-4">
                Trigger emergency notifications to all security personnel and management.
              </p>
              <Button className="w-full bg-yellow-600 hover:bg-yellow-700">
                Send Alert
              </Button>
            </CardContent>
          </Card>

          <Card className="border-purple-200 bg-purple-50">
            <CardContent className="p-6">
              <div className="flex items-center mb-4">
                <MapPin className="h-8 w-8 text-purple-600 mr-3" />
                <h3 className="font-bold text-lg text-purple-900">Incident Map</h3>
              </div>
              <p className="text-sm text-purple-700 mb-4">
                View all incidents plotted on an interactive map with real-time updates.
              </p>
              <Link href="/incidents/map">
                <Button className="w-full bg-purple-600 hover:bg-purple-700">
                  View Map
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}