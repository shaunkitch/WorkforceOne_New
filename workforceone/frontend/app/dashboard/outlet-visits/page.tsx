'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
  Clock,
  CheckCircle,
  AlertCircle,
  Calendar,
  Users,
  Download,
  Search,
  Filter,
  Eye,
  Phone,
  Building,
  User,
  FileText,
  PlayCircle,
  StopCircle
} from 'lucide-react'
import { format, parseISO } from 'date-fns'

interface OutletVisit {
  id: string
  outlet_id: string
  user_id: string
  route_stop_id?: string
  organization_id: string
  check_in_time: string
  check_out_time?: string
  form_completed: boolean
  form_response_id?: string
  notes?: string
  created_at: string
  updated_at: string
  outlet?: {
    id: string
    name: string
    address?: string
  } | null
  user?: {
    id: string
    full_name: string
    email: string
    role: string
  } | null
  route_stop?: {
    id: string
    sequence_number: number
    status: string
  }
}

interface OutletVisitsStats {
  totalVisits: number
  completedForms: number
  averageTimePerVisit: number
  uniqueOutlets: number
  uniqueUsers: number
  todayVisits: number
  weekVisits: number
  monthVisits: number
}

interface FilterState {
  outlet_id: string
  user_id: string
  status: string
  date_range: string
  search: string
  form_completed: string
}

