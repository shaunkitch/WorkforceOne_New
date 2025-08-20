-- =============================================
-- UPDATE RLS POLICIES FOR PRODUCT-BASED ACCESS
-- Creates comprehensive product-based security policies
-- =============================================

-- First, disable existing RLS policies to recreate them
-- (This assumes we're updating existing policies)

-- ===== HELPER FUNCTIONS =====

-- Function to check if user has access to a specific product
CREATE OR REPLACE FUNCTION has_product_access(user_id UUID, product_code TEXT)
RETURNS BOOLEAN
LANGUAGE sql SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM user_product_access upa
    JOIN products p ON p.id = upa.product_id
    WHERE upa.user_id = $1 
    AND p.code = $2 
    AND upa.is_active = true
  );
$$;

-- Function to check organization subscription status
CREATE OR REPLACE FUNCTION org_has_active_product(org_id UUID, product_code TEXT)
RETURNS BOOLEAN
LANGUAGE sql SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM organization_subscriptions os
    JOIN products p ON p.id = os.product_id
    WHERE os.organization_id = $1 
    AND p.code = $2 
    AND os.status IN ('trial', 'active')
  );
$$;

-- Function to get user's organization
CREATE OR REPLACE FUNCTION get_user_organization(user_id UUID)
RETURNS UUID
LANGUAGE sql SECURITY DEFINER
STABLE
AS $$
  SELECT organization_id 
  FROM profiles 
  WHERE id = $1;
$$;

-- ===== WORKFORCEONE REMOTE™ RLS POLICIES =====

-- Teams
DROP POLICY IF EXISTS "teams_select" ON teams;
DROP POLICY IF EXISTS "teams_insert" ON teams;
DROP POLICY IF EXISTS "teams_update" ON teams;
DROP POLICY IF EXISTS "teams_delete" ON teams;

CREATE POLICY "teams_remote_access" ON teams
FOR ALL TO authenticated
USING (
  has_product_access(auth.uid(), 'remote') 
  AND get_user_organization(auth.uid()) = organization_id
);

-- Team Members
DROP POLICY IF EXISTS "team_members_select" ON team_members;
DROP POLICY IF EXISTS "team_members_insert" ON team_members;
DROP POLICY IF EXISTS "team_members_update" ON team_members;
DROP POLICY IF EXISTS "team_members_delete" ON team_members;

CREATE POLICY "team_members_remote_access" ON team_members
FOR ALL TO authenticated
USING (
  has_product_access(auth.uid(), 'remote')
  AND EXISTS (
    SELECT 1 FROM teams t 
    WHERE t.id = team_members.team_id 
    AND get_user_organization(auth.uid()) = t.organization_id
  )
);

-- Tasks
DROP POLICY IF EXISTS "tasks_select" ON tasks;
DROP POLICY IF EXISTS "tasks_insert" ON tasks;
DROP POLICY IF EXISTS "tasks_update" ON tasks;
DROP POLICY IF EXISTS "tasks_delete" ON tasks;

CREATE POLICY "tasks_remote_access" ON tasks
FOR ALL TO authenticated
USING (
  has_product_access(auth.uid(), 'remote')
  AND get_user_organization(auth.uid()) = organization_id
);

-- Task Assignments
DROP POLICY IF EXISTS "task_assignments_select" ON task_assignments;
CREATE POLICY "task_assignments_remote_access" ON task_assignments
FOR ALL TO authenticated
USING (
  has_product_access(auth.uid(), 'remote')
  AND EXISTS (
    SELECT 1 FROM tasks t 
    WHERE t.id = task_assignments.task_id 
    AND get_user_organization(auth.uid()) = t.organization_id
  )
);

-- Task Comments
DROP POLICY IF EXISTS "task_comments_select" ON task_comments;
CREATE POLICY "task_comments_remote_access" ON task_comments
FOR ALL TO authenticated
USING (
  has_product_access(auth.uid(), 'remote')
  AND EXISTS (
    SELECT 1 FROM tasks t 
    WHERE t.id = task_comments.task_id 
    AND get_user_organization(auth.uid()) = t.organization_id
  )
);

-- Projects
DROP POLICY IF EXISTS "projects_select" ON projects;
CREATE POLICY "projects_remote_access" ON projects
FOR ALL TO authenticated
USING (
  has_product_access(auth.uid(), 'remote')
  AND get_user_organization(auth.uid()) = organization_id
);

-- Forms
DROP POLICY IF EXISTS "forms_select" ON forms;
DROP POLICY IF EXISTS "forms_insert" ON forms;
DROP POLICY IF EXISTS "forms_update" ON forms;
DROP POLICY IF EXISTS "forms_delete" ON forms;

