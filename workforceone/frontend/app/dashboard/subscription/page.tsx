'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Switch } from '@/components/ui/switch'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  CreditCard, Users, Calendar, Package, Zap, Settings,
  Check, X, AlertCircle, ChevronRight, Plus, Minus,
  Building2, Clock, TrendingUp, Shield, Sparkles, Crown, ArrowUp
} from 'lucide-react'
import { useSubscription, featureAccess, FEATURES } from '@/lib/feature-access'
import { formatPrice, CURRENCIES, getUserLocationAndCurrency, CurrencyInfo } from '@/lib/currency-utils'
import { format, differenceInDays } from 'date-fns'
import { TrialNotification } from '@/components/trial-notification'
import { PaymentCheckout } from '@/components/payment-checkout'

interface Feature {
  id: string
  feature_key: string
  name: string
  description: string
  category: string
  is_free: boolean
  base_price: number
  billing_unit: 'user' | 'organization'
  is_popular: boolean
}

interface PricingTier {
  id: string
  name: string
  price: number
  yearlyPrice: number
  icon: React.ComponentType<any>
  color: string
  bgColor: string
  description: string
  features: string[]
}

const PRICING_TIERS: PricingTier[] = [
  {
    id: 'starter',
    name: 'Starter',
    price: 5,
    yearlyPrice: 4,
    icon: Building2,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    description: 'Perfect for small teams getting started',
    features: [
      'Team Management (up to 30)',
      'Basic Attendance Tracking',
      'Task Management',
      'Mobile App Access',
      'Email Support',
      'Basic Forms & Reports'
    ]
  },
  {
    id: 'professional',
    name: 'Professional',
    price: 9,
    yearlyPrice: 7,
    icon: Zap,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    description: 'For growing businesses with advanced needs',
    features: [
      'Team Management (up to 100)',
      'Advanced Attendance & Time Tracking',
      'GPS & Route Tracking',
      'Advanced Analytics',
      'Workflow Automation',
      'Priority Support'
    ]
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 21,
    yearlyPrice: 17,
    icon: Crown,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    description: 'For large organizations with custom requirements',
    features: [
      'Unlimited Team Members',
      'Enterprise Attendance Suite',
      'Predictive Analytics',
      'Full API Access',
      'Custom Integrations',
      'Dedicated Account Manager'
    ]
  }
]

export default function SubscriptionPage() {
  const router = useRouter()
  const supabase = createClient()
  const { subscription, status, loading: subLoading, refresh } = useSubscription()
  
  const [features, setFeatures] = useState<Feature[]>([])
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([])
  const [userCount, setUserCount] = useState(1)
  const [isYearly, setIsYearly] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [showAddFeatures, setShowAddFeatures] = useState(false)
  const [userCurrency, setUserCurrency] = useState<CurrencyInfo>(CURRENCIES.USD)
  const [showPayment, setShowPayment] = useState(false)
  const [upgrading, setUpgrading] = useState(false)

  useEffect(() => {
    fetchUserProfile()
    fetchFeatures()
    fetchCurrentSetup()
    fetchUserCurrency()
  }, [])

  const fetchUserCurrency = async () => {
    try {
      const locationInfo = await getUserLocationAndCurrency()
      setUserCurrency(locationInfo.currency)
    } catch (error) {
      console.log('Using default USD currency')
      setUserCurrency(CURRENCIES.USD)
    }
  }

  const fetchUserProfile = async () => {
    const { data: user } = await supabase.auth.getUser()
    if (!user.user) return

    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.user.id)
      .single()

    setUserProfile(profile)
  }

  const fetchFeatures = async () => {
    const allFeatures = await featureAccess.getAllFeatures()
    setFeatures(allFeatures)
  }

  const fetchCurrentSetup = async () => {
    try {
      const sub = await featureAccess.getCurrentSubscription()
      if (sub) {
        setUserCount(sub.user_count)
        setIsYearly(sub.billing_period === 'yearly')
        setSelectedFeatures(sub.features.filter(f => !isFreeFeature(f)))
      }
    } finally {
      setLoading(false)
    }
  }

  const isFreeFeature = (featureKey: string) => {
    return features.find(f => f.feature_key === featureKey)?.is_free || false
  }

  const calculatePricing = async () => {
    return await featureAccess.calculatePricing(
      selectedFeatures,
      userCount,
      isYearly ? 'yearly' : 'monthly'
    )
  }

  const handleSaveChanges = async () => {
    setSaving(true)
    try {
      const { data: user } = await supabase.auth.getUser()
      if (!user.user) return

      // Update subscription
      const { error } = await supabase.rpc('update_subscription', {
        org_id: userProfile.organization_id,
        user_count: userCount,
        billing_period: isYearly ? 'yearly' : 'monthly',
        feature_keys: selectedFeatures
      })

      if (error) throw error

      refresh()
      alert('Subscription updated successfully!')
    } catch (error) {
      console.error('Error updating subscription:', error)
      alert('Failed to update subscription')
    } finally {
      setSaving(false)
    }
  }

  const handleStartPayment = () => {
    setShowPayment(true)
  }

  const handlePaymentSuccess = () => {
    setShowPayment(false)
    refresh()
    router.push('/payment/success')
  }

  const handlePaymentCancel = () => {
    setShowPayment(false)
  }

  const getCurrentTier = () => {
    if (!subscription) return null
    const tierPrice = subscription.user_tier_price || 0
    return PRICING_TIERS.find(tier => tier.price === tierPrice || tier.yearlyPrice === tierPrice) || null
  }

  const getAvailableUpgrades = () => {
    const currentTier = getCurrentTier()
    if (!currentTier) return PRICING_TIERS
    
    const currentIndex = PRICING_TIERS.findIndex(tier => tier.id === currentTier.id)
    return PRICING_TIERS.slice(currentIndex + 1)
  }

  const handleUpgradeToTier = async (targetTier: PricingTier) => {
    setUpgrading(true)
    try {
      // First update the tier features
      const tierFeatures = getTierFeatures(targetTier.id)
      setSelectedFeatures(tierFeatures)
      
      // Update subscription with new tier pricing
      const { data: user } = await supabase.auth.getUser()
      if (!user.user) return

      const { error } = await supabase.rpc('update_subscription', {
        org_id: userProfile.organization_id,
        user_count: userCount,
        billing_period: isYearly ? 'yearly' : 'monthly',
        feature_keys: tierFeatures
      })

      if (error) throw error

      // Update the tier pricing in subscription
      const tierPrice = isYearly ? targetTier.yearlyPrice : targetTier.price
      const { error: priceError } = await supabase
        .from('subscriptions')
        .update({
          user_tier_price: tierPrice,
          monthly_total: tierPrice * userCount
        })
        .eq('organization_id', userProfile.organization_id)

      if (priceError) throw priceError

      refresh()
      alert(`Successfully upgraded to ${targetTier.name}!`)
    } catch (error) {
      console.error('Error upgrading tier:', error)
      alert('Failed to upgrade tier')
    } finally {
      setUpgrading(false)
    }
  }

  const getTierFeatures = (tierId: string): string[] => {
    // Define feature sets for each tier
    const tierFeatureSets: Record<string, string[]> = {
      starter: [
        'dashboard',
        'attendance',
        'leave',
        'teams',
        'forms',
        'mobile_clock_in',
        'mobile_leave',
        'mobile_forms'
      ],
      professional: [
        'dashboard',
        'attendance',
        'leave',
        'teams',
        'forms',
        'time_tracking',
        'projects',
        'tasks',
        'routes',
        'maps',
        'outlets',
        'analytics',
        'custom_branding',
        'color_schemes',
        'mobile_clock_in',
        'mobile_leave',
        'mobile_forms',
        'mobile_offline_mode',
        'mobile_push_notifications',
        'mobile_gps_tracking',
        'mobile_photo_attachments',
        'priority_support'
      ],
      enterprise: [
        'dashboard',
        'attendance',
        'leave',
        'teams',
        'forms',
        'time_tracking',
        'projects',
        'tasks',
        'routes',
        'maps',
        'outlets',
        'analytics',
        'automation',
        'integrations',
        'payroll',
        'daily_calls',
        'messaging',
        'api_access',
        'custom_branding',
        'color_schemes',
        'mobile_clock_in',
        'mobile_leave',
        'mobile_forms',
        'mobile_offline_mode',
        'mobile_push_notifications',
        'mobile_gps_tracking',
        'mobile_photo_attachments',
        'mobile_analytics',
        'mobile_messaging',
        'mobile_daily_calls',
        'mobile_payslips',
        'priority_support',
        'phone_support',
        'dedicated_support'
      ]
    }
    
    return tierFeatureSets[tierId] || []
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      trial: 'bg-blue-100 text-blue-800',
      active: 'bg-green-100 text-green-800',
      past_due: 'bg-red-100 text-red-800',
      canceled: 'bg-gray-100 text-gray-800',
      paused: 'bg-yellow-100 text-yellow-800'
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, any> = {
      productivity: Zap,
      analytics: TrendingUp,
      location: Package,
      integration: Settings,
      support: Shield
    }
    return icons[category] || Package
  }

  if (loading || subLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // Only admins can manage subscriptions
  if (userProfile?.role !== 'admin') {
    return (
      <div className="p-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Only administrators can manage subscriptions.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  const activeFeatures = features.filter(f => 
    selectedFeatures.includes(f.feature_key) || f.is_free
  )

  const groupedFeatures = activeFeatures.reduce((acc, feature) => {
    if (!acc[feature.category]) acc[feature.category] = []
    acc[feature.category].push(feature)
    return acc
  }, {} as Record<string, Feature[]>)

  // Show payment checkout if requested
  if (showPayment) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Complete Payment</h1>
            <p className="text-gray-600">Secure payment powered by Stripe</p>
          </div>
          <Button variant="outline" onClick={handlePaymentCancel}>
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
        </div>

        <PaymentCheckout
          organizationId={userProfile.organization_id}
          selectedFeatures={selectedFeatures}
          userCount={userCount}
          billingPeriod={isYearly ? 'yearly' : 'monthly'}
          amount={isYearly ? 
            (userCount * (userCount <= 10 ? 0 : userCount <= 50 ? 2 : userCount <= 200 ? 4 : 6) +
            features
              .filter(f => selectedFeatures.includes(f.feature_key))
              .reduce((sum, f) => sum + (f.billing_unit === 'user' ? f.base_price * userCount : f.base_price), 0)) * 12 * 0.8 :
            (userCount * (userCount <= 10 ? 0 : userCount <= 50 ? 2 : userCount <= 200 ? 4 : 6) +
            features
              .filter(f => selectedFeatures.includes(f.feature_key))
              .reduce((sum, f) => sum + (f.billing_unit === 'user' ? f.base_price * userCount : f.base_price), 0))
          }
          userCurrency={userCurrency}
          onSuccess={handlePaymentSuccess}
          onCancel={handlePaymentCancel}
        />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Subscription Management</h1>
          <p className="text-gray-600">
            Manage your plan, features, and billing
            {userCurrency.code !== 'USD' && (
              <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                Prices shown in {userCurrency.name} ({userCurrency.code})
              </span>
            )}
          </p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline" onClick={() => router.push('/pricing/modular')}>
            <Package className="h-4 w-4 mr-2" />
            View Pricing
          </Button>
          <Button variant="outline">
            <CreditCard className="h-4 w-4 mr-2" />
            Payment Methods
          </Button>
        </div>
      </div>

      {/* Trial Notification */}
      <TrialNotification 
        onStartPayment={handleStartPayment}
        userCurrency={userCurrency}
      />

      {/* Subscription Status */}
      {status && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <Calendar className="h-8 w-8 text-blue-600" />
                <Badge className={getStatusColor(subscription?.status || 'trial')}>
                  {subscription?.status || 'No Subscription'}
                </Badge>
              </div>
              <div className="text-2xl font-bold">{status.daysRemaining}</div>
              <div className="text-sm text-gray-600">
                Days {status.isTrial ? 'in trial' : 'remaining'}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <Users className="h-8 w-8 text-green-600" />
              </div>
              <div className="text-2xl font-bold">{userCount}</div>
              <div className="text-sm text-gray-600">Team members</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <Package className="h-8 w-8 text-purple-600" />
              </div>
              <div className="text-2xl font-bold">{selectedFeatures.length}</div>
              <div className="text-sm text-gray-600">Premium features</div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <CreditCard className="h-8 w-8 text-orange-600" />
              </div>
              <div className="text-2xl font-bold">
                {formatPrice(subscription?.monthly_total || 0, userCurrency)}
              </div>
              <div className="text-sm text-gray-600">
                {isYearly ? 'Per year' : 'Per month'}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Trial Banner */}
      {status?.isTrial && (
        <Alert className="bg-blue-50 border-blue-200">
          <Sparkles className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-900">
            <strong>Free Trial Active:</strong> You have {status.daysRemaining} days remaining 
            to explore all premium features. Add a payment method to continue after your trial.
          </AlertDescription>
        </Alert>
      )}

      {/* Current Plan */}
      <Card>
        <CardHeader>
          <CardTitle>Current Plan Configuration</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Team Size */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Team Size
            </label>
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setUserCount(Math.max(1, userCount - 5))}
              >
                <Minus className="h-3 w-3" />
              </Button>
              <div className="w-20 text-center font-bold text-lg">{userCount}</div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setUserCount(userCount + 5)}
              >
                <Plus className="h-3 w-3" />
              </Button>
              <span className="text-sm text-gray-600 ml-4">
                {userCount <= 10 ? 'Free tier' : 
                 userCount <= 50 ? '$2/user' :
                 userCount <= 200 ? '$4/user' : '$6/user'}
              </span>
            </div>
          </div>

          {/* Billing Period */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Billing Period
            </label>
            <div className="flex items-center space-x-3">
              <span className={!isYearly ? 'font-medium' : 'text-gray-600'}>
                Monthly
              </span>
              <Switch
                checked={isYearly}
                onCheckedChange={setIsYearly}
              />
              <span className={isYearly ? 'font-medium' : 'text-gray-600'}>
                Yearly
              </span>
              {isYearly && (
                <Badge className="bg-green-100 text-green-800">
                  Save 20%
                </Badge>
              )}
            </div>
          </div>

          {/* Current Tier & Upgrade Options */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Current Plan Tier
            </label>
            
            {/* Current Tier Display */}
            {getCurrentTier() && (
              <div className="mb-4 p-4 border rounded-lg bg-blue-50 border-blue-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {React.createElement(getCurrentTier()!.icon, { 
                      className: `h-6 w-6 ${getCurrentTier()!.color}` 
                    })}
                    <div>
                      <h3 className="font-semibold text-gray-900">{getCurrentTier()!.name}</h3>
                      <p className="text-sm text-gray-600">{getCurrentTier()!.description}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-gray-900">
                      {formatPrice(isYearly ? getCurrentTier()!.yearlyPrice : getCurrentTier()!.price, userCurrency)}
                      <span className="text-sm font-normal text-gray-600">/user/mo</span>
                    </div>
                    {isYearly && (
                      <div className="text-xs text-green-600">
                        20% yearly savings
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Upgrade Options */}
            {getAvailableUpgrades().length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
                  <ArrowUp className="h-4 w-4 mr-2 text-green-600" />
                  Available Upgrades
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {getAvailableUpgrades().map((tier) => {
                    const Icon = tier.icon
                    const currentTier = getCurrentTier()
                    const currentPrice = isYearly ? (currentTier?.yearlyPrice || 0) : (currentTier?.price || 0)
                    const newPrice = isYearly ? tier.yearlyPrice : tier.price
                    const priceDiff = newPrice - currentPrice
                    
                    return (
                      <div
                        key={tier.id}
                        className="border rounded-lg p-4 hover:border-blue-500 transition-colors bg-white"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center space-x-2">
                            <div className={`p-2 rounded-lg ${tier.bgColor}`}>
                              <Icon className={`h-5 w-5 ${tier.color}`} />
                            </div>
                            <div>
                              <h4 className="font-semibold text-gray-900">{tier.name}</h4>
                              <p className="text-xs text-gray-600">{tier.description}</p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="mb-3">
                          <div className="text-lg font-bold text-gray-900">
                            {formatPrice(newPrice, userCurrency)}
                            <span className="text-sm font-normal text-gray-600">/user/mo</span>
                          </div>
                          <div className="text-sm text-green-600 font-medium">
                            +{formatPrice(priceDiff, userCurrency)}/user/mo increase
                          </div>
                          <div className="text-sm text-gray-600">
                            Total: {formatPrice(newPrice * userCount, userCurrency)}/mo
                          </div>
                        </div>

                        <div className="mb-3">
                          <h5 className="text-xs font-medium text-gray-700 mb-2">Key Features:</h5>
                          <ul className="text-xs text-gray-600 space-y-1">
                            {tier.features.slice(0, 3).map((feature, idx) => (
                              <li key={idx} className="flex items-center">
                                <Check className="h-3 w-3 text-green-500 mr-1 flex-shrink-0" />
                                {feature}
                              </li>
                            ))}
                            {tier.features.length > 3 && (
                              <li className="text-blue-600">+{tier.features.length - 3} more features</li>
                            )}
                          </ul>
                        </div>

                        <Button
                          onClick={() => handleUpgradeToTier(tier)}
                          disabled={upgrading}
                          className="w-full"
                          size="sm"
                        >
                          {upgrading ? 'Upgrading...' : `Upgrade to ${tier.name}`}
                          <ArrowUp className="h-3 w-3 ml-1" />
                        </Button>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Active Features */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <label className="text-sm font-medium text-gray-700">
                Active Features
              </label>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAddFeatures(!showAddFeatures)}
              >
                <Plus className="h-3 w-3 mr-1" />
                Add Features
              </Button>
            </div>

            {Object.entries(groupedFeatures).map(([category, categoryFeatures]) => (
              <div key={category} className="mb-4">
                <h4 className="text-sm font-medium text-gray-600 mb-2 flex items-center">
                  {React.createElement(getCategoryIcon(category), { className: "h-4 w-4 mr-2" })}
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {categoryFeatures.map(feature => (
                    <div
                      key={feature.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center space-x-2">
                        <Check className="h-4 w-4 text-green-600" />
                        <span className="text-sm">{feature.name}</span>
                        {feature.is_free && (
                          <Badge variant="outline" className="text-xs bg-green-50">
                            Free
                          </Badge>
                        )}
                      </div>
                      {!feature.is_free && (
                        <span className="text-sm text-gray-600">
                          {formatPrice(feature.base_price, userCurrency)}
                          /{feature.billing_unit === 'user' ? 'user' : 'month'}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Add Features Modal */}
      {showAddFeatures && (
        <Card>
          <CardHeader>
            <CardTitle>Add Premium Features</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {features
                .filter(f => !f.is_free && !selectedFeatures.includes(f.feature_key))
                .map(feature => (
                  <div
                    key={feature.id}
                    className="border rounded-lg p-4 hover:border-blue-500 cursor-pointer"
                    onClick={() => {
                      setSelectedFeatures([...selectedFeatures, feature.feature_key])
                    }}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium">{feature.name}</h4>
                      {feature.is_popular && (
                        <Badge variant="secondary" className="text-xs">
                          Popular
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{feature.description}</p>
                    <div className="text-sm font-medium text-blue-600">
                      {formatPrice(feature.base_price, userCurrency)}
                      /{feature.billing_unit === 'user' ? 'user' : 'month'}
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pricing Summary */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle>Pricing Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Base user pricing ({userCount} users)</span>
              <span className="font-medium">
                {userCount <= 10 ? formatPrice(0, userCurrency) : 
                 formatPrice(
                   userCount * (userCount <= 50 ? 2 : userCount <= 200 ? 4 : 6),
                   userCurrency
                 )}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Premium features</span>
              <span className="font-medium">
                {formatPrice(
                  features
                    .filter(f => selectedFeatures.includes(f.feature_key))
                    .reduce((sum, f) => {
                      return sum + (f.billing_unit === 'user' ? f.base_price * userCount : f.base_price)
                    }, 0),
                  userCurrency
                )}
              </span>
            </div>
            {isYearly && (
              <div className="flex justify-between text-green-600">
                <span>Yearly discount (20%)</span>
                <span className="font-medium">
                  -{formatPrice(
                    (userCount * (userCount <= 10 ? 0 : userCount <= 50 ? 2 : userCount <= 200 ? 4 : 6) +
                    features
                      .filter(f => selectedFeatures.includes(f.feature_key))
                      .reduce((sum, f) => {
                        return sum + (f.billing_unit === 'user' ? f.base_price * userCount : f.base_price)
                      }, 0)) * 12 * 0.2,
                    userCurrency
                  )}
                </span>
              </div>
            )}
            <div className="border-t pt-2">
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span>
                  {formatPrice(
                    (userCount * (userCount <= 10 ? 0 : userCount <= 50 ? 2 : userCount <= 200 ? 4 : 6) +
                    features
                      .filter(f => selectedFeatures.includes(f.feature_key))
                      .reduce((sum, f) => {
                        return sum + (f.billing_unit === 'user' ? f.base_price * userCount : f.base_price)
                      }, 0)) * (isYearly ? 12 * 0.8 : 1),
                    userCurrency
                  )}
                  /{isYearly ? 'year' : 'month'}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end space-x-3">
            <Button variant="outline" onClick={fetchCurrentSetup}>
              Cancel Changes
            </Button>
            <Button onClick={handleSaveChanges} disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Invoices */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Invoices</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-gray-600">
            No invoices available yet. Invoices will appear here after your first payment.
          </div>
        </CardContent>
      </Card>
    </div>
  )
}