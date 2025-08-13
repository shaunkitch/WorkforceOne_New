'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { createDraggableProps, createDropZoneProps, DragItem } from '@/lib/drag-drop'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  BarChart3, 
  Plus, 
  Save, 
  Play, 
  Download, 
  Settings, 
  Trash2, 
  Eye,
  GripVertical,
  Users,
  Clock,
  Calendar,
  TrendingUp,
  PieChart,
  Activity,
  Loader2,
  ChevronDown,
  ChevronRight
} from 'lucide-react'

interface ReportField {
  id: string
  name: string
  type: 'text' | 'number' | 'date' | 'boolean'
  table: string
  field: string
  label: string
  aggregation?: 'count' | 'sum' | 'avg' | 'min' | 'max'
}

interface ReportFilter {
  id: string
  field: string
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'between'
  value: any
  label: string
}

interface ReportVisualization {
  id: string
  type: 'table' | 'bar_chart' | 'line_chart' | 'pie_chart' | 'metric_card'
  title: string
  fields: string[]
  config: any
}

interface CustomReport {
  id?: string
  name: string
  description: string
  fields: ReportField[]
  filters: ReportFilter[]
  visualizations: ReportVisualization[]
  created_at?: string
  updated_at?: string
}

export default function ReportBuilderPage() {
  const [report, setReport] = useState<CustomReport>({
    name: '',
    description: '',
    fields: [],
    filters: [],
    visualizations: []
  })
  const [availableFields, setAvailableFields] = useState<ReportField[]>([])
  const [previewData, setPreviewData] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<'fields' | 'filters' | 'visualizations' | 'preview'>('fields')
  const [userProfile, setUserProfile] = useState<any>(null)

  const supabase = createClient()

  useEffect(() => {
    fetchUserProfile()
    initializeAvailableFields()
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

  const initializeAvailableFields = () => {
    // Define available fields from different tables
    const fields: ReportField[] = [
      // Attendance fields
      { id: 'att_1', name: 'Check-in Time', type: 'date', table: 'attendance', field: 'check_in_time', label: 'Check-in Time' },
      { id: 'att_2', name: 'Check-out Time', type: 'date', table: 'attendance', field: 'check_out_time', label: 'Check-out Time' },
      { id: 'att_3', name: 'Work Hours', type: 'number', table: 'attendance', field: 'work_hours', label: 'Work Hours', aggregation: 'sum' },
      { id: 'att_4', name: 'Status', type: 'text', table: 'attendance', field: 'status', label: 'Attendance Status' },
      { id: 'att_5', name: 'Total Attendance', type: 'number', table: 'attendance', field: 'id', label: 'Total Records', aggregation: 'count' },
      
      // Employee fields
      { id: 'emp_1', name: 'Employee Name', type: 'text', table: 'profiles', field: 'full_name', label: 'Employee Name' },
      { id: 'emp_2', name: 'Email', type: 'text', table: 'profiles', field: 'email', label: 'Email' },
      { id: 'emp_3', name: 'Role', type: 'text', table: 'profiles', field: 'role', label: 'Role' },
      { id: 'emp_4', name: 'Department', type: 'text', table: 'profiles', field: 'department', label: 'Department' },
      { id: 'emp_5', name: 'Hire Date', type: 'date', table: 'profiles', field: 'created_at', label: 'Hire Date' },
      { id: 'emp_6', name: 'Total Employees', type: 'number', table: 'profiles', field: 'id', label: 'Employee Count', aggregation: 'count' },
      
      // Leave fields
      { id: 'leave_1', name: 'Leave Type', type: 'text', table: 'leave_requests', field: 'leave_type', label: 'Leave Type' },
      { id: 'leave_2', name: 'Start Date', type: 'date', table: 'leave_requests', field: 'start_date', label: 'Leave Start' },
      { id: 'leave_3', name: 'End Date', type: 'date', table: 'leave_requests', field: 'end_date', label: 'Leave End' },
      { id: 'leave_4', name: 'Status', type: 'text', table: 'leave_requests', field: 'status', label: 'Leave Status' },
      { id: 'leave_5', name: 'Total Leave Requests', type: 'number', table: 'leave_requests', field: 'id', label: 'Leave Count', aggregation: 'count' },
      
      // Task fields
      { id: 'task_1', name: 'Task Title', type: 'text', table: 'tasks', field: 'title', label: 'Task Title' },
      { id: 'task_2', name: 'Task Status', type: 'text', table: 'tasks', field: 'status', label: 'Task Status' },
      { id: 'task_3', name: 'Priority', type: 'text', table: 'tasks', field: 'priority', label: 'Priority' },
      { id: 'task_4', name: 'Due Date', type: 'date', table: 'tasks', field: 'due_date', label: 'Due Date' },
      { id: 'task_5', name: 'Total Tasks', type: 'number', table: 'tasks', field: 'id', label: 'Task Count', aggregation: 'count' }
    ]

    setAvailableFields(fields)
  }

  const addField = (field: ReportField) => {
    if (!report.fields.find(f => f.id === field.id)) {
      setReport(prev => ({
        ...prev,
        fields: [...prev.fields, field]
      }))
    }
  }

  const removeField = (fieldId: string) => {
    setReport(prev => ({
      ...prev,
      fields: prev.fields.filter(f => f.id !== fieldId)
    }))
  }

  const addFilter = () => {
    const newFilter: ReportFilter = {
      id: `filter_${Date.now()}`,
      field: '',
      operator: 'equals',
      value: '',
      label: 'New Filter'
    }
    
    setReport(prev => ({
      ...prev,
      filters: [...prev.filters, newFilter]
    }))
  }

  const updateFilter = (filterId: string, updates: Partial<ReportFilter>) => {
    setReport(prev => ({
      ...prev,
      filters: prev.filters.map(f => 
        f.id === filterId ? { ...f, ...updates } : f
      )
    }))
  }

  const removeFilter = (filterId: string) => {
    setReport(prev => ({
      ...prev,
      filters: prev.filters.filter(f => f.id !== filterId)
    }))
  }

  const addVisualization = (type: ReportVisualization['type']) => {
    const newViz: ReportVisualization = {
      id: `viz_${Date.now()}`,
      type,
      title: `New ${type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}`,
      fields: [],
      config: {}
    }
    
    setReport(prev => ({
      ...prev,
      visualizations: [...prev.visualizations, newViz]
    }))
  }

  const updateVisualization = (vizId: string, updates: Partial<ReportVisualization>) => {
    setReport(prev => ({
      ...prev,
      visualizations: prev.visualizations.map(v => 
        v.id === vizId ? { ...v, ...updates } : v
      )
    }))
  }

  const removeVisualization = (vizId: string) => {
    setReport(prev => ({
      ...prev,
      visualizations: prev.visualizations.filter(v => v.id !== vizId)
    }))
  }

  const generatePreview = async () => {
    setLoading(true)
    try {
      // Generate mock preview data based on selected fields
      const mockData = []
      for (let i = 0; i < 10; i++) {
        const row: any = {}
        report.fields.forEach(field => {
          switch (field.type) {
            case 'text':
              row[field.id] = `Sample ${field.label} ${i + 1}`
              break
            case 'number':
              row[field.id] = Math.floor(Math.random() * 100) + 1
              break
            case 'date':
              row[field.id] = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
              break
            case 'boolean':
              row[field.id] = Math.random() > 0.5
              break
          }
        })
        mockData.push(row)
      }
      
      setPreviewData(mockData)
    } catch (error) {
      console.error('Error generating preview:', error)
    } finally {
      setLoading(false)
    }
  }

  const saveReport = async () => {
    setSaving(true)
    try {
      // In a real implementation, this would save to the database
      console.log('Saving report:', report)
      alert('Report saved successfully!')
    } catch (error) {
      console.error('Error saving report:', error)
      alert('Failed to save report')
    } finally {
      setSaving(false)
    }
  }

  const getFieldIcon = (table: string) => {
    switch (table) {
      case 'attendance': return <Clock className="h-4 w-4" />
      case 'profiles': return <Users className="h-4 w-4" />
      case 'leave_requests': return <Calendar className="h-4 w-4" />
      case 'tasks': return <Activity className="h-4 w-4" />
      default: return <BarChart3 className="h-4 w-4" />
    }
  }

  const getVisualizationIcon = (type: string) => {
    switch (type) {
      case 'bar_chart': return <BarChart3 className="h-4 w-4" />
      case 'line_chart': return <TrendingUp className="h-4 w-4" />
      case 'pie_chart': return <PieChart className="h-4 w-4" />
      case 'metric_card': return <Activity className="h-4 w-4" />
      default: return <BarChart3 className="h-4 w-4" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Custom Report Builder
          </h1>
          <p className="text-gray-600 mt-1">
            Build dynamic reports with drag-and-drop interface
          </p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline" onClick={generatePreview} disabled={loading || report.fields.length === 0}>
            {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Eye className="h-4 w-4 mr-2" />}
            Preview
          </Button>
          <Button onClick={saveReport} disabled={saving || !report.name}>
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Save Report
          </Button>
        </div>
      </div>

      {/* Report Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle>Report Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="report-name">Report Name</Label>
              <Input
                id="report-name"
                value={report.name}
                onChange={(e) => setReport(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter report name"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="report-description">Description</Label>
              <Input
                id="report-description"
                value={report.description}
                onChange={(e) => setReport(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Enter report description"
                className="mt-1"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { key: 'fields', label: 'Fields', icon: <BarChart3 className="h-4 w-4" /> },
            { key: 'filters', label: 'Filters', icon: <Settings className="h-4 w-4" /> },
            { key: 'visualizations', label: 'Visualizations', icon: <PieChart className="h-4 w-4" /> },
            { key: 'preview', label: 'Preview', icon: <Eye className="h-4 w-4" /> }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.key
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Available Fields/Options Sidebar */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                {activeTab === 'fields' && 'Available Fields'}
                {activeTab === 'filters' && 'Filter Options'}
                {activeTab === 'visualizations' && 'Visualization Types'}
                {activeTab === 'preview' && 'Report Summary'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {activeTab === 'fields' && (
                <div className="space-y-4">
                  {Object.entries(
                    availableFields.reduce((acc, field) => {
                      if (!acc[field.table]) acc[field.table] = []
                      acc[field.table].push(field)
                      return acc
                    }, {} as Record<string, ReportField[]>)
                  ).map(([table, fields]) => (
                    <div key={table} className="space-y-2">
                      <h4 className="font-medium text-gray-900 capitalize flex items-center">
                        {getFieldIcon(table)}
                        <span className="ml-2">{table.replace('_', ' ')}</span>
                      </h4>
                      <div className="space-y-1">
                        {fields.map((field) => (
                          <div
                            key={field.id}
                            {...createDraggableProps({ id: field.id, type: 'field', data: field })}
                            onClick={() => addField(field)}
                            className={`w-full text-left p-2 text-sm bg-gray-50 hover:bg-blue-50 rounded border hover:border-blue-200 transition-colors cursor-grab active:cursor-grabbing ${
                              report.fields.some(f => f.id === field.id) ? 'opacity-50' : ''
                            }`}
                          >
                            <div className="font-medium">{field.label}</div>
                            <div className="text-xs text-gray-500">
                              {field.type} {field.aggregation && `(${field.aggregation})`}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'visualizations' && (
                <div className="space-y-2">
                  {[
                    { type: 'table', label: 'Data Table', desc: 'Display data in rows and columns' },
                    { type: 'bar_chart', label: 'Bar Chart', desc: 'Compare values across categories' },
                    { type: 'line_chart', label: 'Line Chart', desc: 'Show trends over time' },
                    { type: 'pie_chart', label: 'Pie Chart', desc: 'Show proportions of a whole' },
                    { type: 'metric_card', label: 'Metric Card', desc: 'Display single key values' }
                  ].map((viz) => (
                    <button
                      key={viz.type}
                      onClick={() => addVisualization(viz.type as any)}
                      className="w-full text-left p-3 bg-gray-50 hover:bg-blue-50 rounded border hover:border-blue-200 transition-colors"
                    >
                      <div className="flex items-center mb-1">
                        {getVisualizationIcon(viz.type)}
                        <span className="ml-2 font-medium">{viz.label}</span>
                      </div>
                      <div className="text-xs text-gray-500">{viz.desc}</div>
                    </button>
                  ))}
                </div>
              )}

              {activeTab === 'preview' && (
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Selected Fields</h4>
                    <div className="text-sm text-gray-600">
                      {report.fields.length} fields selected
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Filters Applied</h4>
                    <div className="text-sm text-gray-600">
                      {report.filters.length} filters applied
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Visualizations</h4>
                    <div className="text-sm text-gray-600">
                      {report.visualizations.length} charts configured
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Main Content Area */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>
                {activeTab === 'fields' && 'Selected Fields'}
                {activeTab === 'filters' && 'Report Filters'}
                {activeTab === 'visualizations' && 'Report Visualizations'}
                {activeTab === 'preview' && 'Data Preview'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {activeTab === 'fields' && (
                <div 
                  className="space-y-3 min-h-96"
                  {...createDropZoneProps('selected-fields', (item: DragItem) => {
                    if (item.type === 'field') {
                      addField(item.data)
                    }
                  })}
                >
                  {report.fields.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
                      <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>No fields selected</p>
                      <p className="text-sm">Drag fields from the sidebar or click to add</p>
                    </div>
                  ) : (
                    report.fields.map((field, index) => (
                      <div key={field.id} className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded">
                        <div className="flex items-center space-x-3">
                          <GripVertical className="h-4 w-4 text-gray-400" />
                          <div className="flex items-center space-x-2">
                            {getFieldIcon(field.table)}
                            <div>
                              <div className="font-medium">{field.label}</div>
                              <div className="text-xs text-gray-500">
                                {field.table}.{field.field} ({field.type})
                                {field.aggregation && ` - ${field.aggregation}`}
                              </div>
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeField(field.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeTab === 'filters' && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="font-medium">Report Filters</h4>
                    <Button onClick={addFilter} size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Filter
                    </Button>
                  </div>
                  
                  {report.filters.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Settings className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>No filters configured</p>
                      <p className="text-sm">Add filters to refine your report data</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {report.filters.map((filter) => (
                        <div key={filter.id} className="p-4 border border-gray-200 rounded space-y-3">
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div>
                              <Label>Field</Label>
                              <select
                                value={filter.field}
                                onChange={(e) => updateFilter(filter.id, { field: e.target.value })}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                              >
                                <option value="">Select field</option>
                                {report.fields.map((field) => (
                                  <option key={field.id} value={field.id}>
                                    {field.label}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <Label>Operator</Label>
                              <select
                                value={filter.operator}
                                onChange={(e) => updateFilter(filter.id, { operator: e.target.value as any })}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                              >
                                <option value="equals">Equals</option>
                                <option value="not_equals">Not Equals</option>
                                <option value="greater_than">Greater Than</option>
                                <option value="less_than">Less Than</option>
                                <option value="contains">Contains</option>
                                <option value="between">Between</option>
                              </select>
                            </div>
                            <div>
                              <Label>Value</Label>
                              <Input
                                value={filter.value}
                                onChange={(e) => updateFilter(filter.id, { value: e.target.value })}
                                placeholder="Filter value"
                                className="mt-1"
                              />
                            </div>
                          </div>
                          <div className="flex justify-end">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeFilter(filter.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Remove
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'visualizations' && (
                <div className="space-y-4">
                  {report.visualizations.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <PieChart className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>No visualizations created</p>
                      <p className="text-sm">Add charts and graphs from the sidebar</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {report.visualizations.map((viz) => (
                        <div key={viz.id} className="p-4 border border-gray-200 rounded">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-2">
                              {getVisualizationIcon(viz.type)}
                              <Input
                                value={viz.title}
                                onChange={(e) => updateVisualization(viz.id, { title: e.target.value })}
                                className="text-lg font-medium border-none p-0 focus:ring-0"
                              />
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeVisualization(viz.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                          
                          <div className="space-y-3">
                            <div>
                              <Label>Chart Type</Label>
                              <select
                                value={viz.type}
                                onChange={(e) => updateVisualization(viz.id, { type: e.target.value as any })}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                              >
                                <option value="table">Data Table</option>
                                <option value="bar_chart">Bar Chart</option>
                                <option value="line_chart">Line Chart</option>
                                <option value="pie_chart">Pie Chart</option>
                                <option value="metric_card">Metric Card</option>
                              </select>
                            </div>
                            
                            <div className="bg-gray-50 p-4 rounded text-center text-gray-500">
                              <div className="text-4xl mb-2">{getVisualizationIcon(viz.type)}</div>
                              <p className="text-sm">Visualization Preview</p>
                              <p className="text-xs">{viz.type.replace('_', ' ').toUpperCase()}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'preview' && (
                <div className="space-y-4">
                  {previewData.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <Eye className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>No preview data</p>
                      <p className="text-sm">Click "Preview" to generate sample data</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm border border-gray-200 rounded">
                        <thead>
                          <tr className="bg-gray-50">
                            {report.fields.map((field) => (
                              <th key={field.id} className="p-3 text-left font-medium border-b">
                                {field.label}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {previewData.map((row, index) => (
                            <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                              {report.fields.map((field) => (
                                <td key={field.id} className="p-3 border-b">
                                  {row[field.id]}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}