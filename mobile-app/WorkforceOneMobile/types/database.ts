export interface Profile {
  id: string
  email: string
  full_name: string
  phone?: string
  organization_id: string
  role: 'admin' | 'manager' | 'lead' | 'member'
  department?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Organization {
  id: string
  name: string
  slug: string
  settings: any
  created_at: string
  updated_at: string
}

export interface Team {
  id: string
  name: string
  description?: string
  team_lead_id?: string
  department: string
  organization_id: string
  created_at: string
  updated_at: string
}

export interface Project {
  id: string
  name: string
  description?: string
  status: 'planning' | 'active' | 'completed' | 'on_hold'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  start_date?: string
  end_date?: string
  budget?: number
  team_id?: string
  organization_id: string
  created_at: string
  updated_at: string
}

export interface Task {
  id: string
  title: string
  description?: string
  status: 'todo' | 'in_progress' | 'review' | 'completed'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  assigned_to?: string
  project_id?: string
  team_id?: string
  organization_id: string
  due_date?: string
  created_at: string
  updated_at: string
}

export interface TimeEntry {
  id: string
  user_id: string
  task_id?: string
  project_id?: string
  description?: string
  start_time: string
  end_time?: string
  duration_minutes?: number
  organization_id: string
  created_at: string
  updated_at: string
}

export interface Attendance {
  id: string
  user_id: string
  check_in_time: string
  check_out_time?: string
  work_hours?: number
  overtime_hours?: number
  location?: string
  notes?: string
  organization_id: string
  created_at: string
  updated_at: string
}