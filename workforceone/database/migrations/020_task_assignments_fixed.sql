-- Migration 020: Task Assignments (Fixed)
-- Create task_assignments table for team-based task assignments
-- This version handles existing tables and policies gracefully

-- Create enum for task assignment status first
DO $$ BEGIN
    CREATE TYPE task_assignment_status AS ENUM ('assigned', 'accepted', 'declined', 'completed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- task_assignments table for assigning tasks to individual users (from teams or direct assignment)
CREATE TABLE IF NOT EXISTS task_assignments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id uuid REFERENCES tasks(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  assigned_at timestamp with time zone DEFAULT now() NOT NULL,
  assigned_by uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  status task_assignment_status DEFAULT 'assigned',
  completed_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Add unique constraint if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'task_assignments_task_id_user_id_key'
    ) THEN
        ALTER TABLE task_assignments 
        ADD CONSTRAINT task_assignments_task_id_user_id_key UNIQUE (task_id, user_id);
    END IF;
END $$;

-- Add any missing columns to task_assignments table
ALTER TABLE task_assignments ADD COLUMN IF NOT EXISTS task_id uuid REFERENCES tasks(id) ON DELETE CASCADE;
ALTER TABLE task_assignments ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE task_assignments ADD COLUMN IF NOT EXISTS assigned_at timestamp with time zone DEFAULT now();
ALTER TABLE task_assignments ADD COLUMN IF NOT EXISTS assigned_by uuid REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE task_assignments ADD COLUMN IF NOT EXISTS completed_at timestamp with time zone;
ALTER TABLE task_assignments ADD COLUMN IF NOT EXISTS created_at timestamp with time zone DEFAULT now();
ALTER TABLE task_assignments ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();

-- Handle status column with enum type
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'task_assignments' AND column_name = 'status'
    ) THEN
        ALTER TABLE task_assignments ADD COLUMN status task_assignment_status DEFAULT 'assigned';
    END IF;
END $$;

-- Enable RLS for task_assignments
ALTER TABLE task_assignments ENABLE ROW LEVEL SECURITY;

-- Only create policies if they don't exist
DO $$ 
BEGIN
    -- Check and create "Users can view their task assignments" policy
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'task_assignments' 
        AND policyname = 'Users can view their task assignments'
    ) THEN
        CREATE POLICY "Users can view their task assignments" ON task_assignments
          FOR SELECT USING (
            auth.uid() = user_id OR 
            auth.uid() = assigned_by OR
            auth.uid() IN (
              SELECT t.reporter_id 
              FROM tasks t 
              WHERE t.id = task_id
            )
          );
    END IF;

    -- Check and create "Organization members can view task assignments" policy
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'task_assignments' 
        AND policyname = 'Organization members can view task assignments'
    ) THEN
        CREATE POLICY "Organization members can view task assignments" ON task_assignments
          FOR SELECT USING (
            (SELECT organization_id FROM profiles WHERE id = auth.uid()) = 
            (SELECT organization_id FROM profiles WHERE id = user_id)
          );
    END IF;
END $$;

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_task_assignments_task_id ON task_assignments(task_id);
CREATE INDEX IF NOT EXISTS idx_task_assignments_user_id ON task_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_task_assignments_assigned_by ON task_assignments(assigned_by);

-- Add comments
COMMENT ON TABLE task_assignments IS 'Tracks individual user assignments for tasks, supporting both direct assignments and team-based assignments';
COMMENT ON COLUMN task_assignments.status IS 'Status of the assignment: assigned (default), accepted, declined, completed';

-- Note: Not creating "Task assigners and managers can manage assignments" policy since it already exists