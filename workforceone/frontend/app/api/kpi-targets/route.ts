import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get current user's organization
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's organization
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Use guard_kpi_targets as SINGLE source of truth for both display and management
    const { data: targets, error: targetsError } = await supabase
      .from('guard_kpi_targets')
      .select(`
        id,
        guard_id,
        target_type,
        target_value,
        target_period,
        is_active,
        created_at,
        updated_at,
        profiles:guard_id (
          id,
          full_name,
          email
        )
      `)
      .eq('organization_id', profile.organization_id)
      .order('created_at', { ascending: false })


    if (targetsError) {
      console.error('Error fetching KPI targets:', targetsError)
      return NextResponse.json({ error: 'Failed to fetch targets' }, { status: 500 })
    }

    // Transform the data to include guard names
    const transformedTargets = (targets || []).map(target => ({
      ...target,
      guard_name: target.profiles?.full_name || target.profiles?.email || (target.guard_id ? 'Unknown Guard' : 'Organization Default'),
      guard_email: target.profiles?.email || null
    }))

    return NextResponse.json({ 
      targets: transformedTargets,
      source: 'guard_kpi_targets_unified'
    }, { status: 200 })

  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get current user's organization
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's organization
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Parse request body
    const body = await request.json()
    const { guard_id, target_type, target_value, target_period } = body

    // Validate required fields
    if (!target_type || !target_value || !target_period) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Validate target_type
    const validTypes = ['check_ins', 'patrols', 'incidents', 'daily_reports']
    if (!validTypes.includes(target_type)) {
      return NextResponse.json({ error: 'Invalid target type' }, { status: 400 })
    }

    // Validate target_period
    const validPeriods = ['daily', 'weekly', 'monthly']
    if (!validPeriods.includes(target_period)) {
      return NextResponse.json({ error: 'Invalid target period' }, { status: 400 })
    }

    // Create new target in guard_kpi_targets (feeds into dashboard view)
    const { data: newTarget, error: createError } = await supabase
      .from('guard_kpi_targets')
      .insert({
        organization_id: profile.organization_id,
        guard_id: guard_id || null,
        target_type,
        target_value: parseInt(target_value),
        target_period,
        is_active: true,
        created_by: user.id
      })
      .select()
      .single()

    if (createError) {
      console.error('Error creating KPI target:', createError)
      return NextResponse.json({ error: 'Failed to create target' }, { status: 500 })
    }

    return NextResponse.json({ target: newTarget }, { status: 201 })

  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get current user's organization
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse request body
    const body = await request.json()
    const { id, target_value, is_active } = body

    if (!id) {
      return NextResponse.json({ error: 'Target ID is required' }, { status: 400 })
    }

    // Update target in guard_kpi_targets (unified system)
    const { data: updatedTarget, error: updateError } = await supabase
      .from('guard_kpi_targets')
      .update({
        target_value: target_value ? parseInt(target_value) : undefined,
        is_active: is_active !== undefined ? is_active : undefined,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating KPI target:', updateError)
      return NextResponse.json({ error: 'Failed to update target' }, { status: 500 })
    }

    return NextResponse.json({ target: updatedTarget }, { status: 200 })

  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get current user's organization
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get target ID from URL params
    const { searchParams } = new URL(request.url)
    const targetId = searchParams.get('id')

    if (!targetId) {
      return NextResponse.json({ error: 'Target ID is required' }, { status: 400 })
    }

    // Delete target from guard_kpi_targets (unified system)
    const { error: deleteError } = await supabase
      .from('guard_kpi_targets')
      .delete()
      .eq('id', targetId)

    if (deleteError) {
      console.error('Error deleting KPI target:', deleteError)
      return NextResponse.json({ error: 'Failed to delete target' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Target deleted successfully' }, { status: 200 })

  } catch (error) {
    console.error('API Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}