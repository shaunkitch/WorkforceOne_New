const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  'https://edeheyeloakiworbkfpg.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVkZWhleWVsb2FraXdvcmJrZnBnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDkxODY3NSwiZXhwIjoyMDcwNDk0Njc1fQ.HNoN21ykstlIQ6sPF5bsJtRyQyCTKENDBtFzgkEe40c'
)

async function testFormCompletion() {
  try {
    console.log('Testing form completion flow...')
    
    // Get a form to test with
    const { data: forms } = await supabase
      .from('forms')
      .select('*')
      .limit(1)
    
    if (!forms || forms.length === 0) {
      console.log('No forms found to test with')
      return
    }
    
    const form = forms[0]
    console.log('Testing with form:', form.title)
    
    // Create a test form response using the correct schema
    const testResponse = {
      form_id: form.id,
      organization_id: form.organization_id,
      responses: {
        'test_field': 'This is a test response',
        'rating': 5,
        '_metadata': {
          'user_id': form.created_by,
          'outlet_id': 'test-outlet-id', 
          'completed_at': new Date().toISOString(),
          'test': true
        }
      },
      status: 'completed',
      submitted_at: new Date().toISOString()
    }
    
    console.log('Inserting test response...')
    const { data, error } = await supabase
      .from('form_responses')
      .insert(testResponse)
      .select()
    
    if (error) {
      console.error('❌ Form completion test failed:', error)
    } else {
      console.log('✅ Form completion test successful!', data)
      
      // Test querying the response
      const { data: queryResult, error: queryError } = await supabase
        .from('form_responses')
        .select('*')
        .eq('id', data[0].id)
        .single()
        
      if (queryError) {
        console.error('Query test failed:', queryError)
      } else {
        console.log('✅ Query test successful!')
        console.log('Response data:', queryResult.responses)
      }
      
      // Clean up - delete the test record
      await supabase
        .from('form_responses')
        .delete()
        .eq('id', data[0].id)
      console.log('✅ Test record cleaned up')
    }
    
  } catch (error) {
    console.error('Error:', error)
  }
}

testFormCompletion()
