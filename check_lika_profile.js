const { createClient } = require('@supabase/supabase-js');

async function checkLikaProfile() {
  const supabase = createClient(
    'https://edeheyeloakiworbkfpg.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVkZWhleWVsb2FraXdvcmJrZnBnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDkxODY3NSwiZXhwIjoyMDcwNDk0Njc1fQ.HNoN21ykstlIQ6sPF5bsJtRyQyCTKENDBtFzgkEe40c'
  );

  console.log('Checking Lika\'s profile and auth records...');

  try {
    // 1. Check profiles table for Lika
    const { data: likaProfile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', 'lika@workforceone.co.za')
      .single();

    console.log('\n=== PROFILES TABLE ===');
    if (profileError) {
      console.log('❌ Profile error:', profileError.message);
    } else if (likaProfile) {
      console.log('✅ Profile found:');
      console.log('  ID:', likaProfile.id);
      console.log('  Email:', likaProfile.email);
      console.log('  Name:', likaProfile.full_name);
      console.log('  Role:', likaProfile.role);
      console.log('  Org ID:', likaProfile.organization_id);
    } else {
      console.log('❌ No profile found');
    }

    // 2. Check auth.users table for Lika
    const { data: authUsers, error: authError } = await supabase
      .from('auth.users')
      .select('id, email, created_at')
      .eq('email', 'lika@workforceone.co.za');

    console.log('\n=== AUTH.USERS TABLE ===');
    if (authError) {
      console.log('❌ Auth users error:', authError.message);
    } else if (authUsers && authUsers.length > 0) {
      console.log('✅ Auth user found:');
      authUsers.forEach(user => {
        console.log('  Auth ID:', user.id);
        console.log('  Email:', user.email);
        console.log('  Created:', user.created_at);
      });
    } else {
      console.log('❌ No auth user found');
    }

    // 3. Check if there's a mismatch
    if (likaProfile && authUsers && authUsers.length > 0) {
      const authUser = authUsers[0];
      console.log('\n=== ID COMPARISON ===');
      console.log('Profile ID:', likaProfile.id);
      console.log('Auth ID:   ', authUser.id);
      console.log('Match:     ', likaProfile.id === authUser.id ? '✅ YES' : '❌ NO');
      
      if (likaProfile.id !== authUser.id) {
        console.log('\n🚨 MISMATCH DETECTED! This is the problem.');
        console.log('The profile table has a different ID than the auth table.');
      }
    }

    // 4. Check all profiles with their creation dates
    console.log('\n=== ALL PROFILES ===');
    const { data: allProfiles } = await supabase
      .from('profiles')
      .select('id, email, full_name, role, created_at')
      .order('created_at', { ascending: false })
      .limit(10);

    allProfiles?.forEach((profile, index) => {
      console.log(`${index + 1}. ${profile.email} (${profile.full_name}) - ${profile.role}`);
      console.log(`   ID: ${profile.id}`);
      console.log(`   Created: ${profile.created_at}`);
    });

  } catch (error) {
    console.error('Check failed:', error);
  }
}

checkLikaProfile();