-- ===================================
-- WorkforceOne Minimal Database Schema Update
-- Essential updates only - run this if you encounter syntax errors
-- ===================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ===================================
-- ESSENTIAL SCHEMA UPDATES
-- ===================================

-- 1. Add missing columns to existing tables
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS job_title VARCHAR(255),
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS location VARCHAR(255),
ADD COLUMN IF NOT EXISTS start_date DATE;

ALTER TABLE teams 
ADD COLUMN IF NOT EXISTS team_lead_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS department VARCHAR(255);

-- 2. Recreate team_members table with proper structure
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'team_members' AND column_name = 'id') THEN
        
        CREATE TABLE team_members_temp (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
            user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
            role VARCHAR(50) DEFAULT 'member',
            joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            UNIQUE(team_id, user_id)
        );
        
        INSERT INTO team_members_temp (team_id, user_id, role, joined_at)
        SELECT team_id, user_id, 
               COALESCE(role, 'member'), 
               COALESCE(joined_at, NOW()) 
        FROM team_members;
        
        DROP TABLE team_members CASCADE;
        ALTER TABLE team_members_temp RENAME TO team_members;
    END IF;
END $$;

-- 3. Add missing columns to projects table
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS priority VARCHAR(20) DEFAULT 'medium',
ADD COLUMN IF NOT EXISTS progress INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS project_manager_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS spent_budget DECIMAL(12, 2) DEFAULT 0;

-- 4. Update tasks table
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS assignee_id UUID REFERENCES profiles(id) ON DELETE SET NULL;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS reporter_id UUID REFERENCES profiles(id) ON DELETE SET NULL;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES teams(id) ON DELETE SET NULL;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE;

-- Handle assigned_to -> assignee_id rename
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'tasks' AND column_name = 'assigned_to') THEN
        UPDATE tasks SET assignee_id = assigned_to WHERE assignee_id IS NULL;
        ALTER TABLE tasks DROP COLUMN assigned_to;
    END IF;
END $$;

-- 5. Update leave_requests table
ALTER TABLE leave_requests ADD COLUMN IF NOT EXISTS employee_id UUID REFERENCES profiles(id) ON DELETE CASCADE;
ALTER TABLE leave_requests ADD COLUMN IF NOT EXISTS leave_type VARCHAR(50);
ALTER TABLE leave_requests ADD COLUMN IF NOT EXISTS manager_comments TEXT;

-- Handle column renames
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'leave_requests' AND column_name = 'user_id') THEN
        UPDATE leave_requests SET employee_id = user_id WHERE employee_id IS NULL;
        ALTER TABLE leave_requests DROP COLUMN user_id;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'leave_requests' AND column_name = 'type') THEN
        UPDATE leave_requests SET leave_type = type WHERE leave_type IS NULL;
        ALTER TABLE leave_requests DROP COLUMN type;
    END IF;
END $$;

-- ===================================
-- CREATE MISSING TABLES
-- ===================================

CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'info',
    priority VARCHAR(20) DEFAULT 'medium',
    is_read BOOLEAN DEFAULT false,
    action_url TEXT,
    metadata JSONB DEFAULT '{}',
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    size BIGINT NOT NULL,
    type VARCHAR(100) NOT NULL,
    url TEXT NOT NULL,
    path TEXT NOT NULL,
    uploaded_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    folder VARCHAR(100) DEFAULT 'documents',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

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

CREATE TABLE IF NOT EXISTS task_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

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
-- ENABLE ROW LEVEL SECURITY
-- ===================================

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_attachments ENABLE ROW LEVEL SECURITY;

-- ===================================
-- CREATE STORAGE BUCKETS
-- ===================================

INSERT INTO storage.buckets (id, name, public)
VALUES 
    ('documents', 'documents', true),
    ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- ===================================
-- CREATE BASIC POLICIES (SIMPLE APPROACH)
-- ===================================

-- Drop existing policies if they exist and recreate
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can view documents" ON documents;
DROP POLICY IF EXISTS "Users can upload documents" ON documents;
DROP POLICY IF EXISTS "Users can view their own leave balance" ON leave_balances;
DROP POLICY IF EXISTS "Users can view task comments" ON task_comments;
DROP POLICY IF EXISTS "Users can create task comments" ON task_comments;

-- Create new policies
CREATE POLICY "Users can view their own notifications" ON notifications
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view documents" ON documents
    FOR SELECT USING (true);

CREATE POLICY "Users can upload documents" ON documents
    FOR INSERT WITH CHECK (auth.uid() = uploaded_by);

CREATE POLICY "Users can view their own leave balance" ON leave_balances
    FOR ALL USING (auth.uid() = employee_id);

CREATE POLICY "Users can view task comments" ON task_comments
    FOR SELECT USING (true);

CREATE POLICY "Users can create task comments" ON task_comments
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ===================================
-- CREATE ESSENTIAL INDEXES
-- ===================================

CREATE INDEX IF NOT EXISTS idx_team_members_team_id ON team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assignee_id ON tasks(assignee_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_uploaded_by ON documents(uploaded_by);

-- ===================================
-- SUCCESS MESSAGE
-- ===================================

DO $$ 
BEGIN
    RAISE NOTICE '==============================================';
    RAISE NOTICE 'MINIMAL SCHEMA UPDATE COMPLETED SUCCESSFULLY!';
    RAISE NOTICE 'Your database is ready for WorkforceOne app.';
    RAISE NOTICE '==============================================';
END $$;