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

// Enhanced QR invitation handler - supports both signup and signin
export const processQRInvitation = async (
  invitationCode: string,
  email: string,
  name?: string
) => {
  try {
    console.log('Processing QR invitation:', { invitationCode, email, name });
    
    // First, check if user already exists and try to sign them in
    const { data: existingUser } = await supabase.auth.getUser();
    
    if (existingUser?.user) {
      console.log('User already logged in, processing invitation directly');
      const { data: inviteData, error: inviteError } = await supabase.rpc('complete_invitation_after_auth', {
        invitation_code_param: invitationCode,
        user_id_param: existingUser.user.id
      });

      if (inviteError) {
        console.error('Invitation processing error:', inviteError);
        return { data: null, error: inviteError.message };
      }

      return { 
        data: { 
          user: existingUser.user, 
          session: null,
          invitation_result: inviteData,
          already_signed_in: true
        }, 
        error: null 
      };
    }

    // For auto-invite emails, always try the standard password first
    if (email.includes('@auto-invite.temp')) {
      const standardPassword = 'password@2025';
      console.log('Attempting sign in with standard password for auto-invite email...');
      
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password: standardPassword,
      });

      if (!signInError && signInData.session) {
        console.log('Existing QR user signed in successfully with standard password');
        
        // Ensure profile exists for existing user too
        try {
          const { data: existingProfile } = await supabase
            .from('profiles')
            .select('id')
            .eq('id', signInData.user.id)
            .maybeSingle();

          if (!existingProfile) {
            console.log('Creating missing profile for existing QR user...');
            const { error: profileError } = await supabase
              .from('profiles')
              .insert({
                id: signInData.user.id,
                email: signInData.user.email,
                full_name: name || 'Guard User',
                role: 'guard',
                organization_id: null,
                is_active: true
              });

            if (profileError) {
              console.error('Profile creation error:', profileError);
            } else {
              console.log('Missing profile created successfully');
            }
          }
        } catch (profileCreationError) {
          console.error('Profile check/creation failed:', profileCreationError);
        }

        return { 
          data: { 
            user: signInData.user, 
            session: signInData.session,
            existing_user_signin: true,
            profile_ensured: true
          }, 
          error: null 
        };
      } else if (signInError?.message?.includes('Invalid login credentials')) {
        console.log('Standard password failed, trying legacy password patterns...');
        
        // Try legacy password patterns for existing QR users
        const legacyPasswords = [
          `TempPass${invitationCode.toUpperCase()}!`,
          `QR${invitationCode.toUpperCase()}2025!`,
          `Guard${invitationCode.toUpperCase()}!`
        ];
        
        for (const legacyPassword of legacyPasswords) {
          console.log('Trying legacy password pattern...');
          const { data: legacySignInData, error: legacySignInError } = await supabase.auth.signInWithPassword({
            email,
            password: legacyPassword,
          });
          
          if (!legacySignInError && legacySignInData.session) {
            console.log('Existing user signed in with legacy password');
            
            // Ensure profile exists for legacy user too
            try {
              const { data: existingProfile } = await supabase
                .from('profiles')
                .select('id')
                .eq('id', legacySignInData.user.id)
                .maybeSingle();

              if (!existingProfile) {
                console.log('Creating missing profile for legacy QR user...');
                await supabase
                  .from('profiles')
                  .insert({
                    id: legacySignInData.user.id,
                    email: legacySignInData.user.email,
                    full_name: name || 'Guard User',
                    role: 'guard',
                    organization_id: null,
                    is_active: true
                  });
              }
            } catch (profileCreationError) {
              console.error('Profile check/creation failed:', profileCreationError);
            }

            return { 
              data: { 
                user: legacySignInData.user, 
                session: legacySignInData.session,
                existing_user_signin: true,
                legacy_password_used: true
              }, 
              error: null 
            };
          }
        }
        
        console.log('All password patterns failed, user may not exist yet');
      } else {
        console.log('Sign in failed with error:', signInError?.message);
      }
    }

    // If no existing user, proceed with signup
    console.log('No existing user found, creating new account...');
    return await autoSignUpWithInvitation(invitationCode, email, name);
    
  } catch (error: any) {
    console.error('QR invitation processing error:', error);
    return { data: null, error: error.message || 'Failed to process QR invitation' };
  }
}


