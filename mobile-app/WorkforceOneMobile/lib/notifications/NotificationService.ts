import * as Notifications from 'expo-notifications'
import * as Device from 'expo-device'
import Constants from 'expo-constants'
import { Platform } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { supabase } from '../supabase'

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
})

export interface NotificationPayload {
  id: string
  title: string
  body: string
  data?: Record<string, any>
  type: 'form_assignment' | 'task_assignment' | 'announcement' | 'reminder' | 'system'
  priority: 'low' | 'normal' | 'high' | 'urgent'
  scheduled_for?: string
}

export class NotificationService {
  private static pushToken: string | null = null
  private static userId: string | null = null
  private static organizationId: string | null = null

  /**
   * Initialize notification service
   */
  static async initialize(userId: string, organizationId: string): Promise<void> {
    this.userId = userId
    this.organizationId = organizationId

    try {
      // Request permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync()
      let finalStatus = existingStatus
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync()
        finalStatus = status
      }

      if (finalStatus !== 'granted') {
        console.warn('Notification permissions not granted')
        return
      }

      // Get push token
      if (Device.isDevice) {
        const token = await this.getPushToken()
        if (token) {
          await this.registerTokenWithServer(token, userId, organizationId)
        }
      }

      // Set up notification listeners
      this.setupNotificationListeners()

      // Set up real-time subscription for new notifications
      this.setupRealtimeSubscription()

    } catch (error) {
      console.error('Error initializing notifications:', error)
    }
  }

  /**
   * Get push notification token
   */
  private static async getPushToken(): Promise<string | null> {
    try {
      const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId
      
      if (!projectId) {
        console.warn('No project ID found for push notifications')
        return null
      }

      const token = await Notifications.getExpoPushTokenAsync({ projectId })
      this.pushToken = token.data
      
      // Store token locally
      await AsyncStorage.setItem('pushToken', token.data)
      
      return token.data
    } catch (error) {
      console.error('Error getting push token:', error)
      return null
    }
  }

  /**
   * Register push token with server
   */
  private static async registerTokenWithServer(
    token: string, 
    userId: string, 
    organizationId: string
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('device_tokens')
        .upsert({
          user_id: userId,
          organization_id: organizationId,
          token: token,
          platform: Platform.OS,
          device_info: {
            model: Device.modelName,
            osVersion: Device.osVersion,
            brand: Device.brand
          },
          is_active: true,
          last_used: new Date().toISOString()
        }, {
          onConflict: 'user_id,token'
        })

      if (error) {
        console.error('Error registering push token:', error)
      }
    } catch (error) {
      console.error('Error registering token with server:', error)
    }
  }

  /**
   * Setup notification listeners
   */
  private static setupNotificationListeners(): void {
    // Handle notification received while app is running
    Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received:', notification)
      this.handleNotificationReceived(notification)
    })

    // Handle notification tapped
    Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification tapped:', response)
      this.handleNotificationTapped(response)
    })
  }

  /**
   * Setup real-time subscription for new notifications
   */
  private static setupRealtimeSubscription(): void {
    if (!this.userId || !this.organizationId) return

    supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${this.userId}`
        },
        (payload) => {
          console.log('New notification received:', payload)
          this.handleRealtimeNotification(payload.new)
        }
      )
      .subscribe()
  }

  /**
   * Handle notification received while app is running
   */
  private static async handleNotificationReceived(notification: Notifications.Notification): Promise<void> {
    const { content } = notification.request
    
    // Store notification locally
    await this.storeNotificationLocally({
      id: notification.request.identifier,
      title: content.title || '',
      body: content.body || '',
      data: content.data || {},
      type: content.data?.type || 'system',
      priority: content.data?.priority || 'normal',
      received_at: new Date().toISOString()
    })

    // Update badge count
    await this.updateBadgeCount()
  }

  /**
   * Handle notification tapped
   */
  private static handleNotificationTapped(response: Notifications.NotificationResponse): void {
    const data = response.notification.request.content.data
    
    // Navigate based on notification type
    if (data?.type === 'form_assignment' && data?.formId) {
      // Navigate to forms screen or specific form
      console.log('Navigate to form:', data.formId)
    } else if (data?.type === 'task_assignment' && data?.taskId) {
      // Navigate to tasks screen or specific task
      console.log('Navigate to task:', data.taskId)
    }
  }

  /**
   * Handle real-time notification
   */
  private static async handleRealtimeNotification(notification: any): Promise<void> {
    // Show local notification if app is in foreground
    await Notifications.scheduleNotificationAsync({
      content: {
        title: notification.title,
        body: notification.body,
        data: notification.data || {},
        sound: notification.priority === 'urgent' ? 'default' : undefined
      },
      trigger: null // Show immediately
    })
  }

  /**
   * Store notification locally
   */
  private static async storeNotificationLocally(notification: any): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem('local_notifications')
      const notifications = stored ? JSON.parse(stored) : []
      
      notifications.unshift(notification)
      
      // Keep only last 100 notifications
      if (notifications.length > 100) {
        notifications.splice(100)
      }
      
      await AsyncStorage.setItem('local_notifications', JSON.stringify(notifications))
    } catch (error) {
      console.error('Error storing notification locally:', error)
    }
  }

  /**
   * Get local notifications
   */
  static async getLocalNotifications(): Promise<any[]> {
    try {
      const stored = await AsyncStorage.getItem('local_notifications')
      return stored ? JSON.parse(stored) : []
    } catch (error) {
      console.error('Error getting local notifications:', error)
      return []
    }
  }

  /**
   * Send push notification (server-side function)
   */
  static async sendNotification(payload: NotificationPayload): Promise<void> {
    try {
      const { error } = await supabase.rpc('send_push_notification', {
        notification_data: payload
      })

      if (error) {
        console.error('Error sending notification:', error)
      }
    } catch (error) {
      console.error('Error in sendNotification:', error)
    }
  }

  /**
   * Schedule local notification
   */
  static async scheduleLocalNotification(
    title: string,
    body: string,
    trigger: Notifications.NotificationTriggerInput,
    data?: Record<string, any>
  ): Promise<string> {
    try {
      const identifier = await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: data || {}
        },
        trigger
      })
      
      return identifier
    } catch (error) {
      console.error('Error scheduling local notification:', error)
      throw error
    }
  }

  /**
   * Cancel scheduled notification
   */
  static async cancelNotification(identifier: string): Promise<void> {
    try {
      await Notifications.cancelScheduledNotificationAsync(identifier)
    } catch (error) {
      console.error('Error cancelling notification:', error)
    }
  }

  /**
   * Update badge count
   */
  private static async updateBadgeCount(): Promise<void> {
    try {
      const notifications = await this.getLocalNotifications()
      const unreadCount = notifications.filter(n => !n.read).length
      
      await Notifications.setBadgeCountAsync(unreadCount)
    } catch (error) {
      console.error('Error updating badge count:', error)
    }
  }

  /**
   * Mark notification as read
   */
  static async markAsRead(notificationId: string): Promise<void> {
    try {
      const notifications = await this.getLocalNotifications()
      const updated = notifications.map(n => 
        n.id === notificationId ? { ...n, read: true } : n
      )
      
      await AsyncStorage.setItem('local_notifications', JSON.stringify(updated))
      await this.updateBadgeCount()
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  /**
   * Clear all notifications
   */
  static async clearAllNotifications(): Promise<void> {
    try {
      await AsyncStorage.removeItem('local_notifications')
      await Notifications.setBadgeCountAsync(0)
    } catch (error) {
      console.error('Error clearing notifications:', error)
    }
  }

  /**
   * Get notification settings
   */
  static async getNotificationSettings(): Promise<Record<string, boolean>> {
    try {
      const settings = await AsyncStorage.getItem('notification_settings')
      return settings ? JSON.parse(settings) : {
        forms: true,
        tasks: true,
        announcements: true,
        reminders: true,
        system: true
      }
    } catch (error) {
      console.error('Error getting notification settings:', error)
      return {}
    }
  }

  /**
   * Update notification settings
   */
  static async updateNotificationSettings(settings: Record<string, boolean>): Promise<void> {
    try {
      await AsyncStorage.setItem('notification_settings', JSON.stringify(settings))
    } catch (error) {
      console.error('Error updating notification settings:', error)
    }
  }
}