-- Fix notifications table schema and RLS policies
-- Ensures proper table creation order and column existence

-- =============================================================================
-- NOTIFICATIONS TABLE
-- =============================================================================

-- Create notifications table for in-app notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) DEFAULT 'general' CHECK (type IN ('general', 'attendance', 'leave', 'task', 'form', 'reminder')),
  priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  is_read BOOLEAN DEFAULT FALSE,
  is_dismissed BOOLEAN DEFAULT FALSE,
  action_url VARCHAR(500),
  metadata JSONB,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for notifications
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_id ON public.notifications(recipient_id);
CREATE INDEX IF NOT EXISTS idx_notifications_organization_id ON public.notifications(organization_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON public.notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at);

-- =============================================================================
-- ATTENDANCE REMINDERS TABLE
-- =============================================================================

-- Create attendance_reminders table for scheduled reminders
CREATE TABLE IF NOT EXISTS public.attendance_reminders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  reminder_time TIME NOT NULL, -- Time of day to send reminder (e.g., '09:30:00')
  days_of_week INTEGER[] NOT NULL DEFAULT '{1,2,3,4,5}', -- Monday=1, Sunday=7
  message TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  target_roles VARCHAR(50)[] DEFAULT '{"member"}', -- Which roles to target
  target_departments VARCHAR(100)[], -- Specific departments (optional)
  exclude_checked_in BOOLEAN DEFAULT TRUE, -- Don't send to already checked-in users
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for attendance_reminders
CREATE INDEX IF NOT EXISTS idx_attendance_reminders_organization_id ON public.attendance_reminders(organization_id);
CREATE INDEX IF NOT EXISTS idx_attendance_reminders_is_active ON public.attendance_reminders(is_active);

-- =============================================================================
-- ROW LEVEL SECURITY POLICIES
-- =============================================================================

-- Enable RLS on notifications table
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Managers can send notifications in their organization" ON public.notifications;

-- Notifications RLS policies
CREATE POLICY "Users can view their own notifications" ON public.notifications
FOR SELECT
TO authenticated
USING (recipient_id = auth.uid());

CREATE POLICY "Users can update their own notifications" ON public.notifications
FOR UPDATE
TO authenticated
USING (recipient_id = auth.uid());

CREATE POLICY "Managers can send notifications in their organization" ON public.notifications
FOR INSERT
TO authenticated
WITH CHECK (
  sender_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.organization_id = notifications.organization_id
    AND profiles.role IN ('admin', 'manager')
  )
);

-- Enable RLS on attendance_reminders table
ALTER TABLE public.attendance_reminders ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view reminders in their organization" ON public.attendance_reminders;
DROP POLICY IF EXISTS "Managers can manage reminders in their organization" ON public.attendance_reminders;

-- Attendance reminders RLS policies
CREATE POLICY "Users can view reminders in their organization" ON public.attendance_reminders
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.organization_id = attendance_reminders.organization_id
  )
);

CREATE POLICY "Managers can manage reminders in their organization" ON public.attendance_reminders
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.organization_id = attendance_reminders.organization_id
    AND profiles.role IN ('admin', 'manager')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.organization_id = attendance_reminders.organization_id
    AND profiles.role IN ('admin', 'manager')
  )
);

-- =============================================================================
-- PERMISSIONS AND TRIGGERS
-- =============================================================================

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.attendance_reminders TO authenticated;

-- Update trigger function for timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at columns
DROP TRIGGER IF EXISTS trigger_update_notifications_updated_at ON public.notifications;
CREATE TRIGGER trigger_update_notifications_updated_at
  BEFORE UPDATE ON public.notifications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_update_attendance_reminders_updated_at ON public.attendance_reminders;
CREATE TRIGGER trigger_update_attendance_reminders_updated_at
  BEFORE UPDATE ON public.attendance_reminders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();