// Auto sign-up with invitation (creates account and processes invitation)
export const autoSignUpWithInvitation = async (
  invitationCode: string,
  email: string,
  name?: string
) => {
  try {
    console.log('Auto signing up with invitation:', { invitationCode, email, name });
    
    // Use standard password for all QR users
    const standardPassword = 'password@2025';
    
    // Create the user account with email confirmation disabled
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password: standardPassword,
      options: {
        data: {
          full_name: name || 'New User',
          invitation_code: invitationCode,
        },
        emailRedirectTo: undefined // Disable email confirmation redirect
      },
    });

    if (signUpError) {
      // If user already exists, try to sign them in with the standard password
      if (signUpError.message.includes('already registered')) {
        console.log('User already exists, attempting sign in with standard password...');
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password: standardPassword,
        });

        if (!signInError && signInData.session) {
          console.log('Existing user signed in successfully');
          
          // Process invitation for existing user
          const { data: inviteData, error: inviteError } = await supabase.rpc('complete_invitation_after_auth', {
            invitation_code_param: invitationCode,
            user_id_param: signInData.user.id
          });

          return { 
            data: { 
              user: signInData.user, 
              session: signInData.session,
              invitation_result: inviteData,
              existing_user_signin: true,
              temp_password: standardPassword
            }, 
            error: null 
          };
        } else {
          console.log('Sign in with standard password failed:', signInError?.message);
          // Password might have been set differently, return error
        }
      }
      
      console.error('Sign up error:', signUpError);
      return { data: null, error: signUpError.message };
    }

    // If user was created successfully, try to sign them in immediately
    if (signUpData.user) {
      console.log('User created, attempting immediate sign-in...');
      
      // Try to sign in immediately with the credentials
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password: standardPassword,
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
              temp_password: standardPassword
            }, 
            error: 'Account created but email confirmation required' 
          };
        } catch (inviteError) {
          return { 
            data: { 
              user: signUpData.user, 
              session: null,
              needs_confirmation: true,
              temp_password: standardPassword
            }, 
            error: 'Account created but email confirmation required' 
          };
        }
      }

      // If sign-in was successful, ensure profile exists and process invitation
      if (signInData.session) {
        console.log('User signed in successfully, ensuring profile exists...');
        
        // First, ensure the user has a profile
        try {
          const { data: existingProfile } = await supabase
            .from('profiles')
            .select('id')
            .eq('id', signInData.user.id)
            .maybeSingle();

          if (!existingProfile) {
            console.log('Creating profile for QR user...');
            const { error: profileError } = await supabase
              .from('profiles')
              .insert({
                id: signInData.user.id,
                email: signInData.user.email,
                full_name: name || 'Guard User',
                role: 'guard', // Default role for QR users
                organization_id: null,
                is_active: true
              });

            if (profileError) {
              console.error('Profile creation error:', profileError);
            } else {
              console.log('Profile created successfully');
            }
          }
        } catch (profileCreationError) {
          console.error('Profile check/creation failed:', profileCreationError);
        }

        console.log('Complete auto sign-in successful!');
        return { 
          data: { 
            user: signInData.user, 
            session: signInData.session,
            temp_password: standardPassword,
            auto_signed_in: true,
            profile_created: true
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

// SECURE: Product access functions using RBAC
export const getUserProducts = async (): Promise<string[]> => {
  // Import RBAC functions here to avoid circular dependency
  const { getCurrentUserProfile } = await import('./rbac');
  
  try {
    const userProfile = await getCurrentUserProfile();
    
    if (!userProfile) {
      console.log('No user profile found - denying all product access');
      return []; // SECURE: Return empty array instead of all products
    }

    console.log(`User ${userProfile.email} (${userProfile.role}) has access to:`, userProfile.permissions.products);
    return userProfile.permissions.products;
  } catch (error) {
    console.error('Error getting user products:', error);
    return []; // SECURE: Return empty array on error
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
      .maybeSingle()

    if (error) {
      console.error('Error fetching profile:', error)
      return { profile: null }
    }

    // If no profile exists, create a basic one from user data
    if (!profile) {
      const basicProfile = {
        id: user.id,
        full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
        email: user.email,
        created_at: user.created_at
      }
      return { profile: basicProfile }
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