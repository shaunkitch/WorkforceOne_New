-- ===================================
-- Form Builder Database Schema
-- ===================================

-- Form Templates Table
CREATE TABLE form_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100), -- 'feedback', 'evaluation', 'survey', 'assessment', 'onboarding', 'custom'
  fields JSONB NOT NULL DEFAULT '[]', -- Array of form field definitions
  settings JSONB DEFAULT '{}', -- Form settings (submit once, deadline, etc.)
  is_active BOOLEAN DEFAULT true,
  is_template BOOLEAN DEFAULT false, -- Can be used as template for new forms
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT form_templates_title_org_unique UNIQUE(organization_id, title)
);

-- Form Instances Table (specific deployments of templates)
CREATE TABLE forms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  template_id UUID REFERENCES form_templates(id) ON DELETE SET NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  fields JSONB NOT NULL DEFAULT '[]', -- Copied from template but can be modified
  settings JSONB DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'draft', -- 'draft', 'active', 'paused', 'completed', 'archived'
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Form Assignments Table
CREATE TABLE form_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  form_id UUID NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Assignment target (either user, team, or role-based)
  assigned_to_user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  assigned_to_team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  assigned_to_role VARCHAR(50), -- 'admin', 'manager', 'lead', 'member'
  assigned_to_department VARCHAR(100),
  
  -- Assignment details
  is_mandatory BOOLEAN DEFAULT false,
  due_date TIMESTAMP WITH TIME ZONE,
  reminder_enabled BOOLEAN DEFAULT true,
  reminder_days_before INTEGER DEFAULT 3,
  
  -- Assignment metadata
  assigned_by UUID NOT NULL REFERENCES profiles(id),
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure only one assignment type per record
  CONSTRAINT form_assignments_target_check CHECK (
    (assigned_to_user_id IS NOT NULL)::INTEGER +
    (assigned_to_team_id IS NOT NULL)::INTEGER +
    (assigned_to_role IS NOT NULL)::INTEGER +
    (assigned_to_department IS NOT NULL)::INTEGER = 1
  )
);

-- Form Responses Table
CREATE TABLE form_responses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  form_id UUID NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
  assignment_id UUID REFERENCES form_assignments(id) ON DELETE SET NULL,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Response details
  respondent_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  responses JSONB NOT NULL DEFAULT '{}', -- Field ID -> Response mapping
  
  -- Response metadata
  status VARCHAR(50) DEFAULT 'draft', -- 'draft', 'submitted', 'reviewed'
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  submitted_at TIMESTAMP WITH TIME ZONE,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID REFERENCES profiles(id),
  
  -- Response analytics
  completion_time_seconds INTEGER, -- Time taken to complete
  ip_address INET,
  user_agent TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure one response per user per form (unless form allows multiple)
  CONSTRAINT form_responses_unique UNIQUE(form_id, respondent_id)
);

-- Form Field Types Reference
CREATE TABLE form_field_types (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  validation_schema JSONB, -- JSON schema for validation
  default_settings JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true
);

-- Insert default field types
INSERT INTO form_field_types (id, name, description, validation_schema, default_settings) VALUES
('text', 'Text Input', 'Single line text input', 
 '{"type": "string", "maxLength": 255}', 
 '{"placeholder": "", "required": false}'),
 
('textarea', 'Text Area', 'Multi-line text input', 
 '{"type": "string", "maxLength": 5000}', 
 '{"placeholder": "", "rows": 4, "required": false}'),
 
('email', 'Email', 'Email address input', 
 '{"type": "string", "format": "email"}', 
 '{"placeholder": "you@example.com", "required": false}'),
 
('number', 'Number', 'Numeric input', 
 '{"type": "number"}', 
 '{"min": null, "max": null, "step": 1, "required": false}'),
 
('select', 'Dropdown', 'Single select dropdown', 
 '{"type": "string"}', 
 '{"options": [], "placeholder": "Select an option", "required": false}'),
 
