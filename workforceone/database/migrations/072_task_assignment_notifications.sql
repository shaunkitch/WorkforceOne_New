-- =============================================
-- Task Assignment Notifications System
-- Add notification triggers for task assignments
-- =============================================

-- Function to notify when a task is assigned or reassigned
CREATE OR REPLACE FUNCTION notify_task_assignment()
RETURNS TRIGGER AS $$
DECLARE
    assignee_name TEXT;
    assigner_name TEXT;
    task_title TEXT;
BEGIN
    -- Handle INSERT (new task assignment)
    IF TG_OP = 'INSERT' THEN
        -- Get task title
        SELECT title INTO task_title FROM tasks WHERE id = NEW.id;
        
        -- Get assignee name for notification body
        SELECT full_name INTO assignee_name FROM profiles WHERE id = NEW.assignee_id;
        
        -- Get assigner name  
        SELECT full_name INTO assigner_name FROM profiles WHERE id = NEW.reporter_id;
        
        -- Create notification for the assignee (using existing schema)
        INSERT INTO notifications (
            recipient_id, 
            organization_id, 
            title, 
            message, 
            type, 
            priority, 
            metadata
        ) VALUES (
            NEW.assignee_id,
            NEW.organization_id,
            'New Task Assigned',
            'You have been assigned a new task: "' || COALESCE(task_title, 'Untitled Task') || '"' ||
            CASE 
                WHEN assigner_name IS NOT NULL THEN ' by ' || assigner_name
                ELSE ''
            END,
            'attendance',  -- Using valid type as proxy for task notifications
            CASE NEW.priority
                WHEN 'urgent' THEN 'urgent'
                WHEN 'high' THEN 'high'
                ELSE 'normal'
            END,
            jsonb_build_object(
                'task_id', NEW.id,
                'task_title', task_title,
                'priority', NEW.priority,
                'due_date', NEW.due_date,
                'assigned_by', assigner_name,
                'assignee_id', NEW.assignee_id,
                'action_type', 'assigned',
                'notification_category', 'task_management'
            )
        );
        
        RETURN NEW;
    END IF;
    
    -- Handle UPDATE (task reassignment or status change)
    IF TG_OP = 'UPDATE' THEN
        -- Get task title
        SELECT title INTO task_title FROM tasks WHERE id = NEW.id;
        
        -- Check if assignee changed (task reassigned)
        IF OLD.assignee_id != NEW.assignee_id THEN
            -- Get assignee names
            SELECT full_name INTO assignee_name FROM profiles WHERE id = NEW.assignee_id;
            SELECT full_name INTO assigner_name FROM profiles WHERE id = NEW.reporter_id;
            
            -- Notify new assignee
            INSERT INTO notifications (
                recipient_id, 
                organization_id, 
                title, 
                message, 
                type, 
                priority, 
                metadata
            ) VALUES (
                NEW.assignee_id,
                NEW.organization_id,
                'Task Reassigned to You',
                'The task "' || COALESCE(task_title, 'Untitled Task') || '" has been reassigned to you' ||
                CASE 
                    WHEN assigner_name IS NOT NULL THEN ' by ' || assigner_name
                    ELSE ''
                END,
                'attendance',
                CASE NEW.priority
                    WHEN 'urgent' THEN 'urgent'
                    WHEN 'high' THEN 'high'
                    ELSE 'normal'
                END,
                jsonb_build_object(
                    'task_id', NEW.id,
                    'task_title', task_title,
                    'priority', NEW.priority,
                    'due_date', NEW.due_date,
                    'assigned_by', assigner_name,
                    'assignee_id', NEW.assignee_id,
                    'action_type', 'reassigned',
                    'notification_category', 'task_management'
                )
            );
            
            -- Notify old assignee that task was reassigned away
            IF OLD.assignee_id IS NOT NULL AND OLD.assignee_id != NEW.assignee_id THEN
                INSERT INTO notifications (
                    recipient_id, 
                    organization_id, 
                    title, 
                    message, 
                    type, 
                    priority, 
                    metadata
                ) VALUES (
                    OLD.assignee_id,
                    OLD.organization_id,
                    'Task Reassigned',
                    'The task "' || COALESCE(task_title, 'Untitled Task') || '" has been reassigned to someone else',
                    'attendance',
                    'normal',
                    jsonb_build_object(
                        'task_id', NEW.id,
                        'task_title', task_title,
                        'priority', NEW.priority,
                        'due_date', NEW.due_date,
                        'assignee_id', OLD.assignee_id,
                        'action_type', 'unassigned',
                        'notification_category', 'task_management'
                    )
                );
            END IF;
        END IF;
        
        -- Check if status changed to completed
        IF OLD.status != 'completed' AND NEW.status = 'completed' THEN
            -- Notify reporter/manager about completion
            IF NEW.reporter_id IS NOT NULL AND NEW.reporter_id != NEW.assignee_id THEN
                SELECT full_name INTO assignee_name FROM profiles WHERE id = NEW.assignee_id;
                
                INSERT INTO notifications (
                    recipient_id, 
                    organization_id, 
                    title, 
                    message, 
                    type, 
                    priority, 
                    metadata
                ) VALUES (
                    NEW.reporter_id,
                    NEW.organization_id,
                    'Task Completed',
                    '"' || COALESCE(task_title, 'Untitled Task') || '" has been completed' ||
                    CASE 
                        WHEN assignee_name IS NOT NULL THEN ' by ' || assignee_name
                        ELSE ''
                    END,
                    'attendance',
                    'normal',
                    jsonb_build_object(
                        'task_id', NEW.id,
                        'task_title', task_title,
                        'priority', NEW.priority,
                        'completed_by', assignee_name,
                        'assignee_id', NEW.assignee_id,
                        'action_type', 'completed',
                        'notification_category', 'task_management'
                    )
                );
            END IF;
        END IF;
        
        -- Check if priority changed to urgent/high
        IF (OLD.priority != 'urgent' AND NEW.priority = 'urgent') OR 
           (OLD.priority != 'high' AND NEW.priority = 'high') THEN
            INSERT INTO notifications (
                recipient_id, 
                organization_id, 
                title, 
                message, 
                type, 
                priority, 
                metadata
            ) VALUES (
                NEW.assignee_id,
                NEW.organization_id,
                'Task Priority Updated',
                'The priority of task "' || COALESCE(task_title, 'Untitled Task') || '" has been changed to ' || UPPER(NEW.priority),
                'attendance',
                CASE NEW.priority
                    WHEN 'urgent' THEN 'urgent'
                    WHEN 'high' THEN 'high'
                    ELSE 'normal'
                END,
                jsonb_build_object(
                    'task_id', NEW.id,
                    'task_title', task_title,
                    'priority', NEW.priority,
                    'old_priority', OLD.priority,
                    'assignee_id', NEW.assignee_id,
                    'action_type', 'priority_changed',
                    'notification_category', 'task_management'
                )
            );
        END IF;
        
        -- Check if due date was added or changed
        IF (OLD.due_date IS NULL AND NEW.due_date IS NOT NULL) OR 
           (OLD.due_date IS NOT NULL AND NEW.due_date IS NOT NULL AND OLD.due_date != NEW.due_date) THEN
            INSERT INTO notifications (
                recipient_id, 
                organization_id, 
                title, 
                message, 
                type, 
                priority, 
                metadata
            ) VALUES (
                NEW.assignee_id,
                NEW.organization_id,
                'Task Due Date Updated',
                'The due date for task "' || COALESCE(task_title, 'Untitled Task') || '" has been ' ||
                CASE 
                    WHEN OLD.due_date IS NULL THEN 'set to ' || TO_CHAR(NEW.due_date, 'Mon DD, YYYY')
                    ELSE 'changed to ' || TO_CHAR(NEW.due_date, 'Mon DD, YYYY')
                END,
                'attendance',
                CASE 
                    WHEN NEW.due_date <= CURRENT_DATE + INTERVAL '1 day' THEN 'high'
                    WHEN NEW.due_date <= CURRENT_DATE + INTERVAL '3 days' THEN 'normal'
                    ELSE 'normal'
                END,
                jsonb_build_object(
                    'task_id', NEW.id,
                    'task_title', task_title,
                    'priority', NEW.priority,
                    'due_date', NEW.due_date,
                    'old_due_date', OLD.due_date,
                    'assignee_id', NEW.assignee_id,
                    'action_type', 'due_date_changed',
                    'notification_category', 'task_management'
                )
            );
        END IF;
        
        RETURN NEW;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for task assignment notifications
