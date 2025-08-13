-- Migration 020: Task Assignments
-- Create task_assignments table for team-based task assignments

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
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  UNIQUE(task_id, user_id)
);

-- RLS policies for task_assignments
ALTER TABLE task_assignments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their task assignments" ON task_assignments;
DROP POLICY IF EXISTS "Organization members can view task assignments" ON task_assignments;
DROP POLICY IF EXISTS "Task assigners can manage assignments" ON task_assignments;

-- Create RLS policies for task_assignments
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

CREATE POLICY "Organization members can view task assignments" ON task_assignments
  FOR SELECT USING (
    (SELECT organization_id FROM profiles WHERE id = auth.uid()) = 
    (SELECT organization_id FROM profiles WHERE id = user_id)
  );

CREATE POLICY "Task assigners and managers can manage assignments" ON task_assignments
  FOR ALL USING (
    auth.uid() = assigned_by OR
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'manager') OR
    auth.uid() IN (
      SELECT t.reporter_id 
      FROM tasks t 
      WHERE t.id = task_id
    )
  );

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_task_assignments_task_id ON task_assignments(task_id);
CREATE INDEX IF NOT EXISTS idx_task_assignments_user_id ON task_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_task_assignments_assigned_by ON task_assignments(assigned_by);

-- Add comments
COMMENT ON TABLE task_assignments IS 'Tracks individual user assignments for tasks, supporting both direct assignments and team-based assignments';
COMMENT ON COLUMN task_assignments.status IS 'Status of the assignment: assigned (default), accepted, declined, completed';