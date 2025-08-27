import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import QRCode from 'qrcode'

// Helper function to generate QR code image
async function generateQRCodeImage(code: string): Promise<string> {
  try {
    const qrCodeDataUrl = await QRCode.toDataURL(code, {
      errorCorrectionLevel: 'M',
      type: 'image/png',
      quality: 0.92,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      width: 256
    })
    // Remove the data URL prefix to get just the base64 part
    return qrCodeDataUrl.split(',')[1]
  } catch (error) {
    console.error('Error generating QR code image:', error)
    return ''
  }
}

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          }
        }
      }
    )
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user's profile to check organization access
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('organization_id, role')
      .eq('id', user.id)
      .single()

    if (profileError || !profile?.organization_id) {
      return NextResponse.json(
        { success: false, error: 'User profile or organization not found' },
        { status: 403 }
      )
    }

    // Only admin/manager can view QR codes
    if (!['admin', 'manager'].includes(profile.role)) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    // Get existing QR codes for the organization via sites
    const { data: sites, error: sitesError } = await supabase
      .from('sites')
      .select(`
        *,
        qr_codes(*)
      `)
      .order('created_at', { ascending: false })

    if (sitesError) {
      console.error('Database error:', sitesError)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch sites' },
        { status: 500 }
      )
    }

    // Transform sites data to QR codes format
    const qrCodes = (sites || []).flatMap(site => 
      (site.qr_codes || []).map((qr: any) => ({
        id: qr.id,
        location_name: site.name,
        description: site.address,
        shift_type: 'both', // Default since schema doesn't have this field
        qr_code_data: qr.code,
        qr_code_image: `data:image/png;base64,${await generateQRCodeImage(qr.code)}`,
        expires_at: qr.valid_until,
        is_active: qr.is_active,
        created_at: qr.created_at,
        site: site
      }))
    )


    return NextResponse.json({
      success: true,
      qrCodes: qrCodes
    })

  } catch (error) {
    console.error('QR code GET API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          }
        }
      }
    )
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user's profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('organization_id, role')
      .eq('id', user.id)
      .single()

    if (profileError || !profile?.organization_id) {
      return NextResponse.json(
        { success: false, error: 'User profile or organization not found' },
        { status: 403 }
      )
    }

    // Only admin/manager can create QR codes
    if (!['admin', 'manager'].includes(profile.role)) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { 
      location_name, 
      description, 
      shift_type = 'both', // 'check_in', 'check_out', or 'both'
      expires_at 
    } = body

    // Validate required fields
    if (!location_name) {
      return NextResponse.json(
        { success: false, error: 'Location name is required' },
        { status: 400 }
      )
    }

    // First create a site
    const { data: site, error: siteError } = await supabase
      .from('sites')
      .insert({
        name: location_name,
        address: description,
        qr_mode: 'static', // Using static QR codes
        require_gps_validation: true
      })
      .select()
      .single()

    if (siteError) {
      console.error('Site creation error:', siteError)
      return NextResponse.json(
        { success: false, error: 'Failed to create site' },
        { status: 500 }
      )
    }

    // Generate QR code data
    const qrData = {
      siteId: site.id,
      locationName: location_name,
      shiftType: shift_type,
      timestamp: new Date().toISOString()
    }
    
    const qrCodeString = JSON.stringify(qrData)
    const uniqueCode = `${site.id}_${Date.now()}`
    
    // Create QR code record
    const { data: qrRecord, error: qrError } = await supabase
      .from('qr_codes')
      .insert({
        code: uniqueCode,
        type: 'static',
        site_id: site.id,
        valid_until: expires_at ? new Date(expires_at).toISOString() : null,
        is_active: true,
        created_by: user.id
      })
      .select()
      .single()

    if (qrError) {
      console.error('QR code creation error:', qrError)
      return NextResponse.json(
        { success: false, error: 'Failed to create QR code' },
        { status: 500 }
      )
    }

    // Generate QR code image
    const qrCodeImage = `data:image/png;base64,${await generateQRCodeImage(uniqueCode)}`
    
    const responseData = {
      id: qrRecord.id,
      location_name,
      description,
      shift_type,
      qr_code_data: uniqueCode,
      qr_code_image: qrCodeImage,
      expires_at,
      is_active: true,
      created_at: qrRecord.created_at,
      site
    }

    return NextResponse.json({
      success: true,
      qrCode: responseData
    })

  } catch (error) {
    console.error('QR code POST API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          }
        }
      }
    )
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user's profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('organization_id, role')
      .eq('id', user.id)
      .single()

    if (profileError || !profile?.organization_id) {
      return NextResponse.json(
        { success: false, error: 'User profile or organization not found' },
        { status: 403 }
      )
    }

    // Only admin/manager can update QR codes
    if (!['admin', 'manager'].includes(profile.role)) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { id, is_active, expires_at, location_name, description } = body

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'QR code ID is required' },
        { status: 400 }
      )
    }

    // Update QR code
    const { data: updatedRecord, error: updateError } = await supabase
      .from('qr_codes')
      .update({
        is_active,
        valid_until: expires_at ? new Date(expires_at).toISOString() : null
      })
      .eq('id', id)
      .select(`
        *,
        sites(*)
      `)
      .single()

    // Also update the site if location_name or description changed
    if (updatedRecord && (location_name || description)) {
      await supabase
        .from('sites')
        .update({
          name: location_name || updatedRecord.sites?.name,
          address: description || updatedRecord.sites?.address,
          updated_at: new Date().toISOString()
        })
        .eq('id', updatedRecord.site_id)
    }

    if (updateError) {
      console.error('Database error:', updateError)
      return NextResponse.json(
        { success: false, error: 'Failed to update QR code' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      qrCode: updatedRecord
    })

  } catch (error) {
    console.error('QR code PUT API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          }
        }
      }
    )
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user's profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('organization_id, role')
      .eq('id', user.id)
      .single()

    if (profileError || !profile?.organization_id) {
      return NextResponse.json(
        { success: false, error: 'User profile or organization not found' },
        { status: 403 }
      )
    }

    // Only admin/manager can delete QR codes
    if (!['admin', 'manager'].includes(profile.role)) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'QR code ID is required' },
        { status: 400 }
      )
    }

    // Soft delete by setting is_active to false
    const { error: deleteError } = await supabase
      .from('qr_codes')
      .update({
        is_active: false
      })
      .eq('id', id)

    if (deleteError) {
      console.error('Database error:', deleteError)
      return NextResponse.json(
        { success: false, error: 'Failed to delete QR code' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'QR code deactivated successfully'
    })

  } catch (error) {
    console.error('QR code DELETE API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}