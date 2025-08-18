#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = 'https://edeheyeloakiworbkfpg.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVkZWhleWVsb2FraXdvcmJrZnBnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDkxODY3NSwiZXhwIjoyMDcwNDk0Njc1fQ.HNoN21ykstlIQ6sPF5bsJtRyQyCTKENDBtFzgkEe40c';

async function fixFeatureFlags() {
  console.log('🔧 Fixing Corrupted Feature Flags...');
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // Get all organizations
    const { data: orgs, error: fetchError } = await supabase
      .from('organizations')
      .select('id, name, feature_flags');
      
    if (fetchError) {
      throw new Error(`Failed to fetch organizations: ${fetchError.message}`);
    }
    
    console.log(`Found ${orgs.length} organizations to fix`);
    
    // Proper feature flags object
    const correctFeatureFlags = {
      dashboard: true,
      time_tracking: true,
      attendance: true,
      maps: true,
      teams: true,
      projects: true,
      tasks: true,
      forms: true,
      leave: true,
      outlets: true,
      security: true,
      settings: true,
      analytics: true,
      reports: true,
      automation: true,
      integrations: true,
      mobile_daily_visits: true,
      mobile_offline_mode: true,
      mobile_push_notifications: true,
      mobile_clock_in: true,
      mobile_tasks: true,
      mobile_forms: true,
      mobile_leave: true,
      mobile_payslips: true
    };
    
    // Update each organization with correct feature flags
    for (const org of orgs) {
      console.log(`Fixing ${org.name}...`);
      
      const { error: updateError } = await supabase
        .from('organizations')
        .update({ feature_flags: correctFeatureFlags })
        .eq('id', org.id);
        
      if (updateError) {
        console.error(`❌ Error updating ${org.name}:`, updateError);
      } else {
        console.log(`✅ Fixed ${org.name}`);
      }
    }

    // Verify the fix
    console.log('\n🔍 Verifying fixes...');
    
    const { data: verifyOrgs, error: verifyError } = await supabase
      .from('organizations')
      .select('name, feature_flags')
      .order('name');

    if (verifyError) {
      console.error('❌ Error verifying:', verifyError);
    } else {
      console.log('\n📊 Updated Feature Flags:');
      verifyOrgs.forEach(org => {
        console.log(`\n🏢 ${org.name}:`);
        console.log(`   Security: ${org.feature_flags?.security ? '✅ ENABLED' : '❌ DISABLED'}`);
        console.log(`   Dashboard: ${org.feature_flags?.dashboard ? '✅ ENABLED' : '❌ DISABLED'}`);
        console.log(`   Total Features: ${Object.keys(org.feature_flags || {}).length}`);
      });
    }

    console.log('\n🎉 Feature flags have been fixed!');
    console.log('📋 Next Steps:');
    console.log('  1. Refresh the Settings → Features page');
    console.log('  2. Security Management section should now be visible');
    console.log('  3. All features should be properly loaded');
    
  } catch (error) {
    console.error('❌ Fix failed:', error);
    process.exit(1);
  }
}

// Run the fix
fixFeatureFlags();