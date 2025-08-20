const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = 'https://edeheyeloakiworbkfpg.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVkZWhleWVsb2FraXdvcmJrZnBnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDkxODY3NSwiZXhwIjoyMDcwNDk0Njc1fQ.Qkr6rZKi4TJBu5wGOoCtd4iJWpIW5LPwgOhfEhKFJoc';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testInvitationSystem() {
  console.log('🧪 Testing Invitation System...\n');
  
  try {
    // Test 1: Check if product_invitations table exists
    console.log('1️⃣ Testing product_invitations table...');
    const { data: invitations, error: invError } = await supabase
      .from('product_invitations')
      .select('count(*)')
      .limit(1);
    
    if (invError) {
      console.log('❌ product_invitations table:', invError.message);
    } else {
      console.log('✅ product_invitations table is working');
    }
    
    // Test 2: Check if user_products table exists
    console.log('2️⃣ Testing user_products table...');
    const { data: userProducts, error: upError } = await supabase
      .from('user_products')
      .select('count(*)')
      .limit(1);
    
    if (upError) {
      console.log('❌ user_products table:', upError.message);
    } else {
      console.log('✅ user_products table is working');
    }
    
    // Test 3: Test validate_invitation_code function
    console.log('3️⃣ Testing validate_invitation_code function...');
    const { data: validateResult, error: validateError } = await supabase
      .rpc('validate_invitation_code', { invitation_code_param: 'TEST123' });
    
    if (validateError) {
      console.log('❌ validate_invitation_code function:', validateError.message);
    } else {
      console.log('✅ validate_invitation_code function is working');
      console.log('   Result:', validateResult);
    }
    
    // Test 4: Test accept_product_invitation function
    console.log('4️⃣ Testing accept_product_invitation function...');
    const { data: acceptResult, error: acceptError } = await supabase
      .rpc('accept_product_invitation', { 
        invitation_code_param: 'TEST123',
        user_email_param: 'test@example.com' 
      });
    
    if (acceptError) {
      console.log('❌ accept_product_invitation function:', acceptError.message);
    } else {
      console.log('✅ accept_product_invitation function is working');
      console.log('   Result:', acceptResult);
    }
    
    // Test 5: Create a test invitation
    console.log('5️⃣ Creating test invitation...');
    const testCode = 'TEST-' + Math.random().toString(36).substring(2, 8).toUpperCase();
    
    const { data: createResult, error: createError } = await supabase
      .from('product_invitations')
      .insert({
        invitation_code: testCode,
        products: ['workforce-management', 'guard-management'],
        status: 'pending',
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
      })
      .select()
      .single();
    
    if (createError) {
      console.log('❌ Creating test invitation:', createError.message);
    } else {
      console.log('✅ Test invitation created successfully');
      console.log('   Code:', testCode);
      console.log('   Products:', createResult.products);
      
      // Test the QR data format that would be generated
      const qrData = {
        type: 'product_invitation',
        invitationCode: testCode,
        products: createResult.products,
        organizationName: 'Test Organization'
      };
      
      console.log('\n📱 QR Code Data:');
      console.log(JSON.stringify(qrData, null, 2));
      
      // Test validation of this code
      console.log('\n6️⃣ Testing validation of created invitation...');
      const { data: validationResult, error: validationError } = await supabase
        .rpc('validate_invitation_code', { invitation_code_param: testCode });
      
      if (validationError) {
        console.log('❌ Validating test invitation:', validationError.message);
      } else {
        console.log('✅ Test invitation validation successful');
        console.log('   Valid:', validationResult.valid);
        console.log('   Products:', validationResult.products);
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
  
  console.log('\n🎉 Invitation system test completed!');
}

testInvitationSystem();