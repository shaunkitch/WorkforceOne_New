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
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { offlineStorage } from '../services/OfflineStorage'
import { syncService } from '../services/SyncService'
import * as Location from 'expo-location'

interface FormField {
  id: string
  type: 'text' | 'textarea' | 'number' | 'email' | 'phone' | 'select' | 'radio' | 'checkbox' | 'multiselect' | 'multi-select' | 'checkboxes' | 'rating' | 'file' | 'likert' | 'section' | 'html'
  label: string
  placeholder?: string
  required: boolean
  options?: string[]
  scale?: string[]
  content?: string
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
  const insets = useSafeAreaInsets()
  
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
      
      // Check if this is the default store visit form
      if (formId === 'default-store-visit') {
        // Use the hardcoded default form
        const defaultForm = {
          id: 'default-store-visit',
          title: 'Store Visit Form',
          description: 'Complete this form for your outlet visit',
          fields: [
            {
              id: 'visit_type',
              type: 'select',
              label: 'Visit Type',
              required: true,
              options: ['Regular Visit', 'Inspection', 'Delivery', 'Collection', 'Customer Service', 'Other']
            },
            {
              id: 'store_condition',
              type: 'rating',
              label: 'Store Condition (1-5)',
              required: true,
              min: 1,
              max: 5
            },
            {
              id: 'products_checked',
              type: 'checkbox',
              label: 'Products/Inventory Checked',
              required: false
            },
            {
              id: 'issues_found',
              type: 'textarea',
              label: 'Issues Found',
              placeholder: 'Describe any issues or concerns',
              required: false
            },
            {
              id: 'visit_notes',
              type: 'textarea',
              label: 'Visit Notes',
              placeholder: 'Enter any notes about your visit',
              required: false
            }
          ]
        }
        setForm(defaultForm)
      } else {
        // Always fetch fresh form data from Supabase first
        const { data, error } = await supabase
          .from('forms')
          .select('*')
          .eq('id', formId)
          .single()
        
        let formData
        if (error || !data) {
          // If Supabase fails, try offline storage as fallback
          console.log('Supabase fetch failed, trying offline storage:', error)
          formData = await offlineStorage.getForm(formId)
          if (!formData) {
            Alert.alert('Error', 'Form not found.')
            navigation.goBack()
            return
          }
        } else {
          formData = data
          // Update offline storage with fresh data
          await offlineStorage.storeForms([formData])
        }
        console.log('Form data loaded:', JSON.stringify(formData, null, 2))
        setForm(formData)
      }