('multiselect', 'Multi-Select', 'Multiple choice selection', 
 '{"type": "array", "items": {"type": "string"}}', 
 '{"options": [], "minSelections": 0, "maxSelections": null, "required": false}'),
 
('radio', 'Radio Buttons', 'Single choice from options', 
 '{"type": "string"}', 
 '{"options": [], "layout": "vertical", "required": false}'),
 
('checkbox', 'Checkboxes', 'Multiple choice checkboxes', 
 '{"type": "array", "items": {"type": "string"}}', 
 '{"options": [], "layout": "vertical", "required": false}'),
 
('date', 'Date', 'Date picker', 
 '{"type": "string", "format": "date"}', 
 '{"minDate": null, "maxDate": null, "required": false}'),
 
('datetime', 'Date & Time', 'Date and time picker', 
 '{"type": "string", "format": "date-time"}', 
 '{"minDateTime": null, "maxDateTime": null, "required": false}'),
 
('file', 'File Upload', 'File upload input', 
 '{"type": "string"}', 
 '{"accept": "*/*", "maxSize": 10485760, "multiple": false, "required": false}'),
 
('rating', 'Rating', 'Star or numeric rating', 
 '{"type": "number", "minimum": 1}', 
 '{"max": 5, "style": "stars", "required": false}'),
 
('likert', 'Likert Scale', 'Agreement scale rating', 
 '{"type": "string"}', 
 '{"scale": ["Strongly Disagree", "Disagree", "Neutral", "Agree", "Strongly Agree"], "required": false}'),
 
('section', 'Section Header', 'Visual section separator', 
 '{}', 
 '{"title": "", "description": ""}'),
 
('html', 'HTML Content', 'Custom HTML content', 
 '{}', 
 '{"content": "<p>Add your HTML content here</p>"}');

-- Form Analytics Table
CREATE TABLE form_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  form_id UUID NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Analytics data
  total_assigned INTEGER DEFAULT 0,
  total_started INTEGER DEFAULT 0,
  total_completed INTEGER DEFAULT 0,
  completion_rate DECIMAL(5,2) DEFAULT 0.00,
  average_completion_time_seconds INTEGER DEFAULT 0,
  
  -- Field-specific analytics
  field_analytics JSONB DEFAULT '{}', -- Field completion rates, common answers, etc.
  
  -- Time-based analytics
  responses_by_date JSONB DEFAULT '{}', -- Daily response counts
  
  calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure one analytics record per form
  CONSTRAINT form_analytics_unique UNIQUE(form_id)
);

-- Form Notifications Table
CREATE TABLE form_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  form_id UUID NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
  assignment_id UUID REFERENCES form_assignments(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Notification details
  recipient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  notification_type VARCHAR(50) NOT NULL, -- 'assignment', 'reminder', 'deadline', 'completion'
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  
  -- Notification status
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'sent', 'failed', 'read'
  sent_at TIMESTAMP WITH TIME ZONE,
  read_at TIMESTAMP WITH TIME ZONE,
  
  -- Scheduling
  scheduled_for TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_form_templates_org_id ON form_templates(organization_id);
CREATE INDEX idx_form_templates_category ON form_templates(category);
CREATE INDEX idx_form_templates_active ON form_templates(is_active);

CREATE INDEX idx_forms_org_id ON forms(organization_id);
CREATE INDEX idx_forms_template_id ON forms(template_id);
CREATE INDEX idx_forms_status ON forms(status);
CREATE INDEX idx_forms_dates ON forms(start_date, end_date);

CREATE INDEX idx_form_assignments_form_id ON form_assignments(form_id);
CREATE INDEX idx_form_assignments_org_id ON form_assignments(organization_id);
CREATE INDEX idx_form_assignments_user_id ON form_assignments(assigned_to_user_id);
CREATE INDEX idx_form_assignments_team_id ON form_assignments(assigned_to_team_id);
CREATE INDEX idx_form_assignments_role ON form_assignments(assigned_to_role);
CREATE INDEX idx_form_assignments_due_date ON form_assignments(due_date);

CREATE INDEX idx_form_responses_form_id ON form_responses(form_id);
CREATE INDEX idx_form_responses_respondent_id ON form_responses(respondent_id);
CREATE INDEX idx_form_responses_status ON form_responses(status);
CREATE INDEX idx_form_responses_submitted_at ON form_responses(submitted_at);

CREATE INDEX idx_form_notifications_recipient_id ON form_notifications(recipient_id);
CREATE INDEX idx_form_notifications_status ON form_notifications(status);
CREATE INDEX idx_form_notifications_scheduled ON form_notifications(scheduled_for);

-- Create RLS policies
ALTER TABLE form_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE form_notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for form_templates
CREATE POLICY "Users can view form templates in their organization" ON form_templates
  FOR SELECT USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Admins and managers can create form templates" ON form_templates
  FOR INSERT WITH CHECK (
    organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()) AND
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
  );

