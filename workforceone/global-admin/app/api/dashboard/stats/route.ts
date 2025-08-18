import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  try {
    // Use admin client for global statistics
    const [
      orgsResponse,
      usersResponse,
      subscriptionsResponse,
      revenueResponse
    ] = await Promise.all([
      supabaseAdmin.from('organizations').select('*'),
      supabaseAdmin.from('profiles').select('*'),
      supabaseAdmin.from('subscriptions').select('*'),
      supabaseAdmin.from('invoices').select('total_amount, status, created_at')
    ])

    // Check for errors
    const errors: any = {}
    if (orgsResponse.error) errors.organizations = orgsResponse.error
    if (usersResponse.error) errors.users = usersResponse.error
    if (subscriptionsResponse.error) errors.subscriptions = subscriptionsResponse.error
    if (revenueResponse.error) errors.invoices = revenueResponse.error

    // If we have errors, return them but still provide mock data
    if (Object.keys(errors).length > 0) {
      console.warn('Database query errors:', errors)
      
      // Return mock data if there are errors
      return NextResponse.json({
        success: true,
        useMockData: true,
        errors,
        data: {
          organizations: [
            { id: 1, name: 'TechCorp Inc', status: 'active', created_at: '2024-01-15' },
            { id: 2, name: 'RetailChain', status: 'active', created_at: '2024-01-20' },
            { id: 3, name: 'StartupXYZ', status: 'trial', created_at: '2024-02-01' },
            { id: 4, name: 'Enterprise Ltd', status: 'active', created_at: '2024-02-10' },
            { id: 5, name: 'InnovateHub', status: 'trial', created_at: '2024-02-15' }
          ],
          users: Array.from({ length: 142 }, (_, i) => ({ 
            id: i + 1, 
            email: `user${i + 1}@example.com`, 
            created_at: '2024-01-01' 
          })),
          subscriptions: [
            { id: 1, organization_id: 1, status: 'active', plan: 'enterprise', trial_ends_at: null },
            { id: 2, organization_id: 2, status: 'active', plan: 'business', trial_ends_at: null },
            { id: 3, organization_id: 3, status: 'trial', plan: 'business', trial_ends_at: '2024-03-01' },
            { id: 4, organization_id: 4, status: 'active', plan: 'enterprise', trial_ends_at: null },
            { id: 5, organization_id: 5, status: 'trial', plan: 'starter', trial_ends_at: '2024-03-15' }
          ],
          invoices: [
            { total_amount: 299.99, status: 'paid', created_at: '2024-02-01' },
            { total_amount: 199.99, status: 'paid', created_at: '2024-02-01' },
            { total_amount: 499.99, status: 'paid', created_at: '2024-01-15' },
            { total_amount: 99.99, status: 'pending', created_at: '2024-02-15' },
            { total_amount: 299.99, status: 'paid', created_at: '2024-01-01' }
          ]
        }
      })
    }

    // Return successful data
    return NextResponse.json({
      success: true,
      useMockData: false,
      data: {
        organizations: orgsResponse.data || [],
        users: usersResponse.data || [],
        subscriptions: subscriptionsResponse.data || [],
        invoices: revenueResponse.data || []
      }
    })

  } catch (error: any) {
    console.error('Dashboard stats API error:', error)
    
    // Return mock data on catch
    return NextResponse.json({
      success: true,
      useMockData: true,
      error: error.message,
      data: {
        organizations: [
          { id: 1, name: 'TechCorp Inc', status: 'active', created_at: '2024-01-15' },
          { id: 2, name: 'RetailChain', status: 'active', created_at: '2024-01-20' }
        ],
        users: Array.from({ length: 50 }, (_, i) => ({ 
          id: i + 1, 
          email: `user${i + 1}@example.com`, 
          created_at: '2024-01-01' 
        })),
        subscriptions: [
          { id: 1, organization_id: 1, status: 'active', plan: 'enterprise', trial_ends_at: null },
          { id: 2, organization_id: 2, status: 'active', plan: 'business', trial_ends_at: null }
        ],
        invoices: [
          { total_amount: 299.99, status: 'paid', created_at: '2024-02-01' },
          { total_amount: 199.99, status: 'paid', created_at: '2024-02-01' }
        ]
      }
    })
  }
}