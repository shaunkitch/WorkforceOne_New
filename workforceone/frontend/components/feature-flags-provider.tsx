'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { createClient } from '@/lib/supabase/client'

interface FeatureFlagsContextType {
  featureFlags: any
  isLoading: boolean
  refreshFeatureFlags: () => void
}

const FeatureFlagsContext = createContext<FeatureFlagsContextType | undefined>(undefined)

export function FeatureFlagsProvider({ children }: { children: ReactNode }) {
  const [featureFlags, setFeatureFlags] = useState({})
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  const fetchFeatureFlags = async () => {
    try {
      setIsLoading(true)
      const { data: user } = await supabase.auth.getUser()
      if (!user.user) {
        setIsLoading(false)
        return
      }

      // Use the database function to get effective features (org + user overrides)
      const { data, error } = await supabase
        .rpc('get_user_effective_features', { user_id: user.user.id })

      if (error) throw error

      setFeatureFlags(data || {})
    } catch (error) {
      console.error('Error fetching feature flags:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const refreshFeatureFlags = () => {
    fetchFeatureFlags()
  }

  useEffect(() => {
    fetchFeatureFlags()
  }, [supabase])

  return (
    <FeatureFlagsContext.Provider value={{ featureFlags, isLoading, refreshFeatureFlags }}>
      {children}
    </FeatureFlagsContext.Provider>
  )
}

export function useFeatureFlags() {
  const context = useContext(FeatureFlagsContext)
  if (context === undefined) {
    throw new Error('useFeatureFlags must be used within a FeatureFlagsProvider')
  }
  return context
}
