'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { workflowTriggerEngine } from '@/lib/workflow-triggers'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  Clock, 
  Calendar,
  CheckCircle,
  XCircle,
  AlertCircle,
  MapPin,
  Camera,
  Coffee,
  Timer,
  TrendingUp,
  Users,
  Settings,
  Save
} from 'lucide-react'
import { format, startOfWeek, endOfWeek, isToday, parseISO } from 'date-fns'

interface AttendanceRecord {
  id: string
  user_id: string
  date: string
  check_in_time?: string
  check_out_time?: string
  work_hours?: number
  overtime_hours?: number
  status: 'present' | 'absent' | 'late' | 'half_day'
  notes?: string
  created_at: string
  updated_at: string
}

interface WeeklyStats {
  totalDays: number
  presentDays: number
  lateDays: number
  absentDays: number
  totalHours: number
  avgHours: number
}

export default function AttendancePage() {
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([])
  const [todayRecord, setTodayRecord] = useState<AttendanceRecord | null>(null)
  const [weeklyStats, setWeeklyStats] = useState<WeeklyStats>({
    totalDays: 5,
    presentDays: 0,
    lateDays: 0,
    absentDays: 0,
    totalHours: 0,
    avgHours: 0
  })
  const [loading, setLoading] = useState(true)
  const [isCheckedIn, setIsCheckedIn] = useState(false)
  const [breakStartTime, setBreakStartTime] = useState<Date | null>(null)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [notes, setNotes] = useState('')
  const [activeTab, setActiveTab] = useState<'attendance' | 'settings'>('attendance')
  const [organizationSettings, setOrganizationSettings] = useState<any>(null)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [filterWeek, setFilterWeek] = useState('current')
  const [liveHours, setLiveHours] = useState(0)
  
  const supabase = createClient()

  useEffect(() => {
    fetchUserProfile()
    fetchAttendanceData()
    
    // Update current time every second for live tracking
    const timer = setInterval(() => {
      const now = new Date()
      setCurrentTime(now)
      
      // Calculate live hours if checked in
      if (isCheckedIn && todayRecord?.check_in_time) {
        const checkInTime = new Date(todayRecord.check_in_time)
        const totalMinutes = Math.floor((now.getTime() - checkInTime.getTime()) / (1000 * 60))
        const totalHours = totalMinutes / 60
        setLiveHours(totalHours)
      }
    }, 1000)
    
    return () => clearInterval(timer)
  }, [filterWeek, isCheckedIn, todayRecord])

  const fetchUserProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      setUserProfile(profile)

      if (profile?.organization_id) {
        // Fetch organization settings
        const { data: orgSettings } = await supabase
          .from('organization_settings')
          .select('*')
          .eq('organization_id', profile.organization_id)
          .single()

        if (orgSettings) {
          setOrganizationSettings(orgSettings)
        }
      }
    } catch (error) {
      console.error('Error fetching user profile:', error)
    }
  }

  const fetchAttendanceData = async () => {
    try {
      const { data: user } = await supabase.auth.getUser()
      if (!user.user) return

      // Get date range based on filter
      const now = new Date()
      let startDate: Date
      let endDate: Date
      
      if (filterWeek === 'current') {
        startDate = startOfWeek(now)
        endDate = endOfWeek(now)
      } else if (filterWeek === 'last') {
        startDate = startOfWeek(new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000))
        endDate = endOfWeek(new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000))
      } else {
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        endDate = now
      }

      const { data, error } = await supabase
        .from('attendance')
        .select('*')
        .eq('user_id', user.user.id)
        .gte('date', format(startDate, 'yyyy-MM-dd'))
        .lte('date', format(endDate, 'yyyy-MM-dd'))
        .order('date', { ascending: false })

      if (error) throw error

      const records = data || []
      setAttendanceRecords(records)

      // Find today's record
      const today = format(new Date(), 'yyyy-MM-dd')
      const todayAttendance = records.find(record => record.date === today)
      setTodayRecord(todayAttendance || null)
      setIsCheckedIn(!!todayAttendance?.check_in_time && !todayAttendance?.check_out_time)
      setNotes(todayAttendance?.notes || '')

      // Initialize live hours if currently checked in
      if (todayAttendance?.check_in_time && !todayAttendance?.check_out_time) {
        const now = new Date()
        const checkInTime = new Date(todayAttendance.check_in_time)
        const totalMinutes = Math.floor((now.getTime() - checkInTime.getTime()) / (1000 * 60))
        const totalHours = totalMinutes / 60
        setLiveHours(totalHours)
      } else {
        setLiveHours(0)
      }

      // Calculate weekly stats
      const stats = calculateWeeklyStats(records)
      setWeeklyStats(stats)

    } catch (error) {
      console.error('Error fetching attendance data:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateWeeklyStats = (records: AttendanceRecord[]): WeeklyStats => {
    const presentDays = records.filter(r => r.status === 'present').length
    const lateDays = records.filter(r => r.status === 'late').length
    const absentDays = records.filter(r => r.status === 'absent').length
    const totalHours = records.reduce((sum, r) => sum + (r.work_hours || 0), 0)
    
    return {
      totalDays: records.length || 5,
      presentDays,
      lateDays,
      absentDays,
      totalHours,
      avgHours: totalHours / (records.length || 1)
    }
  }

  const checkIn = async () => {
    try {
      const { data: user } = await supabase.auth.getUser()
      if (!user.user) return

      // Get user's organization_id from profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.user.id)
        .single()

      // If no profile or organization, get default organization
      let organizationId = profile?.organization_id
      
      if (!organizationId) {
        const { data: defaultOrg } = await supabase
          .from('organizations')
          .select('id')
          .limit(1)
          .single()
        
        organizationId = defaultOrg?.id
      }

      if (!organizationId) {
        throw new Error('No organization found. Please contact your administrator.')
      }

      const now = new Date()
      const today = format(now, 'yyyy-MM-dd')

      // Determine status based on time (assuming 9:00 AM is standard time)
      const checkInHour = now.getHours()
      const status = checkInHour >= 9 ? 'late' : 'present'

      // Get user's location
      let locationData = {}
      if (navigator.geolocation) {
        try {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: true,
              timeout: 10000,
              maximumAge: 60000
            })
          })

          locationData = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            location_accuracy: position.coords.accuracy,
            location_timestamp: now.toISOString()
          }
        } catch (locationError) {
          console.warn('Could not get location:', locationError)
          // Continue without location - it's optional
        }
      }

      const attendanceData = {
        user_id: user.user.id,
        organization_id: organizationId,
        date: today,
        check_in_time: now.toISOString(),
        status: status,
        notes: notes,
        ...locationData
      }

      if (todayRecord) {
        // Update existing record
        const { error } = await supabase
          .from('attendance')
          .update(attendanceData)
          .eq('id', todayRecord.id)

        if (error) throw error
      } else {
        // Create new record
        const { error } = await supabase
          .from('attendance')
          .insert(attendanceData)

        if (error) throw error
      }

      // Trigger workflow events based on check-in status
      if (profile?.organization_id) {
        try {
          // Trigger check-in event
          await workflowTriggerEngine.triggerAttendanceEvent(
            profile.organization_id,
            user.user.id,
            'check_in',
            {
              status: status,
              timestamp: now.toISOString(),
              location: locationData
            }
          )

          // If late, trigger late check-in event
          if (status === 'late') {
            await workflowTriggerEngine.triggerAttendanceEvent(
              profile.organization_id,
              user.user.id,
              'late',
              {
                check_in_time: now.toISOString(),
                late_by_minutes: (checkInHour - 9) * 60 + now.getMinutes(),
                location: locationData
              }
            )
          }
        } catch (triggerError) {
          console.warn('Failed to trigger workflow events:', triggerError)
          // Don't throw error - attendance should still work even if triggers fail
        }
      }

      setIsCheckedIn(true)
      fetchAttendanceData()
    } catch (error) {
      console.error('Error checking in:', error)
      alert('Failed to check in. Please try again.')
    }
  }

  const checkOut = async () => {
    if (!todayRecord) return

    try {
      const now = new Date()
      const checkInTime = new Date(todayRecord.check_in_time!)
      const totalMinutes = Math.floor((now.getTime() - checkInTime.getTime()) / (1000 * 60))
      const totalHours = totalMinutes / 60 // Remove break_duration reference since it doesn't exist

      const { error } = await supabase
        .from('attendance')
        .update({
          check_out_time: now.toISOString(),
          work_hours: parseFloat(totalHours.toFixed(2)), // Use work_hours instead of total_hours
          notes: notes
        })
        .eq('id', todayRecord.id)

      if (error) throw error

      // Trigger check-out workflow event
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user?.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('organization_id')
            .eq('id', user.user.id)
            .single()

          if (profile?.organization_id) {
            await workflowTriggerEngine.triggerAttendanceEvent(
              profile.organization_id,
              user.user.id,
              'check_out',
              {
                check_out_time: now.toISOString(),
                total_hours: totalHours,
                check_in_time: todayRecord.check_in_time
              }
            )
          }
        }
      } catch (triggerError) {
        console.warn('Failed to trigger check-out workflow events:', triggerError)
      }

      setIsCheckedIn(false)
      setBreakStartTime(null)
      fetchAttendanceData()
    } catch (error) {
      console.error('Error checking out:', error)
      alert('Failed to check out. Please try again.')
    }
  }

  const startBreak = () => {
    setBreakStartTime(new Date())
  }

  const endBreak = async () => {
    // Break functionality removed - not supported by current schema
    setBreakStartTime(null)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'present':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'late':
        return <AlertCircle className="h-4 w-4 text-yellow-600" />
      case 'absent':
        return <XCircle className="h-4 w-4 text-red-600" />
      default:
        return <Clock className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      present: 'default',
      late: 'secondary',
      absent: 'destructive',
      half_day: 'secondary'
    } as const

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'default'}>
        {status.replace('_', ' ').toUpperCase()}
      </Badge>
    )
  }

  const formatTime = (dateString: string | null) => {
    if (!dateString) return '--:--'
    return format(parseISO(dateString), 'HH:mm')
  }

  const formatHours = (hours: number | null) => {
    if (!hours) return '0h 0m'
    const h = Math.floor(hours)
    const m = Math.floor((hours - h) * 60)
    return `${h}h ${m}m`
  }

  const formatLiveHours = (hours: number) => {
    if (!hours) return '0h 0m 0s'
    const h = Math.floor(hours)
    const m = Math.floor((hours - h) * 60)
    const s = Math.floor(((hours - h) * 60 - m) * 60)
    return `${h}h ${m}m ${s}s`
  }

  const saveAttendanceSettings = async (settings: any) => {
    try {
      if (!userProfile?.organization_id) {
        alert('Unable to save settings: No organization found')
        return
      }

      const { error } = await supabase
        .from('organization_settings')
        .update({
          ...settings,
          updated_at: new Date().toISOString()
        })
        .eq('organization_id', userProfile.organization_id)

      if (error) throw error

      // Update local state
      setOrganizationSettings(prev => ({ ...prev, ...settings }))
      alert('Attendance settings saved successfully!')
    } catch (error) {
      console.error('Error saving attendance settings:', error)
      alert('Error saving settings. Please try again.')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Attendance Management</h1>
          <p className="text-gray-600">Track attendance and configure work hours settings.</p>
        </div>
        {activeTab === 'attendance' && (
          <div className="flex items-center space-x-4">
            <Select value={filterWeek} onValueChange={setFilterWeek}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="current">This Week</SelectItem>
                <SelectItem value="last">Last Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('attendance')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'attendance'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4" />
              <span>Attendance</span>
            </div>
          </button>
          {userProfile?.role === 'admin' && (
            <button
              onClick={() => setActiveTab('settings')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'settings'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Settings className="h-4 w-4" />
                <span>Settings</span>
              </div>
            </button>
          )}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'attendance' && (
        <>
          {/* Live Hours Counter - Show when checked in */}
          {isCheckedIn && (
        <Card className="bg-gradient-to-r from-blue-50 to-green-50 border-blue-200">
          <CardContent className="p-6">
            <div className="text-center">
              <div className="text-sm text-blue-600 font-medium mb-2 flex items-center justify-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                Currently Working
              </div>
              <div className="text-4xl font-bold font-mono text-blue-800 mb-2">
                {formatLiveHours(liveHours)}
              </div>
              <div className="text-sm text-blue-600">
                Since {todayRecord ? formatTime(todayRecord.check_in_time || null) : 'check-in'} • Updates live
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Today's Attendance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="h-5 w-5 mr-2" />
              Today's Attendance
            </CardTitle>
            <p className="text-sm text-gray-600">
              {format(currentTime, 'EEEE, MMMM d, yyyy • HH:mm')}
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Check-in/out Status */}
            <div className="text-center">
              <div className="text-4xl font-bold mb-2">
                {isCheckedIn ? (
                  <span className="text-green-600">Checked In</span>
                ) : todayRecord?.check_out_time ? (
                  <span className="text-blue-600">Checked Out</span>
                ) : (
                  <span className="text-gray-600">Not Checked In</span>
                )}
              </div>
              {todayRecord && (
                <div className="space-y-1 text-sm text-gray-600">
                  <p>Check-in: {formatTime(todayRecord.check_in_time || null)}</p>
                  <p>Check-out: {formatTime(todayRecord.check_out_time || null)}</p>
                  {isCheckedIn ? (
                    <div className="space-y-1">
                      <p className="text-blue-600 font-medium">
                        Live Hours: <span className="font-mono text-lg">{formatLiveHours(liveHours)}</span>
                      </p>
                      <p className="text-xs text-gray-500">Updates every second while checked in</p>
                    </div>
                  ) : (
                    <>
                      <p>Total Hours: {formatHours(todayRecord.work_hours || null)}</p>
                      <p>Overtime: {formatHours(todayRecord.overtime_hours || null)}</p>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col space-y-3">
              {!isCheckedIn && !todayRecord?.check_out_time ? (
                <Button onClick={checkIn} size="lg" className="w-full">
                  <MapPin className="h-5 w-5 mr-2" />
                  Check In
                </Button>
              ) : isCheckedIn ? (
                <div className="space-y-3">
                  {!breakStartTime ? (
                    <Button 
                      onClick={startBreak} 
                      variant="outline" 
                      size="lg" 
                      className="w-full"
                    >
                      <Coffee className="h-5 w-5 mr-2" />
                      Start Break
                    </Button>
                  ) : (
                    <Button 
                      onClick={endBreak} 
                      variant="outline" 
                      size="lg" 
                      className="w-full"
                    >
                      <Timer className="h-5 w-5 mr-2" />
                      End Break
                    </Button>
                  )}
                  <Button 
                    onClick={checkOut} 
                    size="lg" 
                    className="w-full bg-red-600 hover:bg-red-700"
                  >
                    <CheckCircle className="h-5 w-5 mr-2" />
                    Check Out
                  </Button>
                </div>
              ) : (
                <p className="text-center text-gray-500">
                  You have already checked out for today.
                </p>
              )}
            </div>

            {/* Notes */}
            <div>
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any notes about your workday..."
                disabled={!!todayRecord?.check_out_time}
              />
            </div>
          </CardContent>
        </Card>

        {/* Weekly Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="h-5 w-5 mr-2" />
              Weekly Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {weeklyStats.presentDays}
                </div>
                <div className="text-sm text-gray-600">Present Days</div>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">
                  {weeklyStats.lateDays}
                </div>
                <div className="text-sm text-gray-600">Late Days</div>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">
                  {weeklyStats.absentDays}
                </div>
                <div className="text-sm text-gray-600">Absent Days</div>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {weeklyStats.totalHours.toFixed(1)}h
                </div>
                <div className="text-sm text-gray-600">Total Hours</div>
              </div>
            </div>
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Average Daily Hours</span>
                <span className="font-medium">{weeklyStats.avgHours.toFixed(1)}h</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Attendance History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="h-5 w-5 mr-2" />
            Attendance History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Loading attendance records...</p>
            </div>
          ) : attendanceRecords.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No attendance records found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {attendanceRecords.map((record) => (
                <div 
                  key={record.id}
                  className={`flex items-center justify-between p-4 border rounded-lg ${
                    isToday(parseISO(record.date)) ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center space-x-4">
                    {getStatusIcon(record.status)}
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">
                          {format(parseISO(record.date), 'EEEE, MMM d')}
                        </span>
                        {getStatusBadge(record.status)}
                        {isToday(parseISO(record.date)) && (
                          <Badge variant="outline">Today</Badge>
                        )}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        {record.check_in_time && (
                          <span>In: {formatTime(record.check_in_time)}</span>
                        )}
                        {record.check_out_time && (
                          <span> • Out: {formatTime(record.check_out_time)}</span>
                        )}
                        {record.overtime_hours && record.overtime_hours > 0 && (
                          <span> • Overtime: {formatHours(record.overtime_hours)}</span>
                        )}
                      </div>
                      {record.notes && (
                        <p className="text-sm text-gray-500 mt-1 italic">
                          "{record.notes}"
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">
                      {formatHours(record.work_hours || null)}
                    </div>
                    <div className="text-sm text-gray-500">
                      {record.work_hours ? `${((record.work_hours / 8) * 100).toFixed(0)}%` : '0%'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
        </>
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="h-5 w-5" />
                <span>Attendance Settings</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {organizationSettings ? (
                <AttendanceSettingsForm
                  settings={organizationSettings}
                  onSave={saveAttendanceSettings}
                />
              ) : (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-gray-600 mt-2">Loading settings...</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

// Settings Form Component
function AttendanceSettingsForm({ settings, onSave }: { settings: any; onSave: (settings: any) => void }) {
  const [formData, setFormData] = useState({
    work_start_time: settings?.work_start_time || '09:00',
    work_end_time: settings?.work_end_time || '17:00',
    manager_work_start_time: settings?.manager_work_start_time || '08:30',
    manager_work_end_time: settings?.manager_work_end_time || '17:30',
    break_duration_minutes: settings?.break_duration_minutes || 60,
    allow_adhoc_times: settings?.allow_adhoc_times || false,
    require_approval_for_adhoc: settings?.require_approval_for_adhoc || true,
    late_threshold_minutes: settings?.late_threshold_minutes || 15,
    early_leave_threshold_minutes: settings?.early_leave_threshold_minutes || 30,
    auto_checkout_enabled: settings?.auto_checkout_enabled || false,
    auto_checkout_time: settings?.auto_checkout_time || '18:00'
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Member Work Hours */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <Users className="h-5 w-5 mr-2" />
          Member Work Hours
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="work_start_time">Start Time</Label>
            <Input
              id="work_start_time"
              type="time"
              value={formData.work_start_time}
              onChange={(e) => setFormData(prev => ({ ...prev, work_start_time: e.target.value }))}
            />
          </div>
          <div>
            <Label htmlFor="work_end_time">End Time</Label>
            <Input
              id="work_end_time"
              type="time"
              value={formData.work_end_time}
              onChange={(e) => setFormData(prev => ({ ...prev, work_end_time: e.target.value }))}
            />
          </div>
        </div>
      </div>

      {/* Manager Work Hours */}
      <div className="bg-blue-50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <Timer className="h-5 w-5 mr-2" />
          Manager Work Hours
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="manager_work_start_time">Start Time</Label>
            <Input
              id="manager_work_start_time"
              type="time"
              value={formData.manager_work_start_time}
              onChange={(e) => setFormData(prev => ({ ...prev, manager_work_start_time: e.target.value }))}
            />
          </div>
          <div>
            <Label htmlFor="manager_work_end_time">End Time</Label>
            <Input
              id="manager_work_end_time"
              type="time"
              value={formData.manager_work_end_time}
              onChange={(e) => setFormData(prev => ({ ...prev, manager_work_end_time: e.target.value }))}
            />
          </div>
        </div>
      </div>

      {/* Break and Timing Settings */}
      <div className="bg-green-50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <Coffee className="h-5 w-5 mr-2" />
          Break & Timing Settings
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="break_duration_minutes">Break Duration (minutes)</Label>
            <Input
              id="break_duration_minutes"
              type="number"
              min="0"
              max="120"
              value={formData.break_duration_minutes}
              onChange={(e) => setFormData(prev => ({ ...prev, break_duration_minutes: parseInt(e.target.value) }))}
            />
          </div>
          <div>
            <Label htmlFor="late_threshold_minutes">Late Threshold (minutes)</Label>
            <Input
              id="late_threshold_minutes"
              type="number"
              min="0"
              max="60"
              value={formData.late_threshold_minutes}
              onChange={(e) => setFormData(prev => ({ ...prev, late_threshold_minutes: parseInt(e.target.value) }))}
            />
          </div>
          <div>
            <Label htmlFor="early_leave_threshold_minutes">Early Leave Threshold (minutes)</Label>
            <Input
              id="early_leave_threshold_minutes"
              type="number"
              min="0"
              max="120"
              value={formData.early_leave_threshold_minutes}
              onChange={(e) => setFormData(prev => ({ ...prev, early_leave_threshold_minutes: parseInt(e.target.value) }))}
            />
          </div>
        </div>
      </div>

      {/* Adhoc Time Settings */}
      <div className="bg-orange-50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <AlertCircle className="h-5 w-5 mr-2" />
          Adhoc Time Options
        </h3>
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <input
              id="allow_adhoc_times"
              type="checkbox"
              checked={formData.allow_adhoc_times}
              onChange={(e) => setFormData(prev => ({ ...prev, allow_adhoc_times: e.target.checked }))}
              className="rounded"
            />
            <Label htmlFor="allow_adhoc_times">Allow employees to set custom work hours</Label>
          </div>
          {formData.allow_adhoc_times && (
            <div className="flex items-center space-x-2 ml-6">
              <input
                id="require_approval_for_adhoc"
                type="checkbox"
                checked={formData.require_approval_for_adhoc}
                onChange={(e) => setFormData(prev => ({ ...prev, require_approval_for_adhoc: e.target.checked }))}
                className="rounded"
              />
              <Label htmlFor="require_approval_for_adhoc">Require manager approval for adhoc hours</Label>
            </div>
          )}
        </div>
      </div>

      {/* Auto Checkout Settings */}
      <div className="bg-purple-50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <Timer className="h-5 w-5 mr-2" />
          Auto Checkout
        </h3>
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <input
              id="auto_checkout_enabled"
              type="checkbox"
              checked={formData.auto_checkout_enabled}
              onChange={(e) => setFormData(prev => ({ ...prev, auto_checkout_enabled: e.target.checked }))}
              className="rounded"
            />
            <Label htmlFor="auto_checkout_enabled">Enable automatic checkout</Label>
          </div>
          {formData.auto_checkout_enabled && (
            <div className="ml-6">
              <Label htmlFor="auto_checkout_time">Auto Checkout Time</Label>
              <Input
                id="auto_checkout_time"
                type="time"
                value={formData.auto_checkout_time}
                onChange={(e) => setFormData(prev => ({ ...prev, auto_checkout_time: e.target.value }))}
                className="w-32"
              />
            </div>
          )}
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button type="submit" className="flex items-center space-x-2">
          <Save className="h-4 w-4" />
          <span>Save Settings</span>
        </Button>
      </div>
    </form>
  )
}