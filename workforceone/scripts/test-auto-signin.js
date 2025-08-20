const { createClient } = require('@supabase/supabase-js');

// Test with anon key (mobile app perspective)
const supabaseUrl = 'https://edeheyeloakiworbkfpg.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVkZWhleWVsb2FraXdvcmJrZnBnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5MTg2NzUsImV4cCI6MjA3MDQ5NDY3NX0.IRvOCcwlnc1myDFCEITelnrdHKgYIEt750taUFyDqkc';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testAutoSignIn() {
  console.log('🚀 Testing automatic sign-in with QR invitations...\n');
  
  try {
    // Test 1: Check the enhanced function exists
    console.log('1️⃣ Testing accept_product_invitation_with_signup function...');
    
    const testCode = 'GRD-H8I2KU'; // Existing guard invitation
    const testEmail = 'auto-test-' + Date.now() + '@example.com';
    const testName = 'Auto Test User';
    
    const { data: enhancedResult, error: enhancedError } = await supabase
      .rpc('accept_product_invitation_with_signup', {
        invitation_code_param: testCode,
        user_email_param: testEmail,
        user_name_param: testName,
        auto_create_user: true
      });
    
    if (enhancedError) {
      console.log('❌ Enhanced function failed:', enhancedError.message);
    } else {
      console.log('✅ Enhanced function works!');
      console.log('   Result:', enhancedResult);
      
      if (enhancedResult.auto_signup) {
        console.log('   🎯 Auto sign-up flow detected!');
        console.log(`   📧 Email: ${enhancedResult.email}`);
        console.log(`   👤 Name: ${enhancedResult.name}`);
        console.log(`   🎫 Invitation Code: ${enhancedResult.invitation_code}`);
      }
    }
    
    // Test 2: Test QR data formats
    console.log('\n2️⃣ Testing QR data formats for auto sign-in...');
    
    // Guard invitation QR format with email
    const guardQrWithEmail = `GUARD_INVITE:${JSON.stringify({
      id: "INV-" + Date.now(),
      code: testCode,
      name: "Shaun Kitching",
      email: "shaun@example.com",
      site: "retail-west",
      access: "basic",
      expires: "2025-08-27T18:40:02.955Z",
      type: "guard_invitation"
    })}`;
    
    console.log('   Guard QR with email data:');
    console.log('   ' + guardQrWithEmail);
    
    // Product invitation QR format with contact info
    const productQrWithContact = JSON.stringify({
      type: "product_invitation",
      invitationCode: "QR-MEKBEOMR", // Existing product invitation
      products: ["workforce-management"],
      organizationName: "Test Organization",
      contact: {
        email: "worker@example.com",
        name: "Test Worker"
      }
    });
    
    console.log('\n   Product QR with contact data:');
    console.log('   ' + productQrWithContact);
    
    // Test 3: Simulate mobile app QR scanning flow
    console.log('\n3️⃣ Simulating mobile app auto sign-in flow...');
    
    console.log('   📱 Scenario: User scans guard invitation QR');
    console.log('   🔍 QR contains email and name');
    console.log('   ⚡ App attempts automatic sign-up');
    console.log('   ✅ Expected: User is signed in automatically');
    
    // Parse the guard QR data (like the mobile app would)
    const guardData = JSON.parse(guardQrWithEmail.substring('GUARD_INVITE:'.length));
    
    if (guardData.email && guardData.name) {
      console.log('   ✅ QR contains required info for auto sign-up:');
      console.log(`      Email: ${guardData.email}`);
      console.log(`      Name: ${guardData.name}`);
      console.log(`      Code: ${guardData.code}`);
      
      console.log('   🎯 Mobile app would call: autoSignUpWithInvitation()');
      console.log('   📧 With email:', guardData.email);
      console.log('   👤 With name:', guardData.name);
      console.log('   🎫 With code:', guardData.code);
    }
    
    // Test 4: Test complete_invitation_after_auth function
    console.log('\n4️⃣ Testing complete_invitation_after_auth function...');
    
    // This would be called after successful auth
    const fakeUserId = '123e4567-e89b-12d3-a456-426614174000'; // Dummy UUID
    
    const { data: completeResult, error: completeError } = await supabase
      .rpc('complete_invitation_after_auth', {
        invitation_code_param: testCode,
        user_id_param: fakeUserId
      });
    
    if (completeError) {
      console.log('❌ Complete function failed:', completeError.message);
    } else {
      console.log('✅ Complete function works!');
      console.log('   This would grant product access after authentication');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
  
  console.log('\n🎉 Auto sign-in test completed!');
  console.log('\n📱 How it works in the mobile app:');
  console.log('   1. User scans QR code');
  console.log('   2. App extracts email/name from QR data');
  console.log('   3. App calls autoSignUpWithInvitation()');
  console.log('   4. User account is created automatically');
  console.log('   5. User is signed in immediately');
  console.log('   6. Product access is granted');
  console.log('   7. User sees success message and enters app');
}

testAutoSignIn();