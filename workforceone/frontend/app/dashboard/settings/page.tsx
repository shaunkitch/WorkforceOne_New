'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useFeatureFlags } from '@/components/feature-flags-provider'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  Settings,
  User,
  Bell,
  Shield,
  Palette,
  Clock,
  Globe,
  Eye,
  Camera,
  Save,
  Upload,
  Mail,
  Phone,
  MapPin,
  Building,
  Calendar,
  Trash2,
  Download,
  Key,
  Smartphone,
  Monitor,
  Moon,
  Sun,
  Volume2,
  Users
} from 'lucide-react'
import { format } from 'date-fns'

interface UserProfile {
  id: string
  full_name: string
  email: string
  phone?: string
  avatar_url?: string
  bio?: string
  department?: string
  job_title?: string
  location?: string
  timezone?: string
  start_date?: string
  settings?: {
    theme: 'light' | 'dark' | 'system'
    language: string
    notifications: {
      email: boolean
      push: boolean
      inApp: boolean
      sound: boolean
      types: {
        tasks: boolean
        projects: boolean
        attendance: boolean
        leave: boolean
        system: boolean
      }
    }
    privacy: {
      profileVisibility: 'public' | 'team' | 'private'
      showEmail: boolean
      showPhone: boolean
      showLocation: boolean
    }
    dashboard: {
      defaultPage: string
      compactMode: boolean
      showQuickActions: boolean
    }
    timeTracking: {
      autoStartTimer: boolean
      reminderInterval: number
      showSeconds: boolean
    }
  }
}

