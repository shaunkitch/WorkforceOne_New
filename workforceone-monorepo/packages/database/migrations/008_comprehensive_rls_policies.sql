-- Comprehensive Row Level Security policies for all tables
-- This ensures complete data segregation between organizations

-- =============================================================================
-- PROJECTS TABLE
-- =============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view projects in their organization" ON public.projects;
DROP POLICY IF EXISTS "Users can insert projects in their organization" ON public.projects;
DROP POLICY IF EXISTS "Users can update projects in their organization" ON public.projects;
DROP POLICY IF EXISTS "Users can delete projects in their organization" ON public.projects;

-- Enable RLS
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- Policy for viewing projects - users can only see projects in their organization
CREATE POLICY "Users can view projects in their organization" ON public.projects
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.organization_id = projects.organization_id
  )
);

-- Policy for inserting projects - only admins/managers can create projects in their org
CREATE POLICY "Users can insert projects in their organization" ON public.projects
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.organization_id = projects.organization_id
    AND profiles.role IN ('admin', 'manager')
  )
);

-- Policy for updating projects - only admins/managers can update projects in their org
CREATE POLICY "Users can update projects in their organization" ON public.projects
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.organization_id = projects.organization_id
    AND profiles.role IN ('admin', 'manager')
  )
);

-- Policy for deleting projects - only admins can delete projects in their org
CREATE POLICY "Users can delete projects in their organization" ON public.projects
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.organization_id = projects.organization_id
    AND profiles.role = 'admin'
  )
);

-- =============================================================================
-- TASKS TABLE
-- =============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view tasks in their organization" ON public.tasks;
DROP POLICY IF EXISTS "Users can insert tasks in their organization" ON public.tasks;
DROP POLICY IF EXISTS "Users can update tasks in their organization" ON public.tasks;
DROP POLICY IF EXISTS "Users can delete tasks in their organization" ON public.tasks;

-- Enable RLS
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Policy for viewing tasks - users can only see tasks in their organization
-- This works by checking if the task's project belongs to their organization
-- OR if it's a standalone task and the user is in the same org as the task creator
CREATE POLICY "Users can view tasks in their organization" ON public.tasks
FOR SELECT
TO authenticated
USING (
  -- For project-based tasks
  (
    tasks.project_id IS NOT NULL 
    AND EXISTS (
      SELECT 1 FROM public.projects 
      JOIN public.profiles ON profiles.organization_id = projects.organization_id
      WHERE projects.id = tasks.project_id 
      AND profiles.id = auth.uid()
    )
  )
  OR
  -- For standalone tasks
  (
    tasks.project_id IS NULL 
    AND EXISTS (
      SELECT 1 FROM public.profiles reporter_profile
      JOIN public.profiles user_profile ON user_profile.organization_id = reporter_profile.organization_id
      WHERE reporter_profile.id = tasks.reporter_id 
      AND user_profile.id = auth.uid()
    )
  )
);

-- Policy for inserting tasks - users can create tasks in projects within their org
CREATE POLICY "Users can insert tasks in their organization" ON public.tasks
FOR INSERT
TO authenticated
WITH CHECK (
  -- For project-based tasks
  (
    tasks.project_id IS NOT NULL 
    AND EXISTS (
      SELECT 1 FROM public.projects 
      JOIN public.profiles ON profiles.organization_id = projects.organization_id
      WHERE projects.id = tasks.project_id 
      AND profiles.id = auth.uid()
    )
  )
  OR
  -- For standalone tasks - user must be admin/manager in their org
  (
    tasks.project_id IS NULL 
    AND EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role IN ('admin', 'manager')
    )
  )
);

-- Policy for updating tasks - users can update tasks in their organization
CREATE POLICY "Users can update tasks in their organization" ON public.tasks
FOR UPDATE
TO authenticated
USING (
  -- For project-based tasks
  (
    tasks.project_id IS NOT NULL 
    AND EXISTS (
      SELECT 1 FROM public.projects 
      JOIN public.profiles ON profiles.organization_id = projects.organization_id
      WHERE projects.id = tasks.project_id 
      AND profiles.id = auth.uid()
    )
  )
  OR
  -- For standalone tasks
  (
    tasks.project_id IS NULL 
    AND EXISTS (
      SELECT 1 FROM public.profiles reporter_profile
      JOIN public.profiles user_profile ON user_profile.organization_id = reporter_profile.organization_id
      WHERE reporter_profile.id = tasks.reporter_id 
      AND user_profile.id = auth.uid()
    )
  )
);

-- Policy for deleting tasks - only admins/managers can delete tasks
CREATE POLICY "Users can delete tasks in their organization" ON public.tasks
FOR DELETE
TO authenticated
USING (
  -- For project-based tasks
  (
    tasks.project_id IS NOT NULL 
    AND EXISTS (
      SELECT 1 FROM public.projects 
      JOIN public.profiles ON profiles.organization_id = projects.organization_id
      WHERE projects.id = tasks.project_id 
      AND profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'manager')
    )
  )
  OR
  -- For standalone tasks
  (
    tasks.project_id IS NULL 
    AND EXISTS (
      SELECT 1 FROM public.profiles reporter_profile
      JOIN public.profiles user_profile ON user_profile.organization_id = reporter_profile.organization_id
      WHERE reporter_profile.id = tasks.reporter_id 
      AND user_profile.id = auth.uid()
      AND user_profile.role IN ('admin', 'manager')
    )
  )
);

