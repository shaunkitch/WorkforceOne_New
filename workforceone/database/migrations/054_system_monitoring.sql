-- =============================================
-- SYSTEM MONITORING AND ALERTING
-- =============================================

-- Alert severity levels
CREATE TYPE alert_severity AS ENUM (
  'info',
  'warning', 
  'critical',
  'error'
);

-- Alert status
CREATE TYPE alert_status AS ENUM (
  'active',
  'resolved',
  'acknowledged',
  'suppressed'
);

-- Monitoring metric types
CREATE TYPE metric_type AS ENUM (
  'database_cpu',
  'database_memory',
  'database_storage',
  'database_connections',
  'database_response_time',
  'vercel_cpu',
  'vercel_memory',
  'vercel_requests',
  'vercel_response_time',
  'vercel_errors',
  'application_errors',
  'user_activity',
  'api_latency'
);

-- System metrics table
CREATE TABLE IF NOT EXISTS public.system_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_type metric_type NOT NULL,
  value DECIMAL(15, 4) NOT NULL,
  unit VARCHAR(20) NOT NULL, -- %, MB, ms, count, etc.
  threshold_warning DECIMAL(15, 4),
  threshold_critical DECIMAL(15, 4),
  source VARCHAR(100) NOT NULL, -- 'supabase', 'vercel', 'application'
  metadata JSONB DEFAULT '{}'::jsonb,
  recorded_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- System alerts table
CREATE TABLE IF NOT EXISTS public.system_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  severity alert_severity NOT NULL,
  status alert_status DEFAULT 'active',
  metric_type metric_type,
  current_value DECIMAL(15, 4),
  threshold_value DECIMAL(15, 4),
  source VARCHAR(100) NOT NULL,
  affected_components TEXT[],
  metadata JSONB DEFAULT '{}'::jsonb,
  first_seen_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  last_seen_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  resolved_at TIMESTAMPTZ,
  acknowledged_at TIMESTAMPTZ,
  acknowledged_by VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Alert rules table for configurable thresholds
CREATE TABLE IF NOT EXISTS public.alert_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  metric_type metric_type NOT NULL,
  warning_threshold DECIMAL(15, 4),
  critical_threshold DECIMAL(15, 4),
  comparison_operator VARCHAR(10) DEFAULT '>',  -- '>', '<', '>=', '<=', '='
  evaluation_window_minutes INTEGER DEFAULT 5,
  is_enabled BOOLEAN DEFAULT true,
  notification_channels TEXT[] DEFAULT '{"dashboard", "email"}',
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- System health snapshots for historical tracking
CREATE TABLE IF NOT EXISTS public.system_health_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  overall_health_score INTEGER CHECK (overall_health_score >= 0 AND overall_health_score <= 100),
  database_health_score INTEGER CHECK (database_health_score >= 0 AND database_health_score <= 100),
  application_health_score INTEGER CHECK (application_health_score >= 0 AND application_health_score <= 100),
  infrastructure_health_score INTEGER CHECK (infrastructure_health_score >= 0 AND infrastructure_health_score <= 100),
  active_alerts_count INTEGER DEFAULT 0,
  critical_alerts_count INTEGER DEFAULT 0,
  warning_alerts_count INTEGER DEFAULT 0,
  metrics_summary JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_system_metrics_type_time 
ON system_metrics(metric_type, recorded_at DESC);

CREATE INDEX IF NOT EXISTS idx_system_metrics_source_time 
ON system_metrics(source, recorded_at DESC);

CREATE INDEX IF NOT EXISTS idx_system_alerts_status_severity 
ON system_alerts(status, severity);

CREATE INDEX IF NOT EXISTS idx_system_alerts_metric_type 
ON system_alerts(metric_type);

