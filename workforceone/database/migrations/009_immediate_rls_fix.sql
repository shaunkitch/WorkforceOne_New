-- Immediate fix for data segregation issue
-- Apply RLS to projects and teams tables first (most critical)

-- =============================================================================
-- PROJECTS TABLE - IMMEDIATE FIX
-- =============================================================================

-- Enable RLS
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- Simple policy: Users can only see projects in their organization
CREATE POLICY "projects_org_isolation" ON public.projects
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.organization_id = projects.organization_id
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.organization_id = projects.organization_id
  )
);

-- =============================================================================
-- TEAMS TABLE - IMMEDIATE FIX  
-- =============================================================================

-- Enable RLS
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

-- Simple policy: Users can only see teams in their organization
CREATE POLICY "teams_org_isolation" ON public.teams
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.organization_id = teams.organization_id
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.organization_id = teams.organization_id
  )
);

-- =============================================================================
-- TASKS TABLE - IMMEDIATE FIX
-- =============================================================================

-- Enable RLS
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Policy for tasks: Can see tasks if they belong to projects in user's org
-- OR if they're standalone tasks created by someone in the same org
CREATE POLICY "tasks_org_isolation" ON public.tasks
FOR ALL
TO authenticated
USING (
  -- Project-based tasks: check project's organization
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
  -- Standalone tasks: check reporter's organization
  (
    tasks.project_id IS NULL 
    AND EXISTS (
      SELECT 1 FROM public.profiles reporter_profile
      JOIN public.profiles user_profile ON user_profile.organization_id = reporter_profile.organization_id
      WHERE reporter_profile.id = tasks.reporter_id 
      AND user_profile.id = auth.uid()
    )
  )
)
WITH CHECK (
  -- Same logic for inserts/updates
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
  (
    tasks.project_id IS NULL 
    AND EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid()
    )
  )
);

-- Grant permissions
GRANT ALL ON public.projects TO authenticated;
GRANT ALL ON public.teams TO authenticated;
GRANT ALL ON public.tasks TO authenticated;