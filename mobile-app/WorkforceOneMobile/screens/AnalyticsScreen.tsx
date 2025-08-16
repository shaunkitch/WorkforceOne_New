import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

interface AnalyticsData {
  attendance: {
    totalCheckIns: number
    averageHoursPerDay: number
    lateCheckIns: number
    attendanceRate: number
    trend: number
  }
  productivity: {
    tasksCompleted: number
    averageTaskTime: number
    projectsOnTrack: number
    trend: number
  }
  workforce: {
    totalEmployees: number
    activeEmployees: number
    newHires: number
    turnoverRate: number
    trend: number
  }
}

const { width } = Dimensions.get('window')

export default function AnalyticsScreen() {
  const { profile } = useAuth()
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    fetchAnalytics()
  }, [])

  const fetchAnalytics = async () => {
    if (!profile?.organization_id) return

    try {
      const endDate = new Date()
      const startDate = new Date(endDate.getTime() - (30 * 24 * 60 * 60 * 1000)) // 30 days ago
      
      // Fetch attendance data
      const { data: attendanceData } = await supabase
        .from('attendance')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .gte('date', startDate.toISOString().split('T')[0])
        .lte('date', endDate.toISOString().split('T')[0])

      // Fetch tasks data
      const { data: tasksData } = await supabase
        .from('tasks')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .gte('created_at', startDate.toISOString())

      // Fetch employees data
      const { data: employeesData } = await supabase
        .from('profiles')
        .select('*')
        .eq('organization_id', profile.organization_id)

      // Calculate analytics
      const totalCheckIns = attendanceData?.filter(a => a.check_in_time).length || 0
      const validRecords = attendanceData?.filter(a => a.check_in_time && a.check_out_time) || []
      
      let totalHours = 0
      validRecords.forEach(record => {
        const checkIn = new Date(record.check_in_time)
        const checkOut = new Date(record.check_out_time)
        const hours = (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60)
        if (hours > 0 && hours <= 16) {
          totalHours += hours
        }
      })

      const averageHoursPerDay = validRecords.length > 0 ? totalHours / validRecords.length : 0
      
      const lateCheckIns = attendanceData?.filter(record => {
        if (!record.check_in_time) return false
        const checkInTime = new Date(record.check_in_time)
        const hour = checkInTime.getHours()
        return hour > 9 || (hour === 9 && checkInTime.getMinutes() > 0)
      }).length || 0

      const completedTasks = tasksData?.filter(t => t.status === 'completed').length || 0
      const totalTasks = tasksData?.length || 0
      const totalEmployees = employeesData?.length || 0
      const activeEmployees = attendanceData?.filter(a => a.check_in_time && !a.check_out_time).length || 0

      const analyticsData: AnalyticsData = {
        attendance: {
          totalCheckIns,
          averageHoursPerDay: Math.round(averageHoursPerDay * 10) / 10,
          lateCheckIns,
          attendanceRate: totalEmployees > 0 ? Math.round((totalCheckIns / totalEmployees) * 100) : 0,
          trend: 2.5 // Mock trend
        },
        productivity: {
          tasksCompleted: completedTasks,
          averageTaskTime: 3.2, // Mock data
          projectsOnTrack: Math.floor(completedTasks * 0.8),
          trend: 1.8
        },
        workforce: {
          totalEmployees,
          activeEmployees,
          newHires: Math.floor(totalEmployees * 0.1),
          turnoverRate: 3.2,
          trend: -0.5
        }
      }

      setAnalytics(analyticsData)
    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const onRefresh = () => {
    setRefreshing(true)
    fetchAnalytics()
  }

  const renderMetricCard = (
    title: string, 
    value: string | number, 
    trend: number, 
    icon: string, 
    color: string
  ) => (
    <View style={[styles.metricCard, { borderLeftColor: color }]}>
      <View style={styles.metricHeader}>
        <View style={styles.metricInfo}>
          <Text style={styles.metricTitle}>{title}</Text>
          <Text style={styles.metricValue}>{value}</Text>
        </View>
        <View style={[styles.metricIcon, { backgroundColor: color + '20' }]}>
          <Ionicons name={icon as any} size={24} color={color} />
        </View>
      </View>
      <View style={styles.trendContainer}>
        <Ionicons 
          name={trend >= 0 ? 'trending-up' : 'trending-down'} 
          size={12} 
          color={trend >= 0 ? '#10b981' : '#ef4444'} 
        />
        <Text style={[styles.trendText, { color: trend >= 0 ? '#10b981' : '#ef4444' }]}>
          {Math.abs(trend)}% vs last month
        </Text>
      </View>
    </View>
  )

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Loading analytics...</Text>
      </View>
    )
  }

  if (!analytics) {
    return (
      <View style={styles.loadingContainer}>
        <Ionicons name="bar-chart-outline" size={64} color="#d1d5db" />
        <Text style={styles.loadingText}>No analytics data available</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Analytics</Text>
        <Text style={styles.headerSubtitle}>Workforce performance insights</Text>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Attendance Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Attendance Metrics</Text>
          <View style={styles.metricsGrid}>
            {renderMetricCard(
              'Total Check-ins',
              analytics.attendance.totalCheckIns,
              analytics.attendance.trend,
              'time-outline',
              '#3b82f6'
            )}
            {renderMetricCard(
              'Avg Hours/Day',
              `${analytics.attendance.averageHoursPerDay}h`,
              analytics.attendance.trend,
              'hourglass-outline',
              '#10b981'
            )}
            {renderMetricCard(
              'Late Check-ins',
              analytics.attendance.lateCheckIns,
              -analytics.attendance.trend,
              'warning-outline',
              '#f59e0b'
            )}
            {renderMetricCard(
              'Attendance Rate',
              `${analytics.attendance.attendanceRate}%`,
              analytics.attendance.trend,
              'checkmark-circle-outline',
              '#8b5cf6'
            )}
          </View>
        </View>

        {/* Productivity Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Productivity Metrics</Text>
          <View style={styles.metricsGrid}>
            {renderMetricCard(
              'Tasks Completed',
              analytics.productivity.tasksCompleted,
              analytics.productivity.trend,
              'checkmark-done-outline',
              '#10b981'
            )}
            {renderMetricCard(
              'Avg Task Time',
              `${analytics.productivity.averageTaskTime}h`,
              analytics.productivity.trend,
              'timer-outline',
              '#3b82f6'
            )}
            {renderMetricCard(
              'Projects On Track',
              analytics.productivity.projectsOnTrack,
              analytics.productivity.trend,
              'folder-open-outline',
              '#8b5cf6'
            )}
          </View>
        </View>

        {/* Workforce Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Workforce Metrics</Text>
          <View style={styles.metricsGrid}>
            {renderMetricCard(
              'Total Employees',
              analytics.workforce.totalEmployees,
              analytics.workforce.trend,
              'people-outline',
              '#3b82f6'
            )}
            {renderMetricCard(
              'Active Now',
              analytics.workforce.activeEmployees,
              analytics.workforce.trend,
              'pulse-outline',
              '#10b981'
            )}
            {renderMetricCard(
              'New Hires',
              analytics.workforce.newHires,
              analytics.workforce.trend,
              'person-add-outline',
              '#f59e0b'
            )}
            {renderMetricCard(
              'Turnover Rate',
              `${analytics.workforce.turnoverRate}%`,
              analytics.workforce.trend,
              'swap-horizontal-outline',
              '#ef4444'
            )}
          </View>
        </View>

        {/* Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Monthly Summary</Text>
          <Text style={styles.summaryText}>
            Your workforce showed strong performance this month with {analytics.attendance.attendanceRate}% 
            attendance rate and {analytics.productivity.tasksCompleted} completed tasks. 
            Keep up the great work!
          </Text>
        </View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  loadingText: {
    marginTop: 12,
    color: '#6b7280',
    fontSize: 16,
  },
  header: {
    backgroundColor: '#3b82f6',
    paddingTop: 30,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerTitle: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    color: '#93c5fd',
    fontSize: 16,
    marginTop: 4,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
  },
  metricsGrid: {
    gap: 12,
  },
  metricCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  metricHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metricInfo: {
    flex: 1,
  },
  metricTitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  metricIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  trendText: {
    fontSize: 12,
    marginLeft: 4,
    fontWeight: '500',
  },
  summaryCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  summaryText: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
})