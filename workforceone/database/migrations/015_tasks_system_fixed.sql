-- Migration 015: Tasks System (Fixed)
-- Create tasks table and related tables
-- This version handles existing tables gracefully

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
  due_date timestamp with time zone,
  estimated_hours numeric,
  actual_hours numeric DEFAULT 0,
  completed_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Add missing columns to tasks table (including outlet_id)
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS title character varying;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS assignee_id uuid REFERENCES profiles(id) ON DELETE SET NULL;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS reporter_id uuid REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS project_id uuid REFERENCES projects(id) ON DELETE CASCADE;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS outlet_id uuid REFERENCES outlets(id) ON DELETE SET NULL;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS due_date timestamp with time zone;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS estimated_hours numeric;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS actual_hours numeric DEFAULT 0;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS completed_at timestamp with time zone;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS created_at timestamp with time zone DEFAULT now();
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();

-- Handle status column with enum type
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tasks' AND column_name = 'status'
    ) THEN
        ALTER TABLE tasks ADD COLUMN status task_status DEFAULT 'todo' NOT NULL;
    END IF;
END $$;

-- Handle priority column with enum type
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tasks' AND column_name = 'priority'
    ) THEN
        ALTER TABLE tasks ADD COLUMN priority task_priority DEFAULT 'medium' NOT NULL;
    END IF;
END $$;

-- task_comments table
CREATE TABLE IF NOT EXISTS task_comments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id uuid REFERENCES tasks(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Add missing columns to task_comments
ALTER TABLE task_comments ADD COLUMN IF NOT EXISTS task_id uuid REFERENCES tasks(id) ON DELETE CASCADE;
ALTER TABLE task_comments ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE task_comments ADD COLUMN IF NOT EXISTS content text;
ALTER TABLE task_comments ADD COLUMN IF NOT EXISTS created_at timestamp with time zone DEFAULT now();
ALTER TABLE task_comments ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();

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

-- Add missing columns to task_attachments
ALTER TABLE task_attachments ADD COLUMN IF NOT EXISTS task_id uuid REFERENCES tasks(id) ON DELETE CASCADE;
ALTER TABLE task_attachments ADD COLUMN IF NOT EXISTS filename character varying;
ALTER TABLE task_attachments ADD COLUMN IF NOT EXISTS file_url character varying;
ALTER TABLE task_attachments ADD COLUMN IF NOT EXISTS file_size bigint;
ALTER TABLE task_attachments ADD COLUMN IF NOT EXISTS uploaded_by uuid REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE task_attachments ADD COLUMN IF NOT EXISTS created_at timestamp with time zone DEFAULT now();

-- Enable RLS for all task tables
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_attachments ENABLE ROW LEVEL SECURITY;

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
COMMENT ON COLUMN tasks.outlet_id IS 'Reference to outlet where task is assigned';

-- Note: Not creating/modifying policies since they likely already exist