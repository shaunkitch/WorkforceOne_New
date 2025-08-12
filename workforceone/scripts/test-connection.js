#!/usr/bin/env node
// ===================================
// scripts/test-connection.js
// Test Supabase connection
// ===================================

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = 'https://edeheyeloakiworbkfpg.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVkZWhleWVsb2FraXdvcmJrZnBnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5MTg2NzUsImV4cCI6MjA3MDQ5NDY3NX0.IRvOCcwlnc1myDFCEITelnrdHKgYIEt750taUFyDqkc';

async function testConnection() {
  console.log('🔍 Testing Supabase connection...');
  console.log(`📡 URL: ${supabaseUrl}`);
  
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  
  try {
    // Test basic connection
    const { data, error } = await supabase
      .from('organizations')
      .select('count(*)')
      .limit(1);
    
    if (error) {
      console.log('⚠️  Database query error:', error.message);
      console.log('💡 This might be normal if tables don\'t exist yet');
    } else {
      console.log('✅ Connection successful!');
      console.log('📊 Organizations table accessible');
    }
    
    // Test auth
    console.log('🔐 Testing auth service...');
    const { data: authData, error: authError } = await supabase.auth.getSession();
    
    if (authError) {
      console.log('⚠️  Auth error:', authError.message);
    } else {
      console.log('✅ Auth service accessible');
    }
    
    console.log('\n✅ Connection test completed!');
    console.log('\n📋 Next steps:');
    console.log('1. Run the database schema in Supabase SQL Editor:');
    console.log('   Copy contents of database/setup_database.sql');
    console.log('2. Configure RLS policies as needed');
    console.log('3. Start your development servers');
    
  } catch (error) {
    console.error('❌ Connection test failed:', error.message);
    process.exit(1);
  }
}

testConnection();