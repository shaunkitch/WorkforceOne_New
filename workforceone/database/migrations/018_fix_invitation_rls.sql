-- Migration 018: Fix Company Invitation RLS Policies
-- Fix RLS policies that reference auth.users table which frontend can't access

-- Drop existing policies
DROP POLICY IF EXISTS "Organization members can view their invitations" ON company_invitations;
DROP POLICY IF EXISTS "Admins and managers can manage invitations" ON company_invitations;

-- Create new RLS policies that don't reference auth.users
CREATE POLICY "Organization members can view org invitations" ON company_invitations
  FOR SELECT USING (
    organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Users can view their email invitations" ON company_invitations
  FOR SELECT USING (
    email = (SELECT email FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Admins and managers can insert invitations" ON company_invitations
  FOR INSERT WITH CHECK (
    organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid()) AND
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'manager')
  );

CREATE POLICY "Admins and managers can update invitations" ON company_invitations
  FOR UPDATE USING (
    organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid()) AND
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'manager')
  );

CREATE POLICY "Admins and managers can delete invitations" ON company_invitations
  FOR DELETE USING (
    organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid()) AND
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'manager')
  );

-- Fix the invitation checking function to not depend on auth.users
CREATE OR REPLACE FUNCTION check_existing_invitation(
  p_email VARCHAR(255),
  p_organization_id UUID
) RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM company_invitations 
    WHERE email = p_email 
    AND organization_id = p_organization_id 
    AND status = 'pending'
    AND expires_at > NOW()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permission to use this function
GRANT EXECUTE ON FUNCTION check_existing_invitation TO authenticated;