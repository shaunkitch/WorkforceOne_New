import { createClient } from '@supabase/supabase-js'
import { ProductId } from './products'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database Types
export interface Profile {
  id: string
  user_id: string
  email: string
  full_name: string
  organization_id?: string
  products: string[]
  role: string
  app_preferences: Record<string, any>
  created_at: string
  updated_at: string
}

export interface ProductInvitation {
  id: string
  invitation_code: string
  invited_name: string
  invited_email?: string
  invited_phone?: string
  products: string[]
  organization_id?: string
  created_by?: string
  status: 'pending' | 'accepted' | 'expired' | 'revoked'
  expires_at: string
  accepted_at?: string
  accepted_by?: string
  metadata: Record<string, any>
  created_at: string
  updated_at: string
}

// Authentication functions
export const signInWithEmail = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  return { data, error }
}

export const signUpWithEmail = async (
  email: string, 
  password: string, 
  metadata: any = {}
) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: metadata
    }
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

export const getSession = async () => {
  const { data: { session }, error } = await supabase.auth.getSession()
  return { session, error }
}

// Profile management
export const getUserProfile = async () => {
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', (await getUser()).user?.id)
    .single()
  
  return { profile, error }
}

export const updateUserProfile = async (updates: Partial<Profile>) => {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('user_id', (await getUser()).user?.id)
    .select()
    .single()
  
  return { data, error }
}

// Product access management
export const getUserProducts = async (): Promise<string[]> => {
  const { profile } = await getUserProfile()
  return profile?.products || []
}

export const hasProductAccess = async (productId: ProductId): Promise<boolean> => {
  const products = await getUserProducts()
  return products.includes(productId)
}

export const addProductAccess = async (productIds: ProductId[]) => {
  const { profile } = await getUserProfile()
  if (!profile) return { error: 'Profile not found' }
  
  const currentProducts = profile.products || []
  const newProducts = [...new Set([...currentProducts, ...productIds])]
  
  return await updateUserProfile({ products: newProducts })
}

export const removeProductAccess = async (productId: ProductId) => {
  const { profile } = await getUserProfile()
  if (!profile) return { error: 'Profile not found' }
  
  const currentProducts = profile.products || []
  const newProducts = currentProducts.filter((p: string) => p !== productId)
  
  return await updateUserProfile({ products: newProducts })
}

// Invitation management
export const createProductInvitation = async (
  invitationData: Omit<ProductInvitation, 'id' | 'created_at' | 'updated_at' | 'created_by'>
) => {
  const { data, error } = await supabase
    .from('product_invitations')
    .insert({
      ...invitationData,
      created_by: (await getUser()).user?.id
    })
    .select()
    .single()
  
  return { data, error }
}

export const getProductInvitations = async () => {
  const { data, error } = await supabase
    .from('product_invitations')
    .select('*')
    .order('created_at', { ascending: false })
  
  return { data, error }
}

export const getInvitationByCode = async (invitationCode: string) => {
  const { data, error } = await supabase
    .from('product_invitations')
    .select('*')
    .eq('invitation_code', invitationCode)
    .eq('status', 'pending')
    .gt('expires_at', new Date().toISOString())
    .single()
  
  return { data, error }
}

export const acceptProductInvitation = async (
  invitationCode: string,
  userEmail: string
) => {
  const { data, error } = await supabase.rpc('accept_product_invitation', {
    invitation_code_param: invitationCode,
    user_email_param: userEmail
  })
  
  return { data, error }
}

export const revokeInvitation = async (invitationId: string) => {
  const { data, error } = await supabase
    .from('product_invitations')
    .update({ 
      status: 'revoked',
      updated_at: new Date().toISOString()
    })
    .eq('id', invitationId)
    .select()
    .single()
  
  return { data, error }
}

// Product access logging
export const logProductAccess = async (
  productId: ProductId,
  action: string,
  metadata: Record<string, any> = {}
) => {
  const { user } = await getUser()
  const { profile } = await getUserProfile()
  
  if (!user) return { error: 'User not authenticated' }
  
  const { data, error } = await supabase
    .from('product_access_logs')
    .insert({
      user_id: user.id,
      organization_id: profile?.organization_id,
      product_id: productId,
      action,
      metadata,
      session_id: (await getSession()).session?.access_token
    })
  
  return { data, error }
}

// Real-time subscriptions
export const subscribeToInvitations = (
  callback: (payload: any) => void
) => {
  return supabase
    .channel('product_invitations')
    .on('postgres_changes', 
      { event: '*', schema: 'public', table: 'product_invitations' }, 
      callback
    )
    .subscribe()
}

export const subscribeToProfileUpdates = (
  userId: string,
  callback: (payload: any) => void
) => {
  return supabase
    .channel(`profile_${userId}`)
    .on('postgres_changes', 
      { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'profiles',
        filter: `user_id=eq.${userId}`
      }, 
      callback
    )
    .subscribe()
}

// Utility functions
export const generateInvitationCode = (): string => {
  const prefix = 'WF'
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = Math.random().toString(36).substr(2, 4).toUpperCase()
  return `${prefix}-${timestamp}-${random}`
}

export const isInvitationExpired = (expiresAt: string): boolean => {
  return new Date(expiresAt) < new Date()
}

// App preferences
export const updateAppPreferences = async (preferences: Record<string, any>) => {
  const { profile } = await getUserProfile()
  if (!profile) return { error: 'Profile not found' }
  
  const updatedPreferences = {
    ...profile.app_preferences,
    ...preferences
  }
  
  return await updateUserProfile({ app_preferences: updatedPreferences })
}

export const getAppPreferences = async (): Promise<Record<string, any>> => {
  const { profile } = await getUserProfile()
  return profile?.app_preferences || {}
}