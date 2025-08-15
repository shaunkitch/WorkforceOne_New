-- Temporary fix to allow outlets access for testing
-- This will make outlets readable by all authenticated users without organization filtering

-- Drop existing restrictive policy
DROP POLICY IF EXISTS "Users can view outlets in their organization" ON outlets;

-- Create a temporary, more permissive policy for testing
CREATE POLICY "Allow all authenticated users to read outlets" 
ON outlets 
FOR SELECT 
TO authenticated
USING (true);

-- Also ensure outlet_visits has a permissive policy
DROP POLICY IF EXISTS "Users can view outlet visits in their organization" ON outlet_visits;

CREATE POLICY "Allow all authenticated users to read outlet visits" 
ON outlet_visits 
FOR SELECT 
TO authenticated
USING (true);

-- Optional: Check what users exist
-- Run this separately to see what users you have:
-- SELECT id, email, role, organization_id, full_name FROM profiles;