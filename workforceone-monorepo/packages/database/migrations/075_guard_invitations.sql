-- Migration: Guard Invitations System
-- Description: Create system for inviting security guards with invitation codes

-- Create guard_invitations table
CREATE TABLE IF NOT EXISTS guard_invitations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email TEXT NOT NULL,
    invitation_code TEXT NOT NULL UNIQUE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    invited_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    invited_by_name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'revoked')),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    accepted_at TIMESTAMP WITH TIME ZONE,
    accepted_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_guard_invitations_email ON guard_invitations(email);
CREATE INDEX IF NOT EXISTS idx_guard_invitations_code ON guard_invitations(invitation_code);
CREATE INDEX IF NOT EXISTS idx_guard_invitations_organization ON guard_invitations(organization_id);
CREATE INDEX IF NOT EXISTS idx_guard_invitations_status ON guard_invitations(status);
CREATE INDEX IF NOT EXISTS idx_guard_invitations_expires_at ON guard_invitations(expires_at);

-- Create unique constraint on email + organization for pending invitations
CREATE UNIQUE INDEX IF NOT EXISTS idx_guard_invitations_pending_email_org 
ON guard_invitations(email, organization_id) 
WHERE status = 'pending';

-- Add RLS policy
ALTER TABLE guard_invitations ENABLE ROW LEVEL SECURITY;

-- Policy: Organizations can manage their own invitations
CREATE POLICY guard_invitations_org_access ON guard_invitations
    FOR ALL USING (
        organization_id IN (
            SELECT profiles.organization_id 
            FROM profiles 
            WHERE profiles.id = auth.uid()
        )
    );

-- Function to automatically expire invitations
CREATE OR REPLACE FUNCTION expire_old_guard_invitations()
RETURNS void AS $$
BEGIN
    UPDATE guard_invitations 
    SET status = 'expired', updated_at = NOW()
    WHERE status = 'pending' 
    AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_guard_invitations_updated_at()
RETURNS trigger AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_guard_invitations_updated_at
    BEFORE UPDATE ON guard_invitations
    FOR EACH ROW
    EXECUTE FUNCTION update_guard_invitations_updated_at();