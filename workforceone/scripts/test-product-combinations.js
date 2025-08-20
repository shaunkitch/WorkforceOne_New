#!/usr/bin/env node

/**
 * Product Combination Testing Script
 * 
 * This script tests all possible product combinations to ensure:
 * 1. RLS policies work correctly
 * 2. Users can only access features for subscribed products
 * 3. Multi-product scenarios work seamlessly
 * 4. Product switching works properly
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Test configuration
const VERBOSE = process.argv.includes('--verbose');
const QUICK_MODE = process.argv.includes('--quick');

class ProductCombinationTester {
  constructor() {
    this.testResults = {
      passed: 0,
      failed: 0,
      errors: [],
      details: []
    };
    this.testOrg = null;
    this.testUsers = [];
    this.productIds = {};
  }

  async initialize() {
    console.log('🧪 Product Combination Testing Suite');
    console.log('====================================\n');

    // Load product IDs
    const { data: products } = await supabase.from('products').select('*');
    products.forEach(p => this.productIds[p.code] = p.id);

    console.log('✅ Products loaded:');
    Object.entries(this.productIds).forEach(([code, id]) => {
      console.log(`   ${code}: ${id}`);
    });

    await this.setupTestEnvironment();
  }

  async setupTestEnvironment() {
    console.log('\n🔧 Setting up test environment...');

    // Create test organization
    const { data: org, error } = await supabase
      .from('organizations')
      .insert({
        name: 'Product Test Organization',
        slug: `test-org-${Date.now()}`,
        settings: { test: true }
      })
      .select()
      .single();

    if (error) throw new Error(`Failed to create test org: ${error.message}`);
    
    this.testOrg = org;
    console.log(`   Created test organization: ${org.id}`);

    // Create test users with different product combinations
    const userConfigs = [
      { name: 'Remote Only User', products: ['remote'] },
      { name: 'Time Only User', products: ['time'] },
      { name: 'Guard Only User', products: ['guard'] },
      { name: 'Remote+Time User', products: ['remote', 'time'] },
      { name: 'Remote+Guard User', products: ['remote', 'guard'] },
      { name: 'Time+Guard User', products: ['time', 'guard'] },
      { name: 'All Products User', products: ['remote', 'time', 'guard'] },
      { name: 'No Products User', products: [] }
    ];

    for (const config of userConfigs) {
      const user = await this.createTestUser(config.name, config.products);
      this.testUsers.push({ ...user, config });
    }

    console.log(`   Created ${this.testUsers.length} test users`);
  }

  async createTestUser(name, productCodes) {
    // Create user in auth system (simulation)
    const userId = `test-user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Create profile
    const { data: profile, error } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        organization_id: this.testOrg.id,
        email: `${userId}@test.example.com`,
        full_name: name,
        role: 'employee'
      })
      .select()
      .single();

    if (error) throw new Error(`Failed to create user profile: ${error.message}`);

    // Grant organization subscriptions
    for (const productCode of productCodes) {
      await supabase.from('organization_subscriptions').insert({
        organization_id: this.testOrg.id,
        product_id: this.productIds[productCode],
        status: 'active',
        user_count: 10,
        unit_price: 0,
        current_period_start: new Date().toISOString(),
        current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      });

      // Grant user access
      await supabase.from('user_product_access').insert({
        user_id: userId,
        organization_id: this.testOrg.id,
        product_id: this.productIds[productCode],
        granted_at: new Date().toISOString(),
        is_active: true,
        permissions: { all_features: true }
      });
    }

    return { id: userId, name, products: productCodes };
  }

  async runAllTests() {
    console.log('\n🚀 Running product combination tests...\n');

    const testSuites = [
      { name: 'RLS Policy Tests', fn: () => this.testRLSPolicies() },
      { name: 'Feature Access Tests', fn: () => this.testFeatureAccess() },
      { name: 'Cross-Product Tests', fn: () => this.testCrossProductFeatures() },
      { name: 'Product Switching Tests', fn: () => this.testProductSwitching() },
      { name: 'Edge Case Tests', fn: () => this.testEdgeCases() }
    ];

    for (const suite of testSuites) {
      console.log(`\n📋 ${suite.name}`);
      console.log('-'.repeat(suite.name.length + 5));
      
      try {
        await suite.fn();
      } catch (error) {
        console.error(`❌ ${suite.name} failed:`, error.message);
        this.testResults.errors.push(`${suite.name}: ${error.message}`);
      }
    }
  }

  async testRLSPolicies() {
    const tables = [
      { name: 'teams', product: 'remote' },
      { name: 'tasks', product: 'remote' },
      { name: 'attendance', product: 'time' },
      { name: 'leave_requests', product: 'time' },
      { name: 'patrol_routes', product: 'guard' },
      { name: 'incidents', product: 'guard' }
    ];

    for (const table of tables) {
      await this.testTableAccess(table.name, table.product);
    }
  }

  async testTableAccess(tableName, requiredProduct) {
    if (VERBOSE) console.log(`   Testing ${tableName} (requires ${requiredProduct})...`);

    // Test each user's access to this table
    for (const user of this.testUsers) {
      const hasAccess = user.config.products.includes(requiredProduct);
      const testName = `${user.name} → ${tableName}`;
      
      try {
        // Create test record
        let testRecord = {
          organization_id: this.testOrg.id,
          name: `Test ${tableName} record`,
          product_id: this.productIds[requiredProduct]
        };

        // Add table-specific fields
        if (tableName === 'attendance') {
          testRecord.user_id = user.id;
          testRecord.clock_in = new Date().toISOString();
        } else if (tableName === 'leave_requests') {
          testRecord.user_id = user.id;
          testRecord.start_date = new Date().toISOString();
          testRecord.end_date = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
          testRecord.leave_type = 'vacation';
        } else if (tableName === 'incidents') {
          testRecord.reported_by = user.id;
          testRecord.title = 'Test Incident';
        }

        const { data, error } = await supabase
          .from(tableName)
          .insert(testRecord)
          .select();

        if (hasAccess) {
          if (error) {
            this.recordFailure(testName, `Should have access but got error: ${error.message}`);
          } else {
            this.recordSuccess(testName, 'Correct access granted');
          }
        } else {
          if (error) {
            this.recordSuccess(testName, 'Correctly denied access');
          } else {
            this.recordFailure(testName, 'Should be denied access but was allowed');
          }
        }

      } catch (error) {
        // Some tables might not exist in the test environment
        if (error.message.includes('does not exist')) {
          if (VERBOSE) console.log(`     ℹ️  ${tableName} table not found, skipping`);
          continue;
        }
        this.recordFailure(testName, `Test error: ${error.message}`);
      }
    }
  }

  async testFeatureAccess() {
    const featureTests = [
      {
        name: 'Team Creation',
        product: 'remote',
        test: async (userId) => {
          const { error } = await supabase
            .from('teams')
            .insert({
              organization_id: this.testOrg.id,
              name: `Test Team ${Date.now()}`,
              product_id: this.productIds.remote
            });
          return !error;
        }
      },
      {
        name: 'Time Clock',
        product: 'time',
        test: async (userId) => {
          const { error } = await supabase
            .from('attendance')
            .insert({
              user_id: userId,
              organization_id: this.testOrg.id,
              clock_in: new Date().toISOString(),
              product_id: this.productIds.time
            });
          return !error;
        }
      },
      {
        name: 'Patrol Creation',
        product: 'guard',
        test: async (userId) => {
          const { error } = await supabase
            .from('patrol_routes')
            .insert({
              organization_id: this.testOrg.id,
              name: `Test Patrol ${Date.now()}`,
              product_id: this.productIds.guard
            });
          return !error;
        }
      }
    ];

    for (const featureTest of featureTests) {
      for (const user of this.testUsers) {
        if (QUICK_MODE && Math.random() > 0.5) continue; // Skip some tests in quick mode

        const hasAccess = user.config.products.includes(featureTest.product);
        const testName = `${user.name} → ${featureTest.name}`;

        try {
          const result = await featureTest.test(user.id);
          
          if (hasAccess && result) {
            this.recordSuccess(testName, 'Feature access granted correctly');
          } else if (!hasAccess && !result) {
            this.recordSuccess(testName, 'Feature access denied correctly');
          } else if (hasAccess && !result) {
            this.recordFailure(testName, 'Feature should be accessible but failed');
          } else {
            this.recordFailure(testName, 'Feature should be denied but was allowed');
          }
        } catch (error) {
          this.recordFailure(testName, `Feature test error: ${error.message}`);
        }
      }
    }
  }

  async testCrossProductFeatures() {
    // Test features that span multiple products
    console.log('   Testing cross-product integrations...');

    // Test notifications (should work across all products)
    const notificationTest = {
      name: 'Cross-product Notifications',
      test: async () => {
        for (const user of this.testUsers.slice(0, 3)) { // Test first 3 users
          const { error } = await supabase
            .from('notifications')
            .insert({
              user_id: user.id,
              organization_id: this.testOrg.id,
              title: 'Test Notification',
              message: 'Cross-product test',
              type: 'info'
            });

          if (error) {
            return { success: false, error: error.message };
          }
        }
        return { success: true };
      }
    };

    try {
      const result = await notificationTest.test();
      if (result.success) {
        this.recordSuccess('Cross-product notifications', 'Works correctly');
      } else {
        this.recordFailure('Cross-product notifications', result.error);
      }
    } catch (error) {
      this.recordFailure('Cross-product notifications', `Test error: ${error.message}`);
    }
  }

  async testProductSwitching() {
    console.log('   Testing product switching scenarios...');

    // Test user with all products accessing different features
    const allProductsUser = this.testUsers.find(u => u.config.products.length === 3);
    if (!allProductsUser) {
      console.log('     ⚠️  No all-products user found, skipping product switching tests');
      return;
    }

    const switchingTests = [
      {
        name: 'Sequential Product Usage',
        test: async () => {
          // User should be able to use Remote features
          const { error: remoteError } = await supabase
            .from('tasks')
            .insert({
              organization_id: this.testOrg.id,
              title: 'Switch Test Task',
              product_id: this.productIds.remote
            });

          // Then Time features
          const { error: timeError } = await supabase
            .from('attendance')
            .insert({
              user_id: allProductsUser.id,
              organization_id: this.testOrg.id,
              clock_in: new Date().toISOString(),
              product_id: this.productIds.time
            });

          // Then Guard features
          const { error: guardError } = await supabase
            .from('patrol_routes')
            .insert({
              organization_id: this.testOrg.id,
              name: 'Switch Test Patrol',
              product_id: this.productIds.guard
            });

          return !remoteError && !timeError && !guardError;
        }
      }
    ];

    for (const test of switchingTests) {
      try {
        const success = await test.test();
        if (success) {
          this.recordSuccess(test.name, 'Product switching works correctly');
        } else {
          this.recordFailure(test.name, 'Product switching failed');
        }
      } catch (error) {
        this.recordFailure(test.name, `Switching test error: ${error.message}`);
      }
    }
  }

  async testEdgeCases() {
    console.log('   Testing edge cases...');

    const edgeCases = [
      {
        name: 'User with no products',
        test: async () => {
          const noProductsUser = this.testUsers.find(u => u.config.products.length === 0);
          if (!noProductsUser) return true;

          // Should not be able to create any records
          const { error } = await supabase
            .from('tasks')
            .insert({
              organization_id: this.testOrg.id,
              title: 'Should Fail Task',
              product_id: this.productIds.remote
            });

          return !!error; // Should have error
        }
      },
      {
        name: 'Shared resources access',
        test: async () => {
          // Test outlets which can be shared between Remote and Guard
          const { error } = await supabase
            .from('outlets')
            .insert({
              organization_id: this.testOrg.id,
              name: 'Test Shared Outlet',
              address: '123 Test St',
              product_id: this.productIds.remote // Assign to Remote
            });

          return !error;
        }
      }
    ];

    for (const edgeCase of edgeCases) {
      try {
        const success = await edgeCase.test();
        if (success) {
          this.recordSuccess(edgeCase.name, 'Edge case handled correctly');
        } else {
          this.recordFailure(edgeCase.name, 'Edge case failed');
        }
      } catch (error) {
        this.recordFailure(edgeCase.name, `Edge case error: ${error.message}`);
      }
    }
  }

  recordSuccess(testName, details) {
    this.testResults.passed++;
    this.testResults.details.push({ test: testName, result: 'PASS', details });
    if (VERBOSE) console.log(`     ✅ ${testName}: ${details}`);
  }

  recordFailure(testName, reason) {
    this.testResults.failed++;
    this.testResults.errors.push(`${testName}: ${reason}`);
    this.testResults.details.push({ test: testName, result: 'FAIL', details: reason });
    console.log(`     ❌ ${testName}: ${reason}`);
  }

  async cleanup() {
    console.log('\n🧹 Cleaning up test environment...');

    try {
      // Remove test users
      for (const user of this.testUsers) {
        await supabase.from('user_product_access').delete().eq('user_id', user.id);
        await supabase.from('profiles').delete().eq('id', user.id);
      }

      // Remove organization subscriptions
      await supabase
        .from('organization_subscriptions')
        .delete()
        .eq('organization_id', this.testOrg.id);

      // Remove test organization
      await supabase
        .from('organizations')
        .delete()
        .eq('id', this.testOrg.id);

      console.log('   ✅ Test environment cleaned up');
    } catch (error) {
      console.error('   ⚠️  Cleanup failed:', error.message);
    }
  }

  generateReport() {
    console.log('\n📊 Test Results Summary');
    console.log('=======================');
    console.log(`✅ Passed: ${this.testResults.passed}`);
    console.log(`❌ Failed: ${this.testResults.failed}`);
    console.log(`🔧 Total: ${this.testResults.passed + this.testResults.failed}`);

    if (this.testResults.failed > 0) {
      console.log('\n❌ Failures:');
      this.testResults.errors.forEach(error => {
        console.log(`   • ${error}`);
      });
    }

    const successRate = (this.testResults.passed / (this.testResults.passed + this.testResults.failed) * 100);
    console.log(`\n📈 Success Rate: ${successRate.toFixed(1)}%`);

    if (successRate >= 95) {
      console.log('🎉 Excellent! Product combinations are working correctly.');
    } else if (successRate >= 80) {
      console.log('⚠️  Good, but some issues need attention.');
    } else {
      console.log('🚨 Significant issues found. Review failed tests before going live.');
    }

    // Recommendations
    console.log('\n💡 Recommendations:');
    if (this.testResults.failed === 0) {
      console.log('   • All tests passed! The multi-product system is ready.');
      console.log('   • Consider running these tests regularly to catch regressions.');
    } else {
      console.log('   • Review and fix failed tests before deploying to production.');
      console.log('   • Focus on RLS policies and access control issues first.');
      console.log('   • Test with real user scenarios after fixes.');
    }
  }

  async run() {
    try {
      await this.initialize();
      await this.runAllTests();
      this.generateReport();
    } catch (error) {
      console.error('\n💥 Test suite failed:', error.message);
      process.exit(1);
    } finally {
      await this.cleanup();
    }
  }
}

// Run the tests
if (require.main === module) {
  const tester = new ProductCombinationTester();
  tester.run().catch(console.error);
}

module.exports = ProductCombinationTester;