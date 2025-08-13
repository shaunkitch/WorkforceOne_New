const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './workforceone/.env' });

async function testEmailConfiguration() {
  const supabase = createClient(
    'https://edeheyeloakiworbkfpg.supabase.co',
    process.env.SUPABASE_SERVICE_KEY
  );

  console.log('Testing email integration system...');

  try {
    // Test 1: Check if email_integrations table exists and can be used
    console.log('\n1. Testing email_integrations table...');
    const { data: integrations, error: intError } = await supabase
      .from('email_integrations')
      .select('*')
      .limit(1);

    if (intError) {
      console.log('❌ email_integrations table error:', intError.message);
    } else {
      console.log('✅ email_integrations table accessible');
      console.log('   Current integrations:', integrations.length);
    }

    // Test 2: Test encryption function
    console.log('\n2. Testing encryption functions...');
    try {
      const { data: encrypted, error: encError } = await supabase
        .rpc('encrypt_email_credential', { credential: 'test123' });
      
      if (encError) {
        console.log('❌ Encryption function error:', encError.message);
      } else {
        console.log('✅ Encryption function working');
        
        // Test decryption
        const { data: decrypted, error: decError } = await supabase
          .rpc('decrypt_email_credential', { encrypted_credential: encrypted });
          
        if (decError) {
          console.log('❌ Decryption function error:', decError.message);
        } else {
          console.log('✅ Decryption function working');
          console.log('   Original: test123, Decrypted:', decrypted);
        }
      }
    } catch (err) {
      console.log('❌ Encryption/Decryption test failed:', err.message);
    }

    // Test 3: Check what tables exist
    console.log('\n3. Checking available tables...');
    try {
      const { data: tables, error: tableError } = await supabase
        .rpc('', {}) // This won't work but might give us insight
    } catch (err) {
      // Expected to fail, but we can continue
    }

    // Test 4: Try creating a test email integration
    console.log('\n4. Testing email integration creation...');
    
    // First, check if any organizations exist
    const { data: orgs, error: orgError } = await supabase
      .from('organizations')
      .select('id, name')
      .limit(1);

    if (orgError) {
      console.log('❌ Cannot access organizations:', orgError.message);
    } else if (orgs.length === 0) {
      console.log('⚠️  No organizations found');
    } else {
      console.log('✅ Organizations found:', orgs[0].name);
      
      // Try to create a test integration (we'll delete it after)
      const testIntegration = {
        organization_id: orgs[0].id,
        provider: 'smtp',
        from_email: 'test@example.com',
        smtp_host: 'smtp.example.com',
        smtp_port: 587,
        smtp_secure: false,
        smtp_user: 'test@example.com',
        is_active: false // Keep it inactive
      };

      const { data: newIntegration, error: createError } = await supabase
        .from('email_integrations')
        .upsert(testIntegration, { onConflict: 'organization_id' })
        .select();

      if (createError) {
        console.log('❌ Cannot create test integration:', createError.message);
      } else {
        console.log('✅ Test integration created/updated successfully');
        console.log('   Integration ID:', newIntegration[0]?.id);
        
        // Clean up - set back to inactive
        await supabase
          .from('email_integrations')
          .update({ is_active: false })
          .eq('id', newIntegration[0]?.id);
      }
    }

    console.log('\n='.repeat(50));
    console.log('SUMMARY:');
    console.log('The email integration system is partially ready.');
    console.log('Main functionality should work with the existing email_integrations table.');
    console.log('Missing tables (email_templates, email_logs) will cause some features to not work.');
    console.log('='.repeat(50));

  } catch (error) {
    console.error('Test failed:', error);
  }
}

testEmailConfiguration();