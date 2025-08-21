import * as Notifications from 'expo-notifications'
import * as Device from 'expo-device'
import { Platform } from 'react-native'

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
})

export interface NotificationData {
  title: string
  body: string
  data?: any
}

class NotificationService {
  private expoPushToken: string | null = null

  async initialize() {
    // Request permissions
    const { status } = await Notifications.requestPermissionsAsync()
    
    if (status !== 'granted') {
      console.log('Push notification permissions not granted')
      return false
    }

    // Get push token
    if (Device.isDevice) {
      try {
        const token = await Notifications.getExpoPushTokenAsync({
          projectId: 'e450cb6a-8add-4ce0-b2a4-f513cce316ee',
        })
        this.expoPushToken = token.data
        console.log('✅ Expo push token obtained:', this.expoPushToken)
        return true
      } catch (error) {
        console.warn('⚠️ Push notifications not available in Expo Go (SDK 53+)')
        console.log('ℹ️ Push notifications require a development build')
        console.log('ℹ️ In-app notifications and real-time updates still work!')
        
        // Still return true so other notification features work
        return true
      }
    } else {
      console.log('Must use physical device for push notifications')
      return false
    }
  }

  async scheduleLocalNotification(notification: NotificationData, delaySeconds: number = 0) {
    try {
      const identifier = await Notifications.scheduleNotificationAsync({
        content: {
          title: notification.title,
          body: notification.body,
          data: notification.data || {},
        },
        trigger: delaySeconds > 0 ? { seconds: delaySeconds } : null,
      })
      return identifier
    } catch (error) {
      console.error('Error scheduling notification:', error)
      return null
    }
  }

  async sendPushNotification(notification: NotificationData) {
    if (!this.expoPushToken) {
      console.log('No push token available')
      return false
    }

    try {
      const message = {
        to: this.expoPushToken,
        sound: 'default',
        title: notification.title,
        body: notification.body,
        data: notification.data || {},
      }

      const response = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Accept-encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
      })

