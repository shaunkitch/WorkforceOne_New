-- Migration 015: Workflow Trigger Engine
-- Advanced trigger system for automated workflow execution

-- Workflow Trigger Events table - log all trigger events
CREATE TABLE IF NOT EXISTS workflow_trigger_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  trigger_type VARCHAR(100) NOT NULL,
  event_source VARCHAR(100) NOT NULL,
  event_data JSONB NOT NULL,
  matched_templates INT DEFAULT 0,
  instances_created INT DEFAULT 0,
  processed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Workflow Conditions table - complex conditional logic
CREATE TABLE IF NOT EXISTS workflow_conditions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  template_id UUID REFERENCES workflow_templates(id) ON DELETE CASCADE NOT NULL,
  condition_group VARCHAR(100) DEFAULT 'default',
  condition_type VARCHAR(100) NOT NULL, -- 'field_equals', 'field_greater_than', 'time_range', 'role_check', etc.
  field_path VARCHAR(255), -- JSON path for field access
  operator VARCHAR(50) NOT NULL, -- 'equals', 'greater_than', 'less_than', 'contains', 'in_range'
  comparison_value JSONB, -- Value to compare against
  is_required BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Workflow Actions Queue table - queue actions for execution
CREATE TABLE IF NOT EXISTS workflow_action_queue (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  instance_id UUID REFERENCES workflow_instances(id) ON DELETE CASCADE NOT NULL,
  step_execution_id UUID REFERENCES workflow_step_executions(id) ON DELETE CASCADE,
  action_type VARCHAR(100) NOT NULL,
  action_config JSONB NOT NULL,
  priority INTEGER DEFAULT 5,
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  scheduled_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Workflow Triggers Configuration table - enhanced trigger setup
CREATE TABLE IF NOT EXISTS workflow_trigger_config (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  template_id UUID REFERENCES workflow_templates(id) ON DELETE CASCADE NOT NULL,
  trigger_name VARCHAR(255) NOT NULL,
  trigger_type VARCHAR(100) NOT NULL,
  event_source VARCHAR(100) NOT NULL,
  conditions JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  cooldown_minutes INTEGER DEFAULT 0, -- Prevent duplicate triggers
  last_triggered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_workflow_trigger_events_org_type ON workflow_trigger_events(organization_id, trigger_type);
CREATE INDEX IF NOT EXISTS idx_workflow_trigger_events_processed ON workflow_trigger_events(processed_at);
CREATE INDEX IF NOT EXISTS idx_workflow_conditions_template ON workflow_conditions(template_id);
CREATE INDEX IF NOT EXISTS idx_workflow_action_queue_status ON workflow_action_queue(status, scheduled_at);
CREATE INDEX IF NOT EXISTS idx_workflow_action_queue_org ON workflow_action_queue(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_workflow_trigger_config_org_active ON workflow_trigger_config(organization_id, is_active);

-- Enable RLS
ALTER TABLE workflow_trigger_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_conditions ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_action_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_trigger_config ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Organizations can view their trigger events" ON workflow_trigger_events
  FOR SELECT USING (organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Organizations can view their workflow conditions" ON workflow_conditions
  FOR SELECT USING (EXISTS (SELECT 1 FROM workflow_templates wt WHERE wt.id = template_id AND 
                           wt.organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid())));

CREATE POLICY "Managers can manage workflow conditions" ON workflow_conditions
  FOR ALL USING (EXISTS (SELECT 1 FROM workflow_templates wt WHERE wt.id = template_id AND 
                        wt.organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid()) AND 
                        (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'manager')));

CREATE POLICY "Organizations can view their action queue" ON workflow_action_queue
  FOR SELECT USING (organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Organizations can view their trigger config" ON workflow_trigger_config
  FOR SELECT USING (organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Managers can manage trigger config" ON workflow_trigger_config
  FOR ALL USING (organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid()) AND 
                 (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'manager'));

-- Enhanced trigger workflow function
CREATE OR REPLACE FUNCTION enhanced_trigger_workflow(
  p_trigger_type VARCHAR,
  p_event_source VARCHAR,
  p_event_data JSONB,
  p_organization_id UUID
) RETURNS TABLE(instances_created INT, templates_matched INT) AS $$
DECLARE
  template_rec RECORD;
  condition_rec RECORD;
  new_instance_id UUID;
  conditions_met BOOLEAN;
  field_value JSONB;
  total_instances INT := 0;
  total_templates INT := 0;
  cooldown_check TIMESTAMPTZ;
BEGIN
  -- Log the trigger event
  INSERT INTO workflow_trigger_events (
    organization_id, trigger_type, event_source, event_data
  ) VALUES (
    p_organization_id, p_trigger_type, p_event_source, p_event_data
  );

  -- Find matching workflow trigger configurations
  FOR template_rec IN 
    SELECT wtc.*, wt.name as template_name
    FROM workflow_trigger_config wtc
    JOIN workflow_templates wt ON wt.id = wtc.template_id
    WHERE wtc.organization_id = p_organization_id 
      AND wtc.is_active = true
      AND wtc.trigger_type = p_trigger_type
      AND wtc.event_source = p_event_source
      AND wt.is_active = true
  LOOP
    -- Check cooldown period
    IF template_rec.cooldown_minutes > 0 AND template_rec.last_triggered_at IS NOT NULL THEN
      cooldown_check := template_rec.last_triggered_at + INTERVAL '1 minute' * template_rec.cooldown_minutes;
      IF NOW() < cooldown_check THEN
        CONTINUE; -- Skip this template due to cooldown
      END IF;
    END IF;

    conditions_met := true;

    -- Check all conditions for this template
    FOR condition_rec IN 
      SELECT * FROM workflow_conditions 
      WHERE template_id = template_rec.template_id
    LOOP
      -- Extract field value from event data
      field_value := p_event_data #> string_to_array(condition_rec.field_path, '.');
      
      -- Evaluate condition based on operator
      CASE condition_rec.operator
        WHEN 'equals' THEN
          IF field_value != condition_rec.comparison_value THEN
            conditions_met := false;
          END IF;
        WHEN 'greater_than' THEN
          IF (field_value::numeric) <= (condition_rec.comparison_value::numeric) THEN
            conditions_met := false;
          END IF;
        WHEN 'less_than' THEN
          IF (field_value::numeric) >= (condition_rec.comparison_value::numeric) THEN
            conditions_met := false;
          END IF;
        WHEN 'contains' THEN
          IF field_value::text NOT LIKE '%' || (condition_rec.comparison_value::text) || '%' THEN
            conditions_met := false;
          END IF;
        WHEN 'in_array' THEN
          IF NOT (field_value <@ condition_rec.comparison_value) THEN
            conditions_met := false;
          END IF;
        ELSE
          -- Unknown operator, skip condition
          NULL;
      END CASE;

      -- If required condition not met, exit early
      IF NOT conditions_met AND condition_rec.is_required THEN
        EXIT;
      END IF;
    END LOOP;

    -- If all conditions met, create workflow instance
    IF conditions_met THEN
      INSERT INTO workflow_instances (
        organization_id, template_id, name, trigger_data, context_data, status
      ) VALUES (
        p_organization_id, template_rec.template_id, template_rec.template_name, 
        p_event_data, jsonb_build_object('trigger_config_id', template_rec.id), 'active'
      ) RETURNING id INTO new_instance_id;
      
      -- Update last triggered timestamp
      UPDATE workflow_trigger_config 
      SET last_triggered_at = NOW() 
      WHERE id = template_rec.id;
      
      total_instances := total_instances + 1;
    END IF;
    
    total_templates := total_templates + 1;
  END LOOP;

  -- Update the trigger event with results
  UPDATE workflow_trigger_events 
  SET matched_templates = total_templates, instances_created = total_instances
  WHERE organization_id = p_organization_id 
    AND trigger_type = p_trigger_type 
    AND event_source = p_event_source
    AND processed_at >= NOW() - INTERVAL '1 minute';

  instances_created := total_instances;
  templates_matched := total_templates;
  RETURN NEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to process workflow action queue
CREATE OR REPLACE FUNCTION process_workflow_action_queue()
RETURNS INT AS $$
DECLARE
  action_rec RECORD;
  processed_count INT := 0;
BEGIN
  -- Process pending actions in priority order
  FOR action_rec IN 
    SELECT * FROM workflow_action_queue 
    WHERE status = 'pending' 
      AND scheduled_at <= NOW()
    ORDER BY priority DESC, created_at ASC
    LIMIT 50  -- Process in batches
  LOOP
    -- Update status to processing
    UPDATE workflow_action_queue 
    SET status = 'processing', started_at = NOW()
    WHERE id = action_rec.id;
    
    -- Here you would implement specific action processors
    -- For now, we'll just mark as completed
    -- In a real implementation, this would call specific action handlers
    
    UPDATE workflow_action_queue 
    SET status = 'completed', completed_at = NOW()
    WHERE id = action_rec.id;
    
    processed_count := processed_count + 1;
  END LOOP;
  
  RETURN processed_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert sample workflow conditions for existing templates
INSERT INTO workflow_conditions (template_id, condition_type, field_path, operator, comparison_value)
SELECT 
  wt.id,
  'field_equals',
  'type',
  'equals',
  '"check_in"'::jsonb
FROM workflow_templates wt
WHERE wt.trigger_config->>'trigger_type' = 'attendance_late'
ON CONFLICT DO NOTHING;

-- Insert sample trigger configurations
INSERT INTO workflow_trigger_config (organization_id, template_id, trigger_name, trigger_type, event_source, conditions)
SELECT 
  wt.organization_id,
  wt.id,
  wt.name || ' Trigger',
  CASE wt.category
    WHEN 'attendance' THEN 'attendance_event'
    WHEN 'leave' THEN 'leave_event'
    WHEN 'tasks' THEN 'task_event'
    WHEN 'forms' THEN 'form_event'
    ELSE 'general_event'
  END,
  wt.category,
  '[]'::jsonb
FROM workflow_templates wt
ON CONFLICT DO NOTHING;

-- Grant permissions
GRANT EXECUTE ON FUNCTION enhanced_trigger_workflow TO authenticated;
GRANT EXECUTE ON FUNCTION process_workflow_action_queue TO authenticated;