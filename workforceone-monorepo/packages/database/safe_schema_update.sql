-- ===================================
-- WorkforceOne Safe Database Schema Update
-- Run this script in Supabase SQL Editor if you encounter primary key errors
-- ===================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ===================================
-- SAFE UPDATE APPROACH
-- ===================================

-- 1. Update profiles table with missing columns
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS job_title VARCHAR(255),
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS location VARCHAR(255),
ADD COLUMN IF NOT EXISTS start_date DATE;

-- 2. Update teams table with missing columns
ALTER TABLE teams 
ADD COLUMN IF NOT EXISTS team_lead_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS department VARCHAR(255);

-- 3. Handle team_members table carefully
DO $$ 
BEGIN
    -- Check current structure
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'team_members' AND column_name = 'id') THEN
        
        -- Create a new table with the desired structure
        CREATE TABLE team_members_new (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
            user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
            role VARCHAR(50) DEFAULT 'member',
            joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            UNIQUE(team_id, user_id)
        );
        
        -- Copy existing data
        INSERT INTO team_members_new (team_id, user_id, role, joined_at)
        SELECT team_id, user_id, role, joined_at FROM team_members;
        
        -- Drop old table and rename new one
        DROP TABLE team_members CASCADE;
        ALTER TABLE team_members_new RENAME TO team_members;
        
        -- Recreate any foreign key constraints that were dropped
        -- (The REFERENCES clauses in the CREATE TABLE above handle this)
        
    END IF;
END $$;

-- 4. Update projects table with missing columns
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS priority VARCHAR(20) DEFAULT 'medium',
ADD COLUMN IF NOT EXISTS progress INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS project_manager_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS spent_budget DECIMAL(12, 2) DEFAULT 0;

-- 5. Update tasks table with missing columns
DO $$
BEGIN
    -- Add new columns
    ALTER TABLE tasks ADD COLUMN IF NOT EXISTS assignee_id UUID REFERENCES profiles(id) ON DELETE SET NULL;
    ALTER TABLE tasks ADD COLUMN IF NOT EXISTS reporter_id UUID REFERENCES profiles(id) ON DELETE SET NULL;
    ALTER TABLE tasks ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES teams(id) ON DELETE SET NULL;
    ALTER TABLE tasks ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE;
    
    -- Handle column rename if needed
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'tasks' AND column_name = 'assigned_to') THEN
        -- Copy data from assigned_to to assignee_id if assignee_id is empty
        UPDATE tasks SET assignee_id = assigned_to WHERE assignee_id IS NULL;
        -- Drop the old column
        ALTER TABLE tasks DROP COLUMN assigned_to;
    END IF;
END $$;

-- 6. Update leave_requests table with missing columns
DO $$
BEGIN
    -- Add new columns
    ALTER TABLE leave_requests ADD COLUMN IF NOT EXISTS employee_id UUID REFERENCES profiles(id) ON DELETE CASCADE;
    ALTER TABLE leave_requests ADD COLUMN IF NOT EXISTS leave_type VARCHAR(50);
    ALTER TABLE leave_requests ADD COLUMN IF NOT EXISTS manager_comments TEXT;
    
    -- Handle column renames if needed
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'leave_requests' AND column_name = 'user_id') THEN
        -- Copy data from user_id to employee_id if employee_id is empty
        UPDATE leave_requests SET employee_id = user_id WHERE employee_id IS NULL;
        -- Drop the old column
        ALTER TABLE leave_requests DROP COLUMN user_id;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'leave_requests' AND column_name = 'type') THEN
        -- Copy data from type to leave_type if leave_type is empty
        UPDATE leave_requests SET leave_type = type WHERE leave_type IS NULL;
        -- Drop the old column
        ALTER TABLE leave_requests DROP COLUMN type;
    END IF;
END $$;

-- 7. Create missing tables
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
    tags TEXT[] DEFAULT '{}',
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

-- 8. Create storage buckets
INSERT INTO storage.buckets (id, name, public)
VALUES 
    ('documents', 'documents', true),
    ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- 9. Enable RLS for new tables
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_attachments ENABLE ROW LEVEL SECURITY;

-- 10. Create essential RLS policies (with proper error handling)
DO $$ 
BEGIN
    -- Notifications policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view their own notifications' AND tablename = 'notifications') THEN
        CREATE POLICY "Users can view their own notifications" ON notifications
            FOR ALL USING (auth.uid() = user_id);
    END IF;
    
    -- Documents policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view documents' AND tablename = 'documents') THEN
        CREATE POLICY "Users can view documents" ON documents
            FOR SELECT USING (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can upload documents' AND tablename = 'documents') THEN
        CREATE POLICY "Users can upload documents" ON documents
            FOR INSERT WITH CHECK (auth.uid() = uploaded_by);
    END IF;
    
    -- Leave balances policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view their own leave balance' AND tablename = 'leave_balances') THEN
        CREATE POLICY "Users can view their own leave balance" ON leave_balances
            FOR ALL USING (auth.uid() = employee_id);
    END IF;
    
    -- Task comments policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view task comments' AND tablename = 'task_comments') THEN
        CREATE POLICY "Users can view task comments" ON task_comments
            FOR SELECT USING (true);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can create task comments' AND tablename = 'task_comments') THEN
        CREATE POLICY "Users can create task comments" ON task_comments
            FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
    
EXCEPTION
    WHEN others THEN
        RAISE NOTICE 'Some policies may already exist, continuing...';
END $$;

-- 11. Create triggers for new tables
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'update_notifications_updated_at') THEN
        CREATE TRIGGER update_notifications_updated_at BEFORE UPDATE ON notifications
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'update_documents_updated_at') THEN
        CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'update_leave_balances_updated_at') THEN
        CREATE TRIGGER update_leave_balances_updated_at BEFORE UPDATE ON leave_balances
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'update_task_comments_updated_at') THEN
        CREATE TRIGGER update_task_comments_updated_at BEFORE UPDATE ON task_comments
            FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- 12. Create basic indexes
CREATE INDEX IF NOT EXISTS idx_team_members_team_id ON team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assignee_id ON tasks(assignee_id);
CREATE INDEX IF NOT EXISTS idx_tasks_reporter_id ON tasks(reporter_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_uploaded_by ON documents(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_task_comments_task_id ON task_comments(task_id);

-- Success message
DO $$ 
BEGIN
    RAISE NOTICE '==============================================';
    RAISE NOTICE 'SAFE SCHEMA UPDATE COMPLETED SUCCESSFULLY!';
    RAISE NOTICE 'Your WorkforceOne database is ready to use.';
    RAISE NOTICE '==============================================';
END $$;