-- Migration 002: Profiles System (Fixed)
-- Create profiles table and user management
-- This version handles existing tables gracefully

-- Create enum types first
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('admin', 'manager', 'employee');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE user_status AS ENUM ('active', 'inactive', 'suspended');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  email character varying NOT NULL,
  full_name character varying,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Add unique constraint for email if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'profiles_email_key'
    ) THEN
        ALTER TABLE profiles 
        ADD CONSTRAINT profiles_email_key UNIQUE (email);
    END IF;
END $$;

-- Add all columns to profiles (if they don't exist)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email character varying;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS full_name character varying;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url character varying;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone character varying;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS department character varying;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS job_title character varying;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS hire_date date;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS salary numeric;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS hourly_rate numeric;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS employee_id character varying;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS manager_id uuid REFERENCES profiles(id) ON DELETE SET NULL;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_login timestamp with time zone;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS created_at timestamp with time zone DEFAULT now();
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();

-- Add role column with proper type handling
DO $$ 
BEGIN
    -- Check if role column exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'role'
    ) THEN
        ALTER TABLE profiles ADD COLUMN role user_role DEFAULT 'employee' NOT NULL;
    ELSE
        -- If it exists but is not the right type, we need to convert it
        BEGIN
            ALTER TABLE profiles ALTER COLUMN role TYPE user_role USING role::text::user_role;
        EXCEPTION
            WHEN OTHERS THEN
                -- If conversion fails, try dropping and recreating
                ALTER TABLE profiles DROP COLUMN role;
                ALTER TABLE profiles ADD COLUMN role user_role DEFAULT 'employee' NOT NULL;
        END;
    END IF;
END $$;

-- Add status column with proper type handling
DO $$ 
BEGIN
    -- Check if status column exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'status'
    ) THEN
        ALTER TABLE profiles ADD COLUMN status user_status DEFAULT 'active' NOT NULL;
    ELSE
        -- If it exists but is not the right type, we need to convert it
        BEGIN
            ALTER TABLE profiles ALTER COLUMN status TYPE user_status USING status::text::user_status;
        EXCEPTION
            WHEN OTHERS THEN
                -- If conversion fails, try dropping and recreating
                ALTER TABLE profiles DROP COLUMN status;
                ALTER TABLE profiles ADD COLUMN status user_status DEFAULT 'active' NOT NULL;
        END;
    END IF;
END $$;

-- RLS policies for profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Organization members can view other profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can manage profiles" ON profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON profiles;

-- Create RLS policies for profiles
CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Organization members can view other profiles" ON profiles
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can manage profiles" ON profiles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
      AND organization_id IN (
        SELECT organization_id FROM profiles WHERE id = profiles.id
      )
    )
  );

-- Enable insert for new user registration
CREATE POLICY "Enable insert for authenticated users only" ON profiles
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_profiles_organization_id ON profiles(organization_id);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON profiles(status);
CREATE INDEX IF NOT EXISTS idx_profiles_manager_id ON profiles(manager_id);
CREATE INDEX IF NOT EXISTS idx_profiles_employee_id ON profiles(employee_id);

-- Add comments
COMMENT ON TABLE profiles IS 'Extended user profiles table that references auth.users';
COMMENT ON COLUMN profiles.role IS 'User role: admin, manager, employee';
COMMENT ON COLUMN profiles.status IS 'User status: active, inactive, suspended';