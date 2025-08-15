-- Fix RLS policies for outlets table to allow authenticated users to read outlets in their organization

-- First, check if RLS is enabled
ALTER TABLE outlets ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view outlets in their organization" ON outlets;
DROP POLICY IF EXISTS "Users can insert outlets in their organization" ON outlets;
DROP POLICY IF EXISTS "Users can update outlets in their organization" ON outlets;
DROP POLICY IF EXISTS "Users can delete outlets in their organization" ON outlets;

-- Create new comprehensive policies

-- Read policy: All authenticated users can read outlets in their organization
CREATE POLICY "Users can view outlets in their organization" 
ON outlets 
FOR SELECT 
TO authenticated
USING (
  organization_id IN (
    SELECT organization_id 
    FROM profiles 
    WHERE id = auth.uid()
  )
);

-- Insert policy: Only managers and admins can create outlets
CREATE POLICY "Managers can insert outlets" 
ON outlets 
FOR INSERT 
TO authenticated
WITH CHECK (
  organization_id IN (
    SELECT organization_id 
    FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'manager')
  )
);

-- Update policy: Only managers and admins can update outlets
CREATE POLICY "Managers can update outlets" 
ON outlets 
FOR UPDATE 
TO authenticated
USING (
  organization_id IN (
    SELECT organization_id 
    FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'manager')
  )
)
WITH CHECK (
  organization_id IN (
    SELECT organization_id 
    FROM profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'manager')
  )
);

-- Delete policy: Only admins can delete outlets
CREATE POLICY "Admins can delete outlets" 
ON outlets 
FOR DELETE 
TO authenticated
USING (
  organization_id IN (
    SELECT organization_id 
    FROM profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'
  )
);

-- Also fix outlet_visits RLS if needed
ALTER TABLE outlet_visits ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view outlet visits in their organization" ON outlet_visits;
DROP POLICY IF EXISTS "Users can insert their own outlet visits" ON outlet_visits;
DROP POLICY IF EXISTS "Users can update their own outlet visits" ON outlet_visits;

-- Read policy: Users can see outlet visits in their organization
CREATE POLICY "Users can view outlet visits in their organization" 
ON outlet_visits 
FOR SELECT 
TO authenticated
USING (
  organization_id IN (
    SELECT organization_id 
    FROM profiles 
    WHERE id = auth.uid()
  )
);

-- Insert policy: Users can create their own outlet visits
CREATE POLICY "Users can insert their own outlet visits" 
ON outlet_visits 
FOR INSERT 
TO authenticated
WITH CHECK (
  user_id = auth.uid() 
  AND organization_id IN (
    SELECT organization_id 
    FROM profiles 
    WHERE id = auth.uid()
  )
);

-- Update policy: Users can update their own outlet visits
CREATE POLICY "Users can update their own outlet visits" 
ON outlet_visits 
FOR UPDATE 
TO authenticated
USING (
  user_id = auth.uid() 
  AND organization_id IN (
    SELECT organization_id 
    FROM profiles 
    WHERE id = auth.uid()
  )
)
WITH CHECK (
  user_id = auth.uid() 
  AND organization_id IN (
    SELECT organization_id 
    FROM profiles 
    WHERE id = auth.uid()
  )
);