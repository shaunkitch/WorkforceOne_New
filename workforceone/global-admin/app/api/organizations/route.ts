import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  try {
    // Fetch organizations and profiles separately due to join issues
    const { data: orgsData, error: orgsError } = await supabaseAdmin
      .from('organizations')
      .select('*')
      .order('created_at', { ascending: false })

    if (orgsError) {
      console.error('Database error fetching organizations:', orgsError)
      return NextResponse.json({
        success: false,
        error: orgsError.message,
        data: []
      }, { status: 500 })
    }

    // Fetch profiles for all organizations
    const { data: profilesData, error: profilesError } = await supabaseAdmin
      .from('profiles')
      .select('id, organization_id, created_at, last_login')

    if (profilesError) {
      console.warn('Warning: Could not fetch profiles:', profilesError.message)
    }

    // Manually join organizations with subscriptions and profiles
    const enrichedOrgs = []
    for (const org of orgsData || []) {
      // Get subscription for this organization
      const { data: subscription, error: subError } = await supabaseAdmin
        .from('subscriptions')
        .select('status, trial_ends_at, monthly_total, user_count, updated_at')
        .eq('organization_id', org.id)
        .maybeSingle()

      if (subError && subError.code !== 'PGRST116') {
        console.warn(`Warning: Could not fetch subscription for org ${org.id}:`, subError.message)
      }

      // Get profiles for this organization
      const orgProfiles = profilesData?.filter(p => p.organization_id === org.id) || []

      // Add subscription and profiles to organization
      enrichedOrgs.push({
        ...org,
        subscriptions: subscription ? [subscription] : [],
        profiles: orgProfiles
      })
    }

    // Debug logging
    console.log('📊 Organizations fetched:', enrichedOrgs?.length || 0)
    enrichedOrgs?.forEach((org: any, index: number) => {
      console.log(`Org ${index + 1}: ${org.name}`)
      console.log(`  Subscriptions:`, org.subscriptions?.length || 0)
      if (org.subscriptions?.[0]) {
        console.log(`  Status: ${org.subscriptions[0].status}`)
        console.log(`  Monthly Total: ${org.subscriptions[0].monthly_total}`)
      } else {
        console.log(`  No subscription data found`)
      }
    })

    return NextResponse.json({
      success: true,
      data: enrichedOrgs || []
    })

  } catch (error: any) {
    console.error('Error in organizations API:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Unknown error',
      data: []
    }, { status: 500 })
  }
}

// Extend trial endpoint
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { orgId, action } = body

    if (action === 'extend_trial') {
      // Check if extend_trial RPC exists, otherwise do it manually
      const { data: subscription, error: fetchError } = await supabaseAdmin
        .from('subscriptions')
        .select('*')
        .eq('organization_id', orgId)
        .single()

      if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw fetchError
      }

      if (!subscription) {
        // Create a new trial subscription if none exists
        const trialEndsAt = new Date()
        trialEndsAt.setDate(trialEndsAt.getDate() + 14) // 14 day trial

        const { data, error } = await supabaseAdmin
          .from('subscriptions')
          .insert({
            organization_id: orgId,
            status: 'trial',
            trial_ends_at: trialEndsAt.toISOString(),
            billing_period: 'monthly',
            user_count: 1,
            user_tier_price: 0,
            monthly_total: 0
          })

        if (error) throw error

        return NextResponse.json({
          success: true,
          message: 'Trial created successfully'
        })
      }

      // Extend existing trial by 14 days
      const currentTrialEnd = new Date(subscription.trial_ends_at || new Date())
      const newTrialEnd = new Date(Math.max(currentTrialEnd.getTime(), Date.now()))
      newTrialEnd.setDate(newTrialEnd.getDate() + 14)

      const { data, error } = await supabaseAdmin
        .from('subscriptions')
        .update({
          trial_ends_at: newTrialEnd.toISOString(),
          status: 'trial'
        })
        .eq('organization_id', orgId)

      if (error) throw error

      return NextResponse.json({
        success: true,
        message: 'Trial extended successfully'
      })
    }

    return NextResponse.json({
      success: false,
      error: 'Invalid action'
    }, { status: 400 })

  } catch (error: any) {
    console.error('Error in organizations POST:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Unknown error'
    }, { status: 500 })
  }
}