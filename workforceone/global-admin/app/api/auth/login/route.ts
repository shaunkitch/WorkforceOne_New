import { NextRequest, NextResponse } from 'next/server'
import { isGlobalAdmin } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()
    
    // Validate credentials
    const isValidAdmin = isGlobalAdmin(email)
    const isValidPassword = password === process.env.GLOBAL_ADMIN_MASTER_PASSWORD
    
    if (!isValidAdmin || !isValidPassword) {
      return NextResponse.json(
        { success: false, error: 'Invalid credentials' },
        { status: 401 }
      )
    }
    
    // Create session token (in production, use proper JWT)
    const token = process.env.GLOBAL_ADMIN_MASTER_PASSWORD + '_' + Date.now()
    
    return NextResponse.json({
      success: true,
      token,
      user: {
        email,
        role: 'global_admin'
      }
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Authentication failed' },
      { status: 500 }
    )
  }
}