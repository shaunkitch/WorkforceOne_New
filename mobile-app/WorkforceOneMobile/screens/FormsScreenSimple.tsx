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
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

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

  useEffect(() => {
    fetchForms()
  }, [])

  const fetchForms = async () => {
    if (!user || !profile?.organization_id) return

    try {
      // Fetch all active forms for the organization
      const { data, error } = await supabase
        .from('forms')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .in('status', ['active', 'draft'])
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching forms:', error)
        setForms([])
      } else {
        setForms(data || [])
      }
    } catch (error) {
      console.error('Error fetching forms:', error)
      setForms([])
    } finally {
      setLoading(false)
    }
  }

  const handleFormPress = (form: Form) => {
    Alert.alert(
      form.title,
      form.description || 'Would you like to complete this form?',
      [
        { text: 'Cancel', style: 'cancel' },
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
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Forms</Text>
          <Text style={styles.headerSubtitle}>Available forms to complete</Text>
        </View>
      </View>

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