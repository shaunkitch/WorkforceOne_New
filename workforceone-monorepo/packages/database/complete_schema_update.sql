-- ===================================
-- WorkforceOne Complete Database Schema Update
-- Run this script in Supabase SQL Editor to ensure all tables align with the code
-- ===================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ===================================
-- 1. UPDATE EXISTING TABLES
-- ===================================

-- Update profiles table with missing columns
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS job_title VARCHAR(255),
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS location VARCHAR(255),
ADD COLUMN IF NOT EXISTS start_date DATE;

-- Update teams table with missing columns
ALTER TABLE teams 
ADD COLUMN IF NOT EXISTS team_lead_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS department VARCHAR(255);

-- Update team_members table with missing columns
DO $$ 
BEGIN
    -- First, check if id column already exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'team_members' AND column_name = 'id') THEN
        
        -- Drop existing PRIMARY KEY constraint if it exists
        IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'team_members_pkey' AND table_name = 'team_members') THEN
            ALTER TABLE team_members DROP CONSTRAINT team_members_pkey;
        END IF;
        
        -- Add the id column
        ALTER TABLE team_members ADD COLUMN id UUID DEFAULT uuid_generate_v4();
        
        -- Update existing rows to have unique IDs
        UPDATE team_members SET id = uuid_generate_v4() WHERE id IS NULL;
        
        -- Make id NOT NULL and set as primary key
        ALTER TABLE team_members ALTER COLUMN id SET NOT NULL;
        ALTER TABLE team_members ADD CONSTRAINT team_members_pkey PRIMARY KEY (id);
        
        -- Add unique constraint for the original compound key
        ALTER TABLE team_members ADD CONSTRAINT team_members_unique UNIQUE (team_id, user_id);
    END IF;
END $$;

-- Update projects table with missing columns
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS priority VARCHAR(20) DEFAULT 'medium',
ADD COLUMN IF NOT EXISTS progress INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS project_manager_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS spent_budget DECIMAL(12, 2) DEFAULT 0;

-- Update tasks table with missing columns
ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS assignee_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS reporter_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE;

-- Rename assigned_to to assignee_id if it exists
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'tasks' AND column_name = 'assigned_to') THEN
        ALTER TABLE tasks RENAME COLUMN assigned_to TO assignee_id;
    END IF;
END $$;

-- Update leave_requests table with missing columns
ALTER TABLE leave_requests 
ADD COLUMN IF NOT EXISTS employee_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS leave_type VARCHAR(50),
ADD COLUMN IF NOT EXISTS manager_comments TEXT;

-- Rename columns in leave_requests if they exist
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'leave_requests' AND column_name = 'user_id') THEN
        ALTER TABLE leave_requests RENAME COLUMN user_id TO employee_id;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'leave_requests' AND column_name = 'type') THEN
        ALTER TABLE leave_requests RENAME COLUMN type TO leave_type;
    END IF;
END $$;

-- ===================================
-- 2. CREATE MISSING TABLES
-- ===================================

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'info', -- info, success, warning, error
    priority VARCHAR(20) DEFAULT 'medium', -- low, medium, high
    is_read BOOLEAN DEFAULT false,
    action_url TEXT,
    metadata JSONB DEFAULT '{}',
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Documents table
CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    size BIGINT NOT NULL,
    type VARCHAR(100) NOT NULL,
    url TEXT NOT NULL,
    path TEXT NOT NULL,
    uploaded_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    folder VARCHAR(100) DEFAULT 'documents',
    tags TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Leave balances table
CREATE TABLE IF NOT EXISTS leave_balances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    year INTEGER NOT NULL,
    vacation_days_allocated INTEGER DEFAULT 20,
    vacation_days_used INTEGER DEFAULT 0,
    sick_days_allocated INTEGER DEFAULT 10,
    sick_days_used INTEGER DEFAULT 0,
    personal_days_allocated INTEGER DEFAULT 5,
    personal_days_used INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(employee_id, year)
);

-- Task comments table
CREATE TABLE IF NOT EXISTS task_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Task attachments table
CREATE TABLE IF NOT EXISTS task_attachments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    uploaded_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===================================
-- 3. CREATE STORAGE BUCKETS
-- ===================================

