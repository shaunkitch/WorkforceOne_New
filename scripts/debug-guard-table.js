const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://edeheyeloakiworbkfpg.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function debugGuardTable() {
  console.log('🔍 Debugging guard invitation table and flow...\n');
  
  try {
    // 1. Check what's in security_guard_invitations table
    console.log('1️⃣ Checking security_guard_invitations table...');
    const { data: guardInvitations, error: guardError } = await supabase
      .from('security_guard_invitations')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (guardError) {
      console.log('❌ Error accessing security_guard_invitations:', guardError.message);
    } else {
      console.log(`   Found ${guardInvitations.length} guard invitations:`);
      guardInvitations.forEach(inv => {
        console.log(`   - Code: ${inv.invitation_code}, Email: ${inv.email}, Status: ${inv.status}, Created: ${inv.created_at}`);
      });
    }

    // 2. Check what's in user_products table (where granted access shows up)
    console.log('\n2️⃣ Checking user_products table for guard-management access...');
    const { data: userProducts, error: productsError } = await supabase
      .from('user_products')
      .select('*')
      .eq('product_id', 'guard-management')
      .order('granted_at', { ascending: false })
      .limit(10);
    
    if (productsError) {
      console.log('❌ Error accessing user_products:', productsError.message);
    } else {
      console.log(`   Found ${userProducts.length} users with guard-management access:`);
      userProducts.forEach(up => {
        console.log(`   - User: ${up.user_id}, Granted: ${up.granted_at}, Active: ${up.is_active}`);
      });
    }

    // 3. Test what happens when we simulate a successful auto sign-up
    console.log('\n3️⃣ Simulating complete auto sign-up flow...');
    
    const testCode = 'GRD-H8I2KU';
    const testEmail = 'debug-guard-' + Date.now() + '@example.com';
    const testName = 'Debug Guard User';
    
    // Step 1: Test validation
    const { data: validationResult, error: validationError } = await supabase
      .rpc('accept_product_invitation_with_signup', {
        invitation_code_param: testCode,
        user_email_param: testEmail,
        user_name_param: testName,
        auto_create_user: true
      });
    
    if (validationError) {
      console.log('❌ Validation failed:', validationError.message);
    } else {
      console.log('✅ Validation result:', validationResult);
      
      if (validationResult.auto_signup) {
        console.log('\n   📱 Mobile app would now:');
        console.log('   1. Create Supabase Auth user');
        console.log('   2. Sign user in automatically');
        console.log('   3. Call complete_invitation_after_auth');
        
        // Step 2: Simulate what happens after user is created and signed in
        console.log('\n4️⃣ Simulating post-signup invitation completion...');
        
        const fakeUserId = '00000000-0000-0000-0000-000000000001';
        const { data: completeResult, error: completeError } = await supabase
          .rpc('complete_invitation_after_auth', {
            invitation_code_param: testCode,
            user_id_param: fakeUserId
          });
        
        if (completeError) {
          console.log('❌ Invitation completion failed:', completeError.message);
          console.log('   This is why the guard might not appear in the table!');
        } else {
          console.log('✅ Invitation completion successful:', completeResult);
          
          // Check if anything was actually inserted
          console.log('\n5️⃣ Checking if user_products entry was created...');
          const { data: newUserProduct, error: checkError } = await supabase
            .from('user_products')
            .select('*')
            .eq('user_id', fakeUserId)
            .eq('product_id', 'guard-management');
          
          if (checkError) {
            console.log('❌ Error checking user_products:', checkError.message);
          } else if (newUserProduct.length > 0) {
            console.log('✅ Found new user_products entry:', newUserProduct[0]);
          } else {
            console.log('❌ No user_products entry found - this explains the missing guard!');
          }
        }
      }
    }
    
    // 4. Check if the invitation was marked as accepted
    console.log('\n6️⃣ Checking invitation status after processing...');
    const { data: updatedInvitation, error: statusError } = await supabase
      .from('security_guard_invitations')
      .select('*')
      .eq('invitation_code', testCode);
    
    if (statusError) {
      console.log('❌ Error checking invitation status:', statusError.message);
    } else if (updatedInvitation.length > 0) {
      console.log('✅ Invitation status:', updatedInvitation[0]);
      console.log(`   Status: ${updatedInvitation[0].status}`);
      console.log(`   Accepted by: ${updatedInvitation[0].accepted_by}`);
      console.log(`   Accepted at: ${updatedInvitation[0].accepted_at}`);
    } else {
      console.log('❌ No invitation found with that code');
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
  
  console.log('\n🔍 Debug completed!');
  console.log('\n📝 SUMMARY:');
  console.log('   - Guards appear in user_products table when granted access');
  console.log('   - security_guard_invitations table tracks invitation status');
  console.log('   - Check the complete_invitation_after_auth function for issues');
}

debugGuardTable();