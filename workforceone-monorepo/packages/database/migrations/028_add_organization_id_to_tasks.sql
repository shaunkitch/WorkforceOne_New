-- Migration 028: Add organization_id to tasks table
-- This adds organization_id column to tasks table for proper multi-tenant support

-- Add organization_id column if it doesn't exist
ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

-- Update existing tasks to get organization_id from their reporter's profile
UPDATE tasks t
SET organization_id = p.organization_id
FROM profiles p
WHERE t.reporter_id = p.id
AND t.organization_id IS NULL;

-- Make organization_id NOT NULL after populating existing records
ALTER TABLE tasks 
ALTER COLUMN organization_id SET NOT NULL;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_tasks_organization_id ON tasks(organization_id);

-- Update RLS policies to use organization_id directly
DROP POLICY IF EXISTS "Organization members can view tasks" ON tasks;

CREATE POLICY "Organization members can view tasks" ON tasks
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Comment for documentation
COMMENT ON COLUMN tasks.organization_id IS 'Organization that owns this task';