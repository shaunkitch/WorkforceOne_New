-- Enhanced Team Role System Migration
-- Updates the role system to support Admin, Manager, Member hierarchy

-- 1. Update profiles table to ensure role column exists with proper constraints
ALTER TABLE public.profiles 
ALTER COLUMN role SET DEFAULT 'member';

-- Add check constraint for valid roles
ALTER TABLE public.profiles 
DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('admin', 'manager', 'member'));

-- 2. Update team_members table to align with new role system
ALTER TABLE public.team_members 
DROP CONSTRAINT IF EXISTS team_members_role_check;

ALTER TABLE public.team_members 
ADD CONSTRAINT team_members_role_check 
CHECK (role IN ('manager', 'member'));

-- Update existing 'lead' roles to 'manager' in team_members
UPDATE public.team_members 
SET role = 'manager' 
WHERE role = 'lead';

-- 3. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_team_members_role ON public.team_members(role);

-- 4. Update teams table to ensure proper manager assignment
-- Add constraint to ensure team_lead_id refers to a manager or admin
CREATE OR REPLACE FUNCTION check_team_lead_role()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.team_lead_id IS NOT NULL THEN
        IF NOT EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = NEW.team_lead_id 
            AND role IN ('admin', 'manager')
        ) THEN
            RAISE EXCEPTION 'Team lead must have admin or manager role';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS team_lead_role_check ON public.teams;

-- Create trigger to validate team lead role
CREATE TRIGGER team_lead_role_check
    BEFORE INSERT OR UPDATE ON public.teams
    FOR EACH ROW
    EXECUTE FUNCTION check_team_lead_role();

-- 5. Create function to automatically manage team leadership
CREATE OR REPLACE FUNCTION update_team_leadership()
RETURNS TRIGGER AS $$
BEGIN
    -- When a team member is promoted to manager, make them the team lead
    IF NEW.role = 'manager' AND OLD.role != 'manager' THEN
        UPDATE public.teams 
        SET team_lead_id = NEW.user_id 
        WHERE id = NEW.team_id;
    END IF;
    
    -- When a manager is demoted, remove them as team lead if they are the current lead
    IF NEW.role != 'manager' AND OLD.role = 'manager' THEN
        UPDATE public.teams 
        SET team_lead_id = NULL 
        WHERE id = NEW.team_id AND team_lead_id = NEW.user_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS team_leadership_update ON public.team_members;

-- Create trigger to manage team leadership
CREATE TRIGGER team_leadership_update
    AFTER UPDATE ON public.team_members
    FOR EACH ROW
    EXECUTE FUNCTION update_team_leadership();

-- 6. Add comments for documentation
COMMENT ON COLUMN public.profiles.role IS 'User role: admin (full access), manager (team lead), member (basic access)';
COMMENT ON COLUMN public.team_members.role IS 'Team role: manager (team lead), member (team member)';
COMMENT ON COLUMN public.teams.team_lead_id IS 'Manager responsible for this team (must have manager or admin role)';

-- 7. Create view for team permissions (optional, for easier querying)
CREATE OR REPLACE VIEW team_permissions AS
SELECT 
    t.id as team_id,
    t.name as team_name,
    t.team_lead_id,
    p.full_name as team_lead_name,
    p.role as team_lead_role,
    tm.user_id,
    tm.role as team_role,
    up.full_name as member_name,
    up.role as member_profile_role
FROM public.teams t
LEFT JOIN public.profiles p ON t.team_lead_id = p.id
LEFT JOIN public.team_members tm ON t.id = tm.team_id
LEFT JOIN public.profiles up ON tm.user_id = up.id;

-- Grant appropriate permissions
GRANT SELECT ON team_permissions TO authenticated;

-- 8. Sample data update (optional - updates existing data to new role system)
-- Update any existing 'employee' roles to 'member'
UPDATE public.profiles 
SET role = 'member' 
WHERE role NOT IN ('admin', 'manager', 'member');

-- Ensure at least one admin exists (first user becomes admin if no admins exist)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE role = 'admin') THEN
        UPDATE public.profiles 
        SET role = 'admin' 
        WHERE id = (
            SELECT id FROM public.profiles 
            ORDER BY created_at ASC 
            LIMIT 1
        );
    END IF;
END $$;