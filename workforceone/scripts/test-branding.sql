-- Test script to check if branding tables exist and create sample data

-- Check if tables exist
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'organization_branding') 
        THEN '✅ organization_branding table exists' 
        ELSE '❌ organization_branding table missing - please run migration 061' 
    END as branding_table_status;

SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'branding_color_schemes') 
        THEN '✅ branding_color_schemes table exists' 
        ELSE '❌ branding_color_schemes table missing - please run migration 061' 
    END as schemes_table_status;

-- If tables exist, show current state
SELECT count(*) as color_schemes_count FROM branding_color_schemes;

-- Show organizations without branding
SELECT o.id, o.name, 
    CASE 
        WHEN ob.id IS NOT NULL THEN '✅ Has branding' 
        ELSE '❌ No branding' 
    END as branding_status
FROM organizations o
LEFT JOIN organization_branding ob ON o.id = ob.organization_id
ORDER BY o.name;