import * as SecureStore from 'expo-secure-store'
import AsyncStorage from '@react-native-async-storage/async-storage'

const SECURE_KEYS = {
  AUTH_TOKEN: 'global_admin_token',
  USER_EMAIL: 'global_admin_email',
} as const

const STORAGE_KEYS = {
  USER_PREFERENCES: 'user_preferences',
  CACHE_DATA: 'cache_data',
} as const

// Secure storage for sensitive data
export const secureStorage = {
  async setItem(key: keyof typeof SECURE_KEYS, value: string): Promise<void> {
    await SecureStore.setItemAsync(SECURE_KEYS[key], value)
  },

  async getItem(key: keyof typeof SECURE_KEYS): Promise<string | null> {
    return await SecureStore.getItemAsync(SECURE_KEYS[key])
  },

  async removeItem(key: keyof typeof SECURE_KEYS): Promise<void> {
    await SecureStore.deleteItemAsync(SECURE_KEYS[key])
  },

  async clear(): Promise<void> {
    for (const key of Object.values(SECURE_KEYS)) {
      await SecureStore.deleteItemAsync(key)
    }
  }
}

// Regular storage for non-sensitive data
export const storage = {
  async setItem(key: keyof typeof STORAGE_KEYS, value: any): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS[key], JSON.stringify(value))
  },

  async getItem(key: keyof typeof STORAGE_KEYS): Promise<any> {
    const value = await AsyncStorage.getItem(STORAGE_KEYS[key])
    return value ? JSON.parse(value) : null
  },

  async removeItem(key: keyof typeof STORAGE_KEYS): Promise<void> {
    await AsyncStorage.removeItem(STORAGE_KEYS[key])
  },

  async clear(): Promise<void> {
    await AsyncStorage.clear()
  }
}

// Auth storage helpers
export const authStorage = {
  async saveSession(token: string, email: string): Promise<void> {
    await secureStorage.setItem('AUTH_TOKEN', token)
    await secureStorage.setItem('USER_EMAIL', email)
  },

  async getSession(): Promise<{ token: string | null; email: string | null }> {
    const token = await secureStorage.getItem('AUTH_TOKEN')
    const email = await secureStorage.getItem('USER_EMAIL')
    return { token, email }
  },

  async clearSession(): Promise<void> {
    await secureStorage.removeItem('AUTH_TOKEN')
    await secureStorage.removeItem('USER_EMAIL')
  }
}