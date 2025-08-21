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
import { formatDate, formatDateTime, debounce } from '../lib/utils'
import { Config } from '../config/config'

interface User {
  id: string
  email: string
  first_name: string
  last_name: string
  phone?: string
  role: string
  organization_id: string
  organization_name: string
  created_at: string
  last_login?: string
  email_confirmed_at?: string
  is_active: boolean
}

export default function UsersScreen() {
  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('all')
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    fetchUsers()
  }, [])

  useEffect(() => {
    filterUsers()
  }, [searchTerm, roleFilter, users])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      
      const { data: profilesData, error: profilesError } = await supabaseAdmin
        .from('profiles')
        .select(`
          *,
          organizations (
            name
          )
        `)
        .order('created_at', { ascending: false })

      if (profilesError) throw profilesError

      const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers()
      if (authError) throw authError

      const usersWithAuth = profilesData.map(profile => {
        const authUser = authUsers.users.find(u => u.id === profile.id)
        return {
          ...profile,
          organization_name: profile.organizations?.name || 'Unknown',
          is_active: !authUser?.banned_until,
          email_confirmed_at: authUser?.email_confirmed_at,
          last_login: authUser?.last_sign_in_at
        }
      })

      setUsers(usersWithAuth)
    } catch (error) {
      console.error('Error fetching users:', error)
      Alert.alert('Error', 'Failed to load users')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const filterUsers = debounce(() => {
    let filtered = users

    if (searchTerm.trim()) {
      filtered = filtered.filter(user =>
        user.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.organization_name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => user.role === roleFilter)
    }

    setFilteredUsers(filtered)
  }, 300)

  const onRefresh = () => {
    setRefreshing(true)
    fetchUsers()
  }

  const handleToggleUserStatus = async (userId: string, banned: boolean) => {
    try {
      if (banned) {
        await supabaseAdmin.auth.admin.updateUserById(userId, {
          ban_duration: '876000h' // ~100 years
        })
      } else {
        await supabaseAdmin.auth.admin.updateUserById(userId, {
          ban_duration: 'none'
        })
      }
      
      Alert.alert('Success', `User ${banned ? 'banned' : 'unbanned'} successfully`)
      fetchUsers()
      setShowModal(false)
    } catch (error) {
      console.error('Error updating user status:', error)
      Alert.alert('Error', 'Failed to update user status')
    }
  }

  const handleResendConfirmation = async (userId: string) => {
    try {
      await supabaseAdmin.auth.admin.resendConfirmation(userId)
      Alert.alert('Success', 'Confirmation email sent successfully')
    } catch (error) {
      console.error('Error resending confirmation:', error)
      Alert.alert('Error', 'Failed to send confirmation email')
    }
  }

  const getUserStatusBadge = (user: User) => {
    if (!user.email_confirmed_at) {
      return { backgroundColor: '#fef3c7', textColor: '#92400e', text: 'Unconfirmed' }
    }
    if (!user.is_active) {
      return { backgroundColor: '#fef2f2', textColor: '#991b1b', text: 'Banned' }
    }
    return { backgroundColor: '#dcfce7', textColor: '#166534', text: 'Active' }
  }

  const getRoleBadge = (role: string) => {
    const colors = {
      admin: { backgroundColor: '#f3e8ff', textColor: '#7c3aed' },
      manager: { backgroundColor: '#dbeafe', textColor: '#1d4ed8' },
      employee: { backgroundColor: '#f3f4f6', textColor: '#4b5563' }
    }
    return colors[role as keyof typeof colors] || colors.employee
  }

  const renderUser = ({ item }: { item: User }) => {
    const statusBadge = getUserStatusBadge(item)
    const roleBadge = getRoleBadge(item.role)

    return (
      <TouchableOpacity 
        style={styles.userCard}
        onPress={() => {
          setSelectedUser(item)
          setShowModal(true)
        }}
      >
        <View style={styles.userHeader}>
          <View style={styles.userIcon}>
            <Ionicons name="person" size={20} color={Config.app.theme.primary} />
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>
              {item.first_name} {item.last_name}
            </Text>
            <Text style={styles.userEmail}>{item.email}</Text>
            <Text style={styles.userOrg}>{item.organization_name}</Text>
          </View>
        </View>

        <View style={styles.userDetails}>
          <View style={styles.userBadges}>
            <View style={[styles.badge, { backgroundColor: roleBadge.backgroundColor }]}>
              <Text style={[styles.badgeText, { color: roleBadge.textColor }]}>
                {item.role}
              </Text>
            </View>
            <View style={[styles.badge, { backgroundColor: statusBadge.backgroundColor }]}>
              <Text style={[styles.badgeText, { color: statusBadge.textColor }]}>
                {statusBadge.text}
              </Text>
            </View>
          </View>

          <View style={styles.userStats}>
            <View style={styles.userStat}>
              <Text style={styles.statLabel}>Last Sign In</Text>
              <Text style={styles.statValue}>
                {item.last_login ? formatDate(item.last_login) : 'Never'}
              </Text>
            </View>
            <View style={styles.userStat}>
              <Text style={styles.statLabel}>Created</Text>
              <Text style={styles.statValue}>{formatDate(item.created_at)}</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    )
  }

  const stats = {
    total: users.length,
    active: users.filter(u => u.is_active && u.email_confirmed_at).length,
    unconfirmed: users.filter(u => !u.email_confirmed_at).length,
    banned: users.filter(u => !u.is_active).length,
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Users Management</Text>
        <Text style={styles.headerSubtitle}>
          {filteredUsers.length} of {users.length} users
        </Text>
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.total}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: Config.app.theme.success }]}>{stats.active}</Text>
          <Text style={styles.statLabel}>Active</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: Config.app.theme.warning }]}>{stats.unconfirmed}</Text>
          <Text style={styles.statLabel}>Unconfirmed</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: Config.app.theme.error }]}>{stats.banned}</Text>
          <Text style={styles.statLabel}>Banned</Text>
        </View>
      </View>

      {/* Filters */}
      <View style={styles.filtersContainer}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color={Config.app.theme.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search users..."
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

        <View style={styles.roleFilter}>
          {['all', 'admin', 'manager', 'employee'].map((role) => (
            <TouchableOpacity
              key={role}
              style={[
                styles.roleButton,
                roleFilter === role && styles.roleButtonActive
              ]}
              onPress={() => setRoleFilter(role)}
            >
              <Text style={[
                styles.roleButtonText,
                roleFilter === role && styles.roleButtonTextActive
              ]}>
                {role === 'all' ? 'All' : role.charAt(0).toUpperCase() + role.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Users List */}
      <FlatList
        data={filteredUsers}
        renderItem={renderUser}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        style={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={64} color={Config.app.theme.textSecondary} />
            <Text style={styles.emptyTitle}>No users found</Text>
            <Text style={styles.emptySubtitle}>
              {searchTerm || roleFilter !== 'all' 
                ? 'Try adjusting your search or filter criteria'
                : 'No users available'}
            </Text>
          </View>
        }
      />

      {/* User Detail Modal */}
      <Modal
        visible={showModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowModal(false)}
      >
        {selectedUser && (
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {selectedUser.first_name} {selectedUser.last_name}
              </Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Ionicons name="close" size={24} color={Config.app.theme.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalContent}>
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>User Details</Text>
                <View style={styles.modalDetail}>
                  <Text style={styles.modalDetailLabel}>Email</Text>
                  <Text style={styles.modalDetailValue}>{selectedUser.email}</Text>
                </View>
                <View style={styles.modalDetail}>
                  <Text style={styles.modalDetailLabel}>Organization</Text>
                  <Text style={styles.modalDetailValue}>{selectedUser.organization_name}</Text>
                </View>
                <View style={styles.modalDetail}>
                  <Text style={styles.modalDetailLabel}>Role</Text>
                  <Text style={styles.modalDetailValue}>{selectedUser.role}</Text>
                </View>
                <View style={styles.modalDetail}>
                  <Text style={styles.modalDetailLabel}>Status</Text>
                  <Text style={styles.modalDetailValue}>
                    {getUserStatusBadge(selectedUser).text}
                  </Text>
                </View>
                <View style={styles.modalDetail}>
                  <Text style={styles.modalDetailLabel}>Last Sign In</Text>
                  <Text style={styles.modalDetailValue}>
                    {selectedUser.last_login ? formatDateTime(selectedUser.last_login) : 'Never'}
                  </Text>
                </View>
                <View style={styles.modalDetail}>
                  <Text style={styles.modalDetailLabel}>Created</Text>
                  <Text style={styles.modalDetailValue}>{formatDateTime(selectedUser.created_at)}</Text>
                </View>
              </View>

              <View style={styles.modalActions}>
                {!selectedUser.email_confirmed_at && (
                  <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: Config.app.theme.warning }]}
                    onPress={() => handleResendConfirmation(selectedUser.id)}
                  >
                    <Ionicons name="mail" size={20} color="white" />
                    <Text style={styles.actionButtonText}>Resend Confirmation</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={[
                    styles.actionButton,
                    { backgroundColor: selectedUser.is_active ? Config.app.theme.error : Config.app.theme.success }
                  ]}
                  onPress={() => handleToggleUserStatus(selectedUser.id, selectedUser.is_active)}
                >
                  <Ionicons 
                    name={selectedUser.is_active ? "ban" : "checkmark-circle"} 
                    size={20} 
                    color="white" 
                  />
                  <Text style={styles.actionButtonText}>
                    {selectedUser.is_active ? 'Ban User' : 'Unban User'}
                  </Text>
                </TouchableOpacity>
              </View>
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
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: Config.app.theme.surface,
    paddingVertical: 12,
    marginHorizontal: 4,
    borderRadius: 8,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Config.app.theme.text,
  },
  statLabel: {
    fontSize: 10,
    color: Config.app.theme.textSecondary,
    marginTop: 2,
  },
  filtersContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Config.app.theme.surface,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: Config.app.theme.text,
  },
  roleFilter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  roleButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginHorizontal: 2,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
  },
  roleButtonActive: {
    backgroundColor: Config.app.theme.primary,
  },
  roleButtonText: {
    fontSize: 12,
    color: Config.app.theme.textSecondary,
    fontWeight: '500',
  },
  roleButtonTextActive: {
    color: 'white',
  },
  list: {
    flex: 1,
    paddingHorizontal: 20,
  },
  userCard: {
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
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  userIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: Config.app.theme.text,
  },
  userEmail: {
    fontSize: 12,
    color: Config.app.theme.textSecondary,
    marginTop: 2,
  },
  userOrg: {
    fontSize: 12,
    color: Config.app.theme.primary,
    marginTop: 2,
  },
  userDetails: {
    gap: 12,
  },
  userBadges: {
    flexDirection: 'row',
    gap: 8,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '500',
  },
  userStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  userStat: {
    flex: 1,
  },
  statValue: {
    fontSize: 12,
    fontWeight: '500',
    color: Config.app.theme.text,
    marginTop: 2,
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
    textAlign: 'right',
    flex: 1,
    marginLeft: 12,
  },
  modalActions: {
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
})