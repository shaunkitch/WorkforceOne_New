const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  'https://edeheyeloakiworbkfpg.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVkZWhleWVsb2FraXdvcmJrZnBnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDkxODY3NSwiZXhwIjoyMDcwNDk0Njc1fQ.HNoN21ykstlIQ6sPF5bsJtRyQyCTKENDBtFzgkEe40c'
)

async function discoverSchema() {
  try {
    console.log('Discovering complete form_responses schema...')
    
    const possibleColumns = [
      'id', 'form_id', 'assignment_id', 'organization_id', 'responses', 
      'submitted_at', 'status', 'created_at', 'updated_at',
      'respondent_id', 'assignee_id', 'user_id', 'created_by',
      'response_data', 'data', 'content', 'notes', 'metadata'
    ]
    
    const workingColumns = []
    const requiredColumns = []
    
    for (const column of possibleColumns) {
      try {
        const { error } = await supabase
          .from('form_responses')
          .select(column)
          .limit(1)
        
        if (!error) {
          workingColumns.push(column)
          console.log(`✓ ${column}`)
        }
      } catch (e) {
        // Column doesn't exist
      }
    }
    
    console.log('\nTesting which columns are required by attempting INSERT...')
    
    // Get form data for testing
    const { data: forms } = await supabase
      .from('forms')
      .select('*')
      .limit(1)
    
    if (forms && forms.length > 0) {
      const form = forms[0]
      
      // Try minimal insert to see what's required
      const { error } = await supabase
        .from('form_responses')
        .insert({
          form_id: form.id,
          organization_id: form.organization_id,
          responses: { test: 'test' }
        })
        .select()
      
      if (error) {
        console.log('Minimal insert error:', error.message)
        
        // Try with respondent_id
        const { error: error2 } = await supabase
          .from('form_responses')
          .insert({
            form_id: form.id,
            organization_id: form.organization_id,
            respondent_id: form.created_by,
            responses: { test: 'test' },
            status: 'completed'
          })
          .select()
        
        if (error2) {
          console.log('With respondent_id error:', error2.message)
        } else {
          console.log('✅ SUCCESS with respondent_id!')
          // Clean up
          const { data } = await supabase
            .from('form_responses')
            .select('id')
            .eq('form_id', form.id)
            .order('created_at', { ascending: false })
            .limit(1)
          
          if (data && data.length > 0) {
            await supabase
              .from('form_responses')
              .delete()
              .eq('id', data[0].id)
            console.log('Test record cleaned up')
          }
        }
      }
    }
    
    console.log('\nWorking columns:', workingColumns)
    
  } catch (error) {
    console.error('Error:', error)
  }
}

discoverSchema()
