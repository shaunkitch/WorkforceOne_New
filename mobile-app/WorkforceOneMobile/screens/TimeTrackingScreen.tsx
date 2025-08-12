import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  TextInput,
} from 'react-native'
import { StatusBar } from 'expo-status-bar'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { TimeEntry } from '../types/database'

export default function TimeTrackingScreen() {
  const { user, profile } = useAuth()
  const [isTracking, setIsTracking] = useState(false)
  const [currentEntry, setCurrentEntry] = useState<TimeEntry | null>(null)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [description, setDescription] = useState('')
  const [recentEntries, setRecentEntries] = useState<TimeEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    fetchActiveEntry()
    fetchRecentEntries()
  }, [])

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null

    if (isTracking && currentEntry) {
      interval = setInterval(() => {
        const startTime = new Date(currentEntry.start_time).getTime()
        const now = new Date().getTime()
        setElapsedTime(Math.floor((now - startTime) / 1000))
      }, 1000)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isTracking, currentEntry])

  const fetchActiveEntry = async () => {
    if (!user || !profile?.organization_id) return

    try {
      const { data, error } = await supabase
        .from('time_entries')
        .select('*')
        .eq('user_id', user.id)
        .eq('organization_id', profile.organization_id)
        .is('end_time', null)
        .order('start_time', { ascending: false })
        .limit(1)

      if (error) throw error

      if (data && data.length > 0) {
        const entry = data[0]
        setCurrentEntry(entry)
        setIsTracking(true)
        setDescription(entry.description || '')
        
        const startTime = new Date(entry.start_time).getTime()
        const now = new Date().getTime()
        setElapsedTime(Math.floor((now - startTime) / 1000))
      }
    } catch (error) {
      console.error('Error fetching active entry:', error)
    }
  }

  const fetchRecentEntries = async () => {
    if (!user || !profile?.organization_id) return

    try {
      const { data, error } = await supabase
        .from('time_entries')
        .select('*')
        .eq('user_id', user.id)
        .eq('organization_id', profile.organization_id)
        .not('end_time', 'is', null)
        .order('start_time', { ascending: false })
        .limit(10)

      if (error) throw error
      setRecentEntries(data || [])
    } catch (error) {
      console.error('Error fetching recent entries:', error)
    } finally {
      setLoading(false)
    }
  }

  const startTimer = async () => {
    if (!user || !profile?.organization_id) return

    setActionLoading(true)
    try {
      const now = new Date().toISOString()
      
      const { data, error } = await supabase
        .from('time_entries')
        .insert({
          user_id: user.id,
          organization_id: profile.organization_id,
          start_time: now,
          description: description.trim() || null,
        })
        .select()
        .single()

      if (error) throw error

      setCurrentEntry(data)
      setIsTracking(true)
      setElapsedTime(0)
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to start timer')
    } finally {
      setActionLoading(false)
    }
  }

  const stopTimer = async () => {
    if (!currentEntry) return

    setActionLoading(true)
    try {
      const now = new Date().toISOString()
      const startTime = new Date(currentEntry.start_time).getTime()
      const endTime = new Date(now).getTime()
      const durationMinutes = Math.round((endTime - startTime) / (1000 * 60))

      const { error } = await supabase
        .from('time_entries')
        .update({
          end_time: now,
          duration_minutes: durationMinutes,
          description: description.trim() || null,
        })
        .eq('id', currentEntry.id)

      if (error) throw error

      setIsTracking(false)
      setCurrentEntry(null)
      setElapsedTime(0)
      setDescription('')
      
      // Refresh recent entries
      await fetchRecentEntries()

      Alert.alert('Success', `Timer stopped! Tracked ${Math.floor(durationMinutes / 60)}h ${durationMinutes % 60}m`)
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to stop timer')
    } finally {
      setActionLoading(false)
    }
  }

  const updateDescription = async () => {
    if (!currentEntry) return

    try {
      const { error } = await supabase
        .from('time_entries')
        .update({ description: description.trim() || null })
        .eq('id', currentEntry.id)

      if (error) throw error
    } catch (error) {
      console.error('Error updating description:', error)
    }
  }

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const formatEntryDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
  }

  const formatTime = (timeString: string) => {
    return new Date(timeString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Loading time tracking...</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Time Tracking</Text>
        <Text style={styles.headerSubtitle}>Track your work time</Text>
      </View>

      <ScrollView style={styles.content}>
        {/* Timer Card */}
        <View style={styles.timerCard}>
          <View style={styles.timerDisplay}>
            <Text style={styles.timerText}>{formatDuration(elapsedTime)}</Text>
            <Text style={styles.timerStatus}>
              {isTracking ? 'Timer Running' : 'Timer Stopped'}
            </Text>
          </View>

          <View style={styles.descriptionContainer}>
            <TextInput
              style={styles.descriptionInput}
              value={description}
              onChangeText={setDescription}
              onBlur={updateDescription}
              placeholder="What are you working on?"
              multiline
            />
          </View>

          <TouchableOpacity
            style={[
              styles.timerButton,
              { backgroundColor: isTracking ? "#ef4444" : "#10b981" },
              actionLoading && styles.buttonDisabled
            ]}
            onPress={isTracking ? stopTimer : startTimer}
            disabled={actionLoading}
          >
            {actionLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Ionicons 
                  name={isTracking ? "stop" : "play"} 
                  size={24} 
                  color="white" 
                />
                <Text style={styles.timerButtonText}>
                  {isTracking ? 'Stop Timer' : 'Start Timer'}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Today's Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.cardTitle}>Today's Summary</Text>
          <View style={styles.summaryStats}>
            <View style={styles.summaryItem}>
              <Ionicons name="time-outline" size={24} color="#3b82f6" />
              <Text style={styles.summaryValue}>6.5h</Text>
              <Text style={styles.summaryLabel}>Total Time</Text>
            </View>
            <View style={styles.summaryItem}>
              <Ionicons name="list-outline" size={24} color="#10b981" />
              <Text style={styles.summaryValue}>4</Text>
              <Text style={styles.summaryLabel}>Entries</Text>
            </View>
            <View style={styles.summaryItem}>
              <Ionicons name="checkmark-circle-outline" size={24} color="#f59e0b" />
              <Text style={styles.summaryValue}>3</Text>
              <Text style={styles.summaryLabel}>Tasks</Text>
            </View>
          </View>
        </View>

        {/* Recent Entries */}
        <View style={styles.entriesCard}>
          <Text style={styles.cardTitle}>Recent Entries</Text>
          {recentEntries.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="time-outline" size={48} color="#d1d5db" />
              <Text style={styles.emptyText}>No time entries yet</Text>
            </View>
          ) : (
            <View style={styles.entriesList}>
              {recentEntries.map((entry) => (
                <View key={entry.id} style={styles.entryItem}>
                  <View style={styles.entryHeader}>
                    <Text style={styles.entryDescription}>
                      {entry.description || 'No description'}
                    </Text>
                    <Text style={styles.entryDuration}>
                      {formatEntryDuration(entry.duration_minutes || 0)}
                    </Text>
                  </View>
                  <Text style={styles.entryTime}>
                    {formatTime(entry.start_time)} - {entry.end_time ? formatTime(entry.end_time) : 'Running'}
                  </Text>
                </View>
              ))}
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
  timerCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  timerDisplay: {
    alignItems: 'center',
    marginBottom: 20,
  },
  timerText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#111827',
    fontFamily: 'monospace',
  },
  timerStatus: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 8,
  },
  descriptionContainer: {
    marginBottom: 20,
  },
  descriptionInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  timerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  timerButtonText: {
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
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 8,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  entriesCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#9ca3af',
    marginTop: 12,
  },
  entriesList: {
    gap: 12,
  },
  entryItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  entryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  entryDescription: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
  },
  entryDuration: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#3b82f6',
  },
  entryTime: {
    fontSize: 14,
    color: '#6b7280',
  },
})