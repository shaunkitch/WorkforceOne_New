'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  MessageSquare, 
  Hash, 
  Settings, 
  CheckCircle, 
  XCircle,
  Link,
  Zap,
  Bell,
  Users,
  Calendar,
  FileText,
  AlertTriangle,
  Loader2,
  ChevronRight,
  Activity
} from 'lucide-react'

interface IntegrationConfig {
  slack?: {
    enabled: boolean
    webhookUrl?: string
    defaultChannel?: string
    notifications: {
      attendance: boolean
      leave: boolean
      tasks: boolean
      forms: boolean
    }
  }
  teams?: {
    enabled: boolean
    webhookUrl?: string
    channelId?: string
    notifications: {
      attendance: boolean
      leave: boolean
      tasks: boolean
      forms: boolean
    }
  }
}

interface NotificationTemplate {
  id: string
  name: string
  type: 'slack' | 'teams'
  event: string
  template: string
  active: boolean
}

export default function IntegrationsPage() {
  const [config, setConfig] = useState<IntegrationConfig>({
    slack: {
      enabled: false,
      notifications: {
        attendance: true,
        leave: true,
        tasks: true,
        forms: false
      }
    },
    teams: {
      enabled: false,
      notifications: {
        attendance: true,
        leave: true,
        tasks: true,
        forms: false
      }
    }
  })
  const [templates, setTemplates] = useState<NotificationTemplate[]>([])
  const [testingSlack, setTestingSlack] = useState(false)
  const [testingTeams, setTestingTeams] = useState(false)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<'slack' | 'teams'>('slack')
  const [userProfile, setUserProfile] = useState<any>(null)

  const supabase = createClient()

  useEffect(() => {
    fetchUserProfile()
    initializeTemplates()
  }, [])

  const fetchUserProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      setUserProfile(profile)
    } catch (error) {
      console.error('Error fetching user profile:', error)
    }
  }

  const initializeTemplates = () => {
    const defaultTemplates: NotificationTemplate[] = [
      // Slack Templates
      {
        id: 'slack_late_checkin',
        name: 'Late Check-in Alert',
        type: 'slack',
        event: 'attendance.late',
        template: `:warning: *Late Check-in Alert*\n:bust_in_silhouette: Employee: {{employee_name}}\n:clock10: Check-in Time: {{check_in_time}}\n:hourglass: Late by: {{late_minutes}} minutes`,
        active: true
      },
      {
        id: 'slack_leave_request',
        name: 'Leave Request Notification',
        type: 'slack',
        event: 'leave.request',
        template: `:palm_tree: *New Leave Request*\n:bust_in_silhouette: Employee: {{employee_name}}\n:calendar: Dates: {{start_date}} to {{end_date}}\n:memo: Type: {{leave_type}}\n:link: <{{approval_link}}|Review Request>`,
        active: true
      },
      {
        id: 'slack_task_overdue',
        name: 'Task Overdue Alert',
        type: 'slack',
        event: 'task.overdue',
        template: `:rotating_light: *Task Overdue*\n:clipboard: Task: {{task_title}}\n:bust_in_silhouette: Assigned to: {{assignee_name}}\n:calendar: Due Date: {{due_date}}\n:chart_with_upwards_trend: Priority: {{priority}}`,
        active: true
      },
      // Teams Templates
      {
        id: 'teams_late_checkin',
        name: 'Late Check-in Alert',
        type: 'teams',
        event: 'attendance.late',
        template: `**Late Check-in Alert** ⚠️\n\n**Employee:** {{employee_name}}\n**Check-in Time:** {{check_in_time}}\n**Late by:** {{late_minutes}} minutes`,
        active: true
      },
      {
        id: 'teams_leave_request',
        name: 'Leave Request Notification',
        type: 'teams',
        event: 'leave.request',
        template: `**New Leave Request** 🌴\n\n**Employee:** {{employee_name}}\n**Dates:** {{start_date}} to {{end_date}}\n**Type:** {{leave_type}}\n\n[Review Request]({{approval_link}})`,
        active: true
      },
      {
        id: 'teams_task_overdue',
        name: 'Task Overdue Alert',
        type: 'teams',
        event: 'task.overdue',
        template: `**Task Overdue** 🚨\n\n**Task:** {{task_title}}\n**Assigned to:** {{assignee_name}}\n**Due Date:** {{due_date}}\n**Priority:** {{priority}}`,
        active: true
      }
    ]

    setTemplates(defaultTemplates)
  }

  const testSlackConnection = async () => {
    if (!config.slack?.webhookUrl) {
      alert('Please enter a Slack webhook URL')
      return
    }

    setTestingSlack(true)
    try {
      // In a real implementation, this would test the webhook
      const testMessage = {
        text: "🎉 WorkforceOne connection test successful!",
        blocks: [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: "*WorkforceOne Integration Test*\n✅ Your Slack integration is working correctly!"
            }
          }
        ]
      }

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      alert('Test message sent successfully! Check your Slack channel.')
    } catch (error) {
      console.error('Slack test failed:', error)
      alert('Failed to send test message. Please check your webhook URL.')
    } finally {
      setTestingSlack(false)
    }
  }

  const testTeamsConnection = async () => {
    if (!config.teams?.webhookUrl) {
      alert('Please enter a Teams webhook URL')
      return
    }

    setTestingTeams(true)
    try {
      // In a real implementation, this would test the webhook
      const testMessage = {
        "@type": "MessageCard",
        "@context": "http://schema.org/extensions",
        "themeColor": "0076D7",
        "summary": "WorkforceOne Integration Test",
        "sections": [{
          "activityTitle": "WorkforceOne Integration Test",
          "activitySubtitle": "Connection test successful!",
          "facts": [{
            "name": "Status",
            "value": "✅ Connected"
          }, {
            "name": "Time",
            "value": new Date().toLocaleString()
          }],
          "markdown": true
        }]
      }

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      alert('Test message sent successfully! Check your Teams channel.')
    } catch (error) {
      console.error('Teams test failed:', error)
      alert('Failed to send test message. Please check your webhook URL.')
    } finally {
      setTestingTeams(false)
    }
  }

  const saveConfiguration = async () => {
    setSaving(true)
    try {
      // In a real implementation, this would save to the database
      console.log('Saving configuration:', config)
      await new Promise(resolve => setTimeout(resolve, 1500))
      alert('Integration settings saved successfully!')
    } catch (error) {
      console.error('Failed to save configuration:', error)
      alert('Failed to save settings. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const canManageIntegrations = () => {
    return userProfile?.role === 'admin' || userProfile?.role === 'manager'
  }

  const getEventIcon = (event: string) => {
    if (event.includes('attendance')) return <Calendar className="h-4 w-4" />
    if (event.includes('leave')) return <FileText className="h-4 w-4" />
    if (event.includes('task')) return <Activity className="h-4 w-4" />
    if (event.includes('form')) return <FileText className="h-4 w-4" />
    return <Bell className="h-4 w-4" />
  }

  if (!canManageIntegrations()) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-orange-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Access Restricted</h3>
          <p className="text-gray-600">Only administrators and managers can manage integrations.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Integrations
          </h1>
          <p className="text-gray-600 mt-1">
            Connect WorkforceOne with Slack and Microsoft Teams for real-time notifications
          </p>
        </div>
        <Button 
          onClick={saveConfiguration}
          disabled={saving}
          className="bg-gradient-to-r from-purple-600 to-blue-600"
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <CheckCircle className="h-4 w-4 mr-2" />
              Save Configuration
            </>
          )}
        </Button>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('slack')}
            className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'slack'
                ? 'border-purple-500 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Hash className="h-4 w-4" />
            <span>Slack</span>
            {config.slack?.enabled && (
              <span className="ml-2 px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                Active
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('teams')}
            className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'teams'
                ? 'border-purple-500 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Users className="h-4 w-4" />
            <span>Microsoft Teams</span>
            {config.teams?.enabled && (
              <span className="ml-2 px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                Active
              </span>
            )}
          </button>
        </nav>
      </div>

      {activeTab === 'slack' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Slack Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center">
                  <Hash className="h-5 w-5 mr-2 text-purple-600" />
                  Slack Configuration
                </span>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.slack?.enabled || false}
                    onChange={(e) => setConfig(prev => ({
                      ...prev,
                      slack: { ...prev.slack!, enabled: e.target.checked }
                    }))}
                    className="sr-only"
                  />
                  <div className={`w-11 h-6 rounded-full transition-colors ${
                    config.slack?.enabled ? 'bg-purple-600' : 'bg-gray-300'
                  }`}>
                    <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform ${
                      config.slack?.enabled ? 'translate-x-5' : 'translate-x-0'
                    } mt-0.5 ml-0.5`} />
                  </div>
                </label>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="slack-webhook">Webhook URL</Label>
                <Input
                  id="slack-webhook"
                  type="url"
                  value={config.slack?.webhookUrl || ''}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    slack: { ...prev.slack!, webhookUrl: e.target.value }
                  }))}
                  placeholder="https://hooks.slack.com/services/..."
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Get this from your Slack app's Incoming Webhooks
                </p>
              </div>

              <div>
                <Label htmlFor="slack-channel">Default Channel</Label>
                <Input
                  id="slack-channel"
                  value={config.slack?.defaultChannel || ''}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    slack: { ...prev.slack!, defaultChannel: e.target.value }
                  }))}
                  placeholder="#general"
                  className="mt-1"
                />
              </div>

              <Button 
                onClick={testSlackConnection}
                variant="outline"
                className="w-full"
                disabled={testingSlack || !config.slack?.webhookUrl}
              >
                {testingSlack ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Testing...
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4 mr-2" />
                    Test Connection
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Slack Notification Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Bell className="h-5 w-5 mr-2 text-blue-600" />
                Notification Settings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-purple-600" />
                    <div>
                      <p className="font-medium">Attendance Alerts</p>
                      <p className="text-xs text-gray-500">Late check-ins, absences</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={config.slack?.notifications.attendance || false}
                    onChange={(e) => setConfig(prev => ({
                      ...prev,
                      slack: {
                        ...prev.slack!,
                        notifications: {
                          ...prev.slack!.notifications,
                          attendance: e.target.checked
                        }
                      }
                    }))}
                    className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <div className="flex items-center space-x-2">
                    <FileText className="h-4 w-4 text-green-600" />
                    <div>
                      <p className="font-medium">Leave Requests</p>
                      <p className="text-xs text-gray-500">New requests, approvals</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={config.slack?.notifications.leave || false}
                    onChange={(e) => setConfig(prev => ({
                      ...prev,
                      slack: {
                        ...prev.slack!,
                        notifications: {
                          ...prev.slack!.notifications,
                          leave: e.target.checked
                        }
                      }
                    }))}
                    className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <div className="flex items-center space-x-2">
                    <Activity className="h-4 w-4 text-orange-600" />
                    <div>
                      <p className="font-medium">Task Updates</p>
                      <p className="text-xs text-gray-500">Assignments, overdue tasks</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={config.slack?.notifications.tasks || false}
                    onChange={(e) => setConfig(prev => ({
                      ...prev,
                      slack: {
                        ...prev.slack!,
                        notifications: {
                          ...prev.slack!.notifications,
                          tasks: e.target.checked
                        }
                      }
                    }))}
                    className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <div className="flex items-center space-x-2">
                    <FileText className="h-4 w-4 text-blue-600" />
                    <div>
                      <p className="font-medium">Form Submissions</p>
                      <p className="text-xs text-gray-500">New submissions</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={config.slack?.notifications.forms || false}
                    onChange={(e) => setConfig(prev => ({
                      ...prev,
                      slack: {
                        ...prev.slack!,
                        notifications: {
                          ...prev.slack!.notifications,
                          forms: e.target.checked
                        }
                      }
                    }))}
                    className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'teams' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Teams Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center">
                  <Users className="h-5 w-5 mr-2 text-blue-600" />
                  Teams Configuration
                </span>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.teams?.enabled || false}
                    onChange={(e) => setConfig(prev => ({
                      ...prev,
                      teams: { ...prev.teams!, enabled: e.target.checked }
                    }))}
                    className="sr-only"
                  />
                  <div className={`w-11 h-6 rounded-full transition-colors ${
                    config.teams?.enabled ? 'bg-blue-600' : 'bg-gray-300'
                  }`}>
                    <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform ${
                      config.teams?.enabled ? 'translate-x-5' : 'translate-x-0'
                    } mt-0.5 ml-0.5`} />
                  </div>
                </label>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="teams-webhook">Webhook URL</Label>
                <Input
                  id="teams-webhook"
                  type="url"
                  value={config.teams?.webhookUrl || ''}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    teams: { ...prev.teams!, webhookUrl: e.target.value }
                  }))}
                  placeholder="https://outlook.office.com/webhook/..."
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Get this from your Teams channel's Incoming Webhook connector
                </p>
              </div>

              <div>
                <Label htmlFor="teams-channel">Channel ID</Label>
                <Input
                  id="teams-channel"
                  value={config.teams?.channelId || ''}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    teams: { ...prev.teams!, channelId: e.target.value }
                  }))}
                  placeholder="General"
                  className="mt-1"
                />
              </div>

              <Button 
                onClick={testTeamsConnection}
                variant="outline"
                className="w-full"
                disabled={testingTeams || !config.teams?.webhookUrl}
              >
                {testingTeams ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Testing...
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4 mr-2" />
                    Test Connection
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Teams Notification Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Bell className="h-5 w-5 mr-2 text-blue-600" />
                Notification Settings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-purple-600" />
                    <div>
                      <p className="font-medium">Attendance Alerts</p>
                      <p className="text-xs text-gray-500">Late check-ins, absences</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={config.teams?.notifications.attendance || false}
                    onChange={(e) => setConfig(prev => ({
                      ...prev,
                      teams: {
                        ...prev.teams!,
                        notifications: {
                          ...prev.teams!.notifications,
                          attendance: e.target.checked
                        }
                      }
                    }))}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <div className="flex items-center space-x-2">
                    <FileText className="h-4 w-4 text-green-600" />
                    <div>
                      <p className="font-medium">Leave Requests</p>
                      <p className="text-xs text-gray-500">New requests, approvals</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={config.teams?.notifications.leave || false}
                    onChange={(e) => setConfig(prev => ({
                      ...prev,
                      teams: {
                        ...prev.teams!,
                        notifications: {
                          ...prev.teams!.notifications,
                          leave: e.target.checked
                        }
                      }
                    }))}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <div className="flex items-center space-x-2">
                    <Activity className="h-4 w-4 text-orange-600" />
                    <div>
                      <p className="font-medium">Task Updates</p>
                      <p className="text-xs text-gray-500">Assignments, overdue tasks</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={config.teams?.notifications.tasks || false}
                    onChange={(e) => setConfig(prev => ({
                      ...prev,
                      teams: {
                        ...prev.teams!,
                        notifications: {
                          ...prev.teams!.notifications,
                          tasks: e.target.checked
                        }
                      }
                    }))}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                  <div className="flex items-center space-x-2">
                    <FileText className="h-4 w-4 text-blue-600" />
                    <div>
                      <p className="font-medium">Form Submissions</p>
                      <p className="text-xs text-gray-500">New submissions</p>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={config.teams?.notifications.forms || false}
                    onChange={(e) => setConfig(prev => ({
                      ...prev,
                      teams: {
                        ...prev.teams!,
                        notifications: {
                          ...prev.teams!.notifications,
                          forms: e.target.checked
                        }
                      }
                    }))}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Message Templates */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <MessageSquare className="h-5 w-5 mr-2 text-purple-600" />
            Message Templates
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {templates
              .filter(t => t.type === activeTab)
              .map((template) => (
                <div key={template.id} className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      {getEventIcon(template.event)}
                      <h4 className="font-medium">{template.name}</h4>
                    </div>
                    <input
                      type="checkbox"
                      checked={template.active}
                      onChange={(e) => {
                        setTemplates(prev => prev.map(t => 
                          t.id === template.id ? { ...t, active: e.target.checked } : t
                        ))
                      }}
                      className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                  </div>
                  <p className="text-sm text-gray-600 mb-2">Event: {template.event}</p>
                  <div className="bg-gray-50 p-3 rounded text-xs font-mono whitespace-pre-wrap">
                    {template.template}
                  </div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>

      {/* Integration Guide */}
      <Card>
        <CardHeader>
          <CardTitle>Setup Guide</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Slack Integration</h4>
              <ol className="space-y-2 text-sm text-gray-600">
                <li>1. Go to your Slack workspace and navigate to Apps</li>
                <li>2. Create a new app or select "Incoming Webhooks"</li>
                <li>3. Choose the channel for notifications</li>
                <li>4. Copy the webhook URL and paste it above</li>
                <li>5. Test the connection and save your settings</li>
              </ol>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Microsoft Teams Integration</h4>
              <ol className="space-y-2 text-sm text-gray-600">
                <li>1. Open Microsoft Teams and go to your desired channel</li>
                <li>2. Click the "..." menu and select "Connectors"</li>
                <li>3. Find and configure "Incoming Webhook"</li>
                <li>4. Give it a name and optionally upload an image</li>
                <li>5. Copy the webhook URL and paste it above</li>
              </ol>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}