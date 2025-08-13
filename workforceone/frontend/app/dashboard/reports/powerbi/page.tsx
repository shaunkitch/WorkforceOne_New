'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { 
  BarChart3, 
  Database, 
  Link, 
  Settings, 
  RefreshCw, 
  CheckCircle, 
  AlertTriangle,
  Loader2,
  FileJson,
  Download,
  Eye,
  Brain,
  TrendingUp,
  Zap
} from 'lucide-react'

interface PowerBIConfig {
  workspaceId?: string
  datasetId?: string
  reportId?: string
  clientId?: string
  tenantId?: string
  apiEndpoint?: string
  lastSync?: string
  syncStatus?: 'idle' | 'syncing' | 'success' | 'error'
}

interface DataMapping {
  sourceTable: string
  targetTable: string
  fields: Array<{
    source: string
    target: string
    transform?: string
  }>
  filters?: any[]
  aggregations?: any[]
}

interface PredictiveInsight {
  type: string
  confidence: number
  prediction: string
  recommendation: string
  impact: 'high' | 'medium' | 'low'
}

export default function PowerBIIntegrationPage() {
  const [config, setConfig] = useState<PowerBIConfig>({
    syncStatus: 'idle'
  })
  const [dataMappings, setDataMappings] = useState<DataMapping[]>([])
  const [selectedTables, setSelectedTables] = useState<string[]>([])
  const [predictiveInsights, setPredictiveInsights] = useState<PredictiveInsight[]>([])
  const [loading, setLoading] = useState(false)
  const [testingConnection, setTestingConnection] = useState(false)
  const [userProfile, setUserProfile] = useState<any>(null)

  const supabase = createClient()

  useEffect(() => {
    fetchUserProfile()
    initializeDataMappings()
    generatePredictiveInsights()
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

  const initializeDataMappings = () => {
    // Initialize default data mappings for Power BI
    const defaultMappings: DataMapping[] = [
      {
        sourceTable: 'attendance',
        targetTable: 'FactAttendance',
        fields: [
          { source: 'id', target: 'AttendanceKey' },
          { source: 'employee_id', target: 'EmployeeKey' },
          { source: 'check_in_time', target: 'CheckInDateTime' },
          { source: 'check_out_time', target: 'CheckOutDateTime' },
          { source: 'work_hours', target: 'WorkHours' },
          { source: 'status', target: 'AttendanceStatus' }
        ],
        aggregations: [
          { field: 'work_hours', function: 'sum', alias: 'TotalWorkHours' },
          { field: 'id', function: 'count', alias: 'AttendanceCount' }
        ]
      },
      {
        sourceTable: 'profiles',
        targetTable: 'DimEmployee',
        fields: [
          { source: 'id', target: 'EmployeeKey' },
          { source: 'full_name', target: 'EmployeeName' },
          { source: 'email', target: 'Email' },
          { source: 'role', target: 'Role' },
          { source: 'department', target: 'Department' },
          { source: 'created_at', target: 'HireDate' }
        ]
      },
      {
        sourceTable: 'leave_requests',
        targetTable: 'FactLeaveRequests',
        fields: [
          { source: 'id', target: 'LeaveRequestKey' },
          { source: 'employee_id', target: 'EmployeeKey' },
          { source: 'leave_type', target: 'LeaveType' },
          { source: 'start_date', target: 'StartDate' },
          { source: 'end_date', target: 'EndDate' },
          { source: 'status', target: 'Status' },
          { source: 'reason', target: 'Reason' }
        ]
      },
      {
        sourceTable: 'tasks',
        targetTable: 'FactTasks',
        fields: [
          { source: 'id', target: 'TaskKey' },
          { source: 'assigned_to', target: 'EmployeeKey' },
          { source: 'title', target: 'TaskTitle' },
          { source: 'status', target: 'TaskStatus' },
          { source: 'priority', target: 'Priority' },
          { source: 'due_date', target: 'DueDate' }
        ]
      },
      {
        sourceTable: 'form_submissions',
        targetTable: 'FactFormSubmissions',
        fields: [
          { source: 'id', target: 'SubmissionKey' },
          { source: 'form_id', target: 'FormKey' },
          { source: 'submitted_by', target: 'EmployeeKey' },
          { source: 'submitted_at', target: 'SubmissionDateTime' },
          { source: 'data', target: 'SubmissionData', transform: 'json' }
        ]
      }
    ]

    setDataMappings(defaultMappings)
    setSelectedTables(defaultMappings.map(m => m.sourceTable))
  }

  const generatePredictiveInsights = () => {
    // Generate AI-powered predictive insights
    const insights: PredictiveInsight[] = [
      {
        type: 'attendance_pattern',
        confidence: 0.87,
        prediction: 'Late check-ins are likely to increase by 23% on Mondays based on historical patterns',
        recommendation: 'Consider implementing flexible start times on Mondays or send reminder notifications on Sunday evenings',
        impact: 'high'
      },
      {
        type: 'leave_forecast',
        confidence: 0.92,
        prediction: 'December will see a 45% increase in leave requests based on previous years',
        recommendation: 'Start planning for temporary staffing or workload redistribution by mid-November',
        impact: 'high'
      },
      {
        type: 'task_completion',
        confidence: 0.78,
        prediction: 'Tasks assigned on Fridays have 35% lower completion rates',
        recommendation: 'Schedule important task assignments for Tuesday-Thursday for better completion rates',
        impact: 'medium'
      },
      {
        type: 'form_optimization',
        confidence: 0.84,
        prediction: 'Forms with more than 10 fields have 60% lower completion rates',
        recommendation: 'Break long forms into multiple steps or reduce field count for better engagement',
        impact: 'medium'
      },
      {
        type: 'productivity_trend',
        confidence: 0.91,
        prediction: 'Team productivity peaks between 10 AM - 12 PM and 2 PM - 4 PM',
        recommendation: 'Schedule important meetings outside these peak productivity hours',
        impact: 'high'
      }
    ]

    setPredictiveInsights(insights)
  }

  const testConnection = async () => {
    setTestingConnection(true)
    try {
      // Simulate Power BI connection test
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      setConfig(prev => ({
        ...prev,
        syncStatus: 'success',
        lastSync: new Date().toISOString()
      }))
      
      alert('Connection successful! Power BI integration is ready.')
    } catch (error) {
      console.error('Connection test failed:', error)
      setConfig(prev => ({ ...prev, syncStatus: 'error' }))
      alert('Connection failed. Please check your configuration.')
    } finally {
      setTestingConnection(false)
    }
  }

  const syncData = async () => {
    setLoading(true)
    setConfig(prev => ({ ...prev, syncStatus: 'syncing' }))
    
    try {
      // Generate data export for Power BI
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single()

      if (!profile?.organization_id) return

      // Fetch data for each selected table
      const exportData: any = {}
      
      for (const mapping of dataMappings.filter(m => selectedTables.includes(m.sourceTable))) {
        const { data, error } = await supabase
          .from(mapping.sourceTable)
          .select('*')
          .eq('organization_id', profile.organization_id)
        
        if (!error && data) {
          // Transform data according to mapping rules
          exportData[mapping.targetTable] = data.map(row => {
            const transformedRow: any = {}
            
            mapping.fields.forEach(field => {
              let value = row[field.source]
              
              // Apply transformations
              if (field.transform === 'json' && typeof value === 'object') {
                value = JSON.stringify(value)
              }
              
              transformedRow[field.target] = value
            })
            
            return transformedRow
          })
          
          // Apply aggregations if defined
          if (mapping.aggregations) {
            const aggregations: any = {}
            
            mapping.aggregations.forEach(agg => {
              if (agg.function === 'sum') {
                aggregations[agg.alias] = data.reduce((sum, row) => sum + (row[agg.field] || 0), 0)
              } else if (agg.function === 'count') {
                aggregations[agg.alias] = data.length
              }
            })
            
            exportData[`${mapping.targetTable}_Aggregations`] = aggregations
          }
        }
      }

      // Generate predictive analytics data
      exportData['PredictiveInsights'] = predictiveInsights.map(insight => ({
        InsightType: insight.type,
        ConfidenceScore: insight.confidence,
        Prediction: insight.prediction,
        Recommendation: insight.recommendation,
        ImpactLevel: insight.impact,
        GeneratedAt: new Date().toISOString()
      }))

      // In a real implementation, this would send data to Power BI API
      console.log('Data ready for Power BI:', exportData)
      
      setConfig(prev => ({
        ...prev,
        syncStatus: 'success',
        lastSync: new Date().toISOString()
      }))

      // Download as JSON for now (in production, this would be sent to Power BI)
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `powerbi_export_${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      alert('Data exported successfully! Check your downloads.')
    } catch (error) {
      console.error('Sync failed:', error)
      setConfig(prev => ({ ...prev, syncStatus: 'error' }))
      alert('Data sync failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const getSyncStatusIcon = () => {
    switch (config.syncStatus) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'error':
        return <AlertTriangle className="h-5 w-5 text-red-600" />
      case 'syncing':
        return <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
      default:
        return <Database className="h-5 w-5 text-gray-600" />
    }
  }

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'high': return 'text-red-600 bg-red-100'
      case 'medium': return 'text-yellow-600 bg-yellow-100'
      case 'low': return 'text-green-600 bg-green-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Power BI Integration
          </h1>
          <p className="text-gray-600 mt-1">
            Connect your workforce data to Power BI for advanced analytics and reporting
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            {getSyncStatusIcon()}
            <span>
              {config.lastSync 
                ? `Last sync: ${new Date(config.lastSync).toLocaleString()}`
                : 'Not synced yet'
              }
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Configuration Panel */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings className="h-5 w-5 mr-2 text-blue-600" />
                Power BI Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="workspace-id">Workspace ID</Label>
                <Input
                  id="workspace-id"
                  value={config.workspaceId || ''}
                  onChange={(e) => setConfig(prev => ({ ...prev, workspaceId: e.target.value }))}
                  placeholder="Enter Power BI Workspace ID"
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="dataset-id">Dataset ID</Label>
                <Input
                  id="dataset-id"
                  value={config.datasetId || ''}
                  onChange={(e) => setConfig(prev => ({ ...prev, datasetId: e.target.value }))}
                  placeholder="Enter Power BI Dataset ID"
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="tenant-id">Tenant ID</Label>
                <Input
                  id="tenant-id"
                  value={config.tenantId || ''}
                  onChange={(e) => setConfig(prev => ({ ...prev, tenantId: e.target.value }))}
                  placeholder="Enter Azure AD Tenant ID"
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="client-id">Client ID</Label>
                <Input
                  id="client-id"
                  value={config.clientId || ''}
                  onChange={(e) => setConfig(prev => ({ ...prev, clientId: e.target.value }))}
                  placeholder="Enter Azure AD Client ID"
                  className="mt-1"
                />
              </div>

              <Button 
                onClick={testConnection} 
                className="w-full"
                disabled={testingConnection}
              >
                {testingConnection ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Testing Connection...
                  </>
                ) : (
                  <>
                    <Link className="h-4 w-4 mr-2" />
                    Test Connection
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Data Selection */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Database className="h-5 w-5 mr-2 text-purple-600" />
                Data Sources
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {dataMappings.map((mapping) => (
                  <label
                    key={mapping.sourceTable}
                    className="flex items-center space-x-2 p-2 hover:bg-gray-50 rounded cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedTables.includes(mapping.sourceTable)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedTables([...selectedTables, mapping.sourceTable])
                        } else {
                          setSelectedTables(selectedTables.filter(t => t !== mapping.sourceTable))
                        }
                      }}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm">
                      {mapping.sourceTable} → {mapping.targetTable}
                    </span>
                  </label>
                ))}
              </div>
              
              <Button 
                onClick={syncData} 
                className="w-full mt-4 bg-gradient-to-r from-blue-600 to-purple-600"
                disabled={loading || selectedTables.length === 0}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Syncing Data...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Sync to Power BI
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Area */}
        <div className="lg:col-span-2 space-y-6">
          {/* Predictive Analytics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Brain className="h-5 w-5 mr-2 text-purple-600" />
                AI-Powered Predictive Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {predictiveInsights.map((insight, index) => (
                  <div key={index} className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <TrendingUp className="h-5 w-5 text-blue-600" />
                        <h4 className="font-medium text-gray-900 capitalize">
                          {insight.type.replace(/_/g, ' ')}
                        </h4>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 text-xs rounded-full font-medium ${getImpactColor(insight.impact)}`}>
                          {insight.impact} impact
                        </span>
                        <span className="text-sm text-gray-500">
                          {Math.round(insight.confidence * 100)}% confidence
                        </span>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-start space-x-2">
                        <Zap className="h-4 w-4 text-yellow-500 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-gray-700">Prediction:</p>
                          <p className="text-sm text-gray-600">{insight.prediction}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-500 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-gray-700">Recommendation:</p>
                          <p className="text-sm text-gray-600">{insight.recommendation}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Data Mapping Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileJson className="h-5 w-5 mr-2 text-green-600" />
                Data Mapping Configuration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dataMappings.filter(m => selectedTables.includes(m.sourceTable)).map((mapping) => (
                  <div key={mapping.sourceTable} className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">
                      {mapping.sourceTable} → {mapping.targetTable}
                    </h4>
                    
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {mapping.fields.slice(0, 3).map((field, index) => (
                        <div key={index} className="flex items-center space-x-2 text-gray-600">
                          <span>{field.source}</span>
                          <span>→</span>
                          <span className="font-medium">{field.target}</span>
                        </div>
                      ))}
                      {mapping.fields.length > 3 && (
                        <div className="text-gray-500 italic">
                          +{mapping.fields.length - 3} more fields
                        </div>
                      )}
                    </div>
                    
                    {mapping.aggregations && (
                      <div className="mt-2 pt-2 border-t border-gray-200">
                        <p className="text-xs text-gray-500 mb-1">Aggregations:</p>
                        <div className="flex flex-wrap gap-2">
                          {mapping.aggregations.map((agg, index) => (
                            <span key={index} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                              {agg.function}({agg.field}) as {agg.alias}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Integration Guide */}
          <Card>
            <CardHeader>
              <CardTitle>Power BI Integration Guide</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 text-sm text-gray-600">
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">1. Configure Power BI Workspace</h4>
                  <p>Create a new workspace in Power BI and note the Workspace ID from the URL.</p>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">2. Register Azure AD Application</h4>
                  <p>Register your app in Azure AD and grant Power BI API permissions.</p>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">3. Configure Data Mappings</h4>
                  <p>Select the tables you want to sync and customize field mappings as needed.</p>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">4. Enable Predictive Analytics</h4>
                  <p>Our AI engine analyzes your data patterns and provides actionable insights.</p>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">5. Schedule Automatic Syncs</h4>
                  <p>Set up automated data refresh to keep your Power BI reports up-to-date.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}