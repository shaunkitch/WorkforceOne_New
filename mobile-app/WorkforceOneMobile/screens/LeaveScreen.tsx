import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  TextInput,
  Alert,
  Modal,
  Platform,
} from 'react-native'
import DateTimePicker from '@react-native-community/datetimepicker'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { offlineStorage } from '../services/OfflineStorage'
import { syncService } from '../services/SyncService'

interface LeaveRequest {
  id: string
  start_date: string
  end_date: string
  leave_type: string
  reason: string
  status: 'pending' | 'approved' | 'rejected'
  manager_notes?: string
  created_at: string
}

export default function LeaveScreen() {
  const { user, profile } = useAuth()
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [showNewRequestModal, setShowNewRequestModal] = useState(false)
  const [showStartDatePicker, setShowStartDatePicker] = useState(false)
  const [showEndDatePicker, setShowEndDatePicker] = useState(false)
  const [newRequest, setNewRequest] = useState({
    start_date: '',
    end_date: '',
    leave_type: 'vacation',
    reason: ''
  })

  const leaveTypes = [
    { value: 'vacation', label: 'Vacation' },
    { value: 'sick', label: 'Sick Leave' },
    { value: 'personal', label: 'Personal' },
    { value: 'emergency', label: 'Emergency' },
    { value: 'bereavement', label: 'Bereavement' },
  ]

  useEffect(() => {
    fetchLeaveRequests()
  }, [])

  const fetchLeaveRequests = async () => {
    if (!user?.id) return

    try {
      const { data, error } = await supabase
        .from('leave_requests')
        .select('*')
        .eq('employee_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      setLeaveRequests(data || [])
    } catch (error) {
      console.error('Error fetching leave requests:', error)
      Alert.alert('Error', 'Failed to load leave requests')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const onRefresh = () => {
    setRefreshing(true)
    fetchLeaveRequests()
  }

  const submitLeaveRequest = async () => {
    if (!newRequest.start_date || !newRequest.end_date || !newRequest.reason.trim()) {
      Alert.alert('Error', 'Please fill in all required fields')
      return
    }

    if (new Date(newRequest.start_date) > new Date(newRequest.end_date)) {
      Alert.alert('Error', 'End date must be after start date')
      return
    }

    try {
      const timestamp = new Date().toISOString()

      // Add leave request to outbox for offline sync
      await offlineStorage.addToOutbox({
        type: 'leave_request',
        data: {
          employeeId: user!.id,
          organizationId: profile!.organization_id,
          type: newRequest.leave_type,
          startDate: newRequest.start_date,
          endDate: newRequest.end_date,
          reason: newRequest.reason,
          timestamp
        },
        timestamp,
        userId: user!.id,
        organizationId: profile!.organization_id
      })

      // Try to sync if online
      const syncStatus = syncService.getSyncStatus()
      if (syncStatus.isOnline) {
        const syncResult = await syncService.forcSync()
        Alert.alert(
          'Success', 
          syncResult ? 'Leave request submitted successfully!' : 'Leave request saved! It will be submitted when connection is stable.'
        )
      } else {
        Alert.alert('Success', 'Leave request saved! It will be submitted when you\'re back online.')
      }

      setShowNewRequestModal(false)
      setNewRequest({
        start_date: '',
        end_date: '',
        leave_type: 'vacation',
        reason: ''
      })
      setShowStartDatePicker(false)
      setShowEndDatePicker(false)
      fetchLeaveRequests()
    } catch (error) {
      console.error('Error submitting leave request:', error)
      Alert.alert('Error', 'Failed to submit leave request')
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return '#10b981'
      case 'rejected': return '#ef4444'
      case 'pending': return '#f59e0b'
      default: return '#6b7280'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return 'checkmark-circle'
      case 'rejected': return 'close-circle'
      case 'pending': return 'time'
      default: return 'help-circle'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const calculateDays = (startDate: string, endDate: string) => {
    const start = new Date(startDate)
    const end = new Date(endDate)
    const diffTime = Math.abs(end.getTime() - start.getTime())
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
  }

  const onStartDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowStartDatePicker(false)
    }
    if (selectedDate) {
      const dateString = selectedDate.toISOString().split('T')[0]
      setNewRequest({ ...newRequest, start_date: dateString })
    }
  }

  const onEndDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowEndDatePicker(false)
    }
    if (selectedDate) {
      const dateString = selectedDate.toISOString().split('T')[0]
      setNewRequest({ ...newRequest, end_date: dateString })
    }
  }

  const getDateFromString = (dateString: string) => {
    return dateString ? new Date(dateString) : new Date()
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Loading leave requests...</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Leave Requests</Text>
        <Text style={styles.headerSubtitle}>Manage your time off requests</Text>
      </View>

      <View style={styles.actionBar}>
        <TouchableOpacity
          style={styles.newRequestButton}
          onPress={() => setShowNewRequestModal(true)}
        >
          <Ionicons name="add" size={20} color="white" />
          <Text style={styles.newRequestText}>New Request</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {leaveRequests.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={64} color="#d1d5db" />
            <Text style={styles.emptyTitle}>No leave requests</Text>
            <Text style={styles.emptyText}>Your leave requests will appear here</Text>
          </View>
        ) : (
          <View style={styles.requestsList}>
            {leaveRequests.map((request) => (
              <View key={request.id} style={styles.requestCard}>
                <View style={styles.requestHeader}>
                  <View style={styles.requestInfo}>
                    <Text style={styles.leaveType}>
                      {leaveTypes.find(t => t.value === request.leave_type)?.label || request.leave_type}
                    </Text>
                    <Text style={styles.dateRange}>
                      {formatDate(request.start_date)} - {formatDate(request.end_date)}
                    </Text>
                    <Text style={styles.duration}>
                      {calculateDays(request.start_date, request.end_date)} day(s)
                    </Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(request.status) }]}>
                    <Ionicons name={getStatusIcon(request.status)} size={16} color="white" />
                    <Text style={styles.statusText}>{request.status}</Text>
                  </View>
                </View>

                <View style={styles.reasonSection}>
                  <Text style={styles.reasonLabel}>Reason:</Text>
                  <Text style={styles.reasonText}>{request.reason}</Text>
                </View>

                {request.manager_notes && (
                  <View style={styles.notesSection}>
                    <Text style={styles.notesLabel}>Manager Notes:</Text>
                    <Text style={styles.notesText}>{request.manager_notes}</Text>
                  </View>
                )}

                <Text style={styles.submittedDate}>
                  Submitted: {formatDate(request.created_at)}
                </Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* New Request Modal */}
      <Modal
        visible={showNewRequestModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          setShowNewRequestModal(false)
          setShowStartDatePicker(false)
          setShowEndDatePicker(false)
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Leave Request</Text>
              <TouchableOpacity onPress={() => {
                setShowNewRequestModal(false)
                setShowStartDatePicker(false)
                setShowEndDatePicker(false)
              }}>
                <Ionicons name="close" size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalForm}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Leave Type</Text>
                <View style={styles.pickerContainer}>
                  {leaveTypes.map((type) => (
                    <TouchableOpacity
                      key={type.value}
                      style={[
                        styles.pickerOption,
                        newRequest.leave_type === type.value && styles.pickerOptionSelected
                      ]}
                      onPress={() => setNewRequest({ ...newRequest, leave_type: type.value })}
                    >
                      <Text style={[
                        styles.pickerOptionText,
                        newRequest.leave_type === type.value && styles.pickerOptionTextSelected
                      ]}>
                        {type.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Start Date</Text>
                <TouchableOpacity
                  style={styles.datePickerButton}
                  onPress={() => setShowStartDatePicker(true)}
                >
                  <Ionicons name="calendar-outline" size={20} color="#6b7280" />
                  <Text style={[
                    styles.datePickerText,
                    !newRequest.start_date && styles.datePickerPlaceholder
                  ]}>
                    {newRequest.start_date ? formatDate(newRequest.start_date) : 'Select start date'}
                  </Text>
                </TouchableOpacity>
                {showStartDatePicker && (
                  <DateTimePicker
                    value={getDateFromString(newRequest.start_date)}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={onStartDateChange}
                    minimumDate={new Date()}
                  />
                )}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>End Date</Text>
                <TouchableOpacity
                  style={styles.datePickerButton}
                  onPress={() => setShowEndDatePicker(true)}
                >
                  <Ionicons name="calendar-outline" size={20} color="#6b7280" />
                  <Text style={[
                    styles.datePickerText,
                    !newRequest.end_date && styles.datePickerPlaceholder
                  ]}>
                    {newRequest.end_date ? formatDate(newRequest.end_date) : 'Select end date'}
                  </Text>
                </TouchableOpacity>
                {showEndDatePicker && (
                  <DateTimePicker
                    value={getDateFromString(newRequest.end_date)}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={onEndDateChange}
                    minimumDate={newRequest.start_date ? new Date(newRequest.start_date) : new Date()}
                  />
                )}
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Reason</Text>
                <TextInput
                  style={[styles.textInput, styles.textArea]}
                  value={newRequest.reason}
                  onChangeText={(text) => setNewRequest({ ...newRequest, reason: text })}
                  placeholder="Please provide a reason for your leave request..."
                  multiline
                  numberOfLines={4}
                />
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setShowNewRequestModal(false)
                  setShowStartDatePicker(false)
                  setShowEndDatePicker(false)
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.submitButton}
                onPress={submitLeaveRequest}
              >
                <Text style={styles.submitButtonText}>Submit Request</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  actionBar: {
    padding: 16,
    alignItems: 'flex-end',
  },
  newRequestButton: {
    backgroundColor: '#3b82f6',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  newRequestText: {
    color: 'white',
    fontWeight: '600',
    marginLeft: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#374151',
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 8,
    textAlign: 'center',
  },
  requestsList: {
    paddingBottom: 20,
  },
  requestCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  requestInfo: {
    flex: 1,
    marginRight: 12,
  },
  leaveType: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    textTransform: 'capitalize',
  },
  dateRange: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  duration: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
    marginLeft: 4,
  },
  reasonSection: {
    marginBottom: 12,
  },
  reasonLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  reasonText: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  notesSection: {
    marginBottom: 12,
    backgroundColor: '#fef3c7',
    padding: 12,
    borderRadius: 8,
  },
  notesLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400e',
    marginBottom: 4,
  },
  notesText: {
    fontSize: 14,
    color: '#92400e',
    lineHeight: 20,
  },
  submittedDate: {
    fontSize: 12,
    color: '#9ca3af',
    fontStyle: 'italic',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  modalForm: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: 'white',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pickerOption: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: 'white',
  },
  pickerOptionSelected: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
  },
  pickerOptionText: {
    fontSize: 14,
    color: '#374151',
  },
  pickerOptionTextSelected: {
    color: 'white',
  },
  modalActions: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#d1d5db',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '600',
  },
  submitButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#3b82f6',
    alignItems: 'center',
  },
  submitButtonText: {
    fontSize: 16,
    color: 'white',
    fontWeight: '600',
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    backgroundColor: 'white',
    gap: 8,
  },
  datePickerText: {
    fontSize: 16,
    color: '#374151',
  },
  datePickerPlaceholder: {
    color: '#9ca3af',
  },
})