DROP TRIGGER IF EXISTS notify_task_assignment_trigger ON tasks;
CREATE TRIGGER notify_task_assignment_trigger
    AFTER INSERT OR UPDATE ON tasks
    FOR EACH ROW
    EXECUTE FUNCTION notify_task_assignment();

-- Function to create due date reminders for tasks
CREATE OR REPLACE FUNCTION create_task_due_reminders()
RETURNS INTEGER AS $$
DECLARE
    task_record RECORD;
    reminder_count INTEGER := 0;
BEGIN
    -- Create reminders for tasks due tomorrow
    FOR task_record IN 
        SELECT t.id, t.title, t.assignee_id, t.organization_id, t.due_date, t.priority
        FROM tasks t
        WHERE t.due_date = CURRENT_DATE + INTERVAL '1 day'
        AND t.status IN ('todo', 'in_progress')
        AND NOT EXISTS (
            SELECT 1 FROM notifications n 
            WHERE n.user_id = t.assignee_id 
            AND n.data->>'task_id' = t.id::text 
            AND n.data->>'action_type' = 'due_tomorrow'
            AND n.sent_at::date = CURRENT_DATE
        )
    LOOP
        INSERT INTO notifications (
            recipient_id, 
            organization_id, 
            title, 
            message, 
            type, 
            priority, 
            metadata
        ) VALUES (
            task_record.assignee_id,
            task_record.organization_id,
            'Task Due Tomorrow',
            'Reminder: "' || COALESCE(task_record.title, 'Untitled Task') || '" is due tomorrow',
            'attendance',
            CASE task_record.priority
                WHEN 'urgent' THEN 'urgent'
                WHEN 'high' THEN 'high'
                ELSE 'normal'
            END,
            jsonb_build_object(
                'task_id', task_record.id,
                'task_title', task_record.title,
                'priority', task_record.priority,
                'due_date', task_record.due_date,
                'assignee_id', task_record.assignee_id,
                'action_type', 'due_tomorrow',
                'notification_category', 'task_reminder'
            )
        );
        
        reminder_count := reminder_count + 1;
    END LOOP;
    
    -- Create reminders for overdue tasks
    FOR task_record IN 
        SELECT t.id, t.title, t.assignee_id, t.organization_id, t.due_date, t.priority
        FROM tasks t
        WHERE t.due_date < CURRENT_DATE
        AND t.status IN ('todo', 'in_progress')
        AND NOT EXISTS (
            SELECT 1 FROM notifications n 
            WHERE n.user_id = t.assignee_id 
            AND n.data->>'task_id' = t.id::text 
            AND n.data->>'action_type' = 'overdue'
            AND n.sent_at::date = CURRENT_DATE
        )
    LOOP
        INSERT INTO notifications (
            recipient_id, 
            organization_id, 
            title, 
            message, 
            type, 
            priority, 
            metadata
        ) VALUES (
            task_record.assignee_id,
            task_record.organization_id,
            'Overdue Task',
            'Task "' || COALESCE(task_record.title, 'Untitled Task') || '" is overdue (due: ' || 
            TO_CHAR(task_record.due_date, 'Mon DD, YYYY') || ')',
            'attendance',
            'urgent',
            jsonb_build_object(
                'task_id', task_record.id,
                'task_title', task_record.title,
                'priority', task_record.priority,
                'due_date', task_record.due_date,
                'days_overdue', CURRENT_DATE - task_record.due_date,
                'assignee_id', task_record.assignee_id,
                'action_type', 'overdue',
                'notification_category', 'task_reminder'
            )
        );
        
        reminder_count := reminder_count + 1;
    END LOOP;
    
    RETURN reminder_count;
END;
$$ LANGUAGE plpgsql;

-- Add task_assignment to notification types if not exists
INSERT INTO notification_preferences (user_id, organization_id, notification_type, push_enabled, email_enabled, in_app_enabled)
SELECT DISTINCT 
    p.id,
    p.organization_id,
    'task_assignment',
    true,
    true,
    true
FROM profiles p
WHERE NOT EXISTS (
    SELECT 1 FROM notification_preferences np 
    WHERE np.user_id = p.id 
    AND np.organization_id = p.organization_id 
    AND np.notification_type = 'task_assignment'
);

-- Create index for task notification queries
CREATE INDEX IF NOT EXISTS idx_tasks_assignee_status ON tasks(assignee_id, status) WHERE status IN ('todo', 'in_progress');
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date) WHERE due_date IS NOT NULL AND status IN ('todo', 'in_progress');

-- Add comment for documentation
COMMENT ON FUNCTION notify_task_assignment() IS 'Sends notifications when tasks are assigned, reassigned, completed, or updated';
COMMENT ON FUNCTION create_task_due_reminders() IS 'Creates reminder notifications for tasks due tomorrow and overdue tasks. Run daily via cron job.';