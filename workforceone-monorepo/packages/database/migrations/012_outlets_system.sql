-- Migration 012: Outlets System
-- Create outlets table and related tables if they don't exist

-- outlets table
CREATE TABLE IF NOT EXISTS outlets (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  name character varying NOT NULL,
  address character varying,
  latitude numeric,
  longitude numeric,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Join table for outlets and users
CREATE TABLE IF NOT EXISTS outlet_users (
  outlet_id uuid REFERENCES outlets(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  PRIMARY KEY (outlet_id, user_id)
);

-- Join table for outlets and teams
CREATE TABLE IF NOT EXISTS outlet_teams (
  outlet_id uuid REFERENCES outlets(id) ON DELETE CASCADE NOT NULL,
  team_id uuid REFERENCES teams(id) ON DELETE CASCADE NOT NULL,
  PRIMARY KEY (outlet_id, team_id)
);

-- RLS policies for outlets
ALTER TABLE outlets ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Organizations can view their own outlets" ON outlets;
DROP POLICY IF EXISTS "Users can insert outlets for their organization" ON outlets;
DROP POLICY IF EXISTS "Users can update their organization's outlets" ON outlets;
DROP POLICY IF EXISTS "Users can delete their organization's outlets" ON outlets;

-- Create RLS policies for outlets
CREATE POLICY "Organizations can view their own outlets" ON outlets
  FOR SELECT USING (organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can insert outlets for their organization" ON outlets
  FOR INSERT WITH CHECK (organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can update their organization's outlets" ON outlets
  FOR UPDATE USING (organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Users can delete their organization's outlets" ON outlets
  FOR DELETE USING (organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid()));

-- RLS policies for outlet_users
ALTER TABLE outlet_users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own outlet assignments" ON outlet_users;
DROP POLICY IF EXISTS "Organization members can view outlet assignments" ON outlet_users;
DROP POLICY IF EXISTS "Organization admins can manage outlet assignments" ON outlet_users;

-- Create RLS policies for outlet_users
CREATE POLICY "Users can view their own outlet assignments" ON outlet_users
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Organization members can view outlet assignments" ON outlet_users
  FOR SELECT USING ((SELECT organization_id FROM profiles WHERE id = auth.uid()) = (SELECT organization_id FROM outlets WHERE id = outlet_id));

CREATE POLICY "Organization admins can manage outlet assignments" ON outlet_users
  FOR ALL USING (((SELECT organization_id FROM profiles WHERE id = auth.uid()) = (SELECT organization_id FROM outlets WHERE id = outlet_id)) AND ((SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'manager')));

-- RLS policies for outlet_teams
ALTER TABLE outlet_teams ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Organization members can view outlet team assignments" ON outlet_teams;
DROP POLICY IF EXISTS "Organization admins can manage outlet team assignments" ON outlet_teams;

-- Create RLS policies for outlet_teams
CREATE POLICY "Organization members can view outlet team assignments" ON outlet_teams
  FOR SELECT USING ((SELECT organization_id FROM profiles WHERE id = auth.uid()) = (SELECT organization_id FROM outlets WHERE id = outlet_id));

CREATE POLICY "Organization admins can manage outlet team assignments" ON outlet_teams
  FOR ALL USING (((SELECT organization_id FROM profiles WHERE id = auth.uid()) = (SELECT organization_id FROM outlets WHERE id = outlet_id)) AND ((SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'manager')));