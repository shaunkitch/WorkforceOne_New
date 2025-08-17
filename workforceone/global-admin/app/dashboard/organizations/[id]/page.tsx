'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Building2, Users, Calendar, CreditCard, AlertTriangle, 
  Clock, CheckCircle, XCircle, ArrowLeft, Edit, Trash2,
  Mail, Phone, Globe, MapPin, Activity, TrendingUp,
  Shield, Database, Settings, Download, RefreshCw
} from 'lucide-react'
import { supabaseAdmin } from '@/lib/supabase'
import { formatDate, formatDateTime, formatCurrency, getHealthStatus, calculateHealthScore } from '@/lib/utils'

interface OrganizationDetail {
  id: string
  name: string
  email: string
  phone?: string
  website?: string
  address?: any
  created_at: string
  updated_at: string
  stripe_customer_id?: string
  subscription?: any
  subscription_features?: any[]
  profiles?: any[]
  features?: any[]
  invoices?: any[]
  activity_log?: any[]
}

export default function OrganizationDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [organization, setOrganization] = useState<OrganizationDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    if (params.id) {
      fetchOrganizationDetail(params.id as string)
    }
  }, [params.id])

  const fetchOrganizationDetail = async (orgId: string) => {
    try {
      setLoading(true)
      
      const { data: orgData, error: orgError } = await supabaseAdmin
        .from('organizations')
        .select(`
          *,
          subscriptions (*),
          profiles (*),
          invoices (*),
          subscription_features (
            *,
            features (*)
          )
        `)
        .eq('id', orgId)
        .single()

      if (orgError) throw orgError
      
      setOrganization(orgData)
    } catch (error) {
      console.error('Error fetching organization detail:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleExtendTrial = async () => {
    if (!organization) return
    
    setActionLoading(true)
    try {
      const { data, error } = await supabaseAdmin.rpc('extend_trial', {
        org_id: organization.id
      })
      
      if (error) throw error
      
      if (data.success) {
        alert('Trial extended successfully!')
        fetchOrganizationDetail(organization.id)
      } else {
        alert(data.error || 'Failed to extend trial')
      }
    } catch (error) {
      console.error('Error extending trial:', error)
      alert('Failed to extend trial')
    } finally {
      setActionLoading(false)
    }
  }

  const handleCancelSubscription = async () => {
    if (!organization || !confirm('Are you sure you want to cancel this subscription?')) return
    
    setActionLoading(true)
    try {
      const { data, error } = await supabaseAdmin.rpc('cancel_subscription', {
        org_id: organization.id,
        immediate: false
      })
      
      if (error) throw error
      
      if (data.success) {
        alert('Subscription canceled successfully!')
        fetchOrganizationDetail(organization.id)
      }
    } catch (error) {
      console.error('Error canceling subscription:', error)
      alert('Failed to cancel subscription')
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="h-64 bg-gray-200 rounded"></div>
              <div className="h-48 bg-gray-200 rounded"></div>
            </div>
            <div className="space-y-6">
              <div className="h-32 bg-gray-200 rounded"></div>
              <div className="h-48 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!organization) {
    return (
      <div className="text-center py-12">
        <Building2 className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Organization not found</h3>
        <Link
          href="/dashboard/organizations"
          className="mt-4 inline-flex items-center px-4 py-2 bg-admin-600 text-white rounded-lg hover:bg-admin-700"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Organizations
        </Link>
      </div>
    )
  }

  const subscription = organization.subscription
  const profiles = organization.profiles || []
  const features = organization.subscription_features?.map(sf => sf.features) || []
  const invoices = organization.invoices || []

  const activeUsers = profiles.filter(p => 
    p.last_sign_in_at && new Date(p.last_sign_in_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  ).length

  const healthScore = calculateHealthScore({
    subscription_status: subscription?.status,
    active_users: activeUsers,
    last_activity: profiles.map(p => p.last_sign_in_at).filter(Boolean).sort().pop(),
    support_tickets_open: 0
  })

  const healthStatus = getHealthStatus(healthScore)
  const trialExpired = subscription?.trial_ends_at && new Date(subscription.trial_ends_at) < new Date()

  const tabs = [
    { id: 'overview', name: 'Overview', icon: Building2 },
    { id: 'users', name: 'Users', icon: Users },
    { id: 'subscription', name: 'Subscription', icon: CreditCard },
    { id: 'billing', name: 'Billing', icon: Activity },
    { id: 'settings', name: 'Settings', icon: Settings },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            href="/dashboard/organizations"
            className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{organization.name}</h1>
            <p className="text-gray-600">{organization.email}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={() => fetchOrganizationDetail(organization.id)}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center space-x-2"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
          
          {subscription?.status === 'trial' && !trialExpired && (
            <button
              onClick={handleExtendTrial}
              disabled={actionLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              Extend Trial
            </button>
          )}
          
          {subscription?.status === 'active' && (
            <button
              onClick={handleCancelSubscription}
              disabled={actionLoading}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
            >
              Cancel Subscription
            </button>
          )}
        </div>
      </div>

      {/* Health Status Alert */}
      {healthScore < 70 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-yellow-600" />
            <h3 className="font-medium text-yellow-800">Health Score: {healthScore}%</h3>
          </div>
          <p className="text-sm text-yellow-700 mt-1">
            This organization requires attention. Consider reaching out for support.
          </p>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? 'border-admin-500 text-admin-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.name}</span>
              </button>
            )
          })}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Organization Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Name</label>
                    <p className="text-sm text-gray-900">{organization.name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Email</label>
                    <p className="text-sm text-gray-900">{organization.email}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Created</label>
                    <p className="text-sm text-gray-900">{formatDate(organization.created_at)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Last Updated</label>
                    <p className="text-sm text-gray-900">{formatDate(organization.updated_at)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Active Features</CardTitle>
              </CardHeader>
              <CardContent>
                {features.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {features.map((feature) => (
                      <div
                        key={feature.id}
                        className="flex items-center justify-between p-2 bg-green-50 rounded-lg"
                      >
                        <span className="text-sm text-green-800">{feature.name}</span>
                        <span className="text-xs text-green-600">
                          {formatCurrency(feature.base_price)}/{feature.billing_unit}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No premium features active</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Health Score</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className={`text-4xl font-bold ${healthStatus.color} mb-2`}>
                    {healthScore}%
                  </div>
                  <div className={`text-lg font-medium ${healthStatus.color}`}>
                    {healthStatus.label}
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3 mt-4">
                    <div 
                      className={`h-3 rounded-full ${
                        healthScore >= 80 ? 'bg-green-500' : 
                        healthScore >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${healthScore}%` }}
                    ></div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total Users</span>
                  <span className="text-sm font-medium">{profiles.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Active Users</span>
                  <span className="text-sm font-medium">{activeUsers}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Monthly Revenue</span>
                  <span className="text-sm font-medium">{formatCurrency(subscription?.monthly_total || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Status</span>
                  <span className="text-sm font-medium">
                    {subscription?.status ? subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1) : 'No Subscription'}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {activeTab === 'users' && (
        <Card>
          <CardHeader>
            <CardTitle>Users ({profiles.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Last Sign In</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {profiles.map((profile) => (
                    <tr key={profile.id}>
                      <td className="px-4 py-2">
                        <div>
                          <div className="font-medium text-gray-900">
                            {profile.first_name} {profile.last_name}
                          </div>
                          <div className="text-sm text-gray-500">{profile.email}</div>
                        </div>
                      </td>
                      <td className="px-4 py-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          profile.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                          profile.role === 'manager' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {profile.role}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-500">
                        {profile.last_sign_in_at ? formatDateTime(profile.last_sign_in_at) : 'Never'}
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-500">
                        {formatDate(profile.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'subscription' && subscription && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Subscription Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Status</label>
                  <p className="text-sm text-gray-900">{subscription.status}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Billing Period</label>
                  <p className="text-sm text-gray-900">{subscription.billing_period}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">User Count</label>
                  <p className="text-sm text-gray-900">{subscription.user_count}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Monthly Total</label>
                  <p className="text-sm text-gray-900">{formatCurrency(subscription.monthly_total)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Trial Ends</label>
                  <p className="text-sm text-gray-900">
                    {subscription.trial_ends_at ? formatDateTime(subscription.trial_ends_at) : 'N/A'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Current Period End</label>
                  <p className="text-sm text-gray-900">
                    {subscription.current_period_end ? formatDateTime(subscription.current_period_end) : 'N/A'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Billing Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Stripe Customer ID</span>
                  <span className="text-sm font-mono text-gray-900">
                    {organization.stripe_customer_id || 'Not set'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Payment Method</span>
                  <span className="text-sm text-gray-900">
                    {subscription.stripe_payment_method_id ? 'Connected' : 'Not connected'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'billing' && (
        <Card>
          <CardHeader>
            <CardTitle>Billing History</CardTitle>
          </CardHeader>
          <CardContent>
            {invoices.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Invoice</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {invoices.map((invoice) => (
                      <tr key={invoice.id}>
                        <td className="px-4 py-2 text-sm font-medium text-gray-900">
                          {invoice.invoice_number}
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-900">
                          {formatCurrency(invoice.total_amount)}
                        </td>
                        <td className="px-4 py-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            invoice.status === 'paid' ? 'bg-green-100 text-green-800' :
                            invoice.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {invoice.status}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-sm text-gray-500">
                          {formatDate(invoice.created_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-gray-500">No billing history available</p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}