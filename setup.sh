#!/bin/bash

# WorkforceOne Development Environment Setup Script
# This script sets up the complete development environment for the WorkforceOne platform

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[✓]${NC} $1"
}

print_error() {
    echo -e "${RED}[✗]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[!]${NC} $1"
}

# Check if Node.js is installed
check_node() {
    if command -v node &> /dev/null; then
        print_status "Node.js is installed: $(node --version)"
    else
        print_error "Node.js is not installed. Please install Node.js v18+ first."
        exit 1
    fi
}

# Check if npm is installed
check_npm() {
    if command -v npm &> /dev/null; then
        print_status "npm is installed: $(npm --version)"
    else
        print_error "npm is not installed."
        exit 1
    fi
}

# Create project structure
create_project_structure() {
    print_status "Creating WorkforceOne project structure..."
    
    # Create main project directory
    mkdir -p workforceone
    cd workforceone
    
    # Create subdirectories
    mkdir -p {frontend,backend,database,scripts,docs}
    
    print_status "Project structure created"
}

# Initialize frontend (Next.js with TypeScript)
setup_frontend() {
    print_status "Setting up frontend with Next.js and TypeScript..."
    
    cd frontend
    
    # Initialize Next.js project
    npx create-next-app@latest . --typescript --tailwind --app --no-git --eslint
    
    # Install additional dependencies
    npm install @supabase/supabase-js @supabase/auth-helpers-nextjs @supabase/auth-ui-react @supabase/auth-ui-shared
    npm install @tanstack/react-query axios date-fns
    npm install react-hook-form zod @hookform/resolvers
    npm install lucide-react recharts
    npm install --save-dev @types/node
    
    print_status "Frontend setup complete"
    cd ..
}

# Initialize backend (Node.js with Express)
setup_backend() {
    print_status "Setting up backend API server..."
    
    cd backend
    
    # Initialize package.json
    npm init -y
    
    # Install dependencies
    npm install express cors dotenv helmet morgan compression
    npm install @supabase/supabase-js jsonwebtoken bcryptjs
    npm install express-rate-limit express-validator
    npm install --save-dev typescript @types/node @types/express @types/cors
    npm install --save-dev nodemon ts-node @types/jsonwebtoken @types/bcryptjs
    npm install --save-dev @types/morgan @types/compression
    
    # Create TypeScript config
    npx tsc --init
    
    print_status "Backend setup complete"
    cd ..
}

# Create environment files
create_env_files() {
    print_status "Creating environment configuration files..."
    
    # Frontend .env.local
    cat > frontend/.env.local << 'EOF'
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://qmpnekttrtlvffdxdgxv.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFtcG5la3R0cnRsdmZmZHhkZ3h2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE1MTk4MjcsImV4cCI6MjA2NzA5NTgyN30.YEZPbPvhSVGRzbQVeYhX0hpWVAgtt9GoyJQzKiFFmfU

# Application Settings
NEXT_PUBLIC_APP_NAME=WorkforceOne
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:5000

# Feature Flags
NEXT_PUBLIC_ENABLE_ANALYTICS=false
NEXT_PUBLIC_ENABLE_REAL_TIME=true
EOF
    
    # Backend .env
    cat > backend/.env << 'EOF'
# Supabase Configuration
SUPABASE_URL=https://qmpnekttrtlvffdxdgxv.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFtcG5la3R0cnRsdmZmZHhkZ3h2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE1MTk4MjcsImV4cCI6MjA2NzA5NTgyN30.YEZPbPvhSVGRzbQVeYhX0hpWVAgtt9GoyJQzKiFFmfU
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFtcG5la3R0cnRsdmZmZHhkZ3h2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTUxOTgyNywiZXhwIjoyMDY3MDk1ODI3fQ.x-rVZUco-Vtd7S8xZxEyJ2cwyoVtLLeA3vdlA4uNv3c

# Server Configuration
PORT=5000
NODE_ENV=development

# JWT Configuration
JWT_SECRET=your-jwt-secret-here-change-in-production
JWT_EXPIRES_IN=7d

# CORS Configuration
CORS_ORIGIN=http://localhost:3000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
EOF
    
    # Root .env for database scripts
    cat > .env << 'EOF'
# Supabase Database Configuration
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.qmpnekttrtlvffdxdgxv.supabase.co:5432/postgres
SUPABASE_PROJECT_ID=qmpnekttrtlvffdxdgxv
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFtcG5la3R0cnRsdmZmZHhkZ3h2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTUxOTgyNywiZXhwIjoyMDY3MDk1ODI3fQ.x-rVZUco-Vtd7S8xZxEyJ2cwyoVtLLeA3vdlA4uNv3c
EOF
    
    print_status "Environment files created"
    print_warning "Remember to update the DATABASE_URL with your actual database password"
}

