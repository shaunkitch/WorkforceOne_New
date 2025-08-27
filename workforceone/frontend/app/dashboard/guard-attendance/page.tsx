'use client'

import { useState, useEffect } from 'react'
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { 
  Shield,
  QrCode,
  UserCheck,
  MapPin,
  Calendar,
  Clock,
  Users,
  Plus,
  Download,
  Eye,
  Settings,
  RefreshCw,
  AlertCircle
} from 'lucide-react'
import { format, parseISO, isToday } from 'date-fns'

interface AttendanceRecord {
  id: string
  user_id: string
  date: string
  check_in_time?: string
  check_out_time?: string
  work_hours?: number
  status: 'present' | 'absent' | 'late'
  notes?: string
  latitude?: number
  longitude?: number
  location_accuracy?: number
  qr_code_id?: string
  profiles: {
    id: string
    first_name: string
    last_name: string
    work_type: string
  }
}

interface QRCode {
  id: string
  location_name: string
  description?: string
  shift_type: 'check_in' | 'check_out' | 'both'
  qr_code_image: string
  expires_at?: string
  is_active: boolean
  created_at: string
}

interface QRCodeFormData {
  location_name: string
  description: string
  shift_type: 'check_in' | 'check_out' | 'both'
  expires_at?: string
}

