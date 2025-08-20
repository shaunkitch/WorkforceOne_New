-- Migration 003: Teams System
-- Create teams table and team management

-- teams table
CREATE TABLE IF NOT EXISTS teams (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  name character varying NOT NULL,
  description text,
  team_lead_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  department character varying,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  UNIQUE(organization_id, name)
);

-- team_members table (many-to-many relationship)
CREATE TABLE IF NOT EXISTS team_members (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id uuid REFERENCES teams(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  role character varying DEFAULT 'member',
  joined_at timestamp with time zone DEFAULT now() NOT NULL,
  UNIQUE(team_id, user_id)
);

-- RLS policies for teams
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Organization members can view teams" ON teams;
DROP POLICY IF EXISTS "Managers can create teams" ON teams;
DROP POLICY IF EXISTS "Team leads and admins can update teams" ON teams;
DROP POLICY IF EXISTS "Admins can delete teams" ON teams;

-- Create RLS policies for teams
CREATE POLICY "Organization members can view teams" ON teams
  FOR SELECT USING (
    organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Managers can create teams" ON teams
  FOR INSERT WITH CHECK (
    organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid()) AND
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'manager')
  );

CREATE POLICY "Team leads and admins can update teams" ON teams
  FOR UPDATE USING (
    organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid()) AND
    (
      team_lead_id = auth.uid() OR
      (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'manager')
    )
  );

CREATE POLICY "Admins can delete teams" ON teams
  FOR DELETE USING (
    organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid()) AND
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

-- RLS policies for team_members
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Organization members can view team memberships" ON team_members;
DROP POLICY IF EXISTS "Team leads and admins can manage memberships" ON team_members;

-- Create RLS policies for team_members
CREATE POLICY "Organization members can view team memberships" ON team_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM teams t
      JOIN profiles p ON p.id = auth.uid()
      WHERE t.id = team_id 
      AND t.organization_id = p.organization_id
    )
  );

CREATE POLICY "Team leads and admins can manage memberships" ON team_members
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM teams t
      JOIN profiles p ON p.id = auth.uid()
      WHERE t.id = team_id 
      AND t.organization_id = p.organization_id
      AND (
        t.team_lead_id = auth.uid() OR
        p.role IN ('admin', 'manager')
      )
    )
  );

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_teams_organization_id ON teams(organization_id);
CREATE INDEX IF NOT EXISTS idx_teams_team_lead_id ON teams(team_lead_id);
CREATE INDEX IF NOT EXISTS idx_teams_name ON teams(name);

CREATE INDEX IF NOT EXISTS idx_team_members_team_id ON team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON team_members(user_id);

-- Add comments
COMMENT ON TABLE teams IS 'Teams within organizations';
COMMENT ON TABLE team_members IS 'Many-to-many relationship between teams and users';
COMMENT ON COLUMN team_members.role IS 'Role within the team (member, lead, etc.)';