# Create initial database migration files
create_database_schemas() {
    print_status "Creating database migration files..."
    
    mkdir -p database/migrations
    
    # Create initial schema file
    cat > database/migrations/001_initial_schema.sql << 'EOF'
-- WorkforceOne Database Schema
-- Initial migration for remote workforce management system

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Organizations table
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    logo_url TEXT,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255),
    avatar_url TEXT,
    role VARCHAR(50) DEFAULT 'employee',
    department VARCHAR(255),
    position VARCHAR(255),
    phone VARCHAR(50),
    timezone VARCHAR(50) DEFAULT 'UTC',
    settings JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Teams table
CREATE TABLE IF NOT EXISTS teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    lead_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Team members junction table
CREATE TABLE IF NOT EXISTS team_members (
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'member',
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (team_id, user_id)
);

-- Time entries table
CREATE TABLE IF NOT EXISTS time_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE,
    duration INTEGER, -- in minutes
    description TEXT,
    project_id UUID,
    task_id UUID,
    is_billable BOOLEAN DEFAULT false,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    client_name VARCHAR(255),
    status VARCHAR(50) DEFAULT 'active',
    start_date DATE,
    end_date DATE,
    budget DECIMAL(12, 2),
    hourly_rate DECIMAL(8, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tasks table
CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) DEFAULT 'pending',
    priority VARCHAR(20) DEFAULT 'medium',
    due_date DATE,
    estimated_hours DECIMAL(5, 2),
    actual_hours DECIMAL(5, 2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Attendance table
CREATE TABLE IF NOT EXISTS attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    check_in_time TIMESTAMP WITH TIME ZONE,
    check_out_time TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) DEFAULT 'present',
    work_hours DECIMAL(4, 2),
    overtime_hours DECIMAL(4, 2),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, date)
);

-- Leave requests table
CREATE TABLE IF NOT EXISTS leave_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    leave_type VARCHAR(50) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason TEXT,
    status VARCHAR(50) DEFAULT 'pending',
    approved_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    approved_at TIMESTAMP WITH TIME ZONE,
    comments TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_time_entries_user_id ON time_entries(user_id);
CREATE INDEX idx_time_entries_organization_id ON time_entries(organization_id);
CREATE INDEX idx_time_entries_start_time ON time_entries(start_time);
CREATE INDEX idx_attendance_user_date ON attendance(user_id, date);
CREATE INDEX idx_projects_organization_id ON projects(organization_id);
CREATE INDEX idx_tasks_project_id ON tasks(project_id);
CREATE INDEX idx_tasks_assigned_to ON tasks(assigned_to);

-- Row Level Security (RLS) Policies
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON teams
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_time_entries_updated_at BEFORE UPDATE ON time_entries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_attendance_updated_at BEFORE UPDATE ON attendance
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_leave_requests_updated_at BEFORE UPDATE ON leave_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
EOF
    
    print_status "Database migration files created"
}

# Create README file
create_readme() {
    print_status "Creating README documentation..."
    
    cat > README.md << 'EOF'
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
EOF
    
    print_status "README created"
}

# Create package.json scripts
create_package_scripts() {
    print_status "Creating root package.json with scripts..."
    
    cat > package.json << 'EOF'
{
  "name": "workforceone",
  "version": "1.0.0",
  "description": "Remote Workforce Management System",
  "private": true,
  "scripts": {
    "dev": "concurrently \"npm run dev:frontend\" \"npm run dev:backend\"",
    "dev:frontend": "cd frontend && npm run dev",
    "dev:backend": "cd backend && npm run dev",
    "build": "npm run build:frontend && npm run build:backend",
    "build:frontend": "cd frontend && npm run build",
    "build:backend": "cd backend && npm run build",
    "install:all": "npm install && cd frontend && npm install && cd ../backend && npm install",
    "db:migrate": "node scripts/migrate.js",
    "db:seed": "node scripts/seed.js"
  },
  "devDependencies": {
    "concurrently": "^8.2.2"
  }
}
EOF
    
    npm install
    
    print_status "Package scripts created"
}

# Main setup function
main() {
    echo "========================================="
    echo "WorkforceOne Development Environment Setup"
    echo "========================================="
    echo ""
    
    # Check prerequisites
    check_node
    check_npm
    
    # Create project structure
    create_project_structure
    
    # Setup frontend and backend
    setup_frontend
    setup_backend
    
    # Create configuration files
    create_env_files
    create_database_schemas
    create_readme
    create_package_scripts
    
    echo ""
    echo "========================================="
    print_status "Setup Complete!"
    echo "========================================="
    echo ""
    echo "Next steps:"
    echo "1. Update the DATABASE_URL in .env with your Supabase database password"
    echo "2. Run database migrations in Supabase dashboard"
    echo "3. Start development servers:"
    echo "   cd workforceone"
    echo "   npm run dev"
    echo ""
    echo "Frontend: http://localhost:3000"
    echo "Backend:  http://localhost:5000"
    echo ""
    print_warning "Don't forget to configure RLS policies in Supabase!"
}

# Run main function
main