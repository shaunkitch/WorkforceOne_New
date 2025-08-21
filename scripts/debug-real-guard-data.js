const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://edeheyeloakiworbkfpg.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function debugRealGuardData() {
  console.log('🔍 Investigating real guard data in database...\n');
  
  try {
    // 1. Check what's actually in security_guard_invitations table
    console.log('1️⃣ Real security_guard_invitations data:');
    const { data: guardInvitations, error: guardError } = await supabase
      .from('security_guard_invitations')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (guardError) {
      console.log('❌ Error accessing security_guard_invitations:', guardError.message);
    } else {
      console.log(`   Found ${guardInvitations.length} guard invitations in database:`);
      guardInvitations.forEach((inv, index) => {
        console.log(`   ${index + 1}. Code: ${inv.invitation_code}`);
        console.log(`      Email: ${inv.email}`);
        console.log(`      Name: ${inv.name || 'No name'}`);
        console.log(`      Status: ${inv.status}`);
        console.log(`      Created: ${inv.created_at}`);
        console.log(`      Accepted by: ${inv.accepted_by || 'Not accepted'}`);
        console.log(`      Accepted at: ${inv.accepted_at || 'Not accepted'}`);
        console.log('      ---');
      });
    }

    // 2. Check what's in user_products table (actual guard access)
    console.log('\n2️⃣ Real user_products data (guard-management access):');
    const { data: userProducts, error: productsError } = await supabase
      .from('user_products')
      .select(`
        *,
        profiles:user_id (
          id,
          email,
          full_name,
          created_at
        )
      `)
      .eq('product_id', 'guard-management')
      .order('granted_at', { ascending: false });
    
    if (productsError) {
      console.log('❌ Error accessing user_products:', productsError.message);
    } else {
      console.log(`   Found ${userProducts.length} users with guard-management access:`);
      userProducts.forEach((up, index) => {
        console.log(`   ${index + 1}. User ID: ${up.user_id}`);
        console.log(`      Email: ${up.profiles?.email || 'No email'}`);
        console.log(`      Name: ${up.profiles?.full_name || 'No name'}`);
        console.log(`      Access granted: ${up.granted_at}`);
        console.log(`      Active: ${up.is_active}`);
        console.log(`      Profile created: ${up.profiles?.created_at || 'No profile'}`);
        console.log('      ---');
      });
    }

    // 3. Check recent auth.users entries (recent sign-ups)
    console.log('\n3️⃣ Recent user sign-ups (last 10):');
    const { data: recentUsers, error: usersError } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (usersError) {
      console.log('❌ Error accessing profiles:', usersError.message);
    } else {
      console.log(`   Found ${recentUsers.length} recent profiles:`);
      recentUsers.forEach((user, index) => {
        console.log(`   ${index + 1}. ID: ${user.id}`);
        console.log(`      Email: ${user.email || 'No email'}`);
        console.log(`      Name: ${user.full_name || 'No name'}`);
        console.log(`      Created: ${user.created_at}`);
        console.log(`      Organization: ${user.organization_id || 'No org'}`);
        console.log('      ---');
      });
    }

    // 4. Check if the auto-generated emails are in the system
    console.log('\n4️⃣ Looking for auto-generated email accounts:');
    const { data: autoEmails, error: autoError } = await supabase
      .from('profiles')
      .select('*')
      .like('email', '%@auto-invite.temp')
      .order('created_at', { ascending: false });
    
    if (autoError) {
      console.log('❌ Error checking auto-generated emails:', autoError.message);
    } else {
      console.log(`   Found ${autoEmails.length} auto-generated email accounts:`);
      autoEmails.forEach((user, index) => {
        console.log(`   ${index + 1}. Email: ${user.email}`);
        console.log(`      Name: ${user.full_name}`);
        console.log(`      Created: ${user.created_at}`);
        console.log(`      ID: ${user.id}`);
        
        // Check if this user has guard access
        const guardAccess = userProducts.find(up => up.user_id === user.id);
        if (guardAccess) {
          console.log(`      ✅ Has guard access (granted: ${guardAccess.granted_at})`);
        } else {
          console.log(`      ❌ No guard access found`);
        }
        console.log('      ---');
      });
    }

    // 5. Check the specific invitation code from our tests
    console.log('\n5️⃣ Checking specific invitation GRD-H8I2KU:');
    const { data: specificInvite, error: specificError } = await supabase
      .from('security_guard_invitations')
      .select('*')
      .eq('invitation_code', 'GRD-H8I2KU')
      .single();
    
    if (specificError) {
      console.log('❌ Error checking GRD-H8I2KU:', specificError.message);
    } else {
      console.log('   Invitation details:');
      console.log(`   - Code: ${specificInvite.invitation_code}`);
      console.log(`   - Email: ${specificInvite.email}`);
      console.log(`   - Status: ${specificInvite.status}`);
      console.log(`   - Accepted by: ${specificInvite.accepted_by || 'Not accepted'}`);
      console.log(`   - Expires: ${specificInvite.expires_at}`);
      
      if (specificInvite.accepted_by) {
        // Check what user accepted this invitation
        const { data: acceptingUser, error: userError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', specificInvite.accepted_by)
          .single();
        
        if (!userError && acceptingUser) {
          console.log(`   - Accepted by user: ${acceptingUser.email} (${acceptingUser.full_name})`);
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
  
  console.log('\n🔍 Real guard data investigation completed!');
  console.log('\n📊 SUMMARY:');
  console.log('   - Check if guard invitations are being properly accepted');
  console.log('   - Verify users get guard-management access in user_products');
  console.log('   - Confirm Guard system shows data from user_products table');
}

debugRealGuardData();