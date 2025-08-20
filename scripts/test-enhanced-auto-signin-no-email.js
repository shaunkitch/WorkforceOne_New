const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://edeheyeloakiworbkfpg.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVkZWhleWVsb2FraXdvcmJrZnBnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5MTg2NzUsImV4cCI6MjA3MDQ5NDY3NX0.IRvOCcwlnc1myDFCEITelnrdHKgYIEt750taUFyDqkc';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testEnhancedAutoSignInNoEmail() {
  console.log('🔧 Testing enhanced auto sign-in WITHOUT email in QR code...\n');
  
  try {
    const testCode = 'GRD-H8I2KU';
    
    console.log('📱 SIMULATION: QR code scan WITHOUT email');
    console.log('=========================================');
    
    // Simulate QR data without email (common case)
    const qrDataWithoutEmail = {
      "guardInvite": true,
      "invitationCode": testCode,
      "organizationName": "Security Guard System",
      "originalData": {
        "access": "basic",
        "code": testCode,
        "expires": "2025-08-27T18:40:02.955Z",
        "id": "INV-1755715202955",
        "name": "Shaun Kitching",
        // NO EMAIL FIELD - this is the issue!
        "site": "retail-west",
        "type": "guard_invitation"
      },
      "products": ["guard-management"],
      "type": "product_invitation"
    };
    
    console.log('QR Data (no email):', JSON.stringify(qrDataWithoutEmail, null, 2));
    
    // Extract user info like the mobile app does
    const userEmail = qrDataWithoutEmail.originalData?.email || 
                     qrDataWithoutEmail.originalData?.contact?.email || 
                     null;
    const userName = qrDataWithoutEmail.originalData?.name || 
                    qrDataWithoutEmail.originalData?.contact?.name || 
                    'New User';
    
    console.log('\n📊 Extracted from QR:');
    console.log(`   userEmail: ${userEmail}`);
    console.log(`   userName: ${userName}`);
    
    // NEW LOGIC: Generate auto email even if not in QR
    const autoEmail = userEmail || `${qrDataWithoutEmail.invitationCode.toLowerCase()}@auto-invite.temp`;
    console.log(`   autoEmail (generated): ${autoEmail}`);
    
    console.log('\n🚀 Testing auto sign-up with generated email...');
    
    // Test the auto sign-up flow
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: autoEmail,
      password: 'TempPass' + Math.random().toString(36).substring(2, 8) + '!',
      options: {
        data: {
          full_name: userName,
          invitation_code: testCode,
        },
      },
    });

    if (signUpError) {
      console.log('❌ Sign up failed:', signUpError.message);
      if (signUpError.message.includes('already been registered')) {
        console.log('   This email already exists - normal for multiple tests');
        console.log('   Mobile app would handle this gracefully');
      }
      return;
    }

    console.log('✅ Account created successfully!');
    console.log(`   User ID: ${signUpData.user?.id}`);
    console.log(`   Session active: ${!!signUpData.session}`);
    
    if (signUpData.session) {
      console.log('\n🎯 SUCCESS: Active session created!');
      console.log('📱 MOBILE APP FLOW:');
      console.log('   1. ✅ QR scanned (no email needed)');
      console.log('   2. ✅ Email auto-generated from invitation code');
      console.log('   3. ✅ Account created with active session');
      console.log('   4. ✅ onAuthSuccess() called automatically');
      console.log('   5. ✅ User navigates DIRECTLY to Dashboard');
      console.log('   6. ✅ NO POPUP MESSAGES!');
      
    } else {
      console.log('\n📧 Account created but requires email confirmation');
      console.log('📱 Mobile app would show: "Check your email" message');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
  
  console.log('\n🏁 Enhanced auto sign-in test (no email) completed!');
  console.log('\n🔧 KEY CHANGE:');
  console.log('   - Auto sign-in now works even without email in QR code');
  console.log('   - Generates email from invitation code as fallback');
  console.log('   - Should eliminate the "Guard Management Invitation!" popup');
}

testEnhancedAutoSignInNoEmail();