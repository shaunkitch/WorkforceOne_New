const { createClient } = require('@supabase/supabase-js');

async function updateFeatureFlags() {
    const supabaseUrl = 'https://edeheyeloakiworbkfpg.supabase.co';
    const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVkZWhleWVsb2FraXdvcmJrZnBnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDkxODY3NSwiZXhwIjoyMDcwNDk0Njc1fQ.HNoN21ykstlIQ6sPF5bsJtRyQyCTKENDBtFzgkEe40c';
    
    const supabase = createClient(supabaseUrl, serviceKey);
    
    try {
        console.log('🔍 Checking current feature flags in database...');
        
        // Get all organizations
        const { data: orgs, error: fetchError } = await supabase
            .from('organizations')
            .select('id, name, feature_flags');
            
        if (fetchError) throw fetchError;
        
        console.log(`📋 Found ${orgs?.length || 0} organizations:`);
        
        for (const org of orgs || []) {
            console.log(`\n📍 ${org.name} (${org.id})`);
            console.log('Current flags:', JSON.stringify(org.feature_flags, null, 2));
            
            // Update feature flags to include mobile features
            const updatedFlags = {
                ...org.feature_flags,
                mobile_daily_visits: true,
                mobile_offline_mode: true,
                mobile_push_notifications: true
            };
            
            const { error: updateError } = await supabase
                .from('organizations')
                .update({ feature_flags: updatedFlags })
                .eq('id', org.id);
                
            if (updateError) {
                console.error(`❌ Failed to update ${org.name}:`, updateError);
            } else {
                console.log(`✅ Updated ${org.name} with mobile feature flags`);
            }
        }
        
        console.log('\n🎉 Feature flags update completed!');
        console.log('\nNow try:');
        console.log('1. Go to Settings → Features');
        console.log('2. Find "Mobile App" section');
        console.log('3. Toggle "Daily Visits (Mobile)" off');
        console.log('4. Refresh mobile app to see the change');
        
    } catch (error) {
        console.error('❌ Error updating feature flags:', error.message);
    }
}

updateFeatureFlags();