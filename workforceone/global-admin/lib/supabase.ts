import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Client for browser use
export const supabase = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

// Admin client with service role for server-side operations
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Global admin authentication
export interface GlobalAdminAuth {
  isAuthenticated: boolean
  sessionExpiry?: Date
}

export const GLOBAL_ADMIN_EMAILS = [
  'shaun@workforceone.com', // Replace with your actual email
  'admin@workforceone.com'
]

export function isGlobalAdmin(email: string): boolean {
  return GLOBAL_ADMIN_EMAILS.includes(email.toLowerCase())
}

export function validateAdminSession(token: string): boolean {
  // Simple token validation - in production, use JWT or similar
  return token === process.env.GLOBAL_ADMIN_SECRET
}