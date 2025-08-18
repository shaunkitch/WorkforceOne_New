import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Get environment variables - fallback to env if NEXT_PUBLIC_ not available
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || 'placeholder-anon-key'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-service-key'

// Validate that we have real keys (not placeholders)
const hasValidConfig = 
  supabaseUrl !== 'https://placeholder.supabase.co' && 
  supabaseAnonKey !== 'placeholder-anon-key' &&
  supabaseServiceKey !== 'placeholder-service-key'

// Singleton instances to prevent multiple client warnings
let _supabase: SupabaseClient | null = null
let _supabaseAdmin: SupabaseClient | null = null

// Lazy initialization function for regular client
function getSupabaseClient(): SupabaseClient {
  if (!_supabase) {
    _supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        detectSessionInUrl: false,
        autoRefreshToken: false
      }
    })
  }
  return _supabase
}

// Lazy initialization function for admin client
function getSupabaseAdminClient(): SupabaseClient {
  if (!_supabaseAdmin) {
    _supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false
      }
    })
  }
  return _supabaseAdmin
}

// Export clients as functions to ensure proper initialization
export const supabase = getSupabaseClient()
export const supabaseAdmin = getSupabaseAdminClient()

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