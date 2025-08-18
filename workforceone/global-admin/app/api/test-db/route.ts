import { NextResponse } from 'next/server'
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase'
import { debugEnvironment } from '@/lib/debug-env'

export async function GET() {
  try {
    // Debug environment first
    const envDebug = debugEnvironment()
    const configured = isSupabaseConfigured()
    
    console.log('🔧 API Route Environment Check:', envDebug)
    console.log('✅ Supabase Configured:', configured)
    
    if (!configured) {
      return NextResponse.json({
        success: false,
        error: 'Supabase configuration incomplete',
        debug: envDebug
      }, { status: 500 })
    }
    // Test each table individually
    const tableTests: Record<string, any> = {}
    
    // Test profiles table
    const { count: profileCount, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('*', { count: 'exact', head: true })
    
    tableTests.profiles = {
      exists: !profileError,
      count: profileCount || 0,
      error: profileError?.message
    }
    
    // Test organizations table
    const { count: orgCount, error: orgError } = await supabaseAdmin
      .from('organizations')
      .select('*', { count: 'exact', head: true })
    
    tableTests.organizations = {
      exists: !orgError,
      count: orgCount || 0,
      error: orgError?.message
    }
    
    // Test subscriptions table
    const { count: subCount, error: subError } = await supabaseAdmin
      .from('subscriptions')
      .select('*', { count: 'exact', head: true })
    
    tableTests.subscriptions = {
      exists: !subError,
      count: subCount || 0,
      error: subError?.message
    }
    
    // Test invoices table
    const { count: invCount, error: invError } = await supabaseAdmin
      .from('invoices')
      .select('*', { count: 'exact', head: true })
    
    tableTests.invoices = {
      exists: !invError,
      count: invCount || 0,
      error: invError?.message
    }
    
    // Test teams table
    const { count: teamCount, error: teamError } = await supabaseAdmin
      .from('teams')
      .select('*', { count: 'exact', head: true })
    
    tableTests.teams = {
      exists: !teamError,
      count: teamCount || 0,
      error: teamError?.message
    }
    
    // Additional test: Check subscription data specifically
    let subscriptionDebug = {}
    if (tableTests.subscriptions.exists && tableTests.organizations.exists) {
      try {
        // Get sample subscription data
        const { data: subsData, error: subsError } = await supabaseAdmin
          .from('subscriptions')
          .select('*')
          .limit(5)

        // Test multiple join approaches
        const { data: orgsWithSubs, error: orgsError } = await supabaseAdmin
          .from('organizations')
          .select(`
            id,
            name,
            subscriptions (
              status,
              trial_ends_at,
              monthly_total,
              user_count,
              updated_at
            )
          `)
          .limit(5)

        // Alternative approach: Manual join
        const { data: manualJoin, error: manualError } = await supabaseAdmin
          .from('organizations')
          .select(`
            id,
            name
          `)
          .limit(5)

        // For each org, fetch subscription separately
        const manualResults = []
        if (manualJoin && !manualError) {
          for (const org of manualJoin) {
            const { data: orgSub, error: subError } = await supabaseAdmin
              .from('subscriptions')
              .select('status, monthly_total, user_count')
              .eq('organization_id', org.id)
              .maybeSingle()
            
            manualResults.push({
              ...org,
              subscription: orgSub,
              subscription_error: subError?.message
            })
          }
        }

        // Get organization IDs for comparison
        const { data: allOrgs, error: allOrgsError } = await supabaseAdmin
          .from('organizations')
          .select('id, name')
        
        subscriptionDebug = {
          direct_subscriptions_count: subsData?.length || 0,
          organizations_with_subs_count: orgsWithSubs?.filter(org => org.subscriptions?.length > 0).length || 0,
          organization_ids: allOrgs?.map(org => ({ id: org.id, name: org.name })) || [],
          subscription_org_ids: subsData?.map(sub => sub.organization_id) || [],
          join_query_error: orgsError?.message,
          manual_join_error: manualError?.message,
          id_mismatch: {
            org_ids: allOrgs?.map(org => org.id) || [],
            sub_org_ids: subsData?.map(sub => sub.organization_id) || [],
            intersection: allOrgs?.filter(org => 
              subsData?.some(sub => sub.organization_id === org.id)
            ).map(org => org.id) || []
          },
          sample_subscription_statuses: subsData?.map(sub => ({
            org_id: sub.organization_id,
            status: sub.status,
            monthly_total: sub.monthly_total
          })) || [],
          sample_orgs_with_subs: orgsWithSubs?.map(org => ({
            id: org.id,
            name: org.name,
            subscription_count: org.subscriptions?.length || 0,
            subscription_status: org.subscriptions?.[0]?.status || 'none'
          })) || [],
          manual_join_results: manualResults.map(org => ({
            id: org.id,
            name: org.name,
            has_subscription: !!org.subscription,
            subscription_status: org.subscription?.status || 'none',
            subscription_error: org.subscription_error || null
          }))
        }

        console.log('🔍 Subscription Debug Results:', subscriptionDebug)

      } catch (subDebugError: any) {
        subscriptionDebug = {
          error: subDebugError.message
        }
      }
    }

    return NextResponse.json({
      success: true,
      tables: tableTests,
      subscription_debug: subscriptionDebug,
      summary: {
        totalTables: Object.keys(tableTests).filter(k => tableTests[k].exists).length,
        missingTables: Object.keys(tableTests).filter(k => !tableTests[k].exists)
      },
      debug: envDebug,
      configured
    })
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message || 'Unknown error',
      details: error
    })
  }
}