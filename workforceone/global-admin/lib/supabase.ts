import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-service-key'

// Validate that we have real keys (not placeholders)
const hasValidConfig = 
  supabaseUrl !== 'https://placeholder.supabase.co' && 
  supabaseAnonKey !== 'placeholder-anon-key' &&
  supabaseServiceKey !== 'placeholder-service-key'

// Singleton instances to prevent multiple client warnings
let _supabase: any = null
let _supabaseAdmin: any = null

// Client for browser use
export const supabase = (() => {
  if (!_supabase) {
    _supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false
      }
    })
  }
  return _supabase
})()

// Admin client with service role for server-side operations
export const supabaseAdmin = (() => {
  if (!_supabaseAdmin) {
    _supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  }
  return _supabaseAdmin
})()

// Export config validation
export const isSupabaseConfigured = () => hasValidConfig

// Global admin authentication
export interface GlobalAdminAuth {
  isAuthenticated: boolean
  sessionExpiry?: Date
}

export const GLOBAL_ADMIN_EMAILS = [
  'admin@workforceone.co.za',
  'shaun@workforceone.com'
]

export function isGlobalAdmin(email: string): boolean {
  return GLOBAL_ADMIN_EMAILS.includes(email.toLowerCase())
}

export function validateAdminSession(token: string): boolean {
  // Simple token validation - in production, use JWT or similar
  return token.startsWith(process.env.GLOBAL_ADMIN_MASTER_PASSWORD + '_')
}