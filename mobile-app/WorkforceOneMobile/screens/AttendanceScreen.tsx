import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native'
import { StatusBar } from 'expo-status-bar'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { Attendance } from '../types/database'

export default function AttendanceScreen() {
  const { user, profile } = useAuth()
  const [isCheckedIn, setIsCheckedIn] = useState(false)
  const [currentAttendance, setCurrentAttendance] = useState<Attendance | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [todayStats, setTodayStats] = useState({
    checkInTime: null as string | null,
    workHours: 0,
    status: 'Not Checked In'
  })

  useEffect(() => {
    fetchTodayAttendance()
  }, [])

  const fetchTodayAttendance = async () => {
    if (!user || !profile?.organization_id) return

    try {
      const today = new Date().toISOString().split('T')[0]
      
      const { data, error } = await supabase
        .from('attendance')
        .select('*')
        .eq('user_id', user.id)
        .eq('organization_id', profile.organization_id)
        .gte('created_at', `${today}T00:00:00.000Z`)
        .lt('created_at', `${today}T23:59:59.999Z`)
        .order('created_at', { ascending: false })
        .limit(1)

      if (error) throw error

      if (data && data.length > 0) {
        const attendance = data[0]
        setCurrentAttendance(attendance)
        setIsCheckedIn(!attendance.check_out_time)
        
        setTodayStats({
          checkInTime: attendance.check_in_time,
          workHours: attendance.work_hours || 0,
          status: attendance.check_out_time ? 'Checked Out' : 'Checked In'
        })
      }
    } catch (error) {
      console.error('Error fetching attendance:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCheckIn = async () => {
    if (!user || !profile?.organization_id) return

    setActionLoading(true)
    try {
      const now = new Date().toISOString()
      
      const { data, error } = await supabase
        .from('attendance')
        .insert({
          user_id: user.id,
          organization_id: profile.organization_id,
          check_in_time: now,
          location: 'Mobile App',
        })
        .select()
        .single()

      if (error) throw error

      setCurrentAttendance(data)
      setIsCheckedIn(true)
      setTodayStats({
        checkInTime: now,
        workHours: 0,
        status: 'Checked In'
      })

      Alert.alert('Success', 'Checked in successfully!')
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to check in')
    } finally {
      setActionLoading(false)
    }
  }

  const handleCheckOut = async () => {
    if (!currentAttendance) return

    setActionLoading(true)
    try {
      const now = new Date().toISOString()
      const checkInTime = new Date(currentAttendance.check_in_time)
      const checkOutTime = new Date(now)
      const workHours = (checkOutTime.getTime() - checkInTime.getTime()) / (1000 * 60 * 60)

      const { error } = await supabase
        .from('attendance')
        .update({
          check_out_time: now,
          work_hours: Math.round(workHours * 100) / 100,
        })
        .eq('id', currentAttendance.id)

      if (error) throw error

      setIsCheckedIn(false)
      setTodayStats(prev => ({
        ...prev,
        workHours: Math.round(workHours * 100) / 100,
        status: 'Checked Out'
      }))

      Alert.alert('Success', `Checked out successfully! You worked ${Math.round(workHours * 100) / 100} hours today.`)
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to check out')
    } finally {
      setActionLoading(false)
    }
  }

  const formatTime = (timeString: string | null) => {
    if (!timeString) return '--:--'
    return new Date(timeString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const getCurrentTime = () => {
    return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Loading attendance...</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Attendance</Text>
        <Text style={styles.headerSubtitle}>Track your work hours</Text>
      </View>

      <ScrollView style={styles.content}>
        {/* Current Time */}
        <View style={styles.timeCard}>
          <Text style={styles.currentTime}>{getCurrentTime()}</Text>
          <Text style={styles.currentDate}>{new Date().toDateString()}</Text>
        </View>

        {/* Status Card */}
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <Ionicons 
              name={isCheckedIn ? "checkmark-circle" : "time-outline"} 
              size={32} 
              color={isCheckedIn ? "#10b981" : "#6b7280"} 
            />
            <Text style={[styles.statusText, { color: isCheckedIn ? "#10b981" : "#6b7280" }]}>
              {todayStats.status}
            </Text>
          </View>
          
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Check In</Text>
              <Text style={styles.statValue}>{formatTime(todayStats.checkInTime)}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Work Hours</Text>
              <Text style={styles.statValue}>{todayStats.workHours.toFixed(1)}h</Text>
            </View>
          </View>
        </View>

        {/* Action Button */}
        <TouchableOpacity
          style={[
            styles.actionButton,
            { backgroundColor: isCheckedIn ? "#ef4444" : "#10b981" },
            actionLoading && styles.buttonDisabled
          ]}
          onPress={isCheckedIn ? handleCheckOut : handleCheckIn}
          disabled={actionLoading}
        >
          {actionLoading ? (
            <ActivityIndicator color="white" />
          ) : (
            <>
              <Ionicons 
                name={isCheckedIn ? "log-out-outline" : "log-in-outline"} 
                size={24} 
                color="white" 
              />
              <Text style={styles.actionButtonText}>
                {isCheckedIn ? 'Check Out' : 'Check In'}
              </Text>
            </>
          )}
        </TouchableOpacity>

        {/* Today's Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Today's Summary</Text>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Ionicons name="time-outline" size={20} color="#3b82f6" />
              <Text style={styles.summaryLabel}>Hours Worked</Text>
              <Text style={styles.summaryValue}>{todayStats.workHours.toFixed(1)}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Ionicons name="calendar-outline" size={20} color="#10b981" />
              <Text style={styles.summaryLabel}>Status</Text>
              <Text style={styles.summaryValue}>{todayStats.status}</Text>
            </View>
          </View>
        </View>

        {/* Quick Stats */}
        <View style={styles.quickStatsCard}>
          <Text style={styles.cardTitle}>Quick Stats</Text>
          <View style={styles.quickStatsGrid}>
            <View style={styles.quickStatItem}>
              <Text style={styles.quickStatNumber}>8.0</Text>
              <Text style={styles.quickStatLabel}>Weekly Avg</Text>
            </View>
            <View style={styles.quickStatItem}>
              <Text style={styles.quickStatNumber}>22</Text>
              <Text style={styles.quickStatLabel}>Days This Month</Text>
            </View>
            <View style={styles.quickStatItem}>
              <Text style={styles.quickStatNumber}>98%</Text>
              <Text style={styles.quickStatLabel}>Attendance Rate</Text>
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
    padding: 20,
  },
  timeCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  currentTime: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#111827',
  },
  currentDate: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 4,
  },
  statusCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 12,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  summaryCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
    marginBottom: 2,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  quickStatsCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
  quickStatsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  quickStatItem: {
    alignItems: 'center',
  },
  quickStatNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#3b82f6',
  },
  quickStatLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
})