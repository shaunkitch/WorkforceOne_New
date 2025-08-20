-- =============================================
-- Mobile Notifications System
-- Create comprehensive notification and messaging system
-- =============================================

-- Device tokens for push notifications
CREATE TABLE IF NOT EXISTS device_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    token TEXT NOT NULL,
    platform VARCHAR(20) NOT NULL CHECK (platform IN ('ios', 'android', 'web')),
    device_info JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    last_used TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, token)
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('form_assignment', 'task_assignment', 'announcement', 'reminder', 'system')),
    priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    data JSONB DEFAULT '{}',
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    read_at TIMESTAMP WITH TIME ZONE,
    is_read BOOLEAN DEFAULT false,
    delivery_status VARCHAR(20) DEFAULT 'pending' CHECK (delivery_status IN ('pending', 'sent', 'delivered', 'failed')),
    scheduled_for TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- In-app messages table
CREATE TABLE IF NOT EXISTS in_app_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    recipient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    subject VARCHAR(255),
    message TEXT NOT NULL,
    message_type VARCHAR(20) DEFAULT 'direct' CHECK (message_type IN ('direct', 'announcement', 'system')),
    priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    attachments JSONB DEFAULT '[]',
    parent_message_id UUID REFERENCES in_app_messages(id) ON DELETE CASCADE,
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP WITH TIME ZONE,
    archived BOOLEAN DEFAULT false,
    archived_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Message participants for group messages
CREATE TABLE IF NOT EXISTS message_participants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    message_id UUID NOT NULL REFERENCES in_app_messages(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP WITH TIME ZONE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(message_id, user_id)
);

-- Notification templates
CREATE TABLE IF NOT EXISTS notification_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,
    title_template TEXT NOT NULL,
    body_template TEXT NOT NULL,
    variables JSONB DEFAULT '[]',
    is_active BOOLEAN DEFAULT true,
    created_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(organization_id, name, type)
);

-- User notification preferences
CREATE TABLE IF NOT EXISTS notification_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    notification_type VARCHAR(50) NOT NULL,
    push_enabled BOOLEAN DEFAULT true,
    email_enabled BOOLEAN DEFAULT true,
    in_app_enabled BOOLEAN DEFAULT true,
    quiet_hours_start TIME,
    quiet_hours_end TIME,
    timezone VARCHAR(50) DEFAULT 'UTC',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, organization_id, notification_type)
);

-- The form_assignments table already has the required structure:
-- assigned_to_user_id, assigned_to_team_id, assigned_to_role, assigned_to_department
-- No need to add columns, they already exist!

-- Fix form_assignments to properly link individual assignments
-- Create individual form assignments from team/role/department assignments
CREATE OR REPLACE FUNCTION expand_form_assignments()
RETURNS TRIGGER AS $$
DECLARE
    user_record RECORD;
    assignment_record RECORD;
