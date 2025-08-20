# Complete Schema Analysis & Product Mapping

Based on the provided schema, I've analyzed all 118 tables and mapped them to our three products. Here's the comprehensive breakdown:

## 📊 Table Count Summary
- **Total Tables**: 118
- **Core/Shared Tables**: 15
- **WorkforceOne Remote™**: 29 tables
- **WorkforceOne Time™**: 12 tables  
- **WorkforceOne Guard™**: 22 tables
- **System/Admin Tables**: 40 tables

---

## 🔷 CORE/SHARED TABLES (Used by all products)

### Authentication & Organization
```sql
-- Core tables that all products need
organizations              -- Multi-tenant base
profiles                  -- User profiles (enhanced with work_type)
organization_settings     -- Shared settings
organization_branding     -- Custom branding
device_tokens             -- Push notifications
notification_preferences  -- User preferences
notifications             -- Unified notification system
```

### Billing & Subscriptions (Will be replaced)
```sql
-- Current billing - TO BE REPLACED
subscriptions             -- Replace with product-specific
invoices                  -- Enhance for multi-product
invoice_items             -- Enhance for multi-product
payment_methods           -- Keep as-is
promo_codes              -- Keep as-is
applied_promos           -- Keep as-is
```

### System Core
```sql
documents                 -- File attachments (all products)
system_logs              -- System logging
regional_presets         -- Regional settings
```

---

## 🟦 WORKFORCEONE REMOTE™ TABLES (29 tables)

### Team Management
```sql
teams                     -- ✅ Team structure
team_members             -- ✅ Team membership
```

### Task Management
```sql
tasks                     -- ✅ Core task system
task_assignments         -- ✅ Team task assignments
task_comments            -- ✅ Task collaboration
task_attachments         -- ✅ Task files
```

### Project Management
```sql
projects                 -- ✅ Project tracking
```

### Forms System
```sql
forms                    -- ✅ Form builder
form_templates           -- ✅ Form templates
form_responses           -- ✅ Form submissions
form_assignments         -- ✅ Form assignment
form_notifications       -- ✅ Form alerts
form_analytics           -- ✅ Form metrics
form_field_types         -- ✅ Field definitions
form_file_uploads        -- ✅ Form attachments
```

### Communication
```sql
company_invitations      -- ✅ Team invitations
in_app_messages         -- ✅ Internal messaging
message_participants    -- ✅ Message participants
```

### Routes & Field Work
```sql
routes                   -- ✅ Route planning
route_stops             -- ✅ Route waypoints  
route_assignments       -- ✅ Route assignment
route_tracking          -- ✅ Route monitoring
route_optimization_settings -- ✅ Route config
outlets                 -- ✅ Location management
outlet_users           -- ✅ Outlet assignments
outlet_teams           -- ✅ Outlet team access
outlet_visits          -- ✅ Visit tracking
outlet_group_forms     -- ✅ Group form assignments
daily_calls            -- ✅ Service calls
```

### Workflow System
```sql
workflow_templates      -- ✅ Automation
workflow_instances     -- ✅ Running workflows
workflow_steps         -- ✅ Workflow steps
workflow_step_executions -- ✅ Step tracking
workflow_conditions    -- ✅ Conditions
workflow_approvals     -- ✅ Approval process
workflow_logs          -- ✅ Workflow logs
workflow_action_queue  -- ✅ Action queue
workflow_actions       -- ✅ Available actions
workflow_triggers      -- ✅ Event triggers
workflow_trigger_config -- ✅ Trigger setup
workflow_trigger_events -- ✅ Event history
```

---

## 🟢 WORKFORCEONE TIME™ TABLES (12 tables)

### Time Tracking
```sql
attendance               -- ✅ Clock in/out records
time_entries            -- ✅ Manual time entries
attendance_reminders    -- ✅ Clock-in reminders
```

### Leave Management
```sql
leave_requests          -- ✅ Leave applications
leave_balances         -- ✅ Leave quotas
```

### Payroll
```sql
payslips               -- ✅ Pay stub generation
user_tier_pricing     -- ✅ Pricing tiers
```

### Email System (Time-related notifications)
```sql
email_integrations     -- ✅ Email setup
email_templates        -- ✅ Email templates
email_logs            -- ✅ Email tracking
```

### Notifications
```sql
notification_templates -- ✅ Template system
```

### Signup Management
```sql
signup_requests        -- ✅ Approval workflow
organization_signup_settings -- ✅ Signup config
```

---

## 🟠 WORKFORCEONE GUARD™ TABLES (22 tables)

### Patrol Management
```sql
patrol_routes           -- ✅ Security routes
patrol_checkpoints      -- ✅ QR checkpoints
patrol_sessions         -- ✅ Active patrols
patrol_locations        -- ✅ GPS tracking
checkpoint_scans        -- ✅ Scan records
```

### Guard Management
```sql
guard_assignments       -- ✅ Shift assignments
guard_invitations       -- ✅ Guard onboarding
security_guard_invitations -- ✅ New invite system
```

### Incident Management
```sql
incidents               -- ✅ Security incidents
incident_attachments    -- ✅ Evidence files
incident_witnesses      -- ✅ Witness statements
```

### System Monitoring (Guard-specific)
```sql
system_metrics          -- ✅ Security metrics
system_alerts           -- ✅ Security alerts
system_health_snapshots -- ✅ Health monitoring
alert_rules             -- ✅ Alert configuration
admin_activity_log      -- ✅ Admin actions
```

### Features & Usage
```sql
features                -- ✅ Feature definitions
feature_usage           -- ✅ Usage tracking
subscription_features   -- ✅ Feature enablement
```

### Color Schemes (Guard branding)
```sql
branding_color_schemes  -- ✅ Theme options
```

---

## ⚙️ SYSTEM/ADMIN TABLES (Not product-specific)

These tables support the overall system but aren't tied to specific products:
- Global admin functionality
- System monitoring
- Feature management
- Usage analytics

---

## 🔄 REQUIRED SCHEMA CHANGES

### 1. New Product System Tables
```sql
-- New core tables for product system
products                 -- Product definitions (Remote, Time, Guard)
organization_subscriptions -- Multi-product subscriptions
user_product_access      -- User access to specific products
product_features         -- Product feature mapping
billing_history          -- Multi-product billing
```

### 2. Table Modifications Required

#### Add product_id to feature tables:
```sql
ALTER TABLE tasks ADD COLUMN product_id UUID REFERENCES products(id);
ALTER TABLE forms ADD COLUMN product_id UUID REFERENCES products(id);  
ALTER TABLE attendance ADD COLUMN product_id UUID REFERENCES products(id);
ALTER TABLE patrol_routes ADD COLUMN product_id UUID REFERENCES products(id);
ALTER TABLE incidents ADD COLUMN product_id UUID REFERENCES products(id);
```

#### Enhance profiles table:
```sql
-- Already has work_type field - perfect for product mapping
-- work_type: 'field' -> Remote, 'office' -> Time, 'security' -> Guard
```

#### Update organizations table:
```sql
-- Replace single feature_flags with product-based structure
-- Add product_subscriptions jsonb field
```

### 3. RLS Policy Updates
Every product-specific table needs new RLS policies:
```sql
-- Example for tasks table
CREATE POLICY "tasks_product_access" ON tasks
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM user_product_access upa
    JOIN products p ON p.id = upa.product_id
    WHERE upa.user_id = auth.uid()
    AND p.code = 'remote'
    AND upa.is_active = true
  )
);
```

---

## 📋 MIGRATION STRATEGY

### Phase 1: Core Product Infrastructure
1. Create new product system tables
2. Populate products table with 3 products
3. Create organization subscriptions for existing orgs
4. Grant all users access to all products (grandfathering)

### Phase 2: Table-by-Table Migration
1. Add product_id columns to all product-specific tables
2. Populate product_id based on table type
3. Update RLS policies progressively
4. Test each table after migration

### Phase 3: Frontend Updates
1. Implement product access checks
2. Create product-specific navigation
3. Build product switcher UI
4. Update all components with product guards

### Phase 4: Billing System
1. Replace single subscription with multi-product
2. Implement product-specific billing
3. Create upgrade/downgrade flows
4. Build usage tracking per product

---

## 🎯 CRITICAL INSIGHTS

### Complex Table Relationships:
1. **tasks** → **projects** → **teams** (all Remote)
2. **patrol_sessions** → **patrol_routes** → **patrol_checkpoints** (all Guard)
3. **attendance** → **leave_requests** → **payslips** (all Time)
4. **form_responses** → **forms** → **form_templates** (all Remote)

### Cross-Product Dependencies:
1. **outlets** used by both Remote (visits) and Guard (patrol areas)
2. **notifications** spans all products
3. **profiles** central to everything
4. **organizations** core to all products

### Potential Challenges:
1. **Workflow system** is complex - 12 tables all interconnected
2. **Form system** has deep relationships across 8 tables
3. **Route system** overlaps between Remote (daily routes) and Guard (patrol routes)
4. **Notification system** needs product-aware filtering

### Smart Defaults:
1. Users with `work_type = 'security'` → Guard product
2. Users with `work_type = 'field'` → Remote product  
3. Users with `work_type = 'office'` → Time product
4. Existing feature flags can map to product permissions

---

This analysis shows we have a sophisticated system with 118 tables that can be cleanly separated into three focused products while maintaining shared core functionality. The modularization is technically feasible and will dramatically improve the user experience.

Next step: Create the detailed migration scripts for each phase.