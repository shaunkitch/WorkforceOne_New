#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables  
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const supabaseUrl = 'https://edeheyeloakiworbkfpg.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVkZWhleWVsb2FraXdvcmJrZnBnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDkxODY3NSwiZXhwIjoyMDcwNDk0Njc1fQ.HNoN21ykstlIQ6sPF5bsJtRyQyCTKENDBtFzgkEe40c';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkBrandingTable() {
  console.log('🔍 Checking if organization_branding table exists...');
  
  try {
    const { data, error } = await supabase
      .from('organization_branding') 
      .select('id')
      .limit(1);
    
    if (error) {
      if (error.code === 'PGRST106' || error.message.includes('does not exist')) {
        console.log('❌ organization_branding table does not exist');
        return false;
      } else {
        console.log('⚠️ Error checking table:', error.message);
        return false;
      }
    }
    
    console.log('✅ organization_branding table exists');
    return true;
  } catch (error) {
    console.log('❌ Exception checking table:', error.message);
    return false;
  }
}

async function createBrandingTableDirectly() {
  console.log('🎨 Creating organization_branding table directly...');
  
  try {
    // First check if we can see any tables
    const { data: tablesData, error: tablesError } = await supabase
      .from('organizations')
      .select('id')
      .limit(1);
    
    if (tablesError) {
      console.log('❌ Cannot access database:', tablesError.message);
      return false;
    }
    
    console.log('✅ Database connection confirmed');
    
    // The table creation needs to be done through Supabase dashboard
    // For now, let's just check if it exists and provide instructions
    
    console.log('\n📝 MANUAL STEPS REQUIRED:');
    console.log('=========================================');
    console.log('1. Go to your Supabase dashboard: https://supabase.com/dashboard/project/edeheyeloakiworbkfpg');
    console.log('2. Navigate to SQL Editor');
    console.log('3. Copy and paste the following SQL:');
    console.log('\n```sql');
    
    const migrationPath = path.join(__dirname, '..', 'database', 'migrations', '061_branding_system.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log(migrationSQL);
    console.log('```\n');
    console.log('4. Click "Run" to execute the migration');
    console.log('5. Refresh your frontend application');
    console.log('=========================================');
    
    return true;
  } catch (error) {
    console.error('❌ Error:', error.message);
    return false;
  }
}

async function main() {
  console.log('🎨 Branding Migration Helper');
  console.log('============================');
  
  const exists = await checkBrandingTable();
  
  if (!exists) {
    await createBrandingTableDirectly();
  }
}

if (require.main === module) {
  main().then(() => {
    console.log('\n🎨 Migration helper completed');
    process.exit(0);
  }).catch((error) => {
    console.error('❌ Migration helper failed:', error);
    process.exit(1);
  });
}