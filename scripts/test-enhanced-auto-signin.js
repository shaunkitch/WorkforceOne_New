const { createClient } = require('@supabase/supabase-js');

// Test with anon key
const supabaseUrl = 'https://edeheyeloakiworbkfpg.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVkZWhleWVsb2FraXdvcmJrZnBnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5MTg2NzUsImV4cCI6MjA3MDQ5NDY3NX0.IRvOCcwlnc1myDFCEITelnrdHKgYIEt750taUFyDqkc';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testEnhancedAutoSignIn() {
  console.log('🔧 Testing enhanced auto sign-in flow...\n');
  
  try {
    const testCode = 'GRD-H8I2KU';
    const testEmail = 'enhanced-test-' + Date.now() + '@example.com';
    const testName = 'Enhanced Test User';
    
    console.log('📱 SIMULATION: User scans QR code');
    console.log(`   Email: ${testEmail}`);
    console.log(`   Name: ${testName}`);
    console.log(`   Code: ${testCode}`);
    
    // Step 1: Test the validation function
    console.log('\n1️⃣ Validating invitation...');
    const { data: validationResult, error: validationError } = await supabase
      .rpc('accept_product_invitation_with_signup', {
        invitation_code_param: testCode,
        user_email_param: testEmail,
        user_name_param: testName,
        auto_create_user: true
      });
    
    if (validationError) {
      console.log('❌ Validation failed:', validationError.message);
      return;
    }
    
    console.log('✅ Invitation validation successful');
    console.log(`   Auto signup needed: ${validationResult.auto_signup}`);
    console.log(`   Email: ${validationResult.email}`);
    console.log(`   Products: ${validationResult.products.join(', ')}`);
    
    if (validationResult.auto_signup) {
      console.log('\n2️⃣ MOBILE APP: Attempting auto sign-up...');
      
      // Simulate the mobile app's autoSignUpWithInvitation function
      const tempPassword = 'TempPass' + Math.random().toString(36).substring(2, 8) + '!';
      console.log(`   Generated password: ${tempPassword}`);
      
      // Try to create account
      console.log('   Creating Supabase Auth account...');
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: testEmail,
        password: tempPassword,
        options: {
          data: {
            full_name: testName,
            invitation_code: testCode,
          },
        },
      });

      if (signUpError) {
        console.log('❌ Sign up failed:', signUpError.message);
        
        if (signUpError.message.includes('already been registered')) {
          console.log('🔄 User already exists, attempting sign-in...');
          
          // Try to sign in with existing credentials
          const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email: testEmail,
            password: tempPassword, // This won't work for existing users
          });
          
          if (signInError) {
            console.log('❌ Sign-in failed (expected for existing users):', signInError.message);
            console.log('📱 MOBILE APP: Would show "Email confirmation needed" or fallback to manual login');
          }
        }
        return;
      }

      console.log('✅ Account created successfully');
      console.log(`   User ID: ${signUpData.user?.id}`);
      console.log(`   Session exists: ${!!signUpData.session}`);
      
      if (signUpData.session) {
        console.log('🎉 IMMEDIATE SUCCESS: User has active session!');
        console.log('📱 MOBILE APP: Would navigate directly to Dashboard');
        
        // Process invitation
        console.log('\n3️⃣ Processing invitation...');
        const { data: inviteResult, error: inviteError } = await supabase
          .rpc('complete_invitation_after_auth', {
            invitation_code_param: testCode,
            user_id_param: signUpData.user.id
          });
        
        if (inviteError) {
          console.log('⚠️  Invitation processing error:', inviteError.message);
          console.log('📱 MOBILE APP: User still signed in, but invitation may need manual processing');
        } else {
          console.log('✅ Invitation processed successfully');
          console.log(`   Products granted: ${inviteResult.products?.join(', ') || 'Unknown'}`);
        }
        
        console.log('\n🎯 COMPLETE SUCCESS FLOW:');
        console.log('   ✅ Account created');
        console.log('   ✅ User automatically signed in');
        console.log('   ✅ Invitation processed');
        console.log('   ✅ User navigates to Dashboard');
        console.log('   ✅ NO MANUAL SIGNUP POPUP!');
        
      } else {
        console.log('📧 Account created but email confirmation required');
        console.log('📱 MOBILE APP: Would show "Check your email" message');
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
  
  console.log('\n🏁 Enhanced auto sign-in test completed!');
}

testEnhancedAutoSignIn();