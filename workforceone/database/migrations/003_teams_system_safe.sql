-- Migration 003: Teams System (Safe)
-- Create teams table and team management
-- This version handles existing tables gracefully

-- teams table
CREATE TABLE IF NOT EXISTS teams (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  name character varying NOT NULL,
  description text,
  team_lead_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  department character varying,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Add unique constraint if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'teams_organization_id_name_key'
    ) THEN
        ALTER TABLE teams 
        ADD CONSTRAINT teams_organization_id_name_key UNIQUE (organization_id, name);
    END IF;
END $$;

-- Add any missing columns to teams table
ALTER TABLE teams ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE teams ADD COLUMN IF NOT EXISTS name character varying;
ALTER TABLE teams ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE teams ADD COLUMN IF NOT EXISTS team_lead_id uuid REFERENCES profiles(id) ON DELETE SET NULL;
ALTER TABLE teams ADD COLUMN IF NOT EXISTS department character varying;
ALTER TABLE teams ADD COLUMN IF NOT EXISTS created_at timestamp with time zone DEFAULT now();
ALTER TABLE teams ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();

-- team_members table (many-to-many relationship)
CREATE TABLE IF NOT EXISTS team_members (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id uuid REFERENCES teams(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  role character varying DEFAULT 'member',
  joined_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Add unique constraint if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'team_members_team_id_user_id_key'
    ) THEN
        ALTER TABLE team_members 
        ADD CONSTRAINT team_members_team_id_user_id_key UNIQUE (team_id, user_id);
    END IF;
END $$;

-- Add any missing columns to team_members table
ALTER TABLE team_members ADD COLUMN IF NOT EXISTS team_id uuid REFERENCES teams(id) ON DELETE CASCADE;
ALTER TABLE team_members ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE team_members ADD COLUMN IF NOT EXISTS role character varying DEFAULT 'member';
ALTER TABLE team_members ADD COLUMN IF NOT EXISTS joined_at timestamp with time zone DEFAULT now();

-- Enable RLS for teams
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;

-- Enable RLS for team_members
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

-- Create indexes for performance (IF NOT EXISTS handles existing ones)
CREATE INDEX IF NOT EXISTS idx_teams_organization_id ON teams(organization_id);
CREATE INDEX IF NOT EXISTS idx_teams_team_lead_id ON teams(team_lead_id);
CREATE INDEX IF NOT EXISTS idx_teams_name ON teams(name);

CREATE INDEX IF NOT EXISTS idx_team_members_team_id ON team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON team_members(user_id);

-- Add comments
COMMENT ON TABLE teams IS 'Teams within organizations';
COMMENT ON TABLE team_members IS 'Many-to-many relationship between teams and users';
COMMENT ON COLUMN team_members.role IS 'Role within the team (member, lead, etc.)';

-- Note: Not creating/modifying policies since they might already exist