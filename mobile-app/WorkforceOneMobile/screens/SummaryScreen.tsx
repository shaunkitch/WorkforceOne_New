import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  TouchableOpacity,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

const { width } = Dimensions.get('window')

interface SummaryStats {
  totalVisits: number
  totalHours: number
  totalDistance: number
  completedTasks: number
  pendingTasks: number
  leaveBalance: number
  averageVisitsPerDay: number
  completionRate: number
  thisWeekVisits: number
  thisMonthVisits: number
  performanceScore: number
}

interface TimeRange {
  label: string
  value: 'week' | 'month' | 'quarter' | 'year'
}

export default function SummaryScreen() {
  const { user, profile } = useAuth()
  const [stats, setStats] = useState<SummaryStats>({
    totalVisits: 0,
    totalHours: 0,
    totalDistance: 0,
    completedTasks: 0,
    pendingTasks: 0,
    leaveBalance: 0,
    averageVisitsPerDay: 0,
    completionRate: 0,
    thisWeekVisits: 0,
    thisMonthVisits: 0,
    performanceScore: 0
  })
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedRange, setSelectedRange] = useState<'week' | 'month' | 'quarter' | 'year'>('month')

  const timeRanges: TimeRange[] = [
    { label: 'This Week', value: 'week' },
    { label: 'This Month', value: 'month' },
    { label: 'This Quarter', value: 'quarter' },
    { label: 'This Year', value: 'year' }
  ]

  useEffect(() => {
    fetchSummaryStats()
  }, [selectedRange])

  const fetchSummaryStats = async () => {
    if (!user?.id || !profile?.organization_id) return

    try {
      const now = new Date()
      const ranges = getDateRanges(now)
      
      // Run all queries in parallel for better performance
      const [
        visitsResult,
        attendanceResult,
        tasksResult,
        leaveResult,
        weekVisitsResult,
        monthVisitsResult,
        distanceResult,
        leaveBalanceResult
      ] = await Promise.all([
        // Total completed outlet visits
        supabase
          .from('outlet_visits')
          .select('id, check_in_time, check_out_time, form_completed')
          .eq('user_id', user.id)
          .eq('organization_id', profile.organization_id)
          .gte('check_in_time', ranges[selectedRange].start)
          .lte('check_in_time', ranges[selectedRange].end)
          .or('form_completed.eq.true,check_out_time.not.is.null'),

        // Total hours worked
        supabase
          .from('attendance')
          .select('work_hours')
          .eq('user_id', user.id)
          .eq('organization_id', profile.organization_id)
          .gte('date', ranges[selectedRange].start.split('T')[0])
          .lte('date', ranges[selectedRange].end.split('T')[0]),

        // Tasks statistics
        supabase
          .from('tasks')
          .select('status')
          .eq('assigned_to', user.id)
          .eq('organization_id', profile.organization_id),

        // Leave balance
        supabase
          .from('leave_requests')
          .select('status, start_date, end_date')
          .eq('employee_id', user.id)
          .eq('status', 'approved')
          .gte('start_date', new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0]),

        // This week completed visits
        supabase
          .from('outlet_visits')
          .select('id, form_completed, check_out_time')
          .eq('user_id', user.id)
          .eq('organization_id', profile.organization_id)
          .gte('check_in_time', ranges.week.start)
          .lte('check_in_time', ranges.week.end)
          .or('form_completed.eq.true,check_out_time.not.is.null'),

        // This month completed visits
        supabase
          .from('outlet_visits')
          .select('id, form_completed, check_out_time')
          .eq('user_id', user.id)
          .eq('organization_id', profile.organization_id)
          .gte('check_in_time', ranges.month.start)
          .lte('check_in_time', ranges.month.end)
          .or('form_completed.eq.true,check_out_time.not.is.null'),

        // Distance traveled from route stops
        supabase
          .from('route_stops')
          .select(`
            routes!inner (
              total_distance,
              route_assignments!inner (
                assignee_id
              )
            )
          `)
          .eq('routes.route_assignments.assignee_id', user.id)
          .eq('status', 'completed')
          .gte('actual_departure_time', ranges[selectedRange].start)
          .lte('actual_departure_time', ranges[selectedRange].end),

        // Leave balance calculation
        supabase
          .from('leave_requests')
          .select('start_date, end_date')
          .eq('employee_id', user.id)
          .eq('status', 'approved')
          .gte('start_date', new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0])
      ])

      // Calculate statistics
      const totalVisits = visitsResult.data?.length || 0
      const totalHours = attendanceResult.data?.reduce((sum, record) => sum + (record.work_hours || 0), 0) || 0
      const completedTasks = tasksResult.data?.filter(t => t.status === 'completed').length || 0
      const pendingTasks = tasksResult.data?.filter(t => ['todo', 'in_progress'].includes(t.status)).length || 0
      const thisWeekVisits = weekVisitsResult.data?.length || 0
      const thisMonthVisits = monthVisitsResult.data?.length || 0

      // Calculate total distance from route data
      const totalDistance = distanceResult.data?.reduce((sum, routeStop) => {
        return sum + (routeStop.routes?.total_distance || 0)
      }, 0) || (totalVisits * 10) // Fallback to estimate if no route data

      // Calculate leave balance (annual leave days - used days)
      const usedLeaveDays = leaveBalanceResult.data?.reduce((sum, leave) => {
        const startDate = new Date(leave.start_date)
        const endDate = new Date(leave.end_date)
        const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
        return sum + daysDiff
      }, 0) || 0
      const annualLeaveEntitlement = 20 // Standard 20 days per year
      const leaveBalance = Math.max(0, annualLeaveEntitlement - usedLeaveDays)

      // Calculate derived metrics
      const totalTasks = completedTasks + pendingTasks
      const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0

      // Calculate performance score (weighted average)
      const performanceScore = Math.round(
        (completionRate * 0.4) + 
        (Math.min(thisWeekVisits * 10, 100) * 0.3) + 
        (Math.min(totalHours / 8, 1) * 100 * 0.3)
      )

      // Calculate average visits per day
      const daysInRange = Math.ceil(
        (new Date(ranges[selectedRange].end).getTime() - new Date(ranges[selectedRange].start).getTime()) 
        / (1000 * 60 * 60 * 24)
      )
      const averageVisitsPerDay = daysInRange > 0 ? totalVisits / daysInRange : 0

      setStats({
        totalVisits,
        totalHours: Math.round(totalHours * 10) / 10,
        totalDistance,
        completedTasks,
        pendingTasks,
        leaveBalance,
        averageVisitsPerDay: Math.round(averageVisitsPerDay * 10) / 10,
        completionRate: Math.round(completionRate),
        thisWeekVisits,
        thisMonthVisits,
        performanceScore
      })

    } catch (error) {
      console.error('Error fetching summary stats:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const getDateRanges = (now: Date) => {
    const startOfWeek = new Date(now)
    startOfWeek.setDate(now.getDate() - now.getDay())
    startOfWeek.setHours(0, 0, 0, 0)

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    
    const startOfQuarter = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1)
    
    const startOfYear = new Date(now.getFullYear(), 0, 1)

    return {
      week: {
        start: startOfWeek.toISOString(),
        end: now.toISOString()
      },
      month: {
        start: startOfMonth.toISOString(),
        end: now.toISOString()
      },
      quarter: {
        start: startOfQuarter.toISOString(),
        end: now.toISOString()
      },
      year: {
        start: startOfYear.toISOString(),
        end: now.toISOString()
      }
    }
  }

  const onRefresh = () => {
    setRefreshing(true)
    fetchSummaryStats()
  }

  const getPerformanceColor = (score: number) => {
    if (score >= 90) return '#10b981' // Green
    if (score >= 70) return '#f59e0b' // Orange
    return '#ef4444' // Red
  }

  const getPerformanceLabel = (score: number) => {
    if (score >= 90) return 'Excellent'
    if (score >= 70) return 'Good'
    if (score >= 50) return 'Average'
    return 'Needs Improvement'
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Loading summary...</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Time Range Selector */}
        <View style={styles.rangeSelector}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {timeRanges.map((range) => (
              <TouchableOpacity
                key={range.value}
                style={[
                  styles.rangeTab,
                  selectedRange === range.value && styles.rangeTabActive
                ]}
                onPress={() => setSelectedRange(range.value)}
              >
                <Text style={[
                  styles.rangeTabText,
                  selectedRange === range.value && styles.rangeTabTextActive
                ]}>
                  {range.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Performance Score */}
        <View style={styles.performanceCard}>
          <View style={styles.performanceHeader}>
            <Ionicons name="trophy" size={24} color={getPerformanceColor(stats.performanceScore)} />
            <Text style={styles.performanceTitle}>Performance Score</Text>
          </View>
          <View style={styles.performanceContent}>
            <Text style={[styles.performanceScore, { color: getPerformanceColor(stats.performanceScore) }]}>
              {stats.performanceScore}
            </Text>
            <Text style={styles.performanceLabel}>
              {getPerformanceLabel(stats.performanceScore)}
            </Text>
          </View>
        </View>

        {/* Key Metrics Grid */}
        <View style={styles.metricsGrid}>
          <View style={[styles.metricCard, { backgroundColor: '#dbeafe' }]}>
            <Ionicons name="location" size={24} color="#3b82f6" />
            <Text style={styles.metricNumber}>{stats.totalVisits}</Text>
            <Text style={styles.metricLabel}>Total Visits</Text>
          </View>
          
          <View style={[styles.metricCard, { backgroundColor: '#dcfce7' }]}>
            <Ionicons name="time" size={24} color="#16a34a" />
            <Text style={styles.metricNumber}>{stats.totalHours}h</Text>
            <Text style={styles.metricLabel}>Hours Worked</Text>
          </View>
          
          <View style={[styles.metricCard, { backgroundColor: '#fef3c7' }]}>
            <Ionicons name="car" size={24} color="#d97706" />
            <Text style={styles.metricNumber}>{stats.totalDistance}km</Text>
            <Text style={styles.metricLabel}>Distance Traveled</Text>
          </View>
          
          <View style={[styles.metricCard, { backgroundColor: '#f3e8ff' }]}>
            <Ionicons name="checkmark-circle" size={24} color="#9333ea" />
            <Text style={styles.metricNumber}>{stats.completionRate}%</Text>
            <Text style={styles.metricLabel}>Completion Rate</Text>
          </View>
        </View>

        {/* Detailed Statistics */}
        <View style={styles.detailsSection}>
          <Text style={styles.sectionTitle}>Detailed Statistics</Text>
          
          <View style={styles.detailCard}>
            <View style={styles.detailRow}>
              <View style={styles.detailInfo}>
                <Ionicons name="checkmark-circle-outline" size={20} color="#10b981" />
                <Text style={styles.detailLabel}>Completed Tasks</Text>
              </View>
              <Text style={styles.detailValue}>{stats.completedTasks}</Text>
            </View>
            
            <View style={styles.detailRow}>
              <View style={styles.detailInfo}>
                <Ionicons name="ellipse-outline" size={20} color="#f59e0b" />
                <Text style={styles.detailLabel}>Pending Tasks</Text>
              </View>
              <Text style={styles.detailValue}>{stats.pendingTasks}</Text>
            </View>
            
            <View style={styles.detailRow}>
              <View style={styles.detailInfo}>
                <Ionicons name="trending-up" size={20} color="#3b82f6" />
                <Text style={styles.detailLabel}>Avg. Visits/Day</Text>
              </View>
              <Text style={styles.detailValue}>{stats.averageVisitsPerDay}</Text>
            </View>
            
            <View style={styles.detailRow}>
              <View style={styles.detailInfo}>
                <Ionicons name="calendar" size={20} color="#8b5cf6" />
                <Text style={styles.detailLabel}>Leave Balance</Text>
              </View>
              <Text style={styles.detailValue}>{stats.leaveBalance} days</Text>
            </View>
          </View>
        </View>

        {/* Quick Stats */}
        <View style={styles.quickStatsSection}>
          <Text style={styles.sectionTitle}>Quick Stats</Text>
          
          <View style={styles.quickStatsGrid}>
            <View style={styles.quickStatItem}>
              <Text style={styles.quickStatNumber}>{stats.thisWeekVisits}</Text>
              <Text style={styles.quickStatLabel}>This Week</Text>
            </View>
            <View style={styles.quickStatItem}>
              <Text style={styles.quickStatNumber}>{stats.thisMonthVisits}</Text>
              <Text style={styles.quickStatLabel}>This Month</Text>
            </View>
            <View style={styles.quickStatItem}>
              <Text style={styles.quickStatNumber}>{Math.round(stats.totalHours / 8)}</Text>
              <Text style={styles.quickStatLabel}>Work Days</Text>
            </View>
          </View>
        </View>

        {/* Bottom spacing */}
        <View style={styles.bottomSpacing} />
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
  content: {
    flex: 1,
    padding: 16,
  },
  rangeSelector: {
    marginBottom: 20,
  },
  rangeTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  rangeTabActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  rangeTabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  rangeTabTextActive: {
    color: 'white',
  },
  performanceCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  performanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  performanceTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginLeft: 8,
  },
  performanceContent: {
    alignItems: 'center',
  },
  performanceScore: {
    fontSize: 48,
    fontWeight: 'bold',
  },
  performanceLabel: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 4,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  metricCard: {
    width: (width - 48) / 2,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  metricNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 8,
  },
  metricLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
    textAlign: 'center',
  },
  detailsSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
  },
  detailCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  detailInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 16,
    color: '#374151',
    marginLeft: 8,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
  },
  quickStatsSection: {
    marginBottom: 20,
  },
  quickStatsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  quickStatItem: {
    alignItems: 'center',
  },
  quickStatNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#3b82f6',
  },
  quickStatLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  bottomSpacing: {
    height: 20,
  },
})