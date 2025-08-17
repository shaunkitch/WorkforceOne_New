import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status') || 'active'
    const severity = searchParams.get('severity')
    const limit = parseInt(searchParams.get('limit') || '50')

    // In a real implementation, this would query your alerts database
    // For now, we'll generate some mock alerts based on current system status
    
    const mockAlerts = [
      {
        id: '1',
        title: 'High Database Latency',
        description: 'Database response time exceeding 500ms threshold',
        severity: 'warning' as const,
        status: 'active',
        metric_type: 'supabase_db_latency',
        current_value: 650,
        threshold_value: 500,
        source: 'supabase',
        first_seen_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
        last_seen_at: new Date().toISOString(),
        count: 15,
        tags: ['database', 'performance']
      },
      {
        id: '2',
        title: 'Vercel Deployment Failed',
        description: 'Latest deployment to production environment failed',
        severity: 'critical' as const,
        status: 'active',
        metric_type: 'vercel_deployment_status',
        current_value: 0,
        threshold_value: 1,
        source: 'vercel',
        first_seen_at: new Date(Date.now() - 15 * 60 * 1000).toISOString(), // 15 minutes ago
        last_seen_at: new Date().toISOString(),
        count: 1,
        tags: ['deployment', 'production']
      },
      {
        id: '3',
        title: 'High Error Rate',
        description: 'Application error rate is above 2% threshold',
        severity: 'warning' as const,
        status: 'acknowledged',
        metric_type: 'error_rate',
        current_value: 3.2,
        threshold_value: 2.0,
        source: 'vercel',
        first_seen_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
        last_seen_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 minutes ago
        count: 8,
        acknowledged_by: 'Global Admin',
        acknowledged_at: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
        tags: ['application', 'errors']
      },
      {
        id: '4',
        title: 'Storage Quota Warning',
        description: 'Supabase storage usage is approaching 80% of quota',
        severity: 'info' as const,
        status: 'active',
        metric_type: 'storage_usage',
        current_value: 78,
        threshold_value: 80,
        source: 'supabase',
        first_seen_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6 hours ago
        last_seen_at: new Date().toISOString(),
        count: 1,
        tags: ['storage', 'quota']
      },
      {
        id: '5',
        title: 'Memory Usage Spike',
        description: 'Server memory usage exceeded 85% threshold',
        severity: 'warning' as const,
        status: 'resolved',
        metric_type: 'memory_usage',
        current_value: 88,
        threshold_value: 85,
        source: 'system',
        first_seen_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(), // 4 hours ago
        last_seen_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), // 1 hour ago
        count: 3,
        resolved_by: 'Auto-scaling',
        resolved_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
        tags: ['memory', 'performance']
      }
    ]

    // Filter alerts based on query parameters
    let filteredAlerts = mockAlerts

    if (status !== 'all') {
      filteredAlerts = filteredAlerts.filter(alert => alert.status === status)
    }

    if (severity) {
      filteredAlerts = filteredAlerts.filter(alert => alert.severity === severity)
    }

    // Apply limit
    filteredAlerts = filteredAlerts.slice(0, limit)

    const response = {
      success: true,
      data: filteredAlerts,
      meta: {
        total: filteredAlerts.length,
        status_filter: status,
        severity_filter: severity,
        limit,
        counts: {
          active: mockAlerts.filter(a => a.status === 'active').length,
          acknowledged: mockAlerts.filter(a => a.status === 'acknowledged').length,
          resolved: mockAlerts.filter(a => a.status === 'resolved').length,
          critical: mockAlerts.filter(a => a.severity === 'critical').length,
          warning: mockAlerts.filter(a => a.severity === 'warning').length,
          info: mockAlerts.filter(a => a.severity === 'info').length
        }
      }
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Alerts fetch error:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch alerts',
      data: []
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, description, severity, metric_type, source, threshold_value, current_value } = body

    // Validate required fields
    if (!title || !description || !severity || !source) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: title, description, severity, source'
      }, { status: 400 })
    }

    // In a real implementation, this would save to your alerts database
    const newAlert = {
      id: Date.now().toString(),
      title,
      description,
      severity,
      status: 'active',
      metric_type,
      current_value,
      threshold_value,
      source,
      first_seen_at: new Date().toISOString(),
      last_seen_at: new Date().toISOString(),
      count: 1,
      tags: []
    }

    return NextResponse.json({
      success: true,
      data: newAlert,
      message: 'Alert created successfully'
    }, { status: 201 })
  } catch (error) {
    console.error('Alert creation error:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to create alert'
    }, { status: 500 })
  }
}