      const result = await response.json()
      console.log('Push notification sent:', result)
      return true
    } catch (error) {
      console.error('Error sending push notification:', error)
      return false
    }
  }

  // Work-specific notification helpers
  async notifyClockIn() {
    return this.scheduleLocalNotification({
      title: 'Work Started',
      body: 'You have successfully clocked in. Have a productive day!',
      data: { type: 'clock_in' },
    })
  }

  async notifyClockOut(workHours: number) {
    return this.scheduleLocalNotification({
      title: 'Work Completed',
      body: `You have clocked out. Total work time: ${workHours.toFixed(1)} hours`,
      data: { type: 'clock_out', workHours },
    })
  }

  async notifyTaskCreated(taskTitle: string) {
    return this.scheduleLocalNotification({
      title: 'New Task Created',
      body: `Task "${taskTitle}" has been created`,
      data: { type: 'task_created', taskTitle },
    })
  }

  async notifyTaskAssigned(taskTitle: string, assignedBy?: string, priority?: string, dueDate?: string) {
    const priorityText = priority && priority !== 'medium' ? ` (${priority.toUpperCase()})` : ''
    const dueDateText = dueDate ? ` Due: ${dueDate}` : ''
    const assignerText = assignedBy ? ` by ${assignedBy}` : ''
    
    return this.scheduleLocalNotification({
      title: `New Task Assignment${priorityText}`,
      body: `You've been assigned: "${taskTitle}"${assignerText}.${dueDateText}`,
      data: { 
        type: 'task_assignment',
        taskTitle,
        assignedBy,
        priority,
        dueDate
      },
    })
  }

  async notifyTaskReassigned(taskTitle: string, assignedBy?: string) {
    return this.scheduleLocalNotification({
      title: 'Task Reassigned',
      body: `"${taskTitle}" has been reassigned to you${assignedBy ? ` by ${assignedBy}` : ''}`,
      data: { 
        type: 'task_reassigned',
        taskTitle,
        assignedBy
      },
    })
  }

  async notifyTaskUnassigned(taskTitle: string) {
    return this.scheduleLocalNotification({
      title: 'Task Reassigned',
      body: `"${taskTitle}" has been reassigned to someone else`,
      data: { 
        type: 'task_unassigned',
        taskTitle
      },
    })
  }

  async notifyTaskPriorityChanged(taskTitle: string, newPriority: string, oldPriority: string) {
    return this.scheduleLocalNotification({
      title: 'Task Priority Updated',
      body: `"${taskTitle}" priority changed from ${oldPriority.toUpperCase()} to ${newPriority.toUpperCase()}`,
      data: { 
        type: 'task_priority_changed',
        taskTitle,
        newPriority,
        oldPriority
      },
    })
  }

  async notifyTaskDueDateChanged(taskTitle: string, newDueDate: string, oldDueDate?: string) {
    const changeText = oldDueDate ? `changed to ${newDueDate}` : `set to ${newDueDate}`
    return this.scheduleLocalNotification({
      title: 'Task Due Date Updated',
      body: `"${taskTitle}" due date ${changeText}`,
      data: { 
        type: 'task_due_date_changed',
        taskTitle,
        newDueDate,
        oldDueDate
      },
    })
  }

  async notifyTaskDueTomorrow(taskTitle: string, priority?: string) {
    return this.scheduleLocalNotification({
      title: '⏰ Task Due Tomorrow',
      body: `Reminder: "${taskTitle}" is due tomorrow${priority && priority !== 'medium' ? ` (${priority.toUpperCase()})` : ''}`,
      data: { 
        type: 'task_due_tomorrow',
        taskTitle,
        priority
      },
    })
  }

  async notifyTaskOverdue(taskTitle: string, daysOverdue: number) {
    return this.scheduleLocalNotification({
      title: '🚨 Overdue Task',
      body: `"${taskTitle}" is ${daysOverdue} day${daysOverdue > 1 ? 's' : ''} overdue`,
      data: { 
        type: 'task_overdue',
        taskTitle,
        daysOverdue
      },
    })
  }

  async notifyTaskCompleted(taskTitle: string, completedBy?: string) {
    const completedByText = completedBy ? ` by ${completedBy}` : ''
    return this.scheduleLocalNotification({
      title: 'Task Completed ✅',
      body: `"${taskTitle}" has been completed${completedByText}`,
      data: { 
        type: 'task_completed',
        taskTitle,
        completedBy
      },
    })
  }

  async notifyProjectUpdate(projectName: string, status: string) {
    return this.scheduleLocalNotification({
      title: 'Project Updated',
      body: `${projectName} status changed to ${status}`,
      data: { type: 'project_update', projectName, status },
    })
  }

  async notifyBreakReminder() {
    return this.scheduleLocalNotification({
      title: 'Break Reminder',
      body: "You've been working for a while. Consider taking a break!",
      data: { type: 'break_reminder' },
    }, 7200) // 2 hours
  }

  async notifyEndOfDay() {
    return this.scheduleLocalNotification({
      title: 'End of Workday',
      body: "Don't forget to clock out and log your time for today",
      data: { type: 'end_of_day' },
    })
  }

  async cancelAllNotifications() {
    await Notifications.cancelAllScheduledNotificationsAsync()
  }

  async cancelNotification(identifier: string) {
    await Notifications.cancelScheduledNotificationAsync(identifier)
  }

  getExpoPushToken() {
    return this.expoPushToken
  }

  // Register device token with backend
  async registerDeviceToken(supabase: any, userId: string, organizationId: string) {
    if (!this.expoPushToken) {
      console.log('ℹ️ No push token available - push notifications disabled')
      console.log('ℹ️ In-app notifications will still work perfectly!')
      return true // Return true to allow other features to continue
    }

    try {
      // First, try to find existing record
      const { data: existingToken, error: selectError } = await supabase
        .from('device_tokens')
        .select('*')
        .eq('user_id', userId)
        .eq('token', this.expoPushToken)
        .single()

      const tokenData = {
        user_id: userId,
        organization_id: organizationId,
        token: this.expoPushToken,
        platform: Platform.OS,
        device_info: {
          device_name: Device.deviceName,
          device_model: Device.modelName,
          os_version: Device.osVersion,
        },
        is_active: true,
        last_used: new Date().toISOString()
      }

      let result
      if (existingToken) {
        // Update existing record
        result = await supabase
          .from('device_tokens')
          .update(tokenData)
          .eq('id', existingToken.id)
      } else {
        // Insert new record
        result = await supabase
          .from('device_tokens')
          .insert(tokenData)
      }

      if (result.error) {
        console.error('Error registering device token:', result.error)
        return false
      }

      console.log('Device token registered successfully')
      return true
    } catch (error) {
      console.error('Error registering device token:', error)
      return false
    }
  }

  // Process notification from database
  async processNotificationFromDatabase(notificationData: any) {
    const { type, title, message, metadata, priority } = notificationData
    
    try {
      // Show local notification
      await this.scheduleLocalNotification({
        title,
        body: message,
        data: {
          ...metadata,
          notification_id: notificationData.id,
          type,
          priority
        }
      })
      
      return true
    } catch (error) {
      console.error('Error processing notification:', error)
      return false
    }
  }

  // Listen for notifications from database
  async setupDatabaseNotificationListener(supabase: any, userId: string) {
    try {
      // Subscribe to notifications for the current user
      const subscription = supabase
        .channel('notifications')
        .on('postgres_changes', 
          { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'notifications',
            filter: `recipient_id=eq.${userId}`
          }, 
          (payload: any) => {
            console.log('New notification received:', payload.new)
            this.processNotificationFromDatabase(payload.new)
          }
        )
        .subscribe()

      return subscription
    } catch (error) {
      console.error('Error setting up notification listener:', error)
      return null
    }
  }

  // Fetch unread notifications from database
  async fetchUnreadNotifications(supabase: any, userId: string) {
    try {
      const { data: notifications, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('recipient_id', userId)
        .eq('is_read', false)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) {
        console.error('Error fetching notifications:', error)
        return []
      }

      return notifications || []
    } catch (error) {
      console.error('Error fetching notifications:', error)
      return []
    }
  }

  // Mark notification as read
  async markNotificationAsRead(supabase: any, notificationId: string) {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ 
          is_read: true
        })
        .eq('id', notificationId)

      if (error) {
        console.error('Error marking notification as read:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Error marking notification as read:', error)
      return false
    }
  }

  // Get notification count
  async getUnreadNotificationCount(supabase: any, userId: string) {
    try {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('recipient_id', userId)
        .eq('is_read', false)

      if (error) {
        console.error('Error getting notification count:', error)
        return 0
      }

      return count || 0
    } catch (error) {
      console.error('Error getting notification count:', error)
      return 0
    }
  }

  // Set up notification response listeners
  setNotificationResponseListener(handler: (response: Notifications.NotificationResponse) => void) {
    return Notifications.addNotificationResponseReceivedListener(handler)
  }

  setNotificationReceivedListener(handler: (notification: Notifications.Notification) => void) {
    return Notifications.addNotificationReceivedListener(handler)
  }
}

export const notificationService = new NotificationService()

// iOS specific configuration
if (Platform.OS === 'ios') {
  Notifications.setNotificationChannelAsync('default', {
    name: 'default',
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#FF231F7C',
  })
}

// Android specific configuration
if (Platform.OS === 'android') {
  Notifications.setNotificationChannelAsync('work', {
    name: 'Work Notifications',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#3B82F6',
    description: 'Notifications related to work activities',
  })

  Notifications.setNotificationChannelAsync('tasks', {
    name: 'Task Notifications',
    importance: Notifications.AndroidImportance.DEFAULT,
    vibrationPattern: [0, 250],
    lightColor: '#10B981',
    description: 'Notifications for task updates',
  })

  Notifications.setNotificationChannelAsync('reminders', {
    name: 'Reminders',
    importance: Notifications.AndroidImportance.DEFAULT,
    vibrationPattern: [0, 150, 150, 150],
    lightColor: '#F59E0B',
    description: 'Break and work reminders',
  })
}