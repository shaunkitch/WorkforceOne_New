'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import Navbar from '@/components/navigation/Navbar'
import { 
  MapPin, Clock, CheckCircle, AlertTriangle, Play, Pause,
  QrCode, Camera, Phone, Radio, Shield, Activity,
  Navigation, FileText, Users, Battery, Wifi, Signal
} from 'lucide-react'

interface GuardShift {
  id: string
  guardName: string
  site: string
  shift: string
  startTime: string
  endTime: string
  status: 'pending' | 'active' | 'break' | 'completed'
  location: string
}

interface PatrolRoute {
  id: string
  name: string
  checkpoints: number
  completedCheckpoints: number
  estimatedTime: string
  priority: 'standard' | 'urgent'
  lastCompleted: string
}

interface Incident {
  id: string
  type: string
  location: string
  time: string
  status: 'reported' | 'investigating' | 'resolved'
  severity: 'low' | 'medium' | 'high'
}

export default function GuardOperationsPage() {
  const [currentTime, setCurrentTime] = useState(new Date())
  const [isOnDuty, setIsOnDuty] = useState(false)
  const [currentLocation] = useState('Downtown Financial Plaza - Lobby')

  // Mock data - in real implementation would come from API
  const [currentShift] = useState<GuardShift>({
    id: 'SHIFT-001',
    guardName: 'Alex Rodriguez',
    site: 'Downtown Financial Plaza',
    shift: 'Night Shift',
    startTime: '22:00',
    endTime: '06:00',
    status: 'active',
    location: 'Building Lobby'
  })

  const [activeRoutes] = useState<PatrolRoute[]>([
    {
      id: 'ROUTE-001',
      name: 'Perimeter Security Check',
      checkpoints: 8,
      completedCheckpoints: 5,
      estimatedTime: '45 min',
      priority: 'standard',
      lastCompleted: '23:15'
    },
    {
      id: 'ROUTE-002', 
      name: 'Executive Floor Sweep',
      checkpoints: 12,
      completedCheckpoints: 0,
      estimatedTime: '30 min',
      priority: 'urgent',
      lastCompleted: 'Never'
    },
    {
      id: 'ROUTE-003',
      name: 'Parking Garage Patrol',
      checkpoints: 6,
      completedCheckpoints: 6,
      estimatedTime: '20 min',
      priority: 'standard',
      lastCompleted: '22:45'
    }
  ])

  const [recentIncidents] = useState<Incident[]>([
    {
      id: 'INC-001',
      type: 'Suspicious Activity',
      location: 'North Entrance',
      time: '23:30',
      status: 'investigating',
      severity: 'medium'
    },
    {
      id: 'INC-002',
      type: 'Alarm Triggered',
      location: 'Floor 15 - Executive',
      time: '22:15',
      status: 'resolved',
      severity: 'high'
    }
  ])

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const handleClockIn = () => {
    setIsOnDuty(true)
    // In real implementation: GPS verification, equipment check, etc.
  }

  const handleClockOut = () => {
    setIsOnDuty(false)
    // In real implementation: end of shift report, equipment return, etc.
  }

  const getIncidentSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'bg-green-100 text-green-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'high': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getRouteProgress = (completed: number, total: number) => {
    return Math.round((completed / total) * 100)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-50">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* Status Header - Mobile Optimized */}
        <Card className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold">{currentShift.guardName}</h1>
                <p className="text-purple-200">{currentShift.site}</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-mono">
                  {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
                <div className="text-sm text-purple-200">
                  {currentTime.toLocaleDateString()}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-sm text-purple-200">Shift</div>
                <div className="font-semibold">{currentShift.shift}</div>
              </div>
              <div>
                <div className="text-sm text-purple-200">Status</div>
                <Badge className={isOnDuty ? 'bg-green-600 text-white' : 'bg-yellow-600 text-white'}>
                  {isOnDuty ? 'ON DUTY' : 'OFF DUTY'}
                </Badge>
              </div>
              <div>
                <div className="text-sm text-purple-200">Location</div>
                <div className="font-semibold text-sm">{currentLocation}</div>
              </div>
            </div>

            {/* System Status Indicators */}
            <div className="flex justify-center space-x-6 mt-4 pt-4 border-t border-purple-400">
              <div className="flex items-center">
                <Signal className="h-4 w-4 mr-1" />
                <span className="text-sm">4G</span>
              </div>
              <div className="flex items-center">
                <Wifi className="h-4 w-4 mr-1" />
                <span className="text-sm">Connected</span>
              </div>
              <div className="flex items-center">
                <Battery className="h-4 w-4 mr-1" />
                <span className="text-sm">87%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="h-5 w-5 mr-2" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {!isOnDuty ? (
                <Button 
                  onClick={handleClockIn}
                  className="h-20 flex-col bg-green-600 hover:bg-green-700"
                >
                  <Play className="h-6 w-6 mb-1" />
                  Clock In
                </Button>
              ) : (
                <Button 
                  onClick={handleClockOut}
                  className="h-20 flex-col bg-red-600 hover:bg-red-700"
                >
                  <Pause className="h-6 w-6 mb-1" />
                  Clock Out
                </Button>
              )}
              
              <Button variant="outline" className="h-20 flex-col">
                <QrCode className="h-6 w-6 mb-1" />
                Scan Checkpoint
              </Button>
              
              <Button variant="outline" className="h-20 flex-col">
                <AlertTriangle className="h-6 w-6 mb-1" />
                Report Incident
              </Button>
              
              <Button variant="outline" className="h-20 flex-col">
                <Phone className="h-6 w-6 mb-1" />
                Emergency
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Active Patrol Routes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Navigation className="h-5 w-5 mr-2" />
                Active Patrol Routes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {activeRoutes.map((route) => (
                <div key={route.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-gray-900">{route.name}</h4>
                    <Badge className={route.priority === 'urgent' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}>
                      {route.priority}
                    </Badge>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Progress</span>
                      <span>{route.completedCheckpoints}/{route.checkpoints} checkpoints</span>
                    </div>
                    <Progress value={getRouteProgress(route.completedCheckpoints, route.checkpoints)} className="h-2" />
                  </div>

                  <div className="flex items-center justify-between mt-3">
                    <div className="text-sm text-gray-600">
                      <Clock className="h-4 w-4 inline mr-1" />
                      Est. {route.estimatedTime}
                    </div>
                    <div className="text-sm text-gray-600">
                      Last: {route.lastCompleted}
                    </div>
                  </div>

                  <div className="flex space-x-2 mt-3">
                    <Button size="sm" variant="outline" className="flex-1">
                      <MapPin className="h-3 w-3 mr-1" />
                      View Route
                    </Button>
                    <Button size="sm" className="flex-1 bg-purple-600 hover:bg-purple-700">
                      <Play className="h-3 w-3 mr-1" />
                      Start Patrol
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Recent Incidents & Alerts */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2" />
                Recent Incidents & Alerts
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentIncidents.map((incident) => (
                <div key={incident.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900">{incident.type}</h4>
                    <Badge className={getIncidentSeverityColor(incident.severity)}>
                      {incident.severity}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center text-sm text-gray-600 mb-2">
                    <MapPin className="h-4 w-4 mr-1" />
                    {incident.location}
                  </div>
                  
                  <div className="flex items-center text-sm text-gray-600 mb-3">
                    <Clock className="h-4 w-4 mr-1" />
                    {incident.time}
                  </div>

                  <div className="flex space-x-2">
                    <Button size="sm" variant="outline" className="flex-1">
                      <FileText className="h-3 w-3 mr-1" />
                      View Details
                    </Button>
                    {incident.status === 'investigating' && (
                      <Button size="sm" className="flex-1 bg-orange-600 hover:bg-orange-700">
                        <Camera className="h-3 w-3 mr-1" />
                        Update
                      </Button>
                    )}
                  </div>
                </div>
              ))}

              {/* Quick Incident Report */}
              <div className="border-2 border-dashed border-gray-200 rounded-lg p-4 text-center">
                <Button className="w-full bg-red-600 hover:bg-red-700">
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Report New Incident
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Communication Center */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Radio className="h-5 w-5 mr-2" />
              Communication Center
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Button variant="outline" className="h-16 flex-col">
                <Phone className="h-6 w-6 mb-1" />
                Control Center
                <span className="text-xs text-gray-500">24/7 Support</span>
              </Button>
              
              <Button variant="outline" className="h-16 flex-col">
                <Users className="h-6 w-6 mb-1" />
                Team Chat
                <span className="text-xs text-gray-500">3 messages</span>
              </Button>
              
              <Button variant="outline" className="h-16 flex-col">
                <Shield className="h-6 w-6 mb-1" />
                Site Manager
                <span className="text-xs text-gray-500">Available</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Daily Summary */}
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50">
          <CardHeader>
            <CardTitle className="text-blue-900">Today's Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-700">3</div>
                <div className="text-sm text-blue-600">Patrols Completed</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-700">24</div>
                <div className="text-sm text-blue-600">Checkpoints Scanned</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-700">2</div>
                <div className="text-sm text-blue-600">Incidents Handled</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-700">98%</div>
                <div className="text-sm text-blue-600">Performance Score</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}