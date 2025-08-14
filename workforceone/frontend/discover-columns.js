const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  'https://edeheyeloakiworbkfpg.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVkZWhleWVsb2FraXdvcmJrZnBnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDkxODY3NSwiZXhwIjoyMDcwNDk0Njc1fQ.HNoN21ykstlIQ6sPF5bsJtRyQyCTKENDBtFzgkEe40c'
)

async function discoverColumns() {
  try {
    console.log('Testing different column names for form_responses...')
    
    const possibleColumns = [
      'id',
      'form_id', 
      'assignment_id',
      'user_id',
      'assignee_id', 
      'responded_by',
      'created_by',
      'organization_id',
      'responses',
      'response_data',
      'data',
      'content',
      'submitted_at',
      'status',
      'created_at',
      'updated_at'
    ]
    
    const workingColumns = []
    
    for (const column of possibleColumns) {
      try {
        const { error } = await supabase
          .from('form_responses')
          .select(column)
          .limit(1)
        
        if (!error) {
          workingColumns.push(column)
          console.log(`✓ ${column}`)
        } else {
          console.log(`✗ ${column} - ${error.message}`)
        }
      } catch (e) {
        console.log(`✗ ${column} - ${e.message}`)
      }
    }
    
    console.log('\nWorking columns:', workingColumns)
    
  } catch (error) {
    console.error('Error:', error)
  }
}

discoverColumns()
