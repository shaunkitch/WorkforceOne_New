'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { hasProductAccess } from '@/lib/supabase'
import { 
  ArrowLeft, Clock, Play, Pause, Square, 
  Calendar, BarChart3, Timer, Target 
} from 'lucide-react'

export default function TimesheetPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isTracking, setIsTracking] = useState(false)
  const [currentTime, setCurrentTime] = useState('00:00:00')
  const router = useRouter()

  useEffect(() => {
    checkAccess()
  }, [])

  const checkAccess = async () => {
    try {
      const hasAccess = await hasProductAccess('time-tracker')
      if (!hasAccess) {
        setError("You don't have access to Time Tracker")
        setLoading(false)
        return
      }
      setLoading(false)
    } catch (err) {
      setError('Failed to verify access')
      setLoading(false)
    }
  }

  const handleStartStop = () => {
    setIsTracking(!isTracking)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={() => router.push('/dashboard')}>Return to Dashboard</Button>
        </div>
      </div>
    )
  }

  const timeEntries = [
    {
      id: 1,
      project: 'Website Redesign',
      task: 'Frontend Development',
      startTime: '09:00',
      endTime: '11:30',
      duration: '2h 30m',
      date: '2024-08-20'
    },
    {
      id: 2,
      project: 'Mobile App',
      task: 'API Integration',
      startTime: '13:00',
      endTime: '16:15',
      duration: '3h 15m',
      date: '2024-08-20'
    },
    {
      id: 3,
      project: 'Database Migration',
      task: 'Schema Design',
      startTime: '08:30',
      endTime: '12:00',
      duration: '3h 30m',
      date: '2024-08-19'
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-4">
              <Button 
                variant="outline" 
                onClick={() => router.push('/time-tracker/dashboard')}
                className="flex items-center"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div className="flex items-center space-x-3">
                <Clock className="h-8 w-8 text-blue-600" />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Time Tracker</h1>
                  <p className="text-gray-600">Track your work hours</p>
                </div>
              </div>
            </div>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <BarChart3 className="h-4 w-4 mr-2" />
              Reports
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Timer Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-center">Current Session</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center space-y-6">
              <div className="text-6xl font-mono font-bold text-blue-600">
                {currentTime}
              </div>
              
              <div className="flex items-center justify-center space-x-4">
                <Button
                  onClick={handleStartStop}
                  className={`px-8 py-3 text-lg ${
                    isTracking 
                      ? 'bg-red-600 hover:bg-red-700' 
                      : 'bg-green-600 hover:bg-green-700'
                  }`}
                >
                  {isTracking ? (
                    <>
                      <Pause className="h-5 w-5 mr-2" />
                      Pause
                    </>
                  ) : (
                    <>
                      <Play className="h-5 w-5 mr-2" />
                      Start
                    </>
                  )}
                </Button>
                
                <Button variant="outline" className="px-8 py-3 text-lg">
                  <Square className="h-5 w-5 mr-2" />
                  Stop
                </Button>
              </div>
              
              <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Project</p>
                  <p className="font-medium">Website Redesign</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Task</p>
                  <p className="font-medium">Frontend Development</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Timer className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-muted-foreground">Today</p>
                  <p className="text-2xl font-bold">6.5h</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Calendar className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-muted-foreground">This Week</p>
                  <p className="text-2xl font-bold">32.5h</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Target className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-muted-foreground">Projects</p>
                  <p className="text-2xl font-bold">8</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <BarChart3 className="h-6 w-6 text-orange-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-muted-foreground">Productivity</p>
                  <p className="text-2xl font-bold">92%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Time Entries */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Time Entries</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {timeEntries.map((entry) => (
                <div key={entry.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                  <div className="flex-1">
                    <div className="flex items-center space-x-4">
                      <div className="font-medium">{entry.project}</div>
                      <Badge variant="outline">{entry.task}</Badge>
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {entry.date} • {entry.startTime} - {entry.endTime}
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="font-medium text-lg">{entry.duration}</div>
                    <Button variant="outline" size="sm" className="mt-2">
                      Edit
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}