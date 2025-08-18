const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://edeheyeloakiworbkfpg.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVkZWhleWVsb2FraXdvcmJrZnBnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDkxODY3NSwiZXhwIjoyMDcwNDk0Njc1fQ.HNoN21ykstlIQ6sPF5bsJtRyQyCTKENDBtFzgkEe40c';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkDeviceTokensTable() {
  try {
    console.log('🔍 Checking device_tokens table...');
    
    // Try to query the table
    const { data, error } = await supabase
      .from('device_tokens')
      .select('*')
      .limit(1);
    
    if (error) {
      console.log('❌ Device tokens table access failed:', error);
      console.log('   This suggests the table does not exist or has permission issues');
      
      // Let's try a simple insert without upsert to see what happens
      console.log('\n🧪 Testing simple insert...');
      const { error: insertError } = await supabase
        .from('device_tokens')
        .insert({
          user_id: 'test_user_id',
          token: 'test_token',
          platform: 'ios'
        });
      
      if (insertError) {
        console.log('❌ Simple insert also failed:', insertError);
      } else {
        console.log('✅ Simple insert worked - constraint issue confirmed');
      }
      
    } else {
      console.log('✅ Device tokens table exists');
      if (data && data.length > 0) {
        console.log('📋 Sample record columns:', Object.keys(data[0]));
        console.log('📋 Sample record:', data[0]);
      } else {
        console.log('📋 Table is empty');
      }
    }
    
  } catch (error) {
    console.error('💥 Unexpected error:', error);
  }
}

checkDeviceTokensTable();