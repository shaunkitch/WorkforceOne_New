'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Navbar from '@/components/navigation/Navbar'
import { 
  Building, Plus, MapPin, Clock, Users, CheckCircle, 
  AlertTriangle, Navigation, Filter, Star, Phone
} from 'lucide-react'

export default function LocationsPage() {
  // Mock data - in real app would come from API
  const locations = [
    {
      id: 1,
      name: 'Downtown Office Complex',
      address: '123 Business Avenue, Downtown District',
      type: 'Commercial',
      status: 'active',
      assignedTeams: ['Field Service Alpha'],
      lastVisit: '2025-01-20',
      completedTasks: 15,
      pendingTasks: 2,
      priority: 'high',
      contact: 'John Manager - (555) 123-4567'
    },
    {
      id: 2,
      name: 'North Shopping Center',
      address: '456 Shopping Street, North District',
      type: 'Retail',
      status: 'active',
      assignedTeams: ['Mobile Maintenance'],
      lastVisit: '2025-01-19',
      completedTasks: 8,
      pendingTasks: 1,
      priority: 'medium',
      contact: 'Sarah Store - (555) 234-5678'
    },
    {
      id: 3,
      name: 'West Industrial Park',
      address: '789 Industrial Road, West Zone',
      type: 'Industrial',
      status: 'maintenance',
      assignedTeams: ['Installation Squad', 'Emergency Response'],
      lastVisit: '2025-01-18',
      completedTasks: 22,
      pendingTasks: 5,
      priority: 'urgent',
      contact: 'Mike Factory - (555) 345-6789'
    },
    {
      id: 4,
      name: 'Central Hospital',
      address: '321 Health Plaza, Central District',
      type: 'Healthcare',
      status: 'active',
      assignedTeams: ['Installation Squad'],
      lastVisit: '2025-01-21',
      completedTasks: 12,
      pendingTasks: 3,
      priority: 'high',
      contact: 'Dr. Health - (555) 456-7890'
    },
    {
      id: 5,
      name: 'East Residential Complex',
      address: '654 Living Lane, East Side',
      type: 'Residential',
      status: 'inactive',
      assignedTeams: [],
      lastVisit: '2025-01-15',
      completedTasks: 6,
      pendingTasks: 0,
      priority: 'low',
      contact: 'Jane Resident - (555) 567-8901'
    }
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'maintenance': return 'bg-yellow-100 text-yellow-800'
      case 'inactive': return 'bg-gray-100 text-gray-800'
      case 'emergency': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800'
      case 'high': return 'bg-orange-100 text-orange-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'low': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'Commercial': return <Building className="h-4 w-4" />
      case 'Retail': return <Star className="h-4 w-4" />
      case 'Industrial': return <AlertTriangle className="h-4 w-4" />
      case 'Healthcare': return <CheckCircle className="h-4 w-4" />
      case 'Residential': return <Users className="h-4 w-4" />
      default: return <Building className="h-4 w-4" />
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <Building className="h-8 w-8 text-blue-600 mr-3" />
              Location Management
            </h1>
            <p className="text-gray-600 mt-1">Manage service locations and site assignments</p>
          </div>
          <div className="flex space-x-3">
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Add Location
            </Button>
          </div>
        </div>

        {/* Location Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Locations</p>
                  <p className="text-2xl font-bold text-gray-900">{locations.length}</p>
                </div>
                <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Building className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Sites</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {locations.filter(loc => loc.status === 'active').length}
                  </p>
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
                  <p className="text-sm font-medium text-gray-600">Pending Tasks</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {locations.reduce((sum, loc) => sum + loc.pendingTasks, 0)}
                  </p>
                </div>
                <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Clock className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Coverage</p>
                  <p className="text-2xl font-bold text-gray-900">94%</p>
                  <p className="text-xs text-green-500">service area</p>
                </div>
                <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <MapPin className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Locations Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {locations.map((location) => (
            <Card key={location.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center">
                    {getTypeIcon(location.type)}
                    <span className="ml-2">{location.name}</span>
                  </CardTitle>
                  <div className="flex items-center space-x-2">
                    <Badge className={getPriorityColor(location.priority)}>
                      {location.priority}
                    </Badge>
                    <Badge className={getStatusColor(location.status)}>
                      {location.status}
                    </Badge>
                  </div>
                </div>
                <p className="text-sm text-gray-600 flex items-start mt-1">
                  <MapPin className="h-4 w-4 mr-1 mt-0.5 flex-shrink-0" />
                  {location.address}
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Type:</span>
                    <span className="font-medium ml-2">{location.type}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Last Visit:</span>
                    <span className="font-medium ml-2">{location.lastVisit}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center text-gray-600">
                    <CheckCircle className="h-4 w-4 mr-1 text-green-600" />
                    <span>{location.completedTasks} completed</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <Clock className="h-4 w-4 mr-1 text-orange-600" />
                    <span>{location.pendingTasks} pending</span>
                  </div>
                </div>

                <div className="text-sm">
                  <span className="text-gray-600">Assigned Teams:</span>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {location.assignedTeams.length > 0 ? (
                      location.assignedTeams.map((team, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {team}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-gray-400 text-xs">No teams assigned</span>
                    )}
                  </div>
                </div>

                <div className="text-sm text-gray-600 flex items-center">
                  <Phone className="h-4 w-4 mr-2" />
                  {location.contact}
                </div>

                <div className="flex space-x-2 pt-2">
                  <Button size="sm" variant="outline" className="flex-1">
                    <MapPin className="h-3 w-3 mr-1" />
                    View Map
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1">
                    <Navigation className="h-3 w-3 mr-1" />
                    Get Directions
                  </Button>
                  <Button size="sm" className="flex-1 bg-blue-600 hover:bg-blue-700">
                    Assign Team
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Location Management Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button variant="outline" className="h-20 flex-col">
                <Plus className="h-6 w-6 mb-2" />
                Add Location
              </Button>
              <Button variant="outline" className="h-20 flex-col">
                <MapPin className="h-6 w-6 mb-2" />
                View All on Map
              </Button>
              <Button variant="outline" className="h-20 flex-col">
                <Users className="h-6 w-6 mb-2" />
                Assign Teams
              </Button>
              <Button variant="outline" className="h-20 flex-col">
                <Navigation className="h-6 w-6 mb-2" />
                Optimize Routes
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}