'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

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
}

const featureDescriptions = {
  dashboard: 'Main dashboard access',
  time_tracking: 'Time tracking and timesheets',
  attendance: 'Clock in/out and attendance tracking',
  maps: 'Daily visits and location-based features',
  teams: 'Team management and organization',
  projects: 'Project management tools',
  tasks: 'Task assignment and tracking',
  forms: 'Custom forms and data collection',
  leave: 'Leave requests and management',
  outlets: 'Outlet/location management',
  settings: 'Settings and configuration access',
  analytics: 'Analytics and insights',
  reports: 'Reporting tools',
  automation: 'Automated workflows',
  integrations: 'Third-party integrations'
}

export default function FeaturesPage() {
  const [featureFlags, setFeatureFlags] = useState<FeatureFlags | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [organization, setOrganization] = useState<any>(null)
  const [users, setUsers] = useState<any[]>([])
  const [loadingUsers, setLoadingUsers] = useState(false)
  const supabase = createClientComponentClient()

  useEffect(() => {
    fetchOrganizationFeatures()
    fetchUsers()
  }, [])

  const fetchOrganizationFeatures = async () => {
    try {
      // Get current user's profile to find organization
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single()

      if (!profile?.organization_id) return

      // Get organization with feature flags
      const { data: org, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', profile.organization_id)
        .single()

      if (error) throw error

      setOrganization(org)
      setFeatureFlags(org.feature_flags || {
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
        integrations: true
      })
    } catch (error) {
      console.error('Error fetching organization features:', error)
      toast.error('Failed to load feature settings')
    } finally {
      setLoading(false)
    }
  }

  const fetchUsers = async () => {
    setLoadingUsers(true)
    try {
      // Get current user's profile to find organization
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single()

      if (!profile?.organization_id) return

      // Get all users in the organization
      const { data: orgUsers, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, role, work_type, department')
        .eq('organization_id', profile.organization_id)
        .order('full_name')

      if (error) throw error

      setUsers(orgUsers || [])
      console.log('Fetched users:', orgUsers)
    } catch (error) {
      console.error('Error fetching users:', error)
      toast.error('Failed to load users')
    } finally {
      setLoadingUsers(false)
    }
  }

  const updateUserWorkType = async (userId: string, workType: string) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ work_type: workType })
        .eq('id', userId)

      if (error) throw error

      // Update local state
      setUsers(users.map(user => 
        user.id === userId ? { ...user, work_type: workType } : user
      ))

      toast.success('Work type updated successfully')
    } catch (error) {
      console.error('Error updating work type:', error)
      toast.error('Failed to update work type')
    }
  }

  const updateFeatureFlag = (feature: keyof FeatureFlags, enabled: boolean) => {
    if (!featureFlags) return
    
    setFeatureFlags({
      ...featureFlags,
      [feature]: enabled
    })
  }

  const saveFeatureFlags = async () => {
    if (!organization || !featureFlags) return

    setSaving(true)
    try {
      const { error } = await supabase
        .from('organizations')
        .update({ feature_flags: featureFlags })
        .eq('id', organization.id)

      if (error) throw error

      toast.success('Feature settings saved successfully')
    } catch (error) {
      console.error('Error saving feature flags:', error)
      toast.error('Failed to save feature settings')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3 mb-8"></div>
          <div className="space-y-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Feature Management</h1>
        <p className="text-gray-600 mt-2">
          Control which features are available to your organization's mobile app users.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Mobile App Features</CardTitle>
          <CardDescription>
            Toggle features on or off to customize your team's mobile experience.
            Changes will take effect immediately for all mobile app users.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {featureFlags && Object.entries(featureFlags).map(([feature, enabled]) => (
              <div key={feature} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                <div className="flex-1">
                  <Label htmlFor={feature} className="text-sm font-medium text-gray-900 capitalize">
                    {feature.replace(/_/g, ' ')}
                  </Label>
                  <p className="text-sm text-gray-500 mt-1">
                    {featureDescriptions[feature as keyof typeof featureDescriptions]}
                  </p>
                </div>
                <Switch
                  id={feature}
                  checked={enabled}
                  onCheckedChange={(checked) => updateFeatureFlag(feature as keyof FeatureFlags, checked)}
                  className="ml-4"
                />
              </div>
            ))}
          </div>

          <div className="flex justify-end mt-6 pt-6 border-t border-gray-200">
            <Button 
              onClick={saveFeatureFlags}
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Feature Impact</CardTitle>
          <CardDescription>
            Understanding how features affect the mobile app experience
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Essential Features</h4>
              <ul className="space-y-1 text-gray-600">
                <li>• <strong>Attendance:</strong> Core clock in/out functionality</li>
                <li>• <strong>Forms:</strong> Custom data collection</li>
                <li>• <strong>Dashboard:</strong> Main app interface</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Optional Features</h4>
              <ul className="space-y-1 text-gray-600">
                <li>• <strong>Maps:</strong> Daily visits and location tracking</li>
                <li>• <strong>Time Tracking:</strong> Detailed hour logging</li>
                <li>• <strong>Tasks:</strong> Task assignment and management</li>
                <li>• <strong>Leave:</strong> Leave request system</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Work Type Management</CardTitle>
          <CardDescription>
            Manage user work types to control Daily Visits access. Remote workers won't see Daily Visits even if the feature is enabled.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingUsers ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-pulse">Loading users...</div>
            </div>
          ) : (
            <div className="space-y-4">
              {users.map((user) => (
                <div key={user.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">{user.full_name}</span>
                      <Badge variant="secondary" className="text-xs">
                        {user.role}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-500">{user.email}</p>
                    {user.department && (
                      <p className="text-xs text-gray-400">{user.department}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor={`work-type-${user.id}`} className="text-sm font-medium sr-only">
                      Work Type for {user.full_name}
                    </Label>
                    <select
                      id={`work-type-${user.id}`}
                      value={user.work_type || 'field'}
                      onChange={(e) => updateUserWorkType(user.id, e.target.value)}
                      className="px-3 py-1 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="field">Field Worker</option>
                      <option value="remote">Remote Worker</option>
                      <option value="hybrid">Hybrid Worker</option>
                      <option value="office">Office Worker</option>
                    </select>
                  </div>
                </div>
              ))}
              
              {users.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No users found in your organization.
                </div>
              )}
            </div>
          )}

          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Work Type Effects</h4>
            <ul className="space-y-1 text-sm text-blue-700">
              <li>• <strong>Field Workers:</strong> See all features including Daily Visits</li>
              <li>• <strong>Remote Workers:</strong> Daily Visits automatically hidden</li>
              <li>• <strong>Hybrid Workers:</strong> See all features (can work both field and remote)</li>
              <li>• <strong>Office Workers:</strong> Daily Visits automatically hidden</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}