CREATE POLICY "forms_remote_access" ON forms
FOR ALL TO authenticated
USING (
  has_product_access(auth.uid(), 'remote')
  AND get_user_organization(auth.uid()) = organization_id
);

-- Form Responses
DROP POLICY IF EXISTS "form_responses_select" ON form_responses;
CREATE POLICY "form_responses_remote_access" ON form_responses
FOR ALL TO authenticated
USING (
  has_product_access(auth.uid(), 'remote')
  AND EXISTS (
    SELECT 1 FROM forms f 
    WHERE f.id = form_responses.form_id 
    AND get_user_organization(auth.uid()) = f.organization_id
  )
);

-- Routes
DROP POLICY IF EXISTS "routes_select" ON routes;
CREATE POLICY "routes_remote_access" ON routes
FOR ALL TO authenticated
USING (
  has_product_access(auth.uid(), 'remote')
  AND get_user_organization(auth.uid()) = organization_id
);

-- ===== WORKFORCEONE TIME™ RLS POLICIES =====

-- Attendance (only if table exists with user_id column)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables WHERE table_name = 'attendance'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'attendance' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "attendance_select" ON attendance;
    DROP POLICY IF EXISTS "attendance_insert" ON attendance;
    DROP POLICY IF EXISTS "attendance_update" ON attendance;
    DROP POLICY IF EXISTS "attendance_delete" ON attendance;

    CREATE POLICY "attendance_time_access" ON attendance
    FOR ALL TO authenticated
    USING (
      has_product_access(auth.uid(), 'time')
      AND (
        user_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM profiles p 
          WHERE p.id = auth.uid() 
          AND p.organization_id = get_user_organization(attendance.user_id)
          AND p.role IN ('admin', 'manager')
        )
      )
    );
    RAISE NOTICE 'Created attendance RLS policies';
  ELSE
    RAISE NOTICE 'Skipping attendance - table or user_id column does not exist';
  END IF;
END $$;

-- Time Entries (only if table exists with user_id column)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables WHERE table_name = 'time_entries'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'time_entries' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "time_entries_select" ON time_entries;
    CREATE POLICY "time_entries_time_access" ON time_entries
    FOR ALL TO authenticated
    USING (
      has_product_access(auth.uid(), 'time')
      AND (
        user_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM profiles p 
          WHERE p.id = auth.uid() 
          AND p.organization_id = get_user_organization(time_entries.user_id)
          AND p.role IN ('admin', 'manager')
        )
      )
    );
    RAISE NOTICE 'Created time_entries RLS policies';
  ELSE
    RAISE NOTICE 'Skipping time_entries - table or user_id column does not exist';
  END IF;
END $$;

-- Leave Requests (only if table exists with user_id column)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables WHERE table_name = 'leave_requests'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'leave_requests' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "leave_requests_select" ON leave_requests;
    CREATE POLICY "leave_requests_time_access" ON leave_requests
    FOR ALL TO authenticated
    USING (
      has_product_access(auth.uid(), 'time')
      AND (
        user_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM profiles p 
          WHERE p.id = auth.uid() 
          AND p.organization_id = get_user_organization(leave_requests.user_id)
          AND p.role IN ('admin', 'manager')
        )
      )
    );
    RAISE NOTICE 'Created leave_requests RLS policies';
  ELSE
    RAISE NOTICE 'Skipping leave_requests - table or user_id column does not exist';
  END IF;
END $$;

-- Leave Balances (only if table exists with user_id column)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables WHERE table_name = 'leave_balances'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'leave_balances' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "leave_balances_select" ON leave_balances;
    CREATE POLICY "leave_balances_time_access" ON leave_balances
    FOR ALL TO authenticated
    USING (
      has_product_access(auth.uid(), 'time')
      AND (
        user_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM profiles p 
          WHERE p.id = auth.uid() 
          AND p.organization_id = get_user_organization(leave_balances.user_id)
          AND p.role IN ('admin', 'manager')
        )
      )
    );
    RAISE NOTICE 'Created leave_balances RLS policies';
  ELSE
    RAISE NOTICE 'Skipping leave_balances - table or user_id column does not exist';
  END IF;
END $$;

