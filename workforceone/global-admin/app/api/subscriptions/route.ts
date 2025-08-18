import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const orgId = searchParams.get('orgId')

  if (!orgId) {
    return NextResponse.json({
      success: false,
      error: 'Organization ID is required'
    }, { status: 400 })
  }

  try {
    // Get current subscription for organization
    const { data: subscription, error } = await supabaseAdmin
      .from('subscriptions')
      .select('*')
      .eq('organization_id', orgId)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      throw error
    }

    return NextResponse.json({
      success: true,
      data: subscription || null
    })

  } catch (error: any) {
    console.error('Error fetching subscription:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Unknown error'
    }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { orgId, action, tier, userCount, trialDays } = body

    if (!orgId) {
      return NextResponse.json({
        success: false,
        error: 'Organization ID is required'
      }, { status: 400 })
    }

    switch (action) {
      case 'create_subscription':
        return await createSubscription(orgId, tier, userCount, trialDays)
      
      case 'update_tier':
        return await updateSubscriptionTier(orgId, tier, userCount)
      
      case 'update_user_count':
        return await updateUserCount(orgId, userCount)
      
      case 'extend_trial':
        return await extendTrial(orgId, trialDays || 14)
      
      case 'activate_subscription':
        return await activateSubscription(orgId)
      
      case 'cancel_subscription':
        return await cancelSubscription(orgId)
      
      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action'
        }, { status: 400 })
    }

  } catch (error: any) {
    console.error('Error in subscription API:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Unknown error'
    }, { status: 500 })
  }
}

async function createSubscription(orgId: string, tier: string, userCount: number, trialDays: number = 14) {
  try {
    // Check if subscription already exists
    const { data: existing } = await supabaseAdmin
      .from('subscriptions')
      .select('id')
      .eq('organization_id', orgId)
      .single()

    if (existing) {
      return NextResponse.json({
        success: false,
        error: 'Subscription already exists for this organization'
      }, { status: 400 })
    }

    // Get tier pricing
    const tierPricing = getTierPricing(tier)
    const trialEndsAt = new Date()
    trialEndsAt.setDate(trialEndsAt.getDate() + trialDays)

    // Create subscription
    const { data, error } = await supabaseAdmin
      .from('subscriptions')
      .insert({
        organization_id: orgId,
        status: 'trial',
        billing_period: 'monthly',
        user_count: userCount,
        user_tier_price: tierPricing.perUser,
        monthly_total: tierPricing.perUser * userCount,
        trial_ends_at: trialEndsAt.toISOString(),
        current_period_start: new Date().toISOString(),
        current_period_end: trialEndsAt.toISOString()
      })
      .select()
      .single()

    if (error) throw error

    // Update organization feature flags based on tier
    await updateOrganizationTier(orgId, tier)

    return NextResponse.json({
      success: true,
      message: `${tier} subscription created successfully`,
      data
    })

  } catch (error: any) {
    throw error
  }
}

async function updateSubscriptionTier(orgId: string, tier: string, userCount?: number) {
  try {
    // Get current subscription
    const { data: subscription, error: fetchError } = await supabaseAdmin
      .from('subscriptions')
      .select('*')
      .eq('organization_id', orgId)
      .single()

    if (fetchError) throw fetchError

    // Get tier pricing
    const tierPricing = getTierPricing(tier)
    const finalUserCount = userCount || subscription.user_count

    // Update subscription
    const { data, error } = await supabaseAdmin
      .from('subscriptions')
      .update({
        user_tier_price: tierPricing.perUser,
        user_count: finalUserCount,
        monthly_total: tierPricing.perUser * finalUserCount,
        updated_at: new Date().toISOString()
      })
      .eq('organization_id', orgId)
      .select()
      .single()

    if (error) throw error

    // Update organization feature flags based on tier
    await updateOrganizationTier(orgId, tier)

    return NextResponse.json({
      success: true,
      message: `Subscription updated to ${tier} tier`,
      data
    })

  } catch (error: any) {
    throw error
  }
}

async function updateUserCount(orgId: string, userCount: number) {
  try {
    // Get current subscription
    const { data: subscription, error: fetchError } = await supabaseAdmin
      .from('subscriptions')
      .select('user_tier_price')
      .eq('organization_id', orgId)
      .single()

    if (fetchError) throw fetchError

    // Update user count and monthly total
    const { data, error } = await supabaseAdmin
      .from('subscriptions')
      .update({
        user_count: userCount,
        monthly_total: subscription.user_tier_price * userCount,
        updated_at: new Date().toISOString()
      })
      .eq('organization_id', orgId)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({
      success: true,
      message: `User count updated to ${userCount}`,
      data
    })

  } catch (error: any) {
    throw error
  }
}

