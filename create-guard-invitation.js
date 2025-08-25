const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://edeheyeloakiworbkfpg.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVkZWhleWVsb2FraXdvcmJrZnBnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDkxODY3NSwiZXhwIjoyMDcwNDk0Njc1fQ.HNoN21ykstlIQ6sPF5bsJtRyQyCTKENDBtFzgkEe40c'
);

async function createGuardInvitation() {
  try {
    console.log('🔧 Creating proper guard invitation with organization...');
    
    // First, ensure WorkforceOne organization has features enabled
    const testOrgId = 'a0add796-4a4f-488a-8af2-227ec3247316';
    
    const { data: org, error: orgError } = await supabase
      .from('organizations')
      .select('feature_flags')
      .eq('id', testOrgId)
      .single();
      
    if (orgError) {
      console.error('❌ Org error:', orgError);
      return;
    }
    
    console.log('📋 Updating organization features...');
    const updatedFlags = {
      ...org.feature_flags,
      // Enable all master toggles and specific features
      mobile_guard_product: true,
      mobile_workforce_product: true,
      mobile_time_product: true,
      guard_management: true,
      workforce_management: true,
      time_tracking: true
    };
    
    await supabase
      .from('organizations')
      .update({ feature_flags: updatedFlags })
      .eq('id', testOrgId);
    
    console.log('✅ Features enabled for organization');
    
    // Create a new guard invitation
    const invitationCode = 'GRD-' + Math.random().toString(36).substring(2, 8).toUpperCase();
    
    const { data: invitation, error: inviteError } = await supabase
      .from('product_invitations')
      .insert({
        invitation_code: invitationCode,
        products: ['guard-management'],
        organization_id: testOrgId,
        status: 'pending',
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
      })
      .select()
      .single();
      
    if (inviteError) {
      console.error('❌ Invitation creation error:', inviteError);
      return;
    }
    
    console.log('✅ Guard invitation created successfully!');
    console.log('📱 QR Code Data:', JSON.stringify({
      type: 'GUARD_INVITE',
      code: invitationCode
    }));
    console.log('');
    console.log('🔗 Full QR String:', `GUARD_INVITE:{"code":"${invitationCode}"}`);
    console.log('');
    console.log('📋 Invitation Details:');
    console.log('  - Code:', invitationCode);
    console.log('  - Organization:', 'WorkforceOne');
    console.log('  - Products:', invitation.products);
    console.log('  - Status:', invitation.status);
    console.log('  - Expires:', invitation.expires_at);
    
    // Also update the existing guard user's organization
    console.log('\n🔄 Updating existing guard users to have organization...');
    const { data: guardUsers, error: guardError } = await supabase
      .from('profiles')
      .select('id, email')
      .eq('role', 'guard')
      .is('organization_id', null);
      
    if (!guardError && guardUsers && guardUsers.length > 0) {
      for (const guard of guardUsers) {
        if (guard.email && guard.email.includes('@auto-invite.temp')) {
          await supabase
            .from('profiles')
            .update({ organization_id: testOrgId })
            .eq('id', guard.id);
          console.log('  ✅ Updated guard:', guard.email);
        }
      }
    }
    
    // Grant guard-management product access to the guard users
    console.log('\n🔄 Granting product access to guard users...');
    if (guardUsers && guardUsers.length > 0) {
      for (const guard of guardUsers) {
        // Check if user_products entry exists
        const { data: existing } = await supabase
          .from('user_products')
          .select('id')
          .eq('user_id', guard.id)
          .eq('product_id', 'guard-management')
          .maybeSingle();
          
        if (!existing) {
          await supabase
            .from('user_products')
            .insert({
              user_id: guard.id,
              product_id: 'guard-management',
              is_active: true
            });
          console.log('  ✅ Granted guard-management access to:', guard.email);
        }
      }
    }
    
    console.log('\n🎉 Setup complete! Guard users now have:');
    console.log('  - Organization membership ✅');
    console.log('  - Guard-management product access ✅');
    console.log('  - Access to enabled features ✅');
    
  } catch (err) {
    console.error('❌ Failed:', err.message);
  }
}

createGuardInvitation();
