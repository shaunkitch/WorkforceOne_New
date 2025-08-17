#!/usr/bin/env node

/**
 * SendGrid Verification Helper Script
 * Run this to verify your SendGrid configuration
 */

const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('\n🚀 SendGrid Email Verification Helper\n');
console.log('This script will help you set up SendGrid sender verification.\n');

console.log('📋 Step 1: Verify Your Sender Email');
console.log('────────────────────────────────────');
console.log('1. Open: https://app.sendgrid.com/');
console.log('2. Go to: Settings → Sender Authentication');
console.log('3. Click: "Verify a Single Sender"');
console.log('4. Enter YOUR email address (Gmail, Outlook, etc.)');
console.log('5. Check your email and click the verification link\n');

rl.question('✉️  Enter your VERIFIED email address: ', (email) => {
  if (!email || !email.includes('@')) {
    console.log('\n❌ Invalid email address. Please run the script again.\n');
    rl.close();
    return;
  }

  console.log('\n📝 Step 2: Update Your Configuration');
  console.log('────────────────────────────────────');
  console.log('\nAdd these lines to your .env.local file:\n');
  console.log(`FROM_EMAIL=${email}`);
  console.log(`ADMIN_EMAIL=${email}`);
  console.log('\n✅ Configuration ready!\n');

  console.log('📧 Step 3: Test Your Email');
  console.log('────────────────────────────────────');
  console.log('\n1. Restart your server:');
  console.log('   npm run dev -- -p 3002\n');
  console.log('2. Send a test email:');
  console.log(`   curl -X POST http://localhost:3002/api/monitoring/incidents \\`);
  console.log(`     -H "Content-Type: application/json" \\`);
  console.log(`     -d '{"action": "send_test_alert"}'`);
  console.log('\n3. Check your email at:', email);
  console.log('\n🎉 Your AI incident monitoring will send alerts to:', email);
  
  rl.question('\n🔧 Would you like to update .env.local automatically? (y/n): ', (answer) => {
    if (answer.toLowerCase() === 'y') {
      const fs = require('fs');
      const path = require('path');
      const envPath = path.join(__dirname, '.env.local');
      
      try {
        let envContent = fs.readFileSync(envPath, 'utf8');
        
        // Update FROM_EMAIL and ADMIN_EMAIL
        envContent = envContent.replace(
          /FROM_EMAIL=.*/,
          `FROM_EMAIL=${email}`
        );
        envContent = envContent.replace(
          /ADMIN_EMAIL=.*/,
          `ADMIN_EMAIL=${email}`
        );
        
        fs.writeFileSync(envPath, envContent);
        console.log('\n✅ .env.local updated successfully!');
        console.log('\n🔄 Please restart your server to apply changes:');
        console.log('   npm run dev -- -p 3002\n');
      } catch (error) {
        console.log('\n⚠️  Could not update .env.local automatically.');
        console.log('Please update it manually with the values above.\n');
      }
    } else {
      console.log('\n📝 Please update .env.local manually with the values above.\n');
    }
    
    rl.close();
  });
});