const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')

// Create Supabase client with service role key
const supabase = createClient(
  'https://edeheyeloakiworbkfpg.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVkZWhleWVsb2FraXdvcmJrZnBnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDkxODY3NSwiZXhwIjoyMDcwNDk0Njc1fQ.HNoN21ykstlIQ6sPF5bsJtRyQyCTKENDBtFzgkEe40c'
)

async function applyMigration() {
  try {
    console.log('Applying migration 033...')
    
    // Read the migration file
    const migrationSQL = fs.readFileSync('./workforceone/database/migrations/033_enhance_outlet_form_system.sql', 'utf8')
    
    // Split by semicolon and filter out empty statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))
    
    console.log(`Found ${statements.length} SQL statements to execute`)
    
    // Execute each statement individually
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]
      if (statement.includes('DO $$') || statement.includes('END $$')) {
        // Handle DO blocks specially
        console.log(`Executing DO block ${i + 1}...`)
        const { error } = await supabase.rpc('execute_sql', { sql_query: statement })
        if (error) {
          console.error(`Error in DO block ${i + 1}:`, error)
        } else {
          console.log(`✓ DO block ${i + 1} executed successfully`)
        }
      } else {
        console.log(`Executing statement ${i + 1}: ${statement.substring(0, 50)}...`)
        const { error } = await supabase.rpc('execute_sql', { sql_query: statement })
        if (error) {
          console.error(`Error in statement ${i + 1}:`, error)
        } else {
          console.log(`✓ Statement ${i + 1} executed successfully`)
        }
      }
    }
    
    console.log('Migration 033 completed!')
    
    // Verify the table was created
    const { data, error } = await supabase
      .from('outlet_group_forms')
      .select('*')
      .limit(1)
    
    if (error) {
      console.error('Error verifying table creation:', error)
    } else {
      console.log('✓ Table outlet_group_forms verified successfully')
    }
    
  } catch (error) {
    console.error('Error applying migration:', error)
  }
}

applyMigration()