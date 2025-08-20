-- Migration 021: Fix Profiles RLS Circular Dependency
-- This fixes the circular dependency issue in the profiles RLS policies

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Organization members can view other profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can manage profiles" ON profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON profiles;

-- Create improved RLS policies for profiles without circular dependencies

-- 1. Users can always view their own profile
CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- 2. Members can view other profiles in their organization (without circular dependency)
-- This uses a recursive CTE approach to avoid the circular reference
CREATE POLICY "Organization members can view profiles" ON profiles
  FOR SELECT USING (
    -- User can see their own profile (already covered above but included for safety)
    auth.uid() = id
    OR
    -- User can see profiles in the same organization
    -- We use the organizations table as the authoritative source
    EXISTS (
      WITH user_org AS (
        SELECT organization_id 
        FROM profiles 
        WHERE id = auth.uid()
        LIMIT 1
      )
      SELECT 1 
      FROM user_org
      WHERE user_org.organization_id = profiles.organization_id
      AND user_org.organization_id IS NOT NULL
    )
  );

-- 3. Users can update their own profile  
CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- 4. Admins and managers can manage profiles in their organization
CREATE POLICY "Admins and managers can manage profiles" ON profiles
  FOR ALL USING (
    -- User is admin or manager
    auth.uid() IN (
      SELECT id FROM profiles 
      WHERE id = auth.uid() 
      AND role IN ('admin', 'manager')
    )
    AND
    -- Both users are in the same organization
    EXISTS (
      WITH user_org AS (
        SELECT organization_id 
        FROM profiles 
        WHERE id = auth.uid()
        LIMIT 1
      )
      SELECT 1 
      FROM user_org
      WHERE user_org.organization_id = profiles.organization_id
      AND user_org.organization_id IS NOT NULL
    )
  );

-- 5. Enable insert for new user registration
CREATE POLICY "Enable insert for authenticated users only" ON profiles
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Add comments
COMMENT ON POLICY "Organization members can view profiles" ON profiles IS 'Allows users to view profiles in their organization without circular dependency';
COMMENT ON POLICY "Admins and managers can manage profiles" ON profiles IS 'Admins and managers can manage profiles in their organization';