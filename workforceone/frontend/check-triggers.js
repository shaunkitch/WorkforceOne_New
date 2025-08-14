const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  'https://edeheyeloakiworbkfpg.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVkZWhleWVsb2FraXdvcmJrZnBnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5MTg2NzUsImV4cCI6MjA3MDQ5NDY3NX0.Xy5nVTnPMccxH0P6m3edTq1Mz3x3pCxGnEDO3pHwY8E'
)

async function testWithAnonKey() {
  try {
    console.log('Testing form_responses insert with anon key (simulating client-side)...')
    
    // First sign in as a test user
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: 'test@example.com',  // You'll need to use a real test account
      password: 'testpassword'
    })
    
    if (signInError) {
      console.log('Sign in failed, trying with service role instead...')
      return
    }
    
    console.log('Signed in as:', signInData.user?.email)
    
    // Get user's organization
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', signInData.user.id)
      .single()
    
    if (!profile) {
      console.log('No profile found')
      return
    }
    
    // Get a form
    const { data: forms } = await supabase
      .from('forms')
      .select('*')
      .eq('organization_id', profile.organization_id)
      .limit(1)
    
    if (!forms || forms.length === 0) {
      console.log('No forms found')
      return
    }
    
    const form = forms[0]
    
    // Try to create a form response
    const { data, error } = await supabase
      .from('form_responses')
      .insert({
        form_id: form.id,
        organization_id: profile.organization_id,
        respondent_id: profile.id,
        responses: { test: 'client test' },
        status: 'completed'
      })
      .select()
    
    if (error) {
      console.error('Insert error:', error)
    } else {
      console.log('✓ Success! Created response:', data)
      
      // Clean up
      if (data && data.length > 0) {
        await supabase
          .from('form_responses')
          .delete()
          .eq('id', data[0].id)
      }
    }
    
  } catch (error) {
    console.error('Error:', error)
  }
}

testWithAnonKey()
