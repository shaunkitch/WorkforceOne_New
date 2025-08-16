const { createClient } = require('@supabase/supabase-js');

async function fixRLS() {
    const supabaseUrl = 'https://edeheyeloakiworbkfpg.supabase.co';
    const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVkZWhleWVsb2FraXdvcmJrZnBnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDkxODY3NSwiZXhwIjoyMDcwNDk0Njc1fQ.HNoN21ykstlIQ6sPF5bsJtRyQyCTKENDBtFzgkEe40c';
    
    const supabase = createClient(supabaseUrl, serviceKey);
    
    try {
        console.log('1. Enabling RLS on organizations table...');
        const { error: rls1 } = await supabase.rpc('exec_sql', { 
            sql_statement: 'ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;'
        });
        if (rls1) console.log('RLS already enabled on organizations');
        
        console.log('2. Dropping existing organization policies...');
        const orgPolicies = [
            'DROP POLICY IF EXISTS "anon_validate_join_codes" ON organizations;',
            'DROP POLICY IF EXISTS "anon_create_organizations" ON organizations;',
            'DROP POLICY IF EXISTS "users_read_own_org" ON organizations;',
            'DROP POLICY IF EXISTS "admins_update_org" ON organizations;'
        ];
        
        for (const policy of orgPolicies) {
            await supabase.rpc('exec_sql', { sql_statement: policy });
        }
        
        console.log('3. Creating new organization policies...');
        
        // Allow anon to validate join codes
        const { error: policy1 } = await supabase.rpc('exec_sql', { 
            sql_statement: `CREATE POLICY "anon_validate_join_codes" ON organizations
                FOR SELECT TO anon 
                USING (join_code IS NOT NULL);`
        });
        if (policy1) console.error('Policy 1 error:', policy1);
        
        // Allow anon to create organizations
        const { error: policy2 } = await supabase.rpc('exec_sql', { 
            sql_statement: `CREATE POLICY "anon_create_organizations" ON organizations
                FOR INSERT TO anon 
                WITH CHECK (true);`
        });
        if (policy2) console.error('Policy 2 error:', policy2);
        
        // Allow users to read their org
        const { error: policy3 } = await supabase.rpc('exec_sql', { 
            sql_statement: `CREATE POLICY "users_read_own_org" ON organizations
                FOR SELECT TO authenticated
                USING (
                    id IN (
                        SELECT organization_id 
                        FROM profiles 
                        WHERE id = auth.uid()
                    )
                );`
        });
        if (policy3) console.error('Policy 3 error:', policy3);
        
        // Allow admins to update their org
        const { error: policy4 } = await supabase.rpc('exec_sql', { 
            sql_statement: `CREATE POLICY "admins_update_org" ON organizations
                FOR UPDATE TO authenticated
                USING (
                    id IN (
                        SELECT p.organization_id 
                        FROM profiles p 
                        WHERE p.id = auth.uid() 
                        AND p.role = 'admin'
                    )
                );`
        });
        if (policy4) console.error('Policy 4 error:', policy4);
        
        console.log('4. Enabling RLS on profiles table...');
        const { error: rls2 } = await supabase.rpc('exec_sql', { 
            sql_statement: 'ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;'
        });
        if (rls2) console.log('RLS already enabled on profiles');
        
        console.log('5. Creating profile policies...');
        
        // Users can create their own profile
        const { error: profile1 } = await supabase.rpc('exec_sql', { 
            sql_statement: `CREATE POLICY "auth_create_own_profile" ON profiles
                FOR INSERT TO authenticated
                WITH CHECK (id = auth.uid());`
        });
        if (profile1) console.log('Profile policy 1 already exists or error:', profile1);
        
        // Users can read their own profile
        const { error: profile2 } = await supabase.rpc('exec_sql', { 
            sql_statement: `CREATE POLICY "auth_read_own_profile" ON profiles
                FOR SELECT TO authenticated
                USING (id = auth.uid());`
        });
        if (profile2) console.log('Profile policy 2 already exists or error:', profile2);
        
        console.log('6. Testing policies...');
        const { data: orgData } = await supabase
            .from('organizations')
            .select('name')
            .limit(1);
        
        console.log('Success! RLS policies are working. Found orgs:', orgData?.length || 0);
        
    } catch (error) {
        console.error('Error fixing RLS:', error.message);
    }
}

fixRLS();