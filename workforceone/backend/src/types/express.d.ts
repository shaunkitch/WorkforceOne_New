import { User } from '@supabase/supabase-js'

declare global {
  namespace Express {
    interface Request {
      user?: User
      userProfile?: {
        id: string
        email: string
        full_name: string
        role: 'admin' | 'manager' | 'member'
        organization_id: string
        department?: string
        phone?: string
        is_active: boolean
        created_at: string
        updated_at: string
      }
    }
  }
}

export {}