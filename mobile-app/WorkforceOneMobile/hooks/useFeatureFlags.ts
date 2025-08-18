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
  security: boolean
  settings: boolean
  analytics: boolean
  reports: boolean
  automation: boolean
  integrations: boolean
  mobile_daily_visits: boolean
  mobile_offline_mode: boolean
  mobile_push_notifications: boolean
  mobile_clock_in: boolean
  mobile_tasks: boolean
  mobile_forms: boolean
  mobile_leave: boolean
  mobile_payslips: boolean
  mobile_security: boolean // Add mobile-specific security flag
}

export const useFeatureFlags = () => {
  const { profile } = useAuth()
  const [featureFlags, setFeatureFlags] = useState<FeatureFlags | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchFeatureFlags()
  }, [profile?.organization_id])

  // Auto-refresh feature flags every 30 seconds to sync with admin changes
  useEffect(() => {
    if (!profile?.organization_id) return
    
    const interval = setInterval(() => {
      fetchFeatureFlags()
    }, 30000) // 30 seconds
    
    return () => clearInterval(interval)
  }, [profile?.organization_id])

  const fetchFeatureFlags = async () => {
    if (!profile?.organization_id) {
      setLoading(false)
      return
    }

    try {
      console.log('🔄 Syncing feature flags from server...')
      const { data, error } = await supabase
        .from('organizations')
        .select('feature_flags')
        .eq('id', profile.organization_id)
        .single()

      if (error) throw error
      
      console.log('✅ Feature flags synced successfully')

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
        security: true,
        settings: true,
        analytics: true,
        reports: true,
        automation: true,
        integrations: true,
        mobile_daily_visits: true,
        mobile_offline_mode: true,
        mobile_push_notifications: true,
        mobile_clock_in: true,
        mobile_tasks: true,
        mobile_forms: true,
        mobile_leave: true,
        mobile_payslips: true,
        mobile_security: true
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
        security: true,
        settings: true,
        analytics: true,
        reports: true,
        automation: true,
        integrations: true,
        mobile_daily_visits: true,
        mobile_offline_mode: true,
        mobile_push_notifications: true,
        mobile_clock_in: true,
        mobile_tasks: true,
        mobile_forms: true,
        mobile_leave: true,
        mobile_payslips: true,
        mobile_security: true
      })
    } finally {
      setLoading(false)
    }
  }

  const hasFeature = (feature: keyof FeatureFlags): boolean => {
    const organizationHasFeature = featureFlags?.[feature] ?? true
    
    // Security feature access logging
    if (feature === 'security' && __DEV__) {
      console.log('🔐 Security Feature Check:', {
        organizationHasFeature,
        userWorkType: profile?.work_type,
        userRole: profile?.role
      });
    }
    
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
    
    // Mobile-specific feature flag overrides
    if (feature === 'attendance') {
      return featureFlags?.mobile_clock_in ?? true
    }
    
    if (feature === 'tasks') {
      return featureFlags?.mobile_tasks ?? true
    }
    
    if (feature === 'forms') {
      return featureFlags?.mobile_forms ?? true
    }
    
    if (feature === 'leave') {
      return featureFlags?.mobile_leave ?? true
    }
    
    // Security features - only show to security guards and admin/manager roles
    if (feature === 'security') {
      const userWorkType = profile?.work_type || 'field'
      const userRole = profile?.role || 'employee'
      
      // Check both general security flag and mobile-specific security flag
      const mobileSecurityEnabled = featureFlags?.mobile_security ?? true
      
      // Show security features to security guards (using specific security work type) or admin/manager roles
      const hasSecurityAccess = (userWorkType as string) === 'security' || 
                               userRole === 'admin' || 
                               userRole === 'manager'
      
      const result = organizationHasFeature && mobileSecurityEnabled && hasSecurityAccess;
      
      if (__DEV__) {
        console.log('🔐 Security Access:', result ? 'GRANTED' : 'DENIED');
      }
      
      return result;
    }
    
    return organizationHasFeature
  }

  const refreshFeatureFlags = async () => {
    if (!profile?.organization_id) return
    
    setLoading(true)
    await fetchFeatureFlags()
  }

  return {
    featureFlags,
    hasFeature,
    loading,
    refreshFeatureFlags
  }
}