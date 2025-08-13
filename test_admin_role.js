const { createClient } = require('@supabase/supabase-js');

async function testAdminRole() {
  // Create a client to check user roles
  const supabase = createClient(
    'https://edeheyeloakiworbkfpg.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVkZWhleWVsb2FraXdvcmJrZnBnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDkxODY3NSwiZXhwIjoyMDcwNDk0Njc1fQ.HNoN21ykstlIQ6sPF5bsJtRyQyCTKENDBtFzgkEe40c'
  );

  console.log('Checking admin roles in the database...');

  try {
    // Check all user profiles and their roles
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id, email, full_name, role, organization_id')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching profiles:', error);
      return;
    }

    console.log('All user profiles:');
    profiles.forEach((profile, index) => {
      console.log(`${index + 1}. ${profile.email || 'No email'} - ${profile.full_name || 'No name'} - Role: ${profile.role || 'No role'} - Org: ${profile.organization_id || 'No org'}`);
    });

    // Check which users are admins
    const admins = profiles.filter(p => p.role === 'admin');
    console.log(`\nFound ${admins.length} admin(s):`);
    admins.forEach(admin => {
      console.log(`- ${admin.email} (${admin.full_name}) - Org: ${admin.organization_id}`);
    });

    // Check if any user has a null role
    const nullRoles = profiles.filter(p => !p.role);
    if (nullRoles.length > 0) {
      console.log(`\n⚠️  Found ${nullRoles.length} user(s) with null/missing role:`);
      nullRoles.forEach(user => {
        console.log(`- ${user.email} (${user.full_name})`);
      });
    }

  } catch (error) {
    console.error('Test failed:', error);
  }
}

testAdminRole();