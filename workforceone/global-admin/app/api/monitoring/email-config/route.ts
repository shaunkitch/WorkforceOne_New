import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'

export async function POST(request: NextRequest) {
  try {
    const { from_email, admin_email } = await request.json()
    
    if (!from_email || !admin_email) {
      return NextResponse.json({
        success: false,
        error: 'Email addresses required'
      }, { status: 400 })
    }

    // Update environment variables in memory for current session
    process.env.FROM_EMAIL = from_email
    process.env.ADMIN_EMAIL = admin_email
    
    // Read current .env.local
    const envPath = path.join(process.cwd(), '.env.local')
    let envContent = await fs.readFile(envPath, 'utf8')
    
    // Update FROM_EMAIL and ADMIN_EMAIL
    envContent = envContent.replace(
      /FROM_EMAIL=.*/,
      `FROM_EMAIL=${from_email}`
    )
    envContent = envContent.replace(
      /ADMIN_EMAIL=.*/,
      `ADMIN_EMAIL=${admin_email}`
    )
    
    // Write back to .env.local
    await fs.writeFile(envPath, envContent)
    
    return NextResponse.json({
      success: true,
      message: 'Email configuration updated',
      from_email,
      admin_email
    })
  } catch (error) {
    console.error('Error updating email config:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to update configuration'
    }, { status: 500 })
  }
}