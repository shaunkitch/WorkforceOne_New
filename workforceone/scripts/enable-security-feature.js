#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = 'https://edeheyeloakiworbkfpg.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVkZWhleWVsb2FraXdvcmJrZnBnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDkxODY3NSwiZXhwIjoyMDcwNDk0Njc1fQ.HNoN21ykstlIQ6sPF5bsJtRyQyCTKENDBtFzgkEe40c';

async function enableSecurityFeature() {
  console.log('🔒 Enabling Security Feature for All Organizations...');
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // Get all organizations first
    const { data: orgs, error: fetchError } = await supabase
      .from('organizations')
      .select('id, name, feature_flags');
      
    if (fetchError) {
      throw new Error(`Failed to fetch organizations: ${fetchError.message}`);
    }
    
    console.log(`Found ${orgs.length} organizations to update`);
    
    // Update each organization to enable security feature
    for (const org of orgs) {
      const updatedFlags = {
        ...org.feature_flags,
        security: true // Enable security feature
      };
      
      const { error: orgUpdateError } = await supabase
        .from('organizations')
        .update({ feature_flags: updatedFlags })
        .eq('id', org.id);
        
      if (orgUpdateError) {
        console.error(`❌ Error updating org ${org.name}:`, orgUpdateError);
      } else {
        console.log(`✅ Enabled security feature for: ${org.name}`);
      }
    }

    // Verify the updates
    console.log('\n🔍 Verifying security feature status...');
    
    const { data: verifyOrgs, error: verifyError } = await supabase
      .from('organizations')
      .select('name, feature_flags')
      .order('name');

    if (verifyError) {
      console.error('❌ Error verifying updates:', verifyError);
    } else {
      console.log('\n📊 Current Security Feature Status:');
      verifyOrgs.forEach(org => {
        const securityEnabled = org.feature_flags?.security || false;
        const status = securityEnabled ? '✅ ENABLED' : '❌ DISABLED';
        console.log(`  ${org.name}: ${status}`);
      });
    }

    console.log('\n🎉 Security feature has been enabled for all organizations!');
    console.log('\n📋 Next Steps:');
    console.log('  1. Refresh the Settings → Features page');
    console.log('  2. The Security Management section should now be visible');
    console.log('  3. Security features are now available in the navigation menu');
    
  } catch (error) {
    console.error('❌ Failed to enable security feature:', error);
    process.exit(1);
  }
}

// Run the script
enableSecurityFeature();