-- Migration 014: Projects System
-- Create projects table and related structures

-- Create enum types first
DO $$ BEGIN
    CREATE TYPE project_status AS ENUM ('planning', 'active', 'on_hold', 'completed', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE project_priority AS ENUM ('low', 'medium', 'high', 'critical');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- projects table
CREATE TABLE IF NOT EXISTS projects (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name character varying NOT NULL,
  description text,
  status project_status DEFAULT 'planning' NOT NULL,
  priority project_priority DEFAULT 'medium' NOT NULL,
  start_date date NOT NULL,
  end_date date,
  budget numeric,
  spent_budget numeric DEFAULT 0,
  progress integer DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  team_id uuid REFERENCES teams(id) ON DELETE SET NULL,
  project_manager_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- RLS policies for projects
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Organization members can view projects" ON projects;
DROP POLICY IF EXISTS "Users can create projects for their organization" ON projects;
DROP POLICY IF EXISTS "Project managers and admins can update projects" ON projects;
DROP POLICY IF EXISTS "Admins can delete projects" ON projects;

-- Create RLS policies for projects
CREATE POLICY "Organization members can view projects" ON projects
  FOR SELECT USING (
    organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Users can create projects for their organization" ON projects
  FOR INSERT WITH CHECK (
    organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid()) AND
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'manager')
  );

CREATE POLICY "Project managers and admins can update projects" ON projects
  FOR UPDATE USING (
    organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid()) AND
    (
      project_manager_id = auth.uid() OR
      (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'manager')
    )
  );

CREATE POLICY "Admins can delete projects" ON projects
  FOR DELETE USING (
    organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid()) AND
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_projects_organization_id ON projects(organization_id);
CREATE INDEX IF NOT EXISTS idx_projects_team_id ON projects(team_id);
CREATE INDEX IF NOT EXISTS idx_projects_project_manager_id ON projects(project_manager_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_priority ON projects(priority);
CREATE INDEX IF NOT EXISTS idx_projects_start_date ON projects(start_date);
CREATE INDEX IF NOT EXISTS idx_projects_end_date ON projects(end_date);

-- Add comments
COMMENT ON TABLE projects IS 'Main projects table for project management system';
COMMENT ON COLUMN projects.status IS 'Status of the project: planning, active, on_hold, completed, cancelled';
COMMENT ON COLUMN projects.priority IS 'Priority level: low, medium, high, critical';
COMMENT ON COLUMN projects.progress IS 'Progress percentage (0-100)';