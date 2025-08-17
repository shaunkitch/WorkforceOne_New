'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Building2, Users, Calendar, CreditCard, AlertTriangle, 
  Clock, CheckCircle, XCircle, Plus, Search, Filter,
  Eye, Edit, Trash2, MoreVertical, TrendingUp, TrendingDown,
  Shield, Mail, Phone, Globe, MapPin
} from 'lucide-react'
import { supabaseAdmin } from '@/lib/supabase'
import { formatDate, formatCurrency, getHealthStatus, calculateHealthScore } from '@/lib/utils'

interface Organization {
  id: string
  name: string
  email: string
  phone?: string
  website?: string
  address?: any
  created_at: string
  updated_at: string
  stripe_customer_id?: string
  
  // Calculated fields
  subscription_status: string
  trial_ends_at?: string
  monthly_total: number
  user_count: number
  active_users: number
  last_activity?: string
  health_score: number
  support_tickets_open: number
}

export default function OrganizationsPage() {
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedOrgs, setSelectedOrgs] = useState<string[]>([])

  useEffect(() => {
    fetchOrganizations()
  }, [])

  const fetchOrganizations = async () => {
    try {
      setLoading(true)
      
      // Fetch organizations with related data
      const { data: orgsData, error: orgsError } = await supabaseAdmin
        .from('organizations')
        .select(`
          *,
          subscriptions (
            status,
            trial_ends_at,
            monthly_total,
            user_count,
            updated_at
          ),
          profiles (
            id,
            created_at,
            last_sign_in_at
          )
        `)
        .order('created_at', { ascending: false })

      if (orgsError) throw orgsError

      // Transform and calculate additional metrics
      const transformedOrgs = orgsData.map(org => {
        const subscription = org.subscriptions?.[0]
        const profiles = org.profiles || []
        
        // Calculate active users (signed in within last 30 days)
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        const activeUsers = profiles.filter((p: any) => 
          p.last_sign_in_at && new Date(p.last_sign_in_at) > thirtyDaysAgo
        ).length

        // Get last activity
        const lastActivity = profiles
          .map((p: any) => p.last_sign_in_at)
          .filter(Boolean)
          .sort()
          .pop()

        const orgData = {
          ...org,
          subscription_status: subscription?.status || 'none',
          trial_ends_at: subscription?.trial_ends_at,
          monthly_total: subscription?.monthly_total || 0,
          user_count: subscription?.user_count || profiles.length,
          active_users: activeUsers,
          last_activity: lastActivity,
          support_tickets_open: 0, // Would be calculated from support system
        }

        return {
          ...orgData,
          health_score: calculateHealthScore(orgData)
        }
      })

      setOrganizations(transformedOrgs)
    } catch (error) {
      console.error('Error fetching organizations:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredOrganizations = organizations.filter(org => {
    const matchesSearch = org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         org.email.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || org.subscription_status === statusFilter
    
    return matchesSearch && matchesStatus
  })

  const handleExtendTrial = async (orgId: string) => {
    try {
      const { data, error } = await supabaseAdmin.rpc('extend_trial', {
        org_id: orgId
      })
      
      if (error) throw error
      
      if (data.success) {
        alert('Trial extended successfully!')
        fetchOrganizations()
      } else {
        alert(data.error || 'Failed to extend trial')
      }
    } catch (error) {
      console.error('Error extending trial:', error)
      alert('Failed to extend trial')
    }
  }

  const getStatusBadge = (status: string, trialEnd?: string) => {
    const isExpired = trialEnd && new Date(trialEnd) < new Date()
    
    switch (status) {
      case 'active':
        return <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">Active</span>
      case 'trial':
        return <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          isExpired ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
        }`}>
          {isExpired ? 'Trial Expired' : 'Trial'}
        </span>
      case 'past_due':
        return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">Past Due</span>
      case 'canceled':
        return <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">Canceled</span>
      default:
        return <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">No Subscription</span>
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Organizations</h1>
          <p className="text-gray-600">Monitor and manage all customer organizations</p>
        </div>
        <div className="flex items-center space-x-3">
          <Link
            href="/dashboard/organizations/create"
            className="px-4 py-2 bg-admin-600 text-white rounded-lg hover:bg-admin-700 transition-colors flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>New Organization</span>
          </Link>
        </div>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search organizations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-admin-500 focus:border-admin-500 w-80"
                />
              </div>
              
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-admin-500 focus:border-admin-500"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="trial">Trial</option>
                <option value="past_due">Past Due</option>
                <option value="canceled">Canceled</option>
                <option value="none">No Subscription</option>
              </select>
            </div>
            
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <span>Total: {filteredOrganizations.length}</span>
              <span>•</span>
              <span>Active: {filteredOrganizations.filter(o => o.subscription_status === 'active').length}</span>
              <span>•</span>
              <span>Trial: {filteredOrganizations.filter(o => o.subscription_status === 'trial').length}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Organizations Table */}
      <Card>
        <CardHeader>
          <CardTitle>Organizations List</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Organization
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Users
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Revenue
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Health
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Activity
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredOrganizations.map((org) => {
                  const healthStatus = getHealthStatus(org.health_score)
                  const trialExpired = org.trial_ends_at && new Date(org.trial_ends_at) < new Date()
                  
                  return (
                    <tr key={org.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-admin-100 flex items-center justify-center">
                              <Building2 className="w-5 h-5 text-admin-600" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{org.name}</div>
                            <div className="text-sm text-gray-500">{org.email}</div>
                          </div>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="space-y-1">
                          {getStatusBadge(org.subscription_status, org.trial_ends_at)}
                          {org.trial_ends_at && (
                            <div className="text-xs text-gray-500">
                              {trialExpired ? 'Expired' : 'Ends'}: {formatDate(org.trial_ends_at)}
                            </div>
                          )}
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{org.user_count} total</div>
                        <div className="text-sm text-gray-500">{org.active_users} active</div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {formatCurrency(org.monthly_total)}/mo
                        </div>
                        <div className="text-sm text-gray-500">
                          {formatCurrency(org.monthly_total * 12)}/yr
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <div className={`w-3 h-3 rounded-full ${
                            org.health_score >= 80 ? 'bg-green-500' :
                            org.health_score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}></div>
                          <span className={`text-sm font-medium ${healthStatus.color}`}>
                            {org.health_score}%
                          </span>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {org.last_activity ? formatDate(org.last_activity) : 'Never'}
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <Link
                            href={`/dashboard/organizations/${org.id}`}
                            className="text-admin-600 hover:text-admin-900"
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                          
                          {org.subscription_status === 'trial' && !trialExpired && (
                            <button
                              onClick={() => handleExtendTrial(org.id)}
                              className="text-blue-600 hover:text-blue-900"
                              title="Extend Trial"
                            >
                              <Clock className="w-4 h-4" />
                            </button>
                          )}
                          
                          <button className="text-gray-400 hover:text-gray-600">
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          
          {filteredOrganizations.length === 0 && (
            <div className="text-center py-12">
              <Building2 className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No organizations found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm || statusFilter !== 'all' 
                  ? 'Try adjusting your search or filter criteria.'
                  : 'Get started by creating a new organization.'
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}