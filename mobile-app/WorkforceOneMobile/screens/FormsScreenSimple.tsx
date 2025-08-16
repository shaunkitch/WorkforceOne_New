import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native'
import { StatusBar } from 'expo-status-bar'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { syncService } from '../services/SyncService'
import { offlineStorage } from '../services/OfflineStorage'

interface Form {
  id: string
  title: string
  description?: string
  status: 'active' | 'draft' | 'archived'
  created_at: string
  fields?: any[]
}

export default function FormsScreenSimple({ navigation }: any) {
  const { user, profile } = useAuth()
  const [forms, setForms] = useState<Form[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)

  useEffect(() => {
    fetchForms()
  }, [])

  const fetchForms = async () => {
    if (!user || !profile?.organization_id) return

    try {
      // First try to load from offline storage
      const offlineForms = await offlineStorage.getForms()
      if (offlineForms.length > 0) {
        setForms(offlineForms)
        setLoading(false)
      }

      // Then fetch fresh data from server
      const { data, error } = await supabase
        .from('forms')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .in('status', ['active', 'draft'])
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching forms:', error)
        // Only set empty if we don't have offline data
        if (offlineForms.length === 0) {
          setForms([])
        }
      } else {
        const freshForms = data || []
        setForms(freshForms)
        // Store fresh data offline
        await offlineStorage.storeForms(freshForms)
      }
    } catch (error) {
      console.error('Error fetching forms:', error)
      // Try to load offline forms as fallback
      try {
        const offlineForms = await offlineStorage.getForms()
        setForms(offlineForms)
      } catch (offlineError) {
        setForms([])
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSync = async () => {
    if (!user || !profile?.organization_id) return

    setSyncing(true)
    try {
      // Download fresh data
      const success = await syncService.downloadFreshData(user.id, profile.organization_id)
      
      if (success) {
        // Reload forms from fresh data
        await fetchForms()
        Alert.alert('Sync Complete', 'Forms have been updated with the latest data.')
      } else {
        Alert.alert('Sync Failed', 'Unable to sync data. Please check your internet connection.')
      }
    } catch (error) {
      console.error('Sync error:', error)
      Alert.alert('Sync Error', 'Failed to sync data. Please try again.')
    } finally {
      setSyncing(false)
    }
  }

  const handleFormPress = (form: Form) => {
    Alert.alert(
      form.title,
      form.description || 'What would you like to do with this form?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'View Responses', 
          onPress: () => {
            // Navigate to form response view
            navigation.navigate('FormResponseView', {
              formId: form.id
            })
          }
        },
        { 
          text: 'Complete Form', 
          onPress: () => {
            // Navigate to form completion
            navigation.navigate('FormCompletion', {
              formId: form.id,
              outletId: null,
              visitId: null,
              routeStopId: null
            })
          }
        }
      ]
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#10b981'
      case 'draft': return '#f59e0b'
      case 'archived': return '#6b7280'
      default: return '#3b82f6'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return 'checkmark-circle'
      case 'draft': return 'time'
      case 'archived': return 'archive'
      default: return 'document'
    }
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Loading forms...</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Header */}
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View>
          <Text style={styles.headerTitle}>Forms</Text>
          <Text style={styles.headerSubtitle}>Available forms to complete</Text>
        </View>
        <TouchableOpacity
          style={[styles.syncButton, syncing && styles.syncButtonDisabled]}
          onPress={handleSync}
          disabled={syncing}
        >
          <Ionicons 
            name={syncing ? "sync" : "cloud-download-outline"} 
            size={20} 
            color={syncing ? "#8E8E93" : "white"} 
            style={syncing ? { transform: [{ rotate: '360deg' }] } : {}}
          />
          <Text style={[styles.syncButtonText, syncing && styles.syncButtonTextDisabled]}>
            {syncing ? 'Syncing...' : 'Sync'}
          </Text>
        </TouchableOpacity>
      </LinearGradient>

      {/* Forms List */}
      <ScrollView style={styles.content}>
        {forms.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="document-outline" size={48} color="#d1d5db" />
            <Text style={styles.emptyText}>No forms available</Text>
            <Text style={styles.emptySubtext}>
              Check back later for new forms
            </Text>
          </View>
        ) : (
          <View style={styles.formsList}>
            {forms.map((form) => (
              <TouchableOpacity
                key={form.id}
                style={styles.formCard}
                onPress={() => handleFormPress(form)}
              >
                <View style={styles.formHeader}>
                  <View style={styles.formInfo}>
                    <Text style={styles.formTitle}>{form.title}</Text>
                    {form.description && (
                      <Text style={styles.formDescription} numberOfLines={2}>
                        {form.description}
                      </Text>
                    )}
                    <Text style={styles.formDate}>
                      Created: {new Date(form.created_at).toLocaleDateString()}
                    </Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(form.status) }]}>
                    <Ionicons name={getStatusIcon(form.status)} size={16} color="white" />
                  </View>
                </View>

                <View style={styles.formFooter}>
                  <Text style={styles.formAction}>Tap to complete</Text>
                  <Ionicons name="chevron-forward" size={20} color="#6b7280" />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
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
    paddingTop: 30,
    paddingHorizontal: 20,
    paddingBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  syncButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  syncButtonDisabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  syncButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  syncButtonTextDisabled: {
    color: '#8E8E93',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    color: '#9ca3af',
    marginTop: 12,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  formsList: {
    paddingBottom: 20,
  },
  formCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  formHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  formInfo: {
    flex: 1,
    marginRight: 12,
  },
  formTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  formDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
    lineHeight: 20,
  },
  formDate: {
    fontSize: 12,
    color: '#9ca3af',
  },
  statusBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  formFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  formAction: {
    fontSize: 14,
    color: '#3b82f6',
    fontWeight: '500',
  },
})