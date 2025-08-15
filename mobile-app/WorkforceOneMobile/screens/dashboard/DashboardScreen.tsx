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
  const [stats, setStats] = useState<MemberStats>({
    myTasksCount: 0,
    todayAttendance: false,
    weeklyHours: 0,
    pendingLeaveRequests: 0,
  })
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const quickActions: QuickAction[] = [
    { title: 'Clock In/Out', icon: 'time-outline', color: '#10b981', screen: 'Attendance' },
    { title: 'My Tasks', icon: 'checkmark-circle-outline', color: '#f59e0b', screen: 'Tasks' },
    { title: 'Daily Calls', icon: 'map-outline', color: '#3b82f6', screen: 'DailyCalls' },
    { title: 'Request Leave', icon: 'calendar-outline', color: '#8b5cf6', screen: 'Leave' },
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

      // Run queries in parallel for better performance
      const [tasksResult, attendanceResult, timeEntriesResult, leaveResult] = await Promise.all([
        // Fetch my pending tasks count
        supabase
          .from('tasks')
          .select('id', { count: 'exact' })
          .eq('assigned_to', user.id)
          .in('status', ['todo', 'in_progress']),

        // Check if I've clocked in today
        supabase
          .from('attendance')
          .select('id')
          .eq('user_id', user.id)
          .gte('created_at', `${today}T00:00:00.000Z`)
          .lt('created_at', `${today}T23:59:59.999Z`)
          .limit(1),

        // Get my weekly hours
        supabase
          .from('time_entries')
          .select('duration')
          .eq('user_id', user.id)
          .gte('date', weekStart),

        // Get my pending leave requests
        supabase
          .from('leave_requests')
          .select('id', { count: 'exact' })
          .eq('user_id', user.id)
          .eq('status', 'pending')
      ])

      // Calculate weekly hours
      const weeklyMinutes = timeEntriesResult.data?.reduce((total, entry) => total + (entry.duration || 0), 0) || 0
      const weeklyHours = Math.round((weeklyMinutes / 60) * 10) / 10

      setStats({
        myTasksCount: tasksResult.count || 0,
        todayAttendance: (attendanceResult.data?.length || 0) > 0,
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
        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statsRow}>
            <View style={[styles.statCard, { backgroundColor: '#fef3c7' }]}>
              <Ionicons name="checkmark-circle-outline" size={32} color="#f59e0b" />
              <Text style={styles.statNumber}>{stats.myTasksCount}</Text>
              <Text style={styles.statLabel}>My Tasks</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: stats.todayAttendance ? '#dcfce7' : '#fee2e2' }]}>
              <Ionicons 
                name={stats.todayAttendance ? "checkmark-circle-outline" : "time-outline"} 
                size={32} 
                color={stats.todayAttendance ? "#10b981" : "#ef4444"} 
              />
              <Text style={styles.statNumber}>{stats.todayAttendance ? "✓" : "✗"}</Text>
              <Text style={styles.statLabel}>Clocked In Today</Text>
            </View>
          </View>
          <View style={styles.statsRow}>
            <View style={[styles.statCard, { backgroundColor: '#dbeafe' }]}>
              <Ionicons name="stopwatch-outline" size={32} color="#3b82f6" />
              <Text style={styles.statNumber}>{stats.weeklyHours}h</Text>
              <Text style={styles.statLabel}>This Week</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: '#f3e8ff' }]}>
              <Ionicons name="calendar-outline" size={32} color="#8b5cf6" />
              <Text style={styles.statNumber}>{stats.pendingLeaveRequests}</Text>
              <Text style={styles.statLabel}>Pending Leave</Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActionsGrid}>
            {quickActions.map((action, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.quickActionCard, { borderLeftColor: action.color }]}
                onPress={() => navigation.navigate(action.screen)}
              >
                <Ionicons name={action.icon as any} size={24} color={action.color} />
                <Text style={styles.quickActionText}>{action.title}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Today's Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Today's Summary</Text>
          <View style={styles.summaryCard}>
            <View style={styles.summaryItem}>
              <View style={[styles.summaryIcon, { backgroundColor: stats.todayAttendance ? '#10b981' : '#ef4444' }]}>
                <Ionicons name={stats.todayAttendance ? "checkmark" : "close"} size={16} color="white" />
              </View>
              <View style={styles.summaryContent}>
                <Text style={styles.summaryTitle}>
                  {stats.todayAttendance ? "Attendance marked" : "Not clocked in yet"}
                </Text>
                <Text style={styles.summaryDescription}>
                  {stats.todayAttendance ? "You're all set for today" : "Remember to clock in when you arrive"}
                </Text>
              </View>
            </View>
            
            <View style={styles.summaryItem}>
              <View style={[styles.summaryIcon, { backgroundColor: stats.myTasksCount > 0 ? '#f59e0b' : '#10b981' }]}>
                <Ionicons name="list" size={16} color="white" />
              </View>
              <View style={styles.summaryContent}>
                <Text style={styles.summaryTitle}>
                  {stats.myTasksCount === 0 ? "No pending tasks" : `${stats.myTasksCount} tasks pending`}
                </Text>
                <Text style={styles.summaryDescription}>
                  {stats.myTasksCount === 0 ? "Great job! All caught up" : "Check your task list to get started"}
                </Text>
              </View>
            </View>

            {stats.pendingLeaveRequests > 0 && (
              <View style={styles.summaryItem}>
                <View style={[styles.summaryIcon, { backgroundColor: '#8b5cf6' }]}>
                  <Ionicons name="calendar" size={16} color="white" />
                </View>
                <View style={styles.summaryContent}>
                  <Text style={styles.summaryTitle}>
                    {stats.pendingLeaveRequests} leave request{stats.pendingLeaveRequests > 1 ? 's' : ''} pending
                  </Text>
                  <Text style={styles.summaryDescription}>
                    Waiting for approval from your manager
                  </Text>
                </View>
              </View>
            )}
          </View>
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
  statsContainer: {
    marginBottom: 24,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 14,
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
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickActionCard: {
    width: '48%',
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 12,
    borderLeftWidth: 4,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  quickActionText: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  summaryCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  summaryItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  summaryIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#10b981',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  summaryContent: {
    flex: 1,
  },
  summaryTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  summaryDescription: {
    fontSize: 13,
    color: '#6b7280',
    lineHeight: 18,
  },
})