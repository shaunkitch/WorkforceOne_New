'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  X, Crown, Zap, Building2, Users, DollarSign, Calendar,
  Check, AlertTriangle, Loader2, Save, ArrowUp, ArrowDown, XCircle
} from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'

interface Subscription {
  id: string
  organization_id: string
  status: string
  billing_period: string
  user_count: number
  user_tier_price: number
  monthly_total: number
  trial_ends_at?: string
  current_period_start: string
  current_period_end: string
  created_at: string
  updated_at: string
}

interface SubscriptionModalProps {
  organizationId: string
  organizationName: string
  isOpen: boolean
  onClose: () => void
  onUpdate: () => void
}

const TIERS = [
  {
    id: 'starter',
    name: 'Starter',
    price: 5,
    icon: Building2,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
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
    icon: Zap,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
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
    icon: Crown,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200',
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

export default function SubscriptionModal({ organizationId, organizationName, isOpen, onClose, onUpdate }: SubscriptionModalProps) {
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [selectedTier, setSelectedTier] = useState<string>('')
  const [userCount, setUserCount] = useState<number>(1)
  const [trialDays, setTrialDays] = useState<number>(14)

  useEffect(() => {
    if (isOpen && organizationId) {
      fetchSubscription()
    }
  }, [isOpen, organizationId])

  const fetchSubscription = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/subscriptions?orgId=${organizationId}`)
      const result = await response.json()
      
      if (result.success) {
        setSubscription(result.data)
        if (result.data) {
          // Determine current tier based on pricing
          const currentTier = TIERS.find(tier => tier.price === result.data.user_tier_price)
          setSelectedTier(currentTier?.id || 'starter')
          setUserCount(result.data.user_count)
        } else {
          // No subscription exists - default to starter
          setSelectedTier('starter')
          setUserCount(1)
        }
      }
    } catch (error) {
      console.error('Error fetching subscription:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      
      const action = subscription ? 'update_tier' : 'create_subscription'
      const response = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orgId: organizationId,
          action,
          tier: selectedTier,
          userCount,
          trialDays
        })
      })
      
      const result = await response.json()
      
      if (result.success) {
        onUpdate()
        onClose()
      } else {
        alert(result.error || 'Failed to update subscription')
      }
    } catch (error) {
      console.error('Error saving subscription:', error)
      alert('Failed to update subscription')
    } finally {
      setSaving(false)
    }
  }

  const handleActivate = async () => {
    try {
      setSaving(true)
      const response = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orgId: organizationId,
          action: 'activate_subscription'
        })
      })
      
      const result = await response.json()
      
      if (result.success) {
        fetchSubscription()
        onUpdate()
      } else {
        alert(result.error || 'Failed to activate subscription')
      }
    } catch (error) {
      console.error('Error activating subscription:', error)
      alert('Failed to activate subscription')
    } finally {
      setSaving(false)
    }
  }

  const handleExtendTrial = async () => {
    try {
      setSaving(true)
      const response = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orgId: organizationId,
          action: 'extend_trial',
          trialDays
        })
      })
      
      const result = await response.json()
      
      if (result.success) {
        fetchSubscription()
        onUpdate()
      } else {
        alert(result.error || 'Failed to extend trial')
      }
    } catch (error) {
      console.error('Error extending trial:', error)
      alert('Failed to extend trial')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = async () => {
    try {
      setSaving(true)
      const response = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orgId: organizationId,
          action: 'cancel_subscription'
        })
      })
      
      const result = await response.json()
      
      if (result.success) {
        fetchSubscription()
        onUpdate()
      } else {
        alert(result.error || 'Failed to cancel subscription')
      }
    } catch (error) {
      console.error('Error canceling subscription:', error)
      alert('Failed to cancel subscription')
    } finally {
      setSaving(false)
    }
  }

  const selectedTierData = TIERS.find(tier => tier.id === selectedTier)
  const monthlyTotal = selectedTierData ? selectedTierData.price * userCount : 0
  const isTrialExpired = subscription?.trial_ends_at && new Date(subscription.trial_ends_at) < new Date()

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Manage Subscription</h2>
            <p className="text-sm text-gray-600">{organizationName}</p>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center p-12">
            <Loader2 className="w-8 h-8 animate-spin text-admin-600" />
          </div>
        ) : (
          <div className="p-6 space-y-6">
            {/* Current Status */}
            {subscription && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <DollarSign className="w-5 h-5" />
                    <span>Current Subscription</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Status</p>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          subscription.status === 'active' ? 'bg-green-100 text-green-800' :
                          subscription.status === 'trial' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {subscription.status}
                        </span>
                        {isTrialExpired && (
                          <AlertTriangle className="w-4 h-4 text-red-600" />
                        )}
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Monthly Total</p>
                      <p className="font-semibold">{formatCurrency(subscription.monthly_total)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Users</p>
                      <p className="font-semibold">{subscription.user_count}</p>
                    </div>
                  </div>
                  
                  {subscription.trial_ends_at && (
                    <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-800">
                        Trial {isTrialExpired ? 'expired' : 'ends'}: {formatDate(subscription.trial_ends_at)}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Tier Selection */}
            <Card>
              <CardHeader>
                <CardTitle>Select Pricing Tier</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {TIERS.map((tier) => {
                    const Icon = tier.icon
                    const isSelected = selectedTier === tier.id
                    
                    return (
                      <div
                        key={tier.id}
                        onClick={() => setSelectedTier(tier.id)}
                        className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                          isSelected 
                            ? `${tier.borderColor} ${tier.bgColor}` 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <Icon className={`w-5 h-5 ${isSelected ? tier.color : 'text-gray-400'}`} />
                          {isSelected && <Check className="w-4 h-4 text-green-600" />}
                        </div>
                        
                        <h3 className="font-semibold text-gray-900">{tier.name}</h3>
                        <p className="text-2xl font-bold text-gray-900 mb-1">
                          {formatCurrency(tier.price)}
                          <span className="text-sm font-normal text-gray-600">/user/mo</span>
                        </p>
                        <p className="text-xs text-gray-600 mb-3">{tier.description}</p>
                        
                        <ul className="space-y-1">
                          {tier.features.slice(0, 3).map((feature, index) => (
                            <li key={index} className="text-xs text-gray-600 flex items-center">
                              <Check className="w-3 h-3 text-green-500 mr-1 flex-shrink-0" />
                              {feature}
                            </li>
                          ))}
                          {tier.features.length > 3 && (
                            <li className="text-xs text-gray-500">
                              +{tier.features.length - 3} more features
                            </li>
                          )}
                        </ul>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Configuration */}
            <Card>
              <CardHeader>
                <CardTitle>Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* User Count */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Number of Users
                  </label>
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => setUserCount(Math.max(1, userCount - 1))}
                      className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      <ArrowDown className="w-4 h-4" />
                    </button>
                    <input
                      type="number"
                      min="1"
                      value={userCount}
                      onChange={(e) => setUserCount(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-center focus:ring-2 focus:ring-admin-500 focus:border-admin-500"
                    />
                    <button
                      onClick={() => setUserCount(userCount + 1)}
                      className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      <ArrowUp className="w-4 h-4" />
                    </button>
                    <span className="text-sm text-gray-600">users</span>
                  </div>
                </div>

                {/* Trial Days (only for new subscriptions) */}
                {!subscription && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Trial Period (days)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="90"
                      value={trialDays}
                      onChange={(e) => setTrialDays(Math.max(0, parseInt(e.target.value) || 0))}
                      className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-admin-500 focus:border-admin-500"
                    />
                  </div>
                )}

                {/* Pricing Summary */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-2">Pricing Summary</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Tier: {selectedTierData?.name}</span>
                      <span>{formatCurrency(selectedTierData?.price || 0)}/user/month</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Users: {userCount}</span>
                      <span></span>
                    </div>
                    <div className="flex justify-between font-semibold border-t border-gray-200 pt-1">
                      <span>Monthly Total:</span>
                      <span>{formatCurrency(monthlyTotal)}</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>Annual Total (20% discount):</span>
                      <span>{formatCurrency(monthlyTotal * 12 * 0.8)}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex flex-col space-y-4 pt-4 border-t border-gray-200">
              {/* Quick Actions */}
              <div className="flex flex-wrap gap-3">
                {subscription?.status === 'trial' && (
                  <button
                    onClick={handleExtendTrial}
                    disabled={saving}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 transition-colors"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calendar className="w-4 h-4" />}
                    <span>Extend Trial ({trialDays} days)</span>
                  </button>
                )}
                
                {subscription && subscription.status !== 'active' && (
                  <button
                    onClick={handleActivate}
                    disabled={saving}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 transition-colors"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    <span>Activate Subscription</span>
                  </button>
                )}

                {subscription && subscription.status === 'active' && (
                  <button
                    onClick={() => {
                      if (confirm('Are you sure you want to cancel this subscription?')) {
                        handleCancel()
                      }
                    }}
                    disabled={saving}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 transition-colors"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                    <span>Cancel Subscription</span>
                  </button>
                )}
              </div>

              {/* Main Actions */}
              <div className="flex justify-between items-center">
                <button
                  onClick={onClose}
                  disabled={saving}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Cancel
                </button>
                
                <div className="flex space-x-3">
                  <button
                    onClick={handleSave}
                    disabled={saving || !selectedTier}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 transition-colors"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    <span>{subscription ? 'Update Subscription' : 'Create Subscription'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}