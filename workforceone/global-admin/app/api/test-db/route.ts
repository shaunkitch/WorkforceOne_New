import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  try {
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
    
    return NextResponse.json({
      success: true,
      tables: tableTests,
      summary: {
        totalTables: Object.keys(tableTests).filter(k => tableTests[k].exists).length,
        missingTables: Object.keys(tableTests).filter(k => !tableTests[k].exists)
      }
    })
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message || 'Unknown error',
      details: error
    })
  }
}