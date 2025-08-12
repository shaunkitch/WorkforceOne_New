'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'

interface Profile {
  id: string
  email: string
  full_name?: string
  avatar_url?: string
  job_title?: string
  bio?: string
  location?: string
  phone?: string
  timezone?: string
  start_date?: string
  settings?: any
}

interface ProfileContextType {
  profile: Profile | null
  loading: boolean
  error: string | null
  refreshProfile: () => Promise<void>
}

const ProfileContext = createContext<ProfileContextType>({
  profile: null,
  loading: true,
  error: null,
  refreshProfile: async () => {}
})

export const useProfile = () => useContext(ProfileContext)

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const createProfileIfNotExists = async (user: User): Promise<Profile> => {
    const newProfile = {
      id: user.id,
      email: user.email || '',
      full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
      avatar_url: user.user_metadata?.avatar_url || null,
      is_active: true
    }

    const { data, error } = await supabase
      .from('profiles')
      .insert(newProfile)
      .select()
      .single()

    if (error) throw error
    return data
  }

  const refreshProfile = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data: user } = await supabase.auth.getUser()
      if (!user.user) {
        setProfile(null)
        return
      }

      // Try to fetch existing profile
      let { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.user.id)
        .single()

      // If profile doesn't exist, create it
      if (error && error.code === 'PGRST116') {
        data = await createProfileIfNotExists(user.user)
      } else if (error) {
        throw error
      }

      setProfile(data)
    } catch (err) {
      console.error('Error fetching profile:', err)
      setError(err instanceof Error ? err.message : 'Failed to load profile')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refreshProfile()
  }, [])

  return (
    <ProfileContext.Provider value={{ profile, loading, error, refreshProfile }}>
      {children}
    </ProfileContext.Provider>
  )
}