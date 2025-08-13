const nodemailer = require('nodemailer');

async function testEmailConnection() {
  console.log('Testing email connection to mail.workforceone.co.za...');
  
  // Configuration based on your settings
  const config = {
    host: 'mail.workforceone.co.za',
    port: 465,
    secure: true, // true for 465, false for other ports
    auth: {
      user: 'signup@workforceone.co.za',
      pass: 'YOUR_PASSWORD_HERE' // You'll need to replace this
    },
    debug: true, // Enable debug logs
    logger: true // Enable logger
  };

  try {
    console.log('Creating transporter with config:', {
      ...config,
      auth: { ...config.auth, pass: '[REDACTED]' }
    });
    
    const transporter = nodemailer.createTransporter(config);
    
    console.log('Verifying connection...');
    const verification = await transporter.verify();
    
    if (verification) {
      console.log('✅ Connection successful!');
      
      // Try sending a test email (optional)
      console.log('Sending test email...');
      const info = await transporter.sendMail({
        from: '"WorkforceOne Test" <signup@workforceone.co.za>',
        to: 'test@example.com', // Replace with a real email for testing
        subject: 'Test Email from WorkforceOne',
        text: 'This is a test email to verify SMTP configuration.',
        html: '<b>This is a test email to verify SMTP configuration.</b>'
      });
      
      console.log('✅ Test email sent:', info.messageId);
    } else {
      console.log('❌ Connection verification failed');
    }
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    
    // Provide specific debugging information
    if (error.code === 'ECONNREFUSED') {
      console.log('💡 Connection refused - check if the SMTP server is running and accessible');
    } else if (error.code === 'ENOTFOUND') {
      console.log('💡 Host not found - check the SMTP host address');
    } else if (error.responseCode === 535) {
      console.log('💡 Authentication failed - check username and password');
    } else if (error.responseCode === 587 || error.responseCode === 465) {
      console.log('💡 Check if the correct port and security settings are used');
    }
    
    console.log('Full error details:', error);
  }
}

testEmailConnection();