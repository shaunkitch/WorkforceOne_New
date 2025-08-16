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
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

interface FormResponse {
  id: string
  form_id: string
  respondent_id: string
  responses: any
  submitted_at: string
  status: string
  location_latitude?: number
  location_longitude?: number
  location_accuracy?: number
  location_timestamp?: string
}

interface Form {
  id: string
  title: string
  description?: string
  fields: any[]
}

interface Props {
  route: {
    params: {
      formId: string
      responseId?: string
    }
  }
  navigation: any
}

export default function FormResponseViewScreen({ route, navigation }: Props) {
  const { formId, responseId } = route.params
  const { user, profile } = useAuth()
  const insets = useSafeAreaInsets()
  
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState<Form | null>(null)
  const [responses, setResponses] = useState<FormResponse[]>([])
  const [selectedResponse, setSelectedResponse] = useState<FormResponse | null>(null)

  useEffect(() => {
    fetchFormAndResponses()
  }, [])

  const fetchFormAndResponses = async () => {
    if (!user || !profile?.organization_id) return

    try {
      // Fetch form details
      const { data: formData, error: formError } = await supabase
        .from('forms')
        .select('*')
        .eq('id', formId)
        .eq('organization_id', profile.organization_id)
        .single()

      if (formError) throw formError

      setForm(formData)

      // Fetch user's responses for this form
      const { data: responseData, error: responseError } = await supabase
        .from('form_responses')
        .select('*')
        .eq('form_id', formId)
        .eq('respondent_id', user.id)
        .order('submitted_at', { ascending: false })

      if (responseError && responseError.code !== 'PGRST116') { // Ignore "no rows" error
        console.error('Error fetching responses:', responseError)
      }

      const userResponses = responseData || []
      setResponses(userResponses)

      // If a specific response was requested, select it
      if (responseId) {
        const specificResponse = userResponses.find(r => r.id === responseId)
        setSelectedResponse(specificResponse || userResponses[0] || null)
      } else {
        setSelectedResponse(userResponses[0] || null)
      }

    } catch (error) {
      console.error('Error fetching form data:', error)
      Alert.alert('Error', 'Failed to load form responses')
    } finally {
      setLoading(false)
    }
  }

  const formatFieldValue = (field: any, value: any) => {
    if (!value && value !== 0 && value !== false) return 'No response'
    
    switch (field.type) {
      case 'multiselect':
      case 'checkbox':
      case 'checkboxes':
        return Array.isArray(value) ? value.join(', ') : String(value)
      case 'rating':
        return `${value}/5 stars`
      case 'likert':
        return String(value)
      default:
        return String(value)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString()
  }

  const getLocationString = (response: FormResponse) => {
    if (response.location_latitude && response.location_longitude) {
      const accuracy = response.location_accuracy ? `±${Math.round(response.location_accuracy)}m` : ''
      return `${response.location_latitude.toFixed(6)}, ${response.location_longitude.toFixed(6)} ${accuracy}`
    }
    return 'No location data'
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Loading responses...</Text>
      </View>
    )
  }

  if (!form) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Form not found</Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle} numberOfLines={1}>{form.title}</Text>
          <Text style={styles.headerSubtitle}>
            {responses.length} submission{responses.length !== 1 ? 's' : ''}
          </Text>
        </View>
      </View>

      {responses.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="document-outline" size={48} color="#d1d5db" />
          <Text style={styles.emptyText}>No submissions yet</Text>
          <Text style={styles.emptySubtext}>
            Complete this form to see your responses here
          </Text>
          <TouchableOpacity 
            style={styles.completeButton}
            onPress={() => navigation.navigate('FormCompletion', {
              formId: form.id,
              outletId: null,
              visitId: null,
              routeStopId: null
            })}
          >
            <Text style={styles.completeButtonText}>Complete Form Now</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView style={styles.content}>
          {/* Response selector */}
          {responses.length > 1 && (
            <View style={styles.responseSelector}>
              <Text style={styles.selectorTitle}>Your Submissions:</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.responseList}>
                {responses.map((response, index) => (
                  <TouchableOpacity
                    key={response.id}
                    style={[
                      styles.responseCard,
                      selectedResponse?.id === response.id && styles.selectedResponseCard
                    ]}
                    onPress={() => setSelectedResponse(response)}
                  >
                    <Text style={styles.responseNumber}>#{index + 1}</Text>
                    <Text style={styles.responseDate}>
                      {formatDate(response.submitted_at)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Selected response details */}
          {selectedResponse && (
            <View style={styles.responseDetails}>
              <View style={styles.responseHeader}>
                <Text style={styles.responseTitle}>
                  Submission #{responses.findIndex(r => r.id === selectedResponse.id) + 1}
                </Text>
                <Text style={styles.submissionDate}>
                  Submitted: {formatDate(selectedResponse.submitted_at)}
                </Text>
                <Text style={styles.locationInfo}>
                  Location: {getLocationString(selectedResponse)}
                </Text>
              </View>

              {/* Form fields and responses */}
              <View style={styles.fieldsContainer}>
                {form.fields?.filter(field => field.type !== 'section' && field.type !== 'html').map((field, index) => (
                  <View key={field.id || index} style={styles.fieldContainer}>
                    <Text style={styles.fieldLabel}>
                      {field.label || `Field ${index + 1}`}
                      {field.required && <Text style={styles.required}> *</Text>}
                    </Text>
                    <Text style={styles.fieldValue}>
                      {formatFieldValue(field, selectedResponse.responses[field.id || field.label])}
                    </Text>
                  </View>
                ))}
              </View>

              {/* Metadata */}
              {selectedResponse.responses._metadata && (
                <View style={styles.metadataContainer}>
                  <Text style={styles.metadataTitle}>Submission Details</Text>
                  <Text style={styles.metadataText}>
                    Status: {selectedResponse.status}
                  </Text>
                  {selectedResponse.responses._metadata.user_name && (
                    <Text style={styles.metadataText}>
                      Submitted by: {selectedResponse.responses._metadata.user_name}
                    </Text>
                  )}
                  {selectedResponse.responses._metadata.outlet_name && (
                    <Text style={styles.metadataText}>
                      Outlet: {selectedResponse.responses._metadata.outlet_name}
                    </Text>
                  )}
                  {selectedResponse.responses._metadata.offline_submitted && (
                    <Text style={styles.metadataText}>
                      Submitted offline: Yes
                    </Text>
                  )}
                </View>
              )}
            </View>
          )}
        </ScrollView>
      )}

      {/* Complete another response button */}
      {responses.length > 0 && (
        <View style={styles.floatingButton}>
          <TouchableOpacity 
            style={styles.fab}
            onPress={() => navigation.navigate('FormCompletion', {
              formId: form.id,
              outletId: null,
              visitId: null,
              routeStopId: null
            })}
          >
            <Ionicons name="add" size={24} color="white" />
          </TouchableOpacity>
        </View>
      )}
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#ef4444',
    marginBottom: 20,
  },
  header: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 20,
    paddingBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 15,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    color: '#93c5fd',
    fontSize: 14,
    marginTop: 2,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
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
    marginBottom: 20,
  },
  completeButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  completeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  backButtonText: {
    color: '#3b82f6',
    fontSize: 16,
    fontWeight: '600',
  },
  responseSelector: {
    marginBottom: 20,
  },
  selectorTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  responseList: {
    flexDirection: 'row',
  },
  responseCard: {
    backgroundColor: 'white',
    padding: 12,
    marginRight: 12,
    borderRadius: 8,
    minWidth: 120,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  selectedResponseCard: {
    backgroundColor: '#dbeafe',
    borderWidth: 2,
    borderColor: '#3b82f6',
  },
  responseNumber: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  responseDate: {
    fontSize: 10,
    color: '#6b7280',
    textAlign: 'center',
  },
  responseDetails: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  responseHeader: {
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  responseTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  submissionDate: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  locationInfo: {
    fontSize: 12,
    color: '#6b7280',
    fontFamily: 'monospace',
  },
  fieldsContainer: {
    marginBottom: 20,
  },
  fieldContainer: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },
  required: {
    color: '#ef4444',
  },
  fieldValue: {
    fontSize: 16,
    color: '#111827',
    backgroundColor: '#f9fafb',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    minHeight: 44,
  },
  metadataContainer: {
    backgroundColor: '#f8fafc',
    padding: 16,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
  },
  metadataTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  metadataText: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 4,
  },
  floatingButton: {
    position: 'absolute',
    bottom: 30,
    right: 20,
  },
  fab: {
    backgroundColor: '#3b82f6',
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
})