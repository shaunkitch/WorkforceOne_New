# 🛡️ Guard App Quick Reference

## 🚀 Start the App
```bash
npm run dev
# Opens at http://localhost:3003
```

## ✅ Working Pages (All with Real Data)

### Main Pages
| Page | Path | Description | Status |
|------|------|-------------|--------|
| **Dashboard** | `/` | Main dashboard with real guard count | ✅ Production |
| **Guards List** | `/guards` | List of all guards from database | ✅ Production |
| **Guard Onboarding** | `/guards/onboard` | Onboard new guards | ✅ Working |
| **Incidents** | `/incidents` | Incident management | ✅ Working |
| **Create Incident** | `/incidents/create` | Report new incident | ✅ Working |
| **Security Dashboard** | `/security` | Security operations center | ✅ Production |
| **Live Map** | `/security/map` | Real-time guard locations | ✅ Production |
| **Routes** | `/security/routes` | Patrol route management | ✅ Working |
| **Checkpoints** | `/checkpoints` | QR checkpoint management | ✅ Working |
| **Sites** | `/sites` | Site management | ✅ Working |
| **Monitoring** | `/monitoring` | Live monitoring dashboard | ✅ Working |
| **Operations** | `/operations` | Operations center | ✅ Working |
| **Invitations** | `/invitations` | QR invitation system | ✅ Production |
| **Settings** | `/settings` | App settings | ✅ Working |

## 📁 Key Files

### Pages (Real Data Integration)
- **Main Dashboard**: `app/page.tsx` - Shows real guard count
- **Guards List**: `app/guards/page.tsx` - Displays actual guards from DB
- **Security Map**: `app/security/map/page.tsx` - Live guard tracking

### Components
- **Navigation**: `components/navigation/Navbar.tsx`
- **UI Components**: `components/ui/` (card, button, badge, etc.)
- **Guard Components**: Various guard-specific components

### Configuration
- **Supabase Client**: `lib/supabase/client.ts`
- **Utilities**: `lib/utils.ts`

## 🔗 Quick Links (When Running)

- **Dashboard**: http://localhost:3003
- **Guards List**: http://localhost:3003/guards
- **Security Map**: http://localhost:3003/security/map
- **Invitations**: http://localhost:3003/invitations
- **Incidents**: http://localhost:3003/incidents

## 📊 Database Tables Used

- `user_products` - Stores guard access (product_id = 'guard-management')
- `profiles` - User profile information
- `security_guard_invitations` - QR invitation codes
- `incidents` - Security incidents (if exists)
- `patrol_sessions` - Active patrols (if exists)

## 🎯 Key Features Working

1. **Real Guard Data** - Pulls actual guards from database
2. **QR Invitations** - Generate codes for new guards
3. **Live Monitoring** - Real-time updates
4. **Security Map** - Visual guard tracking
5. **Incident Reporting** - Create and manage incidents

## 💡 Development Notes

- This is the **separated/focused** guard application
- Cleaner interface than the unified app
- All guard-specific features in one place
- Shares database with main app
- Changes here reflect in main app too

## 🟢 Status: PRODUCTION READY

All core functionality working with real database integration!