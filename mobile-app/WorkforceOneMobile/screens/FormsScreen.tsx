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

interface FormAssignment {
  id: string
  form_id: string
  user_id: string
  assigned_by: string
  assigned_at: string
  due_date?: string
  status: 'assigned' | 'completed' | 'overdue'
  completed_at?: string
  response_id?: string
  form: {
    id: string
    title: string
    description?: string
    fields: any[]
  }
  assigner?: {
    full_name: string
  }
}

export default function FormsScreen({ navigation }: any) {
  const { user, profile } = useAuth()
  const [assignments, setAssignments] = useState<FormAssignment[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'assigned' | 'completed'>('all')

  useEffect(() => {
    fetchFormAssignments()
  }, [filter])

  const fetchFormAssignments = async () => {
    if (!user || !profile?.organization_id) return

    try {
      // First get form assignments without joins
      const { data: assignments, error: assignmentsError } = await supabase
        .from('form_assignments')
        .select('*')
        .eq('user_id', user.id)
        .eq('organization_id', profile.organization_id)
        .order('created_at', { ascending: false })

      if (assignmentsError) {
        console.error('Error fetching form assignments:', assignmentsError)
        // If table doesn't exist or has issues, just show empty state
        setAssignments([])
        setLoading(false)
        return
      }

      if (!assignments || assignments.length === 0) {
        setAssignments([])
        return
      }

      // Get unique form IDs and assigner IDs
      const formIds = [...new Set(assignments.map(a => a.form_id).filter(Boolean))]
      const assignerIds = [...new Set(assignments.map(a => a.assigned_by).filter(Boolean))]

      // Fetch forms data
      let formsData = []
      if (formIds.length > 0) {
        const { data: forms, error: formsError } = await supabase
          .from('forms')
          .select('id, title, description, fields')
          .in('id', formIds)
        
        if (formsError) {
          console.error('Error fetching forms:', formsError)
        } else {
          formsData = forms || []
        }
      }

      // Fetch assigners data
      let assignersData = []
      if (assignerIds.length > 0) {
        const { data: assigners, error: assignersError } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', assignerIds)
        
        if (assignersError) {
          console.error('Error fetching assigners:', assignersError)
        } else {
          assignersData = assigners || []
        }
      }

      // Combine the data
      const enrichedAssignments = assignments.map(assignment => {
        const form = formsData.find(f => f.id === assignment.form_id) || {
          id: assignment.form_id,
          title: 'Unknown Form',
          description: null,
          fields: []
        }
        
        const assigner = assignersData.find(a => a.id === assignment.assigned_by) || {
          full_name: 'Unknown'
        }

        return {
          ...assignment,
          form,
          assigner
        }
      })

      // Apply filter if needed
      const filteredAssignments = filter === 'all' 
        ? enrichedAssignments 
        : enrichedAssignments.filter(assignment => assignment.status === filter)

      setAssignments(filteredAssignments)
    } catch (error) {
      console.error('Error fetching form assignments:', error)
      // If table doesn't exist, show empty state
      setAssignments([])
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#10b981'
      case 'overdue': return '#ef4444'
      case 'assigned': return '#3b82f6'
      default: return '#6b7280'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return 'checkmark-circle'
      case 'overdue': return 'alert-circle'
      case 'assigned': return 'document-text'
      default: return 'document'
    }
  }

  const handleFormPress = async (assignment: FormAssignment) => {
    if (assignment.status === 'completed') {
      Alert.alert(
        'Form Completed',
        'You have already completed this form.',
        [{ text: 'OK' }]
      )
      return
    }

    Alert.alert(
      'Open Form',
      `Open "${assignment.form.title}" to complete?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Open',
          onPress: () => {
            // For now, just mark as completed
            // In a real app, this would open a form filling interface
            markFormCompleted(assignment.id)
          }
        }
      ]
    )
  }

  const markFormCompleted = async (assignmentId: string) => {
    try {
      const { error } = await supabase
        .from('form_assignments')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', assignmentId)

      if (error) throw error

      // Update local state
      setAssignments(prev => 
        prev.map(assignment => 
          assignment.id === assignmentId 
            ? { 
                ...assignment, 
                status: 'completed' as const, 
                completed_at: new Date().toISOString() 
              }
            : assignment
        )
      )

      Alert.alert('Success', 'Form marked as completed!')
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update form status')
    }
  }

  const getAssignmentCounts = () => {
    return {
      all: assignments.length,
      assigned: assignments.filter(a => a.status === 'assigned').length,
      completed: assignments.filter(a => a.status === 'completed').length,
    }
  }

  const filteredAssignments = filter === 'all' 
    ? assignments 
    : assignments.filter(assignment => assignment.status === filter)
  
  const counts = getAssignmentCounts()

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
          <Text style={styles.headerTitle}>My Forms</Text>
          <Text style={styles.headerSubtitle}>Complete assigned forms</Text>
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {[
            { key: 'all', label: `All (${counts.all})` },
            { key: 'assigned', label: `Pending (${counts.assigned})` },
            { key: 'completed', label: `Completed (${counts.completed})` },
          ].map((item) => (
            <TouchableOpacity
              key={item.key}
              style={[
                styles.filterTab,
                filter === item.key && styles.filterTabActive
              ]}
              onPress={() => setFilter(item.key as any)}
            >
              <Text style={[
                styles.filterTabText,
                filter === item.key && styles.filterTabTextActive
              ]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Forms List */}
      <ScrollView style={styles.content}>
        {filteredAssignments.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="document-outline" size={48} color="#d1d5db" />
            <Text style={styles.emptyText}>No forms found</Text>
            <Text style={styles.emptySubtext}>
              {filter === 'assigned' 
                ? "No pending forms to complete" 
                : filter === 'completed'
                ? "No completed forms yet"
                : "No forms have been assigned to you yet"}
            </Text>
          </View>
        ) : (
          <View style={styles.formsList}>
            {filteredAssignments.map((assignment) => (
              <TouchableOpacity
                key={assignment.id}
                style={styles.formCard}
                onPress={() => handleFormPress(assignment)}
              >
                <View style={styles.formHeader}>
                  <View style={styles.formMeta}>
                    <View style={[
                      styles.statusBadge, 
                      { backgroundColor: getStatusColor(assignment.status) }
                    ]}>
                      <Ionicons 
                        name={getStatusIcon(assignment.status) as any} 
                        size={12} 
                        color="white" 
                      />
                      <Text style={styles.statusText}>
                        {assignment.status.replace('_', ' ').toUpperCase()}
                      </Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#6b7280" />
                </View>
                
                <Text style={styles.formTitle}>{assignment.form.title}</Text>
                {assignment.form.description && (
                  <Text style={styles.formDescription}>
                    {assignment.form.description}
                  </Text>
                )}
                
                <View style={styles.formFooter}>
                  <View style={styles.formInfo}>
                    <Ionicons name="person-outline" size={14} color="#6b7280" />
                    <Text style={styles.formInfoText}>
                      Assigned by {assignment.assigner?.full_name || 'Manager'}
                    </Text>
                  </View>
                  
                  <View style={styles.formInfo}>
                    <Ionicons name="time-outline" size={14} color="#6b7280" />
                    <Text style={styles.formInfoText}>
                      {new Date(assignment.assigned_at).toLocaleDateString()}
                    </Text>
                  </View>

                  {assignment.due_date && (
                    <View style={styles.formInfo}>
                      <Ionicons name="calendar-outline" size={14} color="#ef4444" />
                      <Text style={[styles.formInfoText, { color: '#ef4444' }]}>
                        Due: {new Date(assignment.due_date).toLocaleDateString()}
                      </Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
        
        {/* Bottom spacing */}
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
  filterContainer: {
    backgroundColor: 'white',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 4,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
  },
  filterTabActive: {
    backgroundColor: '#3b82f6',
  },
  filterTabText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  filterTabTextActive: {
    color: 'white',
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
    paddingHorizontal: 20,
  },
  formsList: {
    gap: 12,
  },
  formCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
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
  formMeta: {
    flexDirection: 'row',
    gap: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  formTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  formDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 12,
    lineHeight: 20,
  },
  formFooter: {
    gap: 6,
  },
  formInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  formInfoText: {
    fontSize: 12,
    color: '#6b7280',
  },
  bottomSpacing: {
    height: 100,
  },
})