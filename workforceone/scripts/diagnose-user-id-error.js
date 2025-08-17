#!/usr/bin/env node
// Diagnose exactly where the user_id error is coming from
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL || 'https://edeheyeloakiworbkfpg.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function diagnoseError() {
  console.log('🔍 DIAGNOSING USER_ID COLUMN ERROR...\n');
  
  // Test each table creation individually to isolate the error
  const testQueries = [
    {
      name: 'device_tokens table',
      sql: `CREATE TABLE IF NOT EXISTS test_device_tokens (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        token TEXT NOT NULL,
        platform VARCHAR(20) NOT NULL
      );`
    },
    {
      name: 'notifications table', 
      sql: `CREATE TABLE IF NOT EXISTS test_notifications (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        body TEXT NOT NULL
      );`
    },
    {
      name: 'auth.uid() function test',
      sql: `SELECT auth.uid();`
    },
    {
      name: 'profiles table structure',
      sql: `SELECT column_name, data_type FROM information_schema.columns 
            WHERE table_name = 'profiles' AND table_schema = 'public';`
    }
  ];
  
  for (const test of testQueries) {
    try {
      console.log(`Testing: ${test.name}`);
      const { data, error } = await supabase.rpc('exec', { sql: test.sql });
      
      if (error) {
        console.log(`❌ ${test.name} FAILED:`, error.message);
        if (error.message.includes('user_id')) {
          console.log(`🎯 FOUND THE ISSUE: ${test.name}`);
          break;
        }
      } else {
        console.log(`✅ ${test.name} OK`);
      }
    } catch (err) {
      console.log(`❌ ${test.name} ERROR:`, err.message);
    }
  }
  
  // Test if we can reference profiles table properly
  try {
    console.log('\n🔍 Testing profiles table access...');
    const { data: profilesTest } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);
    console.log('✅ Profiles table accessible');
  } catch (err) {
    console.log('❌ Profiles table error:', err.message);
  }
}

diagnoseError();