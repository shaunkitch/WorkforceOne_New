// ===================================
// types/database.types.ts
// ===================================
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string
          name: string
          slug?: string
          join_code?: string
          settings?: Json
          feature_flags?: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug?: string
          join_code?: string
          settings?: Json
          feature_flags?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          join_code?: string
          settings?: Json
          feature_flags?: Json
          created_at?: string
          updated_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          organization_id: string | null
          email: string
          full_name: string | null
          avatar_url: string | null
          role: 'admin' | 'manager' | 'employee'
          status: 'active' | 'inactive' | 'suspended'
          department: string | null
          job_title: string | null
          phone: string | null
          hire_date: string | null
          salary: number | null
          hourly_rate: number | null
          employee_id: string | null
          manager_id: string | null
          last_login: string | null
          timezone?: string
          settings?: Json
          feature_flags?: Json
          is_active?: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          organization_id?: string | null
          email: string
          full_name?: string | null
          avatar_url?: string | null
          role?: 'admin' | 'manager' | 'employee'
          status?: 'active' | 'inactive' | 'suspended'
          department?: string | null
          job_title?: string | null
          phone?: string | null
          hire_date?: string | null
          salary?: number | null
          hourly_rate?: number | null
          employee_id?: string | null
          manager_id?: string | null
          last_login?: string | null
          timezone?: string
          settings?: Json
          feature_flags?: Json
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string | null
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          role?: 'admin' | 'manager' | 'employee'
          status?: 'active' | 'inactive' | 'suspended'
          department?: string | null
          job_title?: string | null
          phone?: string | null
          hire_date?: string | null
          salary?: number | null
          hourly_rate?: number | null
          employee_id?: string | null
          manager_id?: string | null
          last_login?: string | null
          timezone?: string
          settings?: Json
          feature_flags?: Json
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      teams: {
        Row: {
          id: string
          organization_id: string
          name: string
          description: string | null
          lead_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          name: string
          description?: string | null
          lead_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          name?: string
          description?: string | null
          lead_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      time_entries: {
        Row: {
          id: string
          user_id: string
          organization_id: string
          start_time: string
          end_time: string | null
          duration: number | null
          description: string | null
          project_id: string | null
          task_id: string | null
          is_billable: boolean
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          organization_id: string
          start_time: string
          end_time?: string | null
          duration?: number | null
          description?: string | null
          project_id?: string | null
          task_id?: string | null
          is_billable?: boolean
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          organization_id?: string
          start_time?: string
          end_time?: string | null
          duration?: number | null
          description?: string | null
          project_id?: string | null
          task_id?: string | null
          is_billable?: boolean
          status?: string
          created_at?: string
          updated_at?: string
        }
      }
      projects: {
        Row: {
          id: string
          organization_id: string
          name: string
          description: string | null
          client_name: string | null
          status: string
          start_date: string | null
          end_date: string | null
          budget: number | null
          hourly_rate: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          name: string
          description?: string | null
          client_name?: string | null
          status?: string
          start_date?: string | null
          end_date?: string | null
          budget?: number | null
          hourly_rate?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          name?: string
          description?: string | null
          client_name?: string | null
          status?: string
          start_date?: string | null
          end_date?: string | null
          budget?: number | null
          hourly_rate?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      tasks: {
        Row: {
          id: string
          project_id: string | null
          assigned_to: string | null
          title: string
          description: string | null
          status: string
          priority: string
          due_date: string | null
          estimated_hours: number | null
          actual_hours: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id?: string | null
          assigned_to?: string | null
          title: string
          description?: string | null
          status?: string
          priority?: string
          due_date?: string | null
          estimated_hours?: number | null
          actual_hours?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string | null
          assigned_to?: string | null
          title?: string
          description?: string | null
          status?: string
          priority?: string
          due_date?: string | null
          estimated_hours?: number | null
          actual_hours?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      attendance: {
        Row: {
          id: string
          user_id: string
          organization_id: string
          date: string
          check_in_time: string | null
          check_out_time: string | null
          status: string
          work_hours: number | null
          overtime_hours: number | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          organization_id: string
          date: string
          check_in_time?: string | null
          check_out_time?: string | null
          status?: string
          work_hours?: number | null
          overtime_hours?: number | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          organization_id?: string
          date?: string
          check_in_time?: string | null
          check_out_time?: string | null
          status?: string
          work_hours?: number | null
          overtime_hours?: number | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      leave_requests: {
        Row: {
          id: string
          user_id: string
          organization_id: string
          leave_type: string
          start_date: string
          end_date: string
          reason: string | null
          status: string
          approved_by: string | null
          approved_at: string | null
          comments: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          organization_id: string
          leave_type: string
          start_date: string
          end_date: string
          reason?: string | null
          status?: string
          approved_by?: string | null
          approved_at?: string | null
          comments?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          organization_id?: string
          leave_type?: string
          start_date?: string
          end_date?: string
          reason?: string | null
          status?: string
          approved_by?: string | null
          approved_at?: string | null
          comments?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}