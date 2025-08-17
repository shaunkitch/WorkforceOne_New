# System Monitoring & Critical Alerts Setup Guide

## 🔧 **Architecture Overview**

The WorkforceOne monitoring system provides comprehensive real-time monitoring of:

### **Database Infrastructure (Supabase)**
- ✅ **CPU Usage** - Database server CPU utilization
- ✅ **Memory Usage** - RAM consumption and availability  
- ✅ **Storage Usage** - Database size and disk space
- ✅ **Connection Count** - Active database connections
- ✅ **Response Time** - Query execution performance

### **Application Infrastructure (Vercel)**
- ✅ **CPU Usage** - Application server CPU utilization
- ✅ **Memory Usage** - Node.js heap memory consumption
- ✅ **Request Rate** - API request volume and patterns
- ✅ **Response Time** - API endpoint latency
- ✅ **Error Rate** - Application errors and failures

### **System Health Monitoring**
- ✅ **Overall Health Score** - Composite system health (0-100%)
- ✅ **Component Health** - Individual service health scores
- ✅ **Alert Management** - Automated alert generation and resolution
- ✅ **Historical Tracking** - Performance trends and patterns

---

## 📋 **Required Database Migrations**

Run this migration to set up the monitoring infrastructure:

```sql
-- Run this in your Supabase SQL Editor:
/workforceone/database/migrations/054_system_monitoring.sql
```

**What this creates:**
- `system_metrics` - Real-time metrics storage
- `system_alerts` - Alert management and tracking
- `alert_rules` - Configurable thresholds and rules
- `system_health_snapshots` - Historical health data
- Automated functions for metrics collection and alerting

---

## 🔧 **Backend Configuration**

### **1. Environment Variables**

Add these to your backend `.env` file:

```bash
# Optional: Vercel API integration for infrastructure metrics
VERCEL_API_KEY=your_vercel_api_key_here
VERCEL_TEAM_ID=your_vercel_team_id_here

# Supabase (already configured)
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### **2. Start Monitoring Service**

Add to your backend startup code (`server.ts` or `app.ts`):

```typescript
import { monitoringService } from './services/monitoring'

// Start monitoring when server starts
monitoringService.startMonitoring(5) // Collect metrics every 5 minutes

// Add monitoring routes
app.use('/api/monitoring', monitoringRoutes)
```

### **3. Database Size Function**

Run this additional SQL in Supabase to enable database size monitoring:

```sql
CREATE OR REPLACE FUNCTION get_database_size()
RETURNS bigint AS $$
BEGIN
  RETURN pg_database_size(current_database());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 🎯 **Alert Configuration**

### **Default Alert Rules** (Pre-configured)

| Metric | Warning Threshold | Critical Threshold |
|--------|------------------|-------------------|
| Database CPU | 70% | 90% |
| Database Memory | 80% | 95% |
| Database Storage | 85% | 95% |
| Database Connections | 80% | 95% |
| Database Response Time | 500ms | 1000ms |
| Vercel CPU | 75% | 90% |
| Vercel Memory | 80% | 95% |
| Vercel Error Rate | 5% | 10% |
| API Response Time | 1000ms | 2000ms |
| Application Errors | 10 errors | 25 errors |

### **Custom Alert Rules**

Add custom thresholds via SQL:

```sql
INSERT INTO alert_rules (name, metric_type, warning_threshold, critical_threshold, comparison_operator) 
VALUES ('Custom Database Latency', 'database_response_time', 300, 800, '>');
```

---

## 📱 **Mobile Admin Integration**

### **New Monitoring Tab**

The mobile admin app now includes a dedicated **Monitoring** tab with:

- ✅ **Real-time Health Scores** - Overall, Database, Application, Infrastructure
- ✅ **Active Alerts Dashboard** - Critical and warning alerts
- ✅ **Alert Management** - Acknowledge and resolve alerts on-the-go
- ✅ **Recent Metrics View** - Latest system performance data
- ✅ **Auto-refresh** - Updates every 30 seconds

### **Alert Actions**

- **Acknowledge** - Mark alert as seen (turns to acknowledged status)
- **Resolve** - Mark alert as fixed (removes from active alerts)
- **Real-time Updates** - New alerts appear immediately

---

## 🌐 **Global Admin Portal**

### **Monitoring Dashboard**

Access via: `http://localhost:3001/dashboard/monitoring`

