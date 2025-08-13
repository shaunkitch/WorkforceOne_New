-- Migration 015: Tasks System
-- Create tasks table and related tables

-- Create enum types first
DO $$ BEGIN
    CREATE TYPE task_status AS ENUM ('todo', 'in_progress', 'review', 'completed', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE task_priority AS ENUM ('low', 'medium', 'high', 'critical');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title character varying NOT NULL,
  description text,
  status task_status DEFAULT 'todo' NOT NULL,
  priority task_priority DEFAULT 'medium' NOT NULL,
  assignee_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  reporter_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  outlet_id uuid REFERENCES outlets(id) ON DELETE SET NULL,
  due_date timestamp with time zone,
  estimated_hours numeric,
  actual_hours numeric DEFAULT 0,
  completed_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- task_comments table
CREATE TABLE IF NOT EXISTS task_comments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id uuid REFERENCES tasks(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- task_attachments table
CREATE TABLE IF NOT EXISTS task_attachments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id uuid REFERENCES tasks(id) ON DELETE CASCADE NOT NULL,
  filename character varying NOT NULL,
  file_url character varying NOT NULL,
  file_size bigint,
  uploaded_by uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- RLS policies for tasks
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Organization members can view tasks" ON tasks;
DROP POLICY IF EXISTS "Users can create tasks" ON tasks;
DROP POLICY IF EXISTS "Task assignees and reporters can update tasks" ON tasks;
DROP POLICY IF EXISTS "Admins and managers can manage tasks" ON tasks;

-- Create RLS policies for tasks
CREATE POLICY "Organization members can view tasks" ON tasks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles p1 
      WHERE p1.id = auth.uid() 
      AND p1.organization_id IN (
        SELECT p2.organization_id FROM profiles p2 
        WHERE p2.id = reporter_id OR p2.id = assignee_id
      )
    )
  );

CREATE POLICY "Users can create tasks" ON tasks
  FOR INSERT WITH CHECK (
    reporter_id = auth.uid() AND
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Task assignees and reporters can update tasks" ON tasks
  FOR UPDATE USING (
    auth.uid() = reporter_id OR 
    auth.uid() = assignee_id OR
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'manager')
  );

CREATE POLICY "Admins and managers can manage tasks" ON tasks
  FOR ALL USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'manager')
  );

-- RLS policies for task_comments
ALTER TABLE task_comments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Organization members can view task comments" ON task_comments;
DROP POLICY IF EXISTS "Users can create comments" ON task_comments;
DROP POLICY IF EXISTS "Comment authors can manage their comments" ON task_comments;

-- Create RLS policies for task_comments
CREATE POLICY "Organization members can view task comments" ON task_comments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM tasks t
      JOIN profiles p1 ON p1.id = auth.uid()
      JOIN profiles p2 ON (p2.id = t.reporter_id OR p2.id = t.assignee_id)
      WHERE t.id = task_id 
      AND p1.organization_id = p2.organization_id
    )
  );

CREATE POLICY "Users can create comments" ON task_comments
  FOR INSERT WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM tasks t
      JOIN profiles p1 ON p1.id = auth.uid()
      JOIN profiles p2 ON (p2.id = t.reporter_id OR p2.id = t.assignee_id)
      WHERE t.id = task_id 
      AND p1.organization_id = p2.organization_id
    )
  );

CREATE POLICY "Comment authors can manage their comments" ON task_comments
  FOR ALL USING (
    user_id = auth.uid() OR
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'manager')
  );

-- RLS policies for task_attachments
ALTER TABLE task_attachments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Organization members can view task attachments" ON task_attachments;
DROP POLICY IF EXISTS "Users can create attachments" ON task_attachments;
DROP POLICY IF EXISTS "Attachment uploaders can manage their attachments" ON task_attachments;

-- Create RLS policies for task_attachments
CREATE POLICY "Organization members can view task attachments" ON task_attachments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM tasks t
      JOIN profiles p1 ON p1.id = auth.uid()
      JOIN profiles p2 ON (p2.id = t.reporter_id OR p2.id = t.assignee_id)
      WHERE t.id = task_id 
      AND p1.organization_id = p2.organization_id
    )
  );

CREATE POLICY "Users can create attachments" ON task_attachments
  FOR INSERT WITH CHECK (
    uploaded_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM tasks t
      JOIN profiles p1 ON p1.id = auth.uid()
      JOIN profiles p2 ON (p2.id = t.reporter_id OR p2.id = t.assignee_id)
      WHERE t.id = task_id 
      AND p1.organization_id = p2.organization_id
    )
  );

CREATE POLICY "Attachment uploaders can manage their attachments" ON task_attachments
  FOR ALL USING (
    uploaded_by = auth.uid() OR
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'manager')
  );

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_tasks_assignee_id ON tasks(assignee_id);
CREATE INDEX IF NOT EXISTS idx_tasks_reporter_id ON tasks(reporter_id);
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_outlet_id ON tasks(outlet_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);

CREATE INDEX IF NOT EXISTS idx_task_comments_task_id ON task_comments(task_id);
CREATE INDEX IF NOT EXISTS idx_task_comments_user_id ON task_comments(user_id);

CREATE INDEX IF NOT EXISTS idx_task_attachments_task_id ON task_attachments(task_id);
CREATE INDEX IF NOT EXISTS idx_task_attachments_uploaded_by ON task_attachments(uploaded_by);

-- Add comments
COMMENT ON TABLE tasks IS 'Main tasks table for task management system';
COMMENT ON TABLE task_comments IS 'Comments on tasks';
COMMENT ON TABLE task_attachments IS 'File attachments for tasks';

COMMENT ON COLUMN tasks.status IS 'Status of the task: todo, in_progress, review, completed, cancelled';
COMMENT ON COLUMN tasks.priority IS 'Priority level: low, medium, high, critical';