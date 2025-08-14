'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Phone,
  MapPin,
  Clock,
  CheckCircle,
  AlertCircle,
  Calendar,
  Users,
  ChevronRight,
  ArrowLeft
} from 'lucide-react'
import { format } from 'date-fns'
import Link from 'next/link'

interface OutletVisit {
  id: string
  outlet_id: string
  check_in_time: string
  check_out_time?: string
  form_completed: boolean
  outlet: {
    id: string
    name: string
    address?: string
    group_name?: string
  }
}

interface DailyCallsStats {
  totalVisits: number
  completedForms: number
  averageTimePerVisit: number
  uniqueOutlets: number
}

export default function DailyCallsPage() {
  const [visits, setVisits] = useState<OutletVisit[]>([])
  const [stats, setStats] = useState<DailyCallsStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [userProfile, setUserProfile] = useState<any>(null)
  
  const supabase = createClient()

  useEffect(() => {
    fetchDailyCallsData()
  }, [])

  const fetchDailyCallsData = async () => {
    try {
      setLoading(true)
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      
      // Get user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      
      setUserProfile(profile)

      if (!profile?.organization_id) return

      // Get today's date
      const today = format(new Date(), 'yyyy-MM-dd')

      // Fetch today's outlet visits
      const { data: visitsData, error: visitsError } = await supabase
        .from('outlet_visits')
        .select(`
          id,
          outlet_id,
          check_in_time,
          check_out_time,
          form_completed,
          outlet:outlets (
            id,
            name,
            address,
            group_name
          )
        `)
        .eq('user_id', user.id)
        .gte('check_in_time', `${today}T00:00:00`)
        .lt('check_in_time', `${today}T23:59:59`)
        .order('check_in_time', { ascending: false })

      if (visitsError) {
        console.error('Error fetching visits:', visitsError)
        setVisits([])
      } else {
        setVisits(visitsData || [])
        
        // Calculate stats
        const totalVisits = visitsData?.length || 0
        const completedForms = visitsData?.filter(v => v.form_completed).length || 0
        const uniqueOutlets = new Set(visitsData?.map(v => v.outlet_id) || []).size
        
        // Calculate average time per visit for completed visits
        const completedVisits = visitsData?.filter(v => v.check_out_time) || []
        const totalMinutes = completedVisits.reduce((acc, visit) => {
          const checkIn = new Date(visit.check_in_time)
          const checkOut = new Date(visit.check_out_time!)
          return acc + ((checkOut.getTime() - checkIn.getTime()) / (1000 * 60))
        }, 0)
        
        const averageTimePerVisit = completedVisits.length > 0 ? Math.round(totalMinutes / completedVisits.length) : 0

        setStats({
          totalVisits,
          completedForms,
          averageTimePerVisit,
          uniqueOutlets
        })
      }

    } catch (error) {
      console.error('Error fetching daily calls data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getVisitStatus = (visit: OutletVisit) => {
    if (visit.check_out_time) {
      return visit.form_completed ? 'completed' : 'visited'
    }
    return 'in_progress'
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Complete</Badge>
      case 'visited':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Visited</Badge>
      case 'in_progress':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">In Progress</Badge>
      default:
        return <Badge variant="secondary">Unknown</Badge>
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-pulse text-muted-foreground">Loading daily calls...</div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Daily Calls</h1>
          <p className="text-gray-600 mt-1">
            Today's outlet visits and activities
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Visits</p>
                <p className="text-2xl font-bold">{stats?.totalVisits || 0}</p>
              </div>
              <Phone className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Forms Completed</p>
                <p className="text-2xl font-bold text-green-600">{stats?.completedForms || 0}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Unique Outlets</p>
                <p className="text-2xl font-bold text-purple-600">{stats?.uniqueOutlets || 0}</p>
              </div>
              <MapPin className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Time/Visit</p>
                <p className="text-2xl font-bold text-orange-600">{stats?.averageTimePerVisit || 0}m</p>
              </div>
              <Clock className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Visits List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Today's Outlet Visits
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard/routes">
                View Routes
                <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {visits.length === 0 ? (
            <div className="text-center py-12">
              <Phone className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No visits today</h3>
              <p className="text-gray-500 mb-4">You haven't made any outlet visits yet today.</p>
              <Button asChild>
                <Link href="/dashboard/routes">
                  <MapPin className="h-4 w-4 mr-2" />
                  Start Route
                </Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {visits.map((visit) => {
                const status = getVisitStatus(visit)
                return (
                  <div
                    key={visit.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        <MapPin className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <p className="text-sm font-medium text-gray-900">
                            {visit.outlet?.name || 'Unknown Outlet'}
                          </p>
                          {visit.outlet?.group_name && (
                            <Badge variant="outline" className="text-xs">
                              {visit.outlet.group_name}
                            </Badge>
                          )}
                        </div>
                        {visit.outlet?.address && (
                          <p className="text-sm text-gray-500">
                            {visit.outlet.address}
                          </p>
                        )}
                        <div className="flex items-center space-x-4 mt-1">
                          <span className="text-xs text-gray-500">
                            Check-in: {format(new Date(visit.check_in_time), 'h:mm a')}
                          </span>
                          {visit.check_out_time && (
                            <span className="text-xs text-gray-500">
                              Check-out: {format(new Date(visit.check_out_time), 'h:mm a')}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      {getStatusBadge(status)}
                      <Button variant="ghost" size="sm">
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}