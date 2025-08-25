'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { 
  AlertTriangle, Plus, Search, Filter, MapPin, 
  Clock, User, Camera, FileText, CheckCircle,
  AlertCircle, ExternalLink
} from 'lucide-react'
import { devLog } from '@/lib/utils/logger'

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
  metadata?: any;
  source?: string;
}

export default function IncidentsPage() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    open: 0,
    inProgress: 0,
    resolved: 0,
    total: 0
  });

  useEffect(() => {
    loadIncidents();
  }, []);

  const loadIncidents = async () => {
    try {
      devLog('🔄 Loading incidents from API...');
      const response = await fetch('/api/incidents');
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        const incidentsData = result.data || [];
        setIncidents(incidentsData);
        
        // Calculate stats
        const open = incidentsData.filter((i: Incident) => i.status === 'submitted' || i.status === 'open').length;
        const inProgress = incidentsData.filter((i: Incident) => i.status === 'investigating' || i.status === 'in_progress').length;
        const resolved = incidentsData.filter((i: Incident) => i.status === 'resolved').length;
        
        setStats({
          open,
          inProgress,
          resolved,
          total: incidentsData.length
        });
        
        devLog('✅ Loaded', incidentsData.length, 'incidents');
      } else {
        console.error('❌ API returned error:', result.error);
      }
    } catch (error) {
      console.error('❌ Failed to load incidents:', error);
    } finally {
      setLoading(false);
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted':
      case 'open': return 'bg-red-100 text-red-800'
      case 'investigating':
      case 'in_progress': return 'bg-yellow-100 text-yellow-800'
      case 'resolved': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-600'
      case 'medium': return 'bg-yellow-600'
      case 'low': return 'bg-green-600'
      default: return 'bg-gray-600'
    }
  }

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-50">
      
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
                  <p className="text-2xl font-bold text-red-600">{stats.open}</p>
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
                  <p className="text-2xl font-bold text-yellow-600">{stats.inProgress}</p>
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
                  <p className="text-sm font-medium text-gray-600">Resolved</p>
                  <p className="text-2xl font-bold text-green-600">{stats.resolved}</p>
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
                  <p className="text-sm font-medium text-gray-600">Total Incidents</p>
                  <p className="text-2xl font-bold text-purple-600">{stats.total}</p>
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
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-gray-500">Loading incidents...</div>
              </div>
            ) : incidents.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No incidents found
              </div>
            ) : (
              <div className="space-y-4">
                {incidents.map((incident) => (
                  <div key={incident.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className={`h-3 w-3 rounded-full ${getPriorityColor(incident.severity)}`}></div>
                          <h3 className="font-semibold text-gray-900">{incident.title}</h3>
                          <Badge className={getStatusColor(incident.status)}>
                            {incident.status.replace('_', ' ')}
                          </Badge>
                          <span className="text-sm text-gray-500">#{incident.id}</span>
                          {incident.source && (
                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                              {incident.source}
                            </span>
                          )}
                        </div>
                        
                        <p className="text-gray-600 mb-3">{incident.description}</p>
                        
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          {incident.address && (
                            <div className="flex items-center gap-1">
                              <MapPin className="h-4 w-4" />
                              {incident.address}
                            </div>
                          )}
                          {incident.guard_name && (
                            <div className="flex items-center gap-1">
                              <User className="h-4 w-4" />
                              {incident.guard_name}
                            </div>
                          )}
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {formatTimestamp(incident.created_at)}
                          </div>
                          {incident.metadata?.photos && (
                            <div className="flex items-center gap-1 text-blue-600">
                              <Camera className="h-4 w-4" />
                              {incident.metadata.photos} photo{incident.metadata.photos > 1 ? 's' : ''}
                            </div>
                          )}
                          <div className="flex items-center gap-1">
                            <span className="text-xs bg-gray-100 px-2 py-1 rounded capitalize">
                              {incident.category}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex gap-2 ml-4">
                        <Link href={`/dashboard/incidents/${incident.id}`}>
                          <Button variant="outline" size="sm">
                            <FileText className="h-4 w-4 mr-1" />
                            View Details
                          </Button>
                        </Link>
                        {incident.latitude && incident.longitude && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => {
                              const mapUrl = `https://www.google.com/maps?q=${incident.latitude},${incident.longitude}&z=16`;
                              window.open(mapUrl, '_blank', 'noopener,noreferrer');
                            }}
                          >
                            <ExternalLink className="h-4 w-4 mr-1" />
                            Map
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
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