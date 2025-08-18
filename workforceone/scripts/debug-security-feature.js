#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const supabaseUrl = 'https://edeheyeloakiworbkfpg.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVkZWhleWVsb2FraXdvcmJrZnBnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDkxODY3NSwiZXhwIjoyMDcwNDk0Njc1fQ.HNoN21ykstlIQ6sPF5bsJtRyQyCTKENDBtFzgkEe40c';

async function debugSecurityFeature() {
  console.log('🔍 Debugging Security Feature Visibility...');
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // Get all organizations with detailed feature flags
    const { data: orgs, error: fetchError } = await supabase
      .from('organizations')
      .select('*')
      .order('name');
      
    if (fetchError) {
      throw new Error(`Failed to fetch organizations: ${fetchError.message}`);
    }
    
    console.log(`\n📊 Found ${orgs.length} organizations:`);
    
    orgs.forEach(org => {
      console.log(`\n🏢 Organization: ${org.name}`);
      console.log(`   ID: ${org.id}`);
      console.log(`   Feature Flags:`, JSON.stringify(org.feature_flags, null, 2));
      console.log(`   Security Feature: ${org.feature_flags?.security ? '✅ ENABLED' : '❌ DISABLED'}`);
      
      // Check if security is explicitly in the feature flags
      if (org.feature_flags && org.feature_flags.hasOwnProperty('security')) {
        console.log(`   ✓ Security key exists in feature_flags`);
      } else {
        console.log(`   ⚠️ Security key missing from feature_flags`);
      }
    });

    // Test the query that the frontend would use
    console.log('\n🔬 Testing Frontend Query...');
    
    // Simulate what the frontend does
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      console.log(`   User ID: ${user.id}`);
      
      // Get user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single();
        
      if (profile?.organization_id) {
        console.log(`   User Organization ID: ${profile.organization_id}`);
        
        // Get organization the same way frontend does
        const { data: org, error } = await supabase
          .from('organizations')
          .select('*')
          .eq('id', profile.organization_id)
          .single();
          
        if (error) {
          console.error(`   ❌ Error fetching org: ${error.message}`);
        } else {
          console.log(`   ✅ Organization: ${org.name}`);
          console.log(`   ✅ Security Feature: ${org.feature_flags?.security ? 'ENABLED' : 'DISABLED'}`);
          console.log(`   📋 All Features:`, Object.keys(org.feature_flags || {}));
        }
      }
    } else {
      console.log('   ⚠️ No authenticated user found');
    }

  } catch (error) {
    console.error('❌ Debug failed:', error);
    process.exit(1);
  }
}

// Run the debug
debugSecurityFeature();