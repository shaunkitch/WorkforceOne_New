const { createClient } = require('@supabase/supabase-js');

// Use service role key to create test data
const supabaseUrl = 'https://edeheyeloakiworbkfpg.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVkZWhleWVsb2FraXdvcmJrZnBnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDkxODY3NSwiZXhwIjoyMDcwNDk0Njc1fQ.HNoN21ykstlIQ6sPF5bsJtRyQyCTKENDBtFzgkEe40c';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createTestInvitation() {
  console.log('🎫 Creating test invitation for QR scanning...\n');
  
  try {
    // Generate a unique test code
    const testCode = 'QR-' + Date.now().toString(36).toUpperCase();
    
    // Create a product invitation
    console.log('Creating product invitation...');
    const { data: invitation, error: createError } = await supabase
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
      console.log('❌ Error creating invitation:', createError);
      return;
    }
    
    console.log('✅ Test invitation created successfully!');
    console.log('📱 Invitation Code:', testCode);
    console.log('🎯 Products:', invitation.products);
    
    // Generate QR data format for testing
    const qrData = {
      type: 'product_invitation',
      invitationCode: testCode,
      products: invitation.products,
      organizationName: 'Test Organization'
    };
    
    console.log('\n📱 QR Code JSON Data:');
    console.log('====================');
    console.log(JSON.stringify(qrData, null, 2));
    console.log('====================');
    
    // Test with anon client (mobile app perspective)
    console.log('\n🧪 Testing with anon client (mobile app simulation)...');
    const anonClient = createClient(supabaseUrl, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVkZWhleWVsb2FraXdvcmJrZnBnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5MTg2NzUsImV4cCI6MjA3MDQ5NDY3NX0.IRvOCcwlnc1myDFCEITelnrdHKgYIEt750taUFyDqkc');
    
    // Test accept_product_invitation function (this is what the mobile app calls)
    const { data: result, error: acceptError } = await anonClient
      .rpc('accept_product_invitation', {
        invitation_code_param: testCode,
        user_email_param: 'mobile-test@example.com'
      });
    
    if (acceptError) {
      console.log('❌ Error testing invitation:', acceptError.message);
    } else {
      console.log('✅ Mobile app can process invitation!');
      console.log('📋 Result:', result);
    }
    
    // Also create a guard invitation for testing
    console.log('\n🛡️ Creating guard invitation...');
    const guardCode = 'GRD-' + Date.now().toString(36).toUpperCase();
    
    const { data: guardInvitation, error: guardError } = await supabase
      .from('security_guard_invitations')
      .insert({
        invitation_code: guardCode,
        email: 'guard-test@example.com',
        status: 'pending',
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      })
      .select()
      .single();
    
    if (guardError) {
      console.log('❌ Error creating guard invitation:', guardError.message);
    } else {
      console.log('✅ Guard invitation created!');
      console.log('🛡️ Guard Code:', guardCode);
      
      const guardQrData = `GUARD_INVITE:${JSON.stringify({
        code: guardCode,
        organization: 'Security Test Company'
      })}`;
      
      console.log('\n🛡️ Guard QR Code Data:');
      console.log('=====================');
      console.log(guardQrData);
      console.log('=====================');
    }
    
    console.log('\n🎉 Test invitations ready for QR scanning!');
    console.log('📱 You can now test the mobile app by:');
    console.log('   1. Copying the QR JSON data above');
    console.log('   2. Using a QR generator to create a QR code');
    console.log('   3. Scanning it with the mobile app');
    
  } catch (error) {
    console.error('❌ Failed to create test invitation:', error);
  }
}

createTestInvitation();