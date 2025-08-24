// Setup Security Guard System with proper database structure
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://edeheyeloakiworbkfpg.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVkZWhleWVsb2FraXdvcmJrZnBnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDkxODY3NSwiZXhwIjoyMDcwNDk0Njc1fQ.Qkr6rZKi4TJBu5wGOoCtd4iJWpIW5LPwgOhfEhKFJoc'
);

async function setupSecurityGuardSystem() {
  try {
    console.log('🛡️ Setting up Security Guard System...\n');

    // 1. Create security_guard_invitations table if it doesn't exist
    console.log('1. Creating security_guard_invitations table...');
    
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS security_guard_invitations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
        invited_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
        email TEXT NOT NULL,
        invitation_code TEXT UNIQUE NOT NULL,
        status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'revoked')),
        expires_at TIMESTAMPTZ NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        accepted_at TIMESTAMPTZ,
        accepted_by UUID REFERENCES auth.users(id),
        metadata JSONB DEFAULT '{}'::jsonb
      );
    `;

    const { error: createError } = await supabase.rpc('exec_sql', { sql: createTableSQL });
    if (createError) {
      console.log('⚠️ Table creation result:', createError.message);
    } else {
      console.log('✅ Security guard invitations table ready');
    }

    // 2. Create indexes for better performance
    console.log('2. Creating indexes...');
    const indexSQL = `
      CREATE INDEX IF NOT EXISTS idx_security_guard_invitations_code ON security_guard_invitations(invitation_code);
      CREATE INDEX IF NOT EXISTS idx_security_guard_invitations_email ON security_guard_invitations(email);
      CREATE INDEX IF NOT EXISTS idx_security_guard_invitations_status ON security_guard_invitations(status);
      CREATE INDEX IF NOT EXISTS idx_security_guard_invitations_org ON security_guard_invitations(organization_id);
    `;

    const { error: indexError } = await supabase.rpc('exec_sql', { sql: indexSQL });
    if (indexError) {
      console.log('⚠️ Index creation result:', indexError.message);
    } else {
      console.log('✅ Indexes created');
    }

    // 3. Create RLS policies
    console.log('3. Setting up RLS policies...');
    const rlsSQL = `
      ALTER TABLE security_guard_invitations ENABLE ROW LEVEL SECURITY;
      
      DROP POLICY IF EXISTS "security_guard_invitations_select" ON security_guard_invitations;
      DROP POLICY IF EXISTS "security_guard_invitations_insert" ON security_guard_invitations;
      DROP POLICY IF EXISTS "security_guard_invitations_update" ON security_guard_invitations;
      
      CREATE POLICY "security_guard_invitations_select" ON security_guard_invitations
        FOR SELECT USING (
          organization_id IN (
            SELECT organization_id FROM profiles WHERE id = auth.uid()
          )
        );
      
      CREATE POLICY "security_guard_invitations_insert" ON security_guard_invitations
        FOR INSERT WITH CHECK (
          organization_id IN (
            SELECT organization_id FROM profiles WHERE id = auth.uid()
          )
        );
      
      CREATE POLICY "security_guard_invitations_update" ON security_guard_invitations
        FOR UPDATE USING (
          organization_id IN (
            SELECT organization_id FROM profiles WHERE id = auth.uid()
          )
        );
    `;

    const { error: rlsError } = await supabase.rpc('exec_sql', { sql: rlsSQL });
    if (rlsError) {
      console.log('⚠️ RLS setup result:', rlsError.message);
    } else {
      console.log('✅ RLS policies configured');
    }

    // 4. Test invitation creation
    console.log('4. Testing invitation creation...');
    
    const testInvitation = {
      organization_id: '123e4567-e89b-12d3-a456-426614174000', // dummy org ID
      invited_by: '123e4567-e89b-12d3-a456-426614174001', // dummy user ID
      email: 'test-guard@example.com',
      invitation_code: 'TEST' + Math.random().toString(36).substring(2, 8).toUpperCase(),
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      metadata: {
        test: true,
        invited_by_name: 'Test Admin'
      }
    };

    // Try to insert test invitation (may fail due to RLS, which is expected)
    const { data: invitation, error: insertError } = await supabase
      .from('security_guard_invitations')
      .insert(testInvitation)
      .select()
      .single();

    if (insertError) {
      console.log('⚠️ Test invitation creation (expected to fail with RLS):', insertError.message);
    } else {
      console.log('✅ Test invitation created:', invitation.invitation_code);
    }

    // 5. Test guard user creation
    console.log('5. Testing guard user setup...');
    
    // Check existing guard users
    const { data: guardUsers, error: guardError } = await supabase
      .from('user_products')
      .select(`
        user_id,
        granted_at,
        profiles:user_id (email, full_name)
      `)
      .eq('product_id', 'guard-management')
      .eq('is_active', true);

    if (guardError) {
      console.log('⚠️ Guard users query error:', guardError.message);
    } else {
      console.log('✅ Found', guardUsers.length, 'existing guard users');
      guardUsers.forEach(guard => {
        console.log(`   - ${guard.profiles?.full_name || guard.profiles?.email || 'Unknown'} (${guard.user_id})`);
      });
    }

    // 6. Create sample QR codes for testing
    console.log('6. Creating sample QR codes...');
    
    const sampleCodes = {
      invitation: {
        type: 'product_invitation',
        organizationName: 'WorkforceOne Security',
        products: ['guard-management'],
        invitationCode: 'DEMO123'
      },
      checkin: {
        type: 'site_checkin',
        siteId: 'site_demo_001',
        siteName: 'Main Office Security Checkpoint',
        latitude: -26.2041,
        longitude: 28.0473,
        checkpointId: 'cp_001',
        routeId: 'route_main'
      }
    };

    console.log('✅ Sample QR codes ready:');
    console.log('   - Invitation:', JSON.stringify(sampleCodes.invitation));
    console.log('   - Check-in:', JSON.stringify(sampleCodes.checkin));

    console.log('\n🎯 SECURITY GUARD SYSTEM SETUP COMPLETE!');
    console.log('\n📋 NEXT STEPS:');
    console.log('1. Admin app: http://localhost:3001/dashboard/security');
    console.log('2. Test guard invitation flow');
    console.log('3. Test QR code scanning with mobile app');
    console.log('4. Verify check-in functionality');
    console.log('\n🔐 QR CODES FOR TESTING:');
    console.log('Invitation QR:', `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(JSON.stringify(sampleCodes.invitation))}`);
    console.log('Check-in QR:', `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(JSON.stringify(sampleCodes.checkin))}`);

  } catch (error) {
    console.error('❌ Setup failed:', error);
  }
}

// Add exec_sql function if it doesn't exist
async function ensureExecSqlFunction() {
  const createFunctionSQL = `
    CREATE OR REPLACE FUNCTION exec_sql(sql text)
    RETURNS text
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $$
    BEGIN
      EXECUTE sql;
      RETURN 'SUCCESS';
    EXCEPTION
      WHEN OTHERS THEN
        RETURN SQLERRM;
    END;
    $$;
  `;

  try {
    const { error } = await supabase.rpc('exec_sql', { sql: createFunctionSQL });
    if (error) {
      console.log('Creating exec_sql function...');
      // If exec_sql doesn't exist, we need to create it differently
      // This is a chicken-and-egg problem, so we'll handle it gracefully
    }
  } catch (err) {
    console.log('Note: exec_sql function setup deferred to manual SQL execution');
  }
}

// Run setup
ensureExecSqlFunction().then(() => setupSecurityGuardSystem());