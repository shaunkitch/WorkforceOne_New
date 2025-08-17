#!/usr/bin/env node
// ===================================
// scripts/check-table-structure.js
// Check actual database table structure
// ===================================

const { createClient } = require('@supabase/supabase-js');
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

async function checkTableStructure() {
  try {
    console.log('🔍 Checking form_assignments table structure...\n');
    
    // First, check if the table exists and what columns it has
    console.log('📋 Checking table existence and columns...');
    
    // Try to query the table schema using information_schema
    const { data: columns, error: schemaError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_name', 'form_assignments')
      .eq('table_schema', 'public');
    
    if (schemaError) {
      console.log('⚠️  Cannot query information_schema:', schemaError.message);
      
      // Try direct table query to see if table exists
      console.log('\n📊 Trying direct table query...');
      const { data: tableData, error: tableError } = await supabase
        .from('form_assignments')
        .select('*')
        .limit(1);
      
      if (tableError) {
        console.log('❌ form_assignments table error:', tableError.message);
        
        if (tableError.message.includes('relation "form_assignments" does not exist')) {
          console.log('\n🚨 DIAGNOSIS: form_assignments table does not exist!');
          console.log('💡 This means the forms migration has not been applied yet.');
          console.log('\n📝 You need to run the forms migration first:');
          console.log('   → Check migrations 029_create_forms_*.sql');
          console.log('   → Apply one of these migrations before the mobile notifications migration');
          return;
        }
        
        if (tableError.message.includes('column "user_id" does not exist')) {
          console.log('\n🚨 DIAGNOSIS: form_assignments table exists but user_id column is missing!');
          console.log('💡 The table structure is different from expected.');
          console.log('\n📝 Need to check what columns actually exist.');
        }
      } else {
        console.log('✅ Table exists and can be queried');
        console.log('📊 Sample data:', tableData);
      }
    } else {
      console.log('✅ Retrieved table schema:');
      console.table(columns);
      
      // Check specifically for user_id column
      const userIdColumn = columns.find(col => col.column_name === 'user_id');
      if (userIdColumn) {
        console.log('✅ user_id column exists:', userIdColumn);
      } else {
        console.log('❌ user_id column does NOT exist');
        console.log('📋 Available columns:', columns.map(c => c.column_name).join(', '));
      }
    }
    
    // Check other related tables
    console.log('\n🔍 Checking related tables...');
    const tables = ['forms', 'profiles', 'organizations', 'teams'];
    
    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1);
        
        if (error) {
          console.log(`❌ ${table}: ${error.message}`);
        } else {
          console.log(`✅ ${table}: exists`);
        }
      } catch (err) {
        console.log(`❌ ${table}: ${err.message}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Check failed:', error.message);
  }
}

console.log('🔧 WorkforceOne Table Structure Checker');
console.log('=====================================\n');

checkTableStructure();