-- =============================================================================
-- TEAMS TABLE
-- =============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view teams in their organization" ON public.teams;
DROP POLICY IF EXISTS "Users can insert teams in their organization" ON public.teams;
DROP POLICY IF EXISTS "Users can update teams in their organization" ON public.teams;
DROP POLICY IF EXISTS "Users can delete teams in their organization" ON public.teams;

-- Enable RLS
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

-- Policy for viewing teams - users can only see teams in their organization
CREATE POLICY "Users can view teams in their organization" ON public.teams
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.organization_id = teams.organization_id
  )
);

-- Policy for inserting teams - only admins/managers can create teams
CREATE POLICY "Users can insert teams in their organization" ON public.teams
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.organization_id = teams.organization_id
    AND profiles.role IN ('admin', 'manager')
  )
);

-- Policy for updating teams - only admins/managers can update teams
CREATE POLICY "Users can update teams in their organization" ON public.teams
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.organization_id = teams.organization_id
    AND profiles.role IN ('admin', 'manager')
  )
);

-- Policy for deleting teams - only admins can delete teams
CREATE POLICY "Users can delete teams in their organization" ON public.teams
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.organization_id = teams.organization_id
    AND profiles.role = 'admin'
  )
);

-- =============================================================================
-- FORMS TABLE
-- =============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view forms in their organization" ON public.forms;
DROP POLICY IF EXISTS "Users can insert forms in their organization" ON public.forms;
DROP POLICY IF EXISTS "Users can update forms in their organization" ON public.forms;
DROP POLICY IF EXISTS "Users can delete forms in their organization" ON public.forms;

-- Enable RLS
ALTER TABLE public.forms ENABLE ROW LEVEL SECURITY;

-- Policy for viewing forms - users can only see forms in their organization
CREATE POLICY "Users can view forms in their organization" ON public.forms
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.organization_id = forms.organization_id
  )
);

-- Policy for inserting forms - only admins/managers can create forms
CREATE POLICY "Users can insert forms in their organization" ON public.forms
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.organization_id = forms.organization_id
    AND profiles.role IN ('admin', 'manager')
  )
);

-- Policy for updating forms - only admins/managers can update forms
CREATE POLICY "Users can update forms in their organization" ON public.forms
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.organization_id = forms.organization_id
    AND profiles.role IN ('admin', 'manager')
  )
);

-- Policy for deleting forms - only admins can delete forms
CREATE POLICY "Users can delete forms in their organization" ON public.forms
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.organization_id = forms.organization_id
    AND profiles.role = 'admin'
  )
);

-- =============================================================================
-- OUTLETS TABLE
-- =============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view outlets in their organization" ON public.outlets;
DROP POLICY IF EXISTS "Users can insert outlets in their organization" ON public.outlets;
DROP POLICY IF EXISTS "Users can update outlets in their organization" ON public.outlets;
DROP POLICY IF EXISTS "Users can delete outlets in their organization" ON public.outlets;

-- Enable RLS
ALTER TABLE public.outlets ENABLE ROW LEVEL SECURITY;

-- Policy for viewing outlets - users can only see outlets in their organization
CREATE POLICY "Users can view outlets in their organization" ON public.outlets
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.organization_id = outlets.organization_id
  )
);

-- Policy for inserting outlets - only admins/managers can create outlets
CREATE POLICY "Users can insert outlets in their organization" ON public.outlets
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.organization_id = outlets.organization_id
    AND profiles.role IN ('admin', 'manager')
  )
);

-- Policy for updating outlets - only admins/managers can update outlets
CREATE POLICY "Users can update outlets in their organization" ON public.outlets
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.organization_id = outlets.organization_id
    AND profiles.role IN ('admin', 'manager')
  )
);

-- Policy for deleting outlets - only admins can delete outlets
CREATE POLICY "Users can delete outlets in their organization" ON public.outlets
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.organization_id = outlets.organization_id
    AND profiles.role = 'admin'
  )
);

-- =============================================================================
-- ATTENDANCE TABLE (if it exists)
-- =============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view attendance in their organization" ON public.attendance;
DROP POLICY IF EXISTS "Users can insert their own attendance" ON public.attendance;
DROP POLICY IF EXISTS "Users can update their own attendance" ON public.attendance;
DROP POLICY IF EXISTS "Managers can view team attendance" ON public.attendance;

-- Enable RLS (if table exists)
-- ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

-- These policies would be created if the attendance table exists
-- CREATE POLICY "Users can view their own attendance" ON public.attendance
-- FOR SELECT TO authenticated USING (user_id = auth.uid());

-- CREATE POLICY "Managers can view team attendance" ON public.attendance
-- FOR SELECT TO authenticated USING (
--   EXISTS (
--     SELECT 1 FROM public.profiles user_profile
--     JOIN public.profiles manager_profile ON manager_profile.organization_id = user_profile.organization_id
--     WHERE user_profile.id = attendance.user_id
--     AND manager_profile.id = auth.uid()
--     AND manager_profile.role IN ('admin', 'manager')
--   )
-- );

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.projects TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tasks TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.teams TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.forms TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.outlets TO authenticated;