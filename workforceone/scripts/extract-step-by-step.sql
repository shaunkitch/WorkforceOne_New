-- =============================================
-- STEP-BY-STEP DATABASE EXTRACTION
-- Run each section separately in Supabase SQL Editor
-- =============================================

-- STEP 1: DATABASE OVERVIEW
-- Copy and run this first:
SELECT 'DATABASE OVERVIEW' as info;
SELECT version() as postgresql_version;
SELECT current_database() as current_database;
SELECT current_schema() as current_schema;