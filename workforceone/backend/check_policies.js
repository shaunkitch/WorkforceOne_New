const { createClient } = require('@supabase/supabase-js');

async function checkPolicies() {
    const supabaseUrl = 'https://edeheyeloakiworbkfpg.supabase.co';
    const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVkZWhleWVsb2FraXdvcmJrZnBnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDkxODY3NSwiZXhwIjoyMDcwNDk0Njc1fQ.HNoN21ykstlIQ6sPF5bsJtRyQyCTKENDBtFzgkEe40c';
    
    const supabase = createClient(supabaseUrl, serviceKey);
    
    try {
        console.log('🔍 Checking current RLS policies...');
        
        // Check if RLS is enabled
        const { data: rlsStatus, error: rlsError } = await supabase
            .rpc('exec_sql', { 
                sql_statement: `
                SELECT 
                    tablename, 
                    rowsecurity 
                FROM pg_tables 
                WHERE tablename IN ('organizations', 'profiles') 
                    AND schemaname = 'public';
                `
            });
            
        if (rlsError) {
            console.log('Cannot check RLS status with exec_sql');
        } else {
            console.log('RLS Status:', rlsStatus);
        }
        
        // Try a simple direct query to see what happens
        console.log('\n🧪 Testing direct anon query...');
        
        const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVkZWhleWVsb2FraXdvcmJrZnBnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ5MTg2NzUsImV4cCI6MjA3MDQ5NDY3NX0.IRvOCcwlnc1myDFCEITelnrdHKgYIEt750taUFyDqkc';
        const anonSupabase = createClient(supabaseUrl, anonKey);
        
        // Test 1: Basic select on organizations
        const { data: testData1, error: testError1 } = await anonSupabase
            .from('organizations')
            .select('id, name')
            .limit(1);
            
        if (testError1) {
            console.error('❌ Basic select failed:', testError1);
        } else {
            console.log('✅ Basic select works:', testData1?.length || 0, 'records');
        }
        
        // Test 2: Join code query
        const { data: testData2, error: testError2 } = await anonSupabase
            .from('organizations')
            .select('id')
            .eq('join_code', '05400E');
            
        if (testError2) {
            console.error('❌ Join code query failed:', testError2);
        } else {
            console.log('✅ Join code query works:', testData2);
        }
        
        // Test 3: Try to insert a profile as anon (should fail)
        const { data: testData3, error: testError3 } = await anonSupabase
            .from('profiles')
            .insert({
                id: '00000000-0000-0000-0000-000000000000',
                email: 'test@test.com',
                full_name: 'Test User'
            });
            
        if (testError3) {
            console.log('✅ Profile insert correctly blocked for anon:', testError3.message);
        } else {
            console.log('⚠️  Profile insert should have failed but succeeded');
        }
        
    } catch (error) {
        console.error('❌ Unexpected error:', error.message);
    }
}

checkPolicies();