BEGIN
    -- Only process if this is a team, role, or department assignment
    IF NEW.assigned_to_user_id IS NOT NULL THEN
        RETURN NEW; -- Individual assignment, no expansion needed
    END IF;

    -- Expand team assignments
    IF NEW.assigned_to_team_id IS NOT NULL THEN
        FOR user_record IN 
            SELECT DISTINCT p.id as user_id
            FROM team_members tm
            JOIN profiles p ON p.id = tm.user_id
            WHERE tm.team_id = NEW.assigned_to_team_id
            AND p.organization_id = NEW.organization_id
            AND p.is_active = true
        LOOP
            INSERT INTO form_assignments (
                form_id, assigned_to_user_id, organization_id, assigned_by,
                assigned_at, due_date, is_mandatory, reminder_enabled, reminder_days_before
            ) VALUES (
                NEW.form_id, user_record.user_id, NEW.organization_id, NEW.assigned_by,
                NEW.assigned_at, NEW.due_date, NEW.is_mandatory, NEW.reminder_enabled, NEW.reminder_days_before
            );
        END LOOP;
        
        -- Delete the team assignment record as it's been expanded
        DELETE FROM form_assignments WHERE id = NEW.id;
        RETURN NULL;
    END IF;

    -- Expand role assignments
    IF NEW.assigned_to_role IS NOT NULL THEN
        FOR user_record IN 
            SELECT DISTINCT id as user_id
            FROM profiles
            WHERE role = NEW.assigned_to_role
            AND organization_id = NEW.organization_id
            AND is_active = true
        LOOP
            INSERT INTO form_assignments (
                form_id, assigned_to_user_id, organization_id, assigned_by,
                assigned_at, due_date, is_mandatory, reminder_enabled, reminder_days_before
            ) VALUES (
                NEW.form_id, user_record.user_id, NEW.organization_id, NEW.assigned_by,
                NEW.assigned_at, NEW.due_date, NEW.is_mandatory, NEW.reminder_enabled, NEW.reminder_days_before
            );
        END LOOP;
        
        -- Delete the role assignment record as it's been expanded
        DELETE FROM form_assignments WHERE id = NEW.id;
        RETURN NULL;
    END IF;

    -- Expand department assignments
    IF NEW.assigned_to_department IS NOT NULL THEN
        FOR user_record IN 
            SELECT DISTINCT id as user_id
            FROM profiles
            WHERE department = NEW.assigned_to_department
            AND organization_id = NEW.organization_id
            AND is_active = true
        LOOP
            INSERT INTO form_assignments (
                form_id, assigned_to_user_id, organization_id, assigned_by,
                assigned_at, due_date, is_mandatory, reminder_enabled, reminder_days_before
            ) VALUES (
                NEW.form_id, user_record.user_id, NEW.organization_id, NEW.assigned_by,
                NEW.assigned_at, NEW.due_date, NEW.is_mandatory, NEW.reminder_enabled, NEW.reminder_days_before
            );
        END LOOP;
        
        -- Delete the department assignment record as it's been expanded
        DELETE FROM form_assignments WHERE id = NEW.id;
        RETURN NULL;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for form assignment expansion
DROP TRIGGER IF EXISTS expand_form_assignments_trigger ON form_assignments;
CREATE TRIGGER expand_form_assignments_trigger
    AFTER INSERT ON form_assignments
    FOR EACH ROW
    EXECUTE FUNCTION expand_form_assignments();

-- Function to send push notification
CREATE OR REPLACE FUNCTION send_push_notification(notification_data JSONB)
RETURNS BOOLEAN AS $$
DECLARE
    user_ids UUID[];
    device_record RECORD;
    notification_id UUID;
BEGIN
    -- Extract user IDs from notification data
    IF notification_data->>'user_id' IS NOT NULL THEN
        user_ids := ARRAY[CAST(notification_data->>'user_id' AS UUID)];
    ELSIF notification_data->>'user_ids' IS NOT NULL THEN
        SELECT ARRAY(SELECT jsonb_array_elements_text(notification_data->'user_ids')::UUID) INTO user_ids;
    ELSE
        RETURN false;
    END IF;

    -- Create notification record for each user
    FOREACH notification_id IN ARRAY user_ids LOOP
        INSERT INTO notifications (
            user_id, organization_id, title, body, type, priority, data, scheduled_for
        ) VALUES (
            notification_id,
            CAST(notification_data->>'organization_id' AS UUID),
            notification_data->>'title',
            notification_data->>'body',
            notification_data->>'type',
            COALESCE(notification_data->>'priority', 'normal'),
            COALESCE(notification_data->'data', '{}'),
            CASE 
                WHEN notification_data->>'scheduled_for' IS NOT NULL 
                THEN CAST(notification_data->>'scheduled_for' AS TIMESTAMP WITH TIME ZONE)
                ELSE NOW()
            END
        );
    END LOOP;

    -- Here you would integrate with your push notification service
    -- For now, we'll just mark as sent
    UPDATE notifications 
    SET delivery_status = 'sent' 
    WHERE user_id = ANY(user_ids) 
    AND sent_at >= NOW() - INTERVAL '1 minute';

    RETURN true;
END;
$$ LANGUAGE plpgsql;

