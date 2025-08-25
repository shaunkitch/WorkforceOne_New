import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { withAdminAccess } from '@/middleware/rbac';

export const GET = withAdminAccess(async (request: NextRequest, user: { id: string; email: string }, profile: { organization_id: string; role: string }) => {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    // Get all users in the organization (profile already validated by middleware)
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('id, full_name, email, role, work_type, department, is_active')
      .eq('organization_id', profile.organization_id)
      .order('full_name');

    if (usersError) {
      return NextResponse.json({ error: 'Failed to load users' }, { status: 500 });
    }

    // Get available roles (this would come from the roles table in full RBAC)
    const availableRoles = [
      { id: 'super_admin', name: 'Super Admin', description: 'Full system access' },
      { id: 'organization_admin', name: 'Organization Admin', description: 'Full organization access' },
      { id: 'manager', name: 'Manager', description: 'Management access with reports' },
      { id: 'supervisor', name: 'Supervisor', description: 'Team supervision access' },
      { id: 'employee', name: 'Employee', description: 'Standard employee access' },
      { id: 'guard', name: 'Security Guard', description: 'Security guard mobile app access' },
      { id: 'rep', name: 'Representative', description: 'Field representative access' }
    ];

    return NextResponse.json({
      users,
      roles: availableRoles,
      organization_id: profile.organization_id
    });

  } catch (error) {
    console.error('Error fetching roles:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});

export const PUT = withAdminAccess(async (request: NextRequest, user: { id: string; email: string }, profile: { organization_id: string; role: string }) => {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const body = await request.json();
    const { user_id, role, work_type } = body;

    if (!user_id || !role) {
      return NextResponse.json({ error: 'User ID and role are required' }, { status: 400 });
    }

    // Validate the user belongs to the same organization
    const { data: targetUser, error: targetError } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user_id)
      .single();

    if (targetError || targetUser.organization_id !== profile.organization_id) {
      return NextResponse.json({ error: 'User not found in organization' }, { status: 404 });
    }

    // Update user role and work type
    const updateData: { role: string; work_type?: string } = { role };
    if (work_type) {
      updateData.work_type = work_type;
    }

    const { error: updateError } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', user_id);

    if (updateError) {
      return NextResponse.json({ error: 'Failed to update user role' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'User role updated successfully' 
    });

  } catch (error) {
    console.error('Error updating user role:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
});