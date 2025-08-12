'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  DollarSign, 
  Download, 
  Calendar,
  Clock,
  Users,
  FileText,
  Filter,
  CheckCircle,
  AlertTriangle,
  Loader2,
  Settings,
  ExternalLink
} from 'lucide-react'

interface PayrollPeriod {
  id: string
  start_date: string
  end_date: string
  status: 'draft' | 'processing' | 'completed' | 'exported'
  total_hours: number
  total_employees: number
  total_amount: number
  created_at: string
}

interface PayrollData {
  employee_id: string
  employee_name: string
  email: string
  regular_hours: number
  overtime_hours: number
  total_hours: number
  hourly_rate: number
  regular_pay: number
  overtime_pay: number
  total_pay: number
  deductions: number
  net_pay: number
  attendance_records: number
  late_checkins: number
}

interface PayrollSettings {
  overtime_threshold: number
  overtime_multiplier: number
  default_hourly_rate: number
  pay_frequency: 'weekly' | 'bi-weekly' | 'monthly'
  export_format: 'csv' | 'json' | 'xlsx'
}

export default function PayrollPage() {
  const [payrollPeriods, setPayrollPeriods] = useState<PayrollPeriod[]>([])
  const [currentPeriodData, setCurrentPeriodData] = useState<PayrollData[]>([])
  const [settings, setSettings] = useState<PayrollSettings>({
    overtime_threshold: 40,
    overtime_multiplier: 1.5,
    default_hourly_rate: 15.00,
    pay_frequency: 'bi-weekly',
    export_format: 'csv'
  })
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [selectedPeriod, setSelectedPeriod] = useState<string>('')
  const [dateRange, setDateRange] = useState({
    start: '',
    end: ''
  })
  const [userProfile, setUserProfile] = useState<any>(null)

  const supabase = createClient()

  useEffect(() => {
    fetchUserProfile()
    fetchPayrollData()
  }, [])

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
    } catch (error) {
      console.error('Error fetching user profile:', error)
    }
  }

  const fetchPayrollData = async () => {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single()

      if (!profile?.organization_id) return

      // Generate sample payroll periods for now
      const samplePeriods: PayrollPeriod[] = [
        {
          id: '1',
          start_date: '2025-08-01',
          end_date: '2025-08-15',
          status: 'completed',
          total_hours: 320,
          total_employees: 8,
          total_amount: 12800,
          created_at: '2025-08-16T00:00:00Z'
        },
        {
          id: '2',
          start_date: '2025-07-16',
          end_date: '2025-07-31',
          status: 'exported',
          total_hours: 336,
          total_employees: 8,
          total_amount: 13440,
          created_at: '2025-08-01T00:00:00Z'
        },
        {
          id: '3',
          start_date: '2025-07-01',
          end_date: '2025-07-15',
          status: 'exported',
          total_hours: 280,
          total_employees: 7,
          total_amount: 11200,
          created_at: '2025-07-16T00:00:00Z'
        }
      ]

      setPayrollPeriods(samplePeriods)

    } catch (error) {
      console.error('Error fetching payroll data:', error)
    } finally {
      setLoading(false)
    }
  }

  const generatePayrollData = async () => {
    try {
      setGenerating(true)
      
      if (!dateRange.start || !dateRange.end) {
        alert('Please select a date range')
        return
      }

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single()

      if (!profile?.organization_id) return

      // Fetch employees
      const { data: employees } = await supabase
        .from('profiles')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .eq('is_active', true)

      if (!employees) return

      // Fetch attendance data for the period
      const { data: attendanceData } = await supabase
        .from('attendance')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .gte('created_at', `${dateRange.start}T00:00:00.000Z`)
        .lte('created_at', `${dateRange.end}T23:59:59.999Z`)
        .order('created_at')

      // Process attendance data to calculate hours worked
      const employeeHours = new Map()

      employees.forEach(employee => {
        employeeHours.set(employee.id, {
          employee_id: employee.id,
          employee_name: employee.full_name,
          email: employee.email,
          regular_hours: 0,
          overtime_hours: 0,
          total_hours: 0,
          hourly_rate: settings.default_hourly_rate,
          attendance_records: 0,
          late_checkins: 0
        })
      })

      // Calculate hours from attendance data
      if (attendanceData) {
        const dailyHours = new Map() // employeeId-date -> { checkIn, checkOut, hours }
        
        attendanceData.forEach(record => {
          const employeeId = record.employee_id
          const date = record.created_at.split('T')[0]
          const key = `${employeeId}-${date}`
          
          if (!dailyHours.has(key)) {
            dailyHours.set(key, { checkIn: null, checkOut: null, hours: 0 })
          }
          
          const dayData = dailyHours.get(key)
          if (record.type === 'check_in') {
            dayData.checkIn = new Date(record.created_at)
            // Check if late (after 9 AM)
            const hour = dayData.checkIn.getHours()
            if (hour >= 9) {
              const empData = employeeHours.get(employeeId)
              if (empData) empData.late_checkins++
            }
          } else if (record.type === 'check_out') {
            dayData.checkOut = new Date(record.created_at)
          }
          
          // Calculate hours if both check-in and check-out exist
          if (dayData.checkIn && dayData.checkOut && dayData.checkOut > dayData.checkIn) {
            dayData.hours = (dayData.checkOut.getTime() - dayData.checkIn.getTime()) / (1000 * 60 * 60)
            
            const empData = employeeHours.get(employeeId)
            if (empData) {
              empData.attendance_records++
              empData.total_hours += dayData.hours
              
              if (dayData.hours > 8) {
                empData.overtime_hours += dayData.hours - 8
                empData.regular_hours += 8
              } else {
                empData.regular_hours += dayData.hours
              }
            }
          }
        })
      }

      // Calculate pay
      const payrollData: PayrollData[] = Array.from(employeeHours.values()).map(emp => {
        const regular_pay = emp.regular_hours * emp.hourly_rate
        const overtime_pay = emp.overtime_hours * emp.hourly_rate * settings.overtime_multiplier
        const total_pay = regular_pay + overtime_pay
        const deductions = total_pay * 0.2 // Mock 20% deductions
        const net_pay = total_pay - deductions

        return {
          ...emp,
          regular_pay: Math.round(regular_pay * 100) / 100,
          overtime_pay: Math.round(overtime_pay * 100) / 100,
          total_pay: Math.round(total_pay * 100) / 100,
          deductions: Math.round(deductions * 100) / 100,
          net_pay: Math.round(net_pay * 100) / 100,
          regular_hours: Math.round(emp.regular_hours * 100) / 100,
          overtime_hours: Math.round(emp.overtime_hours * 100) / 100,
          total_hours: Math.round(emp.total_hours * 100) / 100
        }
      })

      setCurrentPeriodData(payrollData)

    } catch (error) {
      console.error('Error generating payroll:', error)
      alert('Failed to generate payroll data')
    } finally {
      setGenerating(false)
    }
  }

  const exportPayroll = (format: 'csv' | 'json' | 'xlsx') => {
    if (currentPeriodData.length === 0) {
      alert('No payroll data to export. Please generate payroll data first.')
      return
    }

    let content: string
    let filename: string
    let mimeType: string

    switch (format) {
      case 'csv':
        const csvHeaders = 'Employee Name,Email,Regular Hours,Overtime Hours,Total Hours,Hourly Rate,Regular Pay,Overtime Pay,Total Pay,Deductions,Net Pay,Late Check-ins\n'
        const csvRows = currentPeriodData.map(emp => 
          `"${emp.employee_name}","${emp.email}",${emp.regular_hours},${emp.overtime_hours},${emp.total_hours},${emp.hourly_rate},${emp.regular_pay},${emp.overtime_pay},${emp.total_pay},${emp.deductions},${emp.net_pay},${emp.late_checkins}`
        ).join('\n')
        content = csvHeaders + csvRows
        filename = `payroll_${dateRange.start}_to_${dateRange.end}.csv`
        mimeType = 'text/csv'
        break

      case 'json':
        content = JSON.stringify({
          period: {
            start_date: dateRange.start,
            end_date: dateRange.end,
            generated_at: new Date().toISOString()
          },
          employees: currentPeriodData,
          summary: {
            total_employees: currentPeriodData.length,
            total_hours: currentPeriodData.reduce((sum, emp) => sum + emp.total_hours, 0),
            total_pay: currentPeriodData.reduce((sum, emp) => sum + emp.total_pay, 0),
            total_net_pay: currentPeriodData.reduce((sum, emp) => sum + emp.net_pay, 0)
          }
        }, null, 2)
        filename = `payroll_${dateRange.start}_to_${dateRange.end}.json`
        mimeType = 'application/json'
        break

      default:
        return
    }

    // Download the file
    const blob = new Blob([content], { type: mimeType })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  }

  const canAccessPayroll = () => {
    return userProfile?.role === 'admin'
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800'
      case 'exported': return 'bg-blue-100 text-blue-800'
      case 'processing': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4" />
      case 'exported': return <Download className="h-4 w-4" />
      case 'processing': return <Loader2 className="h-4 w-4 animate-spin" />
      default: return <Clock className="h-4 w-4" />
    }
  }

  if (!canAccessPayroll()) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-orange-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Access Restricted</h3>
          <p className="text-gray-600">Only administrators can access payroll data.</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-gray-600">Loading payroll data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
            Payroll Management
          </h1>
          <p className="text-gray-600 mt-1">
            Generate and export payroll data for your organization
          </p>
        </div>
        <Button className="bg-gradient-to-r from-green-600 to-green-700">
          <Settings className="h-4 w-4 mr-2" />
          Payroll Settings
        </Button>
      </div>

      {/* Generate New Payroll */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="h-5 w-5 mr-2 text-blue-600" />
            Generate Payroll
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <Label htmlFor="start-date">Start Date</Label>
              <Input
                id="start-date"
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="end-date">End Date</Label>
              <Input
                id="end-date"
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                className="mt-1"
              />
            </div>
            <div className="flex items-end">
              <Button 
                onClick={generatePayrollData} 
                disabled={generating || !dateRange.start || !dateRange.end}
                className="w-full"
              >
                {generating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <FileText className="h-4 w-4 mr-2" />
                    Generate Payroll
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Export Options */}
          {currentPeriodData.length > 0 && (
            <div className="border-t pt-4">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-medium text-gray-900">Export Options</h4>
                <span className="text-sm text-gray-500">
                  {currentPeriodData.length} employees processed
                </span>
              </div>
              <div className="flex space-x-2">
                <Button variant="outline" onClick={() => exportPayroll('csv')}>
                  <Download className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
                <Button variant="outline" onClick={() => exportPayroll('json')}>
                  <Download className="h-4 w-4 mr-2" />
                  Export JSON
                </Button>
                <Button variant="outline" disabled>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Send to ADP
                </Button>
                <Button variant="outline" disabled>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Send to QuickBooks
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payroll Summary */}
      {currentPeriodData.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Employees
              </CardTitle>
              <Users className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {currentPeriodData.length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Hours
              </CardTitle>
              <Clock className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {Math.round(currentPeriodData.reduce((sum, emp) => sum + emp.total_hours, 0))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Gross Pay
              </CardTitle>
              <DollarSign className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                ${Math.round(currentPeriodData.reduce((sum, emp) => sum + emp.total_pay, 0)).toLocaleString()}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                Net Pay
              </CardTitle>
              <DollarSign className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                ${Math.round(currentPeriodData.reduce((sum, emp) => sum + emp.net_pay, 0)).toLocaleString()}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Employee Payroll Details */}
      {currentPeriodData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Employee Payroll Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left p-3 font-medium">Employee</th>
                    <th className="text-right p-3 font-medium">Regular Hours</th>
                    <th className="text-right p-3 font-medium">OT Hours</th>
                    <th className="text-right p-3 font-medium">Total Hours</th>
                    <th className="text-right p-3 font-medium">Rate</th>
                    <th className="text-right p-3 font-medium">Gross Pay</th>
                    <th className="text-right p-3 font-medium">Net Pay</th>
                    <th className="text-center p-3 font-medium">Late Check-ins</th>
                  </tr>
                </thead>
                <tbody>
                  {currentPeriodData.map((employee, index) => (
                    <tr key={employee.employee_id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="p-3">
                        <div>
                          <div className="font-medium text-gray-900">{employee.employee_name}</div>
                          <div className="text-gray-500 text-xs">{employee.email}</div>
                        </div>
                      </td>
                      <td className="p-3 text-right">{employee.regular_hours}</td>
                      <td className="p-3 text-right">{employee.overtime_hours}</td>
                      <td className="p-3 text-right font-medium">{employee.total_hours}</td>
                      <td className="p-3 text-right">${employee.hourly_rate}</td>
                      <td className="p-3 text-right font-medium">${employee.total_pay}</td>
                      <td className="p-3 text-right font-bold text-green-600">${employee.net_pay}</td>
                      <td className="p-3 text-center">
                        {employee.late_checkins > 0 ? (
                          <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                            {employee.late_checkins}
                          </span>
                        ) : (
                          <span className="text-gray-400">0</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payroll History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Payroll History</span>
            <Button variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {payrollPeriods.map((period) => (
              <div key={period.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                <div className="flex items-center space-x-4">
                  <div className={`p-2 rounded-full ${getStatusColor(period.status)}`}>
                    {getStatusIcon(period.status)}
                  </div>
                  <div>
                    <div className="font-medium">
                      {new Date(period.start_date).toLocaleDateString()} - {new Date(period.end_date).toLocaleDateString()}
                    </div>
                    <div className="text-sm text-gray-500">
                      {period.total_employees} employees • {period.total_hours} hours • ${period.total_amount.toLocaleString()}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(period.status)}`}>
                    {period.status}
                  </span>
                  <Button variant="ghost" size="sm">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}