export default function OutletVisitsPage() {
  const [visits, setVisits] = useState<OutletVisit[]>([])
  const [outlets, setOutlets] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [stats, setStats] = useState<OutletVisitsStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [groupByOutlet, setGroupByOutlet] = useState(false)
  const [filters, setFilters] = useState<FilterState>({
    outlet_id: 'all',
    user_id: 'all',
    status: 'all',
    date_range: 'today',
    search: '',
    form_completed: 'all'
  })

  const supabase = createClient()

  useEffect(() => {
    fetchUserProfile()
    fetchOutlets()
    fetchUsers()
    fetchOutletVisits()
  }, [filters])

  const fetchUserProfile = async () => {
    try {
      const { data: user } = await supabase.auth.getUser()
      if (!user.user) return

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.user.id)
        .single()

      setUserProfile(profile)
    } catch (error) {
      console.error('Error fetching user profile:', error)
    }
  }

  const fetchOutlets = async () => {
    try {
      const { data: user } = await supabase.auth.getUser()
      if (!user.user) return

      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.user.id)
        .single()

      if (!profile?.organization_id) return

      const { data, error } = await supabase
        .from('outlets')
        .select('id, name, address')
        .eq('organization_id', profile.organization_id)
        .order('name')

      if (error) {
        console.error('Error fetching outlets for dropdown:', error)
        console.error('Details:', { organization_id: profile.organization_id })
      } else {
        devLog('Fetched outlets for dropdown:', data);
        setOutlets(data || [])
      }
    } catch (error) {
      console.error('Error in fetchOutlets function:', error)
    }
  }

  const fetchUsers = async () => {
    try {
      const { data: user } = await supabase.auth.getUser()
      if (!user.user) return

      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id, role')
        .eq('id', user.user.id)
        .single()

      if (!profile?.organization_id) return

      // Only managers and admins can see all users
      if (profile.role === 'admin' || profile.role === 'manager') {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, full_name, email, role')
          .eq('organization_id', profile.organization_id)
          .order('full_name')

        if (error) throw error
        setUsers(data || [])
      }
    } catch (error) {
      console.error('Error fetching users:', error)
    }
  }

  const fetchOutletVisits = async () => {
    try {
      const { data: user } = await supabase.auth.getUser()
      if (!user.user) return

      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id, role')
        .eq('id', user.user.id)
        .single()

      if (!profile?.organization_id) return

      // Only fetch completed visits (those with check_out_time)
      let query = supabase
        .from('outlet_visits')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .not('check_out_time', 'is', null)
        .order('check_in_time', { ascending: false })

      // Apply filters
      if (filters.outlet_id !== 'all') {
        query = query.eq('outlet_id', filters.outlet_id)
      }

      if (filters.user_id !== 'all') {
        query = query.eq('user_id', filters.user_id)
      }

      if (filters.form_completed !== 'all') {
        query = query.eq('form_completed', filters.form_completed === 'true')
      }

      // Date range filter
      if (filters.date_range !== 'all') {
        const now = new Date()
        let startDate: Date

        switch (filters.date_range) {
          case 'today':
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
            break
          case 'week':
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
            break
          case 'month':
            startDate = new Date(now.getFullYear(), now.getMonth(), 1)
            break
          default:
            startDate = new Date(0)
        }

        devLog('Date filter applied:', {
          range: filters.date_range,
          startDate: startDate.toISOString();,
          now: now.toISOString()
        })
        query = query.gte('check_in_time', startDate.toISOString())
      }

      // Status filter is not needed since we're already filtering for completed visits only

      // For regular users, only show their own visits
      if (profile.role === 'member') {
        query = query.eq('user_id', user.user.id)
      }

      const { data, error } = await query.limit(1000)

      if (error) {
        console.error('Supabase query error:', error)
        console.error('Query details:', {
          organization_id: profile.organization_id,
          filters,
          user_role: profile.role
        })
        throw error
      }

      devLog('Raw outlet visits data:', data);
      let processedData = data || []

      // Fetch related outlet and user data
      if (processedData.length > 0) {
        const outletIds = [...new Set(processedData.map(v => v.outlet_id).filter(Boolean))]
        const userIds = [...new Set(processedData.map(v => v.user_id).filter(Boolean))]

        devLog('Fetching data for outlet IDs:', outletIds);
        devLog('Fetching data for user IDs:', userIds);

        // Fetch outlets - ensure we get all outlet data
        if (outletIds.length > 0) {
          const { data: outletData, error: outletError } = await supabase
            .from('outlets')
            .select('id, name, address')
            .in('id', outletIds)

          if (outletError) {
            console.error('Error fetching outlets:', JSON.stringify(outletError, null, 2))
            console.error('Query details:', {
              outletIds,
              query: 'outlets table with ids',
              error_message: outletError.message,
              error_code: outletError.code,
              error_hint: outletError.hint,
              error_details: outletError.details
            })
          } else {
            devLog('Fetched outlets:', outletData);
            devLog('Outlet mapping:', outletData?.map(o => ({ id: o.id, name: o.name });))
          }

          // Fetch users
          const { data: userData, error: userError } = await supabase
            .from('profiles')
            .select('id, full_name, email, role')
            .in('id', userIds)

          if (userError) {
            console.error('Error fetching users:', userError)
          }

          // Map the data back to visits
          processedData = processedData.map(visit => {
            const outlet = outletData?.find(o => o.id === visit.outlet_id)
            const user = userData?.find(u => u.id === visit.user_id)
            
            if (!outlet && visit.outlet_id) {
              console.warn('No outlet found for outlet_id:', visit.outlet_id, 'Available outlets:', outletData?.map(o => ({ id: o.id, name: o.name })))
            }
            
            return {
              ...visit,
              outlet: outlet || null,
              user: user || null
            }
          })
        }
      }

      // Apply search filter client-side for better UX
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase()
        processedData = processedData.filter(visit => 
          visit.outlet?.name?.toLowerCase().includes(searchTerm) ||
          visit.user?.full_name?.toLowerCase().includes(searchTerm) ||
          visit.user?.email?.toLowerCase().includes(searchTerm) ||
          visit.outlet?.address?.toLowerCase().includes(searchTerm)
        )
      }

      setVisits(processedData)

      // Calculate stats
      calculateStats(processedData)

    } catch (error) {
      console.error('Error fetching outlet visits:', error)
      setVisits([])
      setStats({
        totalVisits: 0,
        completedForms: 0,
        averageTimePerVisit: 0,
        uniqueOutlets: 0,
        uniqueUsers: 0,
        todayVisits: 0,
        weekVisits: 0,
        monthVisits: 0
      })
    } finally {
      setLoading(false)
    }
  }

  const calculateStats = (visitsData: OutletVisit[]) => {
    const totalVisits = visitsData.length
    const completedForms = visitsData.filter(v => v.form_completed).length
    const uniqueOutlets = new Set(visitsData.map(v => v.outlet_id)).size
    const uniqueUsers = new Set(visitsData.map(v => v.user_id)).size

    // Calculate average time per visit for completed visits
    const completedVisits = visitsData.filter(v => v.check_out_time)
    const totalMinutes = completedVisits.reduce((acc, visit) => {
      const checkIn = new Date(visit.check_in_time)
      const checkOut = new Date(visit.check_out_time!)
      return acc + ((checkOut.getTime() - checkIn.getTime()) / (1000 * 60))
    }, 0)
    
    const averageTimePerVisit = completedVisits.length > 0 ? Math.round(totalMinutes / completedVisits.length) : 0

    // Date-based stats
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

    const todayVisits = visitsData.filter(v => new Date(v.check_in_time) >= today).length
    const weekVisits = visitsData.filter(v => new Date(v.check_in_time) >= weekAgo).length
    const monthVisits = visitsData.filter(v => new Date(v.check_in_time) >= monthStart).length

    devLog('Stats calculation:', {
      totalVisits,
      todayVisits,
      weekVisits,
      monthVisits,
      today: today.toISOString();,
      visitsWithDates: visitsData.map(v => v.check_in_time)
    })

    setStats({
      totalVisits,
      completedForms,
      averageTimePerVisit,
      uniqueOutlets,
      uniqueUsers,
      todayVisits,
      weekVisits,
      monthVisits
    })
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'visited':
        return <StopCircle className="h-4 w-4 text-blue-600" />
      case 'in_progress':
        return <PlayCircle className="h-4 w-4 text-yellow-600" />
      default:
        return <AlertCircle className="h-4 w-4 text-red-600" />
    }
  }

  const exportToCSV = () => {
    const headers = ['Outlet', 'Visitor', 'Check In', 'Check Out', 'Duration', 'Form Completed', 'Status', 'Notes']
    const csvContent = [
      headers.join(','),
      ...visits.map(visit => {
        const checkIn = visit.check_in_time ? format(parseISO(visit.check_in_time), 'yyyy-MM-dd HH:mm:ss') : ''
        const checkOut = visit.check_out_time ? format(parseISO(visit.check_out_time), 'yyyy-MM-dd HH:mm:ss') : ''
        const duration = visit.check_out_time ? 
          Math.round((new Date(visit.check_out_time).getTime() - new Date(visit.check_in_time).getTime()) / (1000 * 60)) + ' min' : 
          'Ongoing'
        
        return [
          `"${visit.outlet?.name || 'Unknown Outlet'}"`,
          `"${visit.user?.full_name || 'Unknown User'}"`,
          checkIn,
          checkOut,
          duration,
          visit.form_completed ? 'Yes' : 'No',
          getVisitStatus(visit),
          `"${visit.notes || ''}"`
        ].join(',')
      })
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `outlet-visits-${format(new Date(), 'yyyy-MM-dd')}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const viewVisitDetails = (visit: OutletVisit) => {
    const details = `
Visit Details:
- Outlet: ${visit.outlet?.name || 'Unknown'}
- Address: ${visit.outlet?.address || 'N/A'}
- Visitor: ${visit.user?.full_name || 'Unknown'}
- Check-in: ${visit.check_in_time ? format(parseISO(visit.check_in_time), 'MMM d, yyyy HH:mm') : 'N/A'}
- Check-out: ${visit.check_out_time ? format(parseISO(visit.check_out_time), 'MMM d, yyyy HH:mm') : 'Still in progress'}
- Form Completed: ${visit.form_completed ? 'Yes' : 'No'}
- Status: ${getVisitStatus(visit)}
- Notes: ${visit.notes || 'No notes'}
    `.trim()
    
    alert(details)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-pulse text-muted-foreground">Loading outlet visits...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Completed Outlet Visits</h1>
          <p className="text-gray-600">View all completed outlet visits with check-in and check-out times.</p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline" onClick={exportToCSV} disabled={visits.length === 0}>
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Phone className="h-8 w-8 text-blue-600 mx-auto mb-2" />
            <div className="text-2xl font-bold">{stats?.totalVisits || 0}</div>
            <div className="text-sm text-gray-600">Total Visits</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <div className="text-2xl font-bold">{stats?.completedForms || 0}</div>
            <div className="text-sm text-gray-600">Forms Completed</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Building className="h-8 w-8 text-purple-600 mx-auto mb-2" />
            <div className="text-2xl font-bold">{stats?.uniqueOutlets || 0}</div>
            <div className="text-sm text-gray-600">Unique Outlets</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Clock className="h-8 w-8 text-orange-600 mx-auto mb-2" />
            <div className="text-2xl font-bold">{stats?.averageTimePerVisit || 0}m</div>
            <div className="text-sm text-gray-600">Avg Duration</div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <Calendar className="h-6 w-6 text-blue-600 mx-auto mb-2" />
            <div className="text-xl font-bold">{stats?.todayVisits || 0}</div>
            <div className="text-sm text-gray-600">Today</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Calendar className="h-6 w-6 text-green-600 mx-auto mb-2" />
            <div className="text-xl font-bold">{stats?.weekVisits || 0}</div>
            <div className="text-sm text-gray-600">This Week</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Calendar className="h-6 w-6 text-purple-600 mx-auto mb-2" />
            <div className="text-xl font-bold">{stats?.monthVisits || 0}</div>
            <div className="text-sm text-gray-600">This Month</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search visits..."
                value={filters.search}
                onChange={(e) => setFilters({...filters, search: e.target.value})}
                className="pl-10"
              />
            </div>
            
            <Select value={filters.outlet_id} onValueChange={(value) => setFilters({...filters, outlet_id: value})}>
              <SelectTrigger>
                <SelectValue placeholder="All Outlets" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Outlets</SelectItem>
                {outlets.map(outlet => (
                  <SelectItem key={outlet.id} value={outlet.id}>
                    {outlet.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {users.length > 0 && (
              <Select value={filters.user_id} onValueChange={(value) => setFilters({...filters, user_id: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="All Users" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  {users.map(user => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.full_name || user.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}


            <Select value={filters.form_completed} onValueChange={(value) => setFilters({...filters, form_completed: value})}>
              <SelectTrigger>
                <SelectValue placeholder="Form Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Forms</SelectItem>
                <SelectItem value="true">Form Completed</SelectItem>
                <SelectItem value="false">Form Pending</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.date_range} onValueChange={(value) => setFilters({...filters, date_range: value})}>
              <SelectTrigger>
                <SelectValue placeholder="Today" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">Last 7 Days</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Visits Table */}
      <Card>
        <CardContent className="p-0">
          {visits.length === 0 ? (
            <div className="p-8 text-center">
              <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No visits found</h3>
              <p className="text-gray-500">No outlet visits match your current filters.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left p-3 font-medium">Outlet</th>
                    <th className="text-left p-3 font-medium">Visitor</th>
                    <th className="text-left p-3 font-medium">Check In</th>
                    <th className="text-left p-3 font-medium">Check Out</th>
                    <th className="text-left p-3 font-medium">Duration</th>
                    <th className="text-left p-3 font-medium">Form</th>
                    <th className="text-left p-3 font-medium">Status</th>
                    <th className="text-left p-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {visits.map((visit) => {
                    const status = getVisitStatus(visit)
                    const duration = visit.check_out_time ? 
                      Math.round((new Date(visit.check_out_time).getTime() - new Date(visit.check_in_time).getTime()) / (1000 * 60)) : 
                      null
                    
                    return (
                      <tr key={visit.id} className="border-b hover:bg-gray-50">
                        <td className="p-3">
                          <div>
                            <div className="font-medium">{visit.outlet?.name || 'Unknown Outlet'}</div>
                            {visit.outlet?.address && (
                              <div className="text-sm text-gray-500 truncate max-w-xs">
                                {visit.outlet.address}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center">
                            <User className="h-4 w-4 text-gray-400 mr-2" />
                            <div>
                              <div className="font-medium">{visit.user?.full_name || 'Unknown User'}</div>
                              <div className="text-sm text-gray-500">{visit.user?.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center text-sm">
                            <Clock className="h-4 w-4 text-gray-400 mr-2" />
                            <div>
                              <div>{format(parseISO(visit.check_in_time), 'MMM d, yyyy')}</div>
                              <div className="text-gray-500">{format(parseISO(visit.check_in_time), 'HH:mm')}</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-3">
                          {visit.check_out_time ? (
                            <div className="flex items-center text-sm">
                              <Clock className="h-4 w-4 text-gray-400 mr-2" />
                              <div>
                                <div>{format(parseISO(visit.check_out_time), 'MMM d, yyyy')}</div>
                                <div className="text-gray-500">{format(parseISO(visit.check_out_time), 'HH:mm')}</div>
                              </div>
                            </div>
                          ) : (
                            <span className="text-gray-400">In progress</span>
                          )}
                        </td>
                        <td className="p-3">
                          {duration ? (
                            <span className="text-sm">{duration} min</span>
                          ) : (
                            <span className="text-gray-400">Ongoing</span>
                          )}
                        </td>
                        <td className="p-3">
                          <div className="flex items-center">
                            <FileText className="h-4 w-4 text-gray-400 mr-2" />
                            {visit.form_completed ? (
                              <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Completed</Badge>
                            ) : (
                              <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">Pending</Badge>
                            )}
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center">
                            {getStatusIcon(status)}
                            <span className="ml-2">{getStatusBadge(status)}</span>
                          </div>
                        </td>
                        <td className="p-3">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => viewVisitDetails(visit)}
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            View
                          </Button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}