      // Load outlet from offline storage if outletId provided
      if (outletId) {
        const outlets = await offlineStorage.getOutlets()
        const outletData = outlets.find(o => o.id === outletId)
        if (outletData) {
          setOutlet(outletData)
        } else {
          // Create a placeholder outlet
          setOutlet({
            id: outletId,
            name: 'General Form',
            address: '',
            group_name: ''
          })
        }
      } else {
        // No outlet - this is a general form
        setOutlet({
          id: 'general',
          name: 'General Form',
          address: '',
          group_name: ''
        })
      }

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
    if (field.required) {
      if (!value || 
          (typeof value === 'string' && value.trim() === '') ||
          (Array.isArray(value) && value.length === 0)) {
        return `${field.label} is required`
      }
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
          if (field.min !== undefined && field.min !== null && numValue < field.min) {
            return `Value must be at least ${field.min}`
          }
          if (field.max !== undefined && field.max !== null && numValue > field.max) {
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

  const getCurrentLocation = async () => {
    try {
      console.log('Requesting location permissions...')
      const { status } = await Location.requestForegroundPermissionsAsync()
      
      if (status !== 'granted') {
        console.log('Location permission denied')
        return null
      }

      console.log('Getting current location...')
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
        timeInterval: 5000,
        maximumAge: 30000
      })

      console.log('Location obtained:', {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy
      })

      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy,
        timestamp: new Date(location.timestamp).toISOString()
      }
    } catch (error) {
      console.error('Error getting location:', error)
      return null
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
      
      // Capture GPS location
      const location = await getCurrentLocation()

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

      // Add to outbox for syncing (including location data)
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
              offline_submitted: true,
              location_captured: !!location
            }
          },
          timestamp,
          location: location // Include GPS location data
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

      // Try to sync if online and wait for completion
      const syncStatus = syncService.getSyncStatus()
      let syncSuccess = true
      if (syncStatus.isOnline) {
        console.log('Attempting to sync form submission...')
        syncSuccess = await syncService.forcSync()
        console.log('Form sync completed:', syncSuccess ? 'success' : 'failed')
      }

      Alert.alert(
        'Success', 
        syncStatus.isOnline 
          ? (syncSuccess ? 'Form submitted successfully!' : 'Form saved locally and will sync when possible.')
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
        // In frontend, 'checkbox' means multiple choice selection
        if (field.options && field.options.length > 0) {
          // Multiple choice checkboxes
          return (
            <View key={field.id} style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>
                {field.label} {field.required && <Text style={styles.required}>*</Text>}
              </Text>
              <View style={[styles.checkboxesContainer, hasError && styles.inputError]}>
                {field.options.map((option, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.checkboxOption}
                    onPress={() => {
                      const currentValues = Array.isArray(value) ? value : []
                      const newValues = currentValues.includes(option)
                        ? currentValues.filter(v => v !== option)
                        : [...currentValues, option]
                      handleFieldChange(field.id, newValues)
                    }}
                  >
                    <View style={[
                      styles.checkbox, 
                      (Array.isArray(value) && value.includes(option)) && styles.checkboxSelected
                    ]}>
                      {(Array.isArray(value) && value.includes(option)) && (
                        <Ionicons name="checkmark" size={16} color="white" />
                      )}
                    </View>
                    <Text style={styles.checkboxOptionText}>{option}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              {hasError && (
                <Text style={styles.errorText}>{validationErrors[field.id]}</Text>
              )}
            </View>
          )
        } else {
          // Single checkbox (fallback for no options)
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
        }

      case 'multiselect':
        // Multiselect field - multiple choice selection
        return (
          <View key={field.id} style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>
              {field.label} {field.required && <Text style={styles.required}>*</Text>}
            </Text>
            <View style={[styles.checkboxesContainer, hasError && styles.inputError]}>
              {field.options?.map((option, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.checkboxOption}
                  onPress={() => {
                    const currentValues = Array.isArray(value) ? value : []
                    const newValues = currentValues.includes(option)
                      ? currentValues.filter(v => v !== option)
                      : [...currentValues, option]
                    handleFieldChange(field.id, newValues)
                  }}
                >
                  <View style={[
                    styles.checkbox, 
                    (Array.isArray(value) && value.includes(option)) && styles.checkboxSelected
                  ]}>
                    {(Array.isArray(value) && value.includes(option)) && (
                      <Ionicons name="checkmark" size={16} color="white" />
                    )}
                  </View>
                  <Text style={styles.checkboxOptionText}>{option}</Text>
                </TouchableOpacity>
              ))}
            </View>
            {hasError && (
              <Text style={styles.errorText}>{validationErrors[field.id]}</Text>
            )}
          </View>
        )

      case 'multi-select':
      case 'checkboxes':
        // Alternative names for multiselect - handle same as multiselect
        return (
          <View key={field.id} style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>
              {field.label} {field.required && <Text style={styles.required}>*</Text>}
            </Text>
            <View style={[styles.checkboxesContainer, hasError && styles.inputError]}>
              {field.options?.map((option, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.checkboxOption}
                  onPress={() => {
                    const currentValues = Array.isArray(value) ? value : []
                    const newValues = currentValues.includes(option)
                      ? currentValues.filter(v => v !== option)
                      : [...currentValues, option]
                    handleFieldChange(field.id, newValues)
                  }}
                >
                  <View style={[
                    styles.checkbox, 
                    (Array.isArray(value) && value.includes(option)) && styles.checkboxSelected
                  ]}>
                    {(Array.isArray(value) && value.includes(option)) && (
                      <Ionicons name="checkmark" size={16} color="white" />
                    )}
                  </View>
                  <Text style={styles.checkboxOptionText}>{option}</Text>
                </TouchableOpacity>
              ))}
            </View>
            {hasError && (
              <Text style={styles.errorText}>{validationErrors[field.id]}</Text>
            )}
          </View>
        )



      case 'file':
        return (
          <View key={field.id} style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>
              {field.label} {field.required && <Text style={styles.required}>*</Text>}
            </Text>
            <TouchableOpacity style={[styles.fileUploadButton, hasError && styles.inputError]}>
              <Ionicons name="cloud-upload-outline" size={24} color="#007AFF" />
              <Text style={styles.fileUploadText}>
                {value ? 'File Selected' : 'Tap to Select File'}
              </Text>
            </TouchableOpacity>
            <Text style={styles.fieldHint}>File upload functionality will be available soon</Text>
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


      case 'likert':
        const likertScale = field.scale || field.options || ['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree']
        return (
          <View key={field.id} style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>
              {field.label} {field.required && <Text style={styles.required}>*</Text>}
            </Text>
            <View style={[styles.likertContainer, hasError && styles.inputError]}>
              {likertScale.map((option, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.likertOption,
                    value === option && styles.likertOptionSelected
                  ]}
                  onPress={() => handleFieldChange(field.id, option)}
                >
                  <Text style={[
                    styles.likertOptionText,
                    value === option && styles.likertOptionTextSelected
                  ]}>
                    {option}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {hasError && (
              <Text style={styles.errorText}>{validationErrors[field.id]}</Text>
            )}
          </View>
        )

      case 'section':
        return (
          <View key={field.id} style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{field.label}</Text>
              <View style={styles.sectionLine} />
            </View>
          </View>
        )

      case 'html':
        return (
          <View key={field.id} style={styles.htmlContainer}>
            <Text style={styles.htmlContent}>
              {field.content || field.label || 'HTML content will be displayed here'}
            </Text>
          </View>
        )

      default:
        // Show unsupported field type message with debugging info
        console.log('Unsupported field type detected:', field.type, 'Field:', field)
        return (
          <View key={field.id} style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>
              {field.label} {field.required && <Text style={styles.required}>*</Text>}
            </Text>
            <View style={styles.unsupportedField}>
              <Ionicons name="warning-outline" size={24} color="#f59e0b" />
              <Text style={styles.unsupportedFieldText}>
                Field type "{field.type}" is not yet supported in the mobile app.
              </Text>
            </View>
          </View>
        )
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
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
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
      <ScrollView 
        style={styles.formContainer} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
        overScrollMode="never"
        removeClippedSubviews={true}
        scrollEventThrottle={16}
        keyboardShouldPersistTaps="handled"
        nestedScrollEnabled={false}
      >
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
      <View style={[styles.actionsContainer, { paddingBottom: 16 + insets.bottom }]}>
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
    backgroundColor: '#f8f9fa',
  },
  scrollContent: {
    paddingBottom: 20,
    flexGrow: 1,
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
  fieldHint: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    fontStyle: 'italic',
  },
  checkboxesContainer: {
    backgroundColor: 'white',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 12,
  },
  checkboxOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  checkboxOptionText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
  },
  fileUploadButton: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 16,
    backgroundColor: 'white',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fileUploadText: {
    fontSize: 16,
    color: '#007AFF',
    marginLeft: 8,
  },
  unsupportedField: {
    borderWidth: 1,
    borderColor: '#f59e0b',
    borderRadius: 8,
    padding: 16,
    backgroundColor: '#fef3c7',
    flexDirection: 'row',
    alignItems: 'center',
  },
  unsupportedFieldText: {
    fontSize: 14,
    color: '#d97706',
    marginLeft: 8,
    flex: 1,
  },
  likertContainer: {
    backgroundColor: 'white',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 4,
  },
  likertOption: {
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginVertical: 2,
    borderRadius: 6,
    backgroundColor: '#f8f9fa',
  },
  likertOptionSelected: {
    backgroundColor: '#007AFF',
  },
  likertOptionText: {
    fontSize: 14,
    color: '#333',
    textAlign: 'center',
  },
  likertOptionTextSelected: {
    color: 'white',
    fontWeight: '600',
  },
  sectionContainer: {
    marginVertical: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginRight: 12,
  },
  sectionLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#ddd',
  },
  htmlContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 16,
    marginVertical: 8,
  },
  htmlContent: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  dateTimeButton: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: 'white',
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateTimeButtonText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 8,
  },
})