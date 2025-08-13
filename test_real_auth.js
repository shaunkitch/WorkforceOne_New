const { createClient } = require('@supabase/supabase-js');

async function testRealAuth() {
  // Create auth client like the backend does
  const supabaseAuth = createClient(
    'https://edeheyeloakiworbkfpg.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVkZWhleWVsb2FraXdvcmJrZnBnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5MTg2NzUsImV4cCI6MjA3MDQ5NDY3NX0.IRvOCcwlnc1myDFCEITelnrdHKgYIEt750taUFyDqkc'
  );

  console.log('Testing authentication flow...');

  try {
    // Try to sign in with test credentials to get a real token
    const { data: authData, error: signInError } = await supabaseAuth.auth.signInWithPassword({
      email: 'test@workforceone.com', // Replace with actual test credentials
      password: 'testpassword123'     // Replace with actual test password
    });

    if (signInError) {
      console.log('Sign in error:', signInError.message);
      console.log('This is expected if no test user exists');
      return;
    }

    if (authData.session) {
      console.log('Got session, testing token validation...');
      const token = authData.session.access_token;
      
      // Test the token validation like the backend does
      const { data: { user }, error: authError } = await supabaseAuth.auth.getUser(token);
      
      if (authError) {
        console.log('Token validation error:', authError.message);
      } else {
        console.log('✅ Token validation successful!');
        console.log('User ID:', user.id);
        console.log('User email:', user.email);
        
        // Test the API endpoint
        const response = await fetch('http://localhost:5000/api/email-integrations', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        console.log('API response status:', response.status);
        const result = await response.json();
        console.log('API response:', result);
      }
    }

  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

testRealAuth();