**Features:**
- ✅ **Comprehensive Health Overview** - All system components
- ✅ **Alert Management Interface** - Full alert lifecycle management
- ✅ **Metrics History** - Detailed historical performance data
- ✅ **System Status Summary** - Overall platform health
- ✅ **Manual Metric Collection** - Force immediate data collection

---

## 🚀 **API Endpoints**

### **Monitoring API** (`/api/monitoring/`)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/status` | GET | Current system status |
| `/health` | GET | Health score calculation |
| `/alerts` | GET | Active alerts list |
| `/alerts/:id/acknowledge` | POST | Acknowledge alert |
| `/alerts/:id/resolve` | POST | Resolve alert |
| `/metrics` | GET | Metrics history |
| `/metrics` | POST | Record custom metric |
| `/collect` | POST | Force metrics collection |
| `/start` | POST | Start monitoring |
| `/stop` | POST | Stop monitoring |

### **Example Usage**

```javascript
// Get current system status
const response = await fetch('/api/monitoring/status')
const { data } = await response.json()

// Acknowledge an alert
await fetch(`/api/monitoring/alerts/${alertId}/acknowledge`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ acknowledgedBy: 'Admin Name' })
})
```

---

## 🔄 **Automated Monitoring**

### **Collection Schedule**

- **Default Interval**: 5 minutes
- **Configurable**: Adjust via API or environment variable
- **Real-time Updates**: 30-second refresh in admin interfaces

### **Health Score Calculation**

```
Overall Health = (Database Health × 40%) + (Application Health × 30%) + (Infrastructure Health × 30%)

Health Reductions:
- Critical Alert: -25 points (Database), -20 points (App), -30 points (Infrastructure)
- Warning Alert: -10 points (Database), -8 points (App), -12 points (Infrastructure)
```

### **Automatic Alerting**

- ✅ **Threshold Monitoring** - Automatic alert generation when thresholds exceeded
- ✅ **Alert Deduplication** - Prevents spam from repeated threshold violations
- ✅ **Severity Classification** - Automatic severity assignment based on rules
- ✅ **Historical Tracking** - Full audit trail of all alerts and actions

---

## 🎨 **Customization**

### **Adding New Metrics**

1. **Define Metric Type** - Add to `metric_type` enum in database
2. **Create Alert Rule** - Add threshold configuration
3. **Implement Collection** - Add to monitoring service
4. **Update UI** - Display in admin interfaces

### **Custom Alert Rules**

```sql
-- Example: Monitor specific API endpoint response time
INSERT INTO alert_rules (
  name, 
  metric_type, 
  warning_threshold, 
  critical_threshold, 
  comparison_operator,
  evaluation_window_minutes
) VALUES (
  'API Login Endpoint Response Time',
  'api_latency',
  200,
  500,
  '>',
  3
);
```

---

## 🔍 **Troubleshooting**

### **Common Issues**

1. **No Metrics Appearing**
   - Check monitoring service is started: `POST /api/monitoring/start`
   - Verify database migration ran successfully
   - Check backend logs for errors

2. **Vercel Metrics Missing**
   - Add `VERCEL_API_KEY` environment variable
   - Ensure API key has project access permissions

3. **Alerts Not Triggering**
   - Verify alert rules are enabled in `alert_rules` table
   - Check threshold values are appropriate
   - Ensure metric collection is working

### **Debug Commands**

```bash
# Force metric collection
curl -X POST http://localhost:5000/api/monitoring/collect

# Check system status
curl http://localhost:5000/api/monitoring/status

# View recent metrics
curl "http://localhost:5000/api/monitoring/metrics?hours=1"
```

---

## 📊 **Benefits**

### **Proactive Monitoring**
- ✅ **Early Warning System** - Detect issues before they impact users
- ✅ **Performance Optimization** - Identify bottlenecks and optimization opportunities
- ✅ **Resource Planning** - Track growth patterns and capacity needs

### **Operational Excellence**
- ✅ **24/7 Visibility** - Continuous monitoring of all system components
- ✅ **Mobile Accessibility** - Monitor and respond to issues from anywhere
- ✅ **Historical Analysis** - Understand system behavior and trends
- ✅ **Automated Alerting** - Immediate notification of critical issues

### **Business Impact**
- ✅ **Improved Uptime** - Faster issue detection and resolution
- ✅ **Better User Experience** - Proactive performance management
- ✅ **Cost Optimization** - Efficient resource utilization
- ✅ **Compliance Support** - Detailed audit trails and reporting

---

The monitoring system is now fully integrated and ready to provide comprehensive oversight of your WorkforceOne platform infrastructure!