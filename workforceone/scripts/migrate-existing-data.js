#!/usr/bin/env node

/**
 * Migration Script for Existing WorkforceOne Data
 * 
 * This script helps migrate existing monolithic data to the new
 * multi-product architecture by assigning appropriate product_id
 * values to existing records based on their usage patterns.
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Configuration
const DRY_RUN = process.argv.includes('--dry-run');
const VERBOSE = process.argv.includes('--verbose');

// Product mappings
const PRODUCT_CODES = {
  REMOTE: 'remote',
  TIME: 'time',
  GUARD: 'guard'
};

class DataMigrator {
  constructor() {
    this.productIds = {};
    this.stats = {
      organizations: 0,
      users: 0,
      tablesProcessed: 0,
      recordsUpdated: 0,
      errors: 0
    };
  }

  async initialize() {
    console.log('🚀 Starting WorkforceOne data migration...');
    console.log(`Mode: ${DRY_RUN ? 'DRY RUN' : 'LIVE MIGRATION'}`);
    console.log('=====================================\n');

    // Load product IDs
    const { data: products, error } = await supabase
      .from('products')
      .select('id, code');

    if (error) {
      throw new Error(`Failed to load products: ${error.message}`);
    }

    products.forEach(product => {
      this.productIds[product.code] = product.id;
    });

    console.log('✅ Product IDs loaded:');
    Object.entries(this.productIds).forEach(([code, id]) => {
      console.log(`   ${code}: ${id}`);
    });
    console.log();
  }

  async migrateOrganizationData() {
    console.log('📊 Migrating organization-level data...');
    
    try {
      // Get all organizations
      const { data: organizations, error } = await supabase
        .from('organizations')
        .select('id, name, feature_flags');

      if (error) throw error;

      console.log(`   Found ${organizations.length} organizations`);

      for (const org of organizations) {
        await this.analyzeOrganizationUsage(org);
      }

      this.stats.organizations = organizations.length;
    } catch (error) {
      console.error('❌ Organization migration failed:', error.message);
      this.stats.errors++;
    }
  }

  async analyzeOrganizationUsage(org) {
    if (VERBOSE) {
      console.log(`   Analyzing organization: ${org.name} (${org.id})`);
    }

    try {
      // Check what features this organization is actually using
      const usage = await this.getOrganizationUsagePatterns(org.id);
      
      // Determine which products they should have access to
      const recommendedProducts = this.determineProductNeeds(usage);
      
      if (VERBOSE) {
        console.log(`     Usage patterns:`, usage);
        console.log(`     Recommended products:`, recommendedProducts);
      }

      // Store recommendations for manual review
      if (!DRY_RUN) {
        await supabase
          .from('organizations')
          .update({
            migration_analysis: {
              usage_patterns: usage,
              recommended_products: recommendedProducts,
              analyzed_at: new Date().toISOString()
            }
          })
          .eq('id', org.id);
      }

    } catch (error) {
      console.error(`     ❌ Failed to analyze org ${org.id}:`, error.message);
      this.stats.errors++;
    }
  }

  async getOrganizationUsagePatterns(orgId) {
    const usage = {
      remote: { score: 0, indicators: [] },
      time: { score: 0, indicators: [] },
      guard: { score: 0, indicators: [] }
    };

    try {
      // Remote product indicators
      const { data: teams } = await supabase
        .from('teams')
        .select('id')
        .eq('organization_id', orgId);
      
      if (teams && teams.length > 0) {
        usage.remote.score += teams.length * 10;
        usage.remote.indicators.push(`${teams.length} teams`);
      }

      const { data: tasks } = await supabase
        .from('tasks')
        .select('id')
        .eq('organization_id', orgId);
      
      if (tasks && tasks.length > 0) {
        usage.remote.score += Math.min(tasks.length, 100);
        usage.remote.indicators.push(`${tasks.length} tasks`);
      }

      const { data: forms } = await supabase
        .from('forms')
        .select('id')
        .eq('organization_id', orgId);
      
      if (forms && forms.length > 0) {
        usage.remote.score += forms.length * 5;
        usage.remote.indicators.push(`${forms.length} forms`);
      }

      // Time product indicators
      const { data: attendance } = await supabase
        .from('attendance')
        .select('id')
        .eq('organization_id', orgId)
        .limit(1);
      
      if (attendance && attendance.length > 0) {
        const { count } = await supabase
          .from('attendance')
          .select('*', { count: 'exact', head: true })
          .eq('organization_id', orgId);
        
        usage.time.score += Math.min(count || 0, 200);
        usage.time.indicators.push(`${count} attendance records`);
      }

      const { data: leaveRequests } = await supabase
        .from('leave_requests')
        .select('id')
        .eq('organization_id', orgId);
      
      if (leaveRequests && leaveRequests.length > 0) {
        usage.time.score += leaveRequests.length * 2;
        usage.time.indicators.push(`${leaveRequests.length} leave requests`);
      }

      // Guard product indicators  
      const { data: patrols } = await supabase
        .from('patrol_routes')
        .select('id')
        .eq('organization_id', orgId);
      
      if (patrols && patrols.length > 0) {
        usage.guard.score += patrols.length * 20;
        usage.guard.indicators.push(`${patrols.length} patrol routes`);
      }

      const { data: incidents } = await supabase
        .from('incidents')
        .select('id')
        .eq('organization_id', orgId);
      
      if (incidents && incidents.length > 0) {
        usage.guard.score += incidents.length * 5;
        usage.guard.indicators.push(`${incidents.length} incidents`);
      }

    } catch (error) {
      console.error('Error analyzing usage patterns:', error);
    }

    return usage;
  }

  determineProductNeeds(usage) {
    const products = [];
    
    // Thresholds for recommending products
    if (usage.remote.score > 20) {
      products.push('remote');
    }
    
    if (usage.time.score > 10) {
      products.push('time');
    }
    
    if (usage.guard.score > 15) {
      products.push('guard');
    }

    // If no clear usage, default to Remote (most common)
    if (products.length === 0) {
      products.push('remote');
    }

    return products;
  }

  async migrateTableData() {
    console.log('📝 Migrating table-level data...');

    // Tables that need product_id assignment based on content analysis
    const smartMigrationTables = [
      'notification_templates',
      'outlets',
      'email_templates'
    ];

    for (const tableName of smartMigrationTables) {
      await this.migrateSmartTable(tableName);
    }

    // Tables that can be bulk assigned to products
    const bulkMigrationTables = [
      { table: 'teams', product: 'remote' },
      { table: 'tasks', product: 'remote' },
      { table: 'projects', product: 'remote' },
      { table: 'forms', product: 'remote' },
      { table: 'attendance', product: 'time' },
      { table: 'time_entries', product: 'time' },
      { table: 'leave_requests', product: 'time' },
      { table: 'patrol_routes', product: 'guard' },
      { table: 'incidents', product: 'guard' }
    ];

    for (const { table, product } of bulkMigrationTables) {
      await this.migrateBulkTable(table, product);
    }
  }

  async migrateSmartTable(tableName) {
    console.log(`   🧠 Smart migration: ${tableName}`);
    
    try {
      const { data: records, error } = await supabase
        .from(tableName)
        .select('*')
        .is('product_id', null);

      if (error) throw error;

      if (!records || records.length === 0) {
        console.log(`     ✅ No records to migrate in ${tableName}`);
        return;
      }

      let updated = 0;

      for (const record of records) {
        const productId = await this.determineRecordProduct(tableName, record);
        
        if (productId && !DRY_RUN) {
          const { error: updateError } = await supabase
            .from(tableName)
            .update({ product_id: productId })
            .eq('id', record.id);

          if (updateError) {
            console.error(`       ❌ Failed to update record ${record.id}:`, updateError.message);
            this.stats.errors++;
          } else {
            updated++;
          }
        }
      }

      console.log(`     ✅ Updated ${updated} records in ${tableName}`);
      this.stats.recordsUpdated += updated;

    } catch (error) {
      console.error(`     ❌ Smart migration failed for ${tableName}:`, error.message);
      this.stats.errors++;
    }
  }

  async determineRecordProduct(tableName, record) {
    switch (tableName) {
      case 'notification_templates':
        return this.classifyNotificationTemplate(record);
      case 'outlets':
        return this.classifyOutlet(record);
      case 'email_templates':
        return this.classifyEmailTemplate(record);
      default:
        return this.productIds[PRODUCT_CODES.REMOTE]; // Default fallback
    }
  }

  classifyNotificationTemplate(record) {
    const name = (record.name || '').toLowerCase();
    const type = (record.type || '').toLowerCase();
    const content = (record.content || '').toLowerCase();
    
    const text = `${name} ${type} ${content}`;
    
    // Time product keywords
    if (text.match(/\b(attendance|leave|timesheet|clock|time|payroll|overtime)\b/)) {
      return this.productIds[PRODUCT_CODES.TIME];
    }
    
    // Guard product keywords
    if (text.match(/\b(patrol|incident|security|checkpoint|guard|alert|emergency)\b/)) {
      return this.productIds[PRODUCT_CODES.GUARD];
    }
    
    // Default to Remote
    return this.productIds[PRODUCT_CODES.REMOTE];
  }

  classifyOutlet(record) {
    // For now, assign outlets to Remote as they're primarily used in routes
    // In the future, we could analyze outlet usage patterns
    return this.productIds[PRODUCT_CODES.REMOTE];
  }

  classifyEmailTemplate(record) {
    const subject = (record.subject || '').toLowerCase();
    const body = (record.body || '').toLowerCase();
    const name = (record.name || '').toLowerCase();
    
    const text = `${subject} ${body} ${name}`;
    
    if (text.match(/\b(attendance|leave|timesheet|clock|payroll)\b/)) {
      return this.productIds[PRODUCT_CODES.TIME];
    }
    
    if (text.match(/\b(patrol|incident|security|guard)\b/)) {
      return this.productIds[PRODUCT_CODES.GUARD];
    }
    
    return this.productIds[PRODUCT_CODES.REMOTE];
  }

  async migrateBulkTable(tableName, productCode) {
    console.log(`   📦 Bulk migration: ${tableName} → ${productCode}`);
    
    try {
      const productId = this.productIds[productCode];
      
      const { count, error } = await supabase
        .from(tableName)
        .select('*', { count: 'exact', head: true })
        .is('product_id', null);

      if (error) throw error;

      if (count === 0) {
        console.log(`     ✅ No records to migrate in ${tableName}`);
        return;
      }

      if (!DRY_RUN) {
        const { error: updateError } = await supabase
          .from(tableName)
          .update({ product_id: productId })
          .is('product_id', null);

        if (updateError) throw updateError;
      }

      console.log(`     ✅ Updated ${count} records in ${tableName}`);
      this.stats.recordsUpdated += count;
      this.stats.tablesProcessed++;

    } catch (error) {
      console.error(`     ❌ Bulk migration failed for ${tableName}:`, error.message);
      this.stats.errors++;
    }
  }

  async validateMigration() {
    console.log('🔍 Validating migration results...');
    
    try {
      // Check for records without product_id
      const problematicTables = [
        'tasks', 'teams', 'forms', 'projects',
        'attendance', 'leave_requests', 'time_entries',
        'patrol_routes', 'incidents'
      ];

      let totalOrphaned = 0;

      for (const tableName of problematicTables) {
        try {
          const { count } = await supabase
            .from(tableName)
            .select('*', { count: 'exact', head: true })
            .is('product_id', null);

          if (count > 0) {
            console.log(`     ⚠️  ${tableName}: ${count} records without product_id`);
            totalOrphaned += count;
          }
        } catch (error) {
          // Table might not exist, skip
          if (VERBOSE) {
            console.log(`     ℹ️  ${tableName}: table not found (skipped)`);
          }
        }
      }

      if (totalOrphaned === 0) {
        console.log('     ✅ All critical records have product_id assigned');
      } else {
        console.log(`     ⚠️  Total orphaned records: ${totalOrphaned}`);
      }

    } catch (error) {
      console.error('❌ Validation failed:', error.message);
    }
  }

  async generateReport() {
    console.log('\n📋 Migration Report');
    console.log('===================');
    console.log(`Organizations analyzed: ${this.stats.organizations}`);
    console.log(`Tables processed: ${this.stats.tablesProcessed}`);
    console.log(`Records updated: ${this.stats.recordsUpdated}`);
    console.log(`Errors encountered: ${this.stats.errors}`);
    
    if (DRY_RUN) {
      console.log('\n⚠️  This was a DRY RUN - no data was actually modified');
      console.log('Run without --dry-run to perform the actual migration');
    } else {
      console.log('\n✅ Migration completed successfully!');
    }

    console.log('\nNext Steps:');
    console.log('1. Review organization analysis in the organizations.migration_analysis column');
    console.log('2. Run validation queries to ensure data integrity');
    console.log('3. Test product access controls with real users');
    console.log('4. Monitor for any access issues and adjust as needed');
  }

  async run() {
    try {
      await this.initialize();
      await this.migrateOrganizationData();
      await this.migrateTableData();
      await this.validateMigration();
      await this.generateReport();
    } catch (error) {
      console.error('\n💥 Migration failed:', error.message);
      process.exit(1);
    }
  }
}

// Run the migration
const migrator = new DataMigrator();
migrator.run().catch(console.error);