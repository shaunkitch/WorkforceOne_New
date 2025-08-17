#!/usr/bin/env node
// Check profiles table structure
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL || 'https://edeheyeloakiworbkfpg.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function checkProfiles() {
  try {
    console.log('🔍 Checking profiles table structure...\n');
    
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);
    
    if (error) {
      console.log('❌ Profiles table error:', error.message);
      return;
    }
    
    console.log('✅ Profiles table sample data:');
    console.log(JSON.stringify(data[0], null, 2));
    
    console.log('\n📋 Available columns:');
    if (data[0]) {
      Object.keys(data[0]).forEach(column => {
        console.log(`  • ${column}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Check failed:', error.message);
  }
}

checkProfiles();