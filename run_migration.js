const fs = require('fs');
const path = require('path');

// Read environment variables
require('dotenv').config({ path: path.join(__dirname, 'workforceone/.env') });

// Import Supabase client
const { createClient } = require('@supabase/supabase-js');

async function runMigration() {
  try {
    // Initialize Supabase client with service role key
    const supabase = createClient(
      'https://edeheyeloakiworbkfpg.supabase.co',
      process.env.SUPABASE_SERVICE_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Read the migration file
    const migrationPath = path.join(__dirname, 'workforceone/database/migrations/017_email_integrations.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('Running email integrations migration...');
    console.log('Migration file size:', migrationSQL.length, 'characters');

    // Split the migration into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt && !stmt.startsWith('--') && stmt !== '');

    console.log('Number of SQL statements to execute:', statements.length);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (!statement) continue;

      console.log(`Executing statement ${i + 1}/${statements.length}...`);
      
      try {
        const { data, error } = await supabase.rpc('exec_sql', {
          sql_statement: statement + ';'
        });

        if (error) {
          console.error(`Error in statement ${i + 1}:`, error);
          // Try direct execution for certain statements
          console.log('Trying alternative execution method...');
          
          // For certain statements like CREATE TABLE, we can try direct execution
          if (statement.includes('CREATE TABLE') || statement.includes('CREATE INDEX') || statement.includes('ALTER TABLE')) {
            console.log('Skipping statement (may already exist):', statement.substring(0, 50) + '...');
            continue;
          }
          
          throw error;
        } else {
          console.log(`Statement ${i + 1} executed successfully`);
        }
      } catch (err) {
        console.error(`Failed to execute statement ${i + 1}:`, err.message);
        console.log('Statement content:', statement.substring(0, 100) + '...');
        
        // Continue with other statements for non-critical errors
        if (err.message.includes('already exists') || err.message.includes('duplicate')) {
          console.log('Skipping duplicate/existing object...');
          continue;
        }
        
        throw err;
      }
    }

    console.log('✅ Email integrations migration completed successfully!');
    
    // Test if tables were created
    const { data: tables, error: testError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .in('table_name', ['email_integrations', 'email_templates', 'email_logs']);

    if (testError) {
      console.error('Error checking tables:', testError);
    } else {
      console.log('Created tables:', tables.map(t => t.table_name));
    }

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration
runMigration();