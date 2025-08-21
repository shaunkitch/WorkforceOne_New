# Repository Cleanup Notes

## Current Active Applications ✅

### **Main Production Apps:**
1. **`workforceone/`** - Primary unified application
   - `frontend/` - Main Next.js web dashboard (✅ **Fixed with real data**)
   - `workforceone-mobile/` - Mobile React Native app (✅ **Fixed QR auto sign-in**)
   - `backend/` - Express API server
   - `global-admin/` - Admin interface

### **Separated Product Apps:**
2. **`workforceone-separated/`** - Modular product applications
   - `guard/` - Security guard management (✅ **Fixed with real data**)
   - `remote/` - Remote workforce management  
   - `time/` - Time tracking application

## Applications That Could Be Archived 📦

### **Duplicate/Legacy Apps:**
- **`workforceone-unified/`** - Duplicate unified app (similar to main `workforceone/`)
- **`mobile-admin/`** - Admin mobile app (superseded by global-admin)
- **`mobile-app/WorkforceOneMobile/`** - Legacy mobile app (superseded by workforceone-mobile)
- **`frontend/`** - Standalone frontend (superseded by workforceone/frontend)

### **Development Files:**
- Multiple `.sql` migration files in root directory
- Various test scripts and debug files
- Old migration attempts

## Recommended Cleanup Actions

### **Phase 1: Archive Legacy Apps**
```bash
# Move duplicate/legacy applications to archive
mv workforceone-unified/ archive-projects/
mv mobile-admin/ archive-projects/
mv mobile-app/ archive-projects/
mv frontend/ archive-projects/  # Standalone version
```

### **Phase 2: Organize SQL Files**
```bash
# Move loose SQL files to database directory
mv *.sql database/legacy-migrations/
```

### **Phase 3: Clean Root Directory**
```bash
# Move development files to appropriate locations
mv test-*.js scripts/legacy-tests/
mv debug-*.js scripts/legacy-tests/
```

## Final Clean Structure

```
WorkforceOne_New/
├── workforceone/                    # 🎯 MAIN APPLICATION
│   ├── frontend/                    # ✅ Web dashboard (real data)
│   ├── workforceone-mobile/         # ✅ Mobile app (QR auto sign-in)
│   ├── backend/                     # API server
│   └── global-admin/                # Admin interface
├── workforceone-separated/          # 🎯 MODULAR APPS
│   ├── guard/                       # ✅ Guard app (real data)
│   ├── remote/                      # Remote workforce
│   └── time/                        # Time tracking
├── database/                        # Database schemas & migrations
├── scripts/                         # Utility scripts
├── docs/                           # Documentation
└── archive-projects/               # 📦 Archived legacy apps
    ├── workforceone-unified/
    ├── mobile-admin/
    ├── mobile-app/
    └── frontend/
```

## Benefits of Cleanup

1. **Clearer Structure** - Easy to identify active vs legacy apps
2. **Reduced Confusion** - No duplicate applications with similar names
3. **Better Navigation** - Focus on the 2 main application structures
4. **Easier Maintenance** - Clear separation of production vs archived code
5. **Onboarding** - New developers can quickly identify what's active

## Post-Cleanup Status

### **Working Applications:**
- ✅ Main `workforceone/` app with real database integration
- ✅ QR code auto sign-in functionality working
- ✅ Guards appearing in dashboard after QR scanning
- ✅ Separated guard app also showing real data

### **Ready for Production:**
- Main application at `workforceone/`
- Mobile app with working QR invitation system
- Guard management with real-time data
- Clean, organized codebase

---

*This cleanup maintains all working functionality while organizing the repository for better long-term maintenance and development.*