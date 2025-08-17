import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { supabaseAdmin } from '../lib/supabase'
import { Config } from '../config/config'

interface SystemAlert {
  id: string
  title: string
  description: string
  severity: 'info' | 'warning' | 'critical' | 'error'
  status: string
  metric_type?: string
  current_value?: number
  threshold_value?: number
  source: string
  first_seen_at: string
  last_seen_at: string
}

interface HealthScore {
  overall_health: number
  database_health: number
  application_health: number
  infrastructure_health: number
  active_alerts: number
  critical_alerts: number
  warning_alerts: number
}

interface SystemMetric {
  metric_type: string
  value: number
  unit: string
  source: string
  recorded_at: string
}

export default function MonitoringScreen() {
  const [healthScore, setHealthScore] = useState<HealthScore | null>(null)
  const [activeAlerts, setActiveAlerts] = useState<SystemAlert[]>([])
  const [recentMetrics, setRecentMetrics] = useState<SystemMetric[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    fetchMonitoringData()
    
    // Set up real-time updates every 30 seconds
    const interval = setInterval(fetchMonitoringData, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchMonitoringData = async () => {
    try {
      setLoading(true)

      // Fetch health score
      const { data: healthData, error: healthError } = await supabaseAdmin.rpc('calculate_system_health_score')
      if (healthError) throw healthError
      setHealthScore(healthData)

      // Fetch active alerts
      const { data: alertsData, error: alertsError } = await supabaseAdmin
        .from('system_alerts')
        .select('*')
        .eq('status', 'active')
        .order('severity', { ascending: false })
        .order('first_seen_at', { ascending: false })
        .limit(10)

      if (alertsError) throw alertsError
      setActiveAlerts(alertsData || [])

      // Fetch recent metrics
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
      const { data: metricsData, error: metricsError } = await supabaseAdmin
        .from('system_metrics')
        .select('*')
        .gte('recorded_at', oneHourAgo)
        .order('recorded_at', { ascending: false })
        .limit(20)

      if (metricsError) throw metricsError
      setRecentMetrics(metricsData || [])

    } catch (error) {
      console.error('Error fetching monitoring data:', error)
      Alert.alert('Error', 'Failed to load monitoring data')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const onRefresh = () => {
    setRefreshing(true)
    fetchMonitoringData()
  }

  const acknowledgeAlert = async (alertId: string) => {
    try {
      const { error } = await supabaseAdmin
        .from('system_alerts')
        .update({
          status: 'acknowledged',
          acknowledged_at: new Date().toISOString(),
          acknowledged_by: 'Mobile Admin',
          updated_at: new Date().toISOString()
        })
        .eq('id', alertId)

      if (error) throw error

      Alert.alert('Success', 'Alert acknowledged')
      fetchMonitoringData()
    } catch (error) {
      console.error('Error acknowledging alert:', error)
      Alert.alert('Error', 'Failed to acknowledge alert')
    }
  }

  const resolveAlert = async (alertId: string) => {
    try {
      const { error } = await supabaseAdmin
        .from('system_alerts')
        .update({
          status: 'resolved',
          resolved_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', alertId)

      if (error) throw error

      Alert.alert('Success', 'Alert resolved')
      fetchMonitoringData()
    } catch (error) {
      console.error('Error resolving alert:', error)
      Alert.alert('Error', 'Failed to resolve alert')
    }
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return 'alert-circle'
      case 'error': return 'close-circle'
      case 'warning': return 'warning'
      case 'info': return 'information-circle'
      default: return 'help-circle'
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return Config.app.theme.error
      case 'error': return Config.app.theme.error
      case 'warning': return Config.app.theme.warning
      case 'info': return Config.app.theme.primary
      default: return Config.app.theme.textSecondary
    }
  }

  const getHealthColor = (score: number) => {
    if (score >= 90) return Config.app.theme.success
    if (score >= 70) return Config.app.theme.warning
    return Config.app.theme.error
  }

  const formatMetricValue = (metric: SystemMetric) => {
    const value = typeof metric.value === 'number' ? metric.value.toFixed(2) : metric.value
    return `${value} ${metric.unit}`
  }

  if (loading && !healthScore) {
    return (
      <SafeAreaView style={[styles.container, styles.centered]} edges={['top']}>
        <ActivityIndicator size="large" color={Config.app.theme.primary} />
        <Text style={styles.loadingText}>Loading monitoring data...</Text>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>System Monitoring</Text>
        <Text style={styles.headerSubtitle}>Real-time system health & alerts</Text>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Health Score Cards */}
        {healthScore && (
          <View style={styles.healthContainer}>
            <Text style={styles.sectionTitle}>System Health</Text>
            <View style={styles.healthGrid}>
              <View style={styles.healthCard}>
                <Text style={styles.healthLabel}>Overall</Text>
                <Text style={[styles.healthScore, { color: getHealthColor(healthScore.overall_health) }]}>
                  {healthScore.overall_health}%
                </Text>
              </View>
              <View style={styles.healthCard}>
                <Text style={styles.healthLabel}>Database</Text>
                <Text style={[styles.healthScore, { color: getHealthColor(healthScore.database_health) }]}>
                  {healthScore.database_health}%
                </Text>
              </View>
              <View style={styles.healthCard}>
                <Text style={styles.healthLabel}>Application</Text>
                <Text style={[styles.healthScore, { color: getHealthColor(healthScore.application_health) }]}>
                  {healthScore.application_health}%
                </Text>
              </View>
              <View style={styles.healthCard}>
                <Text style={styles.healthLabel}>Infrastructure</Text>
                <Text style={[styles.healthScore, { color: getHealthColor(healthScore.infrastructure_health) }]}>
                  {healthScore.infrastructure_health}%
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Alert Summary */}
        {healthScore && (
          <View style={styles.alertSummaryContainer}>
            <Text style={styles.sectionTitle}>Alert Summary</Text>
            <View style={styles.alertSummaryGrid}>
              <View style={styles.alertSummaryCard}>
                <Ionicons name="alert-circle" size={24} color={Config.app.theme.error} />
                <Text style={styles.alertSummaryNumber}>{healthScore.critical_alerts}</Text>
                <Text style={styles.alertSummaryLabel}>Critical</Text>
              </View>
              <View style={styles.alertSummaryCard}>
                <Ionicons name="warning" size={24} color={Config.app.theme.warning} />
                <Text style={styles.alertSummaryNumber}>{healthScore.warning_alerts}</Text>
                <Text style={styles.alertSummaryLabel}>Warning</Text>
              </View>
              <View style={styles.alertSummaryCard}>
                <Ionicons name="checkmark-circle" size={24} color={Config.app.theme.success} />
                <Text style={styles.alertSummaryNumber}>{healthScore.active_alerts}</Text>
                <Text style={styles.alertSummaryLabel}>Total Active</Text>
              </View>
            </View>
          </View>
        )}

        {/* Active Alerts */}
        <View style={styles.alertsContainer}>
          <Text style={styles.sectionTitle}>Active Alerts</Text>
          {activeAlerts.length === 0 ? (
            <View style={styles.noAlertsContainer}>
              <Ionicons name="checkmark-circle" size={48} color={Config.app.theme.success} />
              <Text style={styles.noAlertsTitle}>All Systems Operational</Text>
              <Text style={styles.noAlertsText}>No active alerts detected</Text>
            </View>
          ) : (
            activeAlerts.map((alert) => (
              <View key={alert.id} style={styles.alertCard}>
                <View style={styles.alertHeader}>
                  <View style={styles.alertTitleRow}>
                    <Ionicons 
                      name={getSeverityIcon(alert.severity) as any} 
                      size={20} 
                      color={getSeverityColor(alert.severity)} 
                    />
                    <Text style={styles.alertTitle}>{alert.title}</Text>
                  </View>
                  <View style={[styles.severityBadge, { backgroundColor: getSeverityColor(alert.severity) + '20' }]}>
                    <Text style={[styles.severityText, { color: getSeverityColor(alert.severity) }]}>
                      {alert.severity.toUpperCase()}
                    </Text>
                  </View>
                </View>
                
                <Text style={styles.alertDescription}>{alert.description}</Text>
                
                <View style={styles.alertMeta}>
                  <Text style={styles.alertMetaText}>Source: {alert.source}</Text>
                  <Text style={styles.alertMetaText}>
                    {new Date(alert.first_seen_at).toLocaleString()}
                  </Text>
                </View>

                {alert.current_value && alert.threshold_value && (
                  <View style={styles.alertValues}>
                    <Text style={styles.alertValueText}>
                      Current: {alert.current_value} / Threshold: {alert.threshold_value}
                    </Text>
                  </View>
                )}

                <View style={styles.alertActions}>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.acknowledgeButton]}
                    onPress={() => acknowledgeAlert(alert.id)}
                  >
                    <Ionicons name="checkmark" size={16} color="white" />
                    <Text style={styles.actionButtonText}>Acknowledge</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionButton, styles.resolveButton]}
                    onPress={() => resolveAlert(alert.id)}
                  >
                    <Ionicons name="close" size={16} color="white" />
                    <Text style={styles.actionButtonText}>Resolve</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Recent Metrics */}
        <View style={styles.metricsContainer}>
          <Text style={styles.sectionTitle}>Recent Metrics</Text>
          {recentMetrics.slice(0, 8).map((metric, index) => (
            <View key={index} style={styles.metricCard}>
              <View style={styles.metricHeader}>
                <Text style={styles.metricType}>
                  {metric.metric_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </Text>
                <Text style={styles.metricSource}>{metric.source}</Text>
              </View>
              <Text style={styles.metricValue}>{formatMetricValue(metric)}</Text>
              <Text style={styles.metricTime}>
                {new Date(metric.recorded_at).toLocaleString()}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Config.app.theme.background,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: Config.app.theme.textSecondary,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
    backgroundColor: Config.app.theme.surface,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Config.app.theme.text,
  },
  headerSubtitle: {
    fontSize: 14,
    color: Config.app.theme.textSecondary,
    marginTop: 2,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Config.app.theme.text,
    marginBottom: 12,
    marginTop: 24,
  },
  healthContainer: {
    marginTop: 20,
  },
  healthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  healthCard: {
    backgroundColor: Config.app.theme.surface,
    borderRadius: 12,
    padding: 16,
    width: '48%',
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  healthLabel: {
    fontSize: 12,
    color: Config.app.theme.textSecondary,
    marginBottom: 4,
  },
  healthScore: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  alertSummaryContainer: {
    marginTop: 24,
  },
  alertSummaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  alertSummaryCard: {
    backgroundColor: Config.app.theme.surface,
    borderRadius: 12,
    padding: 16,
    flex: 1,
    marginHorizontal: 4,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  alertSummaryNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Config.app.theme.text,
    marginTop: 8,
  },
  alertSummaryLabel: {
    fontSize: 10,
    color: Config.app.theme.textSecondary,
    marginTop: 4,
  },
  alertsContainer: {
    marginTop: 24,
  },
  noAlertsContainer: {
    backgroundColor: Config.app.theme.surface,
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  noAlertsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Config.app.theme.text,
    marginTop: 16,
  },
  noAlertsText: {
    fontSize: 14,
    color: Config.app.theme.textSecondary,
    marginTop: 8,
  },
  alertCard: {
    backgroundColor: Config.app.theme.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  alertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  alertTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Config.app.theme.text,
    marginLeft: 8,
    flex: 1,
  },
  severityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  severityText: {
    fontSize: 10,
    fontWeight: '600',
  },
  alertDescription: {
    fontSize: 14,
    color: Config.app.theme.textSecondary,
    marginBottom: 8,
    lineHeight: 20,
  },
  alertMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  alertMetaText: {
    fontSize: 12,
    color: Config.app.theme.textSecondary,
  },
  alertValues: {
    backgroundColor: '#f3f4f6',
    padding: 8,
    borderRadius: 8,
    marginBottom: 12,
  },
  alertValueText: {
    fontSize: 12,
    color: Config.app.theme.text,
    fontFamily: 'monospace',
  },
  alertActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  acknowledgeButton: {
    backgroundColor: Config.app.theme.warning,
  },
  resolveButton: {
    backgroundColor: Config.app.theme.success,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  metricsContainer: {
    marginTop: 24,
    marginBottom: 40,
  },
  metricCard: {
    backgroundColor: Config.app.theme.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  metricHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  metricType: {
    fontSize: 14,
    fontWeight: '500',
    color: Config.app.theme.text,
    flex: 1,
  },
  metricSource: {
    fontSize: 12,
    color: Config.app.theme.textSecondary,
  },
  metricValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Config.app.theme.primary,
    fontFamily: 'monospace',
    marginBottom: 4,
  },
  metricTime: {
    fontSize: 10,
    color: Config.app.theme.textSecondary,
  },
})