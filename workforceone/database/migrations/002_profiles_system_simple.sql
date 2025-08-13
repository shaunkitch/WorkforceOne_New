-- Migration 002: Profiles System (Simple)
-- Only adds missing columns, doesn't modify existing ones

-- Create enum types if they don't exist
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

-- Create profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS profiles (
  id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  email character varying NOT NULL,
  full_name character varying,
  role user_role DEFAULT 'employee' NOT NULL,
  status user_status DEFAULT 'active' NOT NULL,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Only add columns that don't exist (don't modify existing ones)
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

-- Only add status column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'profiles' AND column_name = 'status'
    ) THEN
        ALTER TABLE profiles ADD COLUMN status user_status DEFAULT 'active' NOT NULL;
    END IF;
END $$;

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create indexes for performance (IF NOT EXISTS handles existing ones)
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

-- Note: Not creating/modifying policies since many already exist and depend on the role column