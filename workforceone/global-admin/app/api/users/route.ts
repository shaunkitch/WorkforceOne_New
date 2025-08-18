import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  try {
    console.log('🚀 Fetching users data from database...')
    
    // Fetch users with organization data using service role
    const { data: profilesData, error: profilesError } = await supabaseAdmin
      .from('profiles')
      .select(`
        id,
        email,
        full_name,
        phone,
        role,
        organization_id,
        created_at,
        updated_at,
        organizations (
          name
        )
      `)
      .order('created_at', { ascending: false })

    if (profilesError) {
      console.error('❌ Error fetching profiles:', profilesError)
      return NextResponse.json({
        success: false,
        error: profilesError.message
      }, { status: 500 })
    }

    // Fetch auth users for additional metadata
    let authUsers = []
    try {
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.listUsers()
      if (authError) {
        console.warn('⚠️ Auth user fetch failed:', authError.message)
      } else {
        authUsers = authData.users || []
      }
    } catch (authError) {
      console.warn('⚠️ Auth API not available, continuing without auth data')
    }

    // Combine profile and auth data
    const usersWithAuth = profilesData.map(profile => {
      const authUser = authUsers.find(u => u.id === profile.id)
      
      // Split full_name into first_name and last_name for compatibility
      const nameParts = (profile.full_name || '').split(' ')
      const first_name = nameParts[0] || ''
      const last_name = nameParts.slice(1).join(' ') || ''
      
      return {
        ...profile,
        first_name,
        last_name,
        organization_name: profile.organizations?.name || 'Unknown',
        is_active: !(authUser as any)?.banned_until,
        auth_user: authUser ? {
          id: authUser.id,
          email: authUser.email,
          email_confirmed_at: authUser.email_confirmed_at,
          last_sign_in_at: authUser.last_sign_in_at,
          created_at: authUser.created_at
        } : null,
        email_confirmed_at: authUser?.email_confirmed_at,
        last_sign_in_at: authUser?.last_sign_in_at
      }
    })

    console.log(`✅ Successfully fetched ${usersWithAuth.length} users`)

    return NextResponse.json({
      success: true,
      data: usersWithAuth,
      stats: {
        total: usersWithAuth.length,
        active: usersWithAuth.filter(u => u.is_active && u.email_confirmed_at).length,
        unconfirmed: usersWithAuth.filter(u => !u.email_confirmed_at).length,
        banned: usersWithAuth.filter(u => !u.is_active).length
      }
    })

  } catch (error: any) {
    console.error('❌ Users API error:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Unknown error'
    }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { action, userId, ...params } = body

    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'User ID is required'
      }, { status: 400 })
    }

    switch (action) {
      case 'ban_user':
        return await banUser(userId)
      
      case 'unban_user':
        return await unbanUser(userId)
      
      case 'delete_user':
        return await deleteUser(userId)
      
      case 'resend_confirmation':
        return await resendConfirmation(userId)
      
      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action'
        }, { status: 400 })
    }

  } catch (error: any) {
    console.error('❌ Users action error:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Unknown error'
    }, { status: 500 })
  }
}

async function banUser(userId: string) {
  try {
    const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      ban_duration: '876000h' // ~100 years
    })

    if (error) throw error

    return NextResponse.json({
      success: true,
      message: 'User banned successfully'
    })
  } catch (error: any) {
    throw error
  }
}

async function unbanUser(userId: string) {
  try {
    const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      ban_duration: 'none'
    })

    if (error) throw error

    return NextResponse.json({
      success: true,
      message: 'User unbanned successfully'
    })
  } catch (error: any) {
    throw error
  }
}

async function deleteUser(userId: string) {
  try {
    // Delete auth user (this will cascade to profiles via RLS)
    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId)

    if (error) throw error

    return NextResponse.json({
      success: true,
      message: 'User deleted successfully'
    })
  } catch (error: any) {
    throw error
  }
}

async function resendConfirmation(userId: string) {
  try {
    // Note: resendConfirmation is not available in current Supabase admin API
    // This would need to be implemented with a custom email service
    return NextResponse.json({
      success: false,
      error: 'Resend confirmation feature not implemented'
    }, { status: 501 })
  } catch (error: any) {
    throw error
  }
}