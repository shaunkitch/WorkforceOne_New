const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  'https://edeheyeloakiworbkfpg.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVkZWhleWVsb2FraXdvcmJrZnBnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDkxODY3NSwiZXhwIjoyMDcwNDk0Njc1fQ.HNoN21ykstlIQ6sPF5bsJtRyQyCTKENDBtFzgkEe40c'
)

async function testFinalFlow() {
  try {
    console.log('Testing final form completion flow...')
    
    // Get form data
    const { data: forms } = await supabase
      .from('forms')
      .select('*')
      .limit(1)
    
    if (!forms || forms.length === 0) {
      console.log('No forms to test with')
      return
    }
    
    const form = forms[0]
    console.log('Testing with form:', form.title)
    
    // Test complete form response
    const formResponse = {
      form_id: form.id,
      organization_id: form.organization_id,
      respondent_id: form.created_by,
      responses: {
        'question1': 'Test Answer 1',
        'question2': 'Test Answer 2',
        'rating': 5,
        '_metadata': {
          'user_name': 'Test User',
          'outlet_id': 'test-outlet-123',
          'completed_at': new Date().toISOString()
        }
      },
      status: 'completed',
      submitted_at: new Date().toISOString()
    }
    
    console.log('Inserting complete form response...')
    const { data, error } = await supabase
      .from('form_responses')
      .insert(formResponse)
      .select()
    
    if (error) {
      console.error('❌ Final flow test failed:', error)
    } else {
      console.log('✅ Final flow test SUCCESSFUL!')
      console.log('Created response with ID:', data[0].id)
      
      // Test querying back
      const { data: queryResult } = await supabase
        .from('form_responses')
        .select('*')
        .eq('id', data[0].id)
        .single()
      
      console.log('Form responses:', queryResult.responses)
      console.log('Metadata:', queryResult.responses._metadata)
      
      // Clean up
      await supabase
        .from('form_responses')
        .delete()
        .eq('id', data[0].id)
      console.log('✅ Test cleaned up')
    }
    
  } catch (error) {
    console.error('Error:', error)
  }
}

testFinalFlow()
