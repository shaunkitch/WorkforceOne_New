#!/usr/bin/env node

// Fix the recursive trigger issue in security_guard_invitations
const fs = require('fs');
const path = require('path');

const fixSQL = `
-- =============================================
-- EMERGENCY FIX FOR RECURSIVE TRIGGER
-- Run this immediately to stop the infinite recursion
-- =============================================

-- Drop the problematic trigger immediately
DROP TRIGGER IF EXISTS expire_security_guard_invitations_trigger ON security_guard_invitations;

-- Drop the problematic function
DROP FUNCTION IF EXISTS expire_old_security_guard_invitations();

-- Create a safer, non-recursive function
CREATE OR REPLACE FUNCTION cleanup_expired_security_guard_invitations()
RETURNS INTEGER AS $$
DECLARE
    expired_count INTEGER;
BEGIN
    UPDATE security_guard_invitations 
    SET status = 'expired', updated_at = NOW()
    WHERE status = 'pending' AND expires_at <= NOW();
    
    GET DIAGNOSTICS expired_count = ROW_COUNT;
    RETURN expired_count;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT EXECUTE ON FUNCTION cleanup_expired_security_guard_invitations() TO authenticated;

-- Success message
SELECT 'Emergency fix applied - recursive trigger disabled!' as message;
`;

console.log('🚨 EMERGENCY FIX FOR RECURSIVE TRIGGER:');
console.log('=====================================');
console.log();
console.log('The database is experiencing infinite recursion due to a trigger on security_guard_invitations.');
console.log('Run this SQL immediately in your database to fix it:');
console.log();
console.log(fixSQL);
console.log();
console.log('After running this, you can safely proceed with the product migrations.');
console.log();
console.log('Alternative: If you have Supabase dashboard access, run this in the SQL editor.');