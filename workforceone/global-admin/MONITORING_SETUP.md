# WorkforceOne Real Health Monitoring Setup

This guide helps you set up real health data monitoring from Vercel and Supabase for your WorkforceOne Global Admin dashboard.

## 🚀 Quick Setup

### 1. Vercel API Configuration

**Your Project ID:** `prj_6TF2w1N6A8uGPQP3Cz3lknRBWOgg`

#### Get Vercel API Token:
1. Go to [Vercel Account Settings](https://vercel.com/account/tokens)
2. Click "Create Token"
3. Name it "WorkforceOne Monitoring"
4. Set expiration as needed
5. Copy the token (starts with `v1_`)

#### Get Team ID (if using team account):
1. Go to your [Vercel Dashboard](https://vercel.com/dashboard)
2. Check the URL: `vercel.com/[team-id]/dashboard`
3. Copy the team ID from the URL

### 2. Supabase Configuration

#### Get Supabase Project Reference:
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to Settings → API
4. Copy the "Project URL" (extract the project ref from `https://[project-ref].supabase.co`)
5. Copy the "Service Role Key" (secret key starting with `eyJ`)

#### Get Management API Token (Optional - for advanced metrics):
1. Go to [Supabase Account Settings](https://supabase.com/dashboard/account/tokens)
2. Click "Generate new token"
3. Name it "WorkforceOne Monitoring"
4. Copy the token

### 3. Environment Configuration

Create a `.env.local` file in your global-admin directory:

```bash
# Copy from .env.example and fill in your values:

# Vercel Configuration
VERCEL_API_TOKEN=v1_your_vercel_token_here
VERCEL_TEAM_ID=your_team_id_here
VERCEL_PROJECT_ID=prj_6TF2w1N6A8uGPQP3Cz3lknRBWOgg

# Supabase Configuration  
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ_your_service_role_key_here
SUPABASE_MANAGEMENT_TOKEN=your_management_token_here

# Optional: OpenAI for AI monitoring features
OPENAI_API_KEY=sk-your_openai_key_here
```

## 📊 Available Monitoring Endpoints

Once configured, these API endpoints will provide real data:

### Health Check
```bash
GET /api/monitoring/health
GET /api/monitoring/health?details=true
```

### Real-time Metrics
```bash
GET /api/monitoring/metrics
GET /api/monitoring/metrics?hours=24&source=vercel
GET /api/monitoring/metrics?source=supabase
```

### System Status
```bash
GET /api/monitoring/status
GET /api/monitoring/status?metrics=true
```

### Collect Metrics
```bash
POST /api/monitoring/collect
# Body: { "sources": ["vercel", "supabase", "system"] }
```

### Alerts
```bash
GET /api/monitoring/alerts
GET /api/monitoring/alerts?status=active&severity=critical
```

## 🔧 What Gets Monitored

### Vercel Metrics:
- ✅ API latency and availability
- ✅ Deployment status and history
- ✅ Request count and error rates
- ✅ Bandwidth usage
- ✅ Edge function performance
- ✅ Domain configuration status

### Supabase Metrics:
- ✅ Database connection health
- ✅ Auth service availability
- ✅ Storage service performance
- ✅ Realtime connection status
- ✅ Database query performance
- ✅ Connection pool usage
- ✅ Table sizes and row counts
- ✅ API usage statistics

### System Metrics:
- ✅ Memory usage
- ✅ CPU utilization
- ✅ Application uptime
- ✅ Node.js performance
- ✅ Process information

## 🚨 Alert Configuration

The system automatically generates alerts for:

- **Critical**: Service outages, API failures
- **Warning**: High latency, elevated error rates
- **Info**: Quota warnings, maintenance notices

## 🤖 AI-Powered Features

With OpenAI API key configured:
- Intelligent anomaly detection
- Automated issue diagnosis
- Performance optimization suggestions
- Predictive maintenance alerts

## 🛠 Troubleshooting

### Common Issues:

1. **"Vercel API error: 401"**
   - Check your API token is valid
   - Ensure token has correct permissions

2. **"Supabase API error: 403"**
   - Verify service role key is correct
   - Check RLS policies don't block service role

3. **"Project not found"**
   - Confirm project ID is correct
   - Check team ID if using team account

### Testing Your Setup:

```bash
# Test Vercel connection
curl -H "Authorization: Bearer YOUR_TOKEN" https://api.vercel.com/v2/user

# Test Supabase connection  
curl -H "apikey: YOUR_SERVICE_KEY" https://your-ref.supabase.co/rest/v1/

# Test monitoring endpoints
curl http://localhost:3000/api/monitoring/health
```

## 📈 Dashboard Features

Once configured, your Global Admin dashboard will show:

1. **Real-time Health Scores**
   - Overall system health percentage
   - Individual service status indicators
   - Performance trend indicators

2. **Live Metrics Charts**
   - Request volume over time
   - Error rate tracking
   - Response time trends
   - Resource utilization

3. **Alert Management**
   - Active incident tracking
   - Historical alert trends
   - Automated resolution status

4. **Performance Insights**
   - Bottleneck identification
   - Optimization recommendations
   - Capacity planning data

## 🔐 Security Notes

- Store all API keys in environment variables
- Use least-privilege tokens when possible
- Regularly rotate API keys
- Monitor for unauthorized access
- Enable audit logging where available

## 🎯 Next Steps

1. **Set up environment variables** with your actual keys
2. **Test the monitoring endpoints** to ensure connectivity
3. **Configure alerting webhooks** for notifications
4. **Customize thresholds** based on your requirements
5. **Set up automated responses** using the AI agent

Your monitoring system will now provide real-time insights into your WorkforceOne platform's health and performance! 🎉