import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Alert,
} from 'react-native'
import { StatusBar } from 'expo-status-bar'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

interface Team {
  id: string
  name: string
  description?: string
  department: string
  created_at: string
  team_lead?: {
    full_name: string
    email: string
  }
  _count?: {
    team_members: number
  }
}

interface TeamMember {
  id: string
  role: 'member' | 'lead' | 'manager'
  joined_at: string
  profiles: {
    full_name: string
    email: string
    phone?: string
  }
}

export default function TeamsScreen({ navigation }: any) {
  const { user, profile } = useAuth()
  const [teams, setTeams] = useState<Team[]>([])
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null)
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)
  const [membersLoading, setMembersLoading] = useState(false)

  useEffect(() => {
    fetchTeams()
  }, [])

  useEffect(() => {
    if (selectedTeam) {
      fetchTeamMembers(selectedTeam.id)
    }
  }, [selectedTeam])

  const fetchTeams = async () => {
    if (!user || !profile?.organization_id) return

    try {
      const { data, error } = await supabase
        .from('teams')
        .select(`
          *,
          team_lead:profiles!teams_team_lead_id_fkey (
            full_name,
            email
          )
        `)
        .eq('organization_id', profile.organization_id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setTeams(data || [])
      
      // Auto-select first team if none selected
      if (!selectedTeam && data && data.length > 0) {
        setSelectedTeam(data[0])
      }
    } catch (error) {
      console.error('Error fetching teams:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchTeamMembers = async (teamId: string) => {
    setMembersLoading(true)
    try {
      const { data, error } = await supabase
        .from('team_members')
        .select(`
          *,
          profiles (
            full_name,
            email,
            phone
          )
        `)
        .eq('team_id', teamId)
        .order('joined_at', { ascending: true })

      if (error) throw error
      setTeamMembers(data || [])
    } catch (error) {
      console.error('Error fetching team members:', error)
    } finally {
      setMembersLoading(false)
    }
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'lead': return '#3b82f6'
      case 'manager': return '#10b981'
      case 'member': return '#6b7280'
      default: return '#6b7280'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString([], { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    })
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Loading teams...</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Header */}
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Teams</Text>
          <Text style={styles.headerSubtitle}>Team management</Text>
        </View>
      </LinearGradient>

      <View style={styles.content}>
        {teams.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={48} color="#d1d5db" />
            <Text style={styles.emptyText}>No teams found</Text>
            <Text style={styles.emptySubtext}>Teams will appear here when they are created</Text>
          </View>
        ) : (
          <View style={styles.layout}>
            {/* Teams List */}
            <View style={styles.teamsList}>
              <Text style={styles.sectionTitle}>Teams ({teams.length})</Text>
              <ScrollView style={styles.teamsScrollView}>
                {teams.map((team) => (
                  <TouchableOpacity
                    key={team.id}
                    style={[
                      styles.teamCard,
                      selectedTeam?.id === team.id && styles.teamCardSelected
                    ]}
                    onPress={() => setSelectedTeam(team)}
                  >
                    <View style={styles.teamCardHeader}>
                      <Text style={styles.teamName}>{team.name}</Text>
                      <View style={styles.departmentBadge}>
                        <Text style={styles.departmentText}>{team.department}</Text>
                      </View>
                    </View>
                    {team.description && (
                      <Text style={styles.teamDescription} numberOfLines={2}>
                        {team.description}
                      </Text>
                    )}
                    <View style={styles.teamMeta}>
                      <Text style={styles.teamMetaText}>
                        Created {formatDate(team.created_at)}
                      </Text>
                      {team.team_lead && (
                        <Text style={styles.teamLead}>
                          Lead: {team.team_lead.full_name}
                        </Text>
                      )}
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Team Details */}
            <View style={styles.teamDetails}>
              {selectedTeam ? (
                <>
                  <View style={styles.detailsHeader}>
                    <Text style={styles.detailsTitle}>{selectedTeam.name}</Text>
                    <Text style={styles.detailsSubtitle}>{selectedTeam.department}</Text>
                  </View>

                  {selectedTeam.description && (
                    <View style={styles.descriptionCard}>
                      <Text style={styles.descriptionTitle}>Description</Text>
                      <Text style={styles.descriptionText}>{selectedTeam.description}</Text>
                    </View>
                  )}

                  <View style={styles.membersSection}>
                    <View style={styles.membersSectionHeader}>
                      <Text style={styles.membersTitle}>
                        Team Members ({teamMembers.length})
                      </Text>
                      {selectedTeam.team_lead && (
                        <View style={styles.leadBadge}>
                          <Text style={styles.leadBadgeText}>
                            Lead: {selectedTeam.team_lead.full_name}
                          </Text>
                        </View>
                      )}
                    </View>

                    {membersLoading ? (
                      <View style={styles.membersLoading}>
                        <ActivityIndicator color="#3b82f6" />
                        <Text style={styles.membersLoadingText}>Loading members...</Text>
                      </View>
                    ) : teamMembers.length === 0 ? (
                      <View style={styles.noMembers}>
                        <Ionicons name="people-outline" size={32} color="#d1d5db" />
                        <Text style={styles.noMembersText}>No team members</Text>
                      </View>
                    ) : (
                      <ScrollView style={styles.membersList}>
                        {teamMembers.map((member) => (
                          <View key={member.id} style={styles.memberCard}>
                            <View style={styles.memberAvatar}>
                              <Text style={styles.memberAvatarText}>
                                {member.profiles.full_name.split(' ').map(n => n[0]).join('')}
                              </Text>
                            </View>
                            <View style={styles.memberInfo}>
                              <Text style={styles.memberName}>{member.profiles.full_name}</Text>
                              <Text style={styles.memberEmail}>{member.profiles.email}</Text>
                              {member.profiles.phone && (
                                <Text style={styles.memberPhone}>{member.profiles.phone}</Text>
                              )}
                              <Text style={styles.memberJoined}>
                                Joined {formatDate(member.joined_at)}
                              </Text>
                            </View>
                            <View style={[
                              styles.roleBadge, 
                              { backgroundColor: getRoleBadgeColor(member.role) }
                            ]}>
                              <Text style={styles.roleText}>{member.role.toUpperCase()}</Text>
                            </View>
                          </View>
                        ))}
                      </ScrollView>
                    )}
                  </View>
                </>
              ) : (
                <View style={styles.noTeamSelected}>
                  <Ionicons name="people-outline" size={48} color="#d1d5db" />
                  <Text style={styles.noTeamSelectedText}>Select a team to view details</Text>
                </View>
              )}
            </View>
          </View>
        )}
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  loadingText: {
    marginTop: 12,
    color: '#6b7280',
    fontSize: 16,
  },
  header: {
    paddingTop: 30,
    paddingHorizontal: 20,
    paddingBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 16,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    color: '#93c5fd',
    fontSize: 16,
    marginTop: 4,
  },
  content: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    color: '#9ca3af',
    marginTop: 12,
    fontWeight: '600',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 8,
    textAlign: 'center',
  },
  layout: {
    flex: 1,
    flexDirection: 'row',
  },
  teamsList: {
    flex: 1,
    backgroundColor: 'white',
    borderRightWidth: 1,
    borderRightColor: '#e5e7eb',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  teamsScrollView: {
    flex: 1,
  },
  teamCard: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  teamCardSelected: {
    backgroundColor: '#dbeafe',
    borderRightWidth: 3,
    borderRightColor: '#3b82f6',
  },
  teamCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  teamName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
  },
  departmentBadge: {
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  departmentText: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  teamDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 8,
    lineHeight: 18,
  },
  teamMeta: {
    gap: 4,
  },
  teamMetaText: {
    fontSize: 12,
    color: '#9ca3af',
  },
  teamLead: {
    fontSize: 12,
    color: '#3b82f6',
    fontWeight: '500',
  },
  teamDetails: {
    flex: 1.5,
    backgroundColor: 'white',
  },
  detailsHeader: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  detailsTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  detailsSubtitle: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 4,
  },
  descriptionCard: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  descriptionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
  },
  membersSection: {
    flex: 1,
  },
  membersSectionHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  membersTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  leadBadge: {
    backgroundColor: '#dbeafe',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  leadBadgeText: {
    fontSize: 12,
    color: '#3b82f6',
    fontWeight: '600',
  },
  membersLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  membersLoadingText: {
    marginLeft: 8,
    color: '#6b7280',
  },
  noMembers: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  noMembersText: {
    fontSize: 16,
    color: '#9ca3af',
    marginTop: 12,
  },
  membersList: {
    flex: 1,
  },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  memberAvatarText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#6b7280',
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  memberEmail: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  memberPhone: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 2,
  },
  memberJoined: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 4,
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  roleText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  noTeamSelected: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  noTeamSelectedText: {
    fontSize: 16,
    color: '#9ca3af',
    marginTop: 12,
  },
})