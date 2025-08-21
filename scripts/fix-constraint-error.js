const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://edeheyeloakiworbkfpg.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixConstraintError() {
  console.log('🔧 Fixing database constraint error in complete_invitation_after_auth...\n');
  
  try {
    // Check what constraints exist on user_products table
    console.log('1️⃣ Checking user_products table constraints...');
    
    const { data: constraints, error: constraintError } = await supabase
      .rpc('exec_sql', {
        query: `
          SELECT 
            tc.constraint_name, 
            tc.constraint_type,
            kcu.column_name
          FROM information_schema.table_constraints tc
          JOIN information_schema.key_column_usage kcu 
            ON tc.constraint_name = kcu.constraint_name
          WHERE tc.table_name = 'user_products'
          AND tc.constraint_type IN ('PRIMARY KEY', 'UNIQUE');
        `
      });
    
    if (constraintError) {
      console.log('⚠️  Could not check constraints:', constraintError.message);
    } else {
      console.log('   Constraints found:', constraints);
    }

    // Fix the function with proper upsert
    console.log('\n2️⃣ Updating complete_invitation_after_auth function...');
    
    const { error: updateError } = await supabase
      .rpc('exec_sql', {
        query: `
          CREATE OR REPLACE FUNCTION complete_invitation_after_auth(
            invitation_code_param TEXT,
            user_id_param UUID
          )
          RETURNS JSONB
          LANGUAGE plpgsql
          SECURITY DEFINER
          AS $func$
          DECLARE
            invitation_record RECORD;
            guard_invitation_record RECORD;
            product_name_var TEXT;
          BEGIN
            -- Check product_invitations
            SELECT * INTO invitation_record
            FROM product_invitations
            WHERE invitation_code = invitation_code_param
              AND status = 'pending'
              AND expires_at > NOW();

            IF FOUND THEN
              -- Grant access to each product
              FOREACH product_name_var IN ARRAY invitation_record.products
              LOOP
                INSERT INTO user_products (user_id, product_id, granted_by, granted_at, is_active)
                VALUES (user_id_param, product_name_var, invitation_record.created_by, NOW(), true)
                ON CONFLICT (user_id, product_id) DO UPDATE SET
                  granted_by = EXCLUDED.granted_by,
                  granted_at = NOW(),
                  is_active = true;
              END LOOP;

              -- Mark invitation as accepted
              UPDATE product_invitations
              SET status = 'accepted', accepted_at = NOW(), accepted_by = user_id_param
              WHERE id = invitation_record.id;

              RETURN jsonb_build_object(
                'success', true,
                'products', invitation_record.products,
                'message', 'Products granted successfully'
              );
            END IF;

            -- Check guard invitations
            SELECT * INTO guard_invitation_record
            FROM security_guard_invitations
            WHERE invitation_code = invitation_code_param
              AND status = 'pending'
              AND expires_at > NOW();

            IF FOUND THEN
              -- Grant guard access
              INSERT INTO user_products (user_id, product_id, granted_by, granted_at, is_active)
              VALUES (user_id_param, 'guard-management', guard_invitation_record.invited_by, NOW(), true)
              ON CONFLICT (user_id, product_id) DO UPDATE SET
                granted_by = EXCLUDED.granted_by,
                granted_at = NOW(),
                is_active = true;

              -- Mark invitation as accepted
              UPDATE security_guard_invitations
              SET status = 'accepted', accepted_at = NOW(), accepted_by = user_id_param
              WHERE id = guard_invitation_record.id;

              RETURN jsonb_build_object(
                'success', true,
                'products', ARRAY['guard-management'],
                'message', 'Guard access granted successfully'
              );
            END IF;

            RETURN jsonb_build_object('success', false, 'error', 'Invitation not found or expired');
          END;
          $func$;
          
          -- Grant permissions
          GRANT EXECUTE ON FUNCTION complete_invitation_after_auth(TEXT, UUID) TO anon;
          GRANT EXECUTE ON FUNCTION complete_invitation_after_auth(TEXT, UUID) TO authenticated;
        `
      });

    if (updateError) {
      console.log('❌ Function update failed:', updateError.message);
    } else {
      console.log('✅ Function updated successfully');
      
      // Test the fixed function
      console.log('\n3️⃣ Testing fixed function...');
      const { data: testResult, error: testError } = await supabase
        .rpc('complete_invitation_after_auth', {
          invitation_code_param: 'GRD-H8I2KU',
          user_id_param: '123e4567-e89b-12d3-a456-426614174000'
        });
      
      if (testError) {
        console.log('❌ Function test failed:', testError.message);
      } else {
        console.log('✅ Function test successful:', testResult);
      }
    }
    
  } catch (error) {
    console.error('❌ Fix failed:', error);
  }
  
  console.log('\n🏁 Constraint fix completed!');
}

fixConstraintError();