-- Fix Task Assignment Notifications Trigger
-- Corrects column references in the notify_task_assignment function

-- Drop the existing trigger first
DROP TRIGGER IF EXISTS notify_task_assignment_trigger ON tasks;

-- Drop the existing function
DROP FUNCTION IF EXISTS notify_task_assignment();

-- Create corrected function
CREATE OR REPLACE FUNCTION notify_task_assignment()
RETURNS TRIGGER AS $$
DECLARE
    assignee_name TEXT;
    assigner_name TEXT;
    task_title TEXT;
BEGIN
    -- Only process if assignee_id is not null
    IF NEW.assignee_id IS NULL THEN
        RETURN NEW;
    END IF;

    -- Handle INSERT (new task assignment)
    IF TG_OP = 'INSERT' THEN
        -- Get task title
        task_title := NEW.title;
        
        -- Get assignee name for notification body
        SELECT full_name INTO assignee_name FROM profiles WHERE id = NEW.assignee_id;
        
        -- Get assigner name  
        SELECT full_name INTO assigner_name FROM profiles WHERE id = NEW.reporter_id;
        
        -- Create notification for the assignee
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
        task_title := NEW.title;
        
        -- Check if assignee changed (task reassigned)
        IF (OLD.assignee_id IS DISTINCT FROM NEW.assignee_id) AND NEW.assignee_id IS NOT NULL THEN
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
        
        RETURN NEW;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger
CREATE TRIGGER notify_task_assignment_trigger
    AFTER INSERT OR UPDATE ON tasks
    FOR EACH ROW
    EXECUTE FUNCTION notify_task_assignment();

-- Also fix the reminder function
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
        AND t.assignee_id IS NOT NULL
        AND NOT EXISTS (
            SELECT 1 FROM notifications n 
            WHERE n.recipient_id = t.assignee_id 
            AND n.metadata->>'task_id' = t.id::text 
            AND n.metadata->>'action_type' = 'due_tomorrow'
            AND n.created_at::date = CURRENT_DATE
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
        AND t.assignee_id IS NOT NULL
        AND NOT EXISTS (
            SELECT 1 FROM notifications n 
            WHERE n.recipient_id = t.assignee_id 
            AND n.metadata->>'task_id' = t.id::text 
            AND n.metadata->>'action_type' = 'overdue'
            AND n.created_at::date = CURRENT_DATE
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

-- Success message
SELECT 'Task notifications trigger fixed successfully!' as status;