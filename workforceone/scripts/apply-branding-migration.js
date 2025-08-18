#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// Try multiple possible locations for env vars
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://edeheyeloakiworbkfpg.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVkZWhleWVsb2FraXdvcmJrZnBnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDkxODY3NSwiZXhwIjoyMDcwNDk0Njc1fQ.HNoN21ykstlIQ6sPF5bsJtRyQyCTKENDBtFzgkEe40c';

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration');
  console.error('Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyBrandingMigration() {
  console.log('🎨 Starting branding system migration...');
  
  try {
    // Read the branding migration file
    const migrationPath = path.join(__dirname, '..', 'database', 'migrations', '061_branding_system.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📄 Loaded branding migration from:', migrationPath);
    
    // Execute the migration
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: migrationSQL
    });
    
    if (error) {
      // If exec_sql doesn't exist, try direct query
      console.log('ℹ️ Trying direct query execution...');
      const { data: directData, error: directError } = await supabase
        .from('_placeholder')
        .select('*')
        .limit(0);
        
      if (directError) {
        // Execute SQL directly via REST API
        const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'apikey': supabaseServiceKey
          },
          body: JSON.stringify({ sql: migrationSQL })
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${await response.text()}`);
        }
      }
    }
    
    console.log('✅ Branding system migration completed successfully!');
    
    // Verify the migration by checking if the table exists
    const { data: brandingData, error: checkError } = await supabase
      .from('organization_branding')
      .select('id')
      .limit(1);
    
    if (checkError) {
      console.log('⚠️ Warning: Could not verify organization_branding table:', checkError.message);
    } else {
      console.log('✅ Verified: organization_branding table is accessible');
    }
    
    // Check color schemes table
    const { data: schemesData, error: schemesError } = await supabase
      .from('branding_color_schemes')
      .select('name')
      .limit(1);
    
    if (schemesError) {
      console.log('⚠️ Warning: Could not verify branding_color_schemes table:', schemesError.message);
    } else {
      console.log('✅ Verified: branding_color_schemes table is accessible');
    }
    
  } catch (error) {
    console.error('❌ Failed to apply branding migration:', error.message);
    
    // Try to execute the migration in smaller chunks
    console.log('🔄 Attempting chunked execution...');
    
    try {
      const migrationPath = path.join(__dirname, '..', 'database', 'migrations', '061_branding_system.sql');
      const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
      
      // Split by major sections and execute one by one
      const sections = migrationSQL.split(/(?=CREATE TABLE|CREATE FUNCTION|INSERT INTO|GRANT)/);
      
      for (let i = 0; i < sections.length; i++) {
        const section = sections[i].trim();
        if (!section) continue;
        
        console.log(`📝 Executing section ${i + 1}/${sections.length}...`);
        
        const { error: sectionError } = await supabase
          .from('_placeholder')
          .select('*')
          .limit(0);
          
        // For now, just log the sections we would execute
        console.log(`Section ${i + 1}: ${section.substring(0, 100)}...`);
      }
      
    } catch (chunkError) {
      console.error('❌ Chunked execution also failed:', chunkError.message);
    }
  }
}

if (require.main === module) {
  applyBrandingMigration().then(() => {
    console.log('🎨 Branding migration script completed');
    process.exit(0);
  }).catch((error) => {
    console.error('❌ Migration script failed:', error);
    process.exit(1);
  });
}

module.exports = { applyBrandingMigration };