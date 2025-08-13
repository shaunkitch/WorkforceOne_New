const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './workforceone/frontend/.env.local' });

async function debugAuth() {
  console.log('Frontend API URL:', process.env.NEXT_PUBLIC_API_URL);
  
  // Check the frontend environment
  const frontendSupabase = createClient(
    'https://edeheyeloakiworbkfpg.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVkZWhleWVsb2FraXdvcmJrZnBnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5MTg2NzUsImV4cCI6MjA3MDQ5NDY3NX0.HKTI5JdgQgbGXSjD86qj5fh6Rf_Df0JvOdl-qBYl2zM'
  );

  try {
    // Try to get a session (this won't work in this context but we can check the structure)
    console.log('Attempting to get session...');
    
    // Let's check what a manual fetch looks like
    const response = await fetch('http://localhost:5000/health');
    if (response.ok) {
      const health = await response.json();
      console.log('Backend health check:', health);
    } else {
      console.log('Backend health check failed:', response.status);
    }

    // Test with a fake token to see the error
    const testResponse = await fetch('http://localhost:5000/api/email-integrations', {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer fake-token-for-testing',
        'Content-Type': 'application/json'
      }
    });

    console.log('Test API response status:', testResponse.status);
    const errorResult = await testResponse.json();
    console.log('Test API response:', errorResult);

  } catch (error) {
    console.error('Debug failed:', error);
  }
}

debugAuth();