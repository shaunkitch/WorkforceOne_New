const { createClient } = require('@supabase/supabase-js');

// Test with anon key (mobile app perspective)
const supabaseUrl = 'https://edeheyeloakiworbkfpg.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVkZWhleWVsb2FraXdvcmJrZnBnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5MTg2NzUsImV4cCI6MjA3MDQ5NDY3NX0.IRvOCcwlnc1myDFCEITelnrdHKgYIEt750taUFyDqkc';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testFunctions() {
  console.log('🔧 Testing invitation functions...\n');
  
  try {
    // Get existing test invitations
    console.log('📋 Getting test invitations...');
    const { data: invitations } = await supabase
      .from('product_invitations')
      .select('invitation_code, products')
      .eq('status', 'pending')
      .limit(1);
    
    const { data: guardInvitations } = await supabase
      .from('security_guard_invitations')
      .select('invitation_code')
      .eq('status', 'pending')
      .limit(1);
    
    // Test validate_invitation_code function
    if (invitations && invitations.length > 0) {
      const testCode = invitations[0].invitation_code;
      console.log(`1️⃣ Testing validate_invitation_code with: ${testCode}`);
      
      const { data: validateResult, error: validateError } = await supabase
        .rpc('validate_invitation_code', { invitation_code_param: testCode });
      
      if (validateError) {
        console.log('❌ validate_invitation_code error:', validateError.message);
      } else {
        console.log('✅ validate_invitation_code works!');
        console.log('   Result:', validateResult);
      }
      
      // Test accept_product_invitation function
      console.log(`\n2️⃣ Testing accept_product_invitation with: ${testCode}`);
      const { data: acceptResult, error: acceptError } = await supabase
        .rpc('accept_product_invitation', { 
          invitation_code_param: testCode,
          user_email_param: 'test@example.com' 
        });
      
      if (acceptError) {
        console.log('❌ accept_product_invitation error:', acceptError.message);
      } else {
        console.log('✅ accept_product_invitation works!');
        console.log('   Result:', acceptResult);
      }
    }
    
    // Test guard invitation
    if (guardInvitations && guardInvitations.length > 0) {
      const guardCode = guardInvitations[0].invitation_code;
      console.log(`\n3️⃣ Testing guard invitation with: ${guardCode}`);
      
      const { data: guardValidateResult, error: guardValidateError } = await supabase
        .rpc('validate_invitation_code', { invitation_code_param: guardCode });
      
      if (guardValidateError) {
        console.log('❌ Guard validate error:', guardValidateError.message);
      } else {
        console.log('✅ Guard validation works!');
        console.log('   Result:', guardValidateResult);
      }
      
      const { data: guardAcceptResult, error: guardAcceptError } = await supabase
        .rpc('accept_product_invitation', { 
          invitation_code_param: guardCode,
          user_email_param: 'guard@example.com' 
        });
      
      if (guardAcceptError) {
        console.log('❌ Guard accept error:', guardAcceptError.message);
      } else {
        console.log('✅ Guard accept works!');
        console.log('   Result:', guardAcceptResult);
      }
    }
    
    // Test invalid code
    console.log('\n4️⃣ Testing invalid invitation code...');
    const { data: invalidResult, error: invalidError } = await supabase
      .rpc('validate_invitation_code', { invitation_code_param: 'INVALID123' });
    
    if (invalidError) {
      console.log('❌ Invalid code test error:', invalidError.message);
    } else {
      console.log('✅ Invalid code handling works!');
      console.log('   Result:', invalidResult);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
  
  console.log('\n🎉 Function testing completed!');
}

testFunctions();