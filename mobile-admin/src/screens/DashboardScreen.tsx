import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { supabaseAdmin } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { formatCurrency, getHealthStatus, calculateHealthScore } from '../lib/utils'
import { Config } from '../config/config'

interface DashboardStats {
  totalOrganizations: number
  totalUsers: number
  activeSubscriptions: number
  trialOrganizations: number
  expiredTrials: number
  monthlyRevenue: number
  healthScore: number
  criticalAlerts: any[]
}

export default function DashboardScreen() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const { email, signOut } = useAuth()

  useEffect(() => {
    fetchDashboardStats()
  }, [])

  const fetchDashboardStats = async () => {
    try {
      setLoading(true)
      
      const [
        orgsResponse,
        usersResponse,
        subscriptionsResponse,
        invoicesResponse
      ] = await Promise.all([
        supabaseAdmin.from('organizations').select('*'),
        supabaseAdmin.from('profiles').select('*'),
        supabaseAdmin.from('subscriptions').select('*'),
        supabaseAdmin.from('invoices').select('total_amount, status, created_at')
      ])

      if (orgsResponse.error) throw orgsResponse.error
      if (usersResponse.error) throw usersResponse.error
      if (subscriptionsResponse.error) throw subscriptionsResponse.error

      const organizations = orgsResponse.data || []
      const users = usersResponse.data || []
      const subscriptions = subscriptionsResponse.data || []
      const invoices = invoicesResponse.data || []

      const activeSubscriptions = subscriptions.filter(s => s.status === 'active').length
      const trialOrganizations = subscriptions.filter(s => s.status === 'trial').length
      const expiredTrials = subscriptions.filter(s => 
        s.status === 'trial' && new Date(s.trial_ends_at) < new Date()
      ).length

      const paidInvoices = invoices.filter(i => i.status === 'paid')
      const monthlyRevenue = paidInvoices
        .filter(i => new Date(i.created_at) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
        .reduce((sum, i) => sum + i.total_amount, 0)

      const healthScore = Math.round(
        (activeSubscriptions / Math.max(organizations.length, 1)) * 100
      )

      const criticalAlerts = [
        ...(expiredTrials > 5 ? [{
          title: 'High Trial Expiration Rate',
          description: `${expiredTrials} organizations have expired trials`,
          severity: 'high'
        }] : []),
        ...(healthScore < 70 ? [{
          title: 'Low System Health Score',
          description: `Current health score is ${healthScore}%`,
          severity: 'medium'
        }] : [])
      ]

      setStats({
        totalOrganizations: organizations.length,
        totalUsers: users.length,
        activeSubscriptions,
        trialOrganizations,
        expiredTrials,
        monthlyRevenue,
        healthScore,
        criticalAlerts
      })
    } catch (error) {
      console.error('Error fetching dashboard stats:', error)
      Alert.alert('Error', 'Failed to load dashboard data')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const onRefresh = () => {
    setRefreshing(true)
    fetchDashboardStats()
  }

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: signOut }
      ]
    )
  }

  const healthStatus = stats ? getHealthStatus(stats.healthScore) : null

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Global Dashboard</Text>
          <Text style={styles.headerSubtitle}>Welcome back, {email}</Text>
        </View>
        <TouchableOpacity onPress={handleSignOut} style={styles.signOutButton}>
          <Ionicons name="log-out-outline" size={24} color={Config.app.theme.text} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Critical Alerts */}
        {stats?.criticalAlerts && stats.criticalAlerts.length > 0 && (
          <View style={styles.alertsContainer}>
            <View style={styles.alertHeader}>
              <Ionicons name="warning" size={20} color={Config.app.theme.error} />
              <Text style={styles.alertTitle}>Critical Alerts</Text>
            </View>
            {stats.criticalAlerts.map((alert, index) => (
              <View key={index} style={styles.alertItem}>
                <Text style={styles.alertItemTitle}>{alert.title}</Text>
                <Text style={styles.alertItemDesc}>{alert.description}</Text>
              </View>
            ))}
          </View>
        )}

        {/* System Health */}
        {stats && healthStatus && (
          <View style={styles.healthContainer}>
            <Text style={styles.sectionTitle}>System Health</Text>
            <View style={styles.healthCard}>
              <View style={styles.healthScore}>
                <Text style={[styles.healthScoreText, { color: healthStatus.color }]}>
                  {stats.healthScore}%
                </Text>
                <Text style={[styles.healthLabel, { color: healthStatus.color }]}>
                  {healthStatus.label}
                </Text>
              </View>
              <View style={styles.healthBar}>
                <View 
                  style={[
                    styles.healthBarFill, 
                    { 
                      width: `${stats.healthScore}%`,
                      backgroundColor: healthStatus.color 
                    }
                  ]} 
                />
              </View>
            </View>
          </View>
        )}

        {/* Key Metrics */}
        {stats && (
          <View style={styles.metricsContainer}>
            <Text style={styles.sectionTitle}>Key Metrics</Text>
            <View style={styles.metricsGrid}>
              <View style={[styles.metricCard, styles.primaryMetric]}>
                <View style={styles.metricIcon}>
                  <Ionicons name="business" size={24} color="white" />
                </View>
                <Text style={styles.metricValue}>{stats.totalOrganizations}</Text>
                <Text style={styles.metricLabel}>Organizations</Text>
                <Text style={styles.metricTrend}>↗ +12% this month</Text>
              </View>

              <View style={styles.metricCard}>
                <View style={styles.metricIconSecondary}>
                  <Ionicons name="people" size={20} color={Config.app.theme.primary} />
                </View>
                <Text style={styles.metricValueSecondary}>{stats.totalUsers}</Text>
                <Text style={styles.metricLabelSecondary}>Total Users</Text>
              </View>

              <View style={styles.metricCard}>
                <View style={styles.metricIconSecondary}>
                  <Ionicons name="card" size={20} color={Config.app.theme.success} />
                </View>
                <Text style={styles.metricValueSecondary}>{stats.activeSubscriptions}</Text>
                <Text style={styles.metricLabelSecondary}>Active Subscriptions</Text>
              </View>

              <View style={styles.metricCard}>
                <View style={styles.metricIconSecondary}>
                  <Ionicons name="cash" size={20} color={Config.app.theme.warning} />
                </View>
                <Text style={styles.metricValueSecondary}>{formatCurrency(stats.monthlyRevenue)}</Text>
                <Text style={styles.metricLabelSecondary}>Monthly Revenue</Text>
              </View>
            </View>
          </View>
        )}

        {/* Quick Actions */}
        <View style={styles.actionsContainer}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity style={styles.actionCard}>
              <Ionicons name="time" size={24} color={Config.app.theme.warning} />
              <Text style={styles.actionTitle}>Expired Trials</Text>
              <Text style={styles.actionValue}>{stats?.expiredTrials || 0}</Text>
              <Text style={styles.actionDesc}>Review and take action</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionCard}>
              <Ionicons name="people" size={24} color={Config.app.theme.primary} />
              <Text style={styles.actionTitle}>Trial Organizations</Text>
              <Text style={styles.actionValue}>{stats?.trialOrganizations || 0}</Text>
              <Text style={styles.actionDesc}>Monitor conversions</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionCard}>
              <Ionicons name="analytics" size={24} color={Config.app.theme.success} />
              <Text style={styles.actionTitle}>Analytics</Text>
              <Text style={styles.actionValue}>View</Text>
              <Text style={styles.actionDesc}>Detailed insights</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionCard}>
              <Ionicons name="settings" size={24} color={Config.app.theme.textSecondary} />
              <Text style={styles.actionTitle}>System</Text>
              <Text style={styles.actionValue}>Manage</Text>
              <Text style={styles.actionDesc}>Admin settings</Text>
            </TouchableOpacity>
          </View>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  signOutButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  alertsContainer: {
    backgroundColor: '#fef2f2',
    borderColor: '#fecaca',
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Config.app.theme.error,
    marginLeft: 8,
  },
  alertItem: {
    marginBottom: 8,
  },
  alertItemTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#991b1b',
  },
  alertItemDesc: {
    fontSize: 12,
    color: '#dc2626',
    marginTop: 2,
  },
  healthContainer: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Config.app.theme.text,
    marginBottom: 12,
  },
  healthCard: {
    backgroundColor: Config.app.theme.surface,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  healthScore: {
    alignItems: 'center',
    marginBottom: 16,
  },
  healthScoreText: {
    fontSize: 36,
    fontWeight: 'bold',
  },
  healthLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginTop: 4,
  },
  healthBar: {
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
  },
  healthBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  metricsContainer: {
    marginTop: 24,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  metricCard: {
    backgroundColor: Config.app.theme.surface,
    borderRadius: 12,
    padding: 16,
    width: '48%',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  primaryMetric: {
    backgroundColor: Config.app.theme.primary,
    width: '100%',
    marginBottom: 16,
  },
  metricIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  metricIconSecondary: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  metricValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 8,
  },
  metricTrend: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  metricValueSecondary: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Config.app.theme.text,
    marginBottom: 4,
  },
  metricLabelSecondary: {
    fontSize: 12,
    color: Config.app.theme.textSecondary,
  },
  actionsContainer: {
    marginTop: 24,
    marginBottom: 20,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionCard: {
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
  actionTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: Config.app.theme.text,
    marginTop: 8,
    textAlign: 'center',
  },
  actionValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Config.app.theme.primary,
    marginTop: 4,
  },
  actionDesc: {
    fontSize: 10,
    color: Config.app.theme.textSecondary,
    marginTop: 2,
    textAlign: 'center',
  },
})