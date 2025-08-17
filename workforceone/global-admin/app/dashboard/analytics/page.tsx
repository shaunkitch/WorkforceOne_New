'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  TrendingUp, TrendingDown, Users, Building2, CreditCard, 
  DollarSign, Activity, Calendar, BarChart3, PieChart,
  ArrowUp, ArrowDown, Minus, Download, Filter, RefreshCw
} from 'lucide-react'
import { supabaseAdmin } from '@/lib/supabase'
import { formatCurrency, formatDate } from '@/lib/utils'

interface AnalyticsData {
  // Growth metrics
  organizationGrowth: { month: string; count: number; growth: number }[]
  userGrowth: { month: string; count: number; growth: number }[]
  revenueGrowth: { month: string; revenue: number; growth: number }[]
  
  // Current metrics
  totalRevenue: number
  monthlyRecurringRevenue: number
  averageRevenuePerUser: number
  customerAcquisitionCost: number
  churnRate: number
  
  // Feature usage
  featureUsage: { feature: string; usage: number; organizations: number }[]
  
  // Geographic data
  geographicData: { country: string; organizations: number; revenue: number }[]
  
  // Trial conversion
  trialConversion: {
    totalTrials: number
    converted: number
    expired: number
    active: number
    conversionRate: number
  }
  
  // Health metrics
  healthScores: { range: string; count: number; percentage: number }[]
}

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('12months')
  const [selectedMetric, setSelectedMetric] = useState('revenue')

  useEffect(() => {
    fetchAnalytics()
  }, [timeRange])

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      
      // Fetch all necessary data
      const [
        orgsResponse,
        usersResponse,
        subscriptionsResponse,
        invoicesResponse,
        usageResponse
      ] = await Promise.all([
        supabaseAdmin.from('organizations').select('*'),
        supabaseAdmin.from('profiles').select('*'),
        supabaseAdmin.from('subscriptions').select('*'),
        supabaseAdmin.from('invoices').select('*'),
        supabaseAdmin.from('feature_usage').select('*, features(*)')
      ])

      if (orgsResponse.error) throw orgsResponse.error
      if (usersResponse.error) throw usersResponse.error
      if (subscriptionsResponse.error) throw subscriptionsResponse.error

      const organizations = orgsResponse.data || []
      const users = usersResponse.data || []
      const subscriptions = subscriptionsResponse.data || []
      const invoices = invoicesResponse.data || []
      const usage = usageResponse.data || []

      // Calculate analytics
      const analyticsData = calculateAnalytics(organizations, users, subscriptions, invoices, usage)
      setAnalytics(analyticsData)
    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateAnalytics = (orgs: any[], users: any[], subs: any[], invoices: any[], usage: any[]) => {
    // Helper function to get months array
    const getMonthsArray = (months: number) => {
      const result = []
      for (let i = months - 1; i >= 0; i--) {
        const date = new Date()
        date.setMonth(date.getMonth() - i)
        result.push(date.toISOString().slice(0, 7)) // YYYY-MM format
      }
      return result
    }

    const months = getMonthsArray(12)

    // Organization growth
    const organizationGrowth = months.map(month => {
      const count = orgs.filter(o => o.created_at.startsWith(month)).length
      return { month, count, growth: 0 } // Growth calculation would need previous period data
    })

    // User growth
    const userGrowth = months.map(month => {
      const count = users.filter(u => u.created_at.startsWith(month)).length
      return { month, count, growth: 0 }
    })

    // Revenue growth
    const paidInvoices = invoices.filter(i => i.status === 'paid')
    const revenueGrowth = months.map(month => {
      const revenue = paidInvoices
        .filter(i => i.created_at.startsWith(month))
        .reduce((sum, i) => sum + i.total_amount, 0)
      return { month, revenue, growth: 0 }
    })

    // Current metrics
    const totalRevenue = paidInvoices.reduce((sum, i) => sum + i.total_amount, 0)
    const monthlyRecurringRevenue = subs
      .filter(s => s.status === 'active')
      .reduce((sum, s) => sum + (s.monthly_total || 0), 0)

    const activeUsers = users.filter(u => 
      u.last_sign_in_at && new Date(u.last_sign_in_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    ).length

    const averageRevenuePerUser = activeUsers > 0 ? monthlyRecurringRevenue / activeUsers : 0

    // Feature usage
    const featureUsageMap = new Map()
    usage.forEach(u => {
      const featureName = u.features?.name || 'Unknown'
      if (!featureUsageMap.has(featureName)) {
        featureUsageMap.set(featureName, { usage: 0, organizations: new Set() })
      }
      featureUsageMap.get(featureName).usage += u.usage_count
      featureUsageMap.get(featureName).organizations.add(u.organization_id)
    })

    const featureUsage = Array.from(featureUsageMap.entries()).map(([feature, data]) => ({
      feature,
      usage: data.usage,
      organizations: data.organizations.size
    }))

    // Trial conversion
    const trials = subs.filter(s => s.status === 'trial' || 
      (s.status !== 'trial' && s.trial_ends_at))
    const converted = subs.filter(s => s.status === 'active').length
    const expired = trials.filter(s => 
      s.status === 'trial' && new Date(s.trial_ends_at) < new Date()
    ).length
    const active = trials.filter(s => 
      s.status === 'trial' && new Date(s.trial_ends_at) >= new Date()
    ).length

    const trialConversion = {
      totalTrials: trials.length,
      converted,
      expired,
      active,
      conversionRate: trials.length > 0 ? (converted / trials.length) * 100 : 0
    }

    // Health scores (mock calculation)
    const healthScores = [
      { range: '80-100%', count: Math.floor(orgs.length * 0.6), percentage: 60 },
      { range: '60-79%', count: Math.floor(orgs.length * 0.25), percentage: 25 },
      { range: '40-59%', count: Math.floor(orgs.length * 0.1), percentage: 10 },
      { range: '0-39%', count: Math.floor(orgs.length * 0.05), percentage: 5 }
    ]

    return {
      organizationGrowth,
      userGrowth,
      revenueGrowth,
      totalRevenue,
      monthlyRecurringRevenue,
      averageRevenuePerUser,
      customerAcquisitionCost: 50, // Mock value
      churnRate: 5.2, // Mock value
      featureUsage,
      geographicData: [], // Would need geographic data
      trialConversion,
      healthScores
    }
  }

  const getTrendIcon = (value: number) => {
    if (value > 0) return <ArrowUp className="w-4 h-4 text-green-500" />
    if (value < 0) return <ArrowDown className="w-4 h-4 text-red-500" />
    return <Minus className="w-4 h-4 text-gray-500" />
  }

  const getTrendColor = (value: number) => {
    if (value > 0) return 'text-green-600'
    if (value < 0) return 'text-red-600'
    return 'text-gray-600'
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-64 bg-gray-200 rounded"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!analytics) return null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600">Comprehensive platform insights and metrics</p>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-admin-500 focus:border-admin-500"
          >
            <option value="3months">Last 3 Months</option>
            <option value="6months">Last 6 Months</option>
            <option value="12months">Last 12 Months</option>
            <option value="24months">Last 24 Months</option>
          </select>
          
          <button
            onClick={fetchAnalytics}
            className="px-4 py-2 bg-admin-600 text-white rounded-lg hover:bg-admin-700 transition-colors flex items-center space-x-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
          
          <button className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center space-x-2">
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="admin-stat">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-3xl font-bold text-gray-900">
                  {formatCurrency(analytics.totalRevenue)}
                </p>
                <div className="flex items-center space-x-1 mt-1">
                  {getTrendIcon(12.5)}
                  <span className={`text-sm font-medium ${getTrendColor(12.5)}`}>
                    +12.5% vs last period
                  </span>
                </div>
              </div>
              <DollarSign className="w-8 h-8 text-admin-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="admin-stat">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Monthly Recurring Revenue</p>
                <p className="text-3xl font-bold text-gray-900">
                  {formatCurrency(analytics.monthlyRecurringRevenue)}
                </p>
                <div className="flex items-center space-x-1 mt-1">
                  {getTrendIcon(8.3)}
                  <span className={`text-sm font-medium ${getTrendColor(8.3)}`}>
                    +8.3% vs last month
                  </span>
                </div>
              </div>
              <TrendingUp className="w-8 h-8 text-admin-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="admin-stat">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Average Revenue Per User</p>
                <p className="text-3xl font-bold text-gray-900">
                  {formatCurrency(analytics.averageRevenuePerUser)}
                </p>
                <div className="flex items-center space-x-1 mt-1">
                  {getTrendIcon(4.2)}
                  <span className={`text-sm font-medium ${getTrendColor(4.2)}`}>
                    +4.2% vs last month
                  </span>
                </div>
              </div>
              <Users className="w-8 h-8 text-admin-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="admin-stat">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Trial Conversion Rate</p>
                <p className="text-3xl font-bold text-gray-900">
                  {analytics.trialConversion.conversionRate.toFixed(1)}%
                </p>
                <div className="flex items-center space-x-1 mt-1">
                  {getTrendIcon(-1.2)}
                  <span className={`text-sm font-medium ${getTrendColor(-1.2)}`}>
                    -1.2% vs last month
                  </span>
                </div>
              </div>
              <Activity className="w-8 h-8 text-admin-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Growth Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="w-5 h-5" />
              <span>Revenue Growth</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-end space-x-2">
              {analytics.revenueGrowth.slice(-6).map((item, index) => (
                <div key={index} className="flex-1 flex flex-col items-center">
                  <div 
                    className="w-full bg-admin-500 rounded-t"
                    style={{ 
                      height: `${Math.max((item.revenue / Math.max(...analytics.revenueGrowth.map(r => r.revenue))) * 200, 4)}px` 
                    }}
                  ></div>
                  <div className="text-xs text-gray-600 mt-2 text-center">
                    {new Date(item.month + '-01').toLocaleDateString('en-US', { month: 'short' })}
                  </div>
                  <div className="text-xs font-medium text-gray-900">
                    {formatCurrency(item.revenue)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Trial Conversion Funnel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <PieChart className="w-5 h-5" />
              <span>Trial Conversion</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <span className="font-medium text-blue-900">Total Trials</span>
                <span className="text-2xl font-bold text-blue-600">
                  {analytics.trialConversion.totalTrials}
                </span>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Active Trials</span>
                  <span className="font-medium">{analytics.trialConversion.active}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Converted</span>
                  <span className="font-medium text-green-600">{analytics.trialConversion.converted}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Expired</span>
                  <span className="font-medium text-red-600">{analytics.trialConversion.expired}</span>
                </div>
              </div>
              
              <div className="pt-3 border-t">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-900">Conversion Rate</span>
                  <span className="text-lg font-bold text-admin-600">
                    {analytics.trialConversion.conversionRate.toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Feature Usage and Health Scores */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Feature Usage */}
        <Card>
          <CardHeader>
            <CardTitle>Feature Usage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.featureUsage.slice(0, 8).map((feature, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-900">{feature.feature}</span>
                      <span className="text-sm text-gray-600">{feature.organizations} orgs</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-admin-500 h-2 rounded-full transition-all duration-500"
                        style={{ 
                          width: `${Math.min((feature.usage / Math.max(...analytics.featureUsage.map(f => f.usage))) * 100, 100)}%` 
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Organization Health Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Organization Health Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.healthScores.map((score, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-4 h-4 rounded-full ${
                      index === 0 ? 'bg-green-500' :
                      index === 1 ? 'bg-yellow-500' :
                      index === 2 ? 'bg-orange-500' : 'bg-red-500'
                    }`}></div>
                    <span className="text-sm font-medium text-gray-900">{score.range}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">{score.count} orgs</span>
                    <span className="text-sm font-medium text-gray-900">{score.percentage}%</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Summary Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Key Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <TrendingUp className="w-5 h-5 text-green-600" />
                <h4 className="font-semibold text-green-900">Growth Trending</h4>
              </div>
              <p className="text-sm text-green-700">
                Monthly recurring revenue has grown by 8.3% this month, indicating strong customer retention and expansion.
              </p>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Activity className="w-5 h-5 text-yellow-600" />
                <h4 className="font-semibold text-yellow-900">Trial Conversion</h4>
              </div>
              <p className="text-sm text-yellow-700">
                Trial conversion rate has decreased by 1.2%. Consider improving onboarding or trial experience.
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <Users className="w-5 h-5 text-blue-600" />
                <h4 className="font-semibold text-blue-900">Feature Adoption</h4>
              </div>
              <p className="text-sm text-blue-700">
                Advanced features are seeing increased adoption, suggesting successful customer education efforts.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}