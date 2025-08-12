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
          projectId: 'your-expo-project-id', // Replace with your Expo project ID
        })
        this.expoPushToken = token.data
        console.log('Expo push token:', this.expoPushToken)
        return true
      } catch (error) {
        console.error('Error getting push token:', error)
        return false
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

  async notifyTaskCompleted(taskTitle: string) {
    return this.scheduleLocalNotification({
      title: 'Task Completed',
      body: `Great job! You completed "${taskTitle}"`,
      data: { type: 'task_completed', taskTitle },
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