import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const orgId = params.id

    if (!orgId) {
      return NextResponse.json({
        success: false,
        error: 'Organization ID is required'
      }, { status: 400 })
    }

    // Fetch organization with all related data
    const { data: organization, error: orgError } = await supabaseAdmin
      .from('organizations')
      .select(`
        *,
        subscriptions (*),
        profiles (*),
        invoices (*),
        subscription_features (*, features (*))
      `)
      .eq('id', orgId)
      .single()

    if (orgError) {
      console.error('Error fetching organization:', orgError)
      return NextResponse.json({
        success: false,
        error: orgError.message
      }, { status: 500 })
    }

    if (!organization) {
      return NextResponse.json({
        success: false,
        error: 'Organization not found'
      }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: organization
    })

  } catch (error: any) {
    console.error('Error in organization detail API:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Unknown error'
    }, { status: 500 })
  }
}