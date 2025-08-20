const { createClient } = require('@supabase/supabase-js');

// Test with anon key
const supabaseUrl = 'https://edeheyeloakiworbkfpg.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVkZWhleWVsb2FraXdvcmJrZnBnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5MTg2NzUsImV4cCI6MjA3MDQ5NDY3NX0.IRvOCcwlnc1myDFCEITelnrdHKgYIEt750taUFyDqkc';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function debugCompleteFunction() {
  console.log('🔍 Debugging complete_invitation_after_auth function...\n');
  
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
      console.log('❌ Function error:', error);
      console.log('   Message:', error.message);
      console.log('   Code:', error.code);
      console.log('   Details:', error.details);
      console.log('   Hint:', error.hint);
    } else {
      console.log('✅ Function works!');
      console.log('   Result:', result);
    }
    
    // Also test with an invalid UUID format
    console.log('\n🔍 Testing with invalid UUID...');
    const { data: result2, error: error2 } = await supabase
      .rpc('complete_invitation_after_auth', {
        invitation_code_param: testCode,
        user_id_param: 'invalid-uuid'
      });
    
    if (error2) {
      console.log('❌ Expected error with invalid UUID:', error2.message);
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
}

debugCompleteFunction();