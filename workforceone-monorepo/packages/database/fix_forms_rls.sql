-- Fix Forms RLS Policies to allow form creation by all users
-- Drop ALL existing policies first to avoid conflicts
DROP POLICY IF EXISTS "Admins and managers can manage forms" ON forms;
DROP POLICY IF EXISTS "Users can create forms in their organization" ON forms;
DROP POLICY IF EXISTS "Users can update their own forms, admins can update all" ON forms;
DROP POLICY IF EXISTS "Users can delete their own forms, admins can delete all" ON forms;

DROP POLICY IF EXISTS "Admins and managers can create form templates" ON form_templates;
DROP POLICY IF EXISTS "Admins and managers can update form templates" ON form_templates;
DROP POLICY IF EXISTS "Users can create form templates in their organization" ON form_templates;
DROP POLICY IF EXISTS "Users can update their own templates, admins can update all" ON form_templates;

DROP POLICY IF EXISTS "Admins and managers can manage assignments" ON form_assignments;
DROP POLICY IF EXISTS "Users can create form assignments in their organization" ON form_assignments;
DROP POLICY IF EXISTS "Users can update their own assignments, admins can update all" ON form_assignments;
DROP POLICY IF EXISTS "Users can delete their own assignments, admins can delete all" ON form_assignments;

DROP POLICY IF EXISTS "Users can create and update their own responses" ON form_responses;
DROP POLICY IF EXISTS "Users can update their own responses" ON form_responses;
DROP POLICY IF EXISTS "Users can create their own responses in organization" ON form_responses;

-- Create new policies for forms
CREATE POLICY "Users can create forms in their organization" ON forms
  FOR INSERT WITH CHECK (
    organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Users can update their own forms, admins can update all" ON forms
  FOR UPDATE USING (
    organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()) AND
    (created_by = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager')))
  );

CREATE POLICY "Users can delete their own forms, admins can delete all" ON forms
  FOR DELETE USING (
    organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()) AND
    (created_by = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager')))
  );

-- Create new policies for form_templates
CREATE POLICY "Users can create form templates in their organization" ON form_templates
  FOR INSERT WITH CHECK (
    organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Users can update their own templates, admins can update all" ON form_templates
  FOR UPDATE USING (
    organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()) AND
    (created_by = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager')))
  );

-- Create new policies for form_assignments
CREATE POLICY "Users can create form assignments in their organization" ON form_assignments
  FOR INSERT WITH CHECK (
    organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
  );

CREATE POLICY "Users can update their own assignments, admins can update all" ON form_assignments
  FOR UPDATE USING (
    organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()) AND
    (assigned_by = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager')))
  );

CREATE POLICY "Users can delete their own assignments, admins can delete all" ON form_assignments
  FOR DELETE USING (
    organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()) AND
    (assigned_by = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager')))
  );

-- Create new policies for form_responses
CREATE POLICY "Users can create their own responses in organization" ON form_responses
  FOR INSERT WITH CHECK (
    organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()) AND
    respondent_id = auth.uid()
  );

CREATE POLICY "Users can update their own responses" ON form_responses
  FOR UPDATE USING (
    organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()) AND
    respondent_id = auth.uid()
  );