import React, { useState, useEffect, useCallback } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Switch,
} from 'react-native'
import { StatusBar } from 'expo-status-bar'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '../contexts/AuthContext'
import { notificationService } from '../lib/notifications'
import { supabase } from '../lib/supabase'
import { useFocusEffect } from '@react-navigation/native'
import { NotificationPreferencesService, NotificationPreferences } from '../lib/NotificationPreferences'

interface Notification {
  id: string
  title: string
  body: string
  type: string
  priority: string
  data?: Record<string, any>
  received_at: string
  read?: boolean
}

export default function NotificationCenterScreen({ navigation }: any) {
  const { user, profile } = useAuth()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [settings, setSettings] = useState<NotificationPreferences | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [showSettings, setShowSettings] = useState(false)

  useFocusEffect(
    useCallback(() => {
      loadNotifications()
      loadSettings()
    }, [])
  )

  const loadNotifications = async () => {
    try {
      if (!user) return
      const dbNotifications = await notificationService.fetchUnreadNotifications(supabase, user.id)
      // Transform database notifications to match interface
      const transformedNotifications = dbNotifications.map(notification => ({
        id: notification.id,
        title: notification.title,
        body: notification.message,
        type: notification.type,
        priority: notification.priority,
        data: notification.metadata,
        received_at: notification.created_at,
        read: notification.is_read
      }))
      setNotifications(transformedNotifications)
    } catch (error) {
      console.error('Error loading notifications:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const loadSettings = async () => {
    try {
      const preferences = await NotificationPreferencesService.getPreferences()
      setSettings(preferences)
    } catch (error) {
      console.error('Error loading settings:', error)
    }
  }

  const onRefresh = () => {
    setRefreshing(true)
    loadNotifications()
  }

  const handleNotificationPress = async (notification: Notification) => {
    // Mark as read
    if (!notification.read) {
      await notificationService.markNotificationAsRead(supabase, notification.id)
      setNotifications(prev => 
        prev.map(n => n.id === notification.id ? { ...n, read: true } : n)
      )
    }

    // Handle navigation based on type and metadata
    const isTaskNotification = notification.data?.notification_category === 'task_management' || notification.data?.task_id
    
    if (isTaskNotification) {
      navigation.navigate('Tasks')
      return
    }
    
    switch (notification.type) {
      case 'form_assignment':
        if (notification.data?.formId) {
          navigation.navigate('Forms')
        }
        break
      case 'task_assignment':
      case 'reminder':
        navigation.navigate('Tasks')
        break
      case 'attendance':
        navigation.navigate('Attendance')
        break
      case 'announcement':
        // Show full announcement
        Alert.alert(notification.title, notification.body)
        break
      case 'system':
        // Handle system notifications
        Alert.alert(notification.title, notification.body)
        break
      default:
        // Show details alert for other types
        Alert.alert(notification.title, notification.body)
    }
  }

  const clearAllNotifications = () => {
    Alert.alert(
      'Clear All Notifications',
      'Are you sure you want to mark all notifications as read?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Mark All Read',
          style: 'destructive',
          onPress: async () => {
            try {
              // Mark all notifications as read
              const promises = notifications
                .filter(n => !n.read)
                .map(n => notificationService.markNotificationAsRead(supabase, n.id))
              
              await Promise.all(promises)
              
              // Update local state
              setNotifications(prev => 
                prev.map(n => ({ ...n, read: true }))
              )
            } catch (error) {
              console.error('Error clearing notifications:', error)
              Alert.alert('Error', 'Failed to clear notifications')
            }
          }
        }
      ]
    )
  }

  const updateSetting = async (key: keyof NotificationPreferences, value: boolean | string) => {
    if (!settings) return
    
    const newSettings = { ...settings, [key]: value }
    setSettings(newSettings)
    await NotificationPreferencesService.updatePreferences({ [key]: value })
  }

  const getNotificationIcon = (type: string, data?: Record<string, any>) => {
    // Check if this is a task-related notification based on metadata
    if (data?.notification_category === 'task_management' || data?.task_id) {
      return 'checkmark-circle'
    }
    
    switch (type) {
      case 'form_assignment': return 'document-text'
      case 'task_assignment': return 'checkmark-circle'
      case 'announcement': return 'megaphone'
      case 'reminder': return 'alarm'
      case 'system': return 'settings'
      case 'attendance': return 'time'
      default: return 'notifications'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return '#ef4444'
      case 'high': return '#f97316'
      case 'normal': return '#3b82f6'
      case 'low': return '#6b7280'
      default: return '#6b7280'
    }
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffHours / 24)

    if (diffHours < 1) return 'Just now'
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  if (showSettings) {
    return (
      <View style={styles.container}>
        <StatusBar style="light" />
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setShowSettings(false)}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Notification Settings</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView style={styles.content}>
          <View style={styles.settingsSection}>
            <Text style={styles.sectionTitle}>Notification Types</Text>
            
            {[
              { key: 'form_assignment' as const, label: 'Form Assignments', icon: 'document-text' },
              { key: 'task_assignment' as const, label: 'Task Assignments', icon: 'checkmark-circle' },
              { key: 'announcement' as const, label: 'Announcements', icon: 'megaphone' },
              { key: 'reminder' as const, label: 'Reminders', icon: 'alarm' },
              { key: 'system' as const, label: 'System Notifications', icon: 'settings' },
            ].map((item) => (
              <View key={item.key} style={styles.settingItem}>
                <View style={styles.settingInfo}>
                  <Ionicons name={item.icon as any} size={20} color="#6b7280" />
                  <Text style={styles.settingLabel}>{item.label}</Text>
                </View>
                <Switch
                  value={settings?.[item.key] || false}
                  onValueChange={(value) => updateSetting(item.key, value)}
                  trackColor={{ false: '#d1d5db', true: '#3b82f6' }}
                  thumbColor={settings?.[item.key] ? '#ffffff' : '#f3f4f6'}
                />
              </View>
            ))}
          </View>

          <View style={styles.settingsSection}>
            <Text style={styles.sectionTitle}>Preferences</Text>
            
            {[
              { key: 'push_enabled' as const, label: 'Push Notifications', icon: 'notifications' },
              { key: 'sound_enabled' as const, label: 'Sound', icon: 'volume-high' },
              { key: 'vibration_enabled' as const, label: 'Vibration', icon: 'phone-portrait' },
              { key: 'quiet_hours_enabled' as const, label: 'Quiet Hours (22:00 - 08:00)', icon: 'moon' },
            ].map((item) => (
              <View key={item.key} style={styles.settingItem}>
                <View style={styles.settingInfo}>
                  <Ionicons name={item.icon as any} size={20} color="#6b7280" />
                  <Text style={styles.settingLabel}>{item.label}</Text>
                </View>
                <Switch
                  value={settings?.[item.key] || false}
                  onValueChange={(value) => updateSetting(item.key, value)}
                  trackColor={{ false: '#d1d5db', true: '#3b82f6' }}
                  thumbColor={settings?.[item.key] ? '#ffffff' : '#f3f4f6'}
                />
              </View>
            ))}
          </View>

          <View style={styles.settingsSection}>
            <Text style={styles.sectionTitle}>Actions</Text>
            
            <TouchableOpacity 
              style={[styles.settingItem, styles.actionItem]}
              onPress={clearAllNotifications}
            >
              <View style={styles.settingInfo}>
                <Ionicons name="trash" size={20} color="#ef4444" />
                <Text style={[styles.settingLabel, { color: '#ef4444' }]}>
                  Clear All Notifications
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#6b7280" />
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Notifications</Text>
          <Text style={styles.headerSubtitle}>
            {notifications.filter(n => !n.read).length} unread
          </Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={() => setShowSettings(true)}
          >
            <Ionicons name="settings-outline" size={24} color="white" />
          </TouchableOpacity>
          {notifications.length > 0 && (
            <TouchableOpacity 
              style={styles.headerButton}
              onPress={clearAllNotifications}
            >
              <Ionicons name="trash-outline" size={24} color="white" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Notifications List */}
      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {notifications.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="notifications-outline" size={64} color="#d1d5db" />
            <Text style={styles.emptyText}>No notifications</Text>
            <Text style={styles.emptySubtext}>
              You'll receive notifications for forms, tasks, and announcements here
            </Text>
          </View>
        ) : (
          <View style={styles.notificationsList}>
            {notifications.map((notification) => (
              <TouchableOpacity
                key={notification.id}
                style={[
                  styles.notificationCard,
                  !notification.read && styles.unreadCard
                ]}
                onPress={() => handleNotificationPress(notification)}
              >
                <View style={styles.notificationHeader}>
                  <View style={styles.notificationMeta}>
                    <View style={styles.iconContainer}>
                      <Ionicons 
                        name={getNotificationIcon(notification.type, notification.data) as any} 
                        size={16} 
                        color={getPriorityColor(notification.priority)} 
                      />
                    </View>
                    <View 
                      style={[
                        styles.priorityDot, 
                        { backgroundColor: getPriorityColor(notification.priority) }
                      ]} 
                    />
                    <Text style={styles.timeText}>
                      {formatTime(notification.received_at)}
                    </Text>
                  </View>
                  {!notification.read && <View style={styles.unreadDot} />}
                </View>
                
                <Text style={styles.notificationTitle}>{notification.title}</Text>
                <Text style={styles.notificationBody}>{notification.body}</Text>
                
                <View style={styles.notificationFooter}>
                  <Text style={styles.typeText}>
                    {notification.type.replace('_', ' ').toUpperCase()}
                  </Text>
                  <Ionicons name="chevron-forward" size={16} color="#9ca3af" />
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
    fontSize: 14,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 12,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    fontSize: 18,
    color: '#9ca3af',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    paddingHorizontal: 40,
    lineHeight: 20,
  },
  notificationsList: {
    gap: 12,
  },
  notificationCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  unreadCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  notificationMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  priorityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  timeText: {
    fontSize: 12,
    color: '#6b7280',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3b82f6',
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  notificationBody: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
    marginBottom: 12,
  },
  notificationFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  typeText: {
    fontSize: 10,
    color: '#9ca3af',
    fontWeight: '500',
  },
  settingsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  settingItem: {
    backgroundColor: 'white',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingLabel: {
    fontSize: 16,
    color: '#111827',
  },
  actionItem: {
    borderWidth: 1,
    borderColor: '#fecaca',
    backgroundColor: '#fef2f2',
  },
  bottomSpacing: {
    height: 100,
  },
})