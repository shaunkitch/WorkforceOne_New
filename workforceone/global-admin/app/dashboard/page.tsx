'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Building2, Users, CreditCard, AlertTriangle, TrendingUp, 
  DollarSign, Activity, Globe, Clock, Shield, Zap, Database
} from 'lucide-react'
import { supabaseAdmin } from '@/lib/supabase'
import { formatCurrency, formatDateTime, getHealthStatus } from '@/lib/utils'

interface DashboardStats {
  totalOrganizations: number
  totalUsers: number
  activeSubscriptions: number
  trialOrganizations: number
  expiredTrials: number
  monthlyRevenue: number
  yearlyRevenue: number
  healthScore: number
  systemUptime: number
  recentActivity: any[]
  criticalAlerts: any[]
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchDashboardStats()
  }, [])

  const fetchDashboardStats = async () => {
    try {
      setLoading(true)
      
      // Fetch comprehensive dashboard statistics
      const [
        orgsResponse,
        usersResponse,
        subscriptionsResponse,
        revenueResponse
      ] = await Promise.all([
        supabaseAdmin.from('organizations').select('*'),
        supabaseAdmin.from('profiles').select('*'),
        supabaseAdmin.from('subscriptions').select('*'),
        supabaseAdmin.from('invoices').select('total_amount, status, created_at')
      ])

      if (orgsResponse.error) throw orgsResponse.error
      if (usersResponse.error) throw usersResponse.error
      if (subscriptionsResponse.error) throw subscriptionsResponse.error

      const organizations = orgsResponse.data || []
      const users = usersResponse.data || []
      const subscriptions = subscriptionsResponse.data || []
      const invoices = revenueResponse.data || []

      // Calculate statistics
      const activeSubscriptions = subscriptions.filter(s => s.status === 'active').length
      const trialOrganizations = subscriptions.filter(s => s.status === 'trial').length
      const expiredTrials = subscriptions.filter(s => 
        s.status === 'trial' && new Date(s.trial_ends_at) < new Date()
      ).length

      const paidInvoices = invoices.filter(i => i.status === 'paid')
      const monthlyRevenue = paidInvoices
        .filter(i => new Date(i.created_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
        .reduce((sum, i) => sum + i.total_amount, 0)
      
      const yearlyRevenue = paidInvoices
        .filter(i => new Date(i.created_at) > new Date(Date.now() - 365 * 24 * 60 * 60 * 1000))
        .reduce((sum, i) => sum + i.total_amount, 0)

      // Calculate health score (simplified)
      const healthScore = Math.round(
        (activeSubscriptions / Math.max(organizations.length, 1)) * 100
      )

      // Recent activity (mock data - in production, implement activity tracking)
      const recentActivity = [
        {
          type: 'new_organization',
          description: 'New organization "TechCorp Inc" registered',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
          severity: 'info'
        },
        {
          type: 'subscription_upgrade',
          description: 'Organization "RetailChain" upgraded subscription',
          timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000),
          severity: 'success'
        },
        {
          type: 'trial_expiring',
          description: '3 organizations have trials expiring within 24 hours',
          timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000),
          severity: 'warning'
        }
      ]

      // Critical alerts
      const criticalAlerts = [
        ...(expiredTrials > 5 ? [{
          title: 'High Trial Expiration Rate',
          description: `${expiredTrials} organizations have expired trials`,
          severity: 'high'
        }] : []),
        ...(healthScore < 70 ? [{
          title: 'Low System Health Score',
          description: `Current health score is ${healthScore}%`,
          severity: 'medium'
        }] : [])
      ]

      setStats({
        totalOrganizations: organizations.length,
        totalUsers: users.length,
        activeSubscriptions,
        trialOrganizations,
        expiredTrials,
        monthlyRevenue,
        yearlyRevenue,
        healthScore,
        systemUptime: 99.9, // Mock uptime
        recentActivity,
        criticalAlerts
      })
    } catch (err) {
      console.error('Error fetching dashboard stats:', err)
      setError('Failed to load dashboard statistics')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-gray-200 h-32 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
        {error}
      </div>
    )
  }

  if (!stats) return null

  const healthStatus = getHealthStatus(stats.healthScore)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Global Dashboard</h1>
          <p className="text-gray-600">WorkforceOne platform overview and monitoring</p>
        </div>
        <div className="flex items-center space-x-3">
          <button 
            onClick={fetchDashboardStats}
            className="px-4 py-2 bg-admin-600 text-white rounded-lg hover:bg-admin-700 transition-colors"
          >
            Refresh Data
          </button>
        </div>
      </div>

      {/* Critical Alerts */}
      {stats.criticalAlerts.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-3">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <h3 className="font-semibold text-red-800">Critical Alerts</h3>
          </div>
          <div className="space-y-2">
            {stats.criticalAlerts.map((alert, index) => (
              <div key={index} className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-red-700">{alert.title}</p>
                  <p className="text-sm text-red-600">{alert.description}</p>
                </div>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  alert.severity === 'high' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {alert.severity}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="admin-stat">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Organizations</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalOrganizations}</p>
                <p className="text-sm text-green-600">↗ +12% this month</p>
              </div>
              <Building2 className="w-8 h-8 text-admin-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="admin-stat">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Users</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalUsers}</p>
                <p className="text-sm text-green-600">↗ +8% this month</p>
              </div>
              <Users className="w-8 h-8 text-admin-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="admin-stat">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Subscriptions</p>
                <p className="text-3xl font-bold text-gray-900">{stats.activeSubscriptions}</p>
                <p className="text-sm text-blue-600">{stats.trialOrganizations} on trial</p>
              </div>
              <CreditCard className="w-8 h-8 text-admin-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="admin-stat">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Monthly Revenue</p>
                <p className="text-3xl font-bold text-gray-900">{formatCurrency(stats.monthlyRevenue)}</p>
                <p className="text-sm text-green-600">↗ +15% vs last month</p>
              </div>
              <DollarSign className="w-8 h-8 text-admin-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Health and System Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Activity className="w-5 h-5" />
              <span>System Health</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Overall Health</span>
                <span className={`font-semibold ${healthStatus.color}`}>
                  {stats.healthScore}% {healthStatus.label}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className={`h-3 rounded-full transition-all duration-500 ${
                    stats.healthScore >= 80 ? 'bg-green-500' : 
                    stats.healthScore >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${stats.healthScore}%` }}
                ></div>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Uptime</span>
                <span className="font-medium text-green-600">{stats.systemUptime}%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="w-5 h-5" />
              <span>Recent Activity</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.recentActivity.map((activity, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <div className={`w-2 h-2 rounded-full mt-2 ${
                    activity.severity === 'success' ? 'bg-green-500' :
                    activity.severity === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
                  }`}></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900">{activity.description}</p>
                    <p className="text-xs text-gray-500">{formatDateTime(activity.timestamp)}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5" />
              <span>Quick Actions</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <button className="w-full text-left px-3 py-2 bg-yellow-50 border border-yellow-200 rounded-lg hover:bg-yellow-100 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-yellow-800">Expired Trials</span>
                  <span className="text-xs bg-yellow-200 text-yellow-800 px-2 py-1 rounded">
                    {stats.expiredTrials}
                  </span>
                </div>
                <p className="text-xs text-yellow-600 mt-1">Review and take action</p>
              </button>

              <button className="w-full text-left px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-blue-800">System Backup</span>
                  <Clock className="w-4 h-4 text-blue-600" />
                </div>
                <p className="text-xs text-blue-600 mt-1">Last: 2 hours ago</p>
              </button>

              <button className="w-full text-left px-3 py-2 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-green-800">Revenue Report</span>
                  <TrendingUp className="w-4 h-4 text-green-600" />
                </div>
                <p className="text-xs text-green-600 mt-1">Generate monthly report</p>
              </button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <DollarSign className="w-5 h-5" />
            <span>Revenue Overview</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.monthlyRevenue)}</p>
              <p className="text-sm text-gray-600">This Month</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.yearlyRevenue)}</p>
              <p className="text-sm text-gray-600">This Year</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(stats.monthlyRevenue * 12)}
              </p>
              <p className="text-sm text-gray-600">Projected Annual</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}