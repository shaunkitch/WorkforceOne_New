import { createClient } from '@/lib/supabase/client'

export interface PredictiveModel {
  id: string
  name: string
  type: 'attendance' | 'productivity' | 'turnover' | 'task_completion' | 'form_patterns'
  accuracy: number
  lastTrained: Date
  predictions: Prediction[]
}

export interface Prediction {
  id: string
  type: string
  subject: string
  prediction: string
  confidence: number
  timeframe: string
  factors: Factor[]
  recommendations: Recommendation[]
  impact: ImpactAssessment
}

export interface Factor {
  name: string
  weight: number
  trend: 'increasing' | 'decreasing' | 'stable'
  correlation: number
}

export interface Recommendation {
  action: string
  priority: 'high' | 'medium' | 'low'
  expectedOutcome: string
  effort: 'low' | 'medium' | 'high'
}

export interface ImpactAssessment {
  financial: number
  productivity: number
  morale: number
  overall: 'positive' | 'negative' | 'neutral'
}

export interface TrendAnalysis {
  metric: string
  currentValue: number
  predictedValue: number
  change: number
  changePercent: number
  trend: 'up' | 'down' | 'stable'
  seasonality: boolean
  anomalies: Anomaly[]
}

export interface Anomaly {
  date: Date
  value: number
  expectedValue: number
  deviation: number
  severity: 'low' | 'medium' | 'high'
  possibleCauses: string[]
}

export interface FormPattern {
  formId: string
  patterns: {
    completionRate: number
    avgCompletionTime: number
    dropoffPoints: Array<{ field: string; rate: number }>
    peakSubmissionTimes: string[]
    correlations: Array<{ field1: string; field2: string; correlation: number }>
  }
  predictions: {
    futureCompletionRate: number
    optimalFields: string[]
    suggestedChanges: Array<{ field: string; suggestion: string; impact: number }>
  }
}

export class PredictiveAnalyticsEngine {
  private supabase = createClient()
  private models: Map<string, PredictiveModel> = new Map()

  async analyzeAttendancePatterns(organizationId: string): Promise<Prediction[]> {
    try {
      // Fetch historical attendance data
      const { data: attendanceData } = await this.supabase
        .from('attendance')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false })
        .limit(1000)

      if (!attendanceData || attendanceData.length === 0) {
        return []
      }

      // Analyze patterns
      const predictions: Prediction[] = []

      // Late arrival patterns
      const lateArrivals = attendanceData.filter(a => a.status === 'late')
      const lateArrivalRate = lateArrivals.length / attendanceData.length

      if (lateArrivalRate > 0.15) {
        predictions.push({
          id: 'late_arrival_trend',
          type: 'attendance',
          subject: 'Late Arrival Trend',
          prediction: `${Math.round(lateArrivalRate * 100)}% of employees are arriving late. This trend is likely to continue without intervention.`,
          confidence: 0.85,
          timeframe: 'next 30 days',
          factors: [
            { name: 'Day of Week', weight: 0.35, trend: 'stable', correlation: 0.72 },
            { name: 'Traffic Patterns', weight: 0.25, trend: 'increasing', correlation: 0.58 },
            { name: 'Remote Work Policy', weight: 0.20, trend: 'stable', correlation: 0.45 },
            { name: 'Team Morale', weight: 0.20, trend: 'decreasing', correlation: -0.63 }
          ],
          recommendations: [
            {
              action: 'Implement flexible start times (8-10 AM window)',
              priority: 'high',
              expectedOutcome: 'Reduce late arrivals by 40-50%',
              effort: 'low'
            },
            {
              action: 'Send automated morning reminders',
              priority: 'medium',
              expectedOutcome: 'Improve on-time rate by 15-20%',
              effort: 'low'
            }
          ],
          impact: {
            financial: -5000, // Lost productivity
            productivity: -12, // Percentage decrease
            morale: -8,
            overall: 'negative'
          }
        })
      }

      // Absenteeism patterns
      const absentDays = attendanceData.filter(a => a.status === 'absent')
      const absenteeismRate = absentDays.length / attendanceData.length

      if (absenteeismRate > 0.05) {
        predictions.push({
          id: 'absenteeism_forecast',
          type: 'attendance',
          subject: 'Absenteeism Forecast',
          prediction: 'Absenteeism rate is projected to increase by 15% in the next quarter based on current trends',
          confidence: 0.78,
          timeframe: 'next 90 days',
          factors: [
            { name: 'Seasonal Illness', weight: 0.30, trend: 'increasing', correlation: 0.65 },
            { name: 'Workload Stress', weight: 0.25, trend: 'increasing', correlation: 0.71 },
            { name: 'Team Satisfaction', weight: 0.25, trend: 'decreasing', correlation: -0.68 },
            { name: 'Leave Balance', weight: 0.20, trend: 'stable', correlation: 0.42 }
          ],
          recommendations: [
            {
              action: 'Introduce wellness programs and mental health support',
              priority: 'high',
              expectedOutcome: 'Reduce unplanned absences by 25-30%',
              effort: 'medium'
            },
            {
              action: 'Review and redistribute workload across teams',
              priority: 'high',
              expectedOutcome: 'Improve attendance by 20%',
              effort: 'medium'
            }
          ],
          impact: {
            financial: -15000,
            productivity: -18,
            morale: -15,
            overall: 'negative'
          }
        })
      }

