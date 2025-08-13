const { createClient } = require('@supabase/supabase-js');

async function fixProfileLookup() {
  console.log('Testing different Supabase client configurations...');

  // Test the service key client configuration
  const supabaseService = createClient(
    'https://edeheyeloakiworbkfpg.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVkZWhleWVsb2FraXdvcmJrZnBnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDkxODY3NSwiZXhwIjoyMDcwNDk0Njc1fQ.HNoN21ykstlIQ6sPF5bsJtRyQyCTKENDBtFzgkEe40c',
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );

  const userId = 'c6e18f9e-e0b6-4fc4-8c9a-0ac9ee2ce1fd'; // Lika's user ID from logs
  const userEmail = 'lika@workforceone.co.za';

  try {
    console.log('\n=== TEST 1: Service key lookup by ID ===');
    const { data: profileById, error: byIdError } = await supabaseService
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (byIdError) {
      console.log('❌ Error looking up by ID:', byIdError.message);
    } else {
      console.log('✅ Profile found by ID:', profileById.email, profileById.role);
    }

    console.log('\n=== TEST 2: Service key lookup by email ===');
    const { data: profileByEmail, error: byEmailError } = await supabaseService
      .from('profiles')
      .select('*')
      .eq('email', userEmail)
      .single();

    if (byEmailError) {
      console.log('❌ Error looking up by email:', byEmailError.message);
    } else {
      console.log('✅ Profile found by email:', profileByEmail.email, profileByEmail.role);
      console.log('Profile ID:', profileByEmail.id);
      
      if (profileByEmail.id !== userId) {
        console.log('\n🚨 MISMATCH DETECTED!');
        console.log('JWT Token User ID:', userId);
        console.log('Profile Table ID: ', profileByEmail.id);
        console.log('\nThis explains the issue - we need to update the profile ID.');
      }
    }

    console.log('\n=== TEST 3: Check all profiles ===');
    const { data: allProfiles, error: allError } = await supabaseService
      .from('profiles')
      .select('id, email, full_name, role')
      .limit(5);

    if (allError) {
      console.log('❌ Error getting all profiles:', allError.message);
    } else {
      console.log('✅ All profiles query works');
      allProfiles.forEach(p => {
        console.log(`  ${p.email} (${p.full_name}) - ${p.role} - ID: ${p.id}`);
      });
    }

  } catch (error) {
    console.error('Test failed:', error);
  }
}

fixProfileLookup();