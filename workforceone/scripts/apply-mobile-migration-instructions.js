#!/usr/bin/env node
// ===================================
// scripts/apply-mobile-migration-instructions.js
// Instructions for applying mobile notifications migration
// ===================================

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');

console.log(chalk.blue('🔧 WorkforceOne Mobile Notifications Migration Instructions'));
console.log(chalk.blue('========================================================\n'));

console.log(chalk.yellow('📋 To apply the mobile notifications migration:'));
console.log('');

console.log(chalk.green('1. Open your Supabase Dashboard:'));
console.log('   → Go to https://supabase.com/dashboard');
console.log('   → Navigate to your WorkforceOne project');
console.log('');

console.log(chalk.green('2. Open the SQL Editor:'));
console.log('   → Click "SQL Editor" in the left sidebar');
console.log('   → Click "New Query"');
console.log('');

console.log(chalk.green('3. Copy and paste the migration SQL:'));
const migrationPath = path.join(__dirname, '../database/migrations/055_mobile_notifications_system_fixed.sql');

try {
  const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
  
  console.log(chalk.cyan(`   → File location: ${migrationPath}`));
  console.log(chalk.yellow('   → This is the FIXED version that handles column name differences'));
  console.log(chalk.cyan('   → Copy the entire contents of this file'));
  console.log('');
  
  console.log(chalk.green('4. Execute the migration:'));
  console.log('   → Paste the SQL into the query editor');
  console.log('   → Click "Run" to execute the migration');
  console.log('   → Wait for completion (may take a few minutes)');
  console.log('');
  
  console.log(chalk.green('5. Verify the migration:'));
  console.log('   → Check that new tables were created:');
  console.log('     • device_tokens');
  console.log('     • notifications');
  console.log('     • in_app_messages');
  console.log('     • message_participants');
  console.log('     • notification_templates');
  console.log('     • notification_preferences');
  console.log('');
  console.log('   → Check that form_assignments table was updated with new columns:');
  console.log('     • assigned_to_team_id');
  console.log('     • assigned_to_role');
  console.log('     • assigned_to_department');
  console.log('');
  
  console.log(chalk.green('6. Test the new functionality:'));
  console.log('   → Create a test form assignment from the web interface');
  console.log('   → Check if notifications appear in the mobile app');
  console.log('   → Test the in-app messaging system');
  console.log('');
  
  console.log(chalk.yellow('⚠️  Important Notes:'));
  console.log('   • This migration adds foreign key constraints');
  console.log('   • It creates database triggers for form assignment expansion');
  console.log('   • It enables Row Level Security (RLS) on new tables');
  console.log('   • Default notification preferences are created for existing users');
  console.log('');
  
  console.log(chalk.red('🚨 If you encounter errors:'));
  console.log('   • Check that all referenced tables exist (organizations, profiles, teams, forms)');
  console.log('   • Ensure the user running the migration has proper permissions');
  console.log('   • Run each section separately if needed');
  console.log('');
  
  console.log(chalk.green('✅ After successful migration:'));
  console.log('   • Mobile app will have push notifications');
  console.log('   • In-app messaging will be functional');
  console.log('   • Form assignments will expand properly to individual users');
  console.log('   • Notification preferences will be customizable');
  console.log('');
  
  // Show first 500 characters of the migration as preview
  console.log(chalk.cyan('📄 Migration Preview (first 500 characters):'));
  console.log(chalk.gray('─'.repeat(60)));
  console.log(migrationSQL.substring(0, 500) + '...');
  console.log(chalk.gray('─'.repeat(60)));
  console.log('');
  
  console.log(chalk.blue('🎉 Ready to apply the migration!'));
  console.log(chalk.yellow('Follow the steps above to complete the mobile notifications setup.'));

} catch (error) {
  console.error(chalk.red('❌ Error reading migration file:'), error.message);
  console.log(chalk.yellow('💡 Make sure you are running this from the workforceone directory'));
}