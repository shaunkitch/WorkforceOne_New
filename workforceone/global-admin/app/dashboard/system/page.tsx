'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  Settings, Database, Server, Shield, Key, Bell, Mail,
  Globe, Clock, Users, CreditCard, AlertTriangle, CheckCircle,
  Save, RefreshCw, Download, Upload, Trash2, Eye, EyeOff,
  Zap, Activity, BarChart3, Lock, Unlock, Code, Webhook
} from 'lucide-react'

interface SystemConfig {
  general: {
    platform_name: string
    support_email: string
    maintenance_mode: boolean
    registration_enabled: boolean
    trial_length_days: number
    max_trial_users: number
  }
  email: {
    provider: 'smtp' | 'sendgrid' | 'mailgun' | 'ses'
    smtp_host?: string
    smtp_port?: number
    smtp_username?: string
    smtp_password?: string
    from_email: string
    from_name: string
  }
  payment: {
    stripe_publishable_key: string
    stripe_secret_key: string
    stripe_webhook_secret: string
    default_currency: string
    trial_enabled: boolean
  }
  security: {
    session_timeout_hours: number
    password_min_length: number
    require_2fa: boolean
    allow_social_login: boolean
    rate_limit_requests_per_minute: number
  }
  features: {
    ai_monitoring_enabled: boolean
    analytics_enabled: boolean
    api_access_enabled: boolean
    webhooks_enabled: boolean
    support_chat_enabled: boolean
  }
  limits: {
    max_organizations: number
    max_users_per_org: number
    api_rate_limit: number
    storage_limit_gb: number
  }
}

const DEFAULT_CONFIG: SystemConfig = {
  general: {
    platform_name: 'WorkforceOne',
    support_email: 'support@workforceone.com',
    maintenance_mode: false,
    registration_enabled: true,
    trial_length_days: 14,
    max_trial_users: 25
  },
  email: {
    provider: 'smtp',
    smtp_host: '',
    smtp_port: 587,
    smtp_username: '',
    smtp_password: '',
    from_email: 'noreply@workforceone.com',
    from_name: 'WorkforceOne'
  },
  payment: {
    stripe_publishable_key: '',
    stripe_secret_key: '',
    stripe_webhook_secret: '',
    default_currency: 'USD',
    trial_enabled: true
  },
  security: {
    session_timeout_hours: 24,
    password_min_length: 8,
    require_2fa: false,
    allow_social_login: true,
    rate_limit_requests_per_minute: 100
  },
  features: {
    ai_monitoring_enabled: true,
    analytics_enabled: true,
    api_access_enabled: true,
    webhooks_enabled: true,
    support_chat_enabled: false
  },
  limits: {
    max_organizations: 1000,
    max_users_per_org: 1000,
    api_rate_limit: 1000,
    storage_limit_gb: 100
  }
}

