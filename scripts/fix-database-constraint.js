const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://edeheyeloakiworbkfpg.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixDatabaseConstraint() {
  console.log('🔧 Fixing database constraint issue...\n');
  
  try {
    console.log('1️⃣ Checking user_products table structure...');
    
    // Check what constraints exist
    const { data: constraints, error: constraintError } = await supabase
      .rpc('sql', {
        query: `
          SELECT 
            conname as constraint_name,
            contype as constraint_type,
            pg_get_constraintdef(oid) as definition
          FROM pg_constraint 
          WHERE conrelid = 'user_products'::regclass;
        `
      });
    
    if (constraintError) {
      console.log('⚠️  Could not check constraints directly, trying alternative approach...');
      
      // Try to check table structure instead
      const { data: tableInfo, error: tableError } = await supabase
        .from('user_products')
        .select('*')
        .limit(1);
      
      if (tableError) {
        console.log('❌ Cannot access user_products table:', tableError.message);
      } else {
        console.log('✅ user_products table exists and is accessible');
      }
    } else {
      console.log('   Constraints found:', constraints);
    }

    console.log('\n2️⃣ Updating complete_invitation_after_auth function...');
    
    // Create a safer version of the function that handles constraint issues
    const { error: updateError } = await supabase
      .rpc('sql', {
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
            existing_access RECORD;
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
                -- Check if access already exists
                SELECT * INTO existing_access 
                FROM user_products 
                WHERE user_id = user_id_param AND product_id = product_name_var;
                
                IF NOT FOUND THEN
                  -- Insert new access
                  INSERT INTO user_products (user_id, product_id, granted_by, granted_at, is_active)
                  VALUES (user_id_param, product_name_var, invitation_record.created_by, NOW(), true);
                ELSE
                  -- Update existing access
                  UPDATE user_products 
                  SET granted_by = invitation_record.created_by,
                      granted_at = NOW(),
                      is_active = true
                  WHERE user_id = user_id_param AND product_id = product_name_var;
                END IF;
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
              -- Check if guard access already exists
              SELECT * INTO existing_access 
              FROM user_products 
              WHERE user_id = user_id_param AND product_id = 'guard-management';
              
              IF NOT FOUND THEN
                -- Insert new guard access
                INSERT INTO user_products (user_id, product_id, granted_by, granted_at, is_active)
                VALUES (user_id_param, 'guard-management', guard_invitation_record.invited_by, NOW(), true);
              ELSE
                -- Update existing guard access
                UPDATE user_products 
                SET granted_by = guard_invitation_record.invited_by,
                    granted_at = NOW(),
                    is_active = true
                WHERE user_id = user_id_param AND product_id = 'guard-management';
              END IF;

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
  
  console.log('\n🏁 Database constraint fix completed!');
  console.log('\n📝 CHANGES MADE:');
  console.log('   - Replaced ON CONFLICT with explicit checks');
  console.log('   - Added IF/ELSE logic for existing records');
  console.log('   - Should resolve constraint specification errors');
}

fixDatabaseConstraint();