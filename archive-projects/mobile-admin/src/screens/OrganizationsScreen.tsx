import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { supabaseAdmin } from '../lib/supabase'
import { formatDate, formatCurrency, getHealthStatus, calculateHealthScore, debounce } from '../lib/utils'
import { Config } from '../config/config'

interface Organization {
  id: string
  name: string
  email: string
  created_at: string
  subscription_status: string
  trial_ends_at?: string
  monthly_total: number
  user_count: number
  active_users: number
  health_score: number
}

export default function OrganizationsScreen() {
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [filteredOrganizations, setFilteredOrganizations] = useState<Organization[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    fetchOrganizations()
  }, [])

  useEffect(() => {
    filterOrganizations()
  }, [searchTerm, organizations])

  const fetchOrganizations = async () => {
    try {
      setLoading(true)
      
      const { data: orgsData, error: orgsError } = await supabaseAdmin
        .from('organizations')
        .select(`
          *,
          subscriptions (
            status,
            trial_ends_at,
            monthly_total,
            user_count,
            updated_at
          ),
          profiles (
            id,
            created_at,
            last_login
          )
        `)
        .order('created_at', { ascending: false })

      if (orgsError) throw orgsError

      const transformedOrgs = orgsData.map(org => {
        const subscription = org.subscriptions?.[0]
        const profiles = org.profiles || []
        
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        const activeUsers = profiles.filter(p => 
          p.last_login && new Date(p.last_login) > thirtyDaysAgo
        ).length

        const orgData = {
          ...org,
          subscription_status: subscription?.status || 'none',
          trial_ends_at: subscription?.trial_ends_at,
          monthly_total: subscription?.monthly_total || 0,
          user_count: subscription?.user_count || profiles.length,
          active_users: activeUsers,
        }

        return {
          ...orgData,
          health_score: calculateHealthScore(orgData)
        }
      })

      setOrganizations(transformedOrgs)
    } catch (error) {
      console.error('Error fetching organizations:', error)
      Alert.alert('Error', 'Failed to load organizations')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const filterOrganizations = debounce(() => {
    if (!searchTerm.trim()) {
      setFilteredOrganizations(organizations)
    } else {
      const filtered = organizations.filter(org =>
        org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        org.email.toLowerCase().includes(searchTerm.toLowerCase())
      )
      setFilteredOrganizations(filtered)
    }
  }, 300)

  const onRefresh = () => {
    setRefreshing(true)
    fetchOrganizations()
  }

  const handleExtendTrial = async (orgId: string) => {
    try {
      const { data, error } = await supabaseAdmin.rpc('extend_trial', {
        org_id: orgId
      })
      
      if (error) throw error
      
      if (data.success) {
        Alert.alert('Success', 'Trial extended successfully!')
        fetchOrganizations()
        setShowModal(false)
      } else {
        Alert.alert('Error', data.error || 'Failed to extend trial')
      }
    } catch (error) {
      console.error('Error extending trial:', error)
      Alert.alert('Error', 'Failed to extend trial')
    }
  }

  const getStatusBadge = (status: string, trialEnd?: string) => {
    const isExpired = trialEnd && new Date(trialEnd) < new Date()
    
    let backgroundColor, textColor, text
    
    switch (status) {
      case 'active':
        backgroundColor = '#dcfce7'
        textColor = '#166534'
        text = 'Active'
        break
      case 'trial':
        if (isExpired) {
          backgroundColor = '#fef2f2'
          textColor = '#991b1b'
          text = 'Trial Expired'
        } else {
          backgroundColor = '#dbeafe'
          textColor = '#1e40af'
          text = 'Trial'
        }
        break
      case 'past_due':
        backgroundColor = '#fef3c7'
        textColor = '#92400e'
        text = 'Past Due'
        break
      case 'canceled':
        backgroundColor = '#f3f4f6'
        textColor = '#4b5563'
        text = 'Canceled'
        break
      default:
        backgroundColor = '#f3f4f6'
        textColor = '#4b5563'
        text = 'No Subscription'
    }

    return { backgroundColor, textColor, text }
  }

  const renderOrganization = ({ item }: { item: Organization }) => {
    const healthStatus = getHealthStatus(item.health_score)
    const statusBadge = getStatusBadge(item.subscription_status, item.trial_ends_at)
    const trialExpired = item.trial_ends_at && new Date(item.trial_ends_at) < new Date()

    return (
      <TouchableOpacity 
        style={styles.orgCard}
        onPress={() => {
          setSelectedOrg(item)
          setShowModal(true)
        }}
      >
        <View style={styles.orgHeader}>
          <View style={styles.orgIcon}>
            <Ionicons name="business" size={20} color={Config.app.theme.primary} />
          </View>
          <View style={styles.orgInfo}>
            <Text style={styles.orgName}>{item.name}</Text>
            <Text style={styles.orgEmail}>{item.email}</Text>
          </View>
          <View style={styles.healthIndicator}>
            <View style={[styles.healthDot, { backgroundColor: healthStatus.color }]} />
          </View>
        </View>

        <View style={styles.orgDetails}>
          <View style={styles.orgStat}>
            <Text style={styles.statLabel}>Status</Text>
            <View style={[styles.statusBadge, { backgroundColor: statusBadge.backgroundColor }]}>
              <Text style={[styles.statusText, { color: statusBadge.textColor }]}>
                {statusBadge.text}
              </Text>
            </View>
          </View>

          <View style={styles.orgStat}>
            <Text style={styles.statLabel}>Users</Text>
            <Text style={styles.statValue}>{item.user_count} total</Text>
            <Text style={styles.statSubValue}>{item.active_users} active</Text>
          </View>

          <View style={styles.orgStat}>
            <Text style={styles.statLabel}>Revenue</Text>
            <Text style={styles.statValue}>{formatCurrency(item.monthly_total)}</Text>
            <Text style={styles.statSubValue}>per month</Text>
          </View>

          <View style={styles.orgStat}>
            <Text style={styles.statLabel}>Health</Text>
            <Text style={[styles.statValue, { color: healthStatus.color }]}>
              {item.health_score}%
            </Text>
            <Text style={[styles.statSubValue, { color: healthStatus.color }]}>
              {healthStatus.label}
            </Text>
          </View>
        </View>

        {item.subscription_status === 'trial' && !trialExpired && (
          <View style={styles.trialBanner}>
            <Ionicons name="time" size={16} color={Config.app.theme.warning} />
            <Text style={styles.trialText}>
              Trial ends: {formatDate(item.trial_ends_at!)}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    )
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Organizations</Text>
        <Text style={styles.headerSubtitle}>
          {filteredOrganizations.length} of {organizations.length} organizations
        </Text>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={Config.app.theme.textSecondary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search organizations..."
          value={searchTerm}
          onChangeText={setSearchTerm}
          placeholderTextColor={Config.app.theme.textSecondary}
        />
        {searchTerm.length > 0 && (
          <TouchableOpacity onPress={() => setSearchTerm('')}>
            <Ionicons name="close-circle" size={20} color={Config.app.theme.textSecondary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Organizations List */}
      <FlatList
        data={filteredOrganizations}
        renderItem={renderOrganization}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        style={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="business-outline" size={64} color={Config.app.theme.textSecondary} />
            <Text style={styles.emptyTitle}>No organizations found</Text>
            <Text style={styles.emptySubtitle}>
              {searchTerm ? 'Try adjusting your search criteria' : 'No organizations available'}
            </Text>
          </View>
        }
      />

      {/* Organization Detail Modal */}
      <Modal
        visible={showModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowModal(false)}
      >
        {selectedOrg && (
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{selectedOrg.name}</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Ionicons name="close" size={24} color={Config.app.theme.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalContent}>
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Organization Details</Text>
                <View style={styles.modalDetail}>
                  <Text style={styles.modalDetailLabel}>Email</Text>
                  <Text style={styles.modalDetailValue}>{selectedOrg.email}</Text>
                </View>
                <View style={styles.modalDetail}>
                  <Text style={styles.modalDetailLabel}>Created</Text>
                  <Text style={styles.modalDetailValue}>{formatDate(selectedOrg.created_at)}</Text>
                </View>
                <View style={styles.modalDetail}>
                  <Text style={styles.modalDetailLabel}>Health Score</Text>
                  <Text style={[styles.modalDetailValue, { color: getHealthStatus(selectedOrg.health_score).color }]}>
                    {selectedOrg.health_score}% ({getHealthStatus(selectedOrg.health_score).label})
                  </Text>
                </View>
              </View>

              {selectedOrg.subscription_status === 'trial' && 
               !selectedOrg.trial_ends_at || 
               new Date(selectedOrg.trial_ends_at) >= new Date() && (
                <TouchableOpacity
                  style={styles.extendButton}
                  onPress={() => handleExtendTrial(selectedOrg.id)}
                >
                  <Ionicons name="time" size={20} color="white" />
                  <Text style={styles.extendButtonText}>Extend Trial (10 days)</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}
      </Modal>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Config.app.theme.background,
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Config.app.theme.surface,
    marginHorizontal: 20,
    marginVertical: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: Config.app.theme.text,
  },
  list: {
    flex: 1,
    paddingHorizontal: 20,
  },
  orgCard: {
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
  orgHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  orgIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  orgInfo: {
    flex: 1,
  },
  orgName: {
    fontSize: 16,
    fontWeight: '600',
    color: Config.app.theme.text,
  },
  orgEmail: {
    fontSize: 12,
    color: Config.app.theme.textSecondary,
    marginTop: 2,
  },
  healthIndicator: {
    alignItems: 'center',
  },
  healthDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  orgDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  orgStat: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 10,
    color: Config.app.theme.textSecondary,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
    color: Config.app.theme.text,
  },
  statSubValue: {
    fontSize: 10,
    color: Config.app.theme.textSecondary,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '500',
  },
  trialBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef3c7',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 12,
  },
  trialText: {
    fontSize: 12,
    color: '#92400e',
    marginLeft: 6,
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Config.app.theme.text,
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: Config.app.theme.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
  modal: {
    flex: 1,
    backgroundColor: Config.app.theme.background,
  },
  modalHeader: {
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
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Config.app.theme.text,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  modalSection: {
    marginBottom: 24,
  },
  modalSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Config.app.theme.text,
    marginBottom: 12,
  },
  modalDetail: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  modalDetailLabel: {
    fontSize: 14,
    color: Config.app.theme.textSecondary,
  },
  modalDetailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: Config.app.theme.text,
  },
  extendButton: {
    backgroundColor: Config.app.theme.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 20,
  },
  extendButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
})