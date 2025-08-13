const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './workforceone/.env' });

async function checkTables() {
  const supabase = createClient(
    'https://edeheyeloakiworbkfpg.supabase.co',
    process.env.SUPABASE_SERVICE_KEY
  );

  console.log('Checking if email integration tables exist...');

  try {
    // Try to query each table
    const tables = ['email_integrations', 'email_templates', 'email_logs'];
    
    for (const tableName of tables) {
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .limit(1);

        if (error) {
          console.log(`❌ Table ${tableName} does not exist:`, error.message);
        } else {
          console.log(`✅ Table ${tableName} exists`);
        }
      } catch (err) {
        console.log(`❌ Table ${tableName} check failed:`, err.message);
      }
    }

    // Check functions
    console.log('\nChecking functions...');
    const functions = ['encrypt_email_credential', 'decrypt_email_credential', 'test_email_integration'];
    
    for (const funcName of functions) {
      try {
        const { data, error } = await supabase.rpc(funcName, funcName === 'encrypt_email_credential' ? { credential: 'test' } : {});
        console.log(`✅ Function ${funcName} exists`);
      } catch (err) {
        console.log(`❌ Function ${funcName} does not exist or failed:`, err.message);
      }
    }

  } catch (error) {
    console.error('Error checking tables:', error);
  }
}

checkTables();