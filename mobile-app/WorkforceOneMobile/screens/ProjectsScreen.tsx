import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Modal,
  TextInput,
  Alert,
} from 'react-native'
import { StatusBar } from 'expo-status-bar'
import { Ionicons } from '@expo/vector-icons'
import { Picker } from '@react-native-picker/picker'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { Project } from '../types/database'

export default function ProjectsScreen() {
  const { user, profile } = useAuth()
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [filter, setFilter] = useState<'all' | 'planning' | 'active' | 'completed' | 'on_hold'>('all')
  const [newProject, setNewProject] = useState({
    name: '',
    description: '',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'urgent',
    budget: '',
    start_date: '',
    end_date: '',
  })
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    fetchProjects()
  }, [filter])

  const fetchProjects = async () => {
    if (!user || !profile?.organization_id) return

    try {
      let query = supabase
        .from('projects')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .order('created_at', { ascending: false })

      if (filter !== 'all') {
        query = query.eq('status', filter)
      }

      const { data, error } = await query

      if (error) throw error
      setProjects(data || [])
    } catch (error) {
      console.error('Error fetching projects:', error)
    } finally {
      setLoading(false)
    }
  }

  const createProject = async () => {
    if (!newProject.name.trim()) {
      Alert.alert('Error', 'Project name is required')
      return
    }

    if (!user || !profile?.organization_id) return

    setActionLoading(true)
    try {
      const { data, error } = await supabase
        .from('projects')
        .insert({
          name: newProject.name.trim(),
          description: newProject.description.trim() || null,
          priority: newProject.priority,
          budget: newProject.budget ? parseFloat(newProject.budget) : null,
          start_date: newProject.start_date || null,
          end_date: newProject.end_date || null,
          organization_id: profile.organization_id,
          status: 'planning',
        })
        .select()
        .single()

      if (error) throw error

      setProjects([data, ...projects])
      setNewProject({ 
        name: '', 
        description: '', 
        priority: 'medium', 
        budget: '',
        start_date: '',
        end_date: '',
      })
      setShowCreateModal(false)
      Alert.alert('Success', 'Project created successfully!')
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create project')
    } finally {
      setActionLoading(false)
    }
  }

  const updateProjectStatus = async (projectId: string, newStatus: Project['status']) => {
    try {
      const { error } = await supabase
        .from('projects')
        .update({ status: newStatus })
        .eq('id', projectId)

      if (error) throw error

      setProjects(projects.map(project => 
        project.id === projectId ? { ...project, status: newStatus } : project
      ))
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update project')
    }
  }

  const deleteProject = async (projectId: string) => {
    Alert.alert(
      'Delete Project',
      'Are you sure you want to delete this project?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('projects')
                .delete()
                .eq('id', projectId)

              if (error) throw error
              setProjects(projects.filter(project => project.id !== projectId))
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to delete project')
            }
          }
        }
      ]
    )
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return '#ef4444'
      case 'high': return '#f59e0b'
      case 'medium': return '#3b82f6'
      case 'low': return '#10b981'
      default: return '#6b7280'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'planning': return '#6b7280'
      case 'active': return '#3b82f6'
      case 'completed': return '#10b981'
      case 'on_hold': return '#f59e0b'
      default: return '#6b7280'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'planning': return 'calendar-outline'
      case 'active': return 'play-circle-outline'
      case 'completed': return 'checkmark-circle-outline'
      case 'on_hold': return 'pause-circle-outline'
      default: return 'ellipse-outline'
    }
  }

  const getProjectCounts = () => {
    return {
      all: projects.length,
      planning: projects.filter(p => p.status === 'planning').length,
      active: projects.filter(p => p.status === 'active').length,
      completed: projects.filter(p => p.status === 'completed').length,
      on_hold: projects.filter(p => p.status === 'on_hold').length,
    }
  }

  const filteredProjects = filter === 'all' ? projects : projects.filter(project => project.status === filter)
  const projectCounts = getProjectCounts()

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Loading projects...</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Projects</Text>
          <Text style={styles.headerSubtitle}>Manage your projects</Text>
        </View>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => setShowCreateModal(true)}
        >
          <Ionicons name="add" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {[
            { key: 'all', label: `All (${projectCounts.all})` },
            { key: 'planning', label: `Planning (${projectCounts.planning})` },
            { key: 'active', label: `Active (${projectCounts.active})` },
            { key: 'completed', label: `Completed (${projectCounts.completed})` },
            { key: 'on_hold', label: `On Hold (${projectCounts.on_hold})` },
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

      {/* Projects List */}
      <ScrollView style={styles.content}>
        {filteredProjects.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="folder-outline" size={48} color="#d1d5db" />
            <Text style={styles.emptyText}>No projects found</Text>
            <TouchableOpacity 
              style={styles.emptyButton}
              onPress={() => setShowCreateModal(true)}
            >
              <Text style={styles.emptyButtonText}>Create your first project</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.projectsList}>
            {filteredProjects.map((project) => (
              <View key={project.id} style={styles.projectCard}>
                <View style={styles.projectHeader}>
                  <View style={styles.projectMeta}>
                    <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(project.priority) }]}>
                      <Text style={styles.priorityText}>{project.priority.toUpperCase()}</Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(project.status) }]}>
                      <Ionicons 
                        name={getStatusIcon(project.status) as any} 
                        size={12} 
                        color="white" 
                        style={{ marginRight: 4 }}
                      />
                      <Text style={styles.statusText}>{project.status.replace('_', ' ').toUpperCase()}</Text>
                    </View>
                  </View>
                  <TouchableOpacity onPress={() => deleteProject(project.id)}>
                    <Ionicons name="trash-outline" size={20} color="#ef4444" />
                  </TouchableOpacity>
                </View>
                
                <Text style={styles.projectTitle}>{project.name}</Text>
                {project.description && (
                  <Text style={styles.projectDescription}>{project.description}</Text>
                )}
                
                <View style={styles.projectDetails}>
                  {project.budget && (
                    <View style={styles.detailItem}>
                      <Ionicons name="cash-outline" size={16} color="#6b7280" />
                      <Text style={styles.detailText}>
                        Budget: ${project.budget.toLocaleString()}
                      </Text>
                    </View>
                  )}
                  {project.start_date && (
                    <View style={styles.detailItem}>
                      <Ionicons name="calendar-outline" size={16} color="#6b7280" />
                      <Text style={styles.detailText}>
                        Start: {new Date(project.start_date).toLocaleDateString()}
                      </Text>
                    </View>
                  )}
                  {project.end_date && (
                    <View style={styles.detailItem}>
                      <Ionicons name="flag-outline" size={16} color="#6b7280" />
                      <Text style={styles.detailText}>
                        End: {new Date(project.end_date).toLocaleDateString()}
                      </Text>
                    </View>
                  )}
                </View>
                
                <View style={styles.projectActions}>
                  {project.status === 'planning' && (
                    <TouchableOpacity
                      style={[styles.actionButton, { backgroundColor: '#3b82f6' }]}
                      onPress={() => updateProjectStatus(project.id, 'active')}
                    >
                      <Text style={styles.actionButtonText}>Start</Text>
                    </TouchableOpacity>
                  )}
                  {project.status === 'active' && (
                    <>
                      <TouchableOpacity
                        style={[styles.actionButton, { backgroundColor: '#10b981' }]}
                        onPress={() => updateProjectStatus(project.id, 'completed')}
                      >
                        <Text style={styles.actionButtonText}>Complete</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.actionButton, { backgroundColor: '#f59e0b' }]}
                        onPress={() => updateProjectStatus(project.id, 'on_hold')}
                      >
                        <Text style={styles.actionButtonText}>Hold</Text>
                      </TouchableOpacity>
                    </>
                  )}
                  {project.status === 'on_hold' && (
                    <TouchableOpacity
                      style={[styles.actionButton, { backgroundColor: '#3b82f6' }]}
                      onPress={() => updateProjectStatus(project.id, 'active')}
                    >
                      <Text style={styles.actionButtonText}>Resume</Text>
                    </TouchableOpacity>
                  )}
                  {project.status === 'completed' && (
                    <TouchableOpacity
                      style={[styles.actionButton, { backgroundColor: '#6b7280' }]}
                      onPress={() => updateProjectStatus(project.id, 'active')}
                    >
                      <Text style={styles.actionButtonText}>Reopen</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Create Project Modal */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowCreateModal(false)}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Create Project</Text>
            <TouchableOpacity 
              onPress={createProject}
              disabled={actionLoading}
            >
              {actionLoading ? (
                <ActivityIndicator color="#3b82f6" />
              ) : (
                <Text style={styles.modalSave}>Save</Text>
              )}
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Project Name *</Text>
              <TextInput
                style={styles.textInput}
                value={newProject.name}
                onChangeText={(text) => setNewProject({...newProject, name: text})}
                placeholder="Enter project name"
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Description</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={newProject.description}
                onChangeText={(text) => setNewProject({...newProject, description: text})}
                placeholder="Enter project description"
                multiline
                numberOfLines={4}
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Priority</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={newProject.priority}
                  onValueChange={(value) => setNewProject({...newProject, priority: value})}
                >
                  <Picker.Item label="Low" value="low" />
                  <Picker.Item label="Medium" value="medium" />
                  <Picker.Item label="High" value="high" />
                  <Picker.Item label="Urgent" value="urgent" />
                </Picker>
              </View>
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Budget (optional)</Text>
              <TextInput
                style={styles.textInput}
                value={newProject.budget}
                onChangeText={(text) => setNewProject({...newProject, budget: text})}
                placeholder="Enter budget amount"
                keyboardType="numeric"
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Start Date (optional)</Text>
              <TextInput
                style={styles.textInput}
                value={newProject.start_date}
                onChangeText={(text) => setNewProject({...newProject, start_date: text})}
                placeholder="YYYY-MM-DD"
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>End Date (optional)</Text>
              <TextInput
                style={styles.textInput}
                value={newProject.end_date}
                onChangeText={(text) => setNewProject({...newProject, end_date: text})}
                placeholder="YYYY-MM-DD"
              />
            </View>
          </ScrollView>
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
  addButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: 8,
    borderRadius: 8,
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
    marginBottom: 20,
  },
  emptyButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  projectsList: {
    gap: 12,
  },
  projectCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  projectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  projectMeta: {
    flexDirection: 'row',
    gap: 8,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  priorityText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  projectTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  projectDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 12,
    lineHeight: 20,
  },
  projectDetails: {
    marginBottom: 16,
    gap: 8,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    fontSize: 12,
    color: '#6b7280',
    marginLeft: 6,
  },
  projectActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 30,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalCancel: {
    color: '#6b7280',
    fontSize: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  modalSave: {
    color: '#3b82f6',
    fontSize: 16,
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
  },
})