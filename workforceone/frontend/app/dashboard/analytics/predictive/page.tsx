'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { predictiveAnalytics } from '@/lib/predictive-analytics'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Brain, 
  TrendingUp, 
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Activity,
  Users,
  Calendar,
  BarChart3,
  Loader2,
  ChevronRight,
  Target,
  Lightbulb,
  Zap
} from 'lucide-react'
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts'

interface InsightCategory {
  attendance: any[]
  productivity: any[]
  forms: any[]
  summary: {
    topRisks: string[]
    opportunities: string[]
    immediateActions: string[]
  }
}

export default function PredictiveAnalyticsPage() {
  const [insights, setInsights] = useState<InsightCategory | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedView, setSelectedView] = useState<'overview' | 'attendance' | 'productivity' | 'forms'>('overview')
  const [userProfile, setUserProfile] = useState<any>(null)
  const [organizationSettings, setOrganizationSettings] = useState<any>(null)

  const supabase = createClient()

  useEffect(() => {
    fetchUserProfile()
    loadPredictiveInsights()
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

  const loadPredictiveInsights = async () => {
    try {
      setLoading(true)
      
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single()

      if (!profile?.organization_id) return

      // Fetch organization settings for regional configuration
      const { data: orgSettings } = await supabase
        .from('organization_settings')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .single()

      if (orgSettings) {
        setOrganizationSettings(orgSettings)
      }

      const insights = await predictiveAnalytics.generateInsights(profile.organization_id)
      setInsights(insights)
    } catch (error) {
      console.error('Error loading predictive insights:', error)
    } finally {
      setLoading(false)
    }
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600'
    if (confidence >= 0.6) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getImpactIcon = (impact: string) => {
    switch (impact) {
      case 'positive': return <TrendingUp className="h-5 w-5 text-green-600" />
      case 'negative': return <TrendingDown className="h-5 w-5 text-red-600" />
      default: return <Activity className="h-5 w-5 text-gray-600" />
    }
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increasing':
      case 'up': return <TrendingUp className="h-4 w-4 text-green-600" />
      case 'decreasing':
      case 'down': return <TrendingDown className="h-4 w-4 text-red-600" />
      default: return <Activity className="h-4 w-4 text-gray-600" />
    }
  }

  const formatCurrency = (amount: number) => {
    const currencySymbol = organizationSettings?.currency_symbol || '$'
    return `${currencySymbol}${Math.abs(amount).toLocaleString()}`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="flex flex-col items-center space-y-4">
          <Brain className="h-8 w-8 text-purple-600 animate-pulse" />
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-gray-600">Analyzing data patterns and generating predictions...</p>
        </div>
      </div>
    )
  }

  if (!insights) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-orange-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Data Available</h3>
          <p className="text-gray-600">Not enough data to generate predictive insights.</p>
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
            Predictive Analytics
          </h1>
          <p className="text-gray-600 mt-1">
            AI-powered insights and predictions for your workforce
          </p>
        </div>
        <Button 
          onClick={loadPredictiveInsights}
          variant="outline"
        >
          <Brain className="h-4 w-4 mr-2" />
          Refresh Insights
        </Button>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { key: 'overview', label: 'Executive Summary', icon: <BarChart3 className="h-4 w-4" /> },
            { key: 'attendance', label: 'Attendance Predictions', icon: <Calendar className="h-4 w-4" /> },
            { key: 'productivity', label: 'Productivity Trends', icon: <TrendingUp className="h-4 w-4" /> },
            { key: 'forms', label: 'Form Analytics', icon: <Brain className="h-4 w-4" /> }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setSelectedView(tab.key as any)}
              className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                selectedView === tab.key
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Content based on selected view */}
      {selectedView === 'overview' && (
        <div className="space-y-6">
          {/* Key Metrics Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Top Risks */}
            <Card className="border-l-4 border-l-red-500">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <AlertTriangle className="h-5 w-5 mr-2 text-red-600" />
                  Top Risks
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {insights.summary.topRisks.map((risk, index) => (
                    <div key={index} className="flex items-start space-x-2">
                      <span className="text-red-600 font-bold">{index + 1}.</span>
                      <p className="text-sm text-gray-700">{risk}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Opportunities */}
            <Card className="border-l-4 border-l-green-500">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Lightbulb className="h-5 w-5 mr-2 text-green-600" />
                  Opportunities
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {insights.summary.opportunities.length > 0 ? (
                    insights.summary.opportunities.map((opportunity, index) => (
                      <div key={index} className="flex items-start space-x-2">
                        <span className="text-green-600 font-bold">{index + 1}.</span>
                        <p className="text-sm text-gray-700">{opportunity}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">No significant opportunities detected</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Immediate Actions */}
            <Card className="border-l-4 border-l-blue-500">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Zap className="h-5 w-5 mr-2 text-blue-600" />
                  Immediate Actions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {insights.summary.immediateActions.map((action, index) => (
                    <div key={index} className="flex items-start space-x-2">
                      <CheckCircle className="h-4 w-4 text-blue-600 mt-0.5" />
                      <p className="text-sm text-gray-700">{action}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Insights */}
          <Card>
            <CardHeader>
              <CardTitle>AI-Generated Insights Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="p-4 bg-purple-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-purple-900">Attendance Predictions</span>
                    <Brain className="h-4 w-4 text-purple-600" />
                  </div>
                  <p className="text-2xl font-bold text-purple-900">{insights.attendance.length}</p>
                  <p className="text-xs text-purple-700">Active predictions</p>
                </div>

                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-blue-900">Productivity Trends</span>
                    <TrendingUp className="h-4 w-4 text-blue-600" />
                  </div>
                  <p className="text-2xl font-bold text-blue-900">{insights.productivity.length}</p>
                  <p className="text-xs text-blue-700">Metrics analyzed</p>
                </div>

                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-green-900">Form Patterns</span>
                    <BarChart3 className="h-4 w-4 text-green-600" />
                  </div>
                  <p className="text-2xl font-bold text-green-900">{insights.forms.length}</p>
                  <p className="text-xs text-green-700">Forms analyzed</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {selectedView === 'attendance' && (
        <div className="space-y-6">
          {insights.attendance.map((prediction, index) => (
            <Card key={index}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center">
                    <Calendar className="h-5 w-5 mr-2 text-purple-600" />
                    {prediction.subject}
                  </span>
                  <div className="flex items-center space-x-2">
                    {getImpactIcon(prediction.impact.overall)}
                    <span className={`text-sm font-medium ${getConfidenceColor(prediction.confidence)}`}>
                      {Math.round(prediction.confidence * 100)}% confidence
                    </span>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Prediction */}
                <div className="p-4 bg-purple-50 rounded-lg">
                  <h4 className="font-medium text-purple-900 mb-2">Prediction</h4>
                  <p className="text-sm text-purple-700">{prediction.prediction}</p>
                  <p className="text-xs text-purple-600 mt-1">Timeframe: {prediction.timeframe}</p>
                </div>

                {/* Contributing Factors */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Contributing Factors</h4>
                  <div className="space-y-2">
                    {prediction.factors.map((factor, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium text-sm">{factor.name}</span>
                          {getTrendIcon(factor.trend)}
                        </div>
                        <div className="flex items-center space-x-3">
                          <div className="text-right">
                            <p className="text-xs text-gray-500">Weight</p>
                            <p className="text-sm font-medium">{Math.round(factor.weight * 100)}%</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-gray-500">Correlation</p>
                            <p className="text-sm font-medium">{factor.correlation.toFixed(2)}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recommendations */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Recommended Actions</h4>
                  <div className="space-y-3">
                    {prediction.recommendations.map((rec, idx) => (
                      <div key={idx} className="p-3 border border-gray-200 rounded-lg">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <Target className="h-4 w-4 text-blue-600" />
                              <span className="font-medium text-gray-900">{rec.action}</span>
                            </div>
                            <p className="text-sm text-gray-600">Expected outcome: {rec.expectedOutcome}</p>
                          </div>
                          <div className="flex flex-col items-end space-y-1">
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              rec.priority === 'high' ? 'bg-red-100 text-red-700' :
                              rec.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-green-100 text-green-700'
                            }`}>
                              {rec.priority} priority
                            </span>
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              rec.effort === 'high' ? 'bg-purple-100 text-purple-700' :
                              rec.effort === 'medium' ? 'bg-blue-100 text-blue-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {rec.effort} effort
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Impact Assessment */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-3 bg-red-50 rounded">
                    <p className="text-xs text-red-600">Financial Impact</p>
                    <p className="text-lg font-bold text-red-900">{formatCurrency(prediction.impact.financial)}</p>
                  </div>
                  <div className="text-center p-3 bg-orange-50 rounded">
                    <p className="text-xs text-orange-600">Productivity Impact</p>
                    <p className="text-lg font-bold text-orange-900">{Math.abs(prediction.impact.productivity)}%</p>
                  </div>
                  <div className="text-center p-3 bg-purple-50 rounded">
                    <p className="text-xs text-purple-600">Morale Impact</p>
                    <p className="text-lg font-bold text-purple-900">{Math.abs(prediction.impact.morale)}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {selectedView === 'productivity' && (
        <div className="space-y-6">
          {insights.productivity.map((trend, index) => (
            <Card key={index}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{trend.metric}</span>
                  <div className="flex items-center space-x-2">
                    {getTrendIcon(trend.trend)}
                    <span className={`text-sm font-medium ${
                      trend.trend === 'up' && trend.metric.includes('Completion') ? 'text-green-600' :
                      trend.trend === 'down' ? 'text-red-600' :
                      'text-gray-600'
                    }`}>
                      {trend.changePercent > 0 ? '+' : ''}{trend.changePercent}%
                    </span>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                        <span className="text-sm text-gray-600">Current Value</span>
                        <span className="text-lg font-bold">{trend.currentValue.toFixed(1)}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-blue-50 rounded">
                        <span className="text-sm text-blue-600">Predicted Value</span>
                        <span className="text-lg font-bold text-blue-900">{trend.predictedValue.toFixed(1)}</span>
                      </div>
                      {trend.seasonality && (
                        <div className="p-3 bg-yellow-50 rounded">
                          <p className="text-sm text-yellow-800">
                            <AlertTriangle className="h-4 w-4 inline mr-1" />
                            Seasonal patterns detected
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={[
                        { name: 'Current', value: trend.currentValue },
                        { name: 'Predicted', value: trend.predictedValue }
                      ]}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Line 
                          type="monotone" 
                          dataKey="value" 
                          stroke="#8b5cf6" 
                          strokeWidth={2}
                          dot={{ fill: '#8b5cf6' }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {trend.anomalies.length > 0 && (
                  <div className="mt-4">
                    <h4 className="font-medium text-gray-900 mb-2">Detected Anomalies</h4>
                    <div className="space-y-2">
                      {trend.anomalies.map((anomaly, idx) => (
                        <div key={idx} className="p-3 bg-red-50 rounded">
                          <p className="text-sm text-red-900">
                            {new Date(anomaly.date).toLocaleDateString()} - Deviation: {anomaly.deviation.toFixed(1)}%
                          </p>
                          <p className="text-xs text-red-700">
                            Possible causes: {anomaly.possibleCauses.join(', ')}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {selectedView === 'forms' && (
        <div className="space-y-6">
          {insights.forms.map((pattern, index) => (
            <Card key={index}>
              <CardHeader>
                <CardTitle>Form Analysis: {pattern.formId.slice(0, 8)}...</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Current Patterns */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-blue-50 rounded">
                    <p className="text-xs text-blue-600">Completion Rate</p>
                    <p className="text-lg font-bold text-blue-900">
                      {Math.round(pattern.patterns.completionRate * 100)}%
                    </p>
                  </div>
                  <div className="text-center p-3 bg-purple-50 rounded">
                    <p className="text-xs text-purple-600">Avg Time</p>
                    <p className="text-lg font-bold text-purple-900">
                      {Math.round(pattern.patterns.avgCompletionTime)} min
                    </p>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded">
                    <p className="text-xs text-green-600">Peak Time</p>
                    <p className="text-lg font-bold text-green-900">
                      {pattern.patterns.peakSubmissionTimes[0] || 'N/A'}
                    </p>
                  </div>
                  <div className="text-center p-3 bg-orange-50 rounded">
                    <p className="text-xs text-orange-600">Future Rate</p>
                    <p className="text-lg font-bold text-orange-900">
                      {Math.round(pattern.predictions.futureCompletionRate * 100)}%
                    </p>
                  </div>
                </div>

                {/* Dropoff Analysis */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">High Dropoff Fields</h4>
                  <div className="space-y-2">
                    {pattern.patterns.dropoffPoints
                      .filter(p => p.rate > 0.1)
                      .map((point, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2 bg-red-50 rounded">
                          <span className="text-sm font-medium text-red-900">{point.field}</span>
                          <span className="text-sm text-red-700">{Math.round(point.rate * 100)}% dropoff</span>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Suggestions */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">AI Recommendations</h4>
                  <div className="space-y-2">
                    {pattern.predictions.suggestedChanges.slice(0, 3).map((suggestion, idx) => (
                      <div key={idx} className="p-3 bg-green-50 rounded">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-sm font-medium text-green-900">{suggestion.suggestion}</p>
                            <p className="text-xs text-green-700 mt-1">Field: {suggestion.field}</p>
                          </div>
                          <span className="text-sm font-bold text-green-900">
                            +{Math.round(suggestion.impact * 100)}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}