-- Payslips (only if table exists with user_id column)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables WHERE table_name = 'payslips'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'payslips' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "payslips_select" ON payslips;
    CREATE POLICY "payslips_time_access" ON payslips
    FOR ALL TO authenticated
    USING (
      has_product_access(auth.uid(), 'time')
      AND (
        user_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM profiles p 
          WHERE p.id = auth.uid() 
          AND p.organization_id = get_user_organization(payslips.user_id)
          AND p.role IN ('admin', 'manager')
        )
      )
    );
    RAISE NOTICE 'Created payslips RLS policies';
  ELSE
    RAISE NOTICE 'Skipping payslips - table or user_id column does not exist';
  END IF;
END $$;

-- ===== WORKFORCEONE GUARD™ RLS POLICIES =====

-- Patrol Routes (only if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'patrol_routes') THEN
    DROP POLICY IF EXISTS "patrol_routes_select" ON patrol_routes;
    CREATE POLICY "patrol_routes_guard_access" ON patrol_routes
    FOR ALL TO authenticated
    USING (
      has_product_access(auth.uid(), 'guard')
      AND get_user_organization(auth.uid()) = organization_id
    );
    RAISE NOTICE 'Created patrol_routes RLS policies';
  ELSE
    RAISE NOTICE 'Skipping patrol_routes - table does not exist';
  END IF;
END $$;

-- Patrol Sessions (only if table exists with guard_id column)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables WHERE table_name = 'patrol_sessions'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'patrol_sessions' AND column_name = 'guard_id'
  ) THEN
    DROP POLICY IF EXISTS "patrol_sessions_select" ON patrol_sessions;
    CREATE POLICY "patrol_sessions_guard_access" ON patrol_sessions
    FOR ALL TO authenticated
    USING (
      has_product_access(auth.uid(), 'guard')
      AND (
        guard_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM profiles p 
          WHERE p.id = auth.uid() 
          AND p.organization_id = get_user_organization(patrol_sessions.guard_id)
          AND p.role IN ('admin', 'manager')
        )
      )
    );
    RAISE NOTICE 'Created patrol_sessions RLS policies';
  ELSE
    RAISE NOTICE 'Skipping patrol_sessions - table or guard_id column does not exist';
  END IF;
END $$;

-- Patrol Checkpoints (only if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'patrol_checkpoints') THEN
    DROP POLICY IF EXISTS "patrol_checkpoints_select" ON patrol_checkpoints;
    CREATE POLICY "patrol_checkpoints_guard_access" ON patrol_checkpoints
    FOR ALL TO authenticated
    USING (
      has_product_access(auth.uid(), 'guard')
      AND EXISTS (
        SELECT 1 FROM patrol_routes pr 
        WHERE pr.id = patrol_checkpoints.route_id 
        AND get_user_organization(auth.uid()) = pr.organization_id
      )
    );
    RAISE NOTICE 'Created patrol_checkpoints RLS policies';
  ELSE
    RAISE NOTICE 'Skipping patrol_checkpoints - table does not exist';
  END IF;
END $$;

-- Checkpoint Scans (only if table exists with guard_id column)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables WHERE table_name = 'checkpoint_scans'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'checkpoint_scans' AND column_name = 'guard_id'
  ) THEN
    DROP POLICY IF EXISTS "checkpoint_scans_select" ON checkpoint_scans;
    CREATE POLICY "checkpoint_scans_guard_access" ON checkpoint_scans
    FOR ALL TO authenticated
    USING (
      has_product_access(auth.uid(), 'guard')
      AND (
        guard_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM profiles p 
          WHERE p.id = auth.uid() 
          AND p.organization_id = get_user_organization(checkpoint_scans.guard_id)
          AND p.role IN ('admin', 'manager')
        )
      )
    );
    RAISE NOTICE 'Created checkpoint_scans RLS policies';
  ELSE
    RAISE NOTICE 'Skipping checkpoint_scans - table or guard_id column does not exist';
  END IF;
END $$;

-- Incidents (only if table exists with reported_by column)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables WHERE table_name = 'incidents'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'incidents' AND column_name = 'reported_by'
  ) THEN
    DROP POLICY IF EXISTS "incidents_select" ON incidents;
    DROP POLICY IF EXISTS "incidents_insert" ON incidents;
    DROP POLICY IF EXISTS "incidents_update" ON incidents;

    CREATE POLICY "incidents_guard_access" ON incidents
    FOR ALL TO authenticated
    USING (
      has_product_access(auth.uid(), 'guard')
      AND (
        reported_by = auth.uid() OR
        EXISTS (
          SELECT 1 FROM profiles p 
          WHERE p.id = auth.uid() 
          AND p.organization_id = get_user_organization(incidents.reported_by)
          AND p.role IN ('admin', 'manager')
        )
      )
    );
    RAISE NOTICE 'Created incidents RLS policies';
  ELSE
    RAISE NOTICE 'Skipping incidents - table or reported_by column does not exist';
  END IF;
