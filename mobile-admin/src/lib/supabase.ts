import { createClient } from '@supabase/supabase-js'
import { Config } from '../config/config'

// Client for browser use
export const supabase = createClient(Config.supabase.url, Config.supabase.anonKey)

// Admin client with service role for server-side operations
export const supabaseAdmin = createClient(Config.supabase.url, Config.supabase.serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Global admin authentication
export interface GlobalAdminAuth {
  isAuthenticated: boolean
  sessionExpiry?: Date
  email?: string
}

export function isGlobalAdmin(email: string): boolean {
  return Config.admin.allowedEmails.includes(email.toLowerCase())
}

export function validateAdminSession(token: string): boolean {
  return token === Config.admin.secret
}

// Auth helper functions
export const auth = {
  async signIn(email: string, password: string): Promise<{ success: boolean; error?: string; token?: string }> {
    try {
      const isValidAdmin = isGlobalAdmin(email)
      const isValidPassword = password === Config.admin.secret
      
      if (!isValidAdmin || !isValidPassword) {
        return { success: false, error: 'Invalid credentials' }
      }
      
      const token = Config.admin.secret + '_' + Date.now()
      return {
        success: true,
        token,
      }
    } catch (error) {
      return { success: false, error: 'Authentication failed' }
    }
  },

  async signOut(): Promise<void> {
    // Clear any stored session data
  },

  validateToken(token: string): boolean {
    return validateAdminSession(token.split('_')[0])
  }
}