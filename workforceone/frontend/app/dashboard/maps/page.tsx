'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  MapPin,
  Users,
  RefreshCw,
  Filter,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Navigation,
  Activity
} from 'lucide-react'
import { format, parseISO } from 'date-fns'
import GoogleMapComponent from '@/components/maps/GoogleMapComponent'

interface UserLocation {
  id: string
  user_id: string
  full_name: string
  email: string
  role: string
  department?: string
  avatar_url?: string
  check_in_time?: string
  check_out_time?: string
  status: 'present' | 'absent' | 'late' | 'checked_out'
  latitude?: number
  longitude?: number
  location_accuracy?: number
  location_timestamp?: string
  work_hours?: number
  notes?: string
}

interface MapStats {
  totalUsers: number
  checkedIn: number
  checkedOut: number
  absent: number
  late: number
}


function getMarkerIcon(status: string) {
  switch (status) {
    case 'present':
      return { color: '#10b981', label: 'Present' } // Green
    case 'late':
      return { color: '#f59e0b', label: 'Late' } // Yellow
    case 'checked_out':
      return { color: '#3b82f6', label: 'Checked Out' } // Blue
    case 'absent':
    default:
      return { color: '#ef4444', label: 'Absent' } // Red
  }
}

export default function MapsPage() {
  const [userLocations, setUserLocations] = useState<UserLocation[]>([])
  const [filteredUsers, setFilteredUsers] = useState<UserLocation[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedUser, setSelectedUser] = useState<UserLocation | null>(null)
  const [statusFilter, setStatusFilter] = useState('all')
  const [departmentFilter, setDepartmentFilter] = useState('all')
  const [mapCenter, setMapCenter] = useState({ lat: 40.7128, lng: -74.0060 }) // Default: NYC
  
  const supabase = createClient()

  useEffect(() => {
    fetchUserLocations()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [userLocations, statusFilter, departmentFilter])


  const fetchUserLocations = async () => {
    try {
      const { data: user } = await supabase.auth.getUser()
      if (!user.user) return

      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.user.id)
        .single()

      if (!profile?.organization_id) return

      // Get today's attendance with user profiles
      const today = format(new Date(), 'yyyy-MM-dd')
      
      const { data: attendanceData, error } = await supabase
        .from('attendance')
        .select(`
          id,
          user_id,
          check_in_time,
          check_out_time,
          status,
          work_hours,
          notes,
          latitude,
          longitude,
          location_accuracy,
          location_timestamp,
          profiles!attendance_user_id_fkey(
            full_name,
            email,
            role,
            department,
            avatar_url
          )
        `)
        .eq('organization_id', profile.organization_id)
        .eq('date', today)

      if (error) throw error

      // Also get users who haven't checked in today
      const { data: allUsers, error: usersError } = await supabase
        .from('profiles')
        .select('id, full_name, email, role, department, avatar_url')
        .eq('organization_id', profile.organization_id)

      if (usersError) throw usersError

      // Combine data
      const userLocationData: UserLocation[] = allUsers.map(userProfile => {
        const attendance = attendanceData?.find(att => att.user_id === userProfile.id)
        
        let status: UserLocation['status'] = 'absent'
        if (attendance) {
          if (attendance.check_out_time) {
            status = 'checked_out'
          } else {
            status = attendance.status as UserLocation['status']
          }
        }

        return {
          id: attendance?.id || userProfile.id,
          user_id: userProfile.id,
          full_name: userProfile.full_name || 'Unknown',
          email: userProfile.email || '',
          role: userProfile.role || 'User',
          department: userProfile.department,
          avatar_url: userProfile.avatar_url,
          check_in_time: attendance?.check_in_time,
          check_out_time: attendance?.check_out_time,
          status,
          latitude: attendance?.latitude,
          longitude: attendance?.longitude,
          location_accuracy: attendance?.location_accuracy,
          location_timestamp: attendance?.location_timestamp,
          work_hours: attendance?.work_hours,
          notes: attendance?.notes
        }
      })

      setUserLocations(userLocationData)

      // Set map center to first user with location or organization center
      const userWithLocation = userLocationData.find(u => u.latitude && u.longitude)
      if (userWithLocation) {
        setMapCenter({ lat: userWithLocation.latitude!, lng: userWithLocation.longitude! })
      }

    } catch (error) {
      console.error('Error fetching user locations:', error)
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = userLocations

    if (statusFilter !== 'all') {
      filtered = filtered.filter(user => user.status === statusFilter)
    }

    if (departmentFilter !== 'all') {
      filtered = filtered.filter(user => user.department === departmentFilter)
    }

    setFilteredUsers(filtered)
  }

  const getStats = (): MapStats => {
    return {
      totalUsers: userLocations.length,
      checkedIn: userLocations.filter(u => u.status === 'present' || u.status === 'late').length,
      checkedOut: userLocations.filter(u => u.status === 'checked_out').length,
      absent: userLocations.filter(u => u.status === 'absent').length,
      late: userLocations.filter(u => u.status === 'late').length,
    }
  }

  const stats = getStats()
  const departments = [...new Set(userLocations.map(u => u.department).filter(Boolean))]

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'present':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'late':
        return <AlertCircle className="h-4 w-4 text-yellow-600" />
      case 'checked_out':
        return <Clock className="h-4 w-4 text-blue-600" />
      case 'absent':
      default:
        return <XCircle className="h-4 w-4 text-red-600" />
    }
  }

  const requestLocationAccess = async () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by this browser.')
      return
    }

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 60000
        })
      })

      const newCenter = {
        lat: position.coords.latitude,
        lng: position.coords.longitude
      }

      setMapCenter(newCenter)
      alert('Location access granted! The map will center on your location.')
    } catch (error) {
      console.error('Error getting location:', error)
      alert('Could not access your location. Please enable location services.')
    }
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Team Location Map</h1>
          <p className="text-muted-foreground mt-2">View team members' check-in status and locations in real-time.</p>
        </div>
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
          <Button onClick={requestLocationAccess} variant="outline" className="btn-base">
            <Navigation className="h-4 w-4 mr-2" />
            My Location
          </Button>
          <Button onClick={fetchUserLocations} variant="default" className="btn-base">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Modern Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <Card className="card-hover glass">
          <CardContent className="p-6 text-center">
            <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-foreground">{stats.totalUsers}</div>
            <div className="text-sm text-muted-foreground">Total Team</div>
          </CardContent>
        </Card>
        
        <Card className="card-hover glass">
          <CardContent className="p-6 text-center">
            <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div className="text-2xl font-bold text-green-600">{stats.checkedIn}</div>
            <div className="text-sm text-muted-foreground">Checked In</div>
          </CardContent>
        </Card>
        
        <Card className="card-hover glass">
          <CardContent className="p-6 text-center">
            <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="h-6 w-6 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-blue-600">{stats.checkedOut}</div>
            <div className="text-sm text-muted-foreground">Checked Out</div>
          </CardContent>
        </Card>
        
        <Card className="card-hover glass">
          <CardContent className="p-6 text-center">
            <div className="h-12 w-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="text-2xl font-bold text-yellow-600">{stats.late}</div>
            <div className="text-sm text-muted-foreground">Late</div>
          </CardContent>
        </Card>
        
        <Card className="card-hover glass">
          <CardContent className="p-6 text-center">
            <div className="h-12 w-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircle className="h-6 w-6 text-red-600" />
            </div>
            <div className="text-2xl font-bold text-red-600">{stats.absent}</div>
            <div className="text-sm text-muted-foreground">Absent</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Modern Map Card */}
        <div className="lg:col-span-3">
          <Card className="glass overflow-hidden">
            <CardHeader className="border-b border-border/50">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
                <CardTitle className="flex items-center text-xl font-semibold">
                  <div className="h-8 w-8 bg-primary/20 rounded-lg flex items-center justify-center mr-3">
                    <MapPin className="h-4 w-4 text-primary" />
                  </div>
                  Team Locations
                </CardTitle>
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full sm:w-40 btn-base">
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="glass border-border">
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="present">Present</SelectItem>
                      <SelectItem value="late">Late</SelectItem>
                      <SelectItem value="checked_out">Checked Out</SelectItem>
                      <SelectItem value="absent">Absent</SelectItem>
                    </SelectContent>
                  </Select>
                  {departments.length > 0 && (
                    <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                      <SelectTrigger className="w-full sm:w-48 btn-base">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="glass border-border">
                        <SelectItem value="all">All Departments</SelectItem>
                        {departments.map(dept => (
                          <SelectItem key={dept} value={dept!}>{dept}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="relative">
                <GoogleMapComponent
                  center={mapCenter}
                  zoom={12}
                  markers={filteredUsers
                    .filter(user => user.latitude && user.longitude)
                    .map(user => ({
                      id: user.user_id,
                      position: { lat: user.latitude!, lng: user.longitude! },
                      title: `${user.full_name} - ${user.status}`,
                      icon: getMarkerIcon(user.status),
                      infoContent: `
                        <div class="p-4 min-w-[220px] bg-white rounded-lg shadow-lg">
                          <div class="flex items-center space-x-3 mb-3">
                            <div class="w-4 h-4 rounded-full shadow-sm" style="background-color: ${getMarkerIcon(user.status).color}"></div>
                            <span class="font-semibold text-gray-900">${user.full_name}</span>
                          </div>
                          <div class="text-sm text-gray-600 space-y-2">
                            <p><span class="font-medium">Role:</span> ${user.role}</p>
                            ${user.department ? `<p><span class="font-medium">Department:</span> ${user.department}</p>` : ''}
                            <p><span class="font-medium">Status:</span> ${user.status.replace('_', ' ').toUpperCase()}</p>
                            ${user.check_in_time ? `<p><span class="font-medium">Check-in:</span> ${format(parseISO(user.check_in_time), 'HH:mm')}</p>` : ''}
                            ${user.check_out_time ? `<p><span class="font-medium">Check-out:</span> ${format(parseISO(user.check_out_time), 'HH:mm')}</p>` : ''}
                            ${user.work_hours ? `<p><span class="font-medium">Hours:</span> ${user.work_hours.toFixed(1)}h</p>` : ''}
                            ${user.location_timestamp ? `<p><span class="font-medium">Updated:</span> ${format(parseISO(user.location_timestamp), 'HH:mm')}</p>` : ''}
                          </div>
                        </div>
                      `,
                      onClick: () => setSelectedUser(user)
                    }))}
                  style={{ height: '600px', borderRadius: '0 0 12px 12px' }}
                  className="rounded-b-xl"
                  onMarkerClick={(marker) => {
                    const user = filteredUsers.find(u => u.user_id === marker.id)
                    if (user) setSelectedUser(user)
                  }}
                />
                
                {/* Map overlay for loading/empty state */}
                {loading && (
                  <div className="absolute inset-0 bg-muted/50 flex items-center justify-center rounded-b-xl">
                    <div className="text-center">
                      <div className="animate-pulse text-muted-foreground">Loading map data...</div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Modern Team List */}
        <div className="space-y-6">
          <Card className="glass">
            <CardHeader className="border-b border-border/50">
              <CardTitle className="flex items-center justify-between text-lg">
                <span>Team Members</span>
                <Badge variant="secondary" className="ml-2">
                  {filteredUsers.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-[600px] overflow-y-auto">
                {loading ? (
                  <div className="text-center py-12">
                    <div className="animate-pulse">
                      <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                      <p className="text-muted-foreground">Loading team data...</p>
                    </div>
                  </div>
                ) : filteredUsers.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="h-16 w-16 text-muted-foreground/30 mx-auto mb-6" />
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-foreground">No team members found</p>
                      <p className="text-xs text-muted-foreground">Try adjusting your filters</p>
                    </div>
                  </div>
                ) : (
                  <div className="divide-y divide-border/50">
                    {filteredUsers.map(user => (
                      <div
                        key={user.user_id}
                        className={`flex items-start space-x-4 p-4 cursor-pointer transition-all duration-200 hover:bg-accent/30 ${
                          selectedUser?.user_id === user.user_id 
                            ? 'bg-primary/5 border-r-2 border-r-primary' 
                            : ''
                        }`}
                        onClick={() => setSelectedUser(user)}
                      >
                        <div className="flex-shrink-0 mt-0.5">
                          {getStatusIcon(user.status)}
                        </div>
                        <div className="flex-1 min-w-0 space-y-2">
                          <div>
                            <div className="font-medium text-sm text-foreground truncate">
                              {user.full_name}
                            </div>
                            <div className="text-xs text-muted-foreground truncate">
                              {user.role}
                              {user.department && (
                                <>
                                  <span className="mx-1">•</span>
                                  {user.department}
                                </>
                              )}
                            </div>
                          </div>
                          
                          {user.check_in_time && (
                            <div className="text-xs text-muted-foreground">
                              <Clock className="inline h-3 w-3 mr-1" />
                              In: {format(parseISO(user.check_in_time), 'HH:mm')}
                            </div>
                          )}
                          
                          <div className={`text-xs flex items-center ${
                            user.latitude && user.longitude 
                              ? 'text-success-600' 
                              : 'text-muted-foreground/60'
                          }`}>
                            <MapPin className="h-3 w-3 mr-1" />
                            {user.latitude && user.longitude 
                              ? 'Location available' 
                              : 'No location data'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modern Legend */}
      <Card className="glass">
        <CardHeader>
          <CardTitle className="flex items-center text-lg">
            <div className="h-6 w-6 bg-muted/20 rounded-lg flex items-center justify-center mr-3">
              <Activity className="h-3 w-3 text-muted-foreground" />
            </div>
            Status Legend
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="flex items-center space-x-3 p-3 rounded-lg bg-green-50/50 border border-green-200/30">
              <div className="w-3 h-3 rounded-full bg-green-500 shadow-sm"></div>
              <div>
                <div className="text-sm font-medium text-foreground">Present</div>
                <div className="text-xs text-muted-foreground">Checked In</div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 p-3 rounded-lg bg-yellow-50/50 border border-yellow-200/30">
              <div className="w-3 h-3 rounded-full bg-yellow-500 shadow-sm"></div>
              <div>
                <div className="text-sm font-medium text-foreground">Late</div>
                <div className="text-xs text-muted-foreground">Checked In Late</div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 p-3 rounded-lg bg-blue-50/50 border border-blue-200/30">
              <div className="w-3 h-3 rounded-full bg-blue-500 shadow-sm"></div>
              <div>
                <div className="text-sm font-medium text-foreground">Checked Out</div>
                <div className="text-xs text-muted-foreground">Day Complete</div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 p-3 rounded-lg bg-red-50/50 border border-red-200/30">
              <div className="w-3 h-3 rounded-full bg-red-500 shadow-sm"></div>
              <div>
                <div className="text-sm font-medium text-foreground">Absent</div>
                <div className="text-xs text-muted-foreground">Not Checked In</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}