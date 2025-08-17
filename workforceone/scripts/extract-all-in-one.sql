-- =============================================
-- ALL-IN-ONE DATABASE EXTRACTION
-- Single query to get all schema information
-- =============================================

WITH database_info AS (
  SELECT 'DATABASE_INFO' as category, 'version' as item, version() as details
  UNION ALL
  SELECT 'DATABASE_INFO', 'current_database', current_database()
  UNION ALL
  SELECT 'DATABASE_INFO', 'current_schema', current_schema()
),
extensions_info AS (
  SELECT 'EXTENSIONS' as category, extname as item, extversion as details
  FROM pg_extension 
  ORDER BY extname
),
schemas_info AS (
  SELECT 'SCHEMAS' as category, schema_name as item, schema_owner as details
  FROM information_schema.schemata 
  WHERE schema_name NOT IN ('information_schema', 'pg_catalog', 'pg_toast')
),
tables_info AS (
  SELECT 'TABLES' as category, 
         table_schema || '.' || table_name as item, 
         table_type as details
  FROM information_schema.tables 
  WHERE table_schema IN ('public', 'auth', 'storage')
),
columns_info AS (
  SELECT 'COLUMNS' as category,
         table_schema || '.' || table_name || '.' || column_name as item,
         data_type || ' ' || CASE WHEN is_nullable = 'YES' THEN 'NULL' ELSE 'NOT NULL' END as details
  FROM information_schema.columns
  WHERE table_schema IN ('public', 'auth', 'storage')
),
policies_info AS (
  SELECT 'RLS_POLICIES' as category,
         schemaname || '.' || tablename || '.' || policyname as item,
         'cmd:' || cmd || ' roles:' || COALESCE(roles::text, 'all') as details
  FROM pg_policies 
  WHERE schemaname IN ('public', 'auth', 'storage')
),
foreign_keys_info AS (
  SELECT 'FOREIGN_KEYS' as category,
         tc.table_schema || '.' || tc.table_name || '.' || kcu.column_name as item,
         'references ' || ccu.table_schema || '.' || ccu.table_name || '.' || ccu.column_name as details
  FROM information_schema.table_constraints AS tc 
  JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
  JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
  WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema IN ('public', 'auth', 'storage')
),
indexes_info AS (
  SELECT 'INDEXES' as category,
         schemaname || '.' || tablename || '.' || indexname as item,
         indexdef as details
  FROM pg_indexes
  WHERE schemaname IN ('public', 'auth', 'storage')
),
triggers_info AS (
  SELECT 'TRIGGERS' as category,
         trigger_schema || '.' || event_object_table || '.' || trigger_name as item,
         action_timing || ' ' || event_manipulation as details
  FROM information_schema.triggers
  WHERE trigger_schema IN ('public', 'auth', 'storage')
)

SELECT * FROM database_info
UNION ALL SELECT * FROM extensions_info
UNION ALL SELECT * FROM schemas_info  
UNION ALL SELECT * FROM tables_info
UNION ALL SELECT * FROM columns_info
UNION ALL SELECT * FROM policies_info
UNION ALL SELECT * FROM foreign_keys_info
UNION ALL SELECT * FROM indexes_info
UNION ALL SELECT * FROM triggers_info
ORDER BY category, item;