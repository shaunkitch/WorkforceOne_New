import 'react-native-url-polyfill/auto'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://edeheyeloakiworbkfpg.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVkZWhleWVsb2FraXdvcmJrZnBnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5MTg2NzUsImV4cCI6MjA3MDQ5NDY3NX0.IRvOCcwlnc1myDFCEITelnrdHKgYIEt750taUFyDqkc'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
})

// User authentication functions
export const signInWithEmail = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  return { data, error }
}

export const signUpWithEmail = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  })
  return { data, error }
}

export const signOut = async () => {
  const { error } = await supabase.auth.signOut()
  return { error }
}

export const getUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser()
  return { user, error }
}

// Product access functions
export const getUserProducts = async (): Promise<string[]> => {
  try {
    const { user } = await getUser()
    if (!user) return []

    // Get user's products from database
    const { data, error } = await supabase
      .from('user_products')
      .select('product_id')
      .eq('user_id', user.id)
      .eq('is_active', true)

    if (error) {
      console.error('Error fetching user products:', error)
      return []
    }

    return data?.map(item => item.product_id) || []
  } catch (error) {
    console.error('Error getting user products:', error)
    return []
  }
}

export const hasProductAccess = async (productId: string): Promise<boolean> => {
  try {
    const products = await getUserProducts()
    return products.includes(productId)
  } catch (error) {
    console.error('Error checking product access:', error)
    return false
  }
}

export const getUserProfile = async () => {
  try {
    const { user } = await getUser()
    if (!user) return { profile: null }

    // Get real profile from database
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (error) {
      console.error('Error fetching profile:', error)
      return { profile: null }
    }

    return { profile }
  } catch (error) {
    console.error('Error getting user profile:', error)
    return { profile: null }
  }
}

// QR Code invitation functions
export const acceptProductInvitation = async (
  invitationCode: string
) => {
  try {
    const { user } = await getUser()
    
    // Call Supabase function to accept/validate invitation
    const { data, error } = await supabase.rpc('accept_product_invitation', {
      invitation_code_param: invitationCode,
      user_email_param: user?.email || ''
    })

    if (error) {
      console.error('Error accepting invitation:', error)
      return { data: null, error: error.message }
    }

    return { data, error: null }
  } catch (error) {
    console.error('Error in acceptProductInvitation:', error)
    return { data: null, error: 'Failed to accept invitation' }
  }
}

// Validate invitation without requiring authentication
export const validateInvitationCode = async (invitationCode: string) => {
  try {
    const { data, error } = await supabase.rpc('validate_invitation_code', {
      invitation_code_param: invitationCode
    })

    if (error) {
      console.error('Error validating invitation:', error)
      return { data: null, error: error.message }
    }

    return { data, error: null }
  } catch (error) {
    console.error('Error in validateInvitationCode:', error)
    return { data: null, error: 'Failed to validate invitation' }
  }
}

// Handle guard invitations (existing system)
export const acceptGuardInvitation = async (invitationCode: string) => {
  try {
    // Check if guard invitation exists and is valid
    const { data: invitation, error: fetchError } = await supabase
      .from('security_guard_invitations')
      .select('*')
      .eq('invitation_code', invitationCode)
      .eq('status', 'pending')
      .single();

    if (fetchError || !invitation) {
      return { data: null, error: 'Invalid or expired guard invitation' };
    }

    // For now, just validate - actual acceptance happens after authentication
    return { 
      data: { 
        success: true, 
        requires_signup: true,
        products: ['guard-management'],
        message: 'Valid guard invitation. Please sign up to join.',
        organization_id: invitation.organization_id
      }, 
      error: null 
    };
  } catch (error) {
    console.error('Error in acceptGuardInvitation:', error);
    return { data: null, error: 'Failed to process guard invitation' };
  }
}

// Get active QR invitations for scanning
export const getActiveInvitation = async (invitationCode: string) => {
  try {
    const { data, error } = await supabase
      .from('product_invitations')
      .select('*')
      .eq('invitation_code', invitationCode)
      .eq('status', 'pending')
      .single()

    if (error) {
      console.error('Error fetching invitation:', error)
      return { invitation: null, error: error.message }
    }

    return { invitation: data, error: null }
  } catch (error) {
    console.error('Error in getActiveInvitation:', error)
    return { invitation: null, error: 'Failed to get invitation' }
  }
}

export const logProductAccess = async (
  productId: string,
  action: string,
  metadata?: any
) => {
  // Mock logging for demo
  console.log('Product access logged:', { productId, action, metadata })
}