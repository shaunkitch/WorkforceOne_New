'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { 
  QrCode, Plus, MapPin, Clock, CheckCircle, 
  AlertCircle, Scan, Download, Search, Filter
} from 'lucide-react'

export default function CheckpointsPage() {
  // Mock checkpoints data - in real app would come from API
  const [checkpoints] = useState([
    {
      id: 'CP-001',
      name: 'Main Entrance',
      location: 'Building A - Front Door',
      qrCode: 'QR_MAIN_ENTRANCE_001',
      status: 'active',
      lastScanned: new Date('2025-08-20T11:45:00'),
      scannedBy: 'Guard Johnson',
      totalScans: 156,
      coordinates: { lat: 40.7128, lng: -74.0060 }
    },
    {
      id: 'CP-002',
      name: 'Parking Lot B',
      location: 'Parking Structure B - Level 2',
      qrCode: 'QR_PARKING_B_002',
      status: 'active',
      lastScanned: new Date('2025-08-20T11:30:00'),
      scannedBy: 'Guard Smith',
      totalScans: 89,
      coordinates: { lat: 40.7130, lng: -74.0058 }
    },
    {
      id: 'CP-003',
      name: 'Emergency Exit C',
      location: 'Building C - West Side',
      qrCode: 'QR_EMERGENCY_C_003',
      status: 'missed',
      lastScanned: new Date('2025-08-20T09:15:00'),
      scannedBy: 'Guard Wilson',
      totalScans: 45,
      coordinates: { lat: 40.7125, lng: -74.0062 }
    },
    {
      id: 'CP-004',
      name: 'Server Room',
      location: 'Building A - Basement',
      qrCode: 'QR_SERVER_ROOM_004',
      status: 'inactive',
      lastScanned: new Date('2025-08-19T22:30:00'),
      scannedBy: 'Guard Davis',
      totalScans: 234,
      coordinates: { lat: 40.7127, lng: -74.0061 }
    }
  ])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'missed': return 'bg-red-100 text-red-800'
      case 'inactive': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="h-4 w-4" />
      case 'missed': return <AlertCircle className="h-4 w-4" />
      case 'inactive': return <Clock className="h-4 w-4" />
      default: return <Clock className="h-4 w-4" />
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-teal-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <div className="h-10 w-10 bg-green-600 rounded-lg flex items-center justify-center">
                <QrCode className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <h1 className="text-2xl font-bold text-gray-900">QR Checkpoints</h1>
                <p className="text-sm text-gray-600">Manage patrol checkpoints and QR codes</p>
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
            <h1 className="text-3xl font-bold text-gray-900">Checkpoint Management</h1>
            <p className="text-gray-600">Create and monitor QR code checkpoints for patrols</p>
          </div>
          <Link href="/checkpoints/create">
            <Button className="bg-green-600 hover:bg-green-700">
              <Plus className="h-4 w-4 mr-2" />
              Add Checkpoint
            </Button>
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Checkpoints</p>
                  <p className="text-2xl font-bold text-gray-900">156</p>
                </div>
                <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <QrCode className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Scanned Today</p>
                  <p className="text-2xl font-bold text-green-600">432</p>
                </div>
                <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Scan className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Missed Scans</p>
                  <p className="text-2xl font-bold text-red-600">8</p>
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
                  <p className="text-sm font-medium text-gray-600">Compliance Rate</p>
                  <p className="text-2xl font-bold text-purple-600">94%</p>
                </div>
                <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Checkpoints List */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>All Checkpoints</CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Search className="h-4 w-4 mr-2" />
                  Search
                </Button>
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-2" />
                  Filter
                </Button>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {checkpoints.map((checkpoint) => (
                <div key={checkpoint.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                          <QrCode className="h-6 w-6 text-green-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{checkpoint.name}</h3>
                          <p className="text-sm text-gray-500">ID: {checkpoint.id}</p>
                        </div>
                        <Badge className={getStatusColor(checkpoint.status)}>
                          {getStatusIcon(checkpoint.status)}
                          <span className="ml-1">{checkpoint.status}</span>
                        </Badge>
                      </div>
                      
                      <div className="ml-15 space-y-2">
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {checkpoint.location}
                          </div>
                          <div className="flex items-center gap-1">
                            <Scan className="h-4 w-4" />
                            {checkpoint.totalScans} total scans
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            Last scan: {checkpoint.lastScanned.toLocaleString()}
                          </div>
                          <span>by {checkpoint.scannedBy}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 ml-4">
                      <Button variant="outline" size="sm">
                        <QrCode className="h-4 w-4 mr-1" />
                        View QR
                      </Button>
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-1" />
                        Print
                      </Button>
                      <Button variant="outline" size="sm">
                        <MapPin className="h-4 w-4 mr-1" />
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
          <Card className="border-green-200 bg-green-50">
            <CardContent className="p-6">
              <div className="flex items-center mb-4">
                <Plus className="h-8 w-8 text-green-600 mr-3" />
                <h3 className="font-bold text-lg text-green-900">Create Checkpoint</h3>
              </div>
              <p className="text-sm text-green-700 mb-4">
                Add new QR code checkpoints for patrol routes with GPS coordinates.
              </p>
              <Link href="/checkpoints/create">
                <Button className="w-full bg-green-600 hover:bg-green-700">
                  Add New
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="p-6">
              <div className="flex items-center mb-4">
                <Scan className="h-8 w-8 text-blue-600 mr-3" />
                <h3 className="font-bold text-lg text-blue-900">Bulk QR Scanner</h3>
              </div>
              <p className="text-sm text-blue-700 mb-4">
                Scan multiple QR checkpoints quickly during patrol rounds.
              </p>
              <Button className="w-full bg-blue-600 hover:bg-blue-700">
                Open Scanner
              </Button>
            </CardContent>
          </Card>

          <Card className="border-purple-200 bg-purple-50">
            <CardContent className="p-6">
              <div className="flex items-center mb-4">
                <Download className="h-8 w-8 text-purple-600 mr-3" />
                <h3 className="font-bold text-lg text-purple-900">Print QR Codes</h3>
              </div>
              <p className="text-sm text-purple-700 mb-4">
                Generate and print QR code labels for physical checkpoint installation.
              </p>
              <Button className="w-full bg-purple-600 hover:bg-purple-700">
                Generate Labels
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}