const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  'https://edeheyeloakiworbkfpg.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVkZWhleWVsb2FraXdvcmJrZnBnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDkxODY3NSwiZXhwIjoyMDcwNDk0Njc1fQ.HNoN21ykstlIQ6sPF5bsJtRyQyCTKENDBtFzgkEe40c'
)

async function checkAnalytics() {
  try {
    console.log('Checking form_analytics table...')
    
    // Try to select from form_analytics
    const { data, error } = await supabase
      .from('form_analytics')
      .select('*')
      .limit(1)
    
    if (error) {
      console.error('form_analytics error:', error)
    } else {
      console.log('✓ form_analytics table exists')
      if (data && data.length > 0) {
        console.log('Columns:', Object.keys(data[0]))
      }
    }
    
    // Try to discover columns
    const columns = [
      'id', 'form_id', 'user_id', 'respondent_id', 'organization_id',
      'response_id', 'completed_at', 'created_at', 'updated_at'
    ]
    
    console.log('\nTesting columns:')
    for (const col of columns) {
      const { error } = await supabase
        .from('form_analytics')
        .select(col)
        .limit(1)
      
      if (!error) {
        console.log(`✓ ${col}`)
      }
    }
    
    // Test insert to see what's required
    console.log('\nTesting minimal insert...')
    const { data: forms } = await supabase
      .from('forms')
      .select('*')
      .limit(1)
    
    if (forms && forms.length > 0) {
      const form = forms[0]
      
      const { error: insertError } = await supabase
        .from('form_analytics')
        .insert({
          form_id: form.id,
          organization_id: form.organization_id
        })
        .select()
      
      if (insertError) {
        console.log('Insert error:', insertError.message)
      }
    }
    
  } catch (error) {
    console.error('Error:', error)
  }
}

checkAnalytics()
