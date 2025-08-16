import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

interface FeatureFlags {
  dashboard: boolean
  time_tracking: boolean
  attendance: boolean
  maps: boolean
  teams: boolean
  projects: boolean
  tasks: boolean
  forms: boolean
  leave: boolean
  outlets: boolean
  settings: boolean
  analytics: boolean
  reports: boolean
  automation: boolean
  integrations: boolean
  mobile_daily_visits: boolean
  mobile_offline_mode: boolean
  mobile_push_notifications: boolean
}

export const useFeatureFlags = () => {
  const { profile } = useAuth()
  const [featureFlags, setFeatureFlags] = useState<FeatureFlags | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchFeatureFlags()
  }, [profile?.organization_id])

  const fetchFeatureFlags = async () => {
    if (!profile?.organization_id) {
      setLoading(false)
      return
    }

    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('feature_flags')
        .eq('id', profile.organization_id)
        .single()

      if (error) throw error

      setFeatureFlags(data.feature_flags || {
        dashboard: true,
        time_tracking: true,
        attendance: true,
        maps: true,
        teams: true,
        projects: true,
        tasks: true,
        forms: true,
        leave: true,
        outlets: true,
        settings: true,
        analytics: true,
        reports: true,
        automation: true,
        integrations: true,
        mobile_daily_visits: true,
        mobile_offline_mode: true,
        mobile_push_notifications: true
      })
    } catch (error) {
      console.error('Error fetching feature flags:', error)
      // Default to all features enabled on error
      setFeatureFlags({
        dashboard: true,
        time_tracking: true,
        attendance: true,
        maps: true,
        teams: true,
        projects: true,
        tasks: true,
        forms: true,
        leave: true,
        outlets: true,
        settings: true,
        analytics: true,
        reports: true,
        automation: true,
        integrations: true,
        mobile_daily_visits: true,
        mobile_offline_mode: true,
        mobile_push_notifications: true
      })
    } finally {
      setLoading(false)
    }
  }

  const hasFeature = (feature: keyof FeatureFlags): boolean => {
    const organizationHasFeature = featureFlags?.[feature] ?? true
    
    // Special logic for maps/daily visits - disable for remote and office workers
    if (feature === 'maps') {
      const userWorkType = profile?.work_type || 'field'
      const needsLocationFeatures = userWorkType === 'field' || userWorkType === 'hybrid'
      
      // Check both the old 'maps' feature and new 'mobile_daily_visits' feature
      const mobileVisitsEnabled = featureFlags?.mobile_daily_visits ?? true
      
      // If user doesn't need location features or mobile visits is disabled, hide the feature
      if (!needsLocationFeatures || !mobileVisitsEnabled) {
        return false
      }
    }
    
    return organizationHasFeature
  }

  return {
    featureFlags,
    hasFeature,
    loading
  }
}