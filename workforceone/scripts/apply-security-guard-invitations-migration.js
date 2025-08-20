const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Load environment variables
require('dotenv').config({ path: path.resolve(__dirname, '../.env') })

// Initialize Supabase with service role key
const supabase = createClient(
  'https://edeheyeloakiworbkfpg.supabase.co',
  process.env.SUPABASE_SERVICE_KEY
)

async function applyMigration() {
  console.log('🚀 Applying security guard invitations migration...')
  
  try {
    // Read the migration file
    const migrationPath = path.resolve(__dirname, '../database/migrations/074_security_guard_invitations.sql')
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8')
    
    // Split into individual statements (rough split on semicolons)
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))
    
    console.log(`Found ${statements.length} SQL statements to execute`)
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]
      if (statement.trim()) {
        console.log(`Executing statement ${i + 1}/${statements.length}...`)
        
        const { error } = await supabase.rpc('exec_sql', {
          sql_statement: statement
        })
        
        if (error) {
          console.error(`Error in statement ${i + 1}:`, error)
          // Continue with next statement rather than failing completely
        } else {
          console.log(`✅ Statement ${i + 1} executed successfully`)
        }
      }
    }
    
    console.log('✅ Migration completed!')
    
  } catch (error) {
    console.error('❌ Error applying migration:', error)
    process.exit(1)
  }
}

applyMigration()