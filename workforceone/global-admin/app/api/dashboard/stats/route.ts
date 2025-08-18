import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  try {
    console.log('🚀 Fetching dashboard statistics from database...')
    
    // Use admin client for global statistics
    const [
      orgsResponse,
      usersResponse,
      subscriptionsResponse,
      invoicesResponse
    ] = await Promise.all([
      supabaseAdmin
        .from('organizations')
        .select('id, name, slug, created_at, updated_at'),
      supabaseAdmin
        .from('profiles')
        .select('id, email, organization_id, created_at, last_login'),
      supabaseAdmin
        .from('subscriptions')
        .select('id, organization_id, status, user_tier_price, monthly_total, user_count, trial_ends_at, created_at, updated_at'),
      supabaseAdmin
        .from('invoices')
        .select('id, total_amount, status, created_at, organization_id')
    ])

    console.log('📊 Database response summary:', {
      organizations: orgsResponse.data?.length || 0,
      users: usersResponse.data?.length || 0,
      subscriptions: subscriptionsResponse.data?.length || 0,
      invoices: invoicesResponse.data?.length || 0,
      errors: {
        orgs: orgsResponse.error?.message,
        users: usersResponse.error?.message,
        subscriptions: subscriptionsResponse.error?.message,
        invoices: invoicesResponse.error?.message
      }
    })

    // Check for critical errors that would prevent calculation
    const hasData = (orgsResponse.data && orgsResponse.data.length > 0) ||
                   (usersResponse.data && usersResponse.data.length > 0) ||
                   (subscriptionsResponse.data && subscriptionsResponse.data.length > 0)

    if (!hasData) {
      console.log('📋 No real data found, returning mock data for demo')
      return getMockData(true)
    }

    // Transform real data to ensure proper format
    const organizations = orgsResponse.data || []
    const users = usersResponse.data || []
    const subscriptions = (subscriptionsResponse.data || []).map(sub => ({
      ...sub,
      // Ensure we have the correct status format
      status: sub.status || 'trial',
      // Add plan field based on pricing tier
      plan: getPlanFromPrice(sub.user_tier_price || 0)
    }))
    const invoices = invoicesResponse.data || []

    // Return successful data
    return NextResponse.json({
      success: true,
      useMockData: false,
      data: {
        organizations,
        users,
        subscriptions,
        invoices
      },
      stats: {
        organizationCount: organizations.length,
        userCount: users.length,
        subscriptionCount: subscriptions.length,
        invoiceCount: invoices.length
      }
    })

  } catch (error: any) {
    console.error('❌ Dashboard stats API error:', error)
    return getMockData(true, error.message)
  }
}

function getPlanFromPrice(price: number): string {
  if (price === 5) return 'starter'
  if (price === 9) return 'professional'  
  if (price === 21) return 'enterprise'
  if (price === 4) return 'starter' // yearly
  if (price === 7) return 'professional' // yearly
  if (price === 17) return 'enterprise' // yearly
  return 'starter'
}

function getMockData(useMockData: boolean, errorMessage?: string) {
  return NextResponse.json({
    success: true,
    useMockData,
    error: errorMessage,
    data: {
      organizations: [
        { id: '1', name: 'TechCorp Inc', slug: 'techcorp', created_at: '2024-01-15T00:00:00Z' },
        { id: '2', name: 'RetailChain', slug: 'retailchain', created_at: '2024-01-20T00:00:00Z' },
        { id: '3', name: 'StartupXYZ', slug: 'startupxyz', created_at: '2024-02-01T00:00:00Z' },
        { id: '4', name: 'Enterprise Ltd', slug: 'enterprise', created_at: '2024-02-10T00:00:00Z' },
        { id: '5', name: 'InnovateHub', slug: 'innovatehub', created_at: '2024-02-15T00:00:00Z' }
      ],
      users: Array.from({ length: 142 }, (_, i) => ({ 
        id: `user-${i + 1}`, 
        email: `user${i + 1}@example.com`, 
        organization_id: `${(i % 5) + 1}`,
        created_at: '2024-01-01T00:00:00Z',
        last_login: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
      })),
      subscriptions: [
        { 
          id: '1', 
          organization_id: '1', 
          status: 'active', 
          plan: 'enterprise',
          user_tier_price: 21,
          monthly_total: 420,
          user_count: 20,
          trial_ends_at: null,
          created_at: '2024-01-15T00:00:00Z'
        },
        { 
          id: '2', 
          organization_id: '2', 
          status: 'active', 
          plan: 'professional',
          user_tier_price: 9,
          monthly_total: 180,
          user_count: 20,
          trial_ends_at: null,
          created_at: '2024-01-20T00:00:00Z'
        },
        { 
          id: '3', 
          organization_id: '3', 
          status: 'trial', 
          plan: 'professional',
          user_tier_price: 9,
          monthly_total: 90,
          user_count: 10,
          trial_ends_at: '2024-03-01T00:00:00Z',
          created_at: '2024-02-01T00:00:00Z'
        },
        { 
          id: '4', 
          organization_id: '4', 
          status: 'active', 
          plan: 'enterprise',
          user_tier_price: 21,
          monthly_total: 630,
          user_count: 30,
          trial_ends_at: null,
          created_at: '2024-02-10T00:00:00Z'
        },
        { 
          id: '5', 
          organization_id: '5', 
          status: 'trial', 
          plan: 'starter',
          user_tier_price: 5,
          monthly_total: 25,
          user_count: 5,
          trial_ends_at: '2024-03-15T00:00:00Z',
          created_at: '2024-02-15T00:00:00Z'
        }
      ],
      invoices: [
        { id: '1', total_amount: 420, status: 'paid', created_at: '2024-02-01T00:00:00Z', organization_id: '1' },
        { id: '2', total_amount: 180, status: 'paid', created_at: '2024-02-01T00:00:00Z', organization_id: '2' },
        { id: '3', total_amount: 630, status: 'paid', created_at: '2024-01-15T00:00:00Z', organization_id: '4' },
        { id: '4', total_amount: 90, status: 'pending', created_at: '2024-02-15T00:00:00Z', organization_id: '3' },
        { id: '5', total_amount: 420, status: 'paid', created_at: '2024-01-01T00:00:00Z', organization_id: '1' }
      ]
    }
  })
}