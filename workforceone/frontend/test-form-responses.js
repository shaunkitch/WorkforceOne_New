const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  'https://edeheyeloakiworbkfpg.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVkZWhleWVsb2FraXdvcmJrZnBnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDkxODY3NSwiZXhwIjoyMDcwNDk0Njc1fQ.HNoN21ykstlIQ6sPF5bsJtRyQyCTKENDBtFzgkEe40c'
)

async function testFormResponses() {
  try {
    console.log('Testing form_responses table...')
    
    // Get a sample form first
    const { data: forms } = await supabase
      .from('forms')
      .select('id, organization_id, created_by')
      .limit(1)
    
    if (!forms || forms.length === 0) {
      console.log('No forms found, cannot test form_responses')
      return
    }
    
    const form = forms[0]
    console.log('Using form:', form)
    
    // Try to create a form response with the correct structure
    const testResponse = {
      form_id: form.id,
      user_id: form.created_by, // Use the form creator as the user
      organization_id: form.organization_id,
      responses: { test: 'test response' },
      status: 'draft'
    }
    
    console.log('Attempting to insert:', testResponse)
    
    const { data, error } = await supabase
      .from('form_responses')
      .insert(testResponse)
      .select()
    
    if (error) {
      console.error('Insert error:', error)
    } else {
      console.log('✓ Success! Inserted form response:', data)
      
      // Clean up - delete the test record
      if (data && data.length > 0) {
        await supabase
          .from('form_responses')
          .delete()
          .eq('id', data[0].id)
        console.log('✓ Cleanup: Test record deleted')
      }
    }
    
  } catch (error) {
    console.error('Error:', error)
  }
}

testFormResponses()
