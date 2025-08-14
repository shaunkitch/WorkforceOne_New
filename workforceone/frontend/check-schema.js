const { createClient } = require('@supabase/supabase-js')

// Create Supabase client with service role key
const supabase = createClient(
  'https://edeheyeloakiworbkfpg.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVkZWhleWVsb2FraXdvcmJrZnBnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDkxODY3NSwiZXhwIjoyMDcwNDk0Njc1fQ.HNoN21ykstlIQ6sPF5bsJtRyQyCTKENDBtFzgkEe40c'
)

async function checkSchema() {
  try {
    console.log('Checking database schema...')
    
    // Check if form_responses table exists
    console.log('1. Checking form_responses table...')
    const { data: formResponses, error: frError } = await supabase
      .from('form_responses')
      .select('*')
      .limit(1)
    
    if (frError) {
      console.error('form_responses error:', frError)
      console.log('Table might not exist...')
    } else {
      console.log('✓ form_responses table exists')
      if (formResponses && formResponses.length > 0) {
        console.log('Sample record keys:', Object.keys(formResponses[0]))
      }
    }
    
    // Check outlet_visits table
    console.log('2. Checking outlet_visits table...')
    const { data: visits, error: visitError } = await supabase
      .from('outlet_visits')
      .select('*')
      .limit(1)
    
    if (visitError) {
      console.error('outlet_visits error:', visitError)
    } else {
      console.log('✓ outlet_visits table exists')
    }
    
    // Check forms table structure
    console.log('3. Checking forms table...')
    const { data: forms, error: formsError } = await supabase
      .from('forms')
      .select('*')
      .limit(1)
    
    if (formsError) {
      console.error('forms error:', formsError)
    } else {
      console.log('✓ forms table exists')
      if (forms && forms.length > 0) {
        console.log('Sample form keys:', Object.keys(forms[0]))
      }
    }
    
  } catch (error) {
    console.error('Error:', error)
  }
}

checkSchema()
