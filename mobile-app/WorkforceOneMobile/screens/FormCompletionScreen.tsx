import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Switch,
  ActivityIndicator
} from 'react-native'
import { StatusBar } from 'expo-status-bar'
import { Ionicons } from '@expo/vector-icons'
import { Picker } from '@react-native-picker/picker'
import { useAuth } from '../contexts/AuthContext'
import { offlineStorage } from '../services/OfflineStorage'
import { syncService } from '../services/SyncService'

interface FormField {
  id: string
  type: 'text' | 'textarea' | 'number' | 'email' | 'phone' | 'select' | 'radio' | 'checkbox' | 'date' | 'time' | 'rating'
  label: string
  placeholder?: string
  required: boolean
  options?: string[]
  min?: number
  max?: number
  validation?: {
    minLength?: number
    maxLength?: number
    pattern?: string
    message?: string
  }
}

interface Form {
  id: string
  title: string
  description?: string
  fields: FormField[]
}

interface Outlet {
  id: string
  name: string
  address?: string
  group_name?: string
}

interface RouteParams {
  formId: string
  outletId: string
  visitId?: string
  routeStopId?: string
}

export default function FormCompletionScreen({ route, navigation }: any) {
  const { formId, outletId, visitId, routeStopId }: RouteParams = route.params
  const { user, profile } = useAuth()
  
  const [form, setForm] = useState<Form | null>(null)
  const [outlet, setOutlet] = useState<Outlet | null>(null)
  const [formResponses, setFormResponses] = useState<Record<string, any>>({})
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    loadFormData()
  }, [formId, outletId])

  const loadFormData = async () => {
    try {
      setLoading(true)
      
      // Load form from offline storage
      const formData = await offlineStorage.getForm(formId)
      if (!formData) {
        Alert.alert('Error', 'Form not found. Please ensure you have downloaded the latest data.')
        navigation.goBack()
        return
      }
      setForm(formData)

      // Load outlet from offline storage
      const outlets = await offlineStorage.getOutlets()
      const outletData = outlets.find(o => o.id === outletId)
      if (!outletData) {
        Alert.alert('Error', 'Outlet not found. Please ensure you have downloaded the latest data.')
        navigation.goBack()
        return
      }
      setOutlet(outletData)

      // Load existing form response if visit ID provided
      if (visitId) {
        const existingResponse = await offlineStorage.getFormResponse(visitId)
        if (existingResponse) {
          setFormResponses(existingResponse.responses || {})
        }
      }

    } catch (error) {
      console.error('Error loading form data:', error)
      Alert.alert('Error', 'Failed to load form data')
      navigation.goBack()
    } finally {
      setLoading(false)
    }
  }

  const handleFieldChange = (fieldId: string, value: any) => {
    setFormResponses(prev => ({
      ...prev,
      [fieldId]: value
    }))

    // Clear validation error for this field
    if (validationErrors[fieldId]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[fieldId]
        return newErrors
      })
    }
  }

  const validateField = (field: FormField, value: any): string | null => {
    // Check required fields
    if (field.required && (!value || (typeof value === 'string' && value.trim() === ''))) {
      return `${field.label} is required`
    }

    // Type-specific validation
    if (value && typeof value === 'string' && value.trim() !== '') {
      switch (field.type) {
        case 'email':
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
          if (!emailRegex.test(value)) {
            return 'Please enter a valid email address'
          }
          break
        case 'phone':
          const phoneRegex = /^\+?[\d\s\-\(\)]+$/
          if (!phoneRegex.test(value)) {
            return 'Please enter a valid phone number'
          }
          break
        case 'number':
          const numValue = parseFloat(value)
          if (isNaN(numValue)) {
            return 'Please enter a valid number'
          }
          if (field.min !== undefined && numValue < field.min) {
            return `Value must be at least ${field.min}`
          }
          if (field.max !== undefined && numValue > field.max) {
            return `Value must be at most ${field.max}`
          }
          break
      }

      // Custom validation rules
      if (field.validation) {
        if (field.validation.minLength && value.length < field.validation.minLength) {
          return `Must be at least ${field.validation.minLength} characters`
        }
        if (field.validation.maxLength && value.length > field.validation.maxLength) {
          return `Must be at most ${field.validation.maxLength} characters`
        }
        if (field.validation.pattern) {
          const regex = new RegExp(field.validation.pattern)
          if (!regex.test(value)) {
            return field.validation.message || 'Invalid format'
          }
        }
      }
    }

    return null
  }

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {}
    
    form?.fields.forEach(field => {
      const value = formResponses[field.id]
      const error = validateField(field, value)
      if (error) {
        errors[field.id] = error
      }
    })

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const saveDraft = async () => {
    if (!form || !outlet || !user || !profile) return

    setSaving(true)
    try {
      const responseId = visitId || `draft_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      
      const formResponse = {
        id: responseId,
        formId: form.id,
        outletId: outlet.id,
        visitId: visitId || '',
        responses: formResponses,
        timestamp: new Date().toISOString(),
        status: 'draft' as const
      }

      await offlineStorage.saveFormResponse(formResponse)
      
      Alert.alert('Success', 'Draft saved successfully!')
    } catch (error) {
      console.error('Error saving draft:', error)
      Alert.alert('Error', 'Failed to save draft')
    } finally {
      setSaving(false)
    }
  }

  const submitForm = async () => {
    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please fix the validation errors before submitting')
      return
    }

    if (!form || !outlet || !user || !profile) return

    setSubmitting(true)
    try {
      const responseId = visitId || `response_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      const timestamp = new Date().toISOString()

      // Save completed form response locally
      const formResponse = {
        id: responseId,
        formId: form.id,
        outletId: outlet.id,
        visitId: visitId || '',
        responses: formResponses,
        timestamp,
        status: 'completed' as const
      }

      await offlineStorage.saveFormResponse(formResponse)

      // Add to outbox for syncing
      await offlineStorage.addToOutbox({
        type: 'form_response',
        data: {
          formId: form.id,
          outletId: outlet.id,
          visitId: visitId,
          userId: user.id,
          organizationId: profile.organization_id,
          responses: {
            ...formResponses,
            _metadata: {
              user_name: profile.full_name,
              outlet_name: outlet.name,
              completed_at: timestamp,
              offline_submitted: true
            }
          },
          timestamp
        },
        timestamp,
        userId: user.id,
        organizationId: profile.organization_id
      })

      // Update outlet visit if applicable
      if (visitId && routeStopId) {
        await offlineStorage.addToOutbox({
          type: 'outlet_visit',
          data: {
            visitId,
            outletId: outlet.id,
            userId: user.id,
            organizationId: profile.organization_id,
            formCompleted: true,
            checkOutTime: timestamp,
            routeStopId
          },
          timestamp,
          userId: user.id,
          organizationId: profile.organization_id
        })
      }

      // Try to sync if online
      const syncStatus = syncService.getSyncStatus()
      if (syncStatus.isOnline) {
        syncService.forcSync()
      }

      Alert.alert(
        'Success', 
        syncStatus.isOnline 
          ? 'Form submitted successfully!' 
          : 'Form saved! It will be submitted when you\'re back online.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      )
      
    } catch (error) {
      console.error('Error submitting form:', error)
      Alert.alert('Error', 'Failed to submit form')
    } finally {
      setSubmitting(false)
    }
  }

  const renderField = (field: FormField) => {
    const value = formResponses[field.id] || ''
    const hasError = !!validationErrors[field.id]

    switch (field.type) {
      case 'text':
      case 'email':
      case 'phone':
        return (
          <View key={field.id} style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>
              {field.label} {field.required && <Text style={styles.required}>*</Text>}
            </Text>
            <TextInput
              style={[styles.textInput, hasError && styles.inputError]}
              placeholder={field.placeholder}
              value={value}
              onChangeText={(text) => handleFieldChange(field.id, text)}
              keyboardType={field.type === 'email' ? 'email-address' : field.type === 'phone' ? 'phone-pad' : 'default'}
            />
            {hasError && (
              <Text style={styles.errorText}>{validationErrors[field.id]}</Text>
            )}
          </View>
        )

      case 'number':
        return (
          <View key={field.id} style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>
              {field.label} {field.required && <Text style={styles.required}>*</Text>}
            </Text>
            <TextInput
              style={[styles.textInput, hasError && styles.inputError]}
              placeholder={field.placeholder}
              value={value.toString()}
              onChangeText={(text) => handleFieldChange(field.id, text)}
              keyboardType="numeric"
            />
            {hasError && (
              <Text style={styles.errorText}>{validationErrors[field.id]}</Text>
            )}
          </View>
        )

      case 'textarea':
        return (
          <View key={field.id} style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>
              {field.label} {field.required && <Text style={styles.required}>*</Text>}
            </Text>
            <TextInput
              style={[styles.textArea, hasError && styles.inputError]}
              placeholder={field.placeholder}
              value={value}
              onChangeText={(text) => handleFieldChange(field.id, text)}
              multiline
              numberOfLines={4}
            />
            {hasError && (
              <Text style={styles.errorText}>{validationErrors[field.id]}</Text>
            )}
          </View>
        )

      case 'select':
        return (
          <View key={field.id} style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>
              {field.label} {field.required && <Text style={styles.required}>*</Text>}
            </Text>
            <View style={[styles.pickerContainer, hasError && styles.inputError]}>
              <Picker
                selectedValue={value}
                onValueChange={(itemValue) => handleFieldChange(field.id, itemValue)}
                style={styles.picker}
              >
                <Picker.Item label={field.placeholder || 'Select an option'} value="" />
                {field.options?.map((option, index) => (
                  <Picker.Item key={index} label={option} value={option} />
                ))}
              </Picker>
            </View>
            {hasError && (
              <Text style={styles.errorText}>{validationErrors[field.id]}</Text>
            )}
          </View>
        )

      case 'radio':
        return (
          <View key={field.id} style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>
              {field.label} {field.required && <Text style={styles.required}>*</Text>}
            </Text>
            <View style={[styles.radioContainer, hasError && styles.inputError]}>
              {field.options?.map((option, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.radioOption}
                  onPress={() => handleFieldChange(field.id, option)}
                >
                  <View style={[styles.radioCircle, value === option && styles.radioSelected]} />
                  <Text style={styles.radioText}>{option}</Text>
                </TouchableOpacity>
              ))}
            </View>
            {hasError && (
              <Text style={styles.errorText}>{validationErrors[field.id]}</Text>
            )}
          </View>
        )

      case 'checkbox':
        return (
          <View key={field.id} style={styles.fieldContainer}>
            <TouchableOpacity
              style={styles.checkboxContainer}
              onPress={() => handleFieldChange(field.id, !value)}
            >
              <View style={[styles.checkbox, value && styles.checkboxSelected]}>
                {value && <Ionicons name="checkmark" size={16} color="white" />}
              </View>
              <Text style={styles.checkboxLabel}>
                {field.label} {field.required && <Text style={styles.required}>*</Text>}
              </Text>
            </TouchableOpacity>
            {hasError && (
              <Text style={styles.errorText}>{validationErrors[field.id]}</Text>
            )}
          </View>
        )

      case 'rating':
        return (
          <View key={field.id} style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>
              {field.label} {field.required && <Text style={styles.required}>*</Text>}
            </Text>
            <View style={styles.ratingContainer}>
              {[1, 2, 3, 4, 5].map((rating) => (
                <TouchableOpacity
                  key={rating}
                  style={[
                    styles.ratingButton,
                    value === rating && styles.ratingButtonSelected
                  ]}
                  onPress={() => handleFieldChange(field.id, rating)}
                >
                  <Text style={[
                    styles.ratingText,
                    value === rating && styles.ratingTextSelected
                  ]}>
                    {rating}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {hasError && (
              <Text style={styles.errorText}>{validationErrors[field.id]}</Text>
            )}
          </View>
        )

      default:
        return null
    }
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading form...</Text>
      </View>
    )
  }

  if (!form || !outlet) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={48} color="#FF3B30" />
        <Text style={styles.errorTitle}>Form Not Found</Text>
        <Text style={styles.errorMessage}>The requested form could not be loaded.</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>{form.title}</Text>
          <Text style={styles.headerSubtitle}>{outlet.name}</Text>
        </View>
        <View style={styles.headerRight} />
      </View>

      {/* Form Content */}
      <ScrollView style={styles.formContainer} showsVerticalScrollIndicator={false}>
        {form.description && (
          <Text style={styles.formDescription}>{form.description}</Text>
        )}
        
        <View style={styles.fieldsContainer}>
          {form.fields && form.fields.length > 0 ? (
            form.fields.map(field => renderField(field))
          ) : (
            <View style={styles.noFieldsContainer}>
              <Text style={styles.noFieldsText}>This form has no fields configured.</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={[styles.actionButton, styles.draftButton]}
          onPress={saveDraft}
          disabled={saving || submitting}
        >
          {saving ? (
            <ActivityIndicator size="small" color="#007AFF" />
          ) : (
            <>
              <Ionicons name="save-outline" size={20} color="#007AFF" />
              <Text style={styles.draftButtonText}>Save Draft</Text>
            </>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.actionButton, styles.submitButton]}
          onPress={submitForm}
          disabled={saving || submitting}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <>
              <Ionicons name="send" size={20} color="white" />
              <Text style={styles.submitButtonText}>Submit Form</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 20,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  backButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 60,
    paddingBottom: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e5e9',
  },
  backBtn: {
    padding: 8,
    marginLeft: -8,
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  headerRight: {
    width: 40,
  },
  formContainer: {
    flex: 1,
  },
  formDescription: {
    fontSize: 16,
    color: '#666',
    margin: 16,
    lineHeight: 22,
  },
  fieldsContainer: {
    padding: 16,
  },
  fieldContainer: {
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  required: {
    color: '#FF3B30',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: 'white',
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: 'white',
    minHeight: 100,
    textAlignVertical: 'top',
  },
  inputError: {
    borderColor: '#FF3B30',
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 14,
    marginTop: 4,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: 'white',
  },
  picker: {
    height: 50,
  },
  radioContainer: {
    backgroundColor: 'white',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 12,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#ddd',
    marginRight: 12,
  },
  radioSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#007AFF',
  },
  radioText: {
    fontSize: 16,
    color: '#333',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#ddd',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#007AFF',
  },
  checkboxLabel: {
    fontSize: 16,
    color: '#333',
  },
  ratingContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  ratingButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#ddd',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
  },
  ratingButtonSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#007AFF',
  },
  ratingText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#666',
  },
  ratingTextSelected: {
    color: 'white',
  },
  noFieldsContainer: {
    padding: 40,
    alignItems: 'center',
  },
  noFieldsText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  actionsContainer: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e1e5e9',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 8,
    gap: 8,
  },
  draftButton: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  draftButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: '#007AFF',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
})