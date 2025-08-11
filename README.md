# WorkforceOne - Remote Workforce Management System

## Overview
WorkforceOne is a comprehensive remote workforce management platform built with modern technologies to help organizations manage their distributed teams effectively.

## Tech Stack
- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Backend**: Node.js, Express, TypeScript
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Real-time**: Supabase Realtime

## Features
- Employee Management
- Time Tracking
- Attendance Management
- Project & Task Management
- Leave Management
- Team Collaboration
- Real-time Updates
- Role-based Access Control

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Supabase account

### Installation
1. Run the setup script:
   ```bash
   ./setup.sh
   ```

2. Update the database password in `.env` file

3. Start the development servers:
   ```bash
   # Frontend
   cd frontend
   npm run dev

   # Backend (in another terminal)
   cd backend
   npm run dev
   ```

### Default Ports
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## Project Structure
```
workforceone/
├── frontend/          # Next.js frontend application
├── backend/           # Express.js API server
├── database/          # Database migrations and scripts
├── scripts/           # Utility scripts
├── docs/             # Documentation
└── README.md
```

## Environment Variables
See `.env.example` files in each directory for required environment variables.

## Development
- Frontend runs on port 3000
- Backend API runs on port 5000
- Hot reload enabled for both frontend and backend

## License
Proprietary - WorkforceOne © 2025
