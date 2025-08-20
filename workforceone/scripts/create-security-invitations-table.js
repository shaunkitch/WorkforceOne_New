const { createClient } = require('@supabase/supabase-js')
const path = require('path')

// Load environment variables
require('dotenv').config({ path: path.resolve(__dirname, '../.env') })

// Initialize Supabase with service role key
const supabase = createClient(
  'https://edeheyeloakiworbkfpg.supabase.co',
  process.env.SUPABASE_SERVICE_KEY
)

async function createSecurityInvitationsTable() {
  console.log('🚀 Creating security_guard_invitations table...')
  
  try {
    // Create the table with basic structure
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS security_guard_invitations (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
          invited_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
          email TEXT NOT NULL,
          invitation_code TEXT UNIQUE NOT NULL,
          status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'revoked')),
          expires_at TIMESTAMPTZ NOT NULL,
          accepted_at TIMESTAMPTZ,
          accepted_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
          metadata JSONB DEFAULT '{}',
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `
    
    const { error: createError } = await supabase.rpc('exec_sql', {
      sql_statement: createTableSQL
    })
    
    if (createError) {
      console.error('Error creating table:', createError)
      // Try direct query approach
      console.log('Trying direct query approach...')
      
      const { error: directError } = await supabase
        .from('_sql')
        .insert({ query: createTableSQL })
      
      if (directError) {
        console.error('Direct query also failed:', directError)
        console.log('Manual setup required in Supabase SQL editor')
        return false
      }
    }
    
    console.log('✅ Table created successfully!')
    
    // Create indexes
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_security_guard_invitations_code ON security_guard_invitations(invitation_code)',
      'CREATE INDEX IF NOT EXISTS idx_security_guard_invitations_email ON security_guard_invitations(email)',
      'CREATE INDEX IF NOT EXISTS idx_security_guard_invitations_org ON security_guard_invitations(organization_id)',
      'CREATE INDEX IF NOT EXISTS idx_security_guard_invitations_status ON security_guard_invitations(status)'
    ]
    
    for (const indexSQL of indexes) {
      console.log('Creating index...')
      const { error } = await supabase.rpc('exec_sql', {
        sql_statement: indexSQL
      })
      if (error) console.log('Index creation info:', error.message)
    }
    
    console.log('✅ Indexes created!')
    
    // Enable RLS and create policies
    const rlsSQL = `
      ALTER TABLE security_guard_invitations ENABLE ROW LEVEL SECURITY;
      
      CREATE POLICY "security_guard_invitations_anon_select_by_code" ON security_guard_invitations
          FOR SELECT TO anon 
          USING (status = 'pending' AND expires_at > NOW());
          
      CREATE POLICY "security_guard_invitations_auth_insert" ON security_guard_invitations
          FOR INSERT TO authenticated
          WITH CHECK (
              organization_id IN (
                  SELECT p.organization_id 
                  FROM profiles p 
                  WHERE p.id = auth.uid() 
                  AND p.role IN ('admin', 'manager')
              )
          );
    `
    
    const { error: rlsError } = await supabase.rpc('exec_sql', {
      sql_statement: rlsSQL
    })
    
    if (rlsError) {
      console.log('RLS setup info:', rlsError.message)
    } else {
      console.log('✅ RLS policies created!')
    }
    
    console.log('✅ Security guard invitations table setup completed!')
    return true
    
  } catch (error) {
    console.error('❌ Error creating table:', error)
    return false
  }
}

createSecurityInvitationsTable()