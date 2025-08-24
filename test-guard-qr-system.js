// Test script for Guard QR System
const QRCode = require('qrcode');

async function generateTestQRCodes() {
  console.log('🛡️ Generating Test QR Codes for Guard System...\n');

  // 1. Product Invitation QR Code (for joining guard system)
  const productInvitationData = {
    type: 'product_invitation',
    organizationName: 'Test Security Company',
    products: ['guard-management'],
    invitationCode: 'GUARD123'
  };

  // 2. Site Check-in QR Code (for guard patrol check-ins)
  const siteCheckinData = {
    type: 'site_checkin',
    siteId: 'site_001',
    siteName: 'Downtown Office Building',
    latitude: -26.2041,
    longitude: 28.0473,
    checkpointId: 'checkpoint_001',
    routeId: 'route_001'
  };

  try {
    // Generate QR codes as data URLs
    const invitationQR = await QRCode.toDataURL(JSON.stringify(productInvitationData));
    const checkinQR = await QRCode.toDataURL(JSON.stringify(siteCheckinData));

    console.log('✅ PRODUCT INVITATION QR CODE (for new guards to join):');
    console.log('Data:', JSON.stringify(productInvitationData, null, 2));
    console.log('QR Data URL length:', invitationQR.length, 'characters');
    console.log('QR URL (copy to browser):', `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(JSON.stringify(productInvitationData))}`);
    console.log();

    console.log('✅ SITE CHECK-IN QR CODE (for guard patrol):');
    console.log('Data:', JSON.stringify(siteCheckinData, null, 2));
    console.log('QR Data URL length:', checkinQR.length, 'characters');
    console.log('QR URL (copy to browser):', `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(JSON.stringify(siteCheckinData))}`);
    console.log();

    console.log('📱 TESTING INSTRUCTIONS:');
    console.log('1. Start the mobile app (workforceone-mobile)');
    console.log('2. Navigate to Security -> QR Check-In');
    console.log('3. Scan the Site Check-in QR code above');
    console.log('4. Verify check-in functionality works');
    console.log();

    console.log('🔗 ADMIN TESTING:');
    console.log('1. Open admin app: http://localhost:3001');
    console.log('2. Go to Security Dashboard');
    console.log('3. Click "Invite Guard" to test invitation system');
    console.log('4. Generate QR code and test mobile app scanning');
    console.log();

    // Test data validation
    console.log('🧪 DATA VALIDATION TESTS:');
    
    // Test 1: Product invitation structure
    const requiredInviteFields = ['type', 'organizationName', 'products', 'invitationCode'];
    const hasAllInviteFields = requiredInviteFields.every(field => productInvitationData[field]);
    console.log('✅ Product invitation has all required fields:', hasAllInviteFields);
    
    // Test 2: Site check-in structure
    const requiredCheckinFields = ['type', 'siteId', 'siteName'];
    const hasAllCheckinFields = requiredCheckinFields.every(field => siteCheckinData[field]);
    console.log('✅ Site check-in has all required fields:', hasAllCheckinFields);
    
    // Test 3: Product list validation
    const validProducts = ['guard-management', 'workforce-management', 'time-tracker'];
    const hasValidProducts = productInvitationData.products.every(p => validProducts.includes(p));
    console.log('✅ Product invitation has valid products:', hasValidProducts);

    console.log('\n🎯 SUCCESS: QR codes generated and ready for testing!');

  } catch (error) {
    console.error('❌ Error generating QR codes:', error);
  }
}

// Run the test
generateTestQRCodes();