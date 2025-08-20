-- Security Guard Invitations Table
-- This table stores invitation codes for security guards

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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_security_guard_invitations_code ON security_guard_invitations(invitation_code);
CREATE INDEX IF NOT EXISTS idx_security_guard_invitations_email ON security_guard_invitations(email);
CREATE INDEX IF NOT EXISTS idx_security_guard_invitations_org ON security_guard_invitations(organization_id);
CREATE INDEX IF NOT EXISTS idx_security_guard_invitations_status ON security_guard_invitations(status);

-- Enable RLS
ALTER TABLE security_guard_invitations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Allow anonymous users to read invitations by code (for validation during signup)
CREATE POLICY "security_guard_invitations_anon_select_by_code" ON security_guard_invitations
    FOR SELECT TO anon 
    USING (status = 'pending' AND expires_at > NOW());

-- Allow authenticated users in the same organization to create invitations
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

-- Allow authenticated users in the same organization to read invitations
CREATE POLICY "security_guard_invitations_auth_select" ON security_guard_invitations
    FOR SELECT TO authenticated
    USING (
        organization_id IN (
            SELECT p.organization_id 
            FROM profiles p 
            WHERE p.id = auth.uid()
        )
    );

-- Allow authenticated users to update invitations they created or are accepting
CREATE POLICY "security_guard_invitations_auth_update" ON security_guard_invitations
    FOR UPDATE TO authenticated
    USING (
        invited_by = auth.uid() OR 
        (status = 'pending' AND expires_at > NOW())
    )
    WITH CHECK (
        invited_by = auth.uid() OR 
        (status = 'pending' AND expires_at > NOW())
    );

-- Grant permissions
GRANT SELECT ON security_guard_invitations TO anon;
GRANT SELECT, INSERT, UPDATE ON security_guard_invitations TO authenticated;

-- Function to automatically expire old invitations
CREATE OR REPLACE FUNCTION expire_old_security_guard_invitations()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE security_guard_invitations 
    SET status = 'expired', updated_at = NOW()
    WHERE status = 'pending' AND expires_at <= NOW();
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to expire old invitations
DROP TRIGGER IF EXISTS expire_security_guard_invitations_trigger ON security_guard_invitations;
CREATE TRIGGER expire_security_guard_invitations_trigger
    AFTER INSERT OR UPDATE ON security_guard_invitations
    EXECUTE FUNCTION expire_old_security_guard_invitations();

-- Function to accept security guard invitation
CREATE OR REPLACE FUNCTION accept_security_guard_invitation(
    p_invitation_code TEXT,
    p_user_id UUID,
    p_full_name TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    invitation_record RECORD;
    organization_record RECORD;
BEGIN
    -- Find the invitation
    SELECT * INTO invitation_record
    FROM security_guard_invitations
    WHERE invitation_code = p_invitation_code
      AND status = 'pending'
      AND expires_at > NOW();

    -- Check if invitation exists
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Invalid or expired invitation code';
    END IF;

    -- Get organization details
    SELECT * INTO organization_record
    FROM organizations
    WHERE id = invitation_record.organization_id;

    -- Create the user profile
    INSERT INTO profiles (
        id,
        email,
        full_name,
        organization_id,
        role,
        status,
        work_type,
        job_title,
        created_at,
        updated_at
    ) VALUES (
        p_user_id,
        invitation_record.email,
        p_full_name,
        invitation_record.organization_id,
        'employee',
        'active',
        'security',
        'Security Guard',
        NOW(),
        NOW()
    );

    -- Mark invitation as accepted
    UPDATE security_guard_invitations
    SET status = 'accepted',
        accepted_at = NOW(),
        accepted_by = p_user_id,
        updated_at = NOW()
    WHERE id = invitation_record.id;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Success message
SELECT 'Security guard invitations table and functions created successfully!' as status;