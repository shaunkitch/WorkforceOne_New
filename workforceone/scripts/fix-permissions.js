const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Use the anon key for this test since that's what the mobile app uses
const supabaseUrl = 'https://edeheyeloakiworbkfpg.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVkZWhleWVsb2FraXdvcmJrZnBnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5MTg2NzUsImV4cCI6MjA3MDQ5NDY3NX0.IRvOCcwlnc1myDFCEITelnrdHKgYIEt750taUFyDqkc';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testPermissions() {
  console.log('🔐 Testing invitation system permissions...\n');
  
  try {
    // Test 1: Can we read product_invitations?
    console.log('1️⃣ Testing product_invitations read access...');
    const { data: invitations, error: invError } = await supabase
      .from('product_invitations')
      .select('invitation_code, products, status')
      .eq('status', 'pending')
      .limit(5);
    
    if (invError) {
      console.log('❌ Cannot read product_invitations:', invError.message);
    } else {
      console.log('✅ Can read product_invitations');
      console.log(`   Found ${invitations.length} pending invitations`);
      if (invitations.length > 0) {
        console.log(`   Sample code: ${invitations[0].invitation_code}`);
      }
    }
    
    // Test 2: Can we read security_guard_invitations?
    console.log('\n2️⃣ Testing security_guard_invitations read access...');
    const { data: guardInvitations, error: guardError } = await supabase
      .from('security_guard_invitations')
      .select('invitation_code, status')
      .eq('status', 'pending')
      .limit(5);
    
    if (guardError) {
      console.log('❌ Cannot read security_guard_invitations:', guardError.message);
    } else {
      console.log('✅ Can read security_guard_invitations');
      console.log(`   Found ${guardInvitations.length} pending guard invitations`);
      if (guardInvitations.length > 0) {
        console.log(`   Sample code: ${guardInvitations[0].invitation_code}`);
      }
    }
    
    // Test 3: Can we call validate_invitation_code function?
    console.log('\n3️⃣ Testing validate_invitation_code function...');
    const testCode = invitations && invitations.length > 0 ? invitations[0].invitation_code : 'TEST123';
    
    const { data: validateResult, error: validateError } = await supabase
      .rpc('validate_invitation_code', { invitation_code_param: testCode });
    
    if (validateError) {
      console.log('❌ Cannot call validate_invitation_code:', validateError.message);
    } else {
      console.log('✅ Can call validate_invitation_code');
      console.log('   Result:', validateResult);
    }
    
    // Test 4: Can we call accept_product_invitation function?
    console.log('\n4️⃣ Testing accept_product_invitation function (unauthenticated)...');
    const { data: acceptResult, error: acceptError } = await supabase
      .rpc('accept_product_invitation', { 
        invitation_code_param: testCode,
        user_email_param: 'test@example.com' 
      });
    
    if (acceptError) {
      console.log('❌ Cannot call accept_product_invitation:', acceptError.message);
    } else {
      console.log('✅ Can call accept_product_invitation');
      console.log('   Result:', acceptResult);
    }
    
    // Test 5: Generate test QR data
    if (invitations && invitations.length > 0) {
      console.log('\n📱 Sample QR Code Data:');
      const qrData = {
        type: 'product_invitation',
        invitationCode: invitations[0].invitation_code,
        products: invitations[0].products,
        organizationName: 'Test Organization'
      };
      console.log(JSON.stringify(qrData, null, 2));
    }
    
    if (guardInvitations && guardInvitations.length > 0) {
      console.log('\n🛡️ Sample Guard QR Code Data:');
      const guardQrData = `GUARD_INVITE:${JSON.stringify({
        code: guardInvitations[0].invitation_code,
        organization: 'Security Company'
      })}`;
      console.log(guardQrData);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
  
  console.log('\n🎉 Permission test completed!');
  console.log('\nIf all tests pass, the QR scanning should work in the mobile app.');
}

testPermissions();