export default function SystemPage() {
  const [config, setConfig] = useState<SystemConfig>(DEFAULT_CONFIG)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState('general')
  const [showSecrets, setShowSecrets] = useState(false)
  const [unsavedChanges, setUnsavedChanges] = useState(false)

  useEffect(() => {
    loadSystemConfig()
  }, [])

  const loadSystemConfig = async () => {
    try {
      setLoading(true)
      // In real implementation, fetch from API
      // const response = await fetch('/api/admin/system/config')
      // const data = await response.json()
      // setConfig(data)
      
      // For demo, use localStorage
      const savedConfig = localStorage.getItem('system_config')
      if (savedConfig) {
        setConfig(JSON.parse(savedConfig))
      }
    } catch (error) {
      console.error('Error loading system config:', error)
    } finally {
      setLoading(false)
    }
  }

  const saveSystemConfig = async () => {
    try {
      setSaving(true)
      // In real implementation, save to API
      // await fetch('/api/admin/system/config', {
      //   method: 'PUT',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(config)
      // })
      
      // For demo, save to localStorage
      localStorage.setItem('system_config', JSON.stringify(config))
      setUnsavedChanges(false)
      alert('System configuration saved successfully!')
    } catch (error) {
      console.error('Error saving system config:', error)
      alert('Failed to save system configuration')
    } finally {
      setSaving(false)
    }
  }

  const updateConfig = (section: keyof SystemConfig, field: string, value: any) => {
    setConfig(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }))
    setUnsavedChanges(true)
  }

  const testEmailConfig = async () => {
    try {
      // In real implementation, test email sending
      alert('Test email sent successfully!')
    } catch (error) {
      alert('Failed to send test email')
    }
  }

  const generateApiKey = () => {
    const key = 'sk_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
    return key
  }

  const tabs = [
    { id: 'general', name: 'General', icon: Settings },
    { id: 'email', name: 'Email', icon: Mail },
    { id: 'payment', name: 'Payment', icon: CreditCard },
    { id: 'security', name: 'Security', icon: Shield },
    { id: 'features', name: 'Features', icon: Zap },
    { id: 'limits', name: 'Limits', icon: BarChart3 }
  ]

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="h-64 bg-gray-200 rounded"></div>
            <div className="lg:col-span-3 h-64 bg-gray-200 rounded"></div>
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
          <h1 className="text-3xl font-bold text-gray-900">System Settings</h1>
          <p className="text-gray-600 mt-1">Configure platform-wide settings and preferences</p>
        </div>
        <div className="flex space-x-3">
          {unsavedChanges && (
            <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
              <AlertTriangle className="w-3 h-3 mr-1" />
              Unsaved changes
            </Badge>
          )}
          <Button
            variant="outline"
            onClick={loadSystemConfig}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Reload
          </Button>
          <Button
            onClick={saveSystemConfig}
            disabled={saving || !unsavedChanges}
            className="bg-admin-600 hover:bg-admin-700"
          >
            {saving ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Save Changes
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Navigation Tabs */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Configuration Sections</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <nav className="space-y-1">
                {tabs.map((tab) => {
                  const Icon = tab.icon
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center px-4 py-3 text-left text-sm font-medium transition-colors ${
                        activeTab === tab.id
                          ? 'bg-admin-50 text-admin-700 border-r-2 border-admin-600'
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <Icon className="w-4 h-4 mr-3" />
                      {tab.name}
                    </button>
                  )
                })}
              </nav>
            </CardContent>
          </Card>
        </div>

        {/* Content */}
        <div className="lg:col-span-3">
          {/* General Settings */}
          {activeTab === 'general' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Settings className="w-5 h-5 mr-2" />
                  General Settings
                </CardTitle>
                <CardDescription>
                  Basic platform configuration and preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Platform Name
                    </label>
                    <Input
                      value={config.general.platform_name}
                      onChange={(e) => updateConfig('general', 'platform_name', e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Support Email
                    </label>
                    <Input
                      type="email"
                      value={config.general.support_email}
                      onChange={(e) => updateConfig('general', 'support_email', e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Trial Length (Days)
                    </label>
                    <Input
                      type="number"
                      value={config.general.trial_length_days}
                      onChange={(e) => updateConfig('general', 'trial_length_days', parseInt(e.target.value))}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Max Trial Users
                    </label>
                    <Input
                      type="number"
                      value={config.general.max_trial_users}
                      onChange={(e) => updateConfig('general', 'max_trial_users', parseInt(e.target.value))}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div>
                      <h4 className="font-medium text-gray-900">Maintenance Mode</h4>
                      <p className="text-sm text-gray-600">Temporarily disable platform access for maintenance</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.general.maintenance_mode}
                        onChange={(e) => updateConfig('general', 'maintenance_mode', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-admin-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-admin-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div>
                      <h4 className="font-medium text-gray-900">Registration Enabled</h4>
                      <p className="text-sm text-gray-600">Allow new organization registration</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.general.registration_enabled}
                        onChange={(e) => updateConfig('general', 'registration_enabled', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-admin-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-admin-600"></div>
                    </label>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Email Settings */}
          {activeTab === 'email' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Mail className="w-5 h-5 mr-2" />
                  Email Configuration
                </CardTitle>
                <CardDescription>
                  Configure email service provider and settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Provider
                    </label>
                    <select
                      value={config.email.provider}
                      onChange={(e) => updateConfig('email', 'provider', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-admin-500 focus:border-admin-500"
                    >
                      <option value="smtp">SMTP</option>
                      <option value="sendgrid">SendGrid</option>
                      <option value="mailgun">Mailgun</option>
                      <option value="ses">Amazon SES</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      From Email
                    </label>
                    <Input
                      type="email"
                      value={config.email.from_email}
                      onChange={(e) => updateConfig('email', 'from_email', e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      From Name
                    </label>
                    <Input
                      value={config.email.from_name}
                      onChange={(e) => updateConfig('email', 'from_name', e.target.value)}
                    />
                  </div>
                </div>

                {config.email.provider === 'smtp' && (
                  <div className="border border-gray-200 rounded-lg p-4 space-y-4">
                    <h4 className="font-medium text-gray-900">SMTP Configuration</h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          SMTP Host
                        </label>
                        <Input
                          value={config.email.smtp_host || ''}
                          onChange={(e) => updateConfig('email', 'smtp_host', e.target.value)}
                          placeholder="smtp.gmail.com"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          SMTP Port
                        </label>
                        <Input
                          type="number"
                          value={config.email.smtp_port || 587}
                          onChange={(e) => updateConfig('email', 'smtp_port', parseInt(e.target.value))}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Username
                        </label>
                        <Input
                          value={config.email.smtp_username || ''}
                          onChange={(e) => updateConfig('email', 'smtp_username', e.target.value)}
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Password
                        </label>
                        <div className="relative">
                          <Input
                            type={showSecrets ? 'text' : 'password'}
                            value={config.email.smtp_password || ''}
                            onChange={(e) => updateConfig('email', 'smtp_password', e.target.value)}
                          />
                          <button
                            type="button"
                            onClick={() => setShowSecrets(!showSecrets)}
                            className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                          >
                            {showSecrets ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex justify-end">
                  <Button onClick={testEmailConfig} variant="outline">
                    <Mail className="w-4 h-4 mr-2" />
                    Send Test Email
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Payment Settings */}
          {activeTab === 'payment' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CreditCard className="w-5 h-5 mr-2" />
                  Payment Configuration
                </CardTitle>
                <CardDescription>
                  Configure Stripe payment processing
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Stripe Publishable Key
                    </label>
                    <div className="relative">
                      <Input
                        type={showSecrets ? 'text' : 'password'}
                        value={config.payment.stripe_publishable_key}
                        onChange={(e) => updateConfig('payment', 'stripe_publishable_key', e.target.value)}
                        placeholder="pk_..."
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Stripe Secret Key
                    </label>
                    <div className="relative">
                      <Input
                        type={showSecrets ? 'text' : 'password'}
                        value={config.payment.stripe_secret_key}
                        onChange={(e) => updateConfig('payment', 'stripe_secret_key', e.target.value)}
                        placeholder="sk_..."
                      />
                      <button
                        type="button"
                        onClick={() => setShowSecrets(!showSecrets)}
                        className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                      >
                        {showSecrets ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Webhook Secret
                    </label>
                    <Input
                      type={showSecrets ? 'text' : 'password'}
                      value={config.payment.stripe_webhook_secret}
                      onChange={(e) => updateConfig('payment', 'stripe_webhook_secret', e.target.value)}
                      placeholder="whsec_..."
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Default Currency
                      </label>
                      <select
                        value={config.payment.default_currency}
                        onChange={(e) => updateConfig('payment', 'default_currency', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-admin-500 focus:border-admin-500"
                      >
                        <option value="USD">USD - US Dollar</option>
                        <option value="EUR">EUR - Euro</option>
                        <option value="GBP">GBP - British Pound</option>
                        <option value="CAD">CAD - Canadian Dollar</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div>
                      <h4 className="font-medium text-gray-900">Trial Enabled</h4>
                      <p className="text-sm text-gray-600">Allow free trial periods for new customers</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.payment.trial_enabled}
                        onChange={(e) => updateConfig('payment', 'trial_enabled', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-admin-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-admin-600"></div>
                    </label>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Security Settings */}
          {activeTab === 'security' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="w-5 h-5 mr-2" />
                  Security Configuration
                </CardTitle>
                <CardDescription>
                  Configure security policies and authentication settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Session Timeout (Hours)
                    </label>
                    <Input
                      type="number"
                      value={config.security.session_timeout_hours}
                      onChange={(e) => updateConfig('security', 'session_timeout_hours', parseInt(e.target.value))}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Minimum Password Length
                    </label>
                    <Input
                      type="number"
                      value={config.security.password_min_length}
                      onChange={(e) => updateConfig('security', 'password_min_length', parseInt(e.target.value))}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Rate Limit (Requests/Minute)
                    </label>
                    <Input
                      type="number"
                      value={config.security.rate_limit_requests_per_minute}
                      onChange={(e) => updateConfig('security', 'rate_limit_requests_per_minute', parseInt(e.target.value))}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div>
                      <h4 className="font-medium text-gray-900">Require Two-Factor Authentication</h4>
                      <p className="text-sm text-gray-600">Force all users to enable 2FA</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.security.require_2fa}
                        onChange={(e) => updateConfig('security', 'require_2fa', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-admin-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-admin-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div>
                      <h4 className="font-medium text-gray-900">Allow Social Login</h4>
                      <p className="text-sm text-gray-600">Enable login with Google, GitHub, etc.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.security.allow_social_login}
                        onChange={(e) => updateConfig('security', 'allow_social_login', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-admin-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-admin-600"></div>
                    </label>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Features Settings */}
          {activeTab === 'features' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Zap className="w-5 h-5 mr-2" />
                  Feature Configuration
                </CardTitle>
                <CardDescription>
                  Enable or disable platform features
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-900">AI Monitoring</h4>
                    <p className="text-sm text-gray-600">Enable AI-powered monitoring and auto-healing</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.features.ai_monitoring_enabled}
                      onChange={(e) => updateConfig('features', 'ai_monitoring_enabled', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-admin-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-admin-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-900">Analytics</h4>
                    <p className="text-sm text-gray-600">Enable detailed analytics and reporting</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.features.analytics_enabled}
                      onChange={(e) => updateConfig('features', 'analytics_enabled', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-admin-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-admin-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-900">API Access</h4>
                    <p className="text-sm text-gray-600">Enable REST API for integrations</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.features.api_access_enabled}
                      onChange={(e) => updateConfig('features', 'api_access_enabled', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-admin-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-admin-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-900">Webhooks</h4>
                    <p className="text-sm text-gray-600">Enable webhook notifications</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.features.webhooks_enabled}
                      onChange={(e) => updateConfig('features', 'webhooks_enabled', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-admin-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-admin-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-900">Support Chat</h4>
                    <p className="text-sm text-gray-600">Enable in-app support chat widget</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.features.support_chat_enabled}
                      onChange={(e) => updateConfig('features', 'support_chat_enabled', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-admin-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-admin-600"></div>
                  </label>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Limits Settings */}
          {activeTab === 'limits' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="w-5 h-5 mr-2" />
                  Platform Limits
                </CardTitle>
                <CardDescription>
                  Configure usage limits and quotas
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Max Organizations
                    </label>
                    <Input
                      type="number"
                      value={config.limits.max_organizations}
                      onChange={(e) => updateConfig('limits', 'max_organizations', parseInt(e.target.value))}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Max Users per Organization
                    </label>
                    <Input
                      type="number"
                      value={config.limits.max_users_per_org}
                      onChange={(e) => updateConfig('limits', 'max_users_per_org', parseInt(e.target.value))}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      API Rate Limit (per hour)
                    </label>
                    <Input
                      type="number"
                      value={config.limits.api_rate_limit}
                      onChange={(e) => updateConfig('limits', 'api_rate_limit', parseInt(e.target.value))}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Storage Limit (GB)
                    </label>
                    <Input
                      type="number"
                      value={config.limits.storage_limit_gb}
                      onChange={(e) => updateConfig('limits', 'storage_limit_gb', parseInt(e.target.value))}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}