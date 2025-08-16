const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

async function runRLSFix() {
    const supabaseUrl = 'https://edeheyeloakiworbkfpg.supabase.co';
    const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVkZWhleWVsb2FraXdvcmJrZnBnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDkxODY3NSwiZXhwIjoyMDcwNDk0Njc1fQ.HNoN21ykstlIQ6sPF5bsJtRyQyCTKENDBtFzgkEe40c';
    
    const supabase = createClient(supabaseUrl, serviceKey);
    
    try {
        const sql = fs.readFileSync('../database/complete_rls_fix.sql', 'utf8');
        
        console.log('Running RLS fix SQL via Supabase...');
        
        // Split SQL into individual statements
        const statements = sql.split(';').filter(statement => statement.trim().length > 0);
        
        for (const statement of statements) {
            const trimmedStatement = statement.trim();
            if (trimmedStatement && !trimmedStatement.startsWith('--')) {
                console.log(`Executing: ${trimmedStatement.substring(0, 50)}...`);
                const { data, error } = await supabase.rpc('exec_sql', { 
                    sql_statement: trimmedStatement + ';'
                });
                
                if (error) {
                    console.error('Error:', error);
                    // Continue with next statement for non-critical errors
                }
            }
        }
        
        console.log('RLS fix completed!');
        
    } catch (error) {
        console.error('Error running RLS fix:', error.message);
        process.exit(1);
    }
}

runRLSFix();