import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's organization
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile?.organization_id) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Try to get organization features from the database
    // First check if the database has our RBAC tables
    const { data: features, error: featuresError } = await supabase
      .from('organization_features')
      .select(`
        feature_id,
        is_enabled,
        features (
          key,
          name,
          description,
          category,
          product_id
        )
      `)
      .eq('organization_id', profile.organization_id);

    if (featuresError) {
      // Fallback to legacy feature_flags in organizations table
      const { data: organization, error: orgError } = await supabase
        .from('organizations')
        .select('feature_flags')
        .eq('id', profile.organization_id)
        .single();

      if (orgError) {
        return NextResponse.json({ error: 'Failed to load features' }, { status: 500 });
      }

      return NextResponse.json({
        features: organization.feature_flags || {},
        legacy: true
      });
    }

    // Transform database features to frontend format
    const featureMap: Record<string, boolean> = {};
    features?.forEach((feature) => {
      if (feature.features) {
        featureMap[feature.features.key] = feature.is_enabled;
      }
    });

    return NextResponse.json({
      features: featureMap,
      legacy: false,
      organization_id: profile.organization_id
    });

  } catch (error) {
    console.error('Error fetching features:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's role and organization
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('organization_id, role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile?.organization_id) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 404 });
    }

    // Check if user has permission to modify features (admin/manager only)
    if (!['super_admin', 'organization_admin', 'admin'].includes(profile.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();
    const { features } = body;

    if (!features) {
      return NextResponse.json({ error: 'Features data required' }, { status: 400 });
    }

    // Try to update using the new RBAC system first
    const { error: rbacError } = await supabase
      .from('organization_features')
      .select('id')
      .eq('organization_id', profile.organization_id)
      .limit(1);

    if (!rbacError) {
      // RBAC system exists, use it
      // This would require more complex logic to update organization_features table
      // For now, fall back to legacy system
    }

    // Fallback to legacy feature_flags in organizations table
    const { error: updateError } = await supabase
      .from('organizations')
      .update({ feature_flags: features })
      .eq('id', profile.organization_id);

    if (updateError) {
      return NextResponse.json({ error: 'Failed to update features' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Features updated successfully' 
    });

  } catch (error) {
    console.error('Error updating features:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}