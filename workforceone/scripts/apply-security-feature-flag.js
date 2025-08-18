#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Supabase configuration
const supabaseUrl = 'https://edeheyeloakiworbkfpg.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVkZWhleWVsb2FraXdvcmJrZnBnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDkxODY3NSwiZXhwIjoyMDcwNDk0Njc1fQ.HNoN21ykstlIQ6sPF5bsJtRyQyCTKENDBtFzgkEe40c';

async function applyMigration() {
  console.log('🚀 Applying Security Feature Flag Migration...');
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // Step 1: Add security feature flag to existing organizations (disabled by default)
    console.log('📝 Adding security feature flag to existing organizations...');
    
    const { error: updateError } = await supabase
      .from('organizations')
      .update({
        feature_flags: supabase.rpc('jsonb_set', {
          target: 'feature_flags',
          path: '{security}',
          new_value: 'false'
        })
      })
      .not('feature_flags', 'is', null);

    if (updateError) {
      console.error('❌ Error updating organizations:', updateError);
      
      // Alternative approach - let's fetch and update manually
      console.log('🔄 Trying alternative approach...');
      
      const { data: orgs, error: fetchError } = await supabase
        .from('organizations')
        .select('id, feature_flags')
        .not('feature_flags', 'is', null);
        
      if (fetchError) {
        throw new Error(`Failed to fetch organizations: ${fetchError.message}`);
      }
      
      console.log(`Found ${orgs.length} organizations to update`);
      
      for (const org of orgs) {
        if (!org.feature_flags.hasOwnProperty('security')) {
          const updatedFlags = {
            ...org.feature_flags,
            security: false
          };
          
          const { error: orgUpdateError } = await supabase
            .from('organizations')
            .update({ feature_flags: updatedFlags })
            .eq('id', org.id);
            
          if (orgUpdateError) {
            console.error(`❌ Error updating org ${org.id}:`, orgUpdateError);
          } else {
            console.log(`✅ Updated organization ${org.id}`);
          }
        }
      }
    } else {
      console.log('✅ Successfully updated existing organizations');
    }

    // Step 2: Handle organizations with null feature_flags
    console.log('📝 Updating organizations with null feature_flags...');
    
    const defaultFeatureFlags = {
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
      security: false,
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

    const { error: nullUpdateError } = await supabase
      .from('organizations')
      .update({ feature_flags: defaultFeatureFlags })
      .is('feature_flags', null);

    if (nullUpdateError) {
      console.error('❌ Error updating null feature_flags:', nullUpdateError);
    } else {
      console.log('✅ Successfully updated organizations with null feature_flags');
    }

    // Step 3: Verify the migration
    console.log('🔍 Verifying migration results...');
    
    const { data: verifyOrgs, error: verifyError } = await supabase
      .from('organizations')
      .select('name, feature_flags')
      .order('name');

    if (verifyError) {
      console.error('❌ Error verifying migration:', verifyError);
    } else {
      console.log('\n📊 Migration Results:');
      verifyOrgs.forEach(org => {
        const securityEnabled = org.feature_flags?.security || false;
        console.log(`  ${org.name}: security=${securityEnabled}`);
      });
    }

    console.log('\n🎉 Security feature flag migration completed successfully!');
    console.log('\n📋 Next Steps:');
    console.log('  1. Go to Settings → Features in the admin dashboard');
    console.log('  2. Enable the Security feature for organizations that need patrol functionality');
    console.log('  3. Set users with work_type="security" to access security features');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration
applyMigration();