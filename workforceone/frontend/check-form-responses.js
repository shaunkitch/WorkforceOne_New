const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  'https://edeheyeloakiworbkfpg.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVkZWhleWVsb2FraXdvcmJrZnBnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDkxODY3NSwiZXhwIjoyMDcwNDk0Njc1fQ.HNoN21ykstlIQ6sPF5bsJtRyQyCTKENDBtFzgkEe40c'
)

async function checkFormResponses() {
  try {
    // Try to get the structure by attempting an insert with minimal data
    console.log('Checking form_responses table structure...')
    
    // First, let's try to select with all possible columns
    const { data, error } = await supabase
      .from('form_responses')
      .select('*')
      .limit(1)
    
    if (error) {
      console.error('Error:', error)
    } else {
      console.log('✓ form_responses table accessible')
      if (data && data.length > 0) {
        console.log('Existing record columns:', Object.keys(data[0]))
        console.log('Sample record:', data[0])
      } else {
        console.log('No existing records, let\'s try to understand the schema...')
        
        // Try a test insert to see what columns are expected
        try {
          const { error: insertError } = await supabase
            .from('form_responses')
            .insert({
              form_id: '00000000-0000-0000-0000-000000000000', // dummy UUID
              response_data: { test: 'test' }
            })
            .select()
          
          if (insertError) {
            console.log('Insert error (this helps us understand the schema):', insertError)
          }
        } catch (e) {
          console.log('Insert attempt error:', e.message)
        }
      }
    }
    
  } catch (error) {
    console.error('Error:', error)
  }
}

checkFormResponses()
