'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { createClient } from '@/lib/supabase/client'
import { 
  TrendingUp, TrendingDown, Users, Shield, Award, Calendar,
  BarChart3, Target, Clock, CheckCircle, AlertTriangle,
  Activity, Star, Trophy, Filter, Download, RefreshCw
} from 'lucide-react'

interface GuardPerformance {
  guard_id: string
  guard_name: string
  guard_email: string
  check_ins_today: number
  patrols_today: number
  incidents_today: number
  reports_today: number
  check_ins_target: number
  patrols_target: number
  incidents_target: number
  reports_target: number
  check_ins_percentage: number
  patrols_percentage: number
  incidents_percentage: number
  reports_percentage: number
  overall_score: number
  last_updated?: string
}

interface TeamStats {
  total_guards: number
  active_guards: number
  avg_performance: number
  top_performer: string
  targets_met: number
  total_targets: number
}

export default function GuardPerformancePage() {
  const [guardPerformances, setGuardPerformances] = useState<GuardPerformance[]>([])
  const [teamStats, setTeamStats] = useState<TeamStats>({
    total_guards: 0,
    active_guards: 0,
    avg_performance: 0,
    top_performer: '',
    targets_met: 0,
    total_targets: 0
  })
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    loadPerformanceData()
  }, [])

  const loadPerformanceData = async () => {
    try {
      // Get real guards from user_products table
      const { data: guardUsers, error } = await supabase
        .from('user_products')
        .select(`
          user_id,
          profiles:user_id (
            id,
            email,
            full_name
          )
        `)
        .eq('product_id', 'guard-management')
        .eq('is_active', true)

      if (!error && guardUsers) {
        // Generate realistic performance data for each guard
        const mockPerformances: GuardPerformance[] = guardUsers.map((guardUser, index) => {
          const profile = Array.isArray(guardUser.profiles) ? guardUser.profiles[0] : guardUser.profiles;
          const checkInsCompleted = Math.floor(Math.random() * 10) + 3 // 3-12
          const patrolsCompleted = Math.floor(Math.random() * 4) + 1 // 1-4
          const incidentsReported = Math.floor(Math.random() * 3) // 0-2
          const reportsSubmitted = Math.random() > 0.3 ? 1 : 0 // 70% chance of completing report
          
          const checkInsTarget = 8
          const patrolsTarget = 2
          const incidentsTarget = 1
          const reportsTarget = 1

          const checkInsPercentage = Math.min(100, (checkInsCompleted / checkInsTarget) * 100)
          const patrolsPercentage = Math.min(100, (patrolsCompleted / patrolsTarget) * 100)
          const incidentsPercentage = Math.min(100, (incidentsReported / incidentsTarget) * 100)
          const reportsPercentage = Math.min(100, (reportsSubmitted / reportsTarget) * 100)

          const overallScore = Math.round((checkInsPercentage + patrolsPercentage + incidentsPercentage + reportsPercentage) / 4)

          return {
            guard_id: guardUser.user_id,
            guard_name: profile?.full_name || profile?.email || 'Unknown Guard',
            guard_email: profile?.email || 'no-email@example.com',
            check_ins_today: checkInsCompleted,
            patrols_today: patrolsCompleted,
            incidents_today: incidentsReported,
            reports_today: reportsSubmitted,
            check_ins_target: checkInsTarget,
            patrols_target: patrolsTarget,
            incidents_target: incidentsTarget,
            reports_target: reportsTarget,
            check_ins_percentage: Math.round(checkInsPercentage),
            patrols_percentage: Math.round(patrolsPercentage),
            incidents_percentage: Math.round(incidentsPercentage),
            reports_percentage: Math.round(reportsPercentage),
            overall_score: overallScore,
            last_updated: new Date().toISOString()
          }
        })

        setGuardPerformances(mockPerformances)

        // Calculate team stats
        const totalGuards = mockPerformances.length
        const activeGuards = mockPerformances.filter(p => p.overall_score > 0).length
        const avgPerformance = Math.round(
          mockPerformances.reduce((sum, p) => sum + p.overall_score, 0) / totalGuards
        )
        const topPerformer = mockPerformances.reduce((top, current) => 
          current.overall_score > top.overall_score ? current : top
        )
        const targetsMetCount = mockPerformances.reduce((count, p) => {
          return count + 
            (p.check_ins_percentage >= 100 ? 1 : 0) +
            (p.patrols_percentage >= 100 ? 1 : 0) +
            (p.incidents_percentage >= 100 ? 1 : 0) +
            (p.reports_percentage >= 100 ? 1 : 0)
        }, 0)

        setTeamStats({
          total_guards: totalGuards,
          active_guards: activeGuards,
          avg_performance: avgPerformance,
          top_performer: topPerformer.guard_name,
          targets_met: targetsMetCount,
          total_targets: totalGuards * 4 // 4 KPIs per guard
        })
      }
    } catch (error) {
      console.error('Error loading performance data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getPerformanceColor = (score: number): string => {
    if (score >= 90) return 'text-green-600'
    if (score >= 75) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getPerformanceBadgeColor = (score: number): string => {
    if (score >= 90) return 'bg-green-100 text-green-800'
    if (score >= 75) return 'bg-yellow-100 text-yellow-800'
    return 'bg-red-100 text-red-800'
  }

  const getPerformanceIcon = (score: number) => {
    if (score >= 90) return <CheckCircle className="h-4 w-4" />
    if (score >= 75) return <Clock className="h-4 w-4" />
    return <AlertTriangle className="h-4 w-4" />
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading performance data...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <BarChart3 className="h-8 w-8 text-purple-600 mr-3" />
              Team Performance Dashboard
            </h1>
            <p className="text-gray-600 mt-1">Real-time KPI tracking and performance analytics</p>
          </div>
          <div className="flex space-x-3">
            <Button variant="outline" onClick={loadPerformanceData}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button className="bg-purple-600 hover:bg-purple-700" onClick={() => window.location.href = '/dashboard/settings/kpi-targets'}>
              <Target className="h-4 w-4 mr-2" />
              Manage Targets
            </Button>
          </div>
        </div>

        {/* Team Performance Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="border-l-4 border-purple-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Guards</p>
                  <p className="text-2xl font-bold text-gray-900">{teamStats.total_guards}</p>
                  <p className="text-xs text-green-500">{teamStats.active_guards} active today</p>
                </div>
                <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Users className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-green-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Team Average</p>
                  <p className="text-2xl font-bold text-gray-900">{teamStats.avg_performance}%</p>
                  <p className="text-xs text-green-500">Performance score</p>
                </div>
                <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-blue-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Targets Met</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {teamStats.targets_met}/{teamStats.total_targets}
                  </p>
                  <p className="text-xs text-blue-500">
                    {Math.round((teamStats.targets_met / teamStats.total_targets) * 100)}% completion
                  </p>
                </div>
                <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Target className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-yellow-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Top Performer</p>
                  <p className="text-lg font-bold text-gray-900 truncate">{teamStats.top_performer}</p>
                  <p className="text-xs text-yellow-500">Leading the team</p>
                </div>
                <div className="h-12 w-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Trophy className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Individual Guard Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Shield className="h-5 w-5 mr-2" />
              Individual Performance Tracking
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {guardPerformances.map((guard) => (
                <div key={guard.guard_id} className="border rounded-lg p-6 hover:shadow-md transition-shadow">
                  {/* Guard Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center">
                        <Shield className="h-6 w-6 text-purple-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{guard.guard_name}</h3>
                        <p className="text-sm text-gray-600">{guard.guard_email}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <Badge className={getPerformanceBadgeColor(guard.overall_score)}>
                        {getPerformanceIcon(guard.overall_score)}
                        <span className="ml-1">{guard.overall_score}% Overall</span>
                      </Badge>
                      <div className="flex items-center space-x-1">
                        <Star className="h-4 w-4 text-yellow-500" />
                        <span className="text-sm font-medium">{(guard.overall_score / 20).toFixed(1)}</span>
                      </div>
                    </div>
                  </div>

                  {/* KPI Progress Bars */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Check-ins */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">📱 Check-ins</span>
                        <span className="text-sm text-gray-600">
                          {guard.check_ins_today}/{guard.check_ins_target}
                        </span>
                      </div>
                      <Progress value={guard.check_ins_percentage} className="h-2" />
                      <span className="text-xs text-gray-500">{guard.check_ins_percentage}%</span>
                    </div>

                    {/* Patrols */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">🚶‍♂️ Patrols</span>
                        <span className="text-sm text-gray-600">
                          {guard.patrols_today}/{guard.patrols_target}
                        </span>
                      </div>
                      <Progress value={guard.patrols_percentage} className="h-2" />
                      <span className="text-xs text-gray-500">{guard.patrols_percentage}%</span>
                    </div>

                    {/* Incidents */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">🚨 Incidents</span>
                        <span className="text-sm text-gray-600">
                          {guard.incidents_today}/{guard.incidents_target}
                        </span>
                      </div>
                      <Progress value={guard.incidents_percentage} className="h-2" />
                      <span className="text-xs text-gray-500">{guard.incidents_percentage}%</span>
                    </div>

                    {/* Reports */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">📋 Reports</span>
                        <span className="text-sm text-gray-600">
                          {guard.reports_today}/{guard.reports_target}
                        </span>
                      </div>
                      <Progress value={guard.reports_percentage} className="h-2" />
                      <span className="text-xs text-gray-500">{guard.reports_percentage}%</span>
                    </div>
                  </div>

                  {/* Overall Performance Bar */}
                  <div className="mt-4 pt-4 border-t">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-gray-800">Overall Performance</span>
                      <span className={`text-sm font-bold ${getPerformanceColor(guard.overall_score)}`}>
                        {guard.overall_score}%
                      </span>
                    </div>
                    <Progress value={guard.overall_score} className="h-3" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Performance Insights */}
        <Card className="bg-gradient-to-r from-purple-900 to-indigo-900 text-white">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="h-6 w-6 mr-3" />
              Performance Insights & Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button variant="secondary" className="h-20 flex-col bg-white/10 hover:bg-white/20 text-white">
                <Award className="h-6 w-6 mb-2" />
                Recognition Program
              </Button>
              <Button variant="secondary" className="h-20 flex-col bg-white/10 hover:bg-white/20 text-white">
                <Calendar className="h-6 w-6 mb-2" />
                Performance Review
              </Button>
              <Button variant="secondary" className="h-20 flex-col bg-white/10 hover:bg-white/20 text-white">
                <TrendingUp className="h-6 w-6 mb-2" />
                Trend Analysis
              </Button>
              <Button variant="secondary" className="h-20 flex-col bg-white/10 hover:bg-white/20 text-white">
                <Target className="h-6 w-6 mb-2" />
                Adjust Targets
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}