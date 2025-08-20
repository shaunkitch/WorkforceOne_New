const { createClient } = require('@supabase/supabase-js');

// Test with anon key (same as mobile app)
const supabaseUrl = 'https://edeheyeloakiworbkfpg.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVkZWhleWVsb2FraXdvcmJrZnBnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5MTg2NzUsImV4cCI6MjA3MDQ5NDY3NX0.IRvOCcwlnc1myDFCEITelnrdHKgYIEt750taUFyDqkc';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testGuardInvitation() {
  console.log('🛡️ Testing guard invitation access...\n');
  
  const testCode = 'GRD-H8I2KU';
  
  try {
    // Test 1: Direct table access (what's failing in the mobile app)
    console.log(`1️⃣ Testing direct access to security_guard_invitations for code: ${testCode}`);
    
    const { data: directResult, error: directError } = await supabase
      .from('security_guard_invitations')
      .select('*')
      .eq('invitation_code', testCode)
      .eq('status', 'pending')
      .single();
    
    if (directError) {
      console.log('❌ Direct access failed:', directError.message);
      console.log('   This is the same error the mobile app is getting');
    } else {
      console.log('✅ Direct access works!');
      console.log('   Found invitation:', directResult);
    }
    
    // Test 2: Function-based access
    console.log(`\n2️⃣ Testing acceptGuardInvitation function with code: ${testCode}`);
    
    const { data: functionResult, error: functionError } = await supabase
      .rpc('accept_product_invitation', {
        invitation_code_param: testCode,
        user_email_param: 'test@example.com'
      });
    
    if (functionError) {
      console.log('❌ Function access failed:', functionError.message);
    } else {
      console.log('✅ Function access works!');
      console.log('   Result:', functionResult);
    }
    
    // Test 3: List all guard invitations to verify they exist
    console.log('\n3️⃣ Listing all guard invitations...');
    
    const { data: allInvitations, error: listError } = await supabase
      .from('security_guard_invitations')
      .select('invitation_code, status, expires_at')
      .limit(10);
    
    if (listError) {
      console.log('❌ Cannot list invitations:', listError.message);
    } else {
      console.log('✅ Can list invitations:');
      allInvitations.forEach(inv => {
        console.log(`   - ${inv.invitation_code} (${inv.status})`);
      });
    }
    
    // Test 4: Simulate the mobile app's acceptGuardInvitation call
    console.log('\n4️⃣ Simulating mobile app acceptGuardInvitation...');
    
    // This is what the mobile app is trying to do
    const { data: guardCheck, error: guardCheckError } = await supabase
      .from('security_guard_invitations')
      .select('*')
      .eq('invitation_code', testCode)
      .eq('status', 'pending')
      .single();
    
    if (guardCheckError) {
      console.log('❌ Mobile app simulation failed:', guardCheckError.message);
      console.log('   Status code equivalent: 406 (Not Acceptable)');
    } else {
      console.log('✅ Mobile app simulation works!');
      console.log('   Mobile app can now access guard invitations');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
  
  console.log('\n🎯 Once the RLS policies are fixed, the guard invitation should work!');
}

testGuardInvitation();