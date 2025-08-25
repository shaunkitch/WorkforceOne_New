'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useFeatureFlags } from '@/components/feature-flags-provider'
import { devLog } from '@/lib/utils/logger'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
  Users,
  CreditCard
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
  const router = useRouter()
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
    tabs.push({ id: 'subscription', label: 'Subscription', icon: CreditCard })
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

          {activeTab === 'subscription' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CreditCard className="h-5 w-5 mr-2" />
                  Subscription Management
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-center py-8">
                  <div className="mb-4">
                    <CreditCard className="h-16 w-16 text-blue-600 mx-auto" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Manage Your Subscription</h3>
                  <p className="text-gray-600 mb-6 max-w-md mx-auto">
                    View and manage your subscription plan, features, billing, and payment methods.
                  </p>
                  <Button 
                    onClick={() => router.push('/dashboard/subscription')}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Open Subscription Management
                  </Button>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-2">Subscription Features</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Manage your subscription plan and features</li>
                    <li>• Add or remove premium features</li>
                    <li>• Adjust team size and pricing</li>
                    <li>• View billing history and invoices</li>
                    <li>• Update payment methods</li>
                    <li>• Switch between monthly and yearly billing</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'features' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Smartphone className="h-5 w-5 mr-2" />
                  Enhanced Feature Management
                </CardTitle>
                <CardDescription>
                  Access the new enhanced feature management system with master mobile product toggles.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <div className="mb-4">
                    <Smartphone className="h-16 w-16 text-blue-500 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Enhanced Feature Management Available
                    </h3>
                    <p className="text-gray-600 max-w-md mx-auto">
                      The new feature management system includes master mobile app product toggles 
                      for Guard Management, Workforce Management, and Time Tracking.
                    </p>
                  </div>
                  <Button asChild size="lg" className="bg-blue-600 hover:bg-blue-700">
                    <Link href="/dashboard/settings/features">
                      Open Enhanced Feature Management
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
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
  // Core Features
  { id: 'dashboard', name: 'Dashboard Overview', category: 'Core', description: 'Main dashboard with statistics and insights' },
  
  // Human Resources
  { id: 'leave', name: 'Leave Requests', category: 'Human Resources', description: 'Time off requests and approvals' },
  { id: 'teams', name: 'Teams Management', category: 'Human Resources', description: 'Team structure and member management' },
  
  // Time Management
  { id: 'attendance', name: 'Attendance Tracking', category: 'Time Management', description: 'Check-in/out and attendance monitoring' },
  { id: 'time_tracking', name: 'Time Tracking', category: 'Time Management', description: 'Track work hours and productivity' },
  
  // Operations
  { id: 'routes', name: 'Route Management', category: 'Operations', description: 'Route planning and optimization', requiresRole: ['admin', 'manager'] },
  { id: 'tasks', name: 'Task Management', category: 'Operations', description: 'Task assignments and tracking' },
  { id: 'projects', name: 'Project Management', category: 'Operations', description: 'Project tracking and management' },
  { id: 'maps', name: 'Team Location Map', category: 'Operations', description: 'Real-time team location tracking' },
  { id: 'outlets', name: 'Outlets Management', category: 'Operations', description: 'Manage office and outlet locations', requiresRole: ['admin', 'manager'] },
  
  // Security
  { id: 'security', name: 'Security Guard Patrols', category: 'Security', description: 'Security guard patrol system with QR checkpoints and real-time tracking', requiresRole: ['admin', 'manager'] },
  
  // Analytics & Reports
  { id: 'analytics', name: 'Advanced Analytics', category: 'Analytics', description: 'Comprehensive workforce analytics and insights', requiresRole: ['admin', 'manager'] },
  
  // Forms & Processes
  { id: 'forms', name: 'Dynamic Forms', category: 'Forms', description: 'Form builder and response management' },
  
  // Mobile App Features
  { id: 'mobile_clock_in', name: 'Clock In/Out (Mobile)', category: 'Mobile App', description: 'Time tracking and attendance in mobile app' },
  { id: 'mobile_daily_visits', name: 'Daily Visits (Mobile)', category: 'Mobile App', description: 'Daily customer visits and location tracking in mobile app' },
  { id: 'mobile_tasks', name: 'Tasks (Mobile)', category: 'Mobile App', description: 'Task management and tracking in mobile app' },
  { id: 'mobile_forms', name: 'Forms (Mobile)', category: 'Mobile App', description: 'Form completion and submission in mobile app' },
  { id: 'mobile_leave', name: 'Leave Requests (Mobile)', category: 'Mobile App', description: 'Leave request submission and management in mobile app' },
  { id: 'mobile_payslips', name: 'Payslips (Mobile)', category: 'Mobile App', description: 'View and download payslips in mobile app' },
  { id: 'mobile_offline_mode', name: 'Offline Mode (Mobile)', category: 'Mobile App', description: 'Allow mobile app to work offline and sync later' },
  { id: 'mobile_push_notifications', name: 'Push Notifications (Mobile)', category: 'Mobile App', description: 'Send push notifications to mobile devices' },
  
  // Administration (Admin/Manager only)
  { id: 'automation', name: 'Workflow Automation', category: 'Administration', description: 'Automated workflows and triggers', requiresRole: ['admin', 'manager'] },
  { id: 'integrations', name: 'Third-party Integrations', category: 'Administration', description: 'Slack, Teams, and other integrations', requiresRole: ['admin', 'manager'] },
  { id: 'payroll', name: 'Payroll Export', category: 'Administration', description: 'Payroll generation and export', requiresRole: ['admin'] },
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
  
  // Color scheme state
  const [colorSchemes, setColorSchemes] = useState<any[]>([])
  const [currentBranding, setCurrentBranding] = useState<any>(null)
  const [loadingBranding, setLoadingBranding] = useState(true)
  const [updatingColors, setUpdatingColors] = useState(false)
  const [showCustomColors, setShowCustomColors] = useState(false)
  const [customColors, setCustomColors] = useState({
    primary_color: '#3b82f6',
    secondary_color: '#1e40af',
    accent_color: '#06b6d4',
    background_light: '#ffffff',
    background_dark: '#f8fafc',
    surface_color: '#ffffff',
    text_primary: '#111827',
    text_secondary: '#6b7280',
    text_muted: '#9ca3af',
    success_color: '#10b981',
    warning_color: '#f59e0b',
    error_color: '#ef4444',
    info_color: '#3b82f6'
  })
  
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

  // Load color schemes and current branding
  useEffect(() => {
    if (!organization?.id) return

    const loadBrandingData = async () => {
      try {
        // Load predefined color schemes
        const { data: schemes, error: schemesError } = await supabase
          .from('branding_color_schemes')
          .select('*')
          .order('category', { ascending: true })

        if (schemesError) throw schemesError
        setColorSchemes(schemes || [])

        // Load current organization branding
        const { data: branding, error: brandingError } = await supabase
          .from('organization_branding')
          .select('*')
          .eq('organization_id', organization.id)
          .single()

        if (brandingError && brandingError.code !== 'PGRST116') {
          throw brandingError
        }

        setCurrentBranding(branding)
        if (branding) {
          setCustomColors({
            primary_color: branding.primary_color,
            secondary_color: branding.secondary_color,
            accent_color: branding.accent_color,
            background_light: branding.background_light,
            background_dark: branding.background_dark,
            surface_color: branding.surface_color,
            text_primary: branding.text_primary,
            text_secondary: branding.text_secondary,
            text_muted: branding.text_muted,
            success_color: branding.success_color,
            warning_color: branding.warning_color,
            error_color: branding.error_color,
            info_color: branding.info_color
          })
        }
      } catch (error) {
        console.error('Error loading branding data:', error)
      } finally {
        setLoadingBranding(false)
      }
    }

    loadBrandingData()
  }, [organization?.id])

  // Apply predefined color scheme
  const applyColorScheme = async (schemeId: string) => {
    if (!organization?.id) return

    setUpdatingColors(true)
    try {
      const { data, error } = await supabase.rpc('apply_color_scheme_to_organization', {
        org_id: organization.id,
        scheme_id: schemeId,
        user_id: (await supabase.auth.getUser()).data.user?.id
      })

      if (error) throw error

      // Reload branding data
      const { data: branding } = await supabase
        .from('organization_branding')
        .select('*')
        .eq('organization_id', organization.id)
        .single()

      setCurrentBranding(branding)
      if (branding) {
        setCustomColors({
          primary_color: branding.primary_color,
          secondary_color: branding.secondary_color,
          accent_color: branding.accent_color,
          background_light: branding.background_light,
          background_dark: branding.background_dark,
          surface_color: branding.surface_color,
          text_primary: branding.text_primary,
          text_secondary: branding.text_secondary,
          text_muted: branding.text_muted,
          success_color: branding.success_color,
          warning_color: branding.warning_color,
          error_color: branding.error_color,
          info_color: branding.info_color
        })
      }

      // Apply colors to CSS
      applyColorsToCSS(branding)

      // Show success message
      const successMsg = document.createElement('div')
      successMsg.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg z-50'
      successMsg.textContent = 'Color scheme applied successfully!'
      document.body.appendChild(successMsg)
      setTimeout(() => document.body.removeChild(successMsg), 3000)

    } catch (error) {
      console.error('Error applying color scheme:', error)
      alert('Failed to apply color scheme. Please try again.')
    } finally {
      setUpdatingColors(false)
    }
  }

  // Update custom colors
  const updateCustomColors = async () => {
    if (!organization?.id) return

    setUpdatingColors(true)
    try {
      const user = (await supabase.auth.getUser()).data.user
      if (!user) throw new Error('Not authenticated')

      const { error } = await supabase
        .from('organization_branding')
        .upsert({
          organization_id: organization.id,
          ...customColors,
          updated_by: user.id,
          updated_at: new Date().toISOString()
        })

      if (error) throw error

      // Reload branding data
      const { data: branding } = await supabase
        .from('organization_branding')
        .select('*')
        .eq('organization_id', organization.id)
        .single()

      setCurrentBranding(branding)

      // Apply colors to CSS
      applyColorsToCSS(branding)

      // Show success message
      const successMsg = document.createElement('div')
      successMsg.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg z-50'
      successMsg.textContent = 'Custom colors updated successfully!'
      document.body.appendChild(successMsg)
      setTimeout(() => document.body.removeChild(successMsg), 3000)

    } catch (error) {
      console.error('Error updating custom colors:', error)
      alert('Failed to update custom colors. Please try again.')
    } finally {
      setUpdatingColors(false)
    }
  }

  // Apply colors to CSS custom properties
  const applyColorsToCSS = (branding: any) => {
    if (!branding) return

    const root = document.documentElement
    root.style.setProperty('--color-primary', branding.primary_color)
    root.style.setProperty('--color-secondary', branding.secondary_color)
    root.style.setProperty('--color-accent', branding.accent_color)
    root.style.setProperty('--color-background-light', branding.background_light)
    root.style.setProperty('--color-background-dark', branding.background_dark)
    root.style.setProperty('--color-surface', branding.surface_color)
    root.style.setProperty('--color-text-primary', branding.text_primary)
    root.style.setProperty('--color-text-secondary', branding.text_secondary)
    root.style.setProperty('--color-text-muted', branding.text_muted)
    root.style.setProperty('--color-success', branding.success_color)
    root.style.setProperty('--color-warning', branding.warning_color)
    root.style.setProperty('--color-error', branding.error_color)
    root.style.setProperty('--color-info', branding.info_color)
  }

  // Apply current branding on load
  useEffect(() => {
    if (currentBranding) {
      applyColorsToCSS(currentBranding)
      devLog('Applied branding colors:', currentBranding);
    }
  }, [currentBranding])

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

        {/* Color Scheme Section */}
        <div>
          <h3 className="text-lg font-medium mb-4">Color Scheme</h3>
          <p className="text-gray-600 mb-6">
            Choose a color scheme to customize the appearance of your WorkforceOne portal and mobile app.
          </p>

          {loadingBranding ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <>
              {/* Predefined Color Schemes */}
              <div className="mb-8">
                <h4 className="font-medium mb-4">Predefined Themes</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {colorSchemes.map((scheme) => (
                    <div
                      key={scheme.id}
                      className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => applyColorScheme(scheme.id)}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <h5 className="font-medium">{scheme.name}</h5>
                        {scheme.is_default && (
                          <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Default</span>
                        )}
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-3">{scheme.description}</p>
                      
                      {/* Color Preview */}
                      <div className="flex space-x-2 mb-3">
                        <div
                          className="w-6 h-6 rounded border"
                          style={{ backgroundColor: scheme.primary_color }}
                          title="Primary"
                        />
                        <div
                          className="w-6 h-6 rounded border"
                          style={{ backgroundColor: scheme.secondary_color }}
                          title="Secondary"
                        />
                        <div
                          className="w-6 h-6 rounded border"
                          style={{ backgroundColor: scheme.accent_color }}
                          title="Accent"
                        />
                        <div
                          className="w-6 h-6 rounded border"
                          style={{ backgroundColor: scheme.success_color }}
                          title="Success"
                        />
                        <div
                          className="w-6 h-6 rounded border"
                          style={{ backgroundColor: scheme.warning_color }}
                          title="Warning"
                        />
                      </div>
                      
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full"
                        disabled={updatingColors}
                        onClick={(e) => {
                          e.stopPropagation()
                          applyColorScheme(scheme.id)
                        }}
                      >
                        {updatingColors ? 'Applying...' : 'Apply Theme'}
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Custom Colors Section */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-medium">Custom Colors</h4>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowCustomColors(!showCustomColors)}
                  >
                    <Palette className="h-4 w-4 mr-2" />
                    {showCustomColors ? 'Hide' : 'Show'} Custom Colors
                  </Button>
                </div>

                {showCustomColors && (
                  <div className="border rounded-lg p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {/* Primary Colors */}
                      <div>
                        <h5 className="font-medium mb-3">Brand Colors</h5>
                        <div className="space-y-3">
                          <div>
                            <Label className="text-sm">Primary Color</Label>
                            <div className="flex items-center space-x-2 mt-1">
                              <input
                                type="color"
                                value={customColors.primary_color}
                                onChange={(e) => setCustomColors(prev => ({ ...prev, primary_color: e.target.value }))}
                                className="w-10 h-10 rounded border cursor-pointer"
                              />
                              <Input
                                value={customColors.primary_color}
                                onChange={(e) => setCustomColors(prev => ({ ...prev, primary_color: e.target.value }))}
                                className="flex-1 text-sm"
                                placeholder="#3b82f6"
                              />
                            </div>
                          </div>
                          
                          <div>
                            <Label className="text-sm">Secondary Color</Label>
                            <div className="flex items-center space-x-2 mt-1">
                              <input
                                type="color"
                                value={customColors.secondary_color}
                                onChange={(e) => setCustomColors(prev => ({ ...prev, secondary_color: e.target.value }))}
                                className="w-10 h-10 rounded border cursor-pointer"
                              />
                              <Input
                                value={customColors.secondary_color}
                                onChange={(e) => setCustomColors(prev => ({ ...prev, secondary_color: e.target.value }))}
                                className="flex-1 text-sm"
                                placeholder="#1e40af"
                              />
                            </div>
                          </div>

                          <div>
                            <Label className="text-sm">Accent Color</Label>
                            <div className="flex items-center space-x-2 mt-1">
                              <input
                                type="color"
                                value={customColors.accent_color}
                                onChange={(e) => setCustomColors(prev => ({ ...prev, accent_color: e.target.value }))}
                                className="w-10 h-10 rounded border cursor-pointer"
                              />
                              <Input
                                value={customColors.accent_color}
                                onChange={(e) => setCustomColors(prev => ({ ...prev, accent_color: e.target.value }))}
                                className="flex-1 text-sm"
                                placeholder="#06b6d4"
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Background Colors */}
                      <div>
                        <h5 className="font-medium mb-3">Background Colors</h5>
                        <div className="space-y-3">
                          <div>
                            <Label className="text-sm">Light Background</Label>
                            <div className="flex items-center space-x-2 mt-1">
                              <input
                                type="color"
                                value={customColors.background_light}
                                onChange={(e) => setCustomColors(prev => ({ ...prev, background_light: e.target.value }))}
                                className="w-10 h-10 rounded border cursor-pointer"
                              />
                              <Input
                                value={customColors.background_light}
                                onChange={(e) => setCustomColors(prev => ({ ...prev, background_light: e.target.value }))}
                                className="flex-1 text-sm"
                                placeholder="#ffffff"
                              />
                            </div>
                          </div>

                          <div>
                            <Label className="text-sm">Dark Background</Label>
                            <div className="flex items-center space-x-2 mt-1">
                              <input
                                type="color"
                                value={customColors.background_dark}
                                onChange={(e) => setCustomColors(prev => ({ ...prev, background_dark: e.target.value }))}
                                className="w-10 h-10 rounded border cursor-pointer"
                              />
                              <Input
                                value={customColors.background_dark}
                                onChange={(e) => setCustomColors(prev => ({ ...prev, background_dark: e.target.value }))}
                                className="flex-1 text-sm"
                                placeholder="#f8fafc"
                              />
                            </div>
                          </div>

                          <div>
                            <Label className="text-sm">Surface Color</Label>
                            <div className="flex items-center space-x-2 mt-1">
                              <input
                                type="color"
                                value={customColors.surface_color}
                                onChange={(e) => setCustomColors(prev => ({ ...prev, surface_color: e.target.value }))}
                                className="w-10 h-10 rounded border cursor-pointer"
                              />
                              <Input
                                value={customColors.surface_color}
                                onChange={(e) => setCustomColors(prev => ({ ...prev, surface_color: e.target.value }))}
                                className="flex-1 text-sm"
                                placeholder="#ffffff"
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Status Colors */}
                      <div>
                        <h5 className="font-medium mb-3">Status Colors</h5>
                        <div className="space-y-3">
                          <div>
                            <Label className="text-sm">Success Color</Label>
                            <div className="flex items-center space-x-2 mt-1">
                              <input
                                type="color"
                                value={customColors.success_color}
                                onChange={(e) => setCustomColors(prev => ({ ...prev, success_color: e.target.value }))}
                                className="w-10 h-10 rounded border cursor-pointer"
                              />
                              <Input
                                value={customColors.success_color}
                                onChange={(e) => setCustomColors(prev => ({ ...prev, success_color: e.target.value }))}
                                className="flex-1 text-sm"
                                placeholder="#10b981"
                              />
                            </div>
                          </div>

                          <div>
                            <Label className="text-sm">Warning Color</Label>
                            <div className="flex items-center space-x-2 mt-1">
                              <input
                                type="color"
                                value={customColors.warning_color}
                                onChange={(e) => setCustomColors(prev => ({ ...prev, warning_color: e.target.value }))}
                                className="w-10 h-10 rounded border cursor-pointer"
                              />
                              <Input
                                value={customColors.warning_color}
                                onChange={(e) => setCustomColors(prev => ({ ...prev, warning_color: e.target.value }))}
                                className="flex-1 text-sm"
                                placeholder="#f59e0b"
                              />
                            </div>
                          </div>

                          <div>
                            <Label className="text-sm">Error Color</Label>
                            <div className="flex items-center space-x-2 mt-1">
                              <input
                                type="color"
                                value={customColors.error_color}
                                onChange={(e) => setCustomColors(prev => ({ ...prev, error_color: e.target.value }))}
                                className="w-10 h-10 rounded border cursor-pointer"
                              />
                              <Input
                                value={customColors.error_color}
                                onChange={(e) => setCustomColors(prev => ({ ...prev, error_color: e.target.value }))}
                                className="flex-1 text-sm"
                                placeholder="#ef4444"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-4 border-t">
                      <div className="text-sm text-gray-600">
                        Changes will apply to both the portal and mobile app in real-time.
                      </div>
                      <Button
                        onClick={updateCustomColors}
                        disabled={updatingColors}
                      >
                        <Save className="h-4 w-4 mr-2" />
                        {updatingColors ? 'Updating...' : 'Save Custom Colors'}
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Current Colors Preview */}
              {currentBranding && (
                <div className="mt-8 bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium mb-3">Current Color Scheme</h4>
                  <div className="mb-3 text-sm text-gray-600">
                    CSS Variables applied: --color-primary: {getComputedStyle(document.documentElement).getPropertyValue('--color-primary') || 'not set'}
                  </div>
                  <div className="mb-3 p-3 bg-brand-primary text-white rounded">
                    This element uses bg-brand-primary and should change color when you select a new theme
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <div className="flex items-center space-x-2">
                      <div
                        className="w-6 h-6 rounded border"
                        style={{ backgroundColor: currentBranding.primary_color }}
                      />
                      <span className="text-sm">Primary</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div
                        className="w-6 h-6 rounded border"
                        style={{ backgroundColor: currentBranding.secondary_color }}
                      />
                      <span className="text-sm">Secondary</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div
                        className="w-6 h-6 rounded border"
                        style={{ backgroundColor: currentBranding.accent_color }}
                      />
                      <span className="text-sm">Accent</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div
                        className="w-6 h-6 rounded border"
                        style={{ backgroundColor: currentBranding.success_color }}
                      />
                      <span className="text-sm">Success</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div
                        className="w-6 h-6 rounded border"
                        style={{ backgroundColor: currentBranding.warning_color }}
                      />
                      <span className="text-sm">Warning</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div
                        className="w-6 h-6 rounded border"
                        style={{ backgroundColor: currentBranding.error_color }}
                      />
                      <span className="text-sm">Error</span>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

interface RegionalSettingsProps {
  settings: any
  presets: any[]
  onUpdate: (updates: any) => void
  onApplyPreset: (preset: any) => void
  saving: boolean
}

function RegionalSettings({ settings, presets, onUpdate, onApplyPreset, saving }: RegionalSettingsProps) {
  const [localSettings, setLocalSettings] = useState(settings)

  useEffect(() => {
    setLocalSettings(settings)
  }, [settings])

  const handleFieldChange = (field: string, value: any) => {
    setLocalSettings((prev: any) => ({ ...prev, [field]: value }))
  }

  const saveChanges = () => {
    onUpdate(localSettings)
  }

  const hasChanges = JSON.stringify(localSettings) !== JSON.stringify(settings)

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Globe className="h-5 w-5 mr-2" />
            Regional Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-gray-600">
            Configure regional settings including currency, date format, and timezone for your organization.
          </p>

          {/* Quick Regional Presets */}
          <div>
            <h3 className="text-lg font-medium mb-4">Quick Setup</h3>
            <p className="text-sm text-gray-600 mb-4">
              Select your country to automatically configure regional settings:
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {presets.filter(p => ['US', 'GB', 'ZA', 'NL', 'AU', 'CA'].includes(p.country_code)).map((preset) => (
                <Button
                  key={preset.id}
                  variant="outline"
                  onClick={() => onApplyPreset(preset)}
                  disabled={saving}
                  className="justify-start text-left"
                >
                  <div>
                    <div className="font-medium">{preset.country_name}</div>
                    <div className="text-xs text-gray-500">{preset.currency_symbol} {preset.currency_code}</div>
                  </div>
                </Button>
              ))}
            </div>
          </div>

          {/* Manual Configuration */}
          <div>
            <h3 className="text-lg font-medium mb-4">Manual Configuration</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="currency_code">Currency Code</Label>
                <Select
                  value={localSettings?.currency_code || 'USD'}
                  onValueChange={(value) => handleFieldChange('currency_code', value)}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD - US Dollar</SelectItem>
                    <SelectItem value="EUR">EUR - Euro</SelectItem>
                    <SelectItem value="GBP">GBP - British Pound</SelectItem>
                    <SelectItem value="ZAR">ZAR - South African Rand</SelectItem>
                    <SelectItem value="CAD">CAD - Canadian Dollar</SelectItem>
                    <SelectItem value="AUD">AUD - Australian Dollar</SelectItem>
                    <SelectItem value="JPY">JPY - Japanese Yen</SelectItem>
                    <SelectItem value="INR">INR - Indian Rupee</SelectItem>
                    <SelectItem value="BRL">BRL - Brazilian Real</SelectItem>
                    <SelectItem value="MXN">MXN - Mexican Peso</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="currency_symbol">Currency Symbol</Label>
                <Input
                  id="currency_symbol"
                  value={localSettings?.currency_symbol || '$'}
                  onChange={(e) => handleFieldChange('currency_symbol', e.target.value)}
                  placeholder="$"
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="date_format">Date Format</Label>
                <Select
                  value={localSettings?.date_format || 'MM/dd/yyyy'}
                  onValueChange={(value) => handleFieldChange('date_format', value)}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MM/dd/yyyy">MM/dd/yyyy (US)</SelectItem>
                    <SelectItem value="dd/MM/yyyy">dd/MM/yyyy (UK/AU)</SelectItem>
                    <SelectItem value="yyyy/MM/dd">yyyy/MM/dd (ZA)</SelectItem>
                    <SelectItem value="dd.MM.yyyy">dd.MM.yyyy (DE)</SelectItem>
                    <SelectItem value="yyyy-MM-dd">yyyy-MM-dd (ISO)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="time_format">Time Format</Label>
                <Select
                  value={localSettings?.time_format || '12h'}
                  onValueChange={(value) => handleFieldChange('time_format', value)}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="12h">12-hour (1:30 PM)</SelectItem>
                    <SelectItem value="24h">24-hour (13:30)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="timezone">Timezone</Label>
                <Select
                  value={localSettings?.timezone || 'America/New_York'}
                  onValueChange={(value) => handleFieldChange('timezone', value)}
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
                    <SelectItem value="Europe/Berlin">Berlin (UTC+1)</SelectItem>
                    <SelectItem value="Africa/Johannesburg">Johannesburg (UTC+2)</SelectItem>
                    <SelectItem value="Asia/Tokyo">Tokyo (UTC+9)</SelectItem>
                    <SelectItem value="Australia/Sydney">Sydney (UTC+10)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="language">Language</Label>
                <Select
                  value={localSettings?.language || 'en'}
                  onValueChange={(value) => handleFieldChange('language', value)}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="es">Spanish</SelectItem>
                    <SelectItem value="fr">French</SelectItem>
                    <SelectItem value="de">German</SelectItem>
                    <SelectItem value="pt">Portuguese</SelectItem>
                    <SelectItem value="ja">Japanese</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {hasChanges && (
              <div className="flex justify-end mt-6">
                <Button onClick={saveChanges} disabled={saving}>
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            )}
          </div>

          {/* Preview */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-medium mb-4">Preview</h3>
            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              <div><strong>Currency:</strong> {localSettings?.currency_symbol}{localSettings?.currency_code === 'JPY' ? '1,000' : '1,234.56'}</div>
              <div><strong>Date:</strong> {new Date().toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: localSettings?.date_format?.includes('MM/dd') ? '2-digit' : 'numeric',
                day: '2-digit'
              })}</div>
              <div><strong>Time:</strong> {new Date().toLocaleTimeString('en-US', { 
                hour12: localSettings?.time_format === '12h',
                hour: '2-digit',
                minute: '2-digit'
              })}</div>
              <div><strong>Timezone:</strong> {localSettings?.timezone}</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

interface AccountingSettingsProps {
  settings: any
  onUpdate: (updates: any) => void
  saving: boolean
}

function AccountingSettings({ settings, onUpdate, saving }: AccountingSettingsProps) {
  const [localSettings, setLocalSettings] = useState(settings)

  useEffect(() => {
    setLocalSettings(settings)
  }, [settings])

  const handleFieldChange = (field: string, value: any) => {
    setLocalSettings((prev: any) => ({ ...prev, [field]: value }))
  }

  const saveChanges = () => {
    onUpdate(localSettings)
  }

  const hasChanges = JSON.stringify(localSettings) !== JSON.stringify(settings)

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="h-5 w-5 mr-2" />
            Accounting Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="text-gray-600">
            Configure payroll rates, overtime settings, and deductions for your organization.
          </p>

          {/* Hourly Rates by Role */}
          <div>
            <h3 className="text-lg font-medium mb-4">Hourly Rates by Role</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <Label htmlFor="member_rate">Member Hourly Rate</Label>
                <div className="relative mt-2">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                    {settings?.currency_symbol || '$'}
                  </span>
                  <Input
                    id="member_rate"
                    type="number"
                    step="0.01"
                    value={localSettings?.member_hourly_rate || 15.00}
                    onChange={(e) => handleFieldChange('member_hourly_rate', parseFloat(e.target.value))}
                    className="pl-8"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="manager_rate">Manager Hourly Rate</Label>
                <div className="relative mt-2">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                    {settings?.currency_symbol || '$'}
                  </span>
                  <Input
                    id="manager_rate"
                    type="number"
                    step="0.01"
                    value={localSettings?.manager_hourly_rate || 25.00}
                    onChange={(e) => handleFieldChange('manager_hourly_rate', parseFloat(e.target.value))}
                    className="pl-8"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="admin_rate">Admin Hourly Rate</Label>
                <div className="relative mt-2">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                    {settings?.currency_symbol || '$'}
                  </span>
                  <Input
                    id="admin_rate"
                    type="number"
                    step="0.01"
                    value={localSettings?.admin_hourly_rate || 35.00}
                    onChange={(e) => handleFieldChange('admin_hourly_rate', parseFloat(e.target.value))}
                    className="pl-8"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Overtime Settings */}
          <div>
            <h3 className="text-lg font-medium mb-4">Overtime Settings</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="overtime_threshold">Weekly Overtime Threshold (hours)</Label>
                <Input
                  id="overtime_threshold"
                  type="number"
                  value={localSettings?.overtime_threshold || 40}
                  onChange={(e) => handleFieldChange('overtime_threshold', parseInt(e.target.value))}
                  className="mt-2"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Hours worked beyond this will be considered overtime
                </p>
              </div>

              <div>
                <Label htmlFor="overtime_multiplier">Overtime Multiplier</Label>
                <Input
                  id="overtime_multiplier"
                  type="number"
                  step="0.1"
                  value={localSettings?.overtime_multiplier || 1.5}
                  onChange={(e) => handleFieldChange('overtime_multiplier', parseFloat(e.target.value))}
                  className="mt-2"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Overtime pay = regular rate × this multiplier
                </p>
              </div>
            </div>
          </div>

          {/* Deduction Settings */}
          <div>
            <h3 className="text-lg font-medium mb-4">Deduction Settings</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <Label htmlFor="tax_rate">Tax Rate (%)</Label>
                <Input
                  id="tax_rate"
                  type="number"
                  step="0.01"
                  value={(localSettings?.tax_rate || 0.20) * 100}
                  onChange={(e) => handleFieldChange('tax_rate', parseFloat(e.target.value) / 100)}
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="benefits_rate">Benefits Rate (%)</Label>
                <Input
                  id="benefits_rate"
                  type="number"
                  step="0.01"
                  value={(localSettings?.benefits_rate || 0.05) * 100}
                  onChange={(e) => handleFieldChange('benefits_rate', parseFloat(e.target.value) / 100)}
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="other_deductions">Other Deductions (%)</Label>
                <Input
                  id="other_deductions"
                  type="number"
                  step="0.01"
                  value={(localSettings?.other_deductions_rate || 0.00) * 100}
                  onChange={(e) => handleFieldChange('other_deductions_rate', parseFloat(e.target.value) / 100)}
                  className="mt-2"
                />
              </div>
            </div>
          </div>

          {/* Payroll Settings */}
          <div>
            <h3 className="text-lg font-medium mb-4">Payroll Settings</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="payroll_frequency">Payroll Frequency</Label>
                <Select
                  value={localSettings?.payroll_frequency || 'bi-weekly'}
                  onValueChange={(value) => handleFieldChange('payroll_frequency', value)}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="bi-weekly">Bi-weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="pay_period_start">Pay Period Start Day</Label>
                <Select
                  value={localSettings?.pay_period_start_day?.toString() || '1'}
                  onValueChange={(value) => handleFieldChange('pay_period_start_day', parseInt(value))}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Monday</SelectItem>
                    <SelectItem value="2">Tuesday</SelectItem>
                    <SelectItem value="3">Wednesday</SelectItem>
                    <SelectItem value="4">Thursday</SelectItem>
                    <SelectItem value="5">Friday</SelectItem>
                    <SelectItem value="6">Saturday</SelectItem>
                    <SelectItem value="0">Sunday</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Payroll Preview */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-medium mb-4">Payroll Calculation Preview</h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <div className="font-medium">Member (40 hrs)</div>
                  <div>Regular: {settings?.currency_symbol}{(localSettings?.member_hourly_rate * 40 || 600).toFixed(2)}</div>
                  <div>Overtime (8 hrs): {settings?.currency_symbol}{(localSettings?.member_hourly_rate * 8 * (localSettings?.overtime_multiplier || 1.5) || 180).toFixed(2)}</div>
                  <div className="font-medium">Gross: {settings?.currency_symbol}{((localSettings?.member_hourly_rate * 40) + (localSettings?.member_hourly_rate * 8 * (localSettings?.overtime_multiplier || 1.5)) || 780).toFixed(2)}</div>
                </div>
                <div>
                  <div className="font-medium">Manager (40 hrs)</div>
                  <div>Regular: {settings?.currency_symbol}{(localSettings?.manager_hourly_rate * 40 || 1000).toFixed(2)}</div>
                  <div>Overtime (8 hrs): {settings?.currency_symbol}{(localSettings?.manager_hourly_rate * 8 * (localSettings?.overtime_multiplier || 1.5) || 300).toFixed(2)}</div>
                  <div className="font-medium">Gross: {settings?.currency_symbol}{((localSettings?.manager_hourly_rate * 40) + (localSettings?.manager_hourly_rate * 8 * (localSettings?.overtime_multiplier || 1.5)) || 1300).toFixed(2)}</div>
                </div>
                <div>
                  <div className="font-medium">Admin (40 hrs)</div>
                  <div>Regular: {settings?.currency_symbol}{(localSettings?.admin_hourly_rate * 40 || 1400).toFixed(2)}</div>
                  <div>Overtime (8 hrs): {settings?.currency_symbol}{(localSettings?.admin_hourly_rate * 8 * (localSettings?.overtime_multiplier || 1.5) || 420).toFixed(2)}</div>
                  <div className="font-medium">Gross: {settings?.currency_symbol}{((localSettings?.admin_hourly_rate * 40) + (localSettings?.admin_hourly_rate * 8 * (localSettings?.overtime_multiplier || 1.5)) || 1820).toFixed(2)}</div>
                </div>
              </div>
            </div>
          </div>

          {hasChanges && (
            <div className="flex justify-end">
              <Button onClick={saveChanges} disabled={saving}>
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
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
          <div className="space-y-6">
            <div className="space-y-4">
              <p className="text-gray-600">
                Enable or disable features for all users in your organization. These settings serve as defaults for new users.
              </p>
              
              {/* New Features Notice */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 text-sm font-medium">!</span>
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-blue-900">New Features Available</h4>
                    <p className="text-sm text-blue-800 mt-1">
                      We've added new features including Route Management, Advanced Analytics, and Workflow Automation. 
                      Some features require specific roles (Manager/Admin) for security and organizational control.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Group features by category */}
            {['Core', 'Human Resources', 'Time Management', 'Operations', 'Security', 'Analytics', 'Forms', 'Mobile App', 'Administration'].map(category => {
              const categoryFeatures = ALL_FEATURES.filter(f => f.category === category)
              if (categoryFeatures.length === 0) return null
              
              return (
                <div key={category} className="space-y-3">
                  <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
                    {category}
                  </h3>
                  <div className="space-y-3">
                    {categoryFeatures.map(feature => (
                      <div key={feature.id} className="flex items-start justify-between p-4 border rounded-lg hover:bg-gray-50">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Label htmlFor={`org-feature-${feature.id}`} className="font-medium">{feature.name}</Label>
                            {feature.requiresRole && (
                              <span className="px-2 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-medium">
                                {feature.requiresRole.includes('admin') && feature.requiresRole.includes('manager') 
                                  ? 'Admin/Manager Only' 
                                  : feature.requiresRole.includes('admin') 
                                    ? 'Admin Only'
                                    : 'Manager+'}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-500 mt-1">{feature.description}</p>
                        </div>
                        <Switch
                          id={`org-feature-${feature.id}`}
                          checked={featureFlags[feature.id] ?? true}
                          onCheckedChange={(checked) => handleFlagChange(feature.id, checked)}
                          className="ml-4"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
            {/* Feature Summary */}
            <div className="bg-gray-50 rounded-lg p-4 border">
              <h4 className="font-medium text-gray-900 mb-3">Feature Summary</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <div className="text-gray-500">Total Features</div>
                  <div className="font-medium">{ALL_FEATURES.length}</div>
                </div>
                <div>
                  <div className="text-gray-500">Enabled</div>
                  <div className="font-medium text-green-600">
                    {Object.values(featureFlags).filter(v => v === true).length || ALL_FEATURES.length}
                  </div>
                </div>
                <div>
                  <div className="text-gray-500">Admin Only</div>
                  <div className="font-medium text-amber-600">
                    {ALL_FEATURES.filter(f => f.requiresRole?.includes('admin')).length}
                  </div>
                </div>
                <div>
                  <div className="text-gray-500">Manager+</div>
                  <div className="font-medium text-blue-600">
                    {ALL_FEATURES.filter(f => f.requiresRole?.includes('manager')).length}
                  </div>
                </div>
              </div>
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
                    <div className="space-y-4">
                      {['Core', 'Human Resources', 'Time Management', 'Operations', 'Security', 'Analytics', 'Forms', 'Mobile App', 'Administration'].map(category => {
                        const categoryFeatures = ALL_FEATURES.filter(f => {
                          // Filter by role if user doesn't have required permissions
                          if (f.requiresRole && selectedUser?.role) {
                            return f.requiresRole.includes(selectedUser.role) && f.category === category
                          }
                          return f.category === category
                        })
                        
                        if (categoryFeatures.length === 0) return null
                        
                        return (
                          <div key={category}>
                            <h4 className="font-medium text-gray-900 mb-2">{category}</h4>
                            <div className="space-y-2">
                              {categoryFeatures.map(feature => {
                                const userHasFeature = userFeatures[feature.id]
                                const orgDefault = featureFlags[feature.id] ?? true
                                const isOverridden = userHasFeature !== undefined
                                
                                return (
                                  <div key={feature.id} className="flex items-start justify-between p-3 border rounded-lg">
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2">
                                        <div className="font-medium">{feature.name}</div>
                                        {feature.requiresRole && (
                                          <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full text-xs">
                                            {feature.requiresRole.includes('admin') && feature.requiresRole.includes('manager') 
                                              ? 'Admin/Manager' 
                                              : feature.requiresRole.includes('admin') 
                                                ? 'Admin Only'
                                                : 'Manager+'}
                                          </span>
                                        )}
                                      </div>
                                      <div className="text-sm text-gray-500 mt-1">
                                        {feature.description}
                                      </div>
                                      <div className="text-xs text-gray-400 mt-1">
                                        Org default: {orgDefault ? 'Enabled' : 'Disabled'}
                                        {isOverridden && (
                                          <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full">
                                            Overridden
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                    <div className="flex items-center space-x-2 ml-4">
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