// This script helps debug the current session in the browser
// Copy and paste this into the browser console on the frontend

console.log('=== DEBUGGING CURRENT USER SESSION ===');

// Get Supabase client from the global scope or create one
const { createClient } = require('@supabase/supabase-js');

async function debugCurrentUser() {
  try {
    // Create client like the frontend does
    const supabase = createClient(
      'https://edeheyeloakiworbkfpg.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVkZWhleWVsb2FraXdvcmJrZnBnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5MTg2NzUsImV4cCI6MjA3MDQ5NDY3NX0.IRvOCcwlnc1myDFCEITelnrdHKgYIEt750taUFyDqkc'
    );

    // Get current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('❌ Session error:', sessionError);
      return;
    }

    if (!session) {
      console.log('❌ No active session found');
      return;
    }

    console.log('✅ Session found');
    console.log('User ID:', session.user.id);
    console.log('User email:', session.user.email);
    console.log('Token length:', session.access_token.length);
    console.log('Token expires at:', new Date(session.expires_at * 1000));

    // Test the API endpoint directly
    console.log('\n=== TESTING API ENDPOINT ===');
    const response = await fetch('http://localhost:5000/api/email-integrations', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('API Response status:', response.status);
    const result = await response.json();
    console.log('API Response:', result);

  } catch (error) {
    console.error('Debug failed:', error);
  }
}

debugCurrentUser();