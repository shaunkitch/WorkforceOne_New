const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://edeheyeloakiworbkfpg.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVkZWhleWVsb2FraXdvcmJrZnBnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczMzY4MjQ3MCwiZXhwIjoyMDQ5MjU4NDcwfQ.0J7YktqKRjLpUXq5AVS7dVTvU8e2l0YZ-K1OE3bCCvY';

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function checkExistingTables() {
  console.log('Checking existing tables in database...\n');
  
  try {
    // Query the information_schema to get actual table list
    const { data, error } = await supabase.rpc('get_tables_list', {});
    
    if (error) {
      // If RPC doesn't exist, try a different approach
      console.log('RPC not available, checking tables directly...\n');
      
      // Try to query each table to see if it exists
      const possibleTables = [
        'organizations',
        'organization_settings',
        'profiles', 
        'teams',
        'company_invitations',
        'email_integrations'
      ];
      
      for (const table of possibleTables) {
        try {
          const { error } = await supabase
            .from(table)
            .select('id')
            .limit(1);
          
          if (!error) {
            console.log(`✅ Table exists: ${table}`);
            
            // Try to get column info
            const { data: sample } = await supabase
              .from(table)
              .select('*')
              .limit(1);
            
            if (sample && sample.length > 0) {
              console.log(`   Columns: ${Object.keys(sample[0]).join(', ')}`);
            }
          } else if (error.message?.includes('relation') && error.message?.includes('does not exist')) {
            console.log(`❌ Table does not exist: ${table}`);
          } else {
            console.log(`⚠️  Table ${table}: ${error.message}`);
          }
        } catch (err) {
          console.log(`❌ Error checking ${table}: ${err.message}`);
        }
      }
    } else {
      console.log('Tables found:', data);
    }
  } catch (err) {
    console.error('Error:', err);
  }
}

checkExistingTables().then(() => {
  console.log('\nDone checking tables.');
  process.exit(0);
}).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});