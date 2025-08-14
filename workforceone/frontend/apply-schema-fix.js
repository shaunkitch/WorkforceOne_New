const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  'https://edeheyeloakiworbkfpg.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVkZWhleWVsb2FraXdvcmJrZnBnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDkxODY3NSwiZXhwIjoyMDcwNDk0Njc1fQ.HNoN21ykstlIQ6sPF5bsJtRyQyCTKENDBtFzgkEe40c'
)

async function applySchemaFix() {
  try {
    console.log('Applying schema fix for form_responses...')
    
    // Add user_id column
    console.log('Adding user_id column...')
    const addColumnResult = await supabase.rpc('exec_sql', {
      query: 'ALTER TABLE form_responses ADD COLUMN IF NOT EXISTS user_id UUID;'
    })
    
    if (addColumnResult.error) {
      console.log('Add column result:', addColumnResult.error)
      // Try alternative approach - direct SQL execution won't work via RPC, let's use a different method
    }
    
    // Test if the column was added
    console.log('Testing if user_id column now exists...')
    const { error: testError } = await supabase
      .from('form_responses')
      .select('user_id')
      .limit(1)
    
    if (testError) {
      console.log('Column still doesn\'t exist, trying manual addition...')
      
      // Since we can't execute DDL directly, let's create a test record to force the schema refresh
      // Actually, let me try to manually add the column using a different approach
      
      console.log('Trying to add column via INSERT attempt...')
      
      // Get a form to use for testing
      const { data: forms } = await supabase
        .from('forms')
        .select('id, organization_id, created_by')
        .limit(1)
      
      if (forms && forms.length > 0) {
        const form = forms[0]
        
        // Try inserting with user_id to see if it works now
        const { data, error } = await supabase
          .from('form_responses')
          .insert({
            form_id: form.id,
            organization_id: form.organization_id,
            user_id: form.created_by,
            responses: { test: 'schema test' },
            status: 'draft'
          })
          .select()
        
        if (error) {
          console.error('Still failing:', error)
          console.log('\nThe schema changes need to be applied manually in Supabase dashboard.')
          console.log('Please run this SQL in the Supabase SQL Editor:')
          console.log('ALTER TABLE form_responses ADD COLUMN IF NOT EXISTS user_id UUID;')
        } else {
          console.log('✓ Success! Column was added and working:', data)
          
          // Clean up test record
          if (data && data.length > 0) {
            await supabase
              .from('form_responses')
              .delete()
              .eq('id', data[0].id)
            console.log('✓ Test record cleaned up')
          }
        }
      }
    } else {
      console.log('✓ user_id column exists and is accessible!')
    }
    
  } catch (error) {
    console.error('Error:', error)
  }
}

applySchemaFix()
