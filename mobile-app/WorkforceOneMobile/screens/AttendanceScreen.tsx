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
  const [isOnBreak, setIsOnBreak] = useState(false)
  const [currentAttendance, setCurrentAttendance] = useState<Attendance | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [breakLoading, setBreakLoading] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [workStartTime, setWorkStartTime] = useState<Date | null>(null)
  const [breakStartTime, setBreakStartTime] = useState<Date | null>(null)
  const [totalBreakTime, setTotalBreakTime] = useState(0) // in minutes
  const [todayStats, setTodayStats] = useState({
    checkInTime: null as string | null,
    workHours: 0,
    status: 'Not Checked In'
  })

  useEffect(() => {
    fetchTodayAttendance()
  }, [])

  // Live timer update
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  // Set work start time when checked in
  useEffect(() => {
    if (isCheckedIn && todayStats.checkInTime && !workStartTime) {
      setWorkStartTime(new Date(todayStats.checkInTime))
    }
  }, [isCheckedIn, todayStats.checkInTime, workStartTime])

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
      const totalMinutes = (checkOutTime.getTime() - checkInTime.getTime()) / (1000 * 60)
      const workHours = (totalMinutes - totalBreakTime) / 60

      const { error } = await supabase
        .from('attendance')
        .update({
          check_out_time: now,
          work_hours: Math.round(workHours * 100) / 100,
        })
        .eq('id', currentAttendance.id)

      if (error) throw error

      setIsCheckedIn(false)
      setIsOnBreak(false)
      setWorkStartTime(null)
      setBreakStartTime(null)
      setTotalBreakTime(0)
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

  const handleBreakStart = async () => {
    setBreakLoading(true)
    try {
      setIsOnBreak(true)
      setBreakStartTime(new Date())
      Alert.alert('Break Started', 'Enjoy your break! Remember to end it when you return to work.')
    } catch (error: any) {
      Alert.alert('Error', 'Failed to start break')
    } finally {
      setBreakLoading(false)
    }
  }

  const handleBreakEnd = async () => {
    if (!breakStartTime) return

    setBreakLoading(true)
    try {
      const breakEnd = new Date()
      const breakDuration = (breakEnd.getTime() - breakStartTime.getTime()) / (1000 * 60) // in minutes
      
      setTotalBreakTime(prev => prev + breakDuration)
      setIsOnBreak(false)
      setBreakStartTime(null)
      
      Alert.alert('Break Ended', `Break duration: ${Math.round(breakDuration)} minutes. Back to work!`)
    } catch (error: any) {
      Alert.alert('Error', 'Failed to end break')
    } finally {
      setBreakLoading(false)
    }
  }

  const formatTime = (timeString: string | null) => {
    if (!timeString) return '--:--'
    return new Date(timeString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const getCurrentTime = () => {
    return currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  }

  const getWorkDuration = () => {
    if (!workStartTime) return '00:00:00'
    
    const now = currentTime.getTime()
    const workStart = workStartTime.getTime()
    let workTime = now - workStart
    
    // Subtract current break time if on break
    if (isOnBreak && breakStartTime) {
      const currentBreakTime = now - breakStartTime.getTime()
      workTime -= (totalBreakTime * 60 * 1000) + currentBreakTime
    } else {
      workTime -= (totalBreakTime * 60 * 1000)
    }
    
    if (workTime < 0) workTime = 0
    
    const hours = Math.floor(workTime / (1000 * 60 * 60))
    const minutes = Math.floor((workTime % (1000 * 60 * 60)) / (1000 * 60))
    const seconds = Math.floor((workTime % (1000 * 60)) / 1000)
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }

  const getBreakDuration = () => {
    if (!isOnBreak || !breakStartTime) return '00:00:00'
    
    const breakTime = currentTime.getTime() - breakStartTime.getTime()
    const hours = Math.floor(breakTime / (1000 * 60 * 60))
    const minutes = Math.floor((breakTime % (1000 * 60 * 60)) / (1000 * 60))
    const seconds = Math.floor((breakTime % (1000 * 60)) / 1000)
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }

  const getTotalBreakTime = () => {
    let total = totalBreakTime
    if (isOnBreak && breakStartTime) {
      total += (currentTime.getTime() - breakStartTime.getTime()) / (1000 * 60)
    }
    const hours = Math.floor(total / 60)
    const minutes = Math.floor(total % 60)
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
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
        {/* Current Time & Status */}
        <View style={styles.timeCard}>
          <Text style={styles.currentTime}>{getCurrentTime()}</Text>
          <Text style={styles.currentDate}>{currentTime.toDateString()}</Text>
          
          <View style={styles.statusIndicator}>
            <View style={[
              styles.statusDot,
              { backgroundColor: isOnBreak ? "#f59e0b" : isCheckedIn ? "#10b981" : "#6b7280" }
            ]} />
            <Text style={styles.statusText}>
              {isOnBreak ? "On Break" : isCheckedIn ? "Working" : "Not Checked In"}
            </Text>
          </View>
        </View>

        {/* Live Timer (when checked in) */}
        {isCheckedIn && (
          <View style={styles.timerCard}>
            <Text style={styles.timerLabel}>
              {isOnBreak ? "Break Time" : "Work Time"}
            </Text>
            <Text style={styles.timerValue}>
              {isOnBreak ? getBreakDuration() : getWorkDuration()}
            </Text>
            
            <View style={styles.timerStats}>
              <View style={styles.timerStat}>
                <Text style={styles.timerStatLabel}>Total Work</Text>
                <Text style={styles.timerStatValue}>{getWorkDuration()}</Text>
              </View>
              <View style={styles.timerStat}>
                <Text style={styles.timerStatLabel}>Total Break</Text>
                <Text style={styles.timerStatValue}>{getTotalBreakTime()}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionButtonsContainer}>
          {/* Main Action Button */}
          <TouchableOpacity
            style={[
              styles.mainActionButton,
              { backgroundColor: isCheckedIn ? "#ef4444" : "#10b981" },
              actionLoading && styles.buttonDisabled
            ]}
            onPress={isCheckedIn ? handleCheckOut : handleCheckIn}
            disabled={actionLoading}
          >
            {actionLoading ? (
              <ActivityIndicator color="white" size="large" />
            ) : (
              <>
                <Ionicons 
                  name={isCheckedIn ? "log-out" : "log-in"} 
                  size={28} 
                  color="white" 
                />
                <Text style={styles.mainActionButtonText}>
                  {isCheckedIn ? 'Check Out' : 'Check In'}
                </Text>
              </>
            )}
          </TouchableOpacity>

          {/* Break Button (only when checked in) */}
          {isCheckedIn && (
            <TouchableOpacity
              style={[
                styles.breakButton,
                { backgroundColor: isOnBreak ? "#10b981" : "#f59e0b" },
                breakLoading && styles.buttonDisabled
              ]}
              onPress={isOnBreak ? handleBreakEnd : handleBreakStart}
              disabled={breakLoading}
            >
              {breakLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <Ionicons 
                    name={isOnBreak ? "play" : "pause"} 
                    size={20} 
                    color="white" 
                  />
                  <Text style={styles.breakButtonText}>
                    {isOnBreak ? 'End Break' : 'Take Break'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>

        {/* Today's Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Today's Summary</Text>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Ionicons name="time-outline" size={20} color="#3b82f6" />
              <Text style={styles.summaryLabel}>Work Time</Text>
              <Text style={styles.summaryValue}>
                {isCheckedIn ? getWorkDuration().substring(0, 5) : `${todayStats.workHours.toFixed(1)}h`}
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Ionicons name="pause-circle-outline" size={20} color="#f59e0b" />
              <Text style={styles.summaryLabel}>Break Time</Text>
              <Text style={styles.summaryValue}>{getTotalBreakTime()}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Ionicons name="checkmark-circle-outline" size={20} color="#10b981" />
              <Text style={styles.summaryLabel}>Status</Text>
              <Text style={styles.summaryValue}>{isOnBreak ? "Break" : isCheckedIn ? "Working" : "Off"}</Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        {isCheckedIn && (
          <View style={styles.quickActionsCard}>
            <Text style={styles.cardTitle}>Quick Actions</Text>
            <View style={styles.quickActionsGrid}>
              <TouchableOpacity style={styles.quickActionItem}>
                <Ionicons name="list-outline" size={24} color="#3b82f6" />
                <Text style={styles.quickActionLabel}>My Tasks</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.quickActionItem}>
                <Ionicons name="document-outline" size={24} color="#10b981" />
                <Text style={styles.quickActionLabel}>Forms</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.quickActionItem}>
                <Ionicons name="time-outline" size={24} color="#f59e0b" />
                <Text style={styles.quickActionLabel}>Time Track</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Bottom spacing for scroll */}
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
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  currentTime: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#111827',
    fontVariant: ['tabular-nums'],
  },
  currentDate: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 4,
    marginBottom: 16,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
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
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  timerCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  timerLabel: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 8,
  },
  timerValue: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#111827',
    fontVariant: ['tabular-nums'],
    marginBottom: 20,
  },
  timerStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  timerStat: {
    alignItems: 'center',
  },
  timerStatLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  timerStatValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    fontVariant: ['tabular-nums'],
  },
  actionButtonsContainer: {
    gap: 12,
    marginBottom: 20,
  },
  mainActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 6,
  },
  mainActionButtonText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 12,
  },
  breakButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
  },
  breakButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
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
    flex: 1,
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
  quickActionsCard: {
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
  quickActionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  quickActionItem: {
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#f9fafb',
    minWidth: 80,
  },
  quickActionLabel: {
    fontSize: 12,
    color: '#374151',
    marginTop: 4,
    textAlign: 'center',
  },
  bottomSpacing: {
    height: 100, // Extra space at bottom to ensure full scroll
  },
})