async function extendTrial(orgId: string, days: number) {
  try {
    // Get current subscription
    const { data: subscription, error: fetchError } = await supabaseAdmin
      .from('subscriptions')
      .select('trial_ends_at')
      .eq('organization_id', orgId)
      .single()

    if (fetchError) throw fetchError

    // Calculate new trial end date
    const currentTrialEnd = new Date(subscription.trial_ends_at || new Date())
    const newTrialEnd = new Date(Math.max(currentTrialEnd.getTime(), Date.now()))
    newTrialEnd.setDate(newTrialEnd.getDate() + days)

    // Update trial end date
    const { data, error } = await supabaseAdmin
      .from('subscriptions')
      .update({
        trial_ends_at: newTrialEnd.toISOString(),
        status: 'trial',
        updated_at: new Date().toISOString()
      })
      .eq('organization_id', orgId)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({
      success: true,
      message: `Trial extended by ${days} days`,
      data
    })

  } catch (error: any) {
    throw error
  }
}

async function activateSubscription(orgId: string) {
  try {
    const { data, error } = await supabaseAdmin
      .from('subscriptions')
      .update({
        status: 'active',
        current_period_start: new Date().toISOString(),
        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
        updated_at: new Date().toISOString()
      })
      .eq('organization_id', orgId)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({
      success: true,
      message: 'Subscription activated',
      data
    })

  } catch (error: any) {
    throw error
  }
}

async function cancelSubscription(orgId: string) {
  try {
    const { data, error } = await supabaseAdmin
      .from('subscriptions')
      .update({
        status: 'canceled',
        canceled_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('organization_id', orgId)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({
      success: true,
      message: 'Subscription canceled',
      data
    })

  } catch (error: any) {
    throw error
  }
}

async function updateOrganizationTier(orgId: string, tier: string) {
  try {
    // Use the existing pricing tier functions from migration 062
    let functionName: string
    
    switch (tier.toLowerCase()) {
      case 'starter':
        functionName = 'set_starter_tier_flags'
        break
      case 'professional':
        functionName = 'set_professional_tier_flags'
        break
      case 'enterprise':
        functionName = 'set_enterprise_tier_flags'
        break
      default:
        throw new Error(`Invalid tier: ${tier}`)
    }

    // Call the appropriate tier function
    const { error } = await supabaseAdmin.rpc(functionName, {
      org_id: orgId
    })

    if (error) {
      console.warn(`Function ${functionName} not found, updating manually`)
      // Fallback: update feature flags manually
      await updateFeatureFlagsManually(orgId, tier)
    }

  } catch (error: any) {
    console.warn('Tier function call failed, updating manually:', error.message)
    await updateFeatureFlagsManually(orgId, tier)
  }
}

async function updateFeatureFlagsManually(orgId: string, tier: string) {
  const featureFlags = getFeatureFlagsForTier(tier)
  
  const { error } = await supabaseAdmin
    .from('organizations')
    .update({ feature_flags: featureFlags })
    .eq('id', orgId)

  if (error) throw error
}

function getTierPricing(tier: string) {
  switch (tier.toLowerCase()) {
    case 'starter':
      return { perUser: 5, name: 'Starter' }
    case 'professional':
      return { perUser: 9, name: 'Professional' }
    case 'enterprise':
      return { perUser: 21, name: 'Enterprise' }
    default:
      throw new Error(`Invalid tier: ${tier}`)
  }
}

function getFeatureFlagsForTier(tier: string) {
  const baseFlags = {
    dashboard: true,
    attendance: true,
    leave: true,
    teams: true,
    forms: true,
    mobile_clock_in: true,
    mobile_leave: true,
    mobile_forms: true
  }

  switch (tier.toLowerCase()) {
    case 'starter':
      return {
        ...baseFlags,
        time_tracking: false,
        projects: false,
        tasks: false,
        routes: false,
        maps: false,
        outlets: false,
        analytics: false,
        automation: false,
        integrations: false,
        payroll: false,
        custom_branding: false,
        color_schemes: false,
        priority_support: false,
        phone_support: false
      }

    case 'professional':
      return {
        ...baseFlags,
        time_tracking: true,
        projects: true,
        tasks: true,
        routes: true,
        maps: true,
        outlets: true,
        analytics: true,
        custom_branding: true,
        color_schemes: true,
        mobile_offline_mode: true,
        mobile_push_notifications: true,
        mobile_gps_tracking: true,
        mobile_photo_attachments: true,
        priority_support: true,
        automation: false,
        integrations: false,
        payroll: false,
        phone_support: false
      }

    case 'enterprise':
      return {
        ...baseFlags,
        time_tracking: true,
        projects: true,
        tasks: true,
        routes: true,
        maps: true,
        outlets: true,
        analytics: true,
        automation: true,
        integrations: true,
        payroll: true,
        daily_calls: true,
        messaging: true,
        api_access: true,
        custom_branding: true,
        color_schemes: true,
        mobile_offline_mode: true,
        mobile_push_notifications: true,
        mobile_gps_tracking: true,
        mobile_photo_attachments: true,
        mobile_analytics: true,
        mobile_messaging: true,
        mobile_daily_calls: true,
        mobile_payslips: true,
        priority_support: true,
        phone_support: true,
        dedicated_support: true
      }


    default:
      return baseFlags
  }
}