const { createClient } = require('@supabase/supabase-js');

async function checkRLSPolicies() {
  const supabase = createClient(
    'https://edeheyeloakiworbkfpg.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVkZWhleWVsb2FraXdvcmJrZnBnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDkxODY3NSwiZXhwIjoyMDcwNDk0Njc1fQ.HNoN21ykstlIQ6sPF5bsJtRyQyCTKENDBtFzgkEe40c',
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );

  console.log('Checking RLS policies and service key access...');

  try {
    // Test 1: Direct service key access
    console.log('\n=== TEST 1: Service key access to profiles ===');
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('email, role')
      .eq('email', 'lika@workforceone.co.za')
      .single();

    if (profileError) {
      console.log('❌ Service key access failed:', profileError.message);
      console.log('Error details:', profileError);
    } else {
      console.log('✅ Service key access works:', profiles.email, profiles.role);
    }

    // Test 2: Check if service role bypasses RLS
    console.log('\n=== TEST 2: Bypassing RLS explicitly ===');
    const { data: profilesNoRLS, error: noRLSError } = await supabase
      .rpc('get_profile_by_email', { email_param: 'lika@workforceone.co.za' });

    if (noRLSError) {
      console.log('❌ RPC call failed:', noRLSError.message);
    } else {
      console.log('✅ RPC works (if function exists)');
    }

    // Test 3: Check table permissions
    console.log('\n=== TEST 3: Basic table access ===');
    const { data: basicQuery, error: basicError } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);

    if (basicError) {
      console.log('❌ Basic table access failed:', basicError.message);
    } else {
      console.log('✅ Basic table access works');
    }

    // Test 4: Check if table exists
    console.log('\n=== TEST 4: Check table existence ===');
    const { data: tableCheck, error: tableError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_name', 'profiles')
      .eq('table_schema', 'public');

    if (tableError) {
      console.log('❌ Table check failed:', tableError.message);
    } else {
      console.log('✅ Profiles table exists:', tableCheck.length > 0);
    }

  } catch (error) {
    console.error('Test failed:', error);
  }
}

checkRLSPolicies();