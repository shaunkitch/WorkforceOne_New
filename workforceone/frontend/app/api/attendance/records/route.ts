import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

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

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date') 
    const limit = parseInt(searchParams.get('limit') || '50')
    const userId = searchParams.get('user_id')

    // Build query based on user role - using shift_attendance table
    let query = supabase
      .from('shift_attendance')
      .select(`
        *,
        users!inner(
          id,
          first_name,
          last_name,
          organization_id
        )
      `)
      .eq('users.organization_id', profile.organization_id)
      .order('created_at', { ascending: false })
      .limit(limit)

    // If not admin/manager and no specific user_id requested, show only own records
    if (!['admin', 'manager'].includes(profile.role) && !userId) {
      query = query.eq('user_id', user.id)
    } else if (userId) {
      query = query.eq('user_id', userId)
    }

    // Apply date filters if provided
    if (startDate) {
      query = query.gte('timestamp', startDate)
    }
    if (endDate) {
      query = query.lte('timestamp', endDate)
    }

    const { data: records, error: recordsError } = await query

    if (recordsError) {
      console.error('Database error:', recordsError)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch attendance records' },
        { status: 500 }
      )
    }

    // Transform the data to match expected format
    const transformedRecords = (records || []).reduce((acc: any[], record: any) => {
      const date = record.timestamp.split('T')[0]
      const existingRecord = acc.find(r => r.user_id === record.user_id && r.date === date)
      
      if (existingRecord) {
        // Update existing record
        if (record.shift_type === 'check_in') {
          existingRecord.check_in_time = record.timestamp
        } else if (record.shift_type === 'check_out') {
          existingRecord.check_out_time = record.timestamp
        }
        
        // Calculate work hours if both times exist
        if (existingRecord.check_in_time && existingRecord.check_out_time) {
          const checkIn = new Date(existingRecord.check_in_time)
          const checkOut = new Date(existingRecord.check_out_time)
          const diffMs = checkOut.getTime() - checkIn.getTime()
          existingRecord.work_hours = diffMs / (1000 * 60 * 60)
          existingRecord.status = 'present'
        }
      } else {
        // Create new record
        const newRecord = {
          id: record.id,
          user_id: record.user_id,
          date: date,
          check_in_time: record.shift_type === 'check_in' ? record.timestamp : null,
          check_out_time: record.shift_type === 'check_out' ? record.timestamp : null,
          work_hours: null,
          status: record.shift_type === 'check_in' ? 'present' : 'absent',
          latitude: record.latitude,
          longitude: record.longitude,
          location_accuracy: record.accuracy,
          qr_code_id: record.qr_code_id,
          created_at: record.created_at,
          users: record.users
        }
        acc.push(newRecord)
      }
      
      return acc
    }, [])

    return NextResponse.json({
      success: true,
      records: transformedRecords
    })

  } catch (error) {
    console.error('Attendance records API error:', error)
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

    const body = await request.json()
    const { 
      user_id, 
      date, 
      check_in_time, 
      check_out_time, 
      status, 
      notes,
      location 
    } = body

    // Validate required fields
    if (!user_id || !date) {
      return NextResponse.json(
        { success: false, error: 'User ID and date are required' },
        { status: 400 }
      )
    }

    // Check if user has permission to create/update attendance for this user
    if (user_id !== user.id && !['admin', 'manager'].includes(profile.role)) {
      return NextResponse.json(
        { success: false, error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    // Calculate work hours if both check-in and check-out times are provided
    let workHours = null
    if (check_in_time && check_out_time) {
      const checkIn = new Date(check_in_time)
      const checkOut = new Date(check_out_time)
      const diffMs = checkOut.getTime() - checkIn.getTime()
      workHours = diffMs / (1000 * 60 * 60) // Convert to hours
    }

    // For shift_attendance table, we need to handle check_in and check_out separately
    const results = []
    
    if (check_in_time) {
      const checkInData = {
        user_id,
        shift_type: 'check_in' as const,
        timestamp: check_in_time,
        latitude: location?.latitude || null,
        longitude: location?.longitude || null,
        accuracy: location?.location_accuracy || null,
        qr_code_id: body.qr_code_id || null,
        device_info: body.device_info || {}
      }
      
      const checkInResult = await supabase
        .from('shift_attendance')
        .insert(checkInData)
        .select()
        .single()
        
      if (checkInResult.error) {
        console.error('Check-in error:', checkInResult.error)
        return NextResponse.json(
          { success: false, error: 'Failed to save check-in record' },
          { status: 500 }
        )
      }
      
      results.push(checkInResult.data)
    }
    
    if (check_out_time) {
      const checkOutData = {
        user_id,
        shift_type: 'check_out' as const,
        timestamp: check_out_time,
        latitude: location?.latitude || null,
        longitude: location?.longitude || null,
        accuracy: location?.location_accuracy || null,
        qr_code_id: body.qr_code_id || null,
        device_info: body.device_info || {}
      }
      
      const checkOutResult = await supabase
        .from('shift_attendance')
        .insert(checkOutData)
        .select()
        .single()
        
      if (checkOutResult.error) {
        console.error('Check-out error:', checkOutResult.error)
        return NextResponse.json(
          { success: false, error: 'Failed to save check-out record' },
          { status: 500 }
        )
      }
      
      results.push(checkOutResult.data)
    }

    return NextResponse.json({
      success: true,
      records: results
    })

  } catch (error) {
    console.error('Attendance records POST API error:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}