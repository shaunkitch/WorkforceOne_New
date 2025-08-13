const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://edeheyeloakiworbkfpg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVkZWhleWVsb2FraXdvcmJrZnBnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzM2ODI0NzAsImV4cCI6MjA0OTI1ODQ3MH0.UW44i88b8Hwl-vwKidVYzsAvsS9t7bRxjpw0JoXYqz0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTables() {
  console.log('Checking database tables...\n');
  
  const tablesToCheck = [
    'organizations',
    'organization_settings', 
    'profiles',
    'teams',
    'team_members',
    'outlets',
    'outlet_users',
    'outlet_teams',
    'projects',
    'tasks',
    'task_comments',
    'task_attachments',
    'task_assignments',
    'company_invitations',
    'email_integrations',
    'attendance',
    'leave_requests'
  ];

  for (const table of tablesToCheck) {
    try {
      const { data, error, count } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        console.log(`❌ ${table}: ${error.message}`);
      } else {
        console.log(`✅ ${table}: exists`);
      }
    } catch (err) {
      console.log(`❌ ${table}: ${err.message}`);
    }
  }
}

checkTables().then(() => {
  console.log('\nDone checking tables.');
  process.exit(0);
}).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});