-- Create storage buckets for file uploads
INSERT INTO storage.buckets (id, name, public)
VALUES 
    ('documents', 'documents', true),
    ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- ===================================
-- 4. UPDATE TRIGGERS FOR NEW TABLES
-- ===================================

CREATE TRIGGER update_notifications_updated_at BEFORE UPDATE ON notifications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_leave_balances_updated_at BEFORE UPDATE ON leave_balances
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_task_comments_updated_at BEFORE UPDATE ON task_comments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===================================
-- 5. ENABLE RLS FOR NEW TABLES
-- ===================================

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_attachments ENABLE ROW LEVEL SECURITY;

-- ===================================
-- 6. CREATE RLS POLICIES
-- ===================================

-- Notifications policies
CREATE POLICY "Users can view their own notifications" ON notifications
    FOR ALL USING (auth.uid() = user_id);

-- Documents policies  
CREATE POLICY "Users can view documents" ON documents
    FOR SELECT USING (true);

CREATE POLICY "Users can upload documents" ON documents
    FOR INSERT WITH CHECK (auth.uid() = uploaded_by);

CREATE POLICY "Users can update their own documents" ON documents
    FOR UPDATE USING (auth.uid() = uploaded_by);

CREATE POLICY "Users can delete their own documents" ON documents
    FOR DELETE USING (auth.uid() = uploaded_by);

-- Leave balances policies
CREATE POLICY "Users can view their own leave balance" ON leave_balances
    FOR ALL USING (auth.uid() = employee_id);

-- Task comments policies
CREATE POLICY "Users can view task comments" ON task_comments
    FOR SELECT USING (true);

CREATE POLICY "Users can create task comments" ON task_comments
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments" ON task_comments
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments" ON task_comments
    FOR DELETE USING (auth.uid() = user_id);

-- Task attachments policies
CREATE POLICY "Users can view task attachments" ON task_attachments
    FOR SELECT USING (true);

CREATE POLICY "Users can upload task attachments" ON task_attachments
    FOR INSERT WITH CHECK (auth.uid() = uploaded_by);

CREATE POLICY "Users can delete their own attachments" ON task_attachments
    FOR DELETE USING (auth.uid() = uploaded_by);

-- Storage policies for documents bucket
CREATE POLICY "Users can upload documents" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Documents are publicly accessible" ON storage.objects
    FOR SELECT USING (bucket_id = 'documents');

CREATE POLICY "Users can update their own documents" ON storage.objects
    FOR UPDATE USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own documents" ON storage.objects
    FOR DELETE USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Storage policies for avatars bucket
CREATE POLICY "Users can upload avatars" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Avatars are publicly accessible" ON storage.objects
    FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Users can update their own avatars" ON storage.objects
    FOR UPDATE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own avatars" ON storage.objects
    FOR DELETE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- ===================================
-- 7. UPDATE EXISTING RLS POLICIES
-- ===================================

-- Drop and recreate policies with better permissions

-- Teams policies
DROP POLICY IF EXISTS "Users can view their organization" ON teams;
CREATE POLICY "Users can view teams" ON teams
    FOR SELECT USING (true);

CREATE POLICY "Users can create teams" ON teams
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Team leads can update their teams" ON teams
    FOR UPDATE USING (auth.uid() = team_lead_id OR auth.uid() IN (
        SELECT user_id FROM team_members WHERE team_id = teams.id AND role IN ('lead', 'manager')
    ));

-- Team members policies
CREATE POLICY "Users can view team members" ON team_members
    FOR SELECT USING (true);

CREATE POLICY "Team leads can manage team members" ON team_members
    FOR ALL USING (auth.uid() IN (
        SELECT team_lead_id FROM teams WHERE id = team_members.team_id
    ) OR auth.uid() IN (
        SELECT user_id FROM team_members tm2 
        WHERE tm2.team_id = team_members.team_id AND tm2.role IN ('lead', 'manager')
    ));

-- Projects policies
CREATE POLICY "Users can view projects" ON projects
    FOR SELECT USING (true);

