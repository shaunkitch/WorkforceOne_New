-- Migration 083: Guard KPI Targets System
-- Create comprehensive KPI management system for guards

-- Create guard_kpi_targets table
CREATE TABLE IF NOT EXISTS guard_kpi_targets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    guard_id UUID REFERENCES profiles(id) ON DELETE CASCADE, -- NULL means organization-wide default
    target_type VARCHAR(50) NOT NULL CHECK (target_type IN ('check_ins', 'patrols', 'incidents', 'daily_reports')),
    target_value INTEGER NOT NULL DEFAULT 0,
    target_period VARCHAR(20) NOT NULL DEFAULT 'daily' CHECK (target_period IN ('daily', 'weekly', 'monthly')),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure unique targets per guard/organization per type
    UNIQUE(organization_id, guard_id, target_type, target_period)
);

-- Create guard_kpi_performance table for tracking actual performance
CREATE TABLE IF NOT EXISTS guard_kpi_performance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    guard_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    performance_date DATE NOT NULL DEFAULT CURRENT_DATE,
    check_ins_completed INTEGER DEFAULT 0,
    patrols_completed INTEGER DEFAULT 0,
    incidents_reported INTEGER DEFAULT 0,
    daily_reports_submitted INTEGER DEFAULT 0,
    overall_score DECIMAL(5,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Unique performance record per guard per date
    UNIQUE(guard_id, organization_id, performance_date)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_guard_kpi_targets_organization_id ON guard_kpi_targets(organization_id);
CREATE INDEX IF NOT EXISTS idx_guard_kpi_targets_guard_id ON guard_kpi_targets(guard_id);
CREATE INDEX IF NOT EXISTS idx_guard_kpi_targets_type ON guard_kpi_targets(target_type);

CREATE INDEX IF NOT EXISTS idx_guard_kpi_performance_guard_id ON guard_kpi_performance(guard_id);
CREATE INDEX IF NOT EXISTS idx_guard_kpi_performance_organization_id ON guard_kpi_performance(organization_id);
CREATE INDEX IF NOT EXISTS idx_guard_kpi_performance_date ON guard_kpi_performance(performance_date);

-- Create function to calculate overall KPI score
CREATE OR REPLACE FUNCTION calculate_guard_kpi_score(
    p_guard_id UUID,
    p_date DATE DEFAULT CURRENT_DATE
)
RETURNS DECIMAL(5,2) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    performance_record RECORD;
    target_record RECORD;
    total_score DECIMAL(5,2) := 0;
    target_count INTEGER := 0;
BEGIN
    -- Get performance data for the date
    SELECT * INTO performance_record
    FROM guard_kpi_performance
    WHERE guard_id = p_guard_id AND performance_date = p_date;
    
    -- If no performance data, return 0
    IF performance_record IS NULL THEN
        RETURN 0;
    END IF;
    
    -- Calculate score for each KPI type
    FOR target_record IN (
        SELECT target_type, target_value
        FROM guard_kpi_targets gkt
        JOIN profiles p ON p.id = p_guard_id
        WHERE (gkt.guard_id = p_guard_id OR gkt.guard_id IS NULL)
        AND gkt.organization_id = p.organization_id
        AND gkt.target_period = 'daily'
        AND gkt.is_active = true
        ORDER BY gkt.guard_id NULLS LAST -- Specific targets override organization defaults
    ) LOOP
        target_count := target_count + 1;
        
        CASE target_record.target_type
            WHEN 'check_ins' THEN
                total_score := total_score + LEAST(100, (performance_record.check_ins_completed::DECIMAL / target_record.target_value * 100));
            WHEN 'patrols' THEN
                total_score := total_score + LEAST(100, (performance_record.patrols_completed::DECIMAL / target_record.target_value * 100));
            WHEN 'incidents' THEN
                total_score := total_score + LEAST(100, (performance_record.incidents_reported::DECIMAL / target_record.target_value * 100));
            WHEN 'daily_reports' THEN
                total_score := total_score + LEAST(100, (performance_record.daily_reports_submitted::DECIMAL / target_record.target_value * 100));
        END CASE;
    END LOOP;
    
    -- Return average score or 0 if no targets
    RETURN CASE WHEN target_count > 0 THEN total_score / target_count ELSE 0 END;
END;
$$;

-- Create function to update guard KPI performance
CREATE OR REPLACE FUNCTION update_guard_kpi_performance(
    p_guard_id UUID,
    p_kpi_type VARCHAR(50),
    p_increment INTEGER DEFAULT 1,
    p_date DATE DEFAULT CURRENT_DATE
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    guard_org_id UUID;
BEGIN
    -- Get guard's organization ID
    SELECT organization_id INTO guard_org_id
    FROM profiles
    WHERE id = p_guard_id;
    
    IF guard_org_id IS NULL THEN
        RAISE EXCEPTION 'Guard not found or no organization assigned';
    END IF;
    
    -- Insert or update performance record
    INSERT INTO guard_kpi_performance (
        guard_id,
        organization_id,
        performance_date,
        check_ins_completed,
        patrols_completed,
        incidents_reported,
        daily_reports_submitted
    )
    VALUES (
        p_guard_id,
        guard_org_id,
        p_date,
        CASE WHEN p_kpi_type = 'check_ins' THEN p_increment ELSE 0 END,
        CASE WHEN p_kpi_type = 'patrols' THEN p_increment ELSE 0 END,
        CASE WHEN p_kpi_type = 'incidents' THEN p_increment ELSE 0 END,
        CASE WHEN p_kpi_type = 'daily_reports' THEN p_increment ELSE 0 END
    )
    ON CONFLICT (guard_id, organization_id, performance_date)
    DO UPDATE SET
        check_ins_completed = CASE 
            WHEN p_kpi_type = 'check_ins' THEN guard_kpi_performance.check_ins_completed + p_increment
            ELSE guard_kpi_performance.check_ins_completed
        END,
        patrols_completed = CASE 
            WHEN p_kpi_type = 'patrols' THEN guard_kpi_performance.patrols_completed + p_increment
            ELSE guard_kpi_performance.patrols_completed
        END,
        incidents_reported = CASE 
            WHEN p_kpi_type = 'incidents' THEN guard_kpi_performance.incidents_reported + p_increment
            ELSE guard_kpi_performance.incidents_reported
        END,
        daily_reports_submitted = CASE 
            WHEN p_kpi_type = 'daily_reports' THEN guard_kpi_performance.daily_reports_submitted + p_increment
            ELSE guard_kpi_performance.daily_reports_submitted
        END,
        overall_score = calculate_guard_kpi_score(p_guard_id, p_date),
        updated_at = NOW();
END;
$$;

-- Create RLS policies for guard_kpi_targets
ALTER TABLE guard_kpi_targets ENABLE ROW LEVEL SECURITY;

CREATE POLICY guard_kpi_targets_org_isolation ON guard_kpi_targets
    FOR ALL USING (
        organization_id IN (
            SELECT p.organization_id 
            FROM profiles p 
            WHERE p.id = auth.uid()
        )
    );

-- Create RLS policies for guard_kpi_performance
ALTER TABLE guard_kpi_performance ENABLE ROW LEVEL SECURITY;

CREATE POLICY guard_kpi_performance_org_isolation ON guard_kpi_performance
    FOR ALL USING (
        organization_id IN (
            SELECT p.organization_id 
            FROM profiles p 
            WHERE p.id = auth.uid()
        )
        OR guard_id = auth.uid() -- Guards can see their own performance
    );

-- Insert default organization-wide KPI targets
INSERT INTO guard_kpi_targets (organization_id, guard_id, target_type, target_value, target_period, is_active)
SELECT 
    o.id,
    NULL, -- Organization-wide default
    target_type,
    target_value,
    'daily',
    true
FROM organizations o
CROSS JOIN (
    VALUES 
        ('check_ins', 8),
        ('patrols', 2),
        ('incidents', 1),
        ('daily_reports', 1)
) AS defaults(target_type, target_value)
ON CONFLICT (organization_id, guard_id, target_type, target_period) DO NOTHING;

-- Add triggers to automatically update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_guard_kpi_targets_updated_at 
    BEFORE UPDATE ON guard_kpi_targets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_guard_kpi_performance_updated_at 
    BEFORE UPDATE ON guard_kpi_performance
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions
GRANT ALL ON guard_kpi_targets TO authenticated;
GRANT ALL ON guard_kpi_performance TO authenticated;

-- Create view for easy KPI reporting
CREATE OR REPLACE VIEW guard_kpi_dashboard AS
SELECT 
    p.id as guard_id,
    p.full_name as guard_name,
    p.email as guard_email,
    p.organization_id,
    o.name as organization_name,
    
    -- Current day performance
    COALESCE(perf.check_ins_completed, 0) as check_ins_today,
    COALESCE(perf.patrols_completed, 0) as patrols_today,
    COALESCE(perf.incidents_reported, 0) as incidents_today,
    COALESCE(perf.daily_reports_submitted, 0) as reports_today,
    
    -- Targets
    COALESCE(t_checkins.target_value, 8) as check_ins_target,
    COALESCE(t_patrols.target_value, 2) as patrols_target,
    COALESCE(t_incidents.target_value, 1) as incidents_target,
    COALESCE(t_reports.target_value, 1) as reports_target,
    
    -- Performance percentages
    ROUND(
        CASE 
            WHEN COALESCE(t_checkins.target_value, 8) > 0 
            THEN (COALESCE(perf.check_ins_completed, 0)::DECIMAL / COALESCE(t_checkins.target_value, 8)) * 100 
            ELSE 0 
        END, 2
    ) as check_ins_percentage,
    
    ROUND(
        CASE 
            WHEN COALESCE(t_patrols.target_value, 2) > 0 
            THEN (COALESCE(perf.patrols_completed, 0)::DECIMAL / COALESCE(t_patrols.target_value, 2)) * 100 
            ELSE 0 
        END, 2
    ) as patrols_percentage,
    
    ROUND(
        CASE 
            WHEN COALESCE(t_incidents.target_value, 1) > 0 
            THEN (COALESCE(perf.incidents_reported, 0)::DECIMAL / COALESCE(t_incidents.target_value, 1)) * 100 
            ELSE 0 
        END, 2
    ) as incidents_percentage,
    
    ROUND(
        CASE 
            WHEN COALESCE(t_reports.target_value, 1) > 0 
            THEN (COALESCE(perf.daily_reports_submitted, 0)::DECIMAL / COALESCE(t_reports.target_value, 1)) * 100 
            ELSE 0 
        END, 2
    ) as reports_percentage,
    
    COALESCE(perf.overall_score, 0) as overall_score,
    perf.performance_date,
    perf.updated_at as last_updated

FROM profiles p
JOIN organizations o ON o.id = p.organization_id
JOIN user_products up ON up.user_id = p.id AND up.product_id = 'guard-management' AND up.is_active = true
LEFT JOIN guard_kpi_performance perf ON perf.guard_id = p.id AND perf.performance_date = CURRENT_DATE
LEFT JOIN guard_kpi_targets t_checkins ON (t_checkins.guard_id = p.id OR (t_checkins.guard_id IS NULL AND t_checkins.organization_id = p.organization_id)) 
    AND t_checkins.target_type = 'check_ins' AND t_checkins.target_period = 'daily' AND t_checkins.is_active = true
LEFT JOIN guard_kpi_targets t_patrols ON (t_patrols.guard_id = p.id OR (t_patrols.guard_id IS NULL AND t_patrols.organization_id = p.organization_id)) 
    AND t_patrols.target_type = 'patrols' AND t_patrols.target_period = 'daily' AND t_patrols.is_active = true
LEFT JOIN guard_kpi_targets t_incidents ON (t_incidents.guard_id = p.id OR (t_incidents.guard_id IS NULL AND t_incidents.organization_id = p.organization_id)) 
    AND t_incidents.target_type = 'incidents' AND t_incidents.target_period = 'daily' AND t_incidents.is_active = true
LEFT JOIN guard_kpi_targets t_reports ON (t_reports.guard_id = p.id OR (t_reports.guard_id IS NULL AND t_reports.organization_id = p.organization_id)) 
    AND t_reports.target_type = 'daily_reports' AND t_reports.target_period = 'daily' AND t_reports.is_active = true
WHERE p.is_active = true;

GRANT SELECT ON guard_kpi_dashboard TO authenticated;