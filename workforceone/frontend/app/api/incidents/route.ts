import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/client';
import { logger, apiLog } from '@/lib/utils/logger';

// In-memory storage for demo incidents (simulating local storage from mobile)
const demoIncidents = [
  {
    id: 'INC-DEMO-001',
    title: 'Test Incident from Mobile App',
    description: 'This is a test incident created from the mobile app',
    category: 'suspicious',
    severity: 'medium' as const,
    latitude: -26.2041,
    longitude: 28.0473,
    address: 'Mobile Test Location',
    guard_id: 'mobile-guard-001',
    guard_name: 'Mobile Test Guard',
    status: 'submitted' as const,
    metadata: {
      photos: 2,
      photo_urls: [
        'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&h=400&fit=crop&crop=center',
        'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=400&fit=crop&crop=center'
      ],
      timestamp: new Date().toISOString(),
      device_info: 'mobile',
      source: 'mobile_app'
    },
    created_at: new Date(Date.now() - 10 * 60 * 1000).toISOString(), // 10 minutes ago
    updated_at: new Date().toISOString()
  }
];

export async function GET(request: NextRequest) {
  try {
    apiLog('GET /api/incidents', 'Incidents API called');
    
    const incidents = [];
    
    // Try to get incidents from database first
    try {
      const supabase = createClient();
      const { data: dbIncidents, error } = await supabase
        .from('security_incidents')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);
        
      if (!error && dbIncidents && dbIncidents.length > 0) {
        apiLog('GET /api/incidents', `Found ${dbIncidents.length} incidents from database`);
        incidents.push(...dbIncidents.map(incident => ({
          ...incident,
          source: 'database'
        })));
      } else {
        logger.warn('Database incidents error or empty', { error: error?.message || 'No incidents' }, 'API');
      }
    } catch (dbError) {
      logger.error('Database connection error', dbError, 'API');
    }
    
    // Add demo incidents (simulating mobile app local storage)
    incidents.push(...demoIncidents);
    
    // Add mock incidents for fallback
    const mockIncidents = [
      {
        id: 'INC-MOCK-001',
        title: 'Suspicious Activity Reported',
        description: 'Unregistered vehicle parked in restricted area for over 30 minutes.',
        category: 'suspicious',
        severity: 'medium' as const,
        latitude: -26.2041,
        longitude: 28.0473,
        address: 'Main Office Parking Lot',
        guard_id: null,
        guard_name: 'John Smith',
        status: 'investigating' as const,
        metadata: {
          photos: 3,
          photo_urls: [
            'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=400&fit=crop&crop=center',
            'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&h=400&fit=crop&crop=center',
            'https://images.unsplash.com/photo-1511649475669-e288648b2339?w=600&h=400&fit=crop&crop=center'
          ],
          timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
          device_info: 'mobile',
          source: 'mock'
        },
        created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'INC-MOCK-002',
        title: 'Unauthorized Access Attempt',
        description: 'Person attempted to enter restricted area without proper credentials.',
        category: 'trespassing',
        severity: 'high' as const,
        latitude: -26.2051,
        longitude: 28.0483,
        address: 'Building B Security Entrance',
        guard_id: null,
        guard_name: 'Sarah Johnson',
        status: 'resolved' as const,
        metadata: {
          photos: 1,
          photo_urls: [
            'https://images.unsplash.com/photo-1577962917302-cd874c4e31d2?w=600&h=400&fit=crop&crop=center'
          ],
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          device_info: 'mobile',
          source: 'mock'
        },
        created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        updated_at: new Date().toISOString()
      }
    ];
    
    incidents.push(...mockIncidents);
    
    // Sort by created_at descending
    incidents.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    
    apiLog('GET /api/incidents', `Returning ${incidents.length} total incidents`);
    
    return NextResponse.json({
      success: true,
      data: incidents,
      count: incidents.length,
      sources: {
        database: incidents.filter(i => i.metadata?.source === 'database').length,
        mobile: incidents.filter(i => i.metadata?.source === 'mobile_app').length,
        mock: incidents.filter(i => i.metadata?.source === 'mock').length
      }
    });
    
  } catch (error) {
    console.error('❌ Incidents API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch incidents',
      data: []
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const incidentData = await request.json();
    apiLog('POST /api/incidents', `Receiving incident: ${incidentData.title}`);
    
    // Add to demo incidents (simulating storage)
    const newIncident = {
      ...incidentData,
      id: incidentData.id || `INC-API-${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      metadata: {
        ...incidentData.metadata,
        source: 'mobile_api'
      }
    };
    
    demoIncidents.unshift(newIncident);
    
    // Keep only last 50 incidents
    if (demoIncidents.length > 50) {
      demoIncidents.splice(50);
    }
    
    apiLog('POST /api/incidents', 'Incident stored successfully');
    
    return NextResponse.json({
      success: true,
      data: newIncident
    });
    
  } catch (error) {
    console.error('❌ POST incidents API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to save incident'
    }, { status: 500 });
  }
}