CREATE INDEX IF NOT EXISTS idx_system_alerts_created_at 
ON system_alerts(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_alert_rules_metric_type 
ON alert_rules(metric_type);

CREATE INDEX IF NOT EXISTS idx_health_snapshots_created_at 
ON system_health_snapshots(created_at DESC);

-- Function to record system metric
CREATE OR REPLACE FUNCTION record_system_metric(
  p_metric_type metric_type,
  p_value DECIMAL(15, 4),
  p_unit VARCHAR(20),
  p_source VARCHAR(100),
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID AS $$
DECLARE
  metric_id UUID;
  alert_rule RECORD;
  should_alert BOOLEAN := false;
  alert_severity alert_severity;
BEGIN
  -- Insert the metric
  INSERT INTO system_metrics (metric_type, value, unit, source, metadata)
  VALUES (p_metric_type, p_value, p_unit, p_source, p_metadata)
  RETURNING id INTO metric_id;
  
  -- Check for alert rules
  FOR alert_rule IN 
    SELECT * FROM alert_rules 
    WHERE metric_type = p_metric_type AND is_enabled = true
  LOOP
    -- Evaluate thresholds
    IF alert_rule.critical_threshold IS NOT NULL THEN
      CASE alert_rule.comparison_operator
        WHEN '>' THEN
          IF p_value > alert_rule.critical_threshold THEN
            should_alert := true;
            alert_severity := 'critical';
          END IF;
        WHEN '<' THEN
          IF p_value < alert_rule.critical_threshold THEN
            should_alert := true;
            alert_severity := 'critical';
          END IF;
        WHEN '>=' THEN
          IF p_value >= alert_rule.critical_threshold THEN
            should_alert := true;
            alert_severity := 'critical';
          END IF;
        WHEN '<=' THEN
          IF p_value <= alert_rule.critical_threshold THEN
            should_alert := true;
            alert_severity := 'critical';
          END IF;
      END CASE;
    END IF;
    
    -- Check warning threshold if not already critical
    IF NOT should_alert AND alert_rule.warning_threshold IS NOT NULL THEN
      CASE alert_rule.comparison_operator
        WHEN '>' THEN
          IF p_value > alert_rule.warning_threshold THEN
            should_alert := true;
            alert_severity := 'warning';
          END IF;
        WHEN '<' THEN
          IF p_value < alert_rule.warning_threshold THEN
            should_alert := true;
            alert_severity := 'warning';
          END IF;
        WHEN '>=' THEN
          IF p_value >= alert_rule.warning_threshold THEN
            should_alert := true;
            alert_severity := 'warning';
          END IF;
        WHEN '<=' THEN
          IF p_value <= alert_rule.warning_threshold THEN
            should_alert := true;
            alert_severity := 'warning';
          END IF;
      END CASE;
    END IF;
    
    -- Create alert if threshold exceeded
    IF should_alert THEN
      INSERT INTO system_alerts (
        title,
        description,
        severity,
        metric_type,
        current_value,
        threshold_value,
        source,
        metadata
      ) VALUES (
        alert_rule.name || ' threshold exceeded',
        format('Metric %s has value %s which exceeds %s threshold of %s', 
               p_metric_type, p_value, alert_severity, 
               CASE WHEN alert_severity = 'critical' THEN alert_rule.critical_threshold 
                    ELSE alert_rule.warning_threshold END),
        alert_severity,
        p_metric_type,
        p_value,
        CASE WHEN alert_severity = 'critical' THEN alert_rule.critical_threshold 
             ELSE alert_rule.warning_threshold END,
        p_source,
        jsonb_build_object('rule_id', alert_rule.id, 'metric_id', metric_id)
      );
    END IF;
  END LOOP;
  
  RETURN metric_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate system health score
CREATE OR REPLACE FUNCTION calculate_system_health_score()
RETURNS JSONB AS $$
DECLARE
  db_health INTEGER := 100;
  app_health INTEGER := 100;
  infra_health INTEGER := 100;
  overall_health INTEGER;
  critical_count INTEGER;
  warning_count INTEGER;
  active_count INTEGER;
  recent_metrics RECORD;
BEGIN
  -- Count current alerts
  SELECT 
    COUNT(*) FILTER (WHERE severity = 'critical' AND status = 'active') as critical,
    COUNT(*) FILTER (WHERE severity = 'warning' AND status = 'active') as warning,
    COUNT(*) FILTER (WHERE status = 'active') as active
  INTO critical_count, warning_count, active_count
  FROM system_alerts;
  
  -- Reduce health based on alerts
  db_health := db_health - (critical_count * 25) - (warning_count * 10);
  app_health := app_health - (critical_count * 20) - (warning_count * 8);
  infra_health := infra_health - (critical_count * 30) - (warning_count * 12);
  
  -- Check recent metrics for additional health factors
  FOR recent_metrics IN
    SELECT metric_type, value, threshold_warning, threshold_critical
    FROM system_metrics 
    WHERE recorded_at >= CURRENT_TIMESTAMP - INTERVAL '5 minutes'
    ORDER BY recorded_at DESC
    LIMIT 20
  LOOP
    -- Additional health adjustments based on specific metrics
    IF recent_metrics.metric_type IN ('database_cpu', 'database_memory', 'database_storage') THEN
      IF recent_metrics.threshold_critical IS NOT NULL AND recent_metrics.value >= recent_metrics.threshold_critical THEN
        db_health := db_health - 15;
      ELSIF recent_metrics.threshold_warning IS NOT NULL AND recent_metrics.value >= recent_metrics.threshold_warning THEN
        db_health := db_health - 5;
      END IF;
    END IF;
  END LOOP;
  
  -- Ensure health scores are within bounds
  db_health := GREATEST(0, LEAST(100, db_health));
  app_health := GREATEST(0, LEAST(100, app_health));
  infra_health := GREATEST(0, LEAST(100, infra_health));
  
  -- Calculate overall health (weighted average)
  overall_health := ROUND((db_health * 0.4 + app_health * 0.3 + infra_health * 0.3)::numeric);
  
  -- Insert health snapshot
  INSERT INTO system_health_snapshots (
    overall_health_score,
    database_health_score,
    application_health_score,
    infrastructure_health_score,
    active_alerts_count,
    critical_alerts_count,
    warning_alerts_count,
    metrics_summary
  ) VALUES (
    overall_health,
    db_health,
    app_health,
    infra_health,
    active_count,
    critical_count,
    warning_count,
    jsonb_build_object(
      'timestamp', CURRENT_TIMESTAMP,
      'total_metrics_last_hour', (
        SELECT COUNT(*) FROM system_metrics 
        WHERE recorded_at >= CURRENT_TIMESTAMP - INTERVAL '1 hour'
      )
    )
  );
  
  RETURN jsonb_build_object(
    'overall_health', overall_health,
    'database_health', db_health,
    'application_health', app_health,
    'infrastructure_health', infra_health,
    'active_alerts', active_count,
    'critical_alerts', critical_count,
    'warning_alerts', warning_count
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get current system status
CREATE OR REPLACE FUNCTION get_system_status()
RETURNS JSONB AS $$
DECLARE
  result JSONB;
  recent_metrics JSONB;
  active_alerts JSONB;
BEGIN
  -- Get recent metrics summary
  SELECT jsonb_agg(
    jsonb_build_object(
      'metric_type', metric_type,
      'value', value,
      'unit', unit,
      'source', source,
      'recorded_at', recorded_at
    )
  ) INTO recent_metrics
  FROM (
    SELECT DISTINCT ON (metric_type) 
      metric_type, value, unit, source, recorded_at
    FROM system_metrics 
    WHERE recorded_at >= CURRENT_TIMESTAMP - INTERVAL '10 minutes'
    ORDER BY metric_type, recorded_at DESC
  ) latest_metrics;
  
  -- Get active alerts
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', id,
      'title', title,
      'severity', severity,
      'metric_type', metric_type,
      'current_value', current_value,
      'source', source,
      'first_seen_at', first_seen_at
    )
  ) INTO active_alerts
  FROM system_alerts 
  WHERE status = 'active'
  ORDER BY severity DESC, first_seen_at DESC;
  
  -- Build result
  result := jsonb_build_object(
    'health_score', calculate_system_health_score(),
    'recent_metrics', COALESCE(recent_metrics, '[]'::jsonb),
    'active_alerts', COALESCE(active_alerts, '[]'::jsonb),
    'last_updated', CURRENT_TIMESTAMP
  );
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert default alert rules
INSERT INTO alert_rules (name, metric_type, warning_threshold, critical_threshold, comparison_operator) VALUES
('Database CPU Usage', 'database_cpu', 70, 90, '>'),
('Database Memory Usage', 'database_memory', 80, 95, '>'),
('Database Storage Usage', 'database_storage', 85, 95, '>'),
('Database Connection Count', 'database_connections', 80, 95, '>'),
('Database Response Time', 'database_response_time', 500, 1000, '>'),
('Vercel CPU Usage', 'vercel_cpu', 75, 90, '>'),
('Vercel Memory Usage', 'vercel_memory', 80, 95, '>'),
('Vercel Error Rate', 'vercel_errors', 5, 10, '>'),
('API Response Time', 'api_latency', 1000, 2000, '>'),
('Application Errors', 'application_errors', 10, 25, '>');

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON system_metrics TO authenticated;
GRANT SELECT, INSERT, UPDATE ON system_alerts TO authenticated;
GRANT SELECT ON alert_rules TO authenticated;
GRANT SELECT ON system_health_snapshots TO authenticated;

GRANT ALL ON system_metrics TO service_role;
GRANT ALL ON system_alerts TO service_role;
GRANT ALL ON alert_rules TO service_role;
GRANT ALL ON system_health_snapshots TO service_role;

GRANT EXECUTE ON FUNCTION record_system_metric TO service_role;
GRANT EXECUTE ON FUNCTION calculate_system_health_score TO service_role;
GRANT EXECUTE ON FUNCTION get_system_status TO service_role;
GRANT EXECUTE ON FUNCTION get_system_status TO authenticated;

-- Enable RLS
ALTER TABLE system_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_health_snapshots ENABLE ROW LEVEL SECURITY;

-- RLS policies (global admin access)
CREATE POLICY "Global admin access to system_metrics" ON system_metrics FOR ALL USING (true);
CREATE POLICY "Global admin access to system_alerts" ON system_alerts FOR ALL USING (true);
CREATE POLICY "Global admin access to alert_rules" ON alert_rules FOR ALL USING (true);
CREATE POLICY "Global admin access to system_health_snapshots" ON system_health_snapshots FOR ALL USING (true);

-- Comments
COMMENT ON TABLE system_metrics IS 'Real-time system metrics for monitoring';
COMMENT ON TABLE system_alerts IS 'System alerts and notifications';
COMMENT ON TABLE alert_rules IS 'Configurable alerting rules and thresholds';
COMMENT ON TABLE system_health_snapshots IS 'Historical system health scores';

COMMENT ON FUNCTION record_system_metric IS 'Record a system metric and evaluate alert rules';
COMMENT ON FUNCTION calculate_system_health_score IS 'Calculate current system health scores';
COMMENT ON FUNCTION get_system_status IS 'Get comprehensive system status including metrics and alerts';