#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

console.log('🔧 WorkforceOne Security Guard System Migration');
console.log('=============================================\n');

// Supabase configuration
const supabaseUrl = 'https://edeheyeloakiworbkfpg.supabase.co';
const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVkZWhleWVsb2FraXdvcmJrZnBnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDkxODY3NSwiZXhwIjoyMDcwNDk0Njc1fQ.HNoN21ykstlIQ6sPF5bsJtRyQyCTKENDBtFzgkEe40c';

const supabase = createClient(supabaseUrl, serviceKey);

async function applySecurityGuardMigration() {
    try {
        console.log('📖 Reading security guard migration file...');
        
        const migrationPath = path.join(__dirname, '..', 'database', 'migrations', '073_security_guard_system.sql');
        
        if (!fs.existsSync(migrationPath)) {
            console.error('❌ Migration file not found:', migrationPath);
            process.exit(1);
        }
        
        const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
        
        console.log('🚀 Applying security guard system migration...');
        console.log('📋 This will create:');
        console.log('   • patrol_routes');
        console.log('   • patrol_checkpoints');
        console.log('   • patrol_sessions');
        console.log('   • patrol_locations');
        console.log('   • checkpoint_scans');
        console.log('   • incidents');
        console.log('   • incident_attachments');
        console.log('   • guard_assignments');
        console.log('   • Various views and enums\n');
        
        // Apply the migration
        const { data, error } = await supabase.rpc('exec_sql', {
            sql_statement: migrationSQL
        });
        
        if (error) {
            console.error('❌ Migration failed:', error.message);
            console.error('Details:', error);
            
            // Try applying in smaller chunks if the main migration fails
            console.log('\n🔄 Attempting to apply migration in smaller chunks...');
            await applyMigrationInChunks(migrationSQL);
        } else {
            console.log('✅ Security guard migration applied successfully!');
            console.log('📊 Result:', data);
        }
        
        // Verify the migration
        await verifyMigration();
        
    } catch (error) {
        console.error('💥 Unexpected error:', error.message);
        process.exit(1);
    }
}

async function applyMigrationInChunks(migrationSQL) {
    try {
        // Split the migration into smaller statements
        const statements = migrationSQL
            .split(';')
            .map(stmt => stmt.trim())
            .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
        
        console.log(`📊 Found ${statements.length} SQL statements to execute`);
        
        let successCount = 0;
        let failureCount = 0;
        
        for (let i = 0; i < statements.length; i++) {
            const statement = statements[i] + ';';
            
            try {
                console.log(`⏳ Executing statement ${i + 1}/${statements.length}...`);
                
                const { error } = await supabase.rpc('exec_sql', {
                    sql_statement: statement
                });
                
                if (error) {
                    console.log(`⚠️  Statement ${i + 1} failed:`, error.message);
                    failureCount++;
                } else {
                    console.log(`✅ Statement ${i + 1} succeeded`);
                    successCount++;
                }
                
                // Small delay to avoid overwhelming the database
                await new Promise(resolve => setTimeout(resolve, 100));
                
            } catch (error) {
                console.log(`❌ Statement ${i + 1} error:`, error.message);
                failureCount++;
            }
        }
        
        console.log(`\n📊 Migration Summary:`);
        console.log(`   ✅ Successful: ${successCount}`);
        console.log(`   ❌ Failed: ${failureCount}`);
        console.log(`   📈 Success Rate: ${Math.round((successCount / (successCount + failureCount)) * 100)}%`);
        
        if (successCount > 0) {
            console.log('\n🎉 Migration partially successful! Core functionality should work.');
        }
        
    } catch (error) {
        console.error('💥 Error applying migration in chunks:', error.message);
    }
}

async function verifyMigration() {
    try {
        console.log('\n🔍 Verifying migration success...');
        
        // Check if key tables exist
        const tablesToCheck = [
            'patrol_routes',
            'patrol_checkpoints', 
            'patrol_sessions',
            'patrol_locations',
            'checkpoint_scans',
            'incidents',
            'incident_attachments',
            'guard_assignments'
        ];
        
        const viewsToCheck = [
            'active_patrol_sessions',
            'recent_incidents_summary',
            'guard_performance_stats'
        ];
        
        let tablesExist = 0;
        let viewsExist = 0;
        
        // Check tables
        for (const table of tablesToCheck) {
            try {
                const { data, error } = await supabase
                    .from(table)
                    .select('count(*)', { count: 'exact', head: true });
                
                if (!error) {
                    console.log(`✅ Table '${table}' exists`);
                    tablesExist++;
                } else {
                    console.log(`❌ Table '${table}' missing:`, error.message);
                }
            } catch (error) {
                console.log(`❌ Table '${table}' check failed:`, error.message);
            }
        }
        
        // Check views
        for (const view of viewsToCheck) {
            try {
                const { data, error } = await supabase
                    .from(view)
                    .select('count(*)', { count: 'exact', head: true });
                
                if (!error) {
                    console.log(`✅ View '${view}' exists`);
                    viewsExist++;
                } else {
                    console.log(`❌ View '${view}' missing:`, error.message);
                }
            } catch (error) {
                console.log(`❌ View '${view}' check failed:`, error.message);
            }
        }
        
        console.log(`\n📊 Verification Results:`);
        console.log(`   📋 Tables: ${tablesExist}/${tablesToCheck.length} exist`);
        console.log(`   👁️  Views: ${viewsExist}/${viewsToCheck.length} exist`);
        
        if (tablesExist === tablesToCheck.length && viewsExist === viewsToCheck.length) {
            console.log('\n🎉 MIGRATION SUCCESSFUL! Security guard system is ready.');
            console.log('\n🚀 Next Steps:');
            console.log('   1. Test the mobile app patrol features');
            console.log('   2. Access the security dashboard at /security');
            console.log('   3. Create patrol routes and checkpoints');
            console.log('   4. Assign guards to patrol routes');
        } else {
            console.log('\n⚠️  PARTIAL SUCCESS - Some components may not work correctly.');
            console.log('   Consider re-running the migration or manually creating missing objects.');
        }
        
    } catch (error) {
        console.error('💥 Verification failed:', error.message);
    }
}

// Run the migration
if (require.main === module) {
    applySecurityGuardMigration();
}

module.exports = { applySecurityGuardMigration };