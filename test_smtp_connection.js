// Test script for SMTP connection to mail.workforceone.co.za
// Run this from the workforceone/backend directory: node ../../test_smtp_connection.js

const nodemailer = require('nodemailer');

// Configuration based on your email settings
const config = {
  host: 'mail.workforceone.co.za',
  port: 465,
  secure: true, // true for 465, false for other ports
  auth: {
    user: 'signup@workforceone.co.za',
    pass: 'YOUR_ACTUAL_PASSWORD' // <<<< REPLACE THIS WITH THE REAL PASSWORD
  },
  debug: true, // Enable detailed debug logs
  logger: console, // Use console for logging
  connectionTimeout: 15000, // 15 seconds
  greetingTimeout: 10000,   // 10 seconds
  socketTimeout: 15000      // 15 seconds
};

console.log('🔧 Testing SMTP connection to mail.workforceone.co.za...');
console.log('📧 Config:', {
  host: config.host,
  port: config.port,
  secure: config.secure,
  user: config.auth.user,
  pass: '[REDACTED - ' + config.auth.pass.length + ' chars]'
});

const transporter = nodemailer.createTransport(config);

console.log('⏳ Verifying connection...');

transporter.verify((error, success) => {
  if (error) {
    console.log('\n❌ SMTP Connection FAILED:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Error Code:', error.code || 'N/A');
    console.log('Error Message:', error.message);
    
    if (error.responseCode) {
      console.log('SMTP Response Code:', error.responseCode);
    }
    
    if (error.response) {
      console.log('SMTP Response:', error.response);
    }
    
    // Provide specific troubleshooting guidance
    console.log('\n💡 Troubleshooting Guide:');
    if (error.code === 'EAUTH' || error.responseCode === 535) {
      console.log('   - Authentication failed. Check username and password.');
      console.log('   - Make sure you are using the correct email account password.');
      console.log('   - If using 2FA, you might need an app-specific password.');
    } else if (error.code === 'ECONNREFUSED') {
      console.log('   - Connection refused. Check if SMTP server is running.');
      console.log('   - Verify host and port settings.');
    } else if (error.code === 'ETIMEDOUT' || error.code === 'ECONNECTIONTIMEOUT') {
      console.log('   - Connection timed out. Check firewall settings.');
      console.log('   - Verify the SMTP server host address.');
    } else if (error.code === 'ENOTFOUND') {
      console.log('   - Host not found. Check the SMTP server address.');
    }
    
  } else {
    console.log('\n✅ SMTP Connection SUCCESSFUL!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎉 Server is ready to send emails');
    
    // Optional: Try sending a test email
    console.log('\n📤 Would you like to send a test email? (uncomment the code below)');
    /*
    const testMail = {
      from: '"WorkforceOne Test" <signup@workforceone.co.za>',
      to: 'your-test-email@example.com', // Replace with your test email
      subject: 'SMTP Test from WorkforceOne',
      text: 'If you receive this email, your SMTP configuration is working correctly!',
      html: '<h1>SMTP Test Success!</h1><p>If you receive this email, your SMTP configuration is working correctly!</p>'
    };
    
    transporter.sendMail(testMail, (err, info) => {
      if (err) {
        console.log('❌ Test email failed:', err.message);
      } else {
        console.log('✅ Test email sent:', info.messageId);
      }
      process.exit(0);
    });
    */
  }
  
  process.exit(error ? 1 : 0);
});

// Set timeout for the test
setTimeout(() => {
  console.log('\n⏰ Connection test timed out (30 seconds)');
  console.log('This might indicate network connectivity issues.');
  process.exit(1);
}, 30000);