-- Trigger to send notification when form is assigned
CREATE OR REPLACE FUNCTION notify_form_assignment()
RETURNS TRIGGER AS $$
BEGIN
    -- Only send notification for individual user assignments
    IF NEW.assigned_to_user_id IS NOT NULL THEN
        -- Create notification
        INSERT INTO notifications (
            user_id, organization_id, title, body, type, priority, data
        ) 
        SELECT 
            NEW.assigned_to_user_id,
            NEW.organization_id,
            'New Form Assignment: ' || f.title,
            'You have been assigned a new form to complete.',
            'form_assignment',
            'normal',
            jsonb_build_object(
                'formId', NEW.form_id,
                'assignmentId', NEW.id,
                'dueDate', NEW.due_date
            )
        FROM forms f 
        WHERE f.id = NEW.form_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for form assignment notifications
DROP TRIGGER IF EXISTS notify_form_assignment_trigger ON form_assignments;
CREATE TRIGGER notify_form_assignment_trigger
    AFTER INSERT ON form_assignments
    FOR EACH ROW
    EXECUTE FUNCTION notify_form_assignment();

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_device_tokens_user_org ON device_tokens(user_id, organization_id);
CREATE INDEX IF NOT EXISTS idx_device_tokens_active ON device_tokens(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_notifications_org_type ON notifications(organization_id, type);
CREATE INDEX IF NOT EXISTS idx_notifications_scheduled ON notifications(scheduled_for) WHERE scheduled_for IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_messages_recipient_unread ON in_app_messages(recipient_id, is_read) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_messages_org_type ON in_app_messages(organization_id, message_type);
CREATE INDEX IF NOT EXISTS idx_message_participants_user ON message_participants(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_form_assignments_user_org ON form_assignments(assigned_to_user_id, organization_id) WHERE assigned_to_user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_form_assignments_team ON form_assignments(assigned_to_team_id) WHERE assigned_to_team_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_form_assignments_role ON form_assignments(assigned_to_role, organization_id) WHERE assigned_to_role IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_form_assignments_department ON form_assignments(assigned_to_department, organization_id) WHERE assigned_to_department IS NOT NULL;

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
CREATE TRIGGER update_device_tokens_updated_at 
    BEFORE UPDATE ON device_tokens
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notifications_updated_at 
    BEFORE UPDATE ON notifications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_in_app_messages_updated_at 
    BEFORE UPDATE ON in_app_messages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notification_templates_updated_at 
    BEFORE UPDATE ON notification_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notification_preferences_updated_at 
    BEFORE UPDATE ON notification_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default notification preferences for existing users
INSERT INTO notification_preferences (user_id, organization_id, notification_type, push_enabled, email_enabled, in_app_enabled)
SELECT DISTINCT 
    p.id,
    p.organization_id,
    unnest(ARRAY['form_assignment', 'task_assignment', 'announcement', 'reminder', 'system']),
    true,
    true,
    true
FROM profiles p
ON CONFLICT (user_id, organization_id, notification_type) DO NOTHING;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON device_tokens TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON notifications TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON in_app_messages TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON message_participants TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON notification_templates TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON notification_preferences TO authenticated;

-- Enable RLS
ALTER TABLE device_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE in_app_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY device_tokens_user_policy ON device_tokens
    FOR ALL USING (user_id = auth.uid());

CREATE POLICY notifications_user_policy ON notifications
    FOR ALL USING (user_id = auth.uid());

CREATE POLICY messages_user_policy ON in_app_messages
    FOR ALL USING (sender_id = auth.uid() OR recipient_id = auth.uid());

CREATE POLICY message_participants_user_policy ON message_participants
    FOR ALL USING (user_id = auth.uid());

CREATE POLICY notification_templates_org_policy ON notification_templates
    FOR ALL USING (
        organization_id IN (
            SELECT organization_id FROM profiles WHERE id = auth.uid()
        )
    );

CREATE POLICY notification_preferences_user_policy ON notification_preferences
    FOR ALL USING (user_id = auth.uid());

-- Add comment for documentation
COMMENT ON TABLE device_tokens IS 'Stores push notification tokens for mobile devices';
COMMENT ON TABLE notifications IS 'Central notification system for all user notifications';
COMMENT ON TABLE in_app_messages IS 'In-app messaging system for direct communication';
COMMENT ON TABLE notification_templates IS 'Templates for automated notifications';
COMMENT ON TABLE notification_preferences IS 'User preferences for notification delivery methods';