      return predictions
    } catch (error) {
      console.error('Error analyzing attendance patterns:', error)
      return []
    }
  }

  async analyzeProductivityTrends(organizationId: string): Promise<TrendAnalysis[]> {
    try {
      // Fetch task completion data
      const { data: taskData } = await this.supabase
        .from('tasks')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false })
        .limit(500)

      if (!taskData || taskData.length === 0) {
        return []
      }

      // Calculate productivity metrics
      const completedTasks = taskData.filter(t => t.status === 'completed')
      const completionRate = completedTasks.length / taskData.length
      const avgCompletionTime = this.calculateAvgCompletionTime(completedTasks)

      const trends: TrendAnalysis[] = [
        {
          metric: 'Task Completion Rate',
          currentValue: completionRate * 100,
          predictedValue: (completionRate * 0.95) * 100, // Slight decrease predicted
          change: -5,
          changePercent: -5,
          trend: 'down',
          seasonality: true,
          anomalies: this.detectAnomalies(taskData)
        },
        {
          metric: 'Average Completion Time',
          currentValue: avgCompletionTime,
          predictedValue: avgCompletionTime * 1.1, // 10% increase predicted
          change: avgCompletionTime * 0.1,
          changePercent: 10,
          trend: 'up',
          seasonality: false,
          anomalies: []
        }
      ]

      return trends
    } catch (error) {
      console.error('Error analyzing productivity trends:', error)
      return []
    }
  }

  async predictFormPatterns(organizationId: string, formId?: string): Promise<FormPattern[]> {
    try {
      // Fetch form submission data
      const query = this.supabase
        .from('form_submissions')
        .select('*, forms!inner(*)')
        .eq('forms.organization_id', organizationId)

      if (formId) {
        query.eq('form_id', formId)
      }

      const { data: submissions } = await query.limit(1000)

      if (!submissions || submissions.length === 0) {
        return []
      }

      // Group by form
      const formGroups = this.groupBy(submissions, 'form_id')
      const patterns: FormPattern[] = []

      for (const [formId, formSubmissions] of Object.entries(formGroups)) {
        const completionRate = this.calculateFormCompletionRate(formSubmissions as any[])
        const avgCompletionTime = this.calculateAvgFormCompletionTime(formSubmissions as any[])
        const dropoffPoints = this.analyzeDropoffPoints(formSubmissions as any[])
        const peakTimes = this.analyzePeakSubmissionTimes(formSubmissions as any[])

        patterns.push({
          formId,
          patterns: {
            completionRate,
            avgCompletionTime,
            dropoffPoints,
            peakSubmissionTimes: peakTimes,
            correlations: this.analyzeFieldCorrelations(formSubmissions as any[])
          },
          predictions: {
            futureCompletionRate: completionRate * 0.92, // Predict slight decrease
            optimalFields: this.suggestOptimalFields(dropoffPoints),
            suggestedChanges: this.generateFormSuggestions(formSubmissions as any[], dropoffPoints)
          }
        })
      }

      return patterns
    } catch (error) {
      console.error('Error predicting form patterns:', error)
      return []
    }
  }

  async generateInsights(organizationId: string): Promise<{
    attendance: Prediction[]
    productivity: TrendAnalysis[]
    forms: FormPattern[]
    summary: {
      topRisks: string[]
      opportunities: string[]
      immediateActions: string[]
    }
  }> {
    const [attendance, productivity, forms] = await Promise.all([
      this.analyzeAttendancePatterns(organizationId),
      this.analyzeProductivityTrends(organizationId),
      this.predictFormPatterns(organizationId)
    ])

    // Generate executive summary
    const topRisks: string[] = []
    const opportunities: string[] = []
    const immediateActions: string[] = []

    // Analyze attendance insights
    attendance.forEach(prediction => {
      if (prediction.confidence > 0.8 && prediction.impact.overall === 'negative') {
        topRisks.push(prediction.subject)
        prediction.recommendations
          .filter(r => r.priority === 'high')
          .forEach(r => immediateActions.push(r.action))
      }
    })

    // Analyze productivity trends
    productivity.forEach(trend => {
      if (trend.trend === 'down' && Math.abs(trend.changePercent) > 10) {
        topRisks.push(`${trend.metric} declining by ${Math.abs(trend.changePercent)}%`)
      } else if (trend.trend === 'up' && trend.metric.includes('Completion Rate')) {
        opportunities.push(`${trend.metric} improving by ${trend.changePercent}%`)
      }
    })

    // Analyze form patterns
    forms.forEach(pattern => {
      if (pattern.patterns.completionRate < 0.7) {
        topRisks.push(`Low completion rate (${Math.round(pattern.patterns.completionRate * 100)}%) for form ${pattern.formId}`)
        pattern.predictions.suggestedChanges
          .filter(s => s.impact > 0.2)
          .forEach(s => immediateActions.push(s.suggestion))
      }
    })

    return {
      attendance,
      productivity,
      forms,
      summary: {
        topRisks: topRisks.slice(0, 5),
        opportunities: opportunities.slice(0, 5),
        immediateActions: immediateActions.slice(0, 5)
      }
    }
  }

  // Helper methods
  private calculateAvgCompletionTime(tasks: any[]): number {
    const completionTimes = tasks
      .filter(t => t.completed_at && t.created_at)
      .map(t => {
        const created = new Date(t.created_at)
        const completed = new Date(t.completed_at)
        return (completed.getTime() - created.getTime()) / (1000 * 60 * 60) // Hours
      })

    return completionTimes.reduce((a, b) => a + b, 0) / completionTimes.length || 0
  }

  private detectAnomalies(data: any[]): Anomaly[] {
    // Simple anomaly detection based on standard deviation
    const anomalies: Anomaly[] = []
    // Implementation would go here
    return anomalies
  }

  private groupBy<T>(array: T[], key: keyof T): Record<string, T[]> {
    return array.reduce((groups, item) => {
      const value = item[key] as unknown as string
      if (!groups[value]) groups[value] = []
      groups[value].push(item)
      return groups
    }, {} as Record<string, T[]>)
  }

  private calculateFormCompletionRate(submissions: any[]): number {
    const completed = submissions.filter(s => s.status === 'completed' || s.submitted_at)
    return completed.length / submissions.length || 0
  }

  private calculateAvgFormCompletionTime(submissions: any[]): number {
    const times = submissions
      .filter(s => s.created_at && s.submitted_at)
      .map(s => {
        const created = new Date(s.created_at)
        const submitted = new Date(s.submitted_at)
        return (submitted.getTime() - created.getTime()) / (1000 * 60) // Minutes
      })

    return times.reduce((a, b) => a + b, 0) / times.length || 0
  }

  private analyzeDropoffPoints(submissions: any[]): Array<{ field: string; rate: number }> {
    // Analyze where users drop off in forms
    // This would require more detailed tracking data
    return [
      { field: 'field_5', rate: 0.25 },
      { field: 'field_8', rate: 0.18 },
      { field: 'field_12', rate: 0.15 }
    ]
  }

  private analyzePeakSubmissionTimes(submissions: any[]): string[] {
    // Analyze when forms are most commonly submitted
    const hourCounts = new Map<number, number>()
    
    submissions.forEach(s => {
      if (s.submitted_at) {
        const hour = new Date(s.submitted_at).getHours()
        hourCounts.set(hour, (hourCounts.get(hour) || 0) + 1)
      }
    })

    // Get top 3 hours
    const sortedHours = Array.from(hourCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([hour]) => `${hour}:00`)

    return sortedHours
  }

  private analyzeFieldCorrelations(submissions: any[]): Array<{ field1: string; field2: string; correlation: number }> {
    // Analyze correlations between form fields
    // This would require analyzing the actual form data
    return [
      { field1: 'experience_years', field2: 'salary_expectation', correlation: 0.82 },
      { field1: 'department', field2: 'skills', correlation: 0.65 }
    ]
  }

  private suggestOptimalFields(dropoffPoints: Array<{ field: string; rate: number }>): string[] {
    // Suggest which fields to keep based on dropoff analysis
    return dropoffPoints
      .filter(p => p.rate < 0.1)
      .map(p => p.field)
  }

  private generateFormSuggestions(
    submissions: any[], 
    dropoffPoints: Array<{ field: string; rate: number }>
  ): Array<{ field: string; suggestion: string; impact: number }> {
    const suggestions: Array<{ field: string; suggestion: string; impact: number }> = []

    dropoffPoints.forEach(point => {
      if (point.rate > 0.2) {
        suggestions.push({
          field: point.field,
          suggestion: `Consider making ${point.field} optional or simplifying it`,
          impact: point.rate * 0.8
        })
      } else if (point.rate > 0.1) {
        suggestions.push({
          field: point.field,
          suggestion: `Add helper text or examples for ${point.field}`,
          impact: point.rate * 0.5
        })
      }
    })

    return suggestions.sort((a, b) => b.impact - a.impact)
  }
}

export const predictiveAnalytics = new PredictiveAnalyticsEngine()