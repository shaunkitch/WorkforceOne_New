import { createClient } from '@/lib/supabase/client'

// Feature keys matching the database
export const FEATURES = {
  // Core (Free)
  TEAM_MANAGEMENT: 'team_management',
  BASIC_ATTENDANCE: 'basic_attendance',
  OVERVIEW_DASHBOARD: 'overview_dashboard',
  BASIC_TASKS: 'basic_tasks',
  MOBILE_APP: 'mobile_app',
  
  // Productivity
  ADVANCED_TASKS: 'advanced_tasks',
  TIME_TRACKING: 'time_tracking',
  ADVANCED_FORMS: 'advanced_forms',
  LEAVE_MANAGEMENT: 'leave_management',
  WORKFLOW_AUTOMATION: 'workflow_automation',
  SITE_OUTLET_VISITS: 'site_outlet_visits',
  
  // Analytics
  ADVANCED_ANALYTICS: 'advanced_analytics',
  CUSTOM_REPORTS: 'custom_reports',
  PERFORMANCE_TRACKING: 'performance_tracking',
  
  // Location
  GPS_TRACKING: 'gps_tracking',
  ROUTE_OPTIMIZATION: 'route_optimization',
  
  // Integration
  AI_FORM_SCANNER: 'ai_form_scanner',
  API_ACCESS: 'api_access',
  SSO_INTEGRATION: 'sso_integration',
  CUSTOM_INTEGRATIONS: 'custom_integrations',
  
  // Support
  PRIORITY_SUPPORT: 'priority_support',
  DEDICATED_MANAGER: 'dedicated_manager'
} as const

export type FeatureKey = typeof FEATURES[keyof typeof FEATURES]

interface FeatureInfo {
  id: string
  feature_key: string
  name: string
  description: string
  category: string
  is_free: boolean
  base_price: number
  billing_unit: 'user' | 'organization'
}

interface SubscriptionInfo {
  id: string
  organization_id: string
  status: 'trial' | 'active' | 'past_due' | 'canceled' | 'paused' | 'expired'
  billing_period: 'monthly' | 'yearly'
  user_count: number
  monthly_total: number
  trial_ends_at: string
  current_period_end: string
  features: string[] // Array of feature keys
}

class FeatureAccessManager {
  private static instance: FeatureAccessManager
  private supabase = createClient()
  private subscriptionCache: SubscriptionInfo | null = null
  private featuresCache: Map<string, FeatureInfo> = new Map()
  private cacheExpiry: Date | null = null
  private readonly CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

  private constructor() {}

  static getInstance(): FeatureAccessManager {
    if (!FeatureAccessManager.instance) {
      FeatureAccessManager.instance = new FeatureAccessManager()
    }
    return FeatureAccessManager.instance
  }

  // Check if cache is still valid
  private isCacheValid(): boolean {
    return this.cacheExpiry ? new Date() < this.cacheExpiry : false
  }

  // Clear cache
  clearCache() {
    this.subscriptionCache = null
    this.featuresCache.clear()
    this.cacheExpiry = null
  }

  // Get all available features
  async getAllFeatures(): Promise<FeatureInfo[]> {
    if (this.featuresCache.size > 0 && this.isCacheValid()) {
      return Array.from(this.featuresCache.values())
    }

    const { data, error } = await this.supabase
      .from('features')
      .select('*')
      .eq('status', 'active')
      .order('category', { ascending: true })

    if (error) {
      console.error('Error fetching features:', error)
      return []
    }

    // Update cache
    this.featuresCache.clear()
    data?.forEach(feature => {
      this.featuresCache.set(feature.feature_key, feature)
    })
    this.cacheExpiry = new Date(Date.now() + this.CACHE_DURATION)

    return data || []
  }

  // Get current subscription
  async getCurrentSubscription(): Promise<SubscriptionInfo | null> {
    if (this.subscriptionCache && this.isCacheValid()) {
      return this.subscriptionCache
    }

    const { data: user } = await this.supabase.auth.getUser()
    if (!user.user) return null

    const { data: profile } = await this.supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.user.id)
      .single()

    if (!profile?.organization_id) return null

    // Get subscription with features
    const { data: subscription } = await this.supabase
      .from('subscriptions')
      .select(`
        *,
        subscription_features!inner(
          feature_id,
          enabled,
          features!inner(
            feature_key,
            is_free
          )
        )
      `)
      .eq('organization_id', profile.organization_id)
      .single()

    if (!subscription) return null

    // Extract active feature keys
    const features = subscription.subscription_features
      ?.filter((sf: any) => sf.enabled)
      .map((sf: any) => sf.features.feature_key) || []

    // Add free features
    const freeFeatures = await this.getFreeFeatures()
    features.push(...freeFeatures.map(f => f.feature_key))

    this.subscriptionCache = {
      ...subscription,
      features: [...new Set(features)] // Remove duplicates
    }
    this.cacheExpiry = new Date(Date.now() + this.CACHE_DURATION)

    return this.subscriptionCache
  }

  // Get free features
  async getFreeFeatures(): Promise<FeatureInfo[]> {
    const allFeatures = await this.getAllFeatures()
    return allFeatures.filter(f => f.is_free)
  }

  // Check if organization has access to a feature
  async hasFeature(featureKey: FeatureKey): Promise<boolean> {
    // First check if it's a free feature
    const allFeatures = await this.getAllFeatures()
    const feature = allFeatures.find(f => f.feature_key === featureKey)
    
    if (feature?.is_free) {
      return true
    }

    // Check subscription
    const subscription = await this.getCurrentSubscription()
    if (!subscription) return false

    // During trial, all features are available
    if (subscription.status === 'trial') {
      const trialEnd = new Date(subscription.trial_ends_at)
      if (trialEnd > new Date()) {
        return true
      }
    }

    // Check if feature is in subscription
    return subscription.features.includes(featureKey)
  }

  // Check multiple features at once
  async hasFeatures(featureKeys: FeatureKey[]): Promise<Record<FeatureKey, boolean>> {
    const result: Record<string, boolean> = {}
    
    for (const key of featureKeys) {
      result[key] = await this.hasFeature(key)
    }
    
    return result
  }

  // Get subscription status
  async getSubscriptionStatus(): Promise<{
    isActive: boolean
    isTrial: boolean
    daysRemaining: number
    status: string
  }> {
    const subscription = await this.getCurrentSubscription()
    
    if (!subscription) {
      return {
        isActive: false,
        isTrial: false,
        daysRemaining: 0,
        status: 'none'
      }
    }

    const now = new Date()
    const trialEnd = new Date(subscription.trial_ends_at)
    const periodEnd = new Date(subscription.current_period_end)
    
    const isTrial = subscription.status === 'trial' && trialEnd > now
    const isActive = subscription.status === 'active' || isTrial
    
    const daysRemaining = Math.ceil(
      ((isTrial ? trialEnd : periodEnd).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    )

    return {
      isActive,
      isTrial,
      daysRemaining: Math.max(0, daysRemaining),
      status: subscription.status
    }
  }

  // Track feature usage
  async trackFeatureUsage(featureKey: FeatureKey, metrics?: Record<string, any>) {
    const { data: user } = await this.supabase.auth.getUser()
    if (!user.user) return

    const { data: profile } = await this.supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.user.id)
      .single()

    if (!profile?.organization_id) return

    const feature = await this.getFeatureByKey(featureKey)
    if (!feature) return

    await this.supabase
      .from('feature_usage')
      .upsert({
        organization_id: profile.organization_id,
        feature_id: feature.id,
        user_id: user.user.id,
        usage_date: new Date().toISOString().split('T')[0],
        usage_count: 1,
        metrics: metrics || {}
      }, {
        onConflict: 'organization_id,feature_id,usage_date,user_id',
        count: 'exact'
      })
  }

  // Get feature by key
  private async getFeatureByKey(featureKey: string): Promise<FeatureInfo | null> {
    const features = await this.getAllFeatures()
    return features.find(f => f.feature_key === featureKey) || null
  }

  // Calculate pricing for selected features
  async calculatePricing(
    selectedFeatureKeys: string[],
    userCount: number,
    billingPeriod: 'monthly' | 'yearly'
  ): Promise<{
    userTierPrice: number
    featuresTotal: number
    monthlyTotal: number
    yearlyTotal: number
    savings: number
  }> {
    // Get user tier pricing
    const { data: tiers } = await this.supabase
      .from('user_tier_pricing')
      .select('*')
      .order('min_users', { ascending: true })

    const currentTier = tiers?.find(tier => 
      userCount >= tier.min_users && 
      (tier.max_users === null || userCount <= tier.max_users)
    )

    const userTierPrice = (currentTier?.price_per_user || 0) * userCount

    // Get features pricing
    const features = await this.getAllFeatures()
    let featuresTotal = 0

    for (const key of selectedFeatureKeys) {
      const feature = features.find(f => f.feature_key === key)
      if (feature && !feature.is_free) {
        if (feature.billing_unit === 'user') {
          featuresTotal += feature.base_price * userCount
        } else {
          featuresTotal += feature.base_price
        }
      }
    }

    const monthlyTotal = userTierPrice + featuresTotal
    const yearlyTotal = monthlyTotal * 12 * 0.8 // 20% discount
    const savings = (monthlyTotal * 12) - yearlyTotal

    return {
      userTierPrice,
      featuresTotal,
      monthlyTotal,
      yearlyTotal,
      savings
    }
  }
}

// Export singleton instance
export const featureAccess = FeatureAccessManager.getInstance()

// Hook for React components
import { useState, useEffect } from 'react'

export function useFeatureAccess(featureKey: FeatureKey) {
  const [hasAccess, setHasAccess] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    featureAccess.hasFeature(featureKey).then(access => {
      setHasAccess(access)
      setLoading(false)
    })
  }, [featureKey])

  return { hasAccess, loading }
}

export function useSubscription() {
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null)
  const [status, setStatus] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      featureAccess.getCurrentSubscription(),
      featureAccess.getSubscriptionStatus()
    ]).then(([sub, stat]) => {
      setSubscription(sub)
      setStatus(stat)
      setLoading(false)
    })
  }, [])

  return { subscription, status, loading, refresh: () => featureAccess.clearCache() }
}

// Feature gate component - moved to separate .tsx file
// This is just the hook exports