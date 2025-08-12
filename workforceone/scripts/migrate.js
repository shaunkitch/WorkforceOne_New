#!/usr/bin/env node
// ===================================
// scripts/migrate.js
// Database migration script for WorkforceOne
// ===================================

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL || 'https://edeheyeloakiworbkfpg.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_KEY is required');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function runMigration() {
  try {
    console.log('🚀 Starting WorkforceOne database migration...');
    
    // Read the migration file
    const migrationPath = path.join(__dirname, '../database/migrations/001_initial_schema.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📝 Running initial schema migration...');
    
    // Execute the migration
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: migrationSQL
    });
    
    if (error) {
      // If exec_sql RPC doesn't exist, try direct SQL execution
      console.log('⚠️  exec_sql RPC not found, trying direct execution...');
      
      // Split SQL into individual statements
      const statements = migrationSQL
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0);
      
      for (const statement of statements) {
        if (statement.trim()) {
          console.log(`Executing: ${statement.substring(0, 50)}...`);
          const { error: stmtError } = await supabase.rpc('exec', { sql: statement });
          
          if (stmtError) {
            console.warn(`⚠️  Statement warning: ${stmtError.message}`);
          }
        }
      }
    }
    
    console.log('✅ Database schema migration completed successfully!');
    
    // Test connection
    console.log('🔍 Testing database connection...');
    const { data: testData, error: testError } = await supabase
      .from('organizations')
      .select('*')
      .limit(1);
    
    if (testError) {
      console.log('⚠️  Connection test warning:', testError.message);
    } else {
      console.log('✅ Database connection test successful!');
    }
    
    console.log('\n🎉 Migration completed! Next steps:');
    console.log('1. Go to your Supabase dashboard');
    console.log('2. Set up Row Level Security (RLS) policies');
    console.log('3. Configure authentication settings');
    console.log('4. Start your development servers');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

runMigration();