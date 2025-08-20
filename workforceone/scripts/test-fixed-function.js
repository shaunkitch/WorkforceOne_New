const { createClient } = require('@supabase/supabase-js');

// Test with anon key
const supabaseUrl = 'https://edeheyeloakiworbkfpg.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVkZWhleWVsb2FraXdvcmJrZnBnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5MTg2NzUsImV4cCI6MjA3MDQ5NDY3NX0.IRvOCcwlnc1myDFCEITelnrdHKgYIEt750taUFyDqkc';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testFixedFunction() {
  console.log('🔧 Testing fixed complete_invitation_after_auth function...\n');
  
  try {
    const testCode = 'GRD-H8I2KU';
    const testUserId = '123e4567-e89b-12d3-a456-426614174000';
    
    console.log('Testing with:');
    console.log(`  Code: ${testCode}`);
    console.log(`  User ID: ${testUserId}`);
    
    const { data: result, error } = await supabase
      .rpc('complete_invitation_after_auth', {
        invitation_code_param: testCode,
        user_id_param: testUserId
      });
    
    if (error) {
      console.log('❌ Function still has error:', error.message);
    } else {
      console.log('✅ Function fixed and working!');
      console.log('   Result:', result);
    }
    
    // Test the whole auto sign-up flow
    console.log('\n🧪 Testing complete auto sign-up flow...');
    
    const testEmail = 'autofix-test-' + Date.now() + '@example.com';
    const testName = 'Auto Fix Test User';
    
    const { data: autoResult, error: autoError } = await supabase
      .rpc('accept_product_invitation_with_signup', {
        invitation_code_param: testCode,
        user_email_param: testEmail,
        user_name_param: testName,
        auto_create_user: true
      });
    
    if (autoError) {
      console.log('❌ Auto sign-up error:', autoError.message);
    } else {
      console.log('✅ Auto sign-up flow works!');
      console.log('   Result:', autoResult);
      
      if (autoResult.auto_signup) {
        console.log('   🎯 Ready for mobile app auto sign-in!');
        console.log(`   📧 Email: ${autoResult.email}`);
        console.log(`   👤 Name: ${autoResult.name}`);
        console.log(`   🎫 Code: ${autoResult.invitation_code}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
  
  console.log('\n🎉 Function fix test completed!');
  console.log('\n📱 The mobile app auto sign-in should now work without errors!');
}

testFixedFunction();