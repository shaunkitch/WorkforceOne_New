import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native'
import { StatusBar } from 'expo-status-bar'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '../../contexts/AuthContext'
import { useFeatureFlags } from '../../hooks/useFeatureFlags'
import { supabase } from '../../lib/supabase'

interface MemberStats {
  myTasksCount: number
  todayAttendance: boolean
  weeklyHours: number
  pendingLeaveRequests: number
}

interface QuickAction {
  title: string
  icon: string
  color: string
  screen: string
}

export default function DashboardScreen({ navigation }: any) {
  const { user, profile } = useAuth()
  const { hasFeature, loading: featureFlagsLoading } = useFeatureFlags()
  const [stats, setStats] = useState<MemberStats>({
    myTasksCount: 0,
    todayAttendance: false,
    weeklyHours: 0,
    pendingLeaveRequests: 0,
  })
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const quickActions: QuickAction[] = [
    { title: 'Daily Visits', icon: 'map-outline', color: '#3b82f6', screen: 'DailyCalls' },
  ]

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    if (!user?.id || !profile?.organization_id) return

    try {
      const today = new Date().toISOString().split('T')[0]
      const startOfWeek = new Date()
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay())
      const weekStart = startOfWeek.toISOString().split('T')[0]

      // Build query array based on enabled features
      const queries = []
      
      // Always fetch attendance (core feature)
      queries.push(
        supabase
          .from('attendance')
          .select('id')
          .eq('user_id', user.id)
          .gte('created_at', `${today}T00:00:00.000Z`)
          .lt('created_at', `${today}T23:59:59.999Z`)
          .limit(1)
      )

      // Conditionally fetch tasks if feature is enabled
      if (hasFeature('tasks')) {
        queries.push(
          supabase
            .from('tasks')
            .select('id', { count: 'exact' })
            .eq('assigned_to', user.id)
            .in('status', ['todo', 'in_progress'])
        )
      } else {
        queries.push(Promise.resolve({ data: [], count: 0 }))
      }

      // Conditionally fetch time entries if feature is enabled
      if (hasFeature('time_tracking')) {
        queries.push(
          supabase
            .from('time_entries')
            .select('duration')
            .eq('user_id', user.id)
            .gte('date', weekStart)
        )
      } else {
        queries.push(Promise.resolve({ data: [] }))
      }

      // Conditionally fetch leave requests if feature is enabled
      if (hasFeature('leave')) {
        queries.push(
          supabase
            .from('leave_requests')
            .select('id', { count: 'exact' })
            .eq('user_id', user.id)
            .eq('status', 'pending')
        )
      } else {
        queries.push(Promise.resolve({ data: [], count: 0 }))
      }

      // Run queries in parallel for better performance
      const [attendanceResult, tasksResult, timeEntriesResult, leaveResult] = await Promise.all(queries)

      // Calculate weekly hours
      const weeklyMinutes = timeEntriesResult.data?.reduce((total, entry) => total + (entry.duration || 0), 0) || 0
      const weeklyHours = Math.round((weeklyMinutes / 60) * 10) / 10

      setStats({
        todayAttendance: (attendanceResult.data?.length || 0) > 0,
        myTasksCount: tasksResult.count || 0,
        weeklyHours,
        pendingLeaveRequests: leaveResult.count || 0,
      })
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const onRefresh = () => {
    setRefreshing(true)
    fetchDashboardData()
  }


  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hello, {profile?.full_name?.split(' ')[0] || 'User'}!</Text>
          <Text style={styles.subGreeting}>Welcome back to WorkforceOne</Text>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Today's Focus Card */}
        <View style={styles.focusCard}>
          <View style={styles.focusHeader}>
            <Text style={styles.focusTitle}>Today's Focus</Text>
            <Text style={styles.focusDate}>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</Text>
          </View>
          
          <TouchableOpacity 
            style={[styles.attendanceCard, { 
              backgroundColor: stats.todayAttendance ? '#dcfce7' : '#fef3c7',
              borderColor: stats.todayAttendance ? '#10b981' : '#f59e0b'
            }]}
            onPress={() => navigation.navigate('Attendance')}
          >
            <View style={styles.attendanceContent}>
              <Ionicons 
                name={stats.todayAttendance ? "checkmark-circle" : "time"} 
                size={28} 
                color={stats.todayAttendance ? "#10b981" : "#f59e0b"} 
              />
              <View style={styles.attendanceText}>
                <Text style={styles.attendanceTitle}>
                  {stats.todayAttendance ? "You're clocked in!" : "Ready to start?"}
                </Text>
                <Text style={styles.attendanceSubtitle}>
                  {stats.todayAttendance ? "Tap to view details or clock out" : "Tap to clock in and begin your day"}
                </Text>
              </View>
            </View>
          </TouchableOpacity>

          {/* Weekly Progress */}
          <View style={styles.progressSection}>
            <Text style={styles.progressTitle}>This Week's Progress</Text>
            <View style={styles.progressRow}>
              {hasFeature('time_tracking') && (
                <View style={styles.progressItem}>
                  <Text style={styles.progressValue}>{stats.weeklyHours}h</Text>
                  <Text style={styles.progressLabel}>Hours Logged</Text>
                </View>
              )}
              {hasFeature('tasks') && (
                <View style={styles.progressItem}>
                  <Text style={styles.progressValue}>{stats.myTasksCount}</Text>
                  <Text style={styles.progressLabel}>Tasks Pending</Text>
                </View>
              )}
              {hasFeature('leave') && stats.pendingLeaveRequests > 0 && (
                <View style={styles.progressItem}>
                  <Text style={styles.progressValue}>{stats.pendingLeaveRequests}</Text>
                  <Text style={styles.progressLabel}>Leave Pending</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Daily Visits Quick Action - Only show if maps feature is enabled */}
        {hasFeature('maps') && (
          <TouchableOpacity
            style={styles.visitsCard}
            onPress={() => navigation.navigate('DailyCalls')}
          >
            <View style={styles.visitsContent}>
              <View style={styles.visitsIcon}>
                <Ionicons name="map-outline" size={24} color="#3b82f6" />
              </View>
              <View style={styles.visitsText}>
                <Text style={styles.visitsTitle}>Daily Visits</Text>
                <Text style={styles.visitsSubtitle}>Plan and track your customer visits</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
            </View>
          </TouchableOpacity>
        )}

        {/* Weekly Insights */}
        <View style={styles.insightsCard}>
          <Text style={styles.insightsTitle}>Weekly Insights</Text>
          {hasFeature('tasks') && (
            stats.myTasksCount > 0 ? (
              <View style={styles.insightItem}>
                <Ionicons name="trending-up" size={16} color="#f59e0b" />
                <Text style={styles.insightText}>
                  You have {stats.myTasksCount} task{stats.myTasksCount > 1 ? 's' : ''} to complete this week
                </Text>
              </View>
            ) : (
              <View style={styles.insightItem}>
                <Ionicons name="checkmark-circle" size={16} color="#10b981" />
                <Text style={styles.insightText}>Great job! All tasks completed</Text>
              </View>
            )
          )}
          
          {hasFeature('time_tracking') && stats.weeklyHours > 0 && (
            <View style={styles.insightItem}>
              <Ionicons name="time" size={16} color="#3b82f6" />
              <Text style={styles.insightText}>
                {stats.weeklyHours}h logged this week
              </Text>
            </View>
          )}
          
          {!hasFeature('tasks') && !hasFeature('time_tracking') && (
            <View style={styles.insightItem}>
              <Ionicons name="information-circle" size={16} color="#6b7280" />
              <Text style={styles.insightText}>Focus on your forms and attendance today</Text>
            </View>
          )}
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
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  greeting: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  subGreeting: {
    color: '#93c5fd',
    fontSize: 16,
    marginTop: 4,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  focusCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  focusHeader: {
    marginBottom: 16,
  },
  focusTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  focusDate: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  attendanceCard: {
    borderRadius: 12,
    borderWidth: 2,
    padding: 16,
    marginBottom: 20,
  },
  attendanceContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  attendanceText: {
    flex: 1,
    marginLeft: 12,
  },
  attendanceTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  attendanceSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  progressSection: {
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    paddingTop: 16,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  progressItem: {
    alignItems: 'center',
  },
  progressValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  progressLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
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
  visitsCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  visitsContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  visitsIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  visitsText: {
    flex: 1,
  },
  visitsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  visitsSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  insightsCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  insightsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  insightText: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 8,
    flex: 1,
  },
})