import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Product-specific authentication
export const TIME_PRODUCT_ID = 'time-tracker'
export const GUARD_PRODUCT_ID = 'guard-management' 
export const MAIN_PRODUCT_ID = 'workforce-management'

// Cross-app navigation URLs
export const APP_URLS = {
  main: 'http://localhost:3000',
  time: 'http://localhost:3002', 
  guard: 'http://localhost:3003'
}

// Authentication helpers
export const signInWithEmail = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  return { data, error }
}

export const signUpWithEmail = async (email: string, password: string, metadata: any = {}) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        ...metadata,
        products: [GUARD_PRODUCT_ID] // Default to guard system
      }
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

// Check if user has access to specific product
export const hasProductAccess = async (productId: string) => {
  const { user } = await getUser()
  if (!user) return false
  
  const userProducts = user.user_metadata?.products || []
  return userProducts.includes(productId)
}

// Add product access to user
export const addProductAccess = async (productId: string) => {
  const { user } = await getUser()
  if (!user) return { error: 'No user found' }
  
  const currentProducts = user.user_metadata?.products || []
  if (currentProducts.includes(productId)) {
    return { error: null } // Already has access
  }
  
  const { data, error } = await supabase.auth.updateUser({
    data: {
      ...user.user_metadata,
      products: [...currentProducts, productId]
    }
  })
  
  return { data, error }
}

// Redirect to appropriate app based on user's products
export const redirectToDefaultApp = async () => {
  const { user } = await getUser()
  if (!user) return APP_URLS.main
  
  const userProducts = user.user_metadata?.products || []
  
  // Priority: Guard > Time > Main
  if (userProducts.includes(GUARD_PRODUCT_ID)) {
    return APP_URLS.guard
  } else if (userProducts.includes(TIME_PRODUCT_ID)) {
    return APP_URLS.time
  }
  
  return APP_URLS.main
}

// Single Sign-On functionality
export const ssoRedirect = async (targetApp: string) => {
  const { user } = await getUser()
  if (!user) return null
  
  // Create a temporary auth token for cross-app navigation
  const { data, error } = await supabase.auth.getSession()
  if (error || !data.session) return null
  
  // Encode session for URL passing
  const encodedSession = btoa(JSON.stringify({
    access_token: data.session.access_token,
    refresh_token: data.session.refresh_token,
    expires_at: data.session.expires_at
  }))
  
  return `${targetApp}?auth=${encodedSession}`
}

// Handle incoming SSO session
export const handleSSOSession = async (encodedAuth: string) => {
  try {
    const sessionData = JSON.parse(atob(encodedAuth))
    const { data, error } = await supabase.auth.setSession({
      access_token: sessionData.access_token,
      refresh_token: sessionData.refresh_token
    })
    
    return { data, error }
  } catch (err) {
    return { data: null, error: 'Invalid auth token' }
  }
}