export default function GuardAttendancePage() {
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([])
  const [qrCodes, setQrCodes] = useState<QRCode[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'attendance' | 'qrcodes'>('attendance')
  const [showCreateQRDialog, setShowCreateQRDialog] = useState(false)
  const [selectedQRCode, setSelectedQRCode] = useState<QRCode | null>(null)
  const [qrFormData, setQrFormData] = useState<QRCodeFormData>({
    location_name: '',
    description: '',
    shift_type: 'both'
  })
  
  // Filters
  const [dateFilter, setDateFilter] = useState('today')
  const [statusFilter, setStatusFilter] = useState('all')
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    loadData()
  }, [dateFilter, statusFilter])

  const loadData = async () => {
    setLoading(true)
    await Promise.all([loadAttendanceData(), loadQRCodes()])
    setLoading(false)
  }

  const loadAttendanceData = async () => {
    try {
      setRefreshing(true)
      
      // Calculate date range based on filter
      const now = new Date()
      let startDate: string | null = null
      let endDate: string | null = null
      
      switch (dateFilter) {
        case 'today':
          startDate = format(now, 'yyyy-MM-dd')
          endDate = format(now, 'yyyy-MM-dd')
          break
        case 'week':
          const weekStart = new Date(now)
          weekStart.setDate(now.getDate() - now.getDay())
          startDate = format(weekStart, 'yyyy-MM-dd')
          endDate = format(now, 'yyyy-MM-dd')
          break
        case 'month':
          const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
          startDate = format(monthStart, 'yyyy-MM-dd')
          endDate = format(now, 'yyyy-MM-dd')
          break
      }

      const params = new URLSearchParams({
        limit: '100'
      })
      
      if (startDate) params.append('start_date', startDate)
      if (endDate) params.append('end_date', endDate)

      const response = await fetch(`/api/attendance/records?${params}`, {
        credentials: 'include'
      })
      
      const data = await response.json()
      
      if (data.success) {
        let records = data.records || []
        
        // Apply status filter
        if (statusFilter !== 'all') {
          records = records.filter((record: AttendanceRecord) => record.status === statusFilter)
        }
        
        setAttendanceRecords(records)
      } else {
        console.error('Failed to load attendance data:', data.error)
      }
    } catch (error) {
      console.error('Error loading attendance data:', error)
    } finally {
      setRefreshing(false)
    }
  }

  const loadQRCodes = async () => {
    try {
      const response = await fetch('/api/attendance/qr-code', {
        credentials: 'include'
      })
      
      const data = await response.json()
      
      if (data.success) {
        setQrCodes(data.qrCodes || [])
      } else {
        console.error('Failed to load QR codes:', data.error)
      }
    } catch (error) {
      console.error('Error loading QR codes:', error)
    }
  }

  const createQRCode = async () => {
    try {
      const response = await fetch('/api/attendance/qr-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(qrFormData)
      })
      
      const data = await response.json()
      
      if (data.success) {
        await loadQRCodes()
        setShowCreateQRDialog(false)
        setQrFormData({
          location_name: '',
          description: '',
          shift_type: 'both'
        })
      } else {
        alert('Failed to create QR code: ' + data.error)
      }
    } catch (error) {
      console.error('Error creating QR code:', error)
      alert('Error creating QR code')
    }
  }

  const toggleQRCode = async (qrCode: QRCode) => {
    try {
      const response = await fetch('/api/attendance/qr-code', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          id: qrCode.id,
          is_active: !qrCode.is_active
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        await loadQRCodes()
      } else {
        alert('Failed to update QR code: ' + data.error)
      }
    } catch (error) {
      console.error('Error updating QR code:', error)
    }
  }

  const downloadQRCode = (qrCode: QRCode) => {
    const link = document.createElement('a')
    link.download = `qr-${qrCode.location_name.replace(/\s+/g, '-').toLowerCase()}.png`
    link.href = qrCode.qr_code_image
    link.click()
  }

  const getStatusBadge = (status: string) => {
    const config = {
      present: { variant: 'default' as const, color: 'bg-green-100 text-green-800' },
      late: { variant: 'secondary' as const, color: 'bg-yellow-100 text-yellow-800' },
      absent: { variant: 'destructive' as const, color: 'bg-red-100 text-red-800' }
    }
    
    const statusConfig = config[status as keyof typeof config] || config.present
    
    return (
      <Badge variant={statusConfig.variant}>
        {status.toUpperCase()}
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

  const getShiftTypeIcon = (shiftType: string) => {
    switch (shiftType) {
      case 'check_in':
        return <UserCheck className="h-4 w-4 text-green-600" />
      case 'check_out':
        return <Clock className="h-4 w-4 text-red-600" />
      default:
        return <RefreshCw className="h-4 w-4 text-blue-600" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Shield className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Guard Attendance Management</h1>
            <p className="text-gray-600">Manage security guard attendance and QR codes</p>
          </div>
        </div>
        <Button 
          onClick={() => loadData()} 
          disabled={loading || refreshing}
          className="flex items-center space-x-2"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </Button>
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
              <Calendar className="h-4 w-4" />
              <span>Attendance Records</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('qrcodes')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'qrcodes'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center space-x-2">
              <QrCode className="h-4 w-4" />
              <span>QR Code Management</span>
            </div>
          </button>
        </nav>
      </div>

      {/* Attendance Tab */}
      {activeTab === 'attendance' && (
        <div className="space-y-6">
          {/* Filters */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div>
                <Label htmlFor="date-filter">Date Range</Label>
                <Select value={dateFilter} onValueChange={setDateFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="today">Today</SelectItem>
                    <SelectItem value="week">This Week</SelectItem>
                    <SelectItem value="month">This Month</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="status-filter">Status</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="present">Present</SelectItem>
                    <SelectItem value="late">Late</SelectItem>
                    <SelectItem value="absent">Absent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="text-sm text-gray-600">
              {attendanceRecords.length} record{attendanceRecords.length !== 1 ? 's' : ''} found
            </div>
          </div>

          {/* Attendance Records */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="h-5 w-5 mr-2" />
                Guard Attendance Records
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="text-gray-600 mt-2">Loading attendance records...</p>
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
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <Shield className="h-5 w-5 text-blue-600" />
                          </div>
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-medium">
                              {record.profiles.first_name} {record.profiles.last_name}
                            </span>
                            {getStatusBadge(record.status)}
                            {isToday(parseISO(record.date)) && (
                              <Badge variant="outline">Today</Badge>
                            )}
                          </div>
                          <div className="text-sm text-gray-600 mt-1">
                            <span>{format(parseISO(record.date), 'EEEE, MMM d')}</span>
                            {record.check_in_time && (
                              <span> • In: {formatTime(record.check_in_time)}</span>
                            )}
                            {record.check_out_time && (
                              <span> • Out: {formatTime(record.check_out_time)}</span>
                            )}
                          </div>
                          {record.notes && (
                            <p className="text-sm text-gray-500 mt-1 italic">
                              "{record.notes}"
                            </p>
                          )}
                          {(record.latitude && record.longitude) && (
                            <div className="flex items-center text-xs text-gray-500 mt-1">
                              <MapPin className="h-3 w-3 mr-1" />
                              <span>Location tracked</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">
                          {formatHours(record.work_hours)}
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
        </div>
      )}

      {/* QR Codes Tab */}
      {activeTab === 'qrcodes' && (
        <div className="space-y-6">
          {/* Create QR Code Button */}
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-semibold">QR Code Management</h2>
              <p className="text-sm text-gray-600">Create and manage QR codes for attendance tracking</p>
            </div>
            <Dialog open={showCreateQRDialog} onOpenChange={setShowCreateQRDialog}>
              <DialogTrigger asChild>
                <Button className="flex items-center space-x-2">
                  <Plus className="h-4 w-4" />
                  <span>Create QR Code</span>
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New QR Code</DialogTitle>
                  <DialogDescription>
                    Generate a QR code for a specific location or checkpoint
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="location_name">Location Name</Label>
                    <Input
                      id="location_name"
                      value={qrFormData.location_name}
                      onChange={(e) => setQrFormData(prev => ({ ...prev, location_name: e.target.value }))}
                      placeholder="e.g. Main Entrance, Building A Gate"
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Description (Optional)</Label>
                    <Textarea
                      id="description"
                      value={qrFormData.description}
                      onChange={(e) => setQrFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Additional details about this checkpoint..."
                    />
                  </div>
                  <div>
                    <Label htmlFor="shift_type">Shift Type</Label>
                    <Select value={qrFormData.shift_type} onValueChange={(value: 'check_in' | 'check_out' | 'both') => 
                      setQrFormData(prev => ({ ...prev, shift_type: value }))
                    }>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="check_in">Check In Only</SelectItem>
                        <SelectItem value="check_out">Check Out Only</SelectItem>
                        <SelectItem value="both">Both Check In & Out</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="expires_at">Expiry Date (Optional)</Label>
                    <Input
                      id="expires_at"
                      type="datetime-local"
                      value={qrFormData.expires_at}
                      onChange={(e) => setQrFormData(prev => ({ ...prev, expires_at: e.target.value }))}
                    />
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setShowCreateQRDialog(false)}>
                      Cancel
                    </Button>
                    <Button onClick={createQRCode} disabled={!qrFormData.location_name}>
                      Create QR Code
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* QR Codes Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {qrCodes.map((qrCode) => (
              <Card key={qrCode.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-2">
                      {getShiftTypeIcon(qrCode.shift_type)}
                      <CardTitle className="text-sm">{qrCode.location_name}</CardTitle>
                    </div>
                    <Badge variant={qrCode.is_active ? "default" : "secondary"}>
                      {qrCode.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* QR Code Image */}
                    <div className="flex justify-center">
                      <img 
                        src={qrCode.qr_code_image} 
                        alt={`QR Code for ${qrCode.location_name}`}
                        className="w-32 h-32 border rounded"
                      />
                    </div>
                    
                    {/* Details */}
                    <div className="space-y-2 text-sm">
                      {qrCode.description && (
                        <p className="text-gray-600">{qrCode.description}</p>
                      )}
                      <div className="flex items-center text-gray-500">
                        <span className="capitalize">{qrCode.shift_type.replace('_', ' ')}</span>
                      </div>
                      {qrCode.expires_at && (
                        <div className="flex items-center text-gray-500">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          <span>Expires: {format(parseISO(qrCode.expires_at), 'MMM d, yyyy HH:mm')}</span>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => downloadQRCode(qrCode)}
                        className="flex items-center space-x-1"
                      >
                        <Download className="h-3 w-3" />
                        <span>Download</span>
                      </Button>
                      <Button
                        size="sm"
                        variant={qrCode.is_active ? "destructive" : "default"}
                        onClick={() => toggleQRCode(qrCode)}
                        className="flex items-center space-x-1"
                      >
                        <Settings className="h-3 w-3" />
                        <span>{qrCode.is_active ? 'Deactivate' : 'Activate'}</span>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {qrCodes.length === 0 && (
            <Card>
              <CardContent className="text-center py-8">
                <QrCode className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No QR codes created yet</p>
                <p className="text-sm text-gray-400 mt-1">Create your first QR code to start tracking attendance</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}