END $$;

-- Incident Attachments (only if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'incident_attachments') THEN
    DROP POLICY IF EXISTS "incident_attachments_select" ON incident_attachments;
    CREATE POLICY "incident_attachments_guard_access" ON incident_attachments
    FOR ALL TO authenticated
    USING (
      has_product_access(auth.uid(), 'guard')
      AND EXISTS (
        SELECT 1 FROM incidents i 
        WHERE i.id = incident_attachments.incident_id 
        AND (
          i.reported_by = auth.uid() OR
          EXISTS (
            SELECT 1 FROM profiles p 
            WHERE p.id = auth.uid() 
            AND p.organization_id = get_user_organization(i.reported_by)
            AND p.role IN ('admin', 'manager')
          )
        )
      )
    );
    RAISE NOTICE 'Created incident_attachments RLS policies';
  ELSE
    RAISE NOTICE 'Skipping incident_attachments - table does not exist';
  END IF;
END $$;

-- Guard Assignments (only if table exists with guard_id column)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables WHERE table_name = 'guard_assignments'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'guard_assignments' AND column_name = 'guard_id'
  ) THEN
    DROP POLICY IF EXISTS "guard_assignments_select" ON guard_assignments;
    CREATE POLICY "guard_assignments_guard_access" ON guard_assignments
    FOR ALL TO authenticated
    USING (
      has_product_access(auth.uid(), 'guard')
      AND (
        guard_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM profiles p 
          WHERE p.id = auth.uid() 
          AND p.organization_id = get_user_organization(guard_assignments.guard_id)
          AND p.role IN ('admin', 'manager')
        )
      )
    );
    RAISE NOTICE 'Created guard_assignments RLS policies';
  ELSE
    RAISE NOTICE 'Skipping guard_assignments - table or guard_id column does not exist';
  END IF;
END $$;

-- ===== SHARED TABLE POLICIES =====

-- Outlets (context-based access, only if table exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables WHERE table_name = 'outlets'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'outlets' AND column_name = 'organization_id'
  ) THEN
    DROP POLICY IF EXISTS "outlets_select" ON outlets;
    CREATE POLICY "outlets_product_access" ON outlets
    FOR ALL TO authenticated
    USING (
      get_user_organization(auth.uid()) = organization_id
      AND (
        (product_id IS NULL) OR -- Legacy outlets
        (product_id = (SELECT id FROM products WHERE code = 'remote') AND has_product_access(auth.uid(), 'remote')) OR
        (product_id = (SELECT id FROM products WHERE code = 'guard') AND has_product_access(auth.uid(), 'guard'))
      )
    );
    RAISE NOTICE 'Created outlets RLS policies';
  ELSE
    RAISE NOTICE 'Skipping outlets - table or organization_id column does not exist';
  END IF;
END $$;

-- Notifications (all products but filtered, only if table exists with user_id column)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'notifications' AND column_name = 'user_id'
  ) THEN
    DROP POLICY IF EXISTS "notifications_select" ON notifications;
    CREATE POLICY "notifications_access" ON notifications
    FOR ALL TO authenticated
    USING (
      user_id = auth.uid() OR
      (
        user_id IS NULL AND -- System notifications
        get_user_organization(auth.uid()) = organization_id
      )
    );
    RAISE NOTICE 'Created notifications RLS policies';
  ELSE
    RAISE NOTICE 'Skipping notifications - table or user_id column does not exist';
  END IF;
END $$;

-- Organization Settings (admin only, only if table exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables WHERE table_name = 'organization_settings'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'organization_settings' AND column_name = 'organization_id'
  ) THEN
    DROP POLICY IF EXISTS "organization_settings_select" ON organization_settings;
    CREATE POLICY "organization_settings_access" ON organization_settings
    FOR ALL TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM profiles p 
        WHERE p.id = auth.uid() 
        AND p.organization_id = organization_settings.organization_id
        AND p.role IN ('admin', 'manager')
      )
    );
    RAISE NOTICE 'Created organization_settings RLS policies';
  ELSE
    RAISE NOTICE 'Skipping organization_settings - table or organization_id column does not exist';
  END IF;
END $$;

-- ===== GRANT ADDITIONAL PERMISSIONS =====

-- Ensure authenticated users can execute the helper functions
GRANT EXECUTE ON FUNCTION has_product_access(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION org_has_active_product(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_organization(UUID) TO authenticated;

-- Success message
SELECT 'Product-based RLS policies updated successfully!' as status;