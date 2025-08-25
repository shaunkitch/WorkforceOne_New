'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Shield, Info, Users, Clock, Settings, Smartphone, Zap } from 'lucide-react'
import { toast } from 'sonner'
import { devLog } from '@/lib/utils/logger'

interface FeatureFlags {
  // === MOBILE APP PRODUCT TOGGLES (Main Controls) ===
  mobile_guard_product: boolean          // Enable entire Guard Management mobile experience
  mobile_workforce_product: boolean      // Enable entire Workforce Management mobile experience  
  mobile_time_product: boolean          // Enable entire Time Tracking mobile experience
  
  // === GUARD MANAGEMENT FEATURES ===
  guard_management: boolean
  mobile_security: boolean
  security_dashboard: boolean
  incident_reporting: boolean
  patrol_management: boolean
  qr_checkpoints: boolean
  guard_performance: boolean
  
  // === WORKFORCE MANAGEMENT FEATURES ===
  workforce_management: boolean
  teams: boolean
  projects: boolean
  tasks: boolean
  attendance: boolean
  leave: boolean
  
  // === TIME TRACKING FEATURES ===
  time_tracking: boolean
  timesheets: boolean
  time_reports: boolean
  
  // === CORE PLATFORM FEATURES ===
  dashboard: boolean
  maps: boolean
  forms: boolean
  outlets: boolean
  settings: boolean
  analytics: boolean
  reports: boolean
  automation: boolean
  integrations: boolean
}

const featureDescriptions = {
  // === MOBILE APP PRODUCT TOGGLES ===
  mobile_guard_product: 'Enable the complete Guard Management mobile application experience for security guards',
  mobile_workforce_product: 'Enable the complete Workforce Management mobile application experience for employees',
  mobile_time_product: 'Enable the complete Time Tracking mobile application experience for time logging',
  
  // === GUARD MANAGEMENT FEATURES ===
  guard_management: 'Complete security guard management system',
  mobile_security: 'Mobile security guard patrol features and QR scanning',
  security_dashboard: 'Web dashboard for security management and monitoring',
  incident_reporting: 'Security incident reporting and management',
  patrol_management: 'Guard patrol route planning and management',
  qr_checkpoints: 'QR code checkpoint system for patrols',
  guard_performance: 'Guard KPI tracking and performance analytics',
  
  // === WORKFORCE MANAGEMENT FEATURES ===
  workforce_management: 'Complete workforce management system',
  teams: 'Team management and organization structure',
  projects: 'Project management tools and assignment',
  tasks: 'Task assignment and progress tracking',
  attendance: 'Employee attendance and clock in/out tracking',
  leave: 'Leave requests and approval management',
  
  // === TIME TRACKING FEATURES ===
  time_tracking: 'Employee time tracking and logging',
  timesheets: 'Digital timesheets and time entry management',
  time_reports: 'Time tracking reports and analytics',
  
  // === CORE PLATFORM FEATURES ===
  dashboard: 'Main unified dashboard access',
  maps: 'Location-based features and daily visits tracking',
  forms: 'Custom forms and data collection tools',
  outlets: 'Outlet/location management for field operations',
  settings: 'System settings and configuration access',
  analytics: 'Advanced analytics and business insights',
  reports: 'Comprehensive reporting across all systems',
  automation: 'Automated workflows and business processes',
  integrations: 'Third-party system integrations and APIs'
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
        // === MOBILE APP PRODUCT TOGGLES (Master Controls) ===
        mobile_guard_product: true,       // Controls entire Guard mobile experience
        mobile_workforce_product: true,   // Controls entire Workforce mobile experience
        mobile_time_product: true,        // Controls entire Time mobile experience
        
        // === GUARD MANAGEMENT FEATURES ===
        guard_management: true,
        mobile_security: true,
        security_dashboard: true,
        incident_reporting: true,
        patrol_management: true,
        qr_checkpoints: true,
        guard_performance: true,
        
        // === WORKFORCE MANAGEMENT FEATURES ===
        workforce_management: true,
        teams: true,
        projects: true,
        tasks: true,
        attendance: true,
        leave: true,
        
        // === TIME TRACKING FEATURES ===
        time_tracking: true,
        timesheets: true,
        time_reports: true,
        
        // === CORE PLATFORM FEATURES ===
        dashboard: true,
        maps: true,
        forms: true,
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
      devLog('Fetched users:', orgUsers);
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

      <div className="space-y-6">
        {/* Mobile App Master Controls */}
        <Card className="border-indigo-200 bg-gradient-to-r from-indigo-50 to-purple-50 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <Smartphone className="h-6 w-6 text-indigo-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Mobile App Control Center</h3>
                <p className="text-sm text-indigo-700 font-medium">Master toggles for entire mobile application sections</p>
              </div>
            </CardTitle>
            <CardDescription>
              Control access to complete mobile application experiences. These are the main switches that enable or disable entire product sections in the mobile app for your remote workforce.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              {/* Guard Product Toggle */}
              <div className="p-6 bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl border-2 border-amber-200 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-100 rounded-lg">
                      <Shield className="h-5 w-5 text-amber-600" />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900">Guard Management</h4>
                      <p className="text-xs text-amber-700">Security Guards & Patrols</p>
                    </div>
                  </div>
                  <Switch
                    checked={featureFlags?.mobile_guard_product || false}
                    onCheckedChange={(checked) => updateFeatureFlag('mobile_guard_product', checked)}
                    className="ml-2"
                  />
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {featureDescriptions.mobile_guard_product}
                </p>
                <div className="mt-3 text-xs text-amber-700">
                  <strong>Includes:</strong> QR Scanning, Patrols, Incident Reporting, Check-ins
                </div>
              </div>

              {/* Workforce Product Toggle */}
              <div className="p-6 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl border-2 border-blue-200 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Users className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900">Workforce Management</h4>
                      <p className="text-xs text-blue-700">Teams & Remote Work</p>
                    </div>
                  </div>
                  <Switch
                    checked={featureFlags?.mobile_workforce_product || false}
                    onCheckedChange={(checked) => updateFeatureFlag('mobile_workforce_product', checked)}
                    className="ml-2"
                  />
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {featureDescriptions.mobile_workforce_product}
                </p>
                <div className="mt-3 text-xs text-blue-700">
                  <strong>Includes:</strong> Teams, Projects, Tasks, Attendance, Leave Management
                </div>
              </div>

              {/* Time Product Toggle */}
              <div className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border-2 border-green-200 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Clock className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900">Time Tracking</h4>
                      <p className="text-xs text-green-700">Time & Productivity</p>
                    </div>
                  </div>
                  <Switch
                    checked={featureFlags?.mobile_time_product || false}
                    onCheckedChange={(checked) => updateFeatureFlag('mobile_time_product', checked)}
                    className="ml-2"
                  />
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {featureDescriptions.mobile_time_product}
                </p>
                <div className="mt-3 text-xs text-green-700">
                  <strong>Includes:</strong> Time Logging, Timesheets, Time Reports, Productivity
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 bg-indigo-50 rounded-lg border border-indigo-200">
              <div className="flex items-start gap-3">
                <Zap className="h-5 w-5 text-indigo-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-semibold text-indigo-900 mb-2">Mobile App Master Controls</p>
                  <ul className="text-indigo-800 space-y-1">
                    <li>• <strong>Guard Management:</strong> Complete security guard mobile experience with QR scanning and patrols</li>
                    <li>• <strong>Workforce Management:</strong> Full employee mobile experience for remote and hybrid workers</li>
                    <li>• <strong>Time Tracking:</strong> Complete time management mobile experience for productivity tracking</li>
                    <li>• Disabling a product removes the entire tab from the mobile app navigation</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Guard Management Product */}
        <Card className="border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-lg">
                <Shield className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Guard Management</h3>
                <p className="text-sm text-amber-700 font-medium">Security Guard Operations & Patrol System</p>
              </div>
            </CardTitle>
            <CardDescription>
              Comprehensive security guard management including mobile patrols, QR checkpoints, incident reporting, and performance tracking.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {featureFlags && ['guard_management', 'mobile_security', 'security_dashboard', 'incident_reporting', 'patrol_management', 'qr_checkpoints', 'guard_performance'].map((feature) => (
                <div key={feature} className="flex items-center justify-between py-3 px-4 bg-white rounded-lg border border-amber-100 shadow-sm">
                  <div className="flex-1">
                    <Label htmlFor={feature} className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                      <Shield className="h-4 w-4 text-amber-600" />
                      {feature.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </Label>
                    <p className="text-sm text-gray-600 mt-1 leading-relaxed">
                      {featureDescriptions[feature as keyof typeof featureDescriptions]}
                    </p>
                  </div>
                  <Switch
                    id={feature}
                    checked={featureFlags[feature as keyof FeatureFlags] || false}
                    onCheckedChange={(checked) => updateFeatureFlag(feature as keyof FeatureFlags, checked)}
                    className="ml-4"
                  />
                </div>
              ))}
            </div>
            <div className="mt-6 p-4 bg-amber-50 rounded-lg border border-amber-200">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm">
                  <p className="font-semibold text-amber-900 mb-2">Guard Management Requirements</p>
                  <ul className="text-amber-800 space-y-1">
                    <li>• Set user work type to "Security Guard" for mobile app access</li>
                    <li>• Deploy QR codes at patrol checkpoints for scanning</li>
                    <li>• Enable location permissions on mobile devices</li>
                    <li>• Configure patrol routes and guard assignments</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Workforce Management Product */}
        <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-cyan-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Workforce Management</h3>
                <p className="text-sm text-blue-700 font-medium">Employee Management & Team Operations</p>
              </div>
            </CardTitle>
            <CardDescription>
              Complete workforce management system including team organization, project management, task assignment, and attendance tracking.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {featureFlags && ['workforce_management', 'teams', 'projects', 'tasks', 'attendance', 'leave'].map((feature) => (
                <div key={feature} className="flex items-center justify-between py-3 px-4 bg-white rounded-lg border border-blue-100 shadow-sm">
                  <div className="flex-1">
                    <Label htmlFor={feature} className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                      <Users className="h-4 w-4 text-blue-600" />
                      {feature.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </Label>
                    <p className="text-sm text-gray-600 mt-1 leading-relaxed">
                      {featureDescriptions[feature as keyof typeof featureDescriptions]}
                    </p>
                  </div>
                  <Switch
                    id={feature}
                    checked={featureFlags[feature as keyof FeatureFlags] || false}
                    onCheckedChange={(checked) => updateFeatureFlag(feature as keyof FeatureFlags, checked)}
                    className="ml-4"
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Time Tracking Product */}
        <Card className="border-green-200 bg-gradient-to-r from-green-50 to-emerald-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Clock className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Time Tracking</h3>
                <p className="text-sm text-green-700 font-medium">Employee Time Management & Reporting</p>
              </div>
            </CardTitle>
            <CardDescription>
              Advanced time tracking system with digital timesheets, detailed reporting, and comprehensive time analytics.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {featureFlags && ['time_tracking', 'timesheets', 'time_reports'].map((feature) => (
                <div key={feature} className="flex items-center justify-between py-3 px-4 bg-white rounded-lg border border-green-100 shadow-sm">
                  <div className="flex-1">
                    <Label htmlFor={feature} className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                      <Clock className="h-4 w-4 text-green-600" />
                      {feature.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </Label>
                    <p className="text-sm text-gray-600 mt-1 leading-relaxed">
                      {featureDescriptions[feature as keyof typeof featureDescriptions]}
                    </p>
                  </div>
                  <Switch
                    id={feature}
                    checked={featureFlags[feature as keyof FeatureFlags] || false}
                    onCheckedChange={(checked) => updateFeatureFlag(feature as keyof FeatureFlags, checked)}
                    className="ml-4"
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Core Platform Features */}
        <Card className="border-gray-200 bg-gradient-to-r from-gray-50 to-slate-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-3">
              <div className="p-2 bg-gray-100 rounded-lg">
                <Settings className="h-6 w-6 text-gray-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Core Platform Features</h3>
                <p className="text-sm text-gray-700 font-medium">Essential System Components & Tools</p>
              </div>
            </CardTitle>
            <CardDescription>
              Core platform functionality including dashboard, analytics, reporting, forms, maps, and system integrations.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {featureFlags && ['dashboard', 'maps', 'forms', 'outlets', 'settings', 'analytics', 'reports', 'automation', 'integrations'].map((feature) => (
                <div key={feature} className="flex items-center justify-between py-3 px-4 bg-white rounded-lg border border-gray-100 shadow-sm">
                  <div className="flex-1">
                    <Label htmlFor={feature} className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                      <Settings className="h-4 w-4 text-gray-600" />
                      {feature.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </Label>
                    <p className="text-sm text-gray-600 mt-1 leading-relaxed">
                      {featureDescriptions[feature as keyof typeof featureDescriptions]}
                    </p>
                  </div>
                  <Switch
                    id={feature}
                    checked={featureFlags[feature as keyof FeatureFlags] || false}
                    onCheckedChange={(checked) => updateFeatureFlag(feature as keyof FeatureFlags, checked)}
                    className="ml-4"
                  />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Save Changes Button */}
        <div className="flex justify-end pt-6">
          <Button 
            onClick={saveFeatureFlags}
            disabled={saving}
            size="lg"
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold px-8 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
          >
            {saving ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                Saving Changes...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Save Feature Settings
              </div>
            )}
          </Button>
        </div>
      </div>

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
                <li>• <strong>Security:</strong> Security guard patrols with QR scanning</li>
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
                      <option value="security">Security Guard</option>
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
              <li>• <strong>Security Guards:</strong> Optimized for security patrol features and QR scanning</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}