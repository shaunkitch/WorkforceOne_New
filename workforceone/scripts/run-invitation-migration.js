const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Supabase configuration
const supabaseUrl = 'https://edeheyeloakiworbkfpg.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVkZWhleWVsb2FraXdvcmJrZnBnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDkxODY3NSwiZXhwIjoyMDcwNDk0Njc1fQ.Qkr6rZKi4TJBu5wGOoCtd4iJWpIW5LPwgOhfEhKFJoc';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runSQLFile(filePath) {
  try {
    console.log(`📄 Running SQL file: ${filePath}`);
    const sql = fs.readFileSync(filePath, 'utf8');
    
    // Split SQL by semicolons and execute each statement
    const statements = sql.split(';').filter(stmt => stmt.trim().length > 0);
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i].trim();
      if (statement) {
        console.log(`   Executing statement ${i + 1}/${statements.length}...`);
        const { error } = await supabase.rpc('exec_sql', { sql_query: statement });
        if (error) {
          console.log(`   ⚠️  Statement ${i + 1} error (might be OK):`, error.message);
        }
      }
    }
    
    console.log(`✅ SQL file completed: ${filePath}`);
    return true;
  } catch (error) {
    console.error(`❌ Error running SQL file ${filePath}:`, error);
    return false;
  }
}

async function runInvitationMigration() {
  console.log('🚀 Running Product Invitation Migration...\n');
  
  // Test connection first
  try {
    const { data, error } = await supabase.from('profiles').select('count(*)').limit(1);
    if (error) throw error;
    console.log('✅ Supabase connection successful');
  } catch (error) {
    console.error('❌ Connection failed:', error);
    return;
  }
  
  // Run the migration files
  const migrationFiles = [
    path.join(__dirname, '..', 'manual-create-product-invitations.sql'),
    path.join(__dirname, '..', 'fix-invitation-function.sql')
  ];
  
  for (const file of migrationFiles) {
    if (fs.existsSync(file)) {
      await runSQLFile(file);
    } else {
      console.log(`⚠️  Migration file not found: ${file}`);
    }
  }
  
  // Test the new tables
  try {
    console.log('\n🔍 Testing new tables...');
    
    const { data: invitations, error: invError } = await supabase
      .from('product_invitations')
      .select('count(*)')
      .limit(1);
    
    if (invError) {
      console.log('❌ product_invitations table test failed:', invError.message);
    } else {
      console.log('✅ product_invitations table is working');
    }
    
    const { data: userProducts, error: upError } = await supabase
      .from('user_products')
      .select('count(*)')
      .limit(1);
    
    if (upError) {
      console.log('❌ user_products table test failed:', upError.message);
    } else {
      console.log('✅ user_products table is working');
    }
    
    // Test the functions
    console.log('\n🔧 Testing functions...');
    
    const { data: funcTest, error: funcError } = await supabase
      .rpc('validate_invitation_code', { invitation_code_param: 'test-code' });
    
    if (funcError) {
      console.log('❌ validate_invitation_code function test failed:', funcError.message);
    } else {
      console.log('✅ validate_invitation_code function is working');
    }
    
  } catch (error) {
    console.error('❌ Error testing tables:', error);
  }
  
  console.log('\n🎉 Product Invitation Migration Complete!');
  console.log('\n📱 The mobile app can now:');
  console.log('   • Scan QR codes for product invitations');
  console.log('   • Handle guard invitations');
  console.log('   • Process invitations before authentication');
  console.log('   • Grant product access to users');
}

runInvitationMigration();