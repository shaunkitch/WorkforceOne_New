import AsyncStorage from '@react-native-async-storage/async-storage'

export interface NotificationPreferences {
  task_assignment: boolean
  form_assignment: boolean
  announcement: boolean
  reminder: boolean
  system: boolean
  push_enabled: boolean
  sound_enabled: boolean
  vibration_enabled: boolean
  quiet_hours_enabled: boolean
  quiet_hours_start: string // HH:MM format
  quiet_hours_end: string // HH:MM format
}

const NOTIFICATION_PREFERENCES_KEY = 'notification_preferences'

const defaultPreferences: NotificationPreferences = {
  task_assignment: true,
  form_assignment: true,
  announcement: true,
  reminder: true,
  system: true,
  push_enabled: true,
  sound_enabled: true,
  vibration_enabled: true,
  quiet_hours_enabled: false,
  quiet_hours_start: '22:00',
  quiet_hours_end: '08:00'
}

export class NotificationPreferencesService {
  static async getPreferences(): Promise<NotificationPreferences> {
    try {
      const preferences = await AsyncStorage.getItem(NOTIFICATION_PREFERENCES_KEY)
      if (preferences) {
        const parsed = JSON.parse(preferences)
        // Merge with defaults to ensure all keys exist
        return { ...defaultPreferences, ...parsed }
      }
      return defaultPreferences
    } catch (error) {
      console.error('Error getting notification preferences:', error)
      return defaultPreferences
    }
  }

  static async updatePreferences(preferences: Partial<NotificationPreferences>): Promise<boolean> {
    try {
      const currentPreferences = await this.getPreferences()
      const updatedPreferences = { ...currentPreferences, ...preferences }
      
      await AsyncStorage.setItem(
        NOTIFICATION_PREFERENCES_KEY, 
        JSON.stringify(updatedPreferences)
      )
      
      return true
    } catch (error) {
      console.error('Error updating notification preferences:', error)
      return false
    }
  }

  static async resetToDefaults(): Promise<boolean> {
    try {
      await AsyncStorage.setItem(
        NOTIFICATION_PREFERENCES_KEY, 
        JSON.stringify(defaultPreferences)
      )
      return true
    } catch (error) {
      console.error('Error resetting notification preferences:', error)
      return false
    }
  }

  static isInQuietHours(preferences: NotificationPreferences): boolean {
    if (!preferences.quiet_hours_enabled) {
      return false
    }

    const now = new Date()
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
    
    const { quiet_hours_start, quiet_hours_end } = preferences
    
    // Handle same day quiet hours (e.g., 22:00 - 23:59)
    if (quiet_hours_start <= quiet_hours_end) {
      return currentTime >= quiet_hours_start && currentTime <= quiet_hours_end
    }
    
    // Handle overnight quiet hours (e.g., 22:00 - 08:00)
    return currentTime >= quiet_hours_start || currentTime <= quiet_hours_end
  }

  static shouldShowNotification(
    preferences: NotificationPreferences, 
    notificationType: keyof Pick<NotificationPreferences, 'task_assignment' | 'form_assignment' | 'announcement' | 'reminder' | 'system'>
  ): boolean {
    // Check if push notifications are enabled
    if (!preferences.push_enabled) {
      return false
    }

    // Check if specific notification type is enabled
    if (!preferences[notificationType]) {
      return false
    }

    // Check quiet hours
    if (this.isInQuietHours(preferences)) {
      return false
    }

    return true
  }

  static getNotificationConfig(preferences: NotificationPreferences) {
    return {
      sound: preferences.sound_enabled ? 'default' : null,
      vibrate: preferences.vibration_enabled ? [0, 250, 250, 250] : false,
      priority: 'high' as const,
    }
  }
}