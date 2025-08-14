const { createClient } = require('@supabase/supabase-js')

// Create Supabase client
const supabase = createClient(
  'https://zrtpuimdrktahdnjqtru.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpydHB1aW1kcmt0YWhkbmpxdHJ1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNDY4NDc2OSwiZXhwIjoyMDUwMjYwNzY5fQ.4kJLxcHgYxZtxnVdGMUd8nxBJgKYP5QC9KiWEkZ5QZE'
)

async function checkForms() {
  try {
    console.log('Checking forms in database...')
    
    // Get all forms
    const { data: forms, error, count } = await supabase
      .from('forms')
      .select('*', { count: 'exact' })
    
    if (error) {
      console.error('Error fetching forms:', error)
      return
    }
    
    console.log(`Found ${count} forms total`)
    console.log('Forms:', forms)
    
    // Check active forms
    const { data: activeForms, error: activeError, count: activeCount } = await supabase
      .from('forms')
      .select('*', { count: 'exact' })
      .eq('is_active', true)
    
    if (activeError) {
      console.error('Error fetching active forms:', activeError)
      return
    }
    
    console.log(`Found ${activeCount} active forms`)
    console.log('Active forms:', activeForms)
    
    // Get organizations
    const { data: orgs, error: orgsError } = await supabase
      .from('organizations')
      .select('*')
    
    if (orgsError) {
      console.error('Error fetching organizations:', orgsError)
      return
    }
    
    console.log('Organizations:', orgs)
    
  } catch (error) {
    console.error('Error:', error)
  }
}

checkForms()