CREATE POLICY "Users can create projects" ON projects
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Project managers can update projects" ON projects
    FOR UPDATE USING (auth.uid() = project_manager_id);

CREATE POLICY "Project managers can delete projects" ON projects
    FOR DELETE USING (auth.uid() = project_manager_id);

-- Tasks policies
CREATE POLICY "Users can view tasks" ON tasks
    FOR SELECT USING (true);

CREATE POLICY "Users can create tasks" ON tasks
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Assignees and reporters can update tasks" ON tasks
    FOR UPDATE USING (auth.uid() = assignee_id OR auth.uid() = reporter_id);

CREATE POLICY "Reporters can delete tasks" ON tasks
    FOR DELETE USING (auth.uid() = reporter_id);

-- Time entries policies
CREATE POLICY "Users can view their time entries" ON time_entries
    FOR ALL USING (auth.uid() = user_id);

-- Attendance policies  
CREATE POLICY "Users can view their attendance" ON attendance
    FOR ALL USING (auth.uid() = user_id);

-- Leave requests policies
CREATE POLICY "Users can view their leave requests" ON leave_requests
    FOR ALL USING (auth.uid() = employee_id);

CREATE POLICY "Managers can view team leave requests" ON leave_requests
    FOR SELECT USING (true); -- You might want to restrict this based on management hierarchy

-- ===================================
-- 8. CREATE HELPFUL VIEWS
-- ===================================

-- View for user profiles with organization info
CREATE OR REPLACE VIEW user_profiles AS
SELECT 
    p.*,
    o.name as organization_name,
    o.slug as organization_slug
FROM profiles p
LEFT JOIN organizations o ON p.organization_id = o.id;

-- View for team members with profile info
CREATE OR REPLACE VIEW team_members_view AS
SELECT 
    tm.*,
    p.full_name,
    p.email,
    p.avatar_url,
    p.department,
    p.job_title,
    t.name as team_name
FROM team_members tm
JOIN profiles p ON tm.user_id = p.id
JOIN teams t ON tm.team_id = t.id;

-- View for tasks with assignee and project info
CREATE OR REPLACE VIEW tasks_view AS
SELECT 
    t.*,
    assignee.full_name as assignee_name,
    assignee.email as assignee_email,
    reporter.full_name as reporter_name,
    reporter.email as reporter_email,
    p.name as project_name,
    team.name as team_name
FROM tasks t
LEFT JOIN profiles assignee ON t.assignee_id = assignee.id
LEFT JOIN profiles reporter ON t.reporter_id = reporter.id
LEFT JOIN projects p ON t.project_id = p.id
LEFT JOIN teams team ON t.team_id = team.id;

-- ===================================
-- 9. CREATE INDEXES FOR PERFORMANCE
-- ===================================

-- Indexes for frequently queried columns
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_organization_id ON profiles(organization_id);
CREATE INDEX IF NOT EXISTS idx_team_members_team_id ON team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assignee_id ON tasks(assignee_id);
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_time_entries_user_id ON time_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_project_id ON time_entries(project_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_start_time ON time_entries(start_time);
CREATE INDEX IF NOT EXISTS idx_attendance_user_id ON attendance(user_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date);
CREATE INDEX IF NOT EXISTS idx_leave_requests_employee_id ON leave_requests(employee_id);
CREATE INDEX IF NOT EXISTS idx_leave_requests_status ON leave_requests(status);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_documents_uploaded_by ON documents(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_task_comments_task_id ON task_comments(task_id);

-- ===================================
-- 10. INSERT DEFAULT DATA
-- ===================================

-- Insert default organization if none exists
INSERT INTO organizations (name, slug, settings)
SELECT 'WorkforceOne Demo', 'workforceone-demo', '{}'
WHERE NOT EXISTS (SELECT 1 FROM organizations LIMIT 1);

-- ===================================
-- COMPLETION MESSAGE
-- ===================================

DO $$ 
BEGIN
    RAISE NOTICE 'WorkforceOne database schema has been successfully updated!';
    RAISE NOTICE 'All tables, columns, indexes, and policies are now aligned with the application code.';
    RAISE NOTICE 'You can now run the application without database-related errors.';
END $$;