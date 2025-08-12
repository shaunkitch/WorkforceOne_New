# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Root Level Commands (from WorkforceOne_New/)
- `./setup.sh` - Complete development environment setup script
- `cd workforceone && npm run dev` - Start both frontend and backend concurrently
- `cd workforceone && npm run dev:frontend` - Start only frontend (Next.js)
- `cd workforceone && npm run dev:backend` - Start only backend (Express)
- `cd workforceone && npm run build` - Build both applications for production
- `cd workforceone && npm run install:all` - Install dependencies for all projects

### Frontend Commands (from workforceone/frontend/)
- `npm run dev` - Start Next.js development server with Turbopack
- `npm run build` - Build Next.js application
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Backend Commands (from backend/)
- `npm run dev` - Start backend development server with nodemon and tsx
- `npm run build` - Build TypeScript to JavaScript
- `npm run start` - Start production server

## Project Architecture

This is a full-stack remote workforce management platform with a complex multi-directory structure.

### Repository Structure
```
WorkforceOne_New/
├── frontend/              # Legacy/standalone frontend (Next.js 15)
├── backend/              # Legacy/standalone backend (Express + TypeScript)
├── workforceone/         # Main application directory (created by setup.sh)
│   ├── frontend/         # Main Next.js application
│   ├── backend/          # Main Express API server
│   ├── database/         # Migration files and schemas
│   ├── scripts/          # Utility scripts
│   └── docs/            # Documentation
└── setup.sh             # Development environment setup script
```

### Tech Stack
- **Frontend**: Next.js 15.4.6 (App Router), TypeScript, Tailwind CSS v4
- **Backend**: Node.js, Express 5.1.0, TypeScript
- **Database**: Supabase (PostgreSQL) with real-time capabilities
- **Authentication**: Supabase Auth with UI components
- **State Management**: TanStack React Query v5
- **Form Handling**: React Hook Form + Zod validation
- **UI Components**: Custom components with Lucide React icons
- **Development**: tsx for TypeScript execution, nodemon for hot reload

### Database Schema (Supabase)
Key tables from migration files:
- `organizations` - Multi-tenant organization management
- `profiles` - Extended user profiles (references auth.users)
- `teams` - Team management with team leads
- `team_members` - Many-to-many team membership
- `projects` - Project management with status tracking
- `tasks` - Task management with assignments and time tracking
- `time_entries` - Time tracking entries
- `attendance` - Employee attendance records
- `leave_requests` - Leave management system

### Authentication Flow
- Supabase Auth integration with Row Level Security (RLS)
- Role-based access control (admin, manager, employee)
- Organization-scoped data access
- Real-time subscriptions for live updates

### Development Environment
- **Ports**: Frontend (3000), Backend (5000)
- **Environment Files**: 
  - `workforceone/frontend/.env.local` - Frontend environment
  - `workforceone/backend/.env` - Backend environment
  - `workforceone/.env` - Database configuration
- **Hot Reload**: Enabled for both frontend and backend
- **Concurrent Development**: Use `npm run dev` from workforceone/ directory

### Key Configuration Files
- `workforceone/frontend/next.config.ts` - Next.js configuration
- `workforceone/frontend/tailwind.config.js` - Tailwind CSS configuration
- `workforceone/backend/tsconfig.json` - TypeScript configuration with ES modules
- `workforceone/package.json` - Root scripts using concurrently

### Supabase Integration
- Client-side: `@supabase/supabase-js` with auth helpers
- Server-side: Service role key for admin operations
- Real-time: Subscriptions for live data updates
- Authentication: Built-in auth UI components

### Development Notes
- The project uses two directory structures: legacy (frontend/, backend/) and main (workforceone/)
- Run setup.sh first to create the main workforceone directory structure
- Backend uses tsx instead of ts-node for better ES module support
- Frontend uses Next.js 15 App Router with TypeScript strict mode
- Database migrations should be run in Supabase dashboard
- RLS policies must be configured in Supabase for proper security