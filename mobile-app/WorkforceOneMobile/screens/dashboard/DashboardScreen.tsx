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

interface DashboardStats {
  totalEmployees: number
  activeProjects: number
  pendingTasks: number
  todayAttendance: number
}

interface QuickAction {
  title: string
  icon: string
  color: string
  screen: string
}

export default function DashboardScreen({ navigation }: any) {
  const { user, profile, signOut } = useAuth()
  const [stats, setStats] = useState<DashboardStats>({
    totalEmployees: 0,
    activeProjects: 0,
    pendingTasks: 0,
    todayAttendance: 0,
  })
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const quickActions: QuickAction[] = [
    { title: 'Clock In', icon: 'time-outline', color: '#10b981', screen: 'Attendance' },
    { title: 'Time Track', icon: 'stopwatch-outline', color: '#3b82f6', screen: 'TimeTracking' },
    { title: 'Tasks', icon: 'checkmark-circle-outline', color: '#f59e0b', screen: 'Tasks' },
    { title: 'Leave', icon: 'calendar-outline', color: '#8b5cf6', screen: 'Leave' },
    { title: 'Teams', icon: 'people-outline', color: '#06b6d4', screen: 'Teams' },
    { title: 'Routes', icon: 'navigate-outline', color: '#10b981', screen: 'Routes' },
    { title: 'Analytics', icon: 'analytics-outline', color: '#f59e0b', screen: 'Analytics' },
    { title: 'Projects', icon: 'folder-outline', color: '#ef4444', screen: 'Projects' },
  ]

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    if (!profile?.organization_id) return

    try {
      // Fetch employees count
      const { data: employees } = await supabase
        .from('profiles')
        .select('id', { count: 'exact' })
        .eq('organization_id', profile.organization_id)
        .eq('is_active', true)

      // Fetch active projects count
      const { data: projects } = await supabase
        .from('projects')
        .select('id', { count: 'exact' })
        .eq('organization_id', profile.organization_id)
        .eq('status', 'active')

      // Fetch pending tasks count
      const { data: tasks } = await supabase
        .from('tasks')
        .select('id', { count: 'exact' })
        .eq('organization_id', profile.organization_id)
        .in('status', ['todo', 'in_progress'])

      // Fetch today's attendance count
      const today = new Date().toISOString().split('T')[0]
      const { data: attendance } = await supabase
        .from('attendance')
        .select('id', { count: 'exact' })
        .eq('organization_id', profile.organization_id)
        .gte('created_at', `${today}T00:00:00.000Z`)
        .lt('created_at', `${today}T23:59:59.999Z`)

      setStats({
        totalEmployees: employees?.length || 0,
        activeProjects: projects?.length || 0,
        pendingTasks: tasks?.length || 0,
        todayAttendance: attendance?.length || 0,
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

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error('Error signing out:', error)
    }
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
        <TouchableOpacity onPress={handleSignOut} style={styles.signOutButton}>
          <Ionicons name="log-out-outline" size={24} color="white" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.statsRow}>
            <View style={[styles.statCard, { backgroundColor: '#dbeafe' }]}>
              <Ionicons name="people-outline" size={32} color="#3b82f6" />
              <Text style={styles.statNumber}>{stats.totalEmployees}</Text>
              <Text style={styles.statLabel}>Employees</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: '#dcfce7' }]}>
              <Ionicons name="folder-outline" size={32} color="#10b981" />
              <Text style={styles.statNumber}>{stats.activeProjects}</Text>
              <Text style={styles.statLabel}>Active Projects</Text>
            </View>
          </View>
          <View style={styles.statsRow}>
            <View style={[styles.statCard, { backgroundColor: '#fef3c7' }]}>
              <Ionicons name="checkmark-circle-outline" size={32} color="#f59e0b" />
              <Text style={styles.statNumber}>{stats.pendingTasks}</Text>
              <Text style={styles.statLabel}>Pending Tasks</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: '#f3e8ff' }]}>
              <Ionicons name="time-outline" size={32} color="#8b5cf6" />
              <Text style={styles.statNumber}>{stats.todayAttendance}</Text>
              <Text style={styles.statLabel}>Today's Attendance</Text>
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

        {/* Recent Activity */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <View style={styles.activityCard}>
            <View style={styles.activityItem}>
              <View style={styles.activityIcon}>
                <Ionicons name="checkmark" size={16} color="white" />
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityTitle}>Task completed</Text>
                <Text style={styles.activityTime}>2 hours ago</Text>
              </View>
            </View>
            <View style={styles.activityItem}>
              <View style={[styles.activityIcon, { backgroundColor: '#3b82f6' }]}>
                <Ionicons name="folder" size={16} color="white" />
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityTitle}>Project updated</Text>
                <Text style={styles.activityTime}>4 hours ago</Text>
              </View>
            </View>
            <View style={styles.activityItem}>
              <View style={[styles.activityIcon, { backgroundColor: '#f59e0b' }]}>
                <Ionicons name="time" size={16} color="white" />
              </View>
              <View style={styles.activityContent}>
                <Text style={styles.activityTitle}>Time tracked</Text>
                <Text style={styles.activityTime}>Yesterday</Text>
              </View>
            </View>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  signOutButton: {
    padding: 8,
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
  activityCard: {
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
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  activityIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#10b981',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  activityTime: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
})