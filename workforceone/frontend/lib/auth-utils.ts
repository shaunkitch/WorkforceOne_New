import { createClient } from '@/lib/supabase/client'

// Add delay to prevent rapid requests
export const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

// Enhanced auth functions with rate limiting protection
export class AuthService {
  private static instance: AuthService
  private supabase = createClient()
  private lastRequestTime: number = 0
  private minRequestInterval: number = 2000 // 2 seconds between requests

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService()
    }
    return AuthService.instance
  }

  private async throttleRequest(): Promise<void> {
    const now = Date.now()
    const timeSinceLastRequest = now - this.lastRequestTime
    
    if (timeSinceLastRequest < this.minRequestInterval) {
      const waitTime = this.minRequestInterval - timeSinceLastRequest
      await delay(waitTime)
    }
    
    this.lastRequestTime = Date.now()
  }

  async signIn(email: string, password: string) {
    await this.throttleRequest()
    
    try {
      const { error } = await this.supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        if (error.message.includes('Too Many Requests') || error.message.includes('429')) {
          throw new Error('Too many login attempts. Please wait a few minutes and try again.')
        }
        throw error
      }

      return { success: true }
    } catch (error) {
      console.error('SignIn error:', error)
      throw error
    }
  }

  async signUp(email: string, password: string, fullName: string, organizationName?: string) {
    await this.throttleRequest()
    
    try {
      const { data: authData, error: authError } = await this.supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      })

      if (authError) {
        if (authError.message.includes('Too Many Requests') || authError.message.includes('429')) {
          throw new Error('Too many signup attempts. Please wait a few minutes and try again.')
        }
        throw authError
      }

      // If organization name is provided and user is created, create organization
      if (organizationName && authData.user) {
        try {
          await delay(1000) // Wait 1 second before making organization request
          
          const { data: org, error: orgError } = await this.supabase
            .from('organizations')
            .insert({
              name: organizationName,
              slug: organizationName.toLowerCase().replace(/\s+/g, '-'),
              feature_flags: {
                dashboard: true,
                time_tracking: true,
                attendance: true,
                maps: true,
                teams: true,
                projects: true,
                tasks: true,
                forms: true,
                leave: true,
                outlets: true,
                settings: true
              }
            })
            .select()
            .single()

          if (orgError) {
            console.error('Organization creation error:', orgError)
            // Don't throw here - user account is created successfully
          }

          // Update user profile with organization
          if (org && !orgError) {
            await delay(1000) // Wait another second
            
            const { error: profileError } = await this.supabase
              .from('profiles')
              .update({ organization_id: org.id })
              .eq('id', authData.user.id)

            if (profileError) {
              console.error('Profile update error:', profileError)
              // Don't throw here either - user account is created successfully
            }
          }
        } catch (orgError) {
          console.error('Post-signup organization setup error:', orgError)
          // User account is still created successfully
        }
      }

      return { success: true, user: authData.user }
    } catch (error) {
      console.error('SignUp error:', error)
      throw error
    }
  }

  async signOut() {
    await this.throttleRequest()
    
    try {
      const { error } = await this.supabase.auth.signOut()
      if (error) throw error
      return { success: true }
    } catch (error) {
      console.error('SignOut error:', error)
      throw error
    }
  }

  async resetPassword(email: string) {
    await this.throttleRequest()
    
    try {
      const { error } = await this.supabase.auth.resetPasswordForEmail(email)
      if (error) {
        if (error.message.includes('Too Many Requests') || error.message.includes('429')) {
          throw new Error('Too many password reset attempts. Please wait before trying again.')
        }
        throw error
      }
      return { success: true }
    } catch (error) {
      console.error('Password reset error:', error)
      throw error
    }
  }
}

// Error handler for common auth errors
export const handleAuthError = (error: any): string => {
  if (error.message?.includes('Too Many Requests') || error.message?.includes('429')) {
    return 'Too many requests. Please wait a few minutes before trying again.'
  }
  
  if (error.message?.includes('Invalid login credentials')) {
    return 'Invalid email or password. Please check your credentials and try again.'
  }
  
  if (error.message?.includes('already registered')) {
    return 'An account with this email already exists. Please try logging in instead.'
  }
  
  if (error.message?.includes('Email not confirmed')) {
    return 'Please check your email and click the confirmation link before logging in.'
  }
  
  if (error.message?.includes('Password should be at least')) {
    return 'Password must be at least 6 characters long.'
  }
  
  return error.message || 'An unexpected error occurred. Please try again.'
}