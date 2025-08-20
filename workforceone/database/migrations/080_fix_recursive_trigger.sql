-- =============================================
-- FIX RECURSIVE TRIGGER ISSUE
-- Fixes the infinite recursion in security_guard_invitations trigger
-- =============================================

-- Drop the problematic trigger that causes infinite recursion
DROP TRIGGER IF EXISTS expire_security_guard_invitations_trigger ON security_guard_invitations;

-- Recreate the function with proper logic to prevent recursion
CREATE OR REPLACE FUNCTION expire_old_security_guard_invitations()
RETURNS TRIGGER AS $$
BEGIN
    -- Only expire invitations if we're not already updating the status to expired
    -- This prevents infinite recursion
    IF (TG_OP = 'UPDATE' AND OLD.status = 'expired' AND NEW.status = 'expired') THEN
        RETURN NEW;
    END IF;
    
    -- Only expire invitations on INSERT or when updating non-expired records
    IF (TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND OLD.status != 'expired')) THEN
        UPDATE security_guard_invitations 
        SET status = 'expired', updated_at = NOW()
        WHERE status = 'pending' 
        AND expires_at <= NOW()
        AND id != COALESCE(NEW.id, OLD.id); -- Don't update the current record being processed
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger with better logic
CREATE TRIGGER expire_security_guard_invitations_trigger
    AFTER INSERT OR UPDATE ON security_guard_invitations
    FOR EACH ROW
    EXECUTE FUNCTION expire_old_security_guard_invitations();

-- Alternative: Create a simpler scheduled function instead of a trigger
-- This is safer and avoids recursion issues entirely
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

-- Grant execute permission
GRANT EXECUTE ON FUNCTION cleanup_expired_security_guard_invitations() TO authenticated;

-- Success message
SELECT 'Recursive trigger fixed successfully!' as status;