CREATE POLICY "Admins and managers can update form templates" ON form_templates
  FOR UPDATE USING (
    organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()) AND
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
  );

CREATE POLICY "Admins can delete form templates" ON form_templates
  FOR DELETE USING (
    organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()) AND
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- RLS Policies for forms
CREATE POLICY "Users can view forms in their organization" ON forms
  FOR SELECT USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Admins and managers can manage forms" ON forms
  FOR ALL USING (
    organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()) AND
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
  );

-- RLS Policies for form_assignments
CREATE POLICY "Users can view assignments in their organization" ON form_assignments
  FOR SELECT USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Admins and managers can manage assignments" ON form_assignments
  FOR ALL USING (
    organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()) AND
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
  );

-- RLS Policies for form_responses
CREATE POLICY "Users can view their own responses and managers can view all" ON form_responses
  FOR SELECT USING (
    organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()) AND
    (respondent_id = auth.uid() OR 
     EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager')))
  );

CREATE POLICY "Users can create and update their own responses" ON form_responses
  FOR INSERT WITH CHECK (
    organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()) AND
    respondent_id = auth.uid()
  );

CREATE POLICY "Users can update their own responses" ON form_responses
  FOR UPDATE USING (
    organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()) AND
    respondent_id = auth.uid()
  );

-- RLS Policies for form_analytics
CREATE POLICY "Admins and managers can view form analytics" ON form_analytics
  FOR SELECT USING (
    organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()) AND
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
  );

-- RLS Policies for form_notifications
CREATE POLICY "Users can view their own notifications" ON form_notifications
  FOR SELECT USING (
    organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()) AND
    recipient_id = auth.uid()
  );

CREATE POLICY "System can manage notifications" ON form_notifications
  FOR ALL USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));

-- Create functions for automation

-- Function to calculate form analytics
CREATE OR REPLACE FUNCTION calculate_form_analytics(form_uuid UUID)
RETURNS VOID AS $$
BEGIN
  INSERT INTO form_analytics (form_id, organization_id, total_assigned, total_started, total_completed, completion_rate, average_completion_time_seconds)
  SELECT 
    form_uuid,
    f.organization_id,
    COALESCE(assigned_count.count, 0) as total_assigned,
    COALESCE(started_count.count, 0) as total_started,
    COALESCE(completed_count.count, 0) as total_completed,
    CASE 
      WHEN COALESCE(assigned_count.count, 0) > 0 
      THEN (COALESCE(completed_count.count, 0)::DECIMAL / assigned_count.count * 100)
      ELSE 0 
    END as completion_rate,
    COALESCE(avg_time.avg_seconds, 0) as average_completion_time_seconds
  FROM forms f
  LEFT JOIN (
    SELECT form_id, COUNT(*) as count 
    FROM form_assignments 
    WHERE form_id = form_uuid 
    GROUP BY form_id
  ) assigned_count ON assigned_count.form_id = f.id
  LEFT JOIN (
    SELECT form_id, COUNT(*) as count 
    FROM form_responses 
    WHERE form_id = form_uuid AND status != 'draft'
    GROUP BY form_id
  ) started_count ON started_count.form_id = f.id
  LEFT JOIN (
    SELECT form_id, COUNT(*) as count 
    FROM form_responses 
    WHERE form_id = form_uuid AND status = 'submitted'
    GROUP BY form_id
  ) completed_count ON completed_count.form_id = f.id
  LEFT JOIN (
    SELECT form_id, AVG(completion_time_seconds) as avg_seconds
    FROM form_responses 
    WHERE form_id = form_uuid AND completion_time_seconds IS NOT NULL
    GROUP BY form_id
  ) avg_time ON avg_time.form_id = f.id
  WHERE f.id = form_uuid
  ON CONFLICT (form_id) DO UPDATE SET
    total_assigned = EXCLUDED.total_assigned,
    total_started = EXCLUDED.total_started,
    total_completed = EXCLUDED.total_completed,
    completion_rate = EXCLUDED.completion_rate,
    average_completion_time_seconds = EXCLUDED.average_completion_time_seconds,
    calculated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to create assignment notifications
CREATE OR REPLACE FUNCTION create_assignment_notification(assignment_uuid UUID)
RETURNS VOID AS $$
DECLARE
  assignment_record RECORD;
  form_record RECORD;
BEGIN
  -- Get assignment and form details
  SELECT * INTO assignment_record FROM form_assignments WHERE id = assignment_uuid;
  SELECT * INTO form_record FROM forms WHERE id = assignment_record.form_id;
  
  -- Create notification for assigned user
  IF assignment_record.assigned_to_user_id IS NOT NULL THEN
    INSERT INTO form_notifications (form_id, assignment_id, organization_id, recipient_id, notification_type, title, message)
    VALUES (
      assignment_record.form_id,
      assignment_uuid,
      assignment_record.organization_id,
      assignment_record.assigned_to_user_id,
      'assignment',
      'New Form Assignment: ' || form_record.title,
      'You have been assigned a new form to complete: ' || form_record.title
    );
  END IF;
  
  -- For team assignments, create notifications for all team members
  IF assignment_record.assigned_to_team_id IS NOT NULL THEN
    INSERT INTO form_notifications (form_id, assignment_id, organization_id, recipient_id, notification_type, title, message)
    SELECT 
      assignment_record.form_id,
      assignment_uuid,
      assignment_record.organization_id,
      tm.user_id,
      'assignment',
      'New Form Assignment: ' || form_record.title,
      'Your team has been assigned a new form to complete: ' || form_record.title
    FROM team_members tm
    WHERE tm.team_id = assignment_record.assigned_to_team_id;
  END IF;
  
  -- For role-based assignments, create notifications for all users with that role
  IF assignment_record.assigned_to_role IS NOT NULL THEN
    INSERT INTO form_notifications (form_id, assignment_id, organization_id, recipient_id, notification_type, title, message)
    SELECT 
      assignment_record.form_id,
      assignment_uuid,
      assignment_record.organization_id,
      p.id,
      'assignment',
      'New Form Assignment: ' || form_record.title,
      'A new form has been assigned to your role: ' || form_record.title
    FROM profiles p
    WHERE p.organization_id = assignment_record.organization_id 
    AND p.role = assignment_record.assigned_to_role;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Trigger to create notifications when assignments are created
CREATE OR REPLACE FUNCTION trigger_assignment_notification()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM create_assignment_notification(NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER form_assignment_notification_trigger
  AFTER INSERT ON form_assignments
  FOR EACH ROW
  EXECUTE FUNCTION trigger_assignment_notification();

-- Trigger to update analytics when responses change
CREATE OR REPLACE FUNCTION trigger_form_analytics_update()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM calculate_form_analytics(COALESCE(NEW.form_id, OLD.form_id));
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER form_response_analytics_trigger
  AFTER INSERT OR UPDATE OR DELETE ON form_responses
  FOR EACH ROW
  EXECUTE FUNCTION trigger_form_analytics_update();

-- Update timestamps automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_form_templates_updated_at BEFORE UPDATE ON form_templates FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_forms_updated_at BEFORE UPDATE ON forms FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_form_responses_updated_at BEFORE UPDATE ON form_responses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();