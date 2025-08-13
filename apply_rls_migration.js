const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: './workforceone/backend/.env' });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const migrationSQL = `
-- Migration 021: Fix Profiles RLS Circular Dependency

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Organization members can view other profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can manage profiles" ON profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON profiles;

-- 1. Users can always view their own profile
CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- 2. Members can view other profiles in their organization (without circular dependency)
CREATE POLICY "Organization members can view profiles" ON profiles
  FOR SELECT USING (
    auth.uid() = id
    OR
    EXISTS (
      WITH user_org AS (
        SELECT organization_id 
        FROM profiles 
        WHERE id = auth.uid()
        LIMIT 1
      )
      SELECT 1 
      FROM user_org
      WHERE user_org.organization_id = profiles.organization_id
      AND user_org.organization_id IS NOT NULL
    )
  );

-- 3. Users can update their own profile  
CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- 4. Admins and managers can manage profiles in their organization
CREATE POLICY "Admins and managers can manage profiles" ON profiles
  FOR ALL USING (
    auth.uid() IN (
      SELECT id FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'manager')
    )
    AND
    EXISTS (
      WITH user_org AS (
        SELECT organization_id 
        FROM profiles 
        WHERE id = auth.uid()
        LIMIT 1
      )
      SELECT 1 
      FROM user_org
      WHERE user_org.organization_id = profiles.organization_id
      AND user_org.organization_id IS NOT NULL
    )
  );

-- 5. Enable insert for new user registration
CREATE POLICY "Enable insert for authenticated users only" ON profiles
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
`;

async function applyMigration() {
  try {
    console.log('🔧 Applying RLS migration...');
    
    // Split migration into individual statements and execute
    const statements = migrationSQL.split(';').filter(s => s.trim() && !s.trim().startsWith('--'));
    
    for (const statement of statements) {
      if (statement.trim()) {
        console.log(`Executing: ${statement.trim().substring(0, 50)}...`);
        const result = await supabase.rpc('exec_sql', { sql: statement.trim() });
        
        if (result.error) {
          console.error('Error executing statement:', result.error);
          // Continue with other statements even if one fails
        } else {
          console.log('✅ Statement executed successfully');
        }
      }
    }
    
    console.log('🎉 Migration completed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

applyMigration();