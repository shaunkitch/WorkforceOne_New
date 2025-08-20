'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Navbar from '@/components/navigation/Navbar'
import { 
  Navigation, Plus, MapPin, Clock, Users, Fuel, 
  TrendingUp, Route, Calendar, Filter, Play, Pause
} from 'lucide-react'

export default function RoutesPage() {
  // Mock data - in real app would come from API
  const routes = [
    {
      id: 1,
      name: 'Downtown Service Route A',
      team: 'Field Service Alpha',
      status: 'active',
      stops: 6,
      estimatedTime: 8.5,
      actualTime: 3.2,
      distance: '45.2 miles',
      efficiency: 92,
      startTime: '08:00 AM',
      currentStop: 3
    },
    {
      id: 2,
      name: 'North District Maintenance',
      team: 'Mobile Maintenance',
      status: 'completed',
      stops: 4,
      estimatedTime: 6.0,
      actualTime: 5.8,
      distance: '32.1 miles',
      efficiency: 97,
      startTime: '09:00 AM',
      currentStop: 4
    },
    {
      id: 3,
      name: 'West Zone Installation',
      team: 'Installation Squad',
      status: 'active',
      stops: 8,
      estimatedTime: 12.0,
      actualTime: 7.5,
      distance: '68.3 miles',
      efficiency: 89,
      startTime: '07:30 AM',
      currentStop: 5
    },
    {
      id: 4,
      name: 'Emergency Response Circuit',
      team: 'Emergency Response',
      status: 'standby',
      stops: 3,
      estimatedTime: 4.0,
      actualTime: 0,
      distance: '18.7 miles',
      efficiency: 0,
      startTime: 'On-call',
      currentStop: 0
    }
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'completed': return 'bg-blue-100 text-blue-800'
      case 'standby': return 'bg-yellow-100 text-yellow-800'
      case 'delayed': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getEfficiencyColor = (efficiency: number) => {
    if (efficiency >= 95) return 'text-green-600'
    if (efficiency >= 85) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <Navigation className="h-8 w-8 text-blue-600 mr-3" />
              Route Management
            </h1>
            <p className="text-gray-600 mt-1">Optimize field worker routes and track progress</p>
          </div>
          <div className="flex space-x-3">
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Create Route
            </Button>
          </div>
        </div>

        {/* Route Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Routes</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {routes.filter(route => route.status === 'active').length}
                  </p>
                </div>
                <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Navigation className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Distance</p>
                  <p className="text-2xl font-bold text-gray-900">164.3</p>
                  <p className="text-xs text-gray-500">miles today</p>
                </div>
                <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Route className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Avg Efficiency</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {Math.round(routes.filter(r => r.efficiency > 0).reduce((sum, route) => sum + route.efficiency, 0) / routes.filter(r => r.efficiency > 0).length)}%
                  </p>
                </div>
                <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Fuel Saved</p>
                  <p className="text-2xl font-bold text-gray-900">$248</p>
                  <p className="text-xs text-green-500">vs unoptimized</p>
                </div>
                <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Fuel className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Routes List */}
        <div className="space-y-4">
          {routes.map((route) => (
            <Card key={route.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{route.name}</h3>
                      <Badge className={getStatusColor(route.status)}>
                        {route.status === 'active' && <Play className="h-3 w-3 mr-1" />}
                        {route.status === 'standby' && <Pause className="h-3 w-3 mr-1" />}
                        {route.status}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 text-sm">
                      <div className="flex items-center text-gray-600">
                        <Users className="h-4 w-4 mr-2" />
                        <span className="font-medium">{route.team}</span>
                      </div>
                      
                      <div className="flex items-center text-gray-600">
                        <MapPin className="h-4 w-4 mr-2" />
                        <span>{route.stops} stops</span>
                      </div>
                      
                      <div className="flex items-center text-gray-600">
                        <Route className="h-4 w-4 mr-2" />
                        <span>{route.distance}</span>
                      </div>
                      
                      <div className="flex items-center text-gray-600">
                        <Clock className="h-4 w-4 mr-2" />
                        <span>{route.startTime}</span>
                      </div>
                      
                      <div className="flex items-center text-gray-600">
                        <TrendingUp className="h-4 w-4 mr-2" />
                        <span className={getEfficiencyColor(route.efficiency)}>
                          {route.efficiency}% efficient
                        </span>
                      </div>

                      <div className="flex items-center text-gray-600">
                        <span>Progress: {route.currentStop}/{route.stops}</span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-4">
                      <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                        <span>Route Progress</span>
                        <span>{Math.round((route.currentStop / route.stops) * 100)}% Complete</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{ width: `${(route.currentStop / route.stops) * 100}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Time Tracking */}
                    <div className="mt-3 flex items-center justify-between text-sm">
                      <div className="text-gray-600">
                        Time: {route.actualTime.toFixed(1)}h / {route.estimatedTime}h estimated
                      </div>
                      <div className="flex space-x-2">
                        <Button size="sm" variant="outline">
                          View Map
                        </Button>
                        <Button size="sm" variant="outline">
                          Track Live
                        </Button>
                        <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                          Optimize
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Route Management Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button variant="outline" className="h-20 flex-col">
                <Plus className="h-6 w-6 mb-2" />
                Plan Route
              </Button>
              <Button variant="outline" className="h-20 flex-col">
                <TrendingUp className="h-6 w-6 mb-2" />
                Optimize All
              </Button>
              <Button variant="outline" className="h-20 flex-col">
                <MapPin className="h-6 w-6 mb-2" />
                Live Tracking
              </Button>
              <Button variant="outline" className="h-20 flex-col">
                <Calendar className="h-6 w-6 mb-2" />
                Schedule Routes
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}