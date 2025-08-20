# Current System Analysis - Complete Feature Inventory

## 🔍 Current Database Tables & Their Product Mapping

### Core Tables (Shared Across All Products)
- `organizations` - All products
- `profiles` - All products  
- `subscriptions` - Will be replaced with product-specific subscriptions
- `notification_preferences` - All products
- `notifications` - All products
- `device_tokens` - All products
- `audit_logs` - All products

### WorkforceOne Remote™ Tables
- `teams` - Team management
- `team_members` - Team membership
- `tasks` - Task management
- `task_assignments` - Task assignments to teams
- `task_comments` - Task collaboration
- `projects` - Project management
- `project_members` - Project team assignments
- `forms` - Form builder
- `form_responses` - Form submissions
- `form_templates` - Form templates
- `announcements` - Company announcements
- `announcement_reads` - Announcement tracking

### WorkforceOne Time™ Tables
- `attendance` - Clock in/out records
- `time_entries` - Manual time entries
- `leave_requests` - Leave management
- `leave_types` - Leave categories
- `leave_balances` - Leave quotas
- `timesheets` - Timesheet submissions
- `overtime_rules` - Overtime calculations
- `work_schedules` - Employee schedules
- `breaks` - Break tracking

### WorkforceOne Guard™ Tables
- `patrol_routes` - Security patrol routes
- `patrol_checkpoints` - QR code checkpoints
- `patrol_sessions` - Active patrol tracking
- `checkpoint_scans` - Scan records
- `security_incidents` - Incident reports
- `incident_attachments` - Incident evidence
- `guard_locations` - Real-time tracking
- `emergency_contacts` - Emergency response
- `security_guard_invitations` - Guard onboarding

### Shared/Utility Tables
- `outlets` - Used by Remote & Guard
- `locations` - Used by Time & Guard
- `files` - All products (attachments)
- `activity_logs` - All products
- `system_settings` - All products
- `feature_flags` - Will need product-based flags

---

## 📁 Current File Structure & Product Mapping

### Frontend Components Inventory

#### Dashboard Pages (`frontend/app/dashboard/`)
**Remote Product:**
- `teams/page.tsx` - Team management
- `tasks/page.tsx` - Task management
- `projects/page.tsx` - Project management
- `forms/page.tsx` - Form builder
- `announcements/page.tsx` - Announcements

**Time Product:**
- `attendance/page.tsx` - Attendance tracking
- `clock/page.tsx` - Time clock
- `leave/page.tsx` - Leave management
- `reports/page.tsx` - Time reports
- `timesheets/page.tsx` - Timesheet management

**Guard Product:**
- `security/page.tsx` - Security dashboard
- `patrol/page.tsx` - Patrol management
- `incidents/page.tsx` - Incident reports
- `routes/page.tsx` - Route management
- `monitoring/page.tsx` - Live monitoring

**Shared Pages:**
- `page.tsx` - Main dashboard (needs product switching)
- `settings/page.tsx` - User settings
- `profile/page.tsx` - User profile
- `help/page.tsx` - Help center

#### Components (`frontend/components/`)
**Remote Components:**
- `tasks/` - Task components
- `teams/` - Team components
- `projects/` - Project components
- `forms/` - Form components

**Time Components:**
- `attendance/` - Attendance components
- `time-tracking/` - Time tracking widgets
- `leave/` - Leave components

**Guard Components:**
- `security/` - Security components
- `SecurityMap.tsx` - Live tracking map
- `patrol/` - Patrol components

**Shared Components:**
- `ui/` - Base UI components
- `navigation/` - Navigation components
- `notifications/` - Notification system
- `charts/` - Analytics charts

---

## 📱 Mobile App Components & Product Mapping

### Mobile Screens (`mobile-app/WorkforceOneMobile/screens/`)

**Remote Screens:**
- `TasksScreen.tsx`
- `TaskDetailScreen.tsx`
- `TeamsScreen.tsx`
- `FormsScreen.tsx`
- `FormCompletionScreen.tsx`
- `AnnouncementsScreen.tsx`

**Time Screens:**
- `HomeScreen.tsx` (Clock In/Out section)
- `AttendanceScreen.tsx`
- `LeaveRequestScreen.tsx`
- `TimesheetScreen.tsx`

**Guard Screens:**
- `PatrolDashboardScreen.tsx`
- `PatrolCheckpointsScreen.tsx`
- `IncidentReportScreen.tsx`
- `SecurityMapScreen.tsx`

**Shared Screens:**
- `auth/LoginScreen.tsx`
- `auth/SignupScreen.tsx`
- `ProfileScreen.tsx`
- `SettingsScreen.tsx`
- `NotificationCenterScreen.tsx`

### Mobile Services (`mobile-app/WorkforceOneMobile/services/`)
- `PatrolService.ts` - Guard product
- `TaskService.ts` - Remote product
- `AttendanceService.ts` - Time product
- `NotificationService.ts` - All products

---

## 🔐 Current RLS Policies Analysis

### Tables Needing Product-Based RLS:
1. **tasks** - Restrict to Remote subscribers
2. **attendance** - Restrict to Time subscribers
3. **patrol_routes** - Restrict to Guard subscribers
4. **forms** - Restrict to Remote subscribers
5. **leave_requests** - Restrict to Time subscribers
6. **security_incidents** - Restrict to Guard subscribers

### New RLS Pattern Needed:
```sql
-- Example for tasks table
CREATE POLICY "tasks_remote_product_access" ON tasks
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

## 🎯 Features Not Yet Mapped

### Potentially Ambiguous Features:
1. **Outlets Management** - Remote or shared?
2. **Analytics/Reports** - Product-specific or combined?
3. **Automation Rules** - Which product?
4. **Integrations** - Product-specific?
5. **API Access** - Per product or global?

### Missing/Planned Features:
1. **Payroll Integration** - Time product
2. **Client Portal** - Guard product
3. **Equipment Management** - Guard product
4. **Training Records** - All products?
5. **Document Management** - Remote product

---

## ⚠️ Critical Considerations

### Data Dependencies:
1. **Tasks → Projects** - Both in Remote
2. **Attendance → Leave** - Both in Time
3. **Incidents → Patrols** - Both in Guard
4. **Teams → Tasks** - Remote internal dependency
5. **Profiles → Everything** - Core dependency

### Cross-Product Interactions:
1. **Notifications** - Shared but filtered by product
2. **Reports** - May combine data from multiple products
3. **Dashboard** - Shows widgets from all active products
4. **Mobile App** - Single app, multiple product modules
5. **API** - Needs product-aware endpoints

### Migration Challenges:
1. **Feature Flags** - Convert from feature-based to product-based
2. **User Permissions** - Add product layer to existing roles
3. **Existing Data** - Assign to appropriate products
4. **Billing** - Transition from single to multi-product
5. **Mobile App** - Update to support product switching

---

## 📊 Component Count Summary

### Total Components to Modify:
- **Database Tables**: 45+ tables
- **Frontend Pages**: 20+ pages  
- **Frontend Components**: 50+ components
- **Mobile Screens**: 15+ screens
- **API Endpoints**: 100+ endpoints
- **RLS Policies**: 40+ policies

### New Components Needed:
- Product selector (signup)
- Product switcher (navigation)
- Product access guard
- Billing manager (multi-product)
- Usage tracker (per product)
- Product onboarding flows (3)
- Product-specific dashboards (3)
- Migration tools

---

## 🔄 Data Flow Changes Required

### Current Flow:
```
User → Organization → Features → Data
```

### New Flow:
```
User → Organization → Products → Features → Data
```

### Impact Areas:
1. Authentication flow (product selection)
2. Navigation generation (product-based)
3. API middleware (product validation)
4. Mobile app initialization (product detection)
5. Billing calculations (per-product usage)

---

This analysis reveals the full scope of the modularization project. Every component listed needs to be evaluated and potentially modified for the multi-product architecture.