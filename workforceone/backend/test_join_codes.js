const { createClient } = require('@supabase/supabase-js');

async function testJoinCodes() {
    const supabaseUrl = 'https://edeheyeloakiworbkfpg.supabase.co';
    const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVkZWhleWVsb2FraXdvcmJrZnBnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDkxODY3NSwiZXhwIjoyMDcwNDk0Njc1fQ.HNoN21ykstlIQ6sPF5bsJtRyQyCTKENDBtFzgkEe40c';
    
    const supabase = createClient(supabaseUrl, serviceKey);
    
    try {
        console.log('🔍 Checking existing organizations with join codes...');
        
        const { data: orgs, error } = await supabase
            .from('organizations')
            .select('id, name, join_code')
            .limit(5);
            
        if (error) {
            console.error('❌ Error fetching organizations:', error);
            return;
        }
        
        console.log('📋 Organizations found:', orgs?.length || 0);
        
        if (orgs && orgs.length > 0) {
            orgs.forEach((org, index) => {
                console.log(`${index + 1}. ${org.name}`);
                console.log(`   Join Code: ${org.join_code || 'No code'}`);
                console.log(`   ID: ${org.id}`);
                console.log('');
            });
            
            // Test if we can validate a join code as anon user
            const testCode = orgs[0]?.join_code;
            if (testCode) {
                console.log(`🧪 Testing join code validation with: ${testCode}`);
                
                // Create anon client
                const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVkZWhleWVsb2FraXdvcmJrZnBnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5MTg2NzUsImV4cCI6MjA3MDQ5NDY3NX0.IRvOCcwlnc1myDFCEITelnrdHKgYIEt750taUFyDqkc';
                const anonSupabase = createClient(supabaseUrl, anonKey);
                
                const { data: validationData, error: validationError } = await anonSupabase
                    .from('organizations')
                    .select('id')
                    .eq('join_code', testCode)
                    .single();
                    
                if (validationError) {
                    console.error('❌ Anon validation failed:', validationError.message);
                } else {
                    console.log('✅ Anon validation successful! Found org:', validationData?.id);
                }
            }
        } else {
            console.log('ℹ️  No organizations found. Creating a test organization...');
            
            const { data: newOrg, error: createError } = await supabase
                .from('organizations')
                .insert({
                    name: 'Test Organization',
                    slug: 'test-org',
                    join_code: 'TEST01'
                })
                .select()
                .single();
                
            if (createError) {
                console.error('❌ Failed to create test org:', createError);
            } else {
                console.log('✅ Created test organization:', newOrg);
            }
        }
        
    } catch (error) {
        console.error('❌ Unexpected error:', error.message);
    }
}

testJoinCodes();