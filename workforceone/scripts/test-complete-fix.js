const { createClient } = require('@supabase/supabase-js');

// Test with anon key (mobile app perspective)
const supabaseUrl = 'https://edeheyeloakiworbkfpg.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVkZWhleWVsb2FraXdvcmJrZnBnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5MTg2NzUsImV4cCI6MjA3MDQ5NDY3NX0.IRvOCcwlnc1myDFCEITelnrdHKgYIEt750taUFyDqkc';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testCompleteFix() {
  console.log('🎯 Testing complete guard invitation fix...\n');
  
  const testCode = 'GRD-H8I2KU'; // The code from your QR scan
  
  try {
    // Test 1: Direct table access (should work now)
    console.log(`1️⃣ Testing direct access to security_guard_invitations...`);
    
    const { data: directResult, error: directError } = await supabase
      .from('security_guard_invitations')
      .select('*')
      .eq('invitation_code', testCode)
      .eq('status', 'pending')
      .single();
    
    if (directError) {
      console.log('❌ Direct access failed:', directError.message);
    } else {
      console.log('✅ Direct access works!');
      console.log(`   Found invitation for: ${directResult.email}`);
      console.log(`   Expires: ${directResult.expires_at}`);
    }
    
    // Test 2: validate_invitation_code function
    console.log(`\n2️⃣ Testing validate_invitation_code function...`);
    
    const { data: validateResult, error: validateError } = await supabase
      .rpc('validate_invitation_code', { invitation_code_param: testCode });
    
    if (validateError) {
      console.log('❌ Validate function failed:', validateError.message);
    } else {
      console.log('✅ Validate function works!');
      console.log('   Result:', validateResult);
    }
    
    // Test 3: accept_product_invitation function with guard code
    console.log(`\n3️⃣ Testing accept_product_invitation with guard code...`);
    
    const { data: acceptResult, error: acceptError } = await supabase
      .rpc('accept_product_invitation', {
        invitation_code_param: testCode,
        user_email_param: 'shaun@example.com'
      });
    
    if (acceptError) {
      console.log('❌ Accept function failed:', acceptError.message);
    } else {
      console.log('✅ Accept function works!');
      console.log('   Result:', acceptResult);
    }
    
    // Test 4: Simulate the exact mobile app QR scan scenario
    console.log(`\n4️⃣ Simulating mobile app QR scan flow...`);
    
    // This is the QR data format from your logs
    const qrData = {
      "guardInvite": true,
      "invitationCode": "GRD-H8I2KU",
      "organizationName": "Security Guard System",
      "originalData": {
        "access": "basic",
        "code": "GRD-H8I2KU",
        "expires": "2025-08-27T18:40:02.955Z",
        "id": "INV-1755715202955",
        "name": "Shaun Kitching",
        "site": "retail-west",
        "type": "guard_invitation"
      },
      "products": ["guard-management"],
      "type": "product_invitation"
    };
    
    console.log('   QR Data:', JSON.stringify(qrData, null, 2));
    
    // Test the acceptGuardInvitation flow (using the improved function)
    const { data: guardResult, error: guardError } = await supabase
      .rpc('accept_product_invitation', {
        invitation_code_param: qrData.invitationCode,
        user_email_param: ''
      });
    
    if (guardError) {
      console.log('❌ Mobile app simulation failed:', guardError.message);
    } else {
      console.log('✅ Mobile app simulation works!');
      console.log('   Expected flow:');
      if (guardResult.requires_signup) {
        console.log('   → User sees: "Guard invitation is valid. Please sign up to complete."');
        console.log('   → After signup: User gets guard-management access');
      } else {
        console.log('   → User immediately gets guard-management access');
      }
      console.log('   → Products granted:', guardResult.products);
    }
    
    // Test 5: Product invitation (to ensure we didn't break anything)
    console.log(`\n5️⃣ Testing product invitation still works...`);
    
    const { data: productInvitations } = await supabase
      .from('product_invitations')
      .select('invitation_code')
      .eq('status', 'pending')
      .limit(1);
    
    if (productInvitations && productInvitations.length > 0) {
      const productCode = productInvitations[0].invitation_code;
      
      const { data: productResult, error: productError } = await supabase
        .rpc('accept_product_invitation', {
          invitation_code_param: productCode,
          user_email_param: 'test@example.com'
        });
      
      if (productError) {
        console.log('❌ Product invitation broken:', productError.message);
      } else {
        console.log('✅ Product invitation still works!');
        console.log(`   Code: ${productCode}`);
        console.log('   Products:', productResult.products);
      }
    } else {
      console.log('⚠️  No product invitations to test');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
  
  console.log('\n🎉 Complete fix test finished!');
  console.log('\n📱 Your mobile app should now work with guard invitations!');
  console.log('   - Scan the QR code with GRD-H8I2KU');
  console.log('   - App should show: "Guard invitation is valid. Please sign up to complete."');
  console.log('   - After signup/login: User gets guard-management access');
}

testCompleteFix();