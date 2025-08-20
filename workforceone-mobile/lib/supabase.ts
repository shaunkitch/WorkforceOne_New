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

// Auto sign-up with invitation (creates account and processes invitation)
export const autoSignUpWithInvitation = async (
  invitationCode: string,
  email: string,
  name?: string
) => {
  try {
    console.log('Auto signing up with invitation:', { invitationCode, email, name });
    
    // Generate a random password for the user
    const tempPassword = 'TempPass' + Math.random().toString(36).substring(2, 8) + '!';
    
    // Create the user account with email confirmation disabled
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password: tempPassword,
      options: {
        data: {
          full_name: name || 'New User',
          invitation_code: invitationCode,
        },
        emailRedirectTo: undefined // Disable email confirmation redirect
      },
    });

    if (signUpError) {
      console.error('Sign up error:', signUpError);
      return { data: null, error: signUpError.message };
    }

    // If user was created successfully, try to sign them in immediately
    if (signUpData.user) {
      console.log('User created, attempting immediate sign-in...');
      
      // Try to sign in immediately with the credentials
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password: tempPassword,
      });

      if (signInError) {
        console.log('Immediate sign-in failed (likely email confirmation required):', signInError.message);
        
        // Process invitation anyway for when they do confirm
        try {
          const { data: inviteData, error: inviteError } = await supabase.rpc('complete_invitation_after_auth', {
            invitation_code_param: invitationCode,
            user_id_param: signUpData.user.id
          });

          return { 
            data: { 
              user: signUpData.user, 
              session: null,
              needs_confirmation: true,
              invitation_result: inviteData,
              temp_password: tempPassword
            }, 
            error: 'Account created but email confirmation required' 
          };
        } catch (inviteError) {
          return { 
            data: { 
              user: signUpData.user, 
              session: null,
              needs_confirmation: true,
              temp_password: tempPassword
            }, 
            error: 'Account created but email confirmation required' 
          };
        }
      }

      // If sign-in was successful, complete the invitation
      if (signInData.session) {
        console.log('User signed in successfully, processing invitation...');
        
        const { data: inviteData, error: inviteError } = await supabase.rpc('complete_invitation_after_auth', {
          invitation_code_param: invitationCode,
          user_id_param: signInData.user.id
        });

        if (inviteError) {
          console.error('Invitation completion error:', inviteError);
          // User signed in but invitation failed - still a success
          return { 
            data: { 
              user: signInData.user, 
              session: signInData.session,
              invitation_error: inviteError.message,
              temp_password: tempPassword
            }, 
            error: null 
          };
        }

        console.log('Complete auto sign-in successful!');
        return { 
          data: { 
            user: signInData.user, 
            session: signInData.session,
            invitation_result: inviteData,
            temp_password: tempPassword,
            auto_signed_in: true
          }, 
          error: null 
        };
      }
    }

    return { data: null, error: 'Failed to create user account' };
  } catch (error: any) {
    console.error('Auto sign-up error:', error);
    return { data: null, error: error.message || 'Failed to auto sign-up' };
  }
}

// Complete invitation after manual authentication
export const completeInvitationAfterAuth = async (invitationCode: string) => {
  try {
    const { user } = await getUser();
    
    if (!user) {
      return { data: null, error: 'User not authenticated' };
    }

    const { data, error } = await supabase.rpc('complete_invitation_after_auth', {
      invitation_code_param: invitationCode,
      user_id_param: user.id
    });

    if (error) {
      console.error('Error completing invitation:', error);
      return { data: null, error: error.message };
    }

    return { data, error: null };
  } catch (error: any) {
    console.error('Error in completeInvitationAfterAuth:', error);
    return { data: null, error: error.message || 'Failed to complete invitation' };
  }
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
  invitationCode: string,
  userEmail?: string,
  userName?: string
) => {
  try {
    const { user } = await getUser()
    
    // Call enhanced Supabase function that supports auto sign-up
    const { data, error } = await supabase.rpc('accept_product_invitation_with_signup', {
      invitation_code_param: invitationCode,
      user_email_param: userEmail || user?.email || '',
      user_name_param: userName || null,
      auto_create_user: true
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

// Handle guard invitations with automatic sign-up
export const acceptGuardInvitation = async (invitationCode: string, userEmail?: string, userName?: string) => {
  try {
    // Use the enhanced function that supports auto sign-up
    const { data, error } = await supabase.rpc('accept_product_invitation_with_signup', {
      invitation_code_param: invitationCode,
      user_email_param: userEmail || '',
      user_name_param: userName || null,
      auto_create_user: true
    });

    if (error) {
      console.error('Error processing guard invitation:', error);
      return { data: null, error: error.message || 'Failed to process guard invitation' };
    }

    return { data, error: null };
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