export default function SettingsPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('profile')
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  
  const supabase = createClient()

  const [organization, setOrganization] = useState<any | null>(null)
  const [organizationSettings, setOrganizationSettings] = useState<any | null>(null)
  const [regionalPresets, setRegionalPresets] = useState<any[]>([])
  const [savingSettings, setSavingSettings] = useState(false)

  useEffect(() => {
    fetchProfile()
    fetchOrganization()
  }, [])

  const fetchOrganization = async () => {
    try {
      const { data: user } = await supabase.auth.getUser()
      if (!user.user) return

      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.user.id)
        .single()

      if (!profile?.organization_id) return

      // Fetch organization data
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', profile.organization_id)
        .single()

      if (error) throw error
      setOrganization(data)

      // Fetch organization settings
      const { data: settings } = await supabase
        .from('organization_settings')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .single()

      setOrganizationSettings(settings)

      // Fetch regional presets
      const { data: presets } = await supabase
        .from('regional_presets')
        .select('*')
        .order('country_name')

      setRegionalPresets(presets || [])
    } catch (error) {
      console.error('Error fetching organization:', error)
    }
  }

  const updateFeatureFlags = async (newFlags: any) => {
    if (!organization) return

    setSaving(true)
    try {
      const { error } = await supabase
        .from('organizations')
        .update({ feature_flags: newFlags })
        .eq('id', organization.id)

      if (error) throw error

      setOrganization((prev: any) => ({ ...prev, feature_flags: newFlags }))
      
      const successMsg = document.createElement('div')
      successMsg.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg z-50'
      successMsg.textContent = 'Feature flags saved successfully!'
      document.body.appendChild(successMsg)
      setTimeout(() => document.body.removeChild(successMsg), 3000)
    } catch (error) {
      console.error('Error updating feature flags:', error)
      alert('Failed to save feature flags. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const updateOrganizationSettings = async (updates: any) => {
    if (!organizationSettings || !organization) return

    setSavingSettings(true)
    try {
      const { error } = await supabase
        .from('organization_settings')
        .update(updates)
        .eq('organization_id', organization.id)

      if (error) throw error

      setOrganizationSettings((prev: any) => ({ ...prev, ...updates }))
      
      const successMsg = document.createElement('div')
      successMsg.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg z-50'
      successMsg.textContent = 'Settings saved successfully!'
      document.body.appendChild(successMsg)
      setTimeout(() => document.body.removeChild(successMsg), 3000)
    } catch (error) {
      console.error('Error updating organization settings:', error)
      alert('Failed to save settings. Please try again.')
    } finally {
      setSavingSettings(false)
    }
  }

  const applyRegionalPreset = async (preset: any) => {
    const updates = {
      region: preset.region,
      currency_code: preset.currency_code,
      currency_symbol: preset.currency_symbol,
      date_format: preset.date_format,
      time_format: preset.time_format,
      timezone: preset.timezone,
      language: preset.language
    }
    await updateOrganizationSettings(updates)
  }

  const fetchProfile = async () => {
    try {
      const { data: user } = await supabase.auth.getUser()
      if (!user.user) return

      let { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.user.id)
        .single()

      // If profile doesn't exist, create it
      if (error && error.code === 'PGRST116') {
        const newProfile = {
          id: user.user.id,
          email: user.user.email || '',
          full_name: user.user.user_metadata?.full_name || user.user.email?.split('@')[0] || 'User',
          avatar_url: user.user.user_metadata?.avatar_url || null,
          is_active: true
        }

        const { data: createdProfile, error: createError } = await supabase
          .from('profiles')
          .insert(newProfile)
          .select()
          .single()

        if (createError) throw createError
        data = createdProfile
      } else if (error) {
        throw error
      }

      // Set default settings if not present
      const defaultSettings = {
        theme: 'system',
        language: 'en',
        notifications: {
          email: true,
          push: true,
          inApp: true,
          sound: true,
          types: {
            tasks: true,
            projects: true,
            attendance: true,
            leave: true,
            system: true
          }
        },
        privacy: {
          profileVisibility: 'team',
          showEmail: false,
          showPhone: false,
          showLocation: true
        },
        dashboard: {
          defaultPage: 'dashboard',
          compactMode: false,
          showQuickActions: true
        },
        timeTracking: {
          autoStartTimer: false,
          reminderInterval: 30,
          showSeconds: false
        }
      }

      setProfile({
        ...data,
        settings: { ...defaultSettings, ...data.settings }
      })
    } catch (error) {
      console.error('Error fetching profile:', error)
      
      // Show user-friendly error message
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      alert(`Failed to load profile data: ${errorMessage}. Please check your connection and try refreshing the page.`)
    } finally {
      setLoading(false)
    }
  }

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!profile) return

    setSaving(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', profile.id)

      if (error) throw error

      setProfile(prev => ({ ...prev!, ...updates }))
      
      // Show success message
      const successMsg = document.createElement('div')
      successMsg.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg z-50'
      successMsg.textContent = 'Settings saved successfully!'
      document.body.appendChild(successMsg)
      setTimeout(() => document.body.removeChild(successMsg), 3000)
    } catch (error) {
      console.error('Error updating profile:', error)
      alert('Failed to save settings. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const uploadAvatar = async () => {
    if (!avatarFile || !profile) return

    try {
      const fileExt = avatarFile.name.split('.').pop()
      const fileName = `${profile.id}.${fileExt}`
      const filePath = `avatars/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, avatarFile, { upsert: true })

      if (uploadError) throw uploadError

      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      await updateProfile({ avatar_url: urlData.publicUrl })
      setAvatarFile(null)
      setAvatarPreview(null)
    } catch (error) {
      console.error('Error uploading avatar:', error)
      alert('Failed to upload avatar. Please try again.')
    }
  }

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB')
      return
    }

    setAvatarFile(file)
    const reader = new FileReader()
    reader.onload = (e) => setAvatarPreview(e.target?.result as string)
    reader.readAsDataURL(file)
  }

  const updateSettings = (path: string, value: any) => {
    if (!profile) return

    const newSettings = { ...profile.settings }
    const keys = path.split('.')
    let current = newSettings as any

    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) current[keys[i]] = {}
      current = current[keys[i]]
    }

    current[keys[keys.length - 1]] = value
    updateProfile({ settings: newSettings })
  }

  const exportData = async () => {
    if (!profile) return

    try {
      // This would typically fetch all user data from various tables
      const userData = {
        profile: profile,
        exportedAt: new Date().toISOString()
      }

      const blob = new Blob([JSON.stringify(userData, null, 2)], {
        type: 'application/json'
      })
      
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `workforceone-data-${format(new Date(), 'yyyy-MM-dd')}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error exporting data:', error)
      alert('Failed to export data. Please try again.')
    }
  }

  const deleteAccount = async () => {
    const confirmation = prompt(
      'This action cannot be undone. Type "DELETE" to confirm account deletion:'
    )
    
    if (confirmation !== 'DELETE') return

    try {
      // This would typically involve a backend API call to handle account deletion
      // For now, we'll just show a message
      alert('Account deletion would be handled by backend API. Please contact support.')
    } catch (error) {
      console.error('Error deleting account:', error)
    }
  }

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'privacy', label: 'Privacy & Security', icon: Shield },
    { id: 'preferences', label: 'Preferences', icon: Settings },
    { id: 'data', label: 'Data & Privacy', icon: Download }
  ]

  if (profile?.role === 'admin') {
    tabs.push({ id: 'regional', label: 'Regional Settings', icon: Globe })
    tabs.push({ id: 'accounting', label: 'Accounting', icon: Users })
    tabs.push({ id: 'branding', label: 'Branding', icon: Camera })
    tabs.push({ id: 'features', label: 'Features', icon: Building })
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <div className="text-gray-500">Loading your profile settings...</div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <div className="text-red-500">⚠️ Failed to load profile data</div>
        <div className="text-gray-500 text-center">
          <p>There was an issue loading your profile information.</p>
          <p className="mt-2">Please try refreshing the page or contact support if the issue persists.</p>
        </div>
        <button 
          onClick={() => window.location.reload()} 
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Refresh Page
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600">Manage your account settings and preferences.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Settings Navigation */}
        <div className="lg:col-span-1">
          <Card>
            <CardContent className="p-0">
              <nav className="space-y-1">
                {tabs.map((tab) => {
                  const Icon = tab.icon
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-none hover:bg-gray-50 ${
                        activeTab === tab.id 
                          ? 'bg-blue-50 text-blue-600 border-r-2 border-blue-600' 
                          : 'text-gray-700'
                      }`}
                    >
                      <Icon className="h-5 w-5 mr-3" />
                      {tab.label}
                    </button>
                  )
                })}
              </nav>
            </CardContent>
          </Card>
        </div>

        {/* Settings Content */}
        <div className="lg:col-span-3 space-y-6">
          {activeTab === 'profile' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  Profile Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Avatar Section */}
                <div className="flex items-center space-x-6">
                  <div className="relative">
                    <div className="h-20 w-20 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                      {avatarPreview || profile.avatar_url ? (
                        <img
                          src={avatarPreview || profile.avatar_url}
                          alt="Avatar"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="text-2xl font-medium text-gray-700">
                          {profile.full_name?.charAt(0)?.toUpperCase()}
                        </span>
                      )}
                    </div>
                    <input
                      type="file"
                      id="avatar-upload"
                      accept="image/*"
                      onChange={handleAvatarChange}
                      className="hidden"
                    />
                  </div>
                  <div className="space-y-2">
                    <div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => document.getElementById('avatar-upload')?.click()}
                      >
                        <Camera className="h-4 w-4 mr-2" />
                        Change Photo
                      </Button>
                      {avatarFile && (
                        <Button
                          size="sm"
                          onClick={uploadAvatar}
                          className="ml-2"
                        >
                          <Upload className="h-4 w-4 mr-2" />
                          Upload
                        </Button>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">
                      JPG, PNG or GIF. Max size 5MB.
                    </p>
                  </div>
                </div>

                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input
                      id="fullName"
                      value={profile.full_name || ''}
                      onChange={(e) => setProfile(prev => ({ ...prev!, full_name: e.target.value }))}
                      placeholder="Enter your full name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={profile.email || ''}
                      disabled
                      className="bg-gray-50"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Email cannot be changed here. Contact your administrator.
                    </p>
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      value={profile.phone || ''}
                      onChange={(e) => setProfile(prev => ({ ...prev!, phone: e.target.value }))}
                      placeholder="Enter your phone number"
                    />
                  </div>
                  <div>
                    <Label htmlFor="jobTitle">Job Title</Label>
                    <Input
                      id="jobTitle"
                      value={profile.job_title || ''}
                      onChange={(e) => setProfile(prev => ({ ...prev!, job_title: e.target.value }))}
                      placeholder="Enter your job title"
                    />
                  </div>
                  <div>
                    <Label htmlFor="department">Department</Label>
                    <Input
                      id="department"
                      value={profile.department || ''}
                      onChange={(e) => setProfile(prev => ({ ...prev!, department: e.target.value }))}
                      placeholder="Enter your department"
                    />
                  </div>
                  <div>
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      value={profile.location || ''}
                      onChange={(e) => setProfile(prev => ({ ...prev!, location: e.target.value }))}
                      placeholder="Enter your location"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    value={profile.bio || ''}
                    onChange={(e) => setProfile(prev => ({ ...prev!, bio: e.target.value }))}
                    placeholder="Tell us about yourself..."
                    rows={4}
                  />
                </div>

                <div className="flex justify-end">
                  <Button
                    onClick={() => updateProfile({
                      full_name: profile.full_name,
                      phone: profile.phone,
                      job_title: profile.job_title,
                      department: profile.department,
                      location: profile.location,
                      bio: profile.bio
                    })}
                    disabled={saving}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Bell className="h-5 w-5 mr-2" />
                    Notification Preferences
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Notification Methods */}
                  <div>
                    <h3 className="text-lg font-medium mb-4">How you receive notifications</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Mail className="h-5 w-5 text-gray-400" />
                          <div>
                            <div className="font-medium">Email Notifications</div>
                            <div className="text-sm text-gray-500">Receive notifications via email</div>
                          </div>
                        </div>
                        <Switch
                          checked={profile.settings?.notifications.email}
                          onCheckedChange={(checked) => updateSettings('notifications.email', checked)}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Smartphone className="h-5 w-5 text-gray-400" />
                          <div>
                            <div className="font-medium">Push Notifications</div>
                            <div className="text-sm text-gray-500">Receive push notifications on your device</div>
                          </div>
                        </div>
                        <Switch
                          checked={profile.settings?.notifications.push}
                          onCheckedChange={(checked) => updateSettings('notifications.push', checked)}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Monitor className="h-5 w-5 text-gray-400" />
                          <div>
                            <div className="font-medium">In-App Notifications</div>
                            <div className="text-sm text-gray-500">Show notifications within the app</div>
                          </div>
                        </div>
                        <Switch
                          checked={profile.settings?.notifications.inApp}
                          onCheckedChange={(checked) => updateSettings('notifications.inApp', checked)}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Volume2 className="h-5 w-5 text-gray-400" />
                          <div>
                            <div className="font-medium">Sound Notifications</div>
                            <div className="text-sm text-gray-500">Play sound for notifications</div>
                          </div>
                        </div>
                        <Switch
                          checked={profile.settings?.notifications.sound}
                          onCheckedChange={(checked) => updateSettings('notifications.sound', checked)}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Notification Types */}
                  <div>
                    <h3 className="text-lg font-medium mb-4">What you get notified about</h3>
                    <div className="space-y-4">
                      {[
                        { key: 'tasks', label: 'Tasks', desc: 'New tasks, assignments, and updates' },
                        { key: 'projects', label: 'Projects', desc: 'Project updates and milestones' },
                        { key: 'attendance', label: 'Attendance', desc: 'Check-in reminders and alerts' },
                        { key: 'leave', label: 'Leave Requests', desc: 'Leave request updates and approvals' },
                        { key: 'system', label: 'System', desc: 'System updates and maintenance notices' }
                      ].map((type) => (
                        <div key={type.key} className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">{type.label}</div>
                            <div className="text-sm text-gray-500">{type.desc}</div>
                          </div>
                          <Switch
                            checked={profile.settings?.notifications.types[type.key as keyof typeof profile.settings.notifications.types]}
                            onCheckedChange={(checked) => updateSettings(`notifications.types.${type.key}`, checked)}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'appearance' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Palette className="h-5 w-5 mr-2" />
                  Appearance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label>Theme</Label>
                  <div className="grid grid-cols-3 gap-4 mt-2">
                    {[
                      { value: 'light', label: 'Light', icon: Sun },
                      { value: 'dark', label: 'Dark', icon: Moon },
                      { value: 'system', label: 'System', icon: Monitor }
                    ].map((theme) => {
                      const Icon = theme.icon
                      return (
                        <button
                          key={theme.value}
                          onClick={() => updateSettings('theme', theme.value)}
                          className={`p-4 border rounded-lg flex flex-col items-center space-y-2 transition-colors ${
                            profile.settings?.theme === theme.value
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <Icon className="h-6 w-6" />
                          <span className="text-sm font-medium">{theme.label}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div>
                  <Label htmlFor="language">Language</Label>
                  <Select
                    value={profile.settings?.language}
                    onValueChange={(value) => updateSettings('language', value)}
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Spanish</SelectItem>
                      <SelectItem value="fr">French</SelectItem>
                      <SelectItem value="de">German</SelectItem>
                      <SelectItem value="it">Italian</SelectItem>
                      <SelectItem value="pt">Portuguese</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select
                    value={profile.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone}
                    onValueChange={(value) => setProfile(prev => ({ ...prev!, timezone: value }))}
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="America/New_York">Eastern Time (UTC-5)</SelectItem>
                      <SelectItem value="America/Chicago">Central Time (UTC-6)</SelectItem>
                      <SelectItem value="America/Denver">Mountain Time (UTC-7)</SelectItem>
                      <SelectItem value="America/Los_Angeles">Pacific Time (UTC-8)</SelectItem>
                      <SelectItem value="Europe/London">London (UTC+0)</SelectItem>
                      <SelectItem value="Europe/Paris">Paris (UTC+1)</SelectItem>
                      <SelectItem value="Asia/Tokyo">Tokyo (UTC+9)</SelectItem>
                      <SelectItem value="Australia/Sydney">Sydney (UTC+10)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex justify-end">
                  <Button
                    onClick={() => updateProfile({ timezone: profile.timezone })}
                    disabled={saving}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'privacy' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="h-5 w-5 mr-2" />
                  Privacy & Security
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-4">Profile Visibility</h3>
                  <div className="space-y-4">
                    <div>
                      <Label>Who can see your profile</Label>
                      <Select
                        value={profile.settings?.privacy.profileVisibility}
                        onValueChange={(value) => updateSettings('privacy.profileVisibility', value)}
                      >
                        <SelectTrigger className="mt-2">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="public">Everyone</SelectItem>
                          <SelectItem value="team">Team members only</SelectItem>
                          <SelectItem value="private">Only me</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">Show email address</div>
                          <div className="text-sm text-gray-500">Allow others to see your email</div>
                        </div>
                        <Switch
                          checked={profile.settings?.privacy.showEmail}
                          onCheckedChange={(checked) => updateSettings('privacy.showEmail', checked)}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">Show phone number</div>
                          <div className="text-sm text-gray-500">Allow others to see your phone number</div>
                        </div>
                        <Switch
                          checked={profile.settings?.privacy.showPhone}
                          onCheckedChange={(checked) => updateSettings('privacy.showPhone', checked)}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">Show location</div>
                          <div className="text-sm text-gray-500">Allow others to see your location</div>
                        </div>
                        <Switch
                          checked={profile.settings?.privacy.showLocation}
                          onCheckedChange={(checked) => updateSettings('privacy.showLocation', checked)}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-4">Security</h3>
                  <div className="space-y-4">
                    <Button variant="outline" className="w-full justify-start">
                      <Key className="h-4 w-4 mr-2" />
                      Change Password
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <Smartphone className="h-4 w-4 mr-2" />
                      Set up Two-Factor Authentication
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'preferences' && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Settings className="h-5 w-5 mr-2" />
                    Dashboard Preferences
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <Label>Default Page</Label>
                    <Select
                      value={profile.settings?.dashboard.defaultPage}
                      onValueChange={(value) => updateSettings('dashboard.defaultPage', value)}
                    >
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="dashboard">Dashboard</SelectItem>
                        <SelectItem value="time">Time Tracking</SelectItem>
                        <SelectItem value="tasks">Tasks</SelectItem>
                        <SelectItem value="projects">Projects</SelectItem>
                        <SelectItem value="attendance">Attendance</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">Compact Mode</div>
                        <div className="text-sm text-gray-500">Show more information in less space</div>
                      </div>
                      <Switch
                        checked={profile.settings?.dashboard.compactMode}
                        onCheckedChange={(checked) => updateSettings('dashboard.compactMode', checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">Quick Actions</div>
                        <div className="text-sm text-gray-500">Show quick action buttons on dashboard</div>
                      </div>
                      <Switch
                        checked={profile.settings?.dashboard.showQuickActions}
                        onCheckedChange={(checked) => updateSettings('dashboard.showQuickActions', checked)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Clock className="h-5 w-5 mr-2" />
                    Time Tracking Preferences
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">Auto-start Timer</div>
                        <div className="text-sm text-gray-500">Automatically start timer when you begin work</div>
                      </div>
                      <Switch
                        checked={profile.settings?.timeTracking.autoStartTimer}
                        onCheckedChange={(checked) => updateSettings('timeTracking.autoStartTimer', checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">Show Seconds</div>
                        <div className="text-sm text-gray-500">Display seconds in timer</div>
                      </div>
                      <Switch
                        checked={profile.settings?.timeTracking.showSeconds}
                        onCheckedChange={(checked) => updateSettings('timeTracking.showSeconds', checked)}
                      />
                    </div>
                  </div>

                  <div>
                    <Label>Reminder Interval (minutes)</Label>
                    <Select
                      value={profile.settings?.timeTracking.reminderInterval.toString()}
                      onValueChange={(value) => updateSettings('timeTracking.reminderInterval', parseInt(value))}
                    >
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="15">15 minutes</SelectItem>
                        <SelectItem value="30">30 minutes</SelectItem>
                        <SelectItem value="60">1 hour</SelectItem>
                        <SelectItem value="120">2 hours</SelectItem>
                        <SelectItem value="0">Never</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'data' && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Download className="h-5 w-5 mr-2" />
                    Data Export
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-gray-600">
                    Export your data to keep a personal copy. This includes your profile information, 
                    time entries, tasks, and other personal data.
                  </p>
                  <Button onClick={exportData} className="w-full">
                    <Download className="h-4 w-4 mr-2" />
                    Export My Data
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-red-200">
                <CardHeader>
                  <CardTitle className="flex items-center text-red-600">
                    <Trash2 className="h-5 w-5 mr-2" />
                    Delete Account
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-gray-600">
                    Permanently delete your account and all associated data. This action cannot be undone.
                  </p>
                  <Button 
                    variant="destructive" 
                    onClick={deleteAccount} 
                    className="w-full"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Account
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'branding' && organization && (
            <BrandingManagement 
              organization={organization} 
              saving={saving} 
            />
          )}

          {activeTab === 'regional' && organizationSettings && (
            <RegionalSettings 
              settings={organizationSettings}
              presets={regionalPresets}
              onUpdate={updateOrganizationSettings}
              onApplyPreset={applyRegionalPreset}
              saving={savingSettings}
            />
          )}

          {activeTab === 'accounting' && organizationSettings && (
            <AccountingSettings 
              settings={organizationSettings}
              onUpdate={updateOrganizationSettings}
              saving={savingSettings}
            />
          )}

          {activeTab === 'features' && organization && (
            <FeatureManagement 
              organization={organization} 
              onUpdateFlags={updateFeatureFlags} 
              saving={saving} 
            />
          )}
        </div>
      </div>
    </div>
  )
}

interface FeatureManagementProps {
  organization: any
  onUpdateFlags: (newFlags: any) => void
  saving: boolean
}

const ALL_FEATURES = [
  { id: 'time_tracking', name: 'Time Tracking' },
  { id: 'attendance', name: 'Attendance' },
  { id: 'maps', name: 'Team Map' },
  { id: 'teams', name: 'Teams' },
  { id: 'projects', name: 'Projects' },
  { id: 'tasks', name: 'Tasks' },
  { id: 'forms', name: 'Forms' },
  { id: 'leave', name: 'Leave Requests' },
  { id: 'outlets', name: 'Outlets' },
]

interface BrandingManagementProps {
  organization: any
  saving: boolean
}

function BrandingManagement({ organization, saving }: BrandingManagementProps) {
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [uploadingSaving, setUploadingSaving] = useState(false)
  const [companyName, setCompanyName] = useState(organization?.name || '')
  const [nameChanged, setNameChanged] = useState(false)
  const supabase = createClient()

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB')
      return
    }

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file')
      return
    }

    setLogoFile(file)
    const reader = new FileReader()
    reader.onload = (e) => setLogoPreview(e.target?.result as string)
    reader.readAsDataURL(file)
  }

  const uploadLogo = async () => {
    if (!logoFile || !organization) return

    setUploadingSaving(true)
    try {
      const fileExt = logoFile.name.split('.').pop()
      const fileName = `${organization.id}-logo.${fileExt}`
      const filePath = `logos/${fileName}`

      // Upload logo to storage
      const { error: uploadError } = await supabase.storage
        .from('logos')
        .upload(filePath, logoFile, { upsert: true })

      if (uploadError) throw uploadError

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('logos')
        .getPublicUrl(filePath)

      // Update organization with logo URL
      const { error: updateError } = await supabase
        .from('organizations')
        .update({ logo_url: urlData.publicUrl })
        .eq('id', organization.id)

      if (updateError) throw updateError

      // Show success message
      const successMsg = document.createElement('div')
      successMsg.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg z-50'
      successMsg.textContent = 'Logo uploaded successfully!'
      document.body.appendChild(successMsg)
      setTimeout(() => document.body.removeChild(successMsg), 3000)

      setLogoFile(null)
      setLogoPreview(null)
      
      // Reload the page to see changes
      window.location.reload()
    } catch (error) {
      console.error('Error uploading logo:', error)
      alert('Failed to upload logo. Please try again.')
    } finally {
      setUploadingSaving(false)
    }
  }

  const removeLogo = async () => {
    if (!organization?.logo_url) return

    if (!confirm('Are you sure you want to remove the current logo?')) return

    setUploadingSaving(true)
    try {
      // Update organization to remove logo URL
      const { error } = await supabase
        .from('organizations')
        .update({ logo_url: null })
        .eq('id', organization.id)

      if (error) throw error

      // Show success message
      const successMsg = document.createElement('div')
      successMsg.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg z-50'
      successMsg.textContent = 'Logo removed successfully!'
      document.body.appendChild(successMsg)
      setTimeout(() => document.body.removeChild(successMsg), 3000)
      
      // Reload the page to see changes
      window.location.reload()
    } catch (error) {
      console.error('Error removing logo:', error)
      alert('Failed to remove logo. Please try again.')
    } finally {
      setUploadingSaving(false)
    }
  }

  const updateCompanyName = async () => {
    if (!organization || !companyName.trim()) return

    setUploadingSaving(true)
    try {
      // Update organization name
      const { error } = await supabase
        .from('organizations')
        .update({ name: companyName.trim() })
        .eq('id', organization.id)

      if (error) throw error

      // Show success message
      const successMsg = document.createElement('div')
      successMsg.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg z-50'
      successMsg.textContent = 'Company name updated successfully!'
      document.body.appendChild(successMsg)
      setTimeout(() => document.body.removeChild(successMsg), 3000)

      setNameChanged(false)
      
      // Reload the page to see changes
      window.location.reload()
    } catch (error) {
      console.error('Error updating company name:', error)
      alert('Failed to update company name. Please try again.')
    } finally {
      setUploadingSaving(false)
    }
  }

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCompanyName(e.target.value)
    setNameChanged(e.target.value.trim() !== organization?.name)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Camera className="h-5 w-5 mr-2" />
          Company Branding
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-8">
        {/* Company Name Section */}
        <div>
          <h3 className="text-lg font-medium mb-4">Company Name</h3>
          <p className="text-gray-600 mb-4">
            Set your company name to personalize the application branding.
          </p>
          
          <div className="flex items-end space-x-4">
            <div className="flex-1">
              <Label htmlFor="company-name">Company Name</Label>
              <Input
                id="company-name"
                type="text"
                value={companyName}
                onChange={handleNameChange}
                placeholder="Enter your company name"
                className="mt-2"
                maxLength={100}
              />
            </div>
            {nameChanged && (
              <Button
                onClick={updateCompanyName}
                disabled={uploadingSaving || !companyName.trim()}
                size="sm"
              >
                <Save className="h-4 w-4 mr-2" />
                {uploadingSaving ? 'Saving...' : 'Save Name'}
              </Button>
            )}
          </div>
          
          <div className="mt-3 text-sm text-gray-500">
            <p>This name will appear in the sidebar and throughout the application.</p>
          </div>
        </div>

        {/* Company Logo Section */}
        <div>
          <h3 className="text-lg font-medium mb-4">Company Logo</h3>
          <p className="text-gray-600 mb-6">
            Upload your company logo to replace the WorkforceOne logo throughout the application.
          </p>
          
          {/* Current Logo Display */}
          <div className="flex items-center space-x-6 mb-6">
            <div className="relative">
              <div className="h-20 w-20 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden border">
                {logoPreview ? (
                  <img
                    src={logoPreview}
                    alt="Logo Preview"
                    className="h-full w-full object-contain"
                  />
                ) : organization?.logo_url ? (
                  <img
                    src={organization.logo_url}
                    alt="Current Logo"
                    className="h-full w-full object-contain"
                  />
                ) : (
                  <div className="text-center p-2">
                    <Building className="h-8 w-8 text-gray-400 mx-auto mb-1" />
                    <span className="text-xs text-gray-500">No Logo</span>
                  </div>
                )}
              </div>
              <input
                type="file"
                id="logo-upload"
                accept="image/*"
                onChange={handleLogoChange}
                className="hidden"
              />
            </div>
            
            <div className="space-y-3">
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => document.getElementById('logo-upload')?.click()}
                  disabled={uploadingSaving}
                >
                  <Camera className="h-4 w-4 mr-2" />
                  Choose Logo
                </Button>
                
                {logoFile && (
                  <Button
                    size="sm"
                    onClick={uploadLogo}
                    disabled={uploadingSaving}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {uploadingSaving ? 'Uploading...' : 'Upload'}
                  </Button>
                )}
                
                {organization?.logo_url && !logoFile && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={removeLogo}
                    disabled={uploadingSaving}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Remove
                  </Button>
                )}
              </div>
              
              <div className="text-sm text-gray-500">
                <p>Recommended: PNG, JPG, or SVG format</p>
                <p>Max size: 5MB • Best dimensions: 200x200px</p>
              </div>
            </div>
          </div>

          {/* Branding Guidelines */}
          <div className="bg-blue-50 rounded-lg p-4">
            <h4 className="font-medium text-blue-900 mb-2">Branding Guidelines</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• <strong>Company Name:</strong> Will replace "WorkforceOne" in the sidebar and navigation</li>
              <li>• <strong>Logo Format:</strong> Use square or horizontal logos for best results</li>
              <li>• <strong>Image Quality:</strong> Ensure good contrast for visibility on light backgrounds</li>
              <li>• <strong>Display Areas:</strong> Logo and name appear in sidebar, header, and login areas</li>
              <li>• <strong>Organization-wide:</strong> All branding changes apply to every user in your organization</li>
              <li>• <strong>File Requirements:</strong> PNG, JPG, or SVG • Max 5MB • Recommended 200x200px</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function FeatureManagement({ organization, onUpdateFlags, saving }: FeatureManagementProps) {
  const [featureFlags, setFeatureFlags] = useState(organization.feature_flags || {})
  const [activeTab, setActiveTab] = useState<'organization' | 'users'>('organization')
  const [allUsers, setAllUsers] = useState<any[]>([])
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [userFeatures, setUserFeatures] = useState<any>({})
  const { refreshFeatureFlags } = useFeatureFlags()
  const [searchUser, setSearchUser] = useState('')
  const [loadingUsers, setLoadingUsers] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    if (activeTab === 'users') {
      fetchAllUsers()
    }
  }, [activeTab])

  useEffect(() => {
    if (selectedUser) {
      fetchUserFeatures(selectedUser.id)
    }
  }, [selectedUser])

  const handleFlagChange = (featureId: string, isEnabled: boolean) => {
    setFeatureFlags((prev: any) => ({ ...prev, [featureId]: isEnabled }))
  }

  const fetchAllUsers = async () => {
    setLoadingUsers(true)
    try {
      const { data: user } = await supabase.auth.getUser()
      if (!user.user) return

      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.user.id)
        .single()

      if (!profile?.organization_id) return

      const { data: users } = await supabase
        .from('profiles')
        .select('id, full_name, email, role, feature_flags')
        .eq('organization_id', profile.organization_id)
        .order('full_name')

      setAllUsers(users || [])
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setLoadingUsers(false)
    }
  }

  const fetchUserFeatures = async (userId: string) => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('feature_flags')
        .eq('id', userId)
        .single()

      setUserFeatures(data?.feature_flags || {})
    } catch (error) {
      console.error('Error fetching user features:', error)
    }
  }

  const updateUserFeatures = async (userId: string, features: any) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ feature_flags: features })
        .eq('id', userId)

      if (error) throw error

      // Update local state
      setAllUsers(prev => 
        prev.map(user => 
          user.id === userId 
            ? { ...user, feature_flags: features }
            : user
        )
      )

      // Show success message
      const successMsg = document.createElement('div')
      successMsg.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg z-50'
      successMsg.textContent = 'User features updated successfully!'
      document.body.appendChild(successMsg)
      setTimeout(() => document.body.removeChild(successMsg), 3000)

    } catch (error) {
      console.error('Error updating user features:', error)
      alert('Failed to update user features. Please try again.')
    }
  }

  const handleUserFeatureChange = (featureId: string, isEnabled: boolean | undefined) => {
    const newFeatures = { ...userFeatures }
    if (isEnabled === undefined) {
      delete newFeatures[featureId] // Remove override to use org default
    } else {
      newFeatures[featureId] = isEnabled
    }
    setUserFeatures(newFeatures)
    
    if (selectedUser) {
      updateUserFeatures(selectedUser.id, newFeatures)
    }
  }

  const filteredUsers = allUsers.filter(user =>
    user.full_name?.toLowerCase().includes(searchUser.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchUser.toLowerCase())
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Building className="h-5 w-5 mr-2" />
          Feature Management
        </CardTitle>
        {/* Tab Navigation */}
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('organization')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
              activeTab === 'organization'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Organization Features
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
              activeTab === 'users'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            User-Specific Features
          </button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {activeTab === 'organization' ? (
          /* Organization Features Tab */
          <div className="space-y-4">
            <p className="text-gray-600">
              Enable or disable features for all users in your organization. These settings serve as defaults for new users.
            </p>
            <div className="space-y-4">
              {ALL_FEATURES.map(feature => (
                <div key={feature.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                  <div>
                    <Label htmlFor={`org-feature-${feature.id}`} className="font-medium">{feature.name}</Label>
                    <p className="text-sm text-gray-500">Default setting for all users</p>
                  </div>
                  <Switch
                    id={`org-feature-${feature.id}`}
                    checked={featureFlags[feature.id] ?? true}
                    onCheckedChange={(checked) => handleFlagChange(feature.id, checked)}
                  />
                </div>
              ))}
            </div>
            <div className="flex justify-end">
              <Button onClick={() => onUpdateFlags(featureFlags)} disabled={saving}>
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Saving...' : 'Save Organization Settings'}
              </Button>
            </div>
          </div>
        ) : (
          /* User-Specific Features Tab */
          <div className="space-y-4">
            <p className="text-gray-600">
              Override feature settings for individual users. User settings take precedence over organization defaults.
            </p>
            
            {/* User Selection */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* User List */}
              <div className="space-y-3">
                <Label>Select User</Label>
                <Input
                  placeholder="Search users..."
                  value={searchUser}
                  onChange={(e) => setSearchUser(e.target.value)}
                  className="mb-3"
                />
                <div className="border rounded-lg max-h-64 overflow-y-auto">
                  {loadingUsers ? (
                    <div className="p-4 text-center text-gray-500">Loading users...</div>
                  ) : filteredUsers.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">No users found</div>
                  ) : (
                    filteredUsers.map((user) => (
                      <button
                        key={user.id}
                        onClick={() => setSelectedUser(user)}
                        className={`w-full text-left p-3 border-b last:border-b-0 hover:bg-gray-50 transition-colors ${
                          selectedUser?.id === user.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                        }`}
                      >
                        <div className="font-medium">{user.full_name}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                        <div className="text-xs text-gray-400 mt-1">
                          Role: {user.role || 'Member'}
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>

              {/* Feature Controls */}
              <div className="space-y-3">
                {selectedUser ? (
                  <div>
                    <Label className="text-base">
                      Features for {selectedUser.full_name}
                    </Label>
                    <p className="text-sm text-gray-500 mb-4">
                      Customize which features this user can access
                    </p>
                    <div className="space-y-3">
                      {ALL_FEATURES.map(feature => {
                        const userHasFeature = userFeatures[feature.id]
                        const orgDefault = featureFlags[feature.id] ?? true
                        const isOverridden = userHasFeature !== undefined
                        
                        return (
                          <div key={feature.id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex-1">
                              <div className="font-medium">{feature.name}</div>
                              <div className="text-sm text-gray-500">
                                Org default: {orgDefault ? 'Enabled' : 'Disabled'}
                                {isOverridden && (
                                  <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full text-xs">
                                    Overridden
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <Switch
                                checked={userHasFeature ?? orgDefault}
                                onCheckedChange={(checked) => handleUserFeatureChange(feature.id, checked)}
                              />
                              {isOverridden && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleUserFeatureChange(feature.id, undefined as any)}
                                  className="text-xs"
                                >
                                  Reset
                                </Button>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="text-center p-8 border-2 border-dashed border-gray-300 rounded-lg">
                    <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">Select a user to manage their features</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}