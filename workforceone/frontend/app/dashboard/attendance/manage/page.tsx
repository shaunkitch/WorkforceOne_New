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
  Users,
  UserCheck,
  UserX,
  Clock,
  Calendar,
  CheckCircle,
  XCircle,
  AlertCircle,
  Search,
  Filter,
  Bell,
  Send,
  Eye,
  Download,
  TrendingUp,
  MapPin,
  Timer,
  Coffee,
  RefreshCw
} from 'lucide-react'
import { format, parseISO, isToday, startOfDay, endOfDay } from 'date-fns'

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
  latitude?: number
  longitude?: number
  location_accuracy?: number
  address?: string
  profiles: {
    id: string
    full_name: string
    email: string
    role: string
    department?: string
    avatar_url?: string
  }
}

interface AttendanceStats {
  totalEmployees: number
  checkedIn: number
  notCheckedIn: number
  late: number
  absent: number
  onBreak: number
  avgCheckInTime: string
  totalHours: number
}

interface Employee {
  id: string
  full_name: string
  email: string
  role: string
  department?: string
  avatar_url?: string
  todayAttendance?: AttendanceRecord
  isCheckedIn: boolean
  checkInTime?: string
  workHours: number
  status: 'checked_in' | 'not_checked_in' | 'late' | 'absent'
}

export default function AttendanceManagePage() {
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [stats, setStats] = useState<AttendanceStats>({
    totalEmployees: 0,
    checkedIn: 0,
    notCheckedIn: 0,
    late: 0,
    absent: 0,
    onBreak: 0,
    avgCheckInTime: '--:--',
    totalHours: 0
  })
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [departmentFilter, setDepartmentFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [showNotificationModal, setShowNotificationModal] = useState(false)
  const [notificationMessage, setNotificationMessage] = useState('')
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([])
  const [liveTime, setLiveTime] = useState(new Date())
  
  const supabase = createClient()

  // Helper function to check if user can manage attendance
  const canManageAttendance = () => {
    return currentUser?.profile?.role === 'admin' || currentUser?.profile?.role === 'manager'
  }

  useEffect(() => {
    fetchCurrentUser()
    
    // Update live time every second
    const timer = setInterval(() => {
      setLiveTime(new Date())
    }, 1000)
    
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    if (currentUser) {
      fetchAttendanceData()
    }
  }, [currentUser, selectedDate, departmentFilter, statusFilter])

  const fetchCurrentUser = async () => {
    try {
      const { data: user } = await supabase.auth.getUser()
      if (user.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.user.id)
          .single()
        
        setCurrentUser({
          ...user.user,
          profile: profile
        })
      }
    } catch (error) {
      console.error('Error fetching current user:', error)
    }
  }

  const fetchAttendanceData = async () => {
    if (!currentUser?.profile?.organization_id) return

    try {
      setLoading(true)

      // Get all employees in the organization
      const { data: orgEmployees, error: employeesError } = await supabase
        .from('profiles')
        .select('*')
        .eq('organization_id', currentUser.profile.organization_id)
        .order('full_name')

      if (employeesError) throw employeesError

      // Get attendance records for selected date
      const { data: attendanceData, error: attendanceError } = await supabase
        .from('attendance')
        .select(`
          *,
          profiles (
            id,
            full_name,
            email,
            role,
            department,
            avatar_url
          )
        `)
        .eq('organization_id', currentUser.profile.organization_id)
        .eq('date', selectedDate)
        .order('check_in_time', { ascending: true, nullsFirst: false })

      if (attendanceError) throw attendanceError

      setAttendanceRecords(attendanceData || [])

      // Process employee data with attendance info
      const processedEmployees: Employee[] = (orgEmployees || []).map(emp => {
        const todayAttendance = attendanceData?.find(record => record.user_id === emp.id)
        
        let status: Employee['status'] = 'not_checked_in'
        let isCheckedIn = false
        
        if (todayAttendance) {
          isCheckedIn = !!todayAttendance.check_in_time && !todayAttendance.check_out_time
          
          if (todayAttendance.status === 'late') {
            status = 'late'
          } else if (todayAttendance.check_in_time) {
            status = 'checked_in'
          } else {
            status = 'absent'
          }
        } else if (isToday(parseISO(selectedDate))) {
          // For today, if no record exists and it's past 10 AM, mark as absent
          const now = new Date()
          if (now.getHours() >= 10) {
            status = 'absent'
          }
        }

        return {
          id: emp.id,
          full_name: emp.full_name,
          email: emp.email,
          role: emp.role,
          department: emp.department,
          avatar_url: emp.avatar_url,
          todayAttendance: todayAttendance,
          isCheckedIn: isCheckedIn,
          checkInTime: todayAttendance?.check_in_time,
          workHours: todayAttendance?.work_hours || 0,
          status: status
        }
      })

      setEmployees(processedEmployees)
      calculateStats(processedEmployees)

    } catch (error) {
      console.error('Error fetching attendance data:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateStats = (employeeData: Employee[]) => {
    const totalEmployees = employeeData.length
    const checkedIn = employeeData.filter(emp => emp.status === 'checked_in' && emp.isCheckedIn).length
    const notCheckedIn = employeeData.filter(emp => emp.status === 'not_checked_in').length
    const late = employeeData.filter(emp => emp.status === 'late').length
    const absent = employeeData.filter(emp => emp.status === 'absent').length
    
    // Calculate average check-in time
    const checkInTimes = employeeData
      .filter(emp => emp.checkInTime)
      .map(emp => new Date(emp.checkInTime!))
    
    let avgCheckInTime = '--:--'
    if (checkInTimes.length > 0) {
      const totalMinutes = checkInTimes.reduce((sum, time) => {
        return sum + (time.getHours() * 60) + time.getMinutes()
      }, 0)
      const avgMinutes = totalMinutes / checkInTimes.length
      const hours = Math.floor(avgMinutes / 60)
      const minutes = Math.floor(avgMinutes % 60)
      avgCheckInTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
    }

    // Calculate total hours worked today
    const totalHours = employeeData.reduce((sum, emp) => sum + (emp.workHours || 0), 0)

    setStats({
      totalEmployees,
      checkedIn,
      notCheckedIn,
      late,
      absent,
      onBreak: 0, // Would need break tracking
      avgCheckInTime,
      totalHours
    })
  }

  const sendNotification = async (employeeIds: string[], message: string) => {
    try {
      if (!currentUser?.profile?.organization_id) {
        throw new Error('Organization not found')
      }

      // Send notification to each selected employee
      const notifications = employeeIds.map(employeeId => ({
        organization_id: currentUser.profile.organization_id,
        recipient_id: employeeId,
        sender_id: currentUser.id,
        title: 'Attendance Reminder',
        message: message,
        type: 'attendance',
        priority: 'normal'
      }))

      const { error } = await supabase
        .from('notifications')
        .insert(notifications)

      if (error) throw error

      alert(`Notification sent successfully to ${employeeIds.length} employee(s)!`)
      setShowNotificationModal(false)
      setNotificationMessage('')
      setSelectedEmployees([])
    } catch (error) {
      console.error('Error sending notification:', error)
      alert('Failed to send notification. Please try again.')
    }
  }

  const sendCheckInReminder = () => {
    const notCheckedInEmployees = employees
      .filter(emp => emp.status === 'not_checked_in' || emp.status === 'absent')
      .map(emp => emp.id)
    
    console.log('Employees:', employees)
    console.log('Not checked in employees:', notCheckedInEmployees)
    console.log('Stats:', stats)
    
    if (notCheckedInEmployees.length === 0) {
      alert('All employees have already checked in!')
      return
    }
    
    setSelectedEmployees(notCheckedInEmployees)
    setNotificationMessage('Please remember to check in for today. Your attendance is important!')
    setShowNotificationModal(true)
  }

  const getStatusIcon = (status: Employee['status']) => {
    switch (status) {
      case 'checked_in':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'late':
        return <AlertCircle className="h-4 w-4 text-yellow-600" />
      case 'absent':
        return <XCircle className="h-4 w-4 text-red-600" />
      default:
        return <Clock className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusBadge = (status: Employee['status']) => {
    const config = {
      checked_in: { label: 'Checked In', class: 'bg-green-100 text-green-800' },
      not_checked_in: { label: 'Not Checked In', class: 'bg-gray-100 text-gray-800' },
      late: { label: 'Late', class: 'bg-yellow-100 text-yellow-800' },
      absent: { label: 'Absent', class: 'bg-red-100 text-red-800' }
    }

    return (
      <Badge className={config[status]?.class || 'bg-gray-100 text-gray-800'}>
        {config[status]?.label || status.replace('_', ' ').toUpperCase()}
      </Badge>
    )
  }

  const formatTime = (dateString: string | null | undefined) => {
    if (!dateString) return '--:--'
    return format(parseISO(dateString), 'HH:mm')
  }

  const formatHours = (hours: number) => {
    if (!hours) return '0h 0m'
    const h = Math.floor(hours)
    const m = Math.floor((hours - h) * 60)
    return `${h}h ${m}m`
  }

  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = emp.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         emp.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesDepartment = departmentFilter === 'all' || emp.department === departmentFilter
    const matchesStatus = statusFilter === 'all' || emp.status === statusFilter
    
    return matchesSearch && matchesDepartment && matchesStatus
  })

  const uniqueDepartments = Array.from(new Set(employees.map(emp => emp.department).filter(Boolean)))

  if (!canManageAttendance()) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
          <p className="text-gray-500">You don't have permission to view attendance management.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 bg-gradient-to-br from-gray-50 to-blue-50 min-h-screen p-6">
      {/* Header */}
      <div className="bg-white/95 backdrop-blur-sm border border-gray-200 px-6 py-6 shadow-lg rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Attendance Management
            </h1>
            <p className="text-gray-600 mt-2 flex items-center">
              <Users className="h-4 w-4 mr-2" />
              Monitor and manage team attendance • {format(liveTime, 'EEEE, MMMM d, yyyy • HH:mm:ss')}
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <Button 
              onClick={sendCheckInReminder}
              className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 shadow-lg"
              disabled={loading || stats.totalEmployees === 0}
            >
              <Bell className="h-4 w-4 mr-2" />
              Send Check-in Reminder ({stats.notCheckedIn + stats.absent})
            </Button>
            <Button 
              onClick={fetchAttendanceData}
              variant="outline"
              className="hover:shadow-md transition-all border-blue-200 hover:bg-blue-50"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* Live Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <Card className="bg-white/90 backdrop-blur-sm shadow-lg border-0 ring-1 ring-gray-200 hover:shadow-xl transition-all">
          <CardContent className="p-6 text-center">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-full p-3 w-16 h-16 mx-auto mb-4 shadow-lg">
              <Users className="h-10 w-10 text-white" />
            </div>
            <div className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
              {stats.totalEmployees}
            </div>
            <div className="text-sm text-gray-600 font-medium">Total Employees</div>
          </CardContent>
        </Card>

        <Card className="bg-white/90 backdrop-blur-sm shadow-lg border-0 ring-1 ring-gray-200 hover:shadow-xl transition-all">
          <CardContent className="p-6 text-center">
            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-full p-3 w-16 h-16 mx-auto mb-4 shadow-lg">
              <UserCheck className="h-10 w-10 text-white" />
            </div>
            <div className="text-3xl font-bold bg-gradient-to-r from-green-600 to-green-700 bg-clip-text text-transparent">
              {stats.checkedIn}
            </div>
            <div className="text-sm text-gray-600 font-medium">Checked In</div>
          </CardContent>
        </Card>

        <Card className="bg-white/90 backdrop-blur-sm shadow-lg border-0 ring-1 ring-gray-200 hover:shadow-xl transition-all">
          <CardContent className="p-6 text-center">
            <div className="bg-gradient-to-br from-gray-500 to-gray-600 rounded-full p-3 w-16 h-16 mx-auto mb-4 shadow-lg">
              <UserX className="h-10 w-10 text-white" />
            </div>
            <div className="text-3xl font-bold bg-gradient-to-r from-gray-600 to-gray-700 bg-clip-text text-transparent">
              {stats.notCheckedIn}
            </div>
            <div className="text-sm text-gray-600 font-medium">Not Checked In</div>
          </CardContent>
        </Card>

        <Card className="bg-white/90 backdrop-blur-sm shadow-lg border-0 ring-1 ring-gray-200 hover:shadow-xl transition-all">
          <CardContent className="p-6 text-center">
            <div className="bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-full p-3 w-16 h-16 mx-auto mb-4 shadow-lg">
              <AlertCircle className="h-10 w-10 text-white" />
            </div>
            <div className="text-3xl font-bold bg-gradient-to-r from-yellow-600 to-yellow-700 bg-clip-text text-transparent">
              {stats.late}
            </div>
            <div className="text-sm text-gray-600 font-medium">Late Today</div>
          </CardContent>
        </Card>

        <Card className="bg-white/90 backdrop-blur-sm shadow-lg border-0 ring-1 ring-gray-200 hover:shadow-xl transition-all">
          <CardContent className="p-6 text-center">
            <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-full p-3 w-16 h-16 mx-auto mb-4 shadow-lg">
              <XCircle className="h-10 w-10 text-white" />
            </div>
            <div className="text-3xl font-bold bg-gradient-to-r from-red-600 to-red-700 bg-clip-text text-transparent">
              {stats.absent}
            </div>
            <div className="text-sm text-gray-600 font-medium">Absent</div>
          </CardContent>
        </Card>

        <Card className="bg-white/90 backdrop-blur-sm shadow-lg border-0 ring-1 ring-gray-200 hover:shadow-xl transition-all">
          <CardContent className="p-6 text-center">
            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-full p-3 w-16 h-16 mx-auto mb-4 shadow-lg">
              <Clock className="h-10 w-10 text-white" />
            </div>
            <div className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-purple-700 bg-clip-text text-transparent">
              {stats.avgCheckInTime}
            </div>
            <div className="text-sm text-gray-600 font-medium">Avg Check-in</div>
          </CardContent>
        </Card>

        <Card className="bg-white/90 backdrop-blur-sm shadow-lg border-0 ring-1 ring-gray-200 hover:shadow-xl transition-all">
          <CardContent className="p-6 text-center">
            <div className="bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-full p-3 w-16 h-16 mx-auto mb-4 shadow-lg">
              <Timer className="h-10 w-10 text-white" />
            </div>
            <div className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-indigo-700 bg-clip-text text-transparent">
              {formatHours(stats.totalHours)}
            </div>
            <div className="text-sm text-gray-600 font-medium">Total Hours</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-white/95 backdrop-blur-sm shadow-lg border-0 ring-1 ring-gray-200">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row space-y-4 lg:space-y-0 lg:space-x-4 items-center">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                placeholder="Search employees by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 h-12 border-gray-200 focus:border-blue-400 focus:ring-blue-400 shadow-sm"
              />
            </div>
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4">
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="h-12 border-gray-200 shadow-sm"
              />
              <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                <SelectTrigger className="w-48 h-12 border-gray-200 shadow-sm">
                  <SelectValue placeholder="Filter by department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {uniqueDepartments.map(dept => (
                    <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-48 h-12 border-gray-200 shadow-sm">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="checked_in">Checked In</SelectItem>
                  <SelectItem value="not_checked_in">Not Checked In</SelectItem>
                  <SelectItem value="late">Late</SelectItem>
                  <SelectItem value="absent">Absent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Employee List */}
      <Card className="bg-white/95 backdrop-blur-sm shadow-lg border-0 ring-1 ring-gray-200">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-gray-800 flex items-center">
            <Users className="h-6 w-6 mr-2 text-blue-600" />
            Employee Attendance ({filteredEmployees?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12">
              <div className="text-gray-500">Loading attendance data...</div>
            </div>
          ) : filteredEmployees.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No employees found</h3>
              <p className="text-gray-500">Try adjusting your search or filter criteria.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredEmployees.map((employee) => (
                <div
                  key={employee.id}
                  className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all duration-200"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      {getStatusIcon(employee.status)}
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="font-semibold text-gray-900">{employee.full_name}</h3>
                          {getStatusBadge(employee.status)}
                          {employee.isCheckedIn && (
                            <div className="flex items-center space-x-1">
                              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                              <span className="text-xs text-green-600 font-medium">Live</span>
                            </div>
                          )}
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
                          <div className="flex items-center space-x-4">
                            <span>{employee.email}</span>
                            <span>•</span>
                            <span className="capitalize">{employee.role}</span>
                            {employee.department && (
                              <>
                                <span>•</span>
                                <span>{employee.department}</span>
                              </>
                            )}
                          </div>
                          {employee.todayAttendance && (
                            <div className="flex items-center space-x-4 text-xs">
                              {employee.checkInTime && (
                                <span>Check-in: {formatTime(employee.checkInTime)}</span>
                              )}
                              {employee.todayAttendance.check_out_time && (
                                <span>Check-out: {formatTime(employee.todayAttendance.check_out_time)}</span>
                              )}
                              {employee.todayAttendance.address && (
                                <span className="flex items-center">
                                  <MapPin className="h-3 w-3 mr-1" />
                                  {employee.todayAttendance.address}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-gray-900">
                        {formatHours(employee.workHours)}
                      </div>
                      <div className="text-sm text-gray-500">
                        {employee.workHours > 0 ? `${((employee.workHours / 8) * 100).toFixed(0)}%` : '0%'}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notification Modal */}
      {showNotificationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Bell className="h-5 w-5 mr-2" />
                Send Notification
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-2">
                  Sending to {selectedEmployees.length} employee(s)
                </p>
                <textarea
                  value={notificationMessage}
                  onChange={(e) => setNotificationMessage(e.target.value)}
                  placeholder="Enter your message..."
                  rows={4}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowNotificationModal(false)
                    setNotificationMessage('')
                    setSelectedEmployees([])
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={() => sendNotification(selectedEmployees, notificationMessage)}
                  disabled={!notificationMessage.trim()}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Send className="h-4 w-4 mr-2" />
                  Send
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}