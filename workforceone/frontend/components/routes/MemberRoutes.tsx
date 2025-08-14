'use client'

import React, { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Calendar,
  Clock,
  MapPin,
  TrendingUp,
  Truck,
  User,
  Navigation,
  DollarSign,
  Activity,
  Route,
  ChevronRight
} from 'lucide-react'
import { format, startOfWeek, addDays, isToday, isSameDay } from 'date-fns'
import GoogleMapComponent from '@/components/maps/GoogleMapComponent'

interface RouteWithDetails {
  id: string
  name: string
  description?: string
  status: string
  route_date?: string
  total_estimated_duration: number
  total_estimated_distance: number
  total_stops: number
  optimized_route_data?: any
  route_stops: Array<{
    id: string
    stop_order: number
    estimated_duration: number
    outlet: {
      id: string
      name: string
      address: string
      latitude?: number
      longitude?: number
    }
  }>
  route_assignments: Array<{
    id: string
    is_recurring: boolean
    day_of_week?: number
  }>
}

interface MemberStats {
  totalDistance: number
  totalTime: number
  totalCost: number
  routeCount: number
  averageStopsPerRoute: number
}

interface CurrencySettings {
  symbol: string
  code: string
  position: 'before' | 'after'
}

const MemberRoutes: React.FC = () => {
  const [selectedMember, setSelectedMember] = useState<string>('')
  const [selectedWeek, setSelectedWeek] = useState<Date>(() => {
    const today = new Date()
    const weekStart = startOfWeek(today, { weekStartsOn: 1 })
    console.log('Week calculation - today:', today.toISOString(), 'weekStart:', weekStart.toISOString())
    return weekStart
  })
  const [members, setMembers] = useState<Array<{ id: string; full_name: string; email: string }>>([])
  const [routes, setRoutes] = useState<RouteWithDetails[]>([])
  const [weeklyStats, setWeeklyStats] = useState<MemberStats>({
    totalDistance: 0,
    totalTime: 0,
    totalCost: 0,
    routeCount: 0,
    averageStopsPerRoute: 0
  })
  const [loading, setLoading] = useState(false)
  const [currency, setCurrency] = useState<CurrencySettings>({
    symbol: '$',
    code: 'USD',
    position: 'before'
  })
  const [selectedDayRoutes, setSelectedDayRoutes] = useState<RouteWithDetails[]>([])
  const [selectedDay, setSelectedDay] = useState<number>(() => {
    const today = new Date().getDay()
    const converted = today === 0 ? 7 : today // Convert Sunday (0) to 7, keep others 1-6
    console.log('Today init - JS getDay():', today, 'converted:', converted, 'date:', new Date().toISOString())
    return converted
  })

  const supabase = createClient()

  // Fetch organization currency settings
  useEffect(() => {
    const fetchCurrencySettings = async () => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', (await supabase.auth.getUser()).data.user?.id)
        .single()

      if (profile?.organization_id) {
        const { data: settings } = await supabase
          .from('organization_settings')
          .select('currency_code, currency_symbol')
          .eq('organization_id', profile.organization_id)
          .single()

        if (settings) {
          setCurrency({
            symbol: settings.currency_symbol || '$',
            code: settings.currency_code || 'USD',
            position: 'before'
          })
        }
      }
    }
    fetchCurrencySettings()
  }, [])

  // Fetch all members
  useEffect(() => {
    const fetchMembers = async () => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', (await supabase.auth.getUser()).data.user?.id)
        .single()

      if (profile?.organization_id) {
        const { data } = await supabase
          .from('profiles')
          .select('id, full_name, email')
          .eq('organization_id', profile.organization_id)
          .order('full_name')

        if (data) {
          setMembers(data)
        }
      }
    }
    fetchMembers()
  }, [])

  // Fetch routes for selected member and week
  useEffect(() => {
    if (selectedMember) {
      fetchMemberRoutes()
    }
  }, [selectedMember, selectedWeek])

  const fetchMemberRoutes = async () => {
    setLoading(true)
    try {
      const weekStart = selectedWeek
      const weekEnd = addDays(weekStart, 6)

      console.log('Fetching routes for member:', selectedMember, 'Week:', weekStart.toISOString(), 'to', weekEnd.toISOString())
      
      const { data: assignedRoutes, error } = await supabase
        .from('route_assignments')
        .select(`
          id,
          is_recurring,
          day_of_week,
          assignee_type,
          assignee_id,
          assigned_date,
          route:routes(
            id,
            name,
            description,
            status,
            route_date,
            total_estimated_duration,
            total_estimated_distance,
            total_stops,
            optimized_route_data,
            route_stops(
              id,
              stop_order,
              estimated_duration,
              outlet:outlets(
                id,
                name,
                address,
                latitude,
                longitude
              )
            )
          )
        `)
        .eq('assignee_id', selectedMember)
      
      console.log('Route assignments query result:', { assignedRoutes, error })

      if (assignedRoutes) {
        // Filter assignments that are relevant for this week
        const relevantAssignments = assignedRoutes.filter(a => {
          if (!a.route) return false
          
          // Include recurring assignments
          if (a.is_recurring) return true
          
          // Include assignments with specific dates in this week
          if (a.assigned_date) {
            const assignedDate = new Date(a.assigned_date)
            return assignedDate >= weekStart && assignedDate <= weekEnd
          }
          
          // Include routes with route_date in this week
          if (a.route.route_date) {
            const routeDate = new Date(a.route.route_date)
            return routeDate >= weekStart && routeDate <= weekEnd
          }
          
          return true // Include assignments without specific dates
        })
        
        console.log('Relevant assignments after filtering:', relevantAssignments)

        const formattedRoutes = relevantAssignments
          .map(a => ({
            ...a.route,
            route_assignments: [{
              id: a.id,
              is_recurring: a.is_recurring,
              day_of_week: a.day_of_week,
              assigned_date: a.assigned_date
            }]
          })) as RouteWithDetails[]

        setRoutes(formattedRoutes)
        calculateWeeklyStats(formattedRoutes)
        
        // Filter routes for selected day
        const dayRoutes = formattedRoutes.filter(route => {
          const assignment = route.route_assignments[0]
          
          console.log('Filtering route for selectedDay:', selectedDay, 'Route:', route.name, 'Assignment:', assignment)
          
          // For recurring assignments, check day of week
          if (assignment.is_recurring && assignment.day_of_week) {
            console.log('Recurring assignment, day_of_week:', assignment.day_of_week, 'matches selectedDay:', assignment.day_of_week === selectedDay)
            return assignment.day_of_week === selectedDay
          }
          
          // For dated assignments, check if assigned_date matches selected day
          if (assignment.assigned_date) {
            const assignedDate = new Date(assignment.assigned_date)
            const assignedDay = jsDateToDayNumber(assignedDate.getDay())
            console.log('Dated assignment:', assignment.assigned_date, 'assignedDate:', assignedDate, 'assignedDay:', assignedDay, 'selectedDay:', selectedDay, 'matches:', assignedDay === selectedDay)
            return assignedDay === selectedDay
          }
          
          // For routes with route_date, check if route_date matches selected day
          if (route.route_date) {
            const routeDate = new Date(route.route_date)
            const routeDay = jsDateToDayNumber(routeDate.getDay())
            console.log('Route date:', route.route_date, 'routeDate:', routeDate, 'routeDay:', routeDay, 'selectedDay:', selectedDay, 'matches:', routeDay === selectedDay)
            return routeDay === selectedDay
          }
          
          return false
        })
        
        console.log('Day routes for day', selectedDay, ':', dayRoutes)
        setSelectedDayRoutes(dayRoutes)
      }
    } finally {
      setLoading(false)
    }
  }

  const calculateWeeklyStats = (routes: RouteWithDetails[]) => {
    const stats = routes.reduce((acc, route) => {
      const distance = route.total_estimated_distance || 0
      const duration = route.total_estimated_duration || 0
      const fuelCost = calculateFuelCost(distance)
      const laborCost = calculateLaborCost(duration)
      
      return {
        totalDistance: acc.totalDistance + distance,
        totalTime: acc.totalTime + duration,
        totalCost: acc.totalCost + fuelCost + laborCost,
        routeCount: acc.routeCount + 1,
        totalStops: acc.totalStops + (route.total_stops || 0)
      }
    }, {
      totalDistance: 0,
      totalTime: 0,
      totalCost: 0,
      routeCount: 0,
      totalStops: 0
    })

    setWeeklyStats({
      ...stats,
      averageStopsPerRoute: stats.routeCount > 0 ? Math.round(stats.totalStops / stats.routeCount) : 0
    })
  }

  const calculateFuelCost = (distanceKm: number): number => {
    const fuelConsumption = 8.5 // liters per 100km
    const fuelPrice = 1.5 // per liter - should come from settings
    return (distanceKm / 100) * fuelConsumption * fuelPrice
  }

  const calculateLaborCost = (durationMinutes: number): number => {
    const hourlyRate = 25 // should come from organization settings
    return (durationMinutes / 60) * hourlyRate
  }

  const formatCurrency = (amount: number): string => {
    const formatted = amount.toFixed(2)
    return currency.position === 'before' 
      ? `${currency.symbol}${formatted}`
      : `${formatted}${currency.symbol}`
  }

  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60)
    const mins = Math.round(minutes % 60)
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
  }

  // Convert JavaScript getDay() (0=Sunday, 1=Monday...) to our system (1=Monday, 7=Sunday)
  const jsDateToDayNumber = (jsDay: number): number => {
    return jsDay === 0 ? 7 : jsDay
  }

  const getDayName = (dayNumber: number): string => {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    return days[dayNumber - 1] || 'Sunday'
  }

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(selectedWeek, i)
    const dayNum = jsDateToDayNumber(date.getDay())
    console.log('Week day', i, '- date:', date.toISOString(), 'dayNum:', dayNum, 'dayName:', getDayName(dayNum))
    const dayRoutes = routes.filter(route => {
      const assignment = route.route_assignments[0]
      
      // For recurring assignments, check day of week
      if (assignment.is_recurring && assignment.day_of_week) {
        return assignment.day_of_week === dayNum
      }
      
      // For dated assignments, check if assigned_date matches this date
      if (assignment.assigned_date) {
        return isSameDay(new Date(assignment.assigned_date), date)
      }
      
      // For routes with route_date, check if route_date matches this date
      if (route.route_date) {
        return isSameDay(new Date(route.route_date), date)
      }
      
      return false
    })

    return {
      date,
      dayNum,
      dayName: getDayName(dayNum),
      isToday: isToday(date),
      routeCount: dayRoutes.length,
      totalDistance: dayRoutes.reduce((sum, r) => sum + (r.total_estimated_distance || 0), 0),
      totalTime: dayRoutes.reduce((sum, r) => sum + (r.total_estimated_duration || 0), 0)
    }
  })

  return (
    <div className="space-y-6">
      {/* Member and Week Selection */}
      <div className="flex flex-wrap gap-4">
        <div className="flex-1 min-w-[200px]">
          <Label>Select Member</Label>
          <Select value={selectedMember} onValueChange={setSelectedMember}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a team member" />
            </SelectTrigger>
            <SelectContent>
              {members.map(member => (
                <SelectItem key={member.id} value={member.id}>
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    <span>{member.full_name}</span>
                    <span className="text-muted-foreground text-sm">{member.email}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1 min-w-[200px]">
          <Label>Week Starting</Label>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setSelectedWeek(addDays(selectedWeek, -7))}
            >
              Previous
            </Button>
            <div className="flex-1 flex items-center justify-center px-4 border rounded-md">
              {format(selectedWeek, 'MMM d')} - {format(addDays(selectedWeek, 6), 'MMM d, yyyy')}
            </div>
            <Button
              variant="outline"
              onClick={() => setSelectedWeek(addDays(selectedWeek, 7))}
            >
              Next
            </Button>
          </div>
        </div>
      </div>

      {selectedMember && (
        <>
          {/* Weekly Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Routes</p>
                    <p className="text-2xl font-bold">{weeklyStats.routeCount}</p>
                  </div>
                  <Route className="w-8 h-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Distance</p>
                    <p className="text-2xl font-bold">{weeklyStats.totalDistance.toFixed(1)} km</p>
                  </div>
                  <Navigation className="w-8 h-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Time on Road</p>
                    <p className="text-2xl font-bold">{formatDuration(weeklyStats.totalTime)}</p>
                  </div>
                  <Clock className="w-8 h-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Estimated Cost</p>
                    <p className="text-2xl font-bold">{formatCurrency(weeklyStats.totalCost)}</p>
                  </div>
                  <DollarSign className="w-8 h-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Avg Stops/Route</p>
                    <p className="text-2xl font-bold">{weeklyStats.averageStopsPerRoute}</p>
                  </div>
                  <MapPin className="w-8 h-8 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Week Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Week Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-2">
                {weekDays.map((day) => (
                  <button
                    key={day.dayNum}
                    onClick={() => {
                      setSelectedDay(day.dayNum)
                      const dayRoutes = routes.filter(route => {
                        const assignment = route.route_assignments[0]
                        
                        // For recurring assignments, check day of week
                        if (assignment.is_recurring && assignment.day_of_week) {
                          return assignment.day_of_week === day.dayNum
                        }
                        
                        // For dated assignments, check if assigned_date matches this date
                        if (assignment.assigned_date) {
                          return isSameDay(new Date(assignment.assigned_date), day.date)
                        }
                        
                        // For routes with route_date, check if route_date matches this date
                        if (route.route_date) {
                          return isSameDay(new Date(route.route_date), day.date)
                        }
                        
                        return false
                      })
                      setSelectedDayRoutes(dayRoutes)
                    }}
                    className={`p-3 rounded-lg border transition-colors ${
                      selectedDay === day.dayNum 
                        ? 'bg-primary text-primary-foreground border-primary' 
                        : 'hover:bg-muted'
                    } ${day.isToday ? 'ring-2 ring-primary ring-offset-2' : ''}`}
                  >
                    <div className="text-sm font-medium">{day.dayName}</div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {format(day.date, 'MMM d')}
                    </div>
                    {day.routeCount > 0 && (
                      <>
                        <div className="mt-2 space-y-1">
                          <Badge variant="secondary" className="text-xs w-full">
                            {day.routeCount} route{day.routeCount !== 1 ? 's' : ''}
                          </Badge>
                          <div className="text-xs">
                            {day.totalDistance.toFixed(1)} km
                          </div>
                          <div className="text-xs">
                            {formatDuration(day.totalTime)}
                          </div>
                        </div>
                      </>
                    )}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Selected Day Routes */}
          {selectedDayRoutes.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>
                  {getDayName(selectedDay)} Routes
                  <Badge className="ml-2">{selectedDayRoutes.length} routes</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {selectedDayRoutes.map((route) => (
                    <div key={route.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-semibold text-lg">{route.name}</h4>
                          {route.description && (
                            <p className="text-sm text-muted-foreground">{route.description}</p>
                          )}
                        </div>
                        <Badge variant={
                          route.status === 'active' ? 'default' :
                          route.status === 'completed' ? 'secondary' :
                          'outline'
                        }>
                          {route.status}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm">{route.total_stops} stops</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Navigation className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm">{route.total_estimated_distance?.toFixed(1)} km</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm">{formatDuration(route.total_estimated_duration || 0)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm">
                            {formatCurrency(
                              calculateFuelCost(route.total_estimated_distance || 0) +
                              calculateLaborCost(route.total_estimated_duration || 0)
                            )}
                          </span>
                        </div>
                      </div>

                      {/* Route Stops */}
                      {route.route_stops && route.route_stops.length > 0 && (
                        <div className="border-t pt-3">
                          <p className="text-sm font-medium mb-2">Route Stops:</p>
                          <div className="space-y-1">
                            {route.route_stops
                              .sort((a, b) => a.stop_order - b.stop_order)
                              .map((stop, idx) => (
                                <div key={stop.id} className="flex items-center gap-2 text-sm">
                                  <Badge variant="outline" className="w-6 h-6 p-0 flex items-center justify-center">
                                    {idx + 1}
                                  </Badge>
                                  <span>{stop.outlet.name}</span>
                                  <ChevronRight className="w-3 h-3 text-muted-foreground" />
                                  <span className="text-muted-foreground">{stop.outlet.address}</span>
                                </div>
                              ))}
                          </div>
                        </div>
                      )}

                      {/* Map Preview if optimization data exists */}
                      {route.optimized_route_data?.polyline && (
                        <div className="mt-3 h-[200px] rounded-lg overflow-hidden border">
                          <GoogleMapComponent
                            center={{
                              lat: route.route_stops?.[0]?.outlet.latitude || 0,
                              lng: route.route_stops?.[0]?.outlet.longitude || 0
                            }}
                            zoom={12}
                            markers={route.route_stops?.map(stop => ({
                              position: {
                                lat: stop.outlet.latitude || 0,
                                lng: stop.outlet.longitude || 0
                              },
                              title: stop.outlet.name,
                              label: (stop.stop_order + 1).toString()
                            })) || []}
                            polyline={route.optimized_route_data.polyline}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {selectedDayRoutes.length === 0 && selectedMember && (
            <Card>
              <CardContent className="py-12 text-center">
                <Activity className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No routes scheduled for {getDayName(selectedDay)}</p>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {!selectedMember && (
        <Card>
          <CardContent className="py-12 text-center">
            <User className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Select a team member to view their routes</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default MemberRoutes