import { createClient } from '@/lib/supabase/client'

export interface CreateNotificationParams {
  userId: string
  title: string
  message: string
  type?: 'info' | 'success' | 'warning' | 'error'
  priority?: 'low' | 'medium' | 'high'
  actionUrl?: string
  metadata?: any
  expiresAt?: string
}

export interface EmailNotificationParams {
  to: string
  subject: string
  template: string
  data: any
}

class NotificationService {
  private supabase = createClient()

  // Create in-app notification
  async createNotification(params: CreateNotificationParams) {
    try {
      const { data, error } = await this.supabase
        .from('notifications')
        .insert({
          user_id: params.userId,
          title: params.title,
          message: params.message,
          type: params.type || 'info',
          priority: params.priority || 'medium',
          action_url: params.actionUrl,
          metadata: params.metadata,
          expires_at: params.expiresAt,
          is_read: false
        })
        .select()
        .single()

      if (error) throw error

      // Show browser notification if permission granted
      if (Notification.permission === 'granted') {
        new Notification(params.title, {
          body: params.message,
          icon: '/favicon.ico',
          badge: '/favicon.ico'
        })
      }

      return data
    } catch (error) {
      console.error('Error creating notification:', error)
      throw error
    }
  }

  // Send email notification (would need backend API endpoint)
  async sendEmailNotification(params: EmailNotificationParams) {
    try {
      // This would typically call a backend API endpoint or use a service like Resend/SendGrid
      const response = await fetch('/api/notifications/email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(params)
      })

      if (!response.ok) {
        throw new Error('Failed to send email notification')
      }

      return response.json()
    } catch (error) {
      console.error('Error sending email notification:', error)
      throw error
    }
  }

  // Bulk create notifications for multiple users
  async createBulkNotifications(userIds: string[], notificationData: Omit<CreateNotificationParams, 'userId'>) {
    try {
      const notifications = userIds.map(userId => ({
        user_id: userId,
        title: notificationData.title,
        message: notificationData.message,
        type: notificationData.type || 'info',
        priority: notificationData.priority || 'medium',
        action_url: notificationData.actionUrl,
        metadata: notificationData.metadata,
        expires_at: notificationData.expiresAt,
        is_read: false
      }))

      const { data, error } = await this.supabase
        .from('notifications')
        .insert(notifications)
        .select()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error creating bulk notifications:', error)
      throw error
    }
  }

  // Create system-wide notification
  async createSystemNotification(notificationData: Omit<CreateNotificationParams, 'userId'>) {
    try {
      // Get all active users
      const { data: users, error: usersError } = await this.supabase
        .from('profiles')
        .select('id')
        .eq('is_active', true)

      if (usersError) throw usersError

      const userIds = users?.map(user => user.id) || []
      return this.createBulkNotifications(userIds, notificationData)
    } catch (error) {
      console.error('Error creating system notification:', error)
      throw error
    }
  }

  // Predefined notification templates
  async notifyTimeEntryReminder(userId: string) {
    return this.createNotification({
      userId,
      title: 'Time Entry Reminder',
      message: 'Don\'t forget to log your time for today!',
      type: 'info',
      priority: 'medium',
      actionUrl: '/dashboard/time'
    })
  }

  async notifyProjectDeadline(userId: string, projectName: string, daysLeft: number) {
    return this.createNotification({
      userId,
      title: 'Project Deadline Approaching',
      message: `Project "${projectName}" is due in ${daysLeft} days`,
      type: 'warning',
      priority: 'high',
      actionUrl: '/dashboard/projects',
      metadata: { projectName, daysLeft }
    })
  }

  async notifyTaskAssignment(userId: string, taskTitle: string, assignedBy: string) {
    return this.createNotification({
      userId,
      title: 'New Task Assigned',
      message: `You have been assigned the task "${taskTitle}" by ${assignedBy}`,
      type: 'info',
      priority: 'medium',
      actionUrl: '/dashboard/tasks',
      metadata: { taskTitle, assignedBy }
    })
  }

  async notifyLeaveRequestStatus(userId: string, status: string, requestDates: string) {
    const isApproved = status === 'approved'
    return this.createNotification({
      userId,
      title: `Leave Request ${status.charAt(0).toUpperCase() + status.slice(1)}`,
      message: `Your leave request for ${requestDates} has been ${status}`,
      type: isApproved ? 'success' : 'warning',
      priority: 'high',
      actionUrl: '/dashboard/leave'
    })
  }

  async notifyAttendanceAlert(userId: string, type: 'late' | 'absent' | 'early_departure') {
    const messages = {
      late: 'You were marked as late today',
      absent: 'You were marked as absent today',
      early_departure: 'Early departure was recorded today'
    }

    return this.createNotification({
      userId,
      title: 'Attendance Alert',
      message: messages[type],
      type: type === 'absent' ? 'error' : 'warning',
      priority: 'medium',
      actionUrl: '/dashboard/attendance'
    })
  }

  async notifyTeamUpdate(userId: string, updateType: string, details: string) {
    return this.createNotification({
      userId,
      title: 'Team Update',
      message: `${updateType}: ${details}`,
      type: 'info',
      priority: 'low',
      actionUrl: '/dashboard/teams'
    })
  }

  // Clean up expired notifications
  async cleanupExpiredNotifications() {
    try {
      const { error } = await this.supabase
        .from('notifications')
        .delete()
        .lt('expires_at', new Date().toISOString())

      if (error) throw error
      console.log('Expired notifications cleaned up')
    } catch (error) {
      console.error('Error cleaning up expired notifications:', error)
    }
  }

  // Get notification preferences for a user
  async getNotificationPreferences(userId: string) {
    try {
      const { data, error } = await this.supabase
        .from('profiles')
        .select('settings')
        .eq('id', userId)
        .single()

      if (error) throw error
      
      return data?.settings?.notifications || {
        email: true,
        push: true,
        inApp: true,
        types: {
          tasks: true,
          projects: true,
          attendance: true,
          leave: true,
          system: true
        }
      }
    } catch (error) {
      console.error('Error getting notification preferences:', error)
      return null
    }
  }

  // Update notification preferences
  async updateNotificationPreferences(userId: string, preferences: any) {
    try {
      const { data: currentProfile, error: fetchError } = await this.supabase
        .from('profiles')
        .select('settings')
        .eq('id', userId)
        .single()

      if (fetchError) throw fetchError

      const updatedSettings = {
        ...currentProfile.settings,
        notifications: preferences
      }

      const { data, error } = await this.supabase
        .from('profiles')
        .update({ settings: updatedSettings })
        .eq('id', userId)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error updating notification preferences:', error)
      throw error
    }
  }
}

export const notificationService = new NotificationService()