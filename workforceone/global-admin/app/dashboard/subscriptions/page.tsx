'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  CreditCard, DollarSign, TrendingUp, TrendingDown, Calendar, 
  AlertTriangle, CheckCircle, Clock, Building2, Users, Search,
  Filter, MoreVertical, Edit, Trash2, RefreshCw, Eye, Bell,
  Package, Star, Zap
} from 'lucide-react'
import { formatCurrency, formatDate, formatDateTime } from '@/lib/utils'

interface Subscription {
  id: string
  organization_id: string
  organization_name: string
  plan_type: 'starter' | 'professional' | 'enterprise' | 'custom'
  status: 'active' | 'trial' | 'past_due' | 'cancelled' | 'incomplete' | 'incomplete_expired'
  current_period_start: string
  current_period_end: string
  trial_start?: string
  trial_end?: string
  cancel_at_period_end: boolean
  cancelled_at?: string
  created_at: string
  
  // Pricing details
  monthly_amount: number
  yearly_amount?: number
  currency: string
  billing_cycle: 'monthly' | 'yearly'
  
  // Usage
  user_count: number
  user_limit: number
  
  // Stripe details
  stripe_subscription_id?: string
  stripe_customer_id?: string
  stripe_price_id?: string
  
  // Financial metrics
  mrr: number // Monthly Recurring Revenue
  arr: number // Annual Recurring Revenue
  lifetime_value: number
  
  // Features
  features: {
    time_tracking: boolean
    project_management: boolean
    team_collaboration: boolean
    advanced_reporting: boolean
    api_access: boolean
    priority_support: boolean
    custom_integrations: boolean
  }
}

const MOCK_SUBSCRIPTIONS: Subscription[] = [
  {
    id: '1',
    organization_id: '1',
    organization_name: 'TechCorp Solutions',
    plan_type: 'enterprise',
    status: 'active',
    current_period_start: '2024-08-01T00:00:00Z',
    current_period_end: '2024-09-01T00:00:00Z',
    cancel_at_period_end: false,
    created_at: '2024-01-15T08:00:00Z',
    monthly_amount: 2450,
    yearly_amount: 26460,
    currency: 'USD',
    billing_cycle: 'monthly',
    user_count: 145,
    user_limit: 500,
    stripe_subscription_id: 'sub_1234567890',
    stripe_customer_id: 'cus_1234567890',
    stripe_price_id: 'price_enterprise_monthly',
    mrr: 2450,
    arr: 29400,
    lifetime_value: 12250,
    features: {
      time_tracking: true,
      project_management: true,
      team_collaboration: true,
      advanced_reporting: true,
      api_access: true,
      priority_support: true,
      custom_integrations: true
    }
  },
  {
    id: '2',
    organization_id: '2',
    organization_name: 'Global Marketing Inc',
    plan_type: 'professional',
    status: 'active',
    current_period_start: '2024-07-20T00:00:00Z',
    current_period_end: '2024-08-20T00:00:00Z',
    cancel_at_period_end: false,
    created_at: '2024-02-20T10:15:00Z',
    monthly_amount: 890,
    yearly_amount: 9612,
    currency: 'USD',
    billing_cycle: 'yearly',
    user_count: 78,
    user_limit: 100,
    stripe_subscription_id: 'sub_0987654321',
    stripe_customer_id: 'cus_0987654321',
    stripe_price_id: 'price_professional_yearly',
    mrr: 801,
    arr: 9612,
    lifetime_value: 4950,
    features: {
      time_tracking: true,
      project_management: true,
      team_collaboration: true,
      advanced_reporting: true,
      api_access: false,
      priority_support: true,
      custom_integrations: false
    }
  },
  {
    id: '3',
    organization_id: '3',
    organization_name: 'StartupLab',
    plan_type: 'starter',
    status: 'trial',
    current_period_start: '2024-08-10T00:00:00Z',
    current_period_end: '2024-08-24T00:00:00Z',
    trial_start: '2024-08-10T16:20:00Z',
    trial_end: '2024-08-24T16:20:00Z',
    cancel_at_period_end: false,
    created_at: '2024-08-10T16:20:00Z',
    monthly_amount: 0,
    currency: 'USD',
    billing_cycle: 'monthly',
    user_count: 12,
    user_limit: 25,
    mrr: 0,
    arr: 0,
    lifetime_value: 0,
    features: {
      time_tracking: true,
      project_management: true,
      team_collaboration: false,
      advanced_reporting: false,
      api_access: false,
      priority_support: false,
      custom_integrations: false
    }
  },
  {
    id: '4',
    organization_id: '4',
    organization_name: 'MedTech Systems',
    plan_type: 'professional',
    status: 'past_due',
    current_period_start: '2024-07-15T00:00:00Z',
    current_period_end: '2024-08-15T00:00:00Z',
    cancel_at_period_end: false,
    created_at: '2023-11-08T12:30:00Z',
    monthly_amount: 670,
    yearly_amount: 7236,
    currency: 'USD',
    billing_cycle: 'monthly',
    user_count: 56,
    user_limit: 100,
    stripe_subscription_id: 'sub_5678901234',
    stripe_customer_id: 'cus_5678901234',
    stripe_price_id: 'price_professional_monthly',
    mrr: 0, // Not paying currently
    arr: 0,
    lifetime_value: 6030,
    features: {
      time_tracking: true,
      project_management: true,
      team_collaboration: true,
      advanced_reporting: true,
      api_access: false,
      priority_support: true,
      custom_integrations: false
    }
  }
]

const PLAN_CONFIGS = {
  starter: {
    name: 'Starter',
    color: 'bg-gray-100 text-gray-800',
    basePrice: 29,
    features: ['Basic time tracking', 'Project management', 'Up to 25 users']
  },
  professional: {
    name: 'Professional', 
    color: 'bg-blue-100 text-blue-800',
    basePrice: 79,
    features: ['Advanced reporting', 'Team collaboration', 'Up to 100 users', 'Priority support']
  },
  enterprise: {
    name: 'Enterprise',
    color: 'bg-purple-100 text-purple-800', 
    basePrice: 199,
    features: ['API access', 'Custom integrations', 'Unlimited users', 'Dedicated support']
  },
  custom: {
    name: 'Custom',
    color: 'bg-gold-100 text-gold-800',
    basePrice: 0,
    features: ['Custom features', 'Volume pricing', 'Enterprise SLA']
  }
}

export default function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [filteredSubs, setFilteredSubs] = useState<Subscription[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [planFilter, setPlanFilter] = useState<string>('all')
  const [loading, setLoading] = useState(true)
  const [selectedSub, setSelectedSub] = useState<Subscription | null>(null)

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setSubscriptions(MOCK_SUBSCRIPTIONS)
      setFilteredSubs(MOCK_SUBSCRIPTIONS)
      setLoading(false)
    }, 1000)
  }, [])

  useEffect(() => {
    let filtered = subscriptions

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(sub => 
        sub.organization_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sub.stripe_customer_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sub.stripe_subscription_id?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(sub => sub.status === statusFilter)
    }

    // Apply plan filter
    if (planFilter !== 'all') {
      filtered = filtered.filter(sub => sub.plan_type === planFilter)
    }

    setFilteredSubs(filtered)
  }, [subscriptions, searchTerm, statusFilter, planFilter])

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { color: 'bg-green-100 text-green-800', label: 'Active', icon: CheckCircle },
      trial: { color: 'bg-blue-100 text-blue-800', label: 'Trial', icon: Clock },
      past_due: { color: 'bg-red-100 text-red-800', label: 'Past Due', icon: AlertTriangle },
      cancelled: { color: 'bg-gray-100 text-gray-800', label: 'Cancelled', icon: RefreshCw },
      incomplete: { color: 'bg-yellow-100 text-yellow-800', label: 'Incomplete', icon: Clock },
      incomplete_expired: { color: 'bg-red-100 text-red-800', label: 'Incomplete Expired', icon: AlertTriangle }
    }
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.cancelled
    const Icon = config.icon
    return (
      <Badge className={`${config.color} flex items-center`}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </Badge>
    )
  }

  const getPlanBadge = (planType: string) => {
    const config = PLAN_CONFIGS[planType as keyof typeof PLAN_CONFIGS] || PLAN_CONFIGS.starter
    return <Badge className={config.color}>{config.name}</Badge>
  }

  const calculateMetrics = () => {
    const totalSubs = subscriptions.length
    const activeSubs = subscriptions.filter(sub => sub.status === 'active').length
    const totalMRR = subscriptions.reduce((sum, sub) => sum + sub.mrr, 0)
    const totalARR = subscriptions.reduce((sum, sub) => sum + sub.arr, 0)
    const avgLTV = subscriptions.reduce((sum, sub) => sum + sub.lifetime_value, 0) / totalSubs
    const churnRate = (subscriptions.filter(sub => sub.status === 'cancelled').length / totalSubs) * 100

    return { totalSubs, activeSubs, totalMRR, totalARR, avgLTV, churnRate }
  }

  const metrics = calculateMetrics()

  const handleCancelSubscription = async (subscriptionId: string) => {
    if (!confirm('Are you sure you want to cancel this subscription?')) return
    
    try {
      // In real implementation, this would call Stripe API
      console.log('Cancelling subscription:', subscriptionId)
      alert('Subscription cancelled successfully')
    } catch (error) {
      console.error('Error cancelling subscription:', error)
      alert('Failed to cancel subscription')
    }
  }

  const handleReactivateSubscription = async (subscriptionId: string) => {
    try {
      // In real implementation, this would call Stripe API
      console.log('Reactivating subscription:', subscriptionId)
      alert('Subscription reactivated successfully')
    } catch (error) {
      console.error('Error reactivating subscription:', error)
      alert('Failed to reactivate subscription')
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Subscriptions</h1>
          <p className="text-gray-600 mt-1">Manage customer subscriptions and billing</p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Sync with Stripe
          </Button>
          <Button className="bg-admin-600 hover:bg-admin-700">
            <CreditCard className="w-4 h-4 mr-2" />
            Create Subscription
          </Button>
        </div>
      </div>

      {/* Revenue Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total MRR</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{formatCurrency(metrics.totalMRR)}</div>
            <div className="flex items-center mt-1">
              <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
              <span className="text-sm text-green-600">+12.5% MoM</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total ARR</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{formatCurrency(metrics.totalARR)}</div>
            <div className="text-sm text-gray-600 mt-1">Annual run rate</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Active Subscriptions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{metrics.activeSubs}</div>
            <div className="text-sm text-gray-600 mt-1">of {metrics.totalSubs} total</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Avg LTV</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600">{formatCurrency(metrics.avgLTV)}</div>
            <div className="text-sm text-gray-600 mt-1">Lifetime value</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Churn Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">{metrics.churnRate.toFixed(1)}%</div>
            <div className="flex items-center mt-1">
              <TrendingDown className="w-4 h-4 text-green-500 mr-1" />
              <span className="text-sm text-green-600">-2.1% vs last month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Trial Conversions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-600">78%</div>
            <div className="text-sm text-gray-600 mt-1">Trial to paid rate</div>
          </CardContent>
        </Card>
      </div>

      {/* Plan Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {Object.entries(PLAN_CONFIGS).map(([key, plan]) => {
          const planSubs = subscriptions.filter(sub => sub.plan_type === key && sub.status === 'active')
          const planMRR = planSubs.reduce((sum, sub) => sum + sub.mrr, 0)
          
          return (
            <Card key={key}>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center justify-between">
                  <span className="text-lg font-semibold">{plan.name}</span>
                  {getPlanBadge(key)}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Active:</span>
                    <span className="font-medium">{planSubs.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">MRR:</span>
                    <span className="font-medium">{formatCurrency(planMRR)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Base Price:</span>
                    <span className="font-medium">{plan.basePrice > 0 ? formatCurrency(plan.basePrice) : 'Custom'}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search organizations, subscription IDs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-admin-500 focus:border-admin-500"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="trial">Trial</option>
              <option value="past_due">Past Due</option>
              <option value="cancelled">Cancelled</option>
              <option value="incomplete">Incomplete</option>
            </select>

            <select
              value={planFilter}
              onChange={(e) => setPlanFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-admin-500 focus:border-admin-500"
            >
              <option value="all">All Plans</option>
              <option value="starter">Starter</option>
              <option value="professional">Professional</option>
              <option value="enterprise">Enterprise</option>
              <option value="custom">Custom</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Subscriptions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Subscriptions ({filteredSubs.length})</CardTitle>
          <CardDescription>
            Detailed view of all customer subscriptions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Organization</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Plan & Status</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Billing</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Usage</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Revenue</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Next Billing</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredSubs.map((sub) => (
                  <tr key={sub.id} className="border-b hover:bg-gray-50">
                    <td className="py-4 px-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-admin-100 rounded-lg flex items-center justify-center">
                          <Building2 className="w-5 h-5 text-admin-600" />
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">{sub.organization_name}</div>
                          <div className="text-sm text-gray-500">{sub.stripe_customer_id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="space-y-1">
                        {getPlanBadge(sub.plan_type)}
                        {getStatusBadge(sub.status)}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="text-sm">
                        <div className="font-medium">{formatCurrency(sub.monthly_amount)}</div>
                        <div className="text-gray-500 capitalize">{sub.billing_cycle}</div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="text-sm">
                        <div className="font-medium">{sub.user_count}/{sub.user_limit} users</div>
                        <div className="text-gray-500">
                          {Math.round((sub.user_count / sub.user_limit) * 100)}% utilized
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="text-sm">
                        <div className="font-medium text-green-600">MRR: {formatCurrency(sub.mrr)}</div>
                        <div className="text-gray-500">LTV: {formatCurrency(sub.lifetime_value)}</div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="text-sm">
                        {sub.status === 'trial' ? (
                          <>
                            <div className="font-medium text-blue-600">Trial ends</div>
                            <div className="text-gray-500">{formatDate(sub.trial_end!)}</div>
                          </>
                        ) : (
                          <>
                            <div className="font-medium">Next billing</div>
                            <div className="text-gray-500">{formatDate(sub.current_period_end)}</div>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedSub(sub)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        {sub.status === 'active' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCancelSubscription(sub.id)}
                          >
                            <RefreshCw className="w-4 h-4" />
                          </Button>
                        )}
                        {sub.status === 'cancelled' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleReactivateSubscription(sub.id)}
                          >
                            <CheckCircle className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Subscription Details Modal */}
      {selectedSub && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Subscription Details</h2>
                <Button
                  variant="outline"
                  onClick={() => setSelectedSub(null)}
                >
                  Close
                </Button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Basic Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Building2 className="w-5 h-5 mr-2" />
                      Subscription Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Organization</label>
                      <div className="text-lg font-semibold">{selectedSub.organization_name}</div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Plan</label>
                      <div>{getPlanBadge(selectedSub.plan_type)}</div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Status</label>
                      <div>{getStatusBadge(selectedSub.status)}</div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Created</label>
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                        {formatDate(selectedSub.created_at)}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Billing Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <CreditCard className="w-5 h-5 mr-2" />
                      Billing Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Billing Cycle</label>
                      <div className="text-lg font-semibold capitalize">{selectedSub.billing_cycle}</div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Amount</label>
                      <div className="text-lg font-semibold text-green-600">
                        {formatCurrency(selectedSub.monthly_amount)}
                        {selectedSub.billing_cycle === 'yearly' && selectedSub.yearly_amount && (
                          <span className="text-sm text-gray-500 ml-1">
                            ({formatCurrency(selectedSub.yearly_amount)}/year)
                          </span>
                        )}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Current Period</label>
                      <div className="text-sm">
                        {formatDate(selectedSub.current_period_start)} - {formatDate(selectedSub.current_period_end)}
                      </div>
                    </div>
                    {selectedSub.stripe_subscription_id && (
                      <div>
                        <label className="text-sm font-medium text-gray-600">Stripe Subscription ID</label>
                        <div className="text-sm font-mono">{selectedSub.stripe_subscription_id}</div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Usage Information */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Users className="w-5 h-5 mr-2" />
                      Usage Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600">User Count</label>
                      <div className="text-lg font-semibold">
                        {selectedSub.user_count} / {selectedSub.user_limit}
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                        <div 
                          className="bg-admin-600 h-2 rounded-full" 
                          style={{ width: `${(selectedSub.user_count / selectedSub.user_limit) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Revenue Metrics */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <DollarSign className="w-5 h-5 mr-2" />
                      Revenue Metrics
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-gray-600">Monthly Recurring Revenue</label>
                      <div className="text-lg font-semibold text-green-600">
                        {formatCurrency(selectedSub.mrr)}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Annual Recurring Revenue</label>
                      <div className="text-lg font-semibold text-green-600">
                        {formatCurrency(selectedSub.arr)}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-600">Lifetime Value</label>
                      <div className="text-lg font-semibold text-purple-600">
                        {formatCurrency(selectedSub.lifetime_value)}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Features */}
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Zap className="w-5 h-5 mr-2" />
                    Plan Features
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {Object.entries(selectedSub.features).map(([feature, enabled]) => (
                      <div key={feature} className="flex items-center space-x-2">
                        <div className={`w-3 h-3 rounded-full ${enabled ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                        <span className="text-sm capitalize">{feature.replace(/_/g, ' ')}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}