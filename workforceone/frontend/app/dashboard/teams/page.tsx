'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  Users, 
  UserPlus,
  Settings,
  MoreVertical,
  Edit,
  Trash2,
  Mail,
  Phone,
  Calendar,
  TrendingUp,
  Clock,
  Target,
  Award,
  Plus,
  Search,
  Filter,
  UserCheck,
  Copy,
  RefreshCw,
  Key,
  Building,
  CheckCircle
} from 'lucide-react'
import { format, parseISO } from 'date-fns'

interface Team {
  id: string
  name: string
  description?: string
  team_lead_id?: string
  department: string
  created_at: string
  updated_at: string
  team_lead?: {
    full_name: string
    email: string
  }
  team_members?: TeamMember[]
  _count?: {
    team_members: number
  }
}

interface TeamMember {
  id: string
  team_id: string
  user_id: string
  role: 'member' | 'lead' | 'manager'
  joined_at: string
  profiles: {
    full_name: string
    email: string
    phone?: string
    avatar_url?: string
  }
}

interface TeamStats {
  totalMembers: number
  activeProjects: number
  completedTasks: number
  avgProductivity: number
}

interface Invitation {
  id: string
  email: string
  role: string
  department?: string
  status: 'pending' | 'accepted' | 'expired' | 'cancelled'
  expires_at: string
  created_at: string
  invitation_token: string
  organizations: {
    name: string
  }
  invited_by_profile?: {
    full_name: string
  }
}

interface OrganizationSettings {
  id: string
  name: string
  join_code: string
  created_at: string
  updated_at: string
}

export default function TeamsPage() {
  const [teams, setTeams] = useState<Team[]>([])
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null)
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [teamStats, setTeamStats] = useState<TeamStats>({
    totalMembers: 0,
    activeProjects: 0,
    completedTasks: 0,
    avgProductivity: 0
  })
  const [loading, setLoading] = useState(true)
  const [showCreateTeam, setShowCreateTeam] = useState(false)
  const [showAddMember, setShowAddMember] = useState(false)
  const [showRegisterUser, setShowRegisterUser] = useState(false)
  const [showManageUserRole, setShowManageUserRole] = useState(false)
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterDepartment, setFilterDepartment] = useState('all')
  const [currentUserProfile, setCurrentUserProfile] = useState<any>(null)
  const [allUsers, setAllUsers] = useState<any[]>([])
  const [availableUsers, setAvailableUsers] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState<'teams' | 'invitations' | 'integrations' | 'organization'>('teams')
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [loadingInvitations, setLoadingInvitations] = useState(false)
  const [showCreateInvitation, setShowCreateInvitation] = useState(false)
  const [emailIntegration, setEmailIntegration] = useState<any>(null)
  const [loadingIntegration, setLoadingIntegration] = useState(false)
  const [showEmailSettings, setShowEmailSettings] = useState(false)
  const [organizationSettings, setOrganizationSettings] = useState<OrganizationSettings | null>(null)
  const [loadingOrganization, setLoadingOrganization] = useState(false)
  const [copySuccess, setCopySuccess] = useState(false)
  
  // Form states
  const [teamForm, setTeamForm] = useState({
    name: '',
    description: '',
    department: '',
    team_lead_id: ''
  })
  const [memberForm, setMemberForm] = useState({
    email: '',
    role: 'member' as 'member' | 'manager' | 'admin'
  })
  const [registerForm, setRegisterForm] = useState({
    email: '',
    fullName: '',
    role: 'member' as 'member' | 'manager' | 'admin',
    department: '',
    phone: '',
    addToTeam: false
  })
  const [roleManagementForm, setRoleManagementForm] = useState({
    profileRole: 'member' as 'member' | 'manager' | 'admin',
    teamRole: 'member' as 'member' | 'manager'
  })
  const [invitationForm, setInvitationForm] = useState({
    email: '',
    role: 'member' as 'member' | 'manager' | 'admin',
    department: '',
    personalMessage: ''
  })
  const [emailSettingsForm, setEmailSettingsForm] = useState({
    provider: 'smtp' as 'smtp' | 'sendgrid' | 'mailgun' | 'ses' | 'gmail' | 'outlook',
    fromEmail: '',
    fromName: '',
    replyToEmail: '',
    smtpHost: '',
    smtpPort: 587,
    smtpSecure: false,
    smtpUser: '',
    smtpPassword: '',
    sendgridApiKey: '',
    mailgunApiKey: '',
    mailgunDomain: '',
    sesAccessKey: '',
    sesSecretKey: '',
    sesRegion: 'us-east-1'
  })
  
  const supabase = createClient()

  const departments = [
    'Engineering',
    'Design',
    'Product',
    'Marketing',
    'Sales',
    'HR',
    'Finance',
    'Operations'
  ]

  useEffect(() => {
    fetchCurrentUserProfile()
    fetchTeams()
    fetchAllUsers()
  }, [filterDepartment, searchTerm])

  useEffect(() => {
    if (selectedTeam) {
      fetchTeamMembers(selectedTeam.id)
      fetchTeamStats(selectedTeam.id)
    }
  }, [selectedTeam])

  useEffect(() => {
    if (activeTab === 'invitations') {
      fetchPendingInvitations()
    } else if (activeTab === 'integrations') {
      fetchEmailIntegration()
    } else if (activeTab === 'organization') {
      fetchOrganizationSettings()
    }
  }, [activeTab])

  const fetchCurrentUserProfile = async () => {
    try {
      const { data: user } = await supabase.auth.getUser()
      if (!user.user) return

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.user.id)
        .single()

      setCurrentUserProfile(profile)
    } catch (error) {
      console.error('Error fetching current user profile:', error)
    }
  }

  const fetchAllUsers = async () => {
    try {
      const { data: user } = await supabase.auth.getUser()
      if (!user.user) return

      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.user.id)
        .single()

      if (!profile?.organization_id) return

      const { data: users } = await supabase
        .from('profiles')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .order('full_name')

      setAllUsers(users || [])
    } catch (error) {
      console.error('Error fetching all users:', error)
    }
  }

  // Permission check functions
  const canManageTeams = () => {
    return currentUserProfile?.role === 'admin'
  }

  const canManageTeamMembers = (team: Team) => {
    if (!currentUserProfile) return false
    if (currentUserProfile.role === 'admin') return true
    if (currentUserProfile.role === 'manager' && team.team_lead_id === currentUserProfile.id) return true
    return false
  }

  const canChangeUserRoles = () => {
    return currentUserProfile?.role === 'admin'
  }

  const canViewTeam = (team: Team) => {
    if (!currentUserProfile) return false
    if (currentUserProfile.role === 'admin') return true
    if (currentUserProfile.role === 'manager' && team.team_lead_id === currentUserProfile.id) return true
    // Check if user is a member of this team
    return teamMembers.some(member => member.user_id === currentUserProfile.id)
  }

  const fetchTeams = async () => {
    try {
      const { data: user } = await supabase.auth.getUser()
      if (!user.user) return

      // Get user's organization and profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id, role')
        .eq('id', user.user.id)
        .single()

      if (!profile?.organization_id) return

      let query = supabase
        .from('teams')
        .select(`
          *,
          team_lead:profiles!teams_team_lead_id_fkey (
            full_name,
            email
          ),
          _count:team_members(count)
        `)
        .eq('organization_id', profile.organization_id)
        .order('created_at', { ascending: false })

      // Apply role-based filtering
      if (profile.role === 'manager') {
        // Managers can only see their own teams
        query = query.eq('team_lead_id', user.user.id)
      }
      // Admins can see all teams
      // Regular members will see teams filtered later based on membership

      if (filterDepartment !== 'all') {
        query = query.eq('department', filterDepartment)
      }

      if (searchTerm) {
        query = query.ilike('name', `%${searchTerm}%`)
      }

      const { data, error } = await query

      if (error) throw error

      // For regular members, filter teams they're actually part of
      let filteredTeams = data || []
      if (profile.role === 'member') {
        const { data: userTeams } = await supabase
          .from('team_members')
          .select('team_id')
          .eq('user_id', user.user.id)

        const userTeamIds = userTeams?.map(ut => ut.team_id) || []
        filteredTeams = filteredTeams.filter(team => userTeamIds.includes(team.id))
      }

      setTeams(filteredTeams)
      
      // Auto-select first team if none selected
      if (!selectedTeam && filteredTeams.length > 0) {
        setSelectedTeam(filteredTeams[0])
      }
    } catch (error) {
      console.error('Error fetching teams:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchTeamMembers = async (teamId: string) => {
    try {
      const { data, error } = await supabase
        .from('team_members')
        .select(`
          *,
          profiles (
            full_name,
            email,
            phone,
            avatar_url
          )
        `)
        .eq('team_id', teamId)
        .order('joined_at', { ascending: true })

      if (error) throw error
      setTeamMembers(data || [])
    } catch (error) {
      console.error('Error fetching team members:', error)
    }
  }

  const fetchTeamStats = async (teamId: string) => {
    try {
      // This would typically aggregate data from various tables
      // For now, we'll use mock data and basic counts
      const { data: memberCount } = await supabase
        .from('team_members')
        .select('id', { count: 'exact' })
        .eq('team_id', teamId)

      const { data: projectCount } = await supabase
        .from('projects')
        .select('id', { count: 'exact' })
        .eq('team_id', teamId)
        .eq('status', 'active')

      const { data: taskCount } = await supabase
        .from('tasks')
        .select('id', { count: 'exact' })
        .eq('team_id', teamId)
        .eq('status', 'completed')

      setTeamStats({
        totalMembers: memberCount?.length || 0,
        activeProjects: projectCount?.length || 0,
        completedTasks: taskCount?.length || 0,
        avgProductivity: Math.floor(Math.random() * 30 + 70) // Mock productivity score
      })
    } catch (error) {
      console.error('Error fetching team stats:', error)
    }
  }

  const fetchPendingInvitations = async () => {
    setLoadingInvitations(true)
    try {
      const { data: user } = await supabase.auth.getUser()
      if (!user.user) return

      // Get user's organization and role
      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id, role')
        .eq('id', user.user.id)
        .single()

      if (!profile?.organization_id) return

      // Only admins and managers can view invitations
      if (profile.role !== 'admin' && profile.role !== 'manager') {
        setInvitations([])
        return
      }

      const { data, error } = await supabase
        .from('company_invitations')
        .select(`
          id,
          email,
          role,
          department,
          status,
          expires_at,
          created_at,
          invitation_token,
          personal_message,
          organizations!inner(name),
          invited_by_profile:profiles!company_invitations_invited_by_fkey(full_name)
        `)
        .eq('organization_id', profile.organization_id)
        .order('created_at', { ascending: false })

      if (error) throw error

      setInvitations(data || [])
    } catch (error) {
      console.error('Error fetching invitations:', error)
    } finally {
      setLoadingInvitations(false)
    }
  }

  const fetchEmailIntegration = async () => {
    setLoadingIntegration(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) return

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/email-integrations`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        if (response.status === 403) {
          // User is not an admin
          setEmailIntegration(null)
          return
        }
        throw new Error('Failed to fetch email integration')
      }

      const result = await response.json()
      const data = result.integration

      setEmailIntegration(data)
      
      // Pre-fill form if integration exists
      if (data) {
        setEmailSettingsForm(prev => ({
          ...prev,
          provider: data.provider || 'smtp',
          fromEmail: data.from_email || '',
          fromName: data.from_name || '',
          replyToEmail: data.reply_to_email || '',
          smtpHost: data.smtp_host || '',
          smtpPort: data.smtp_port || 587,
          smtpSecure: data.smtp_secure || false,
          smtpUser: data.smtp_user || '',
          mailgunDomain: data.mailgun_domain || '',
          sesRegion: data.ses_region || 'us-east-1'
        }))
      }
    } catch (error) {
      console.error('Error fetching email integration:', error)
    } finally {
      setLoadingIntegration(false)
    }
  }

  const saveEmailIntegration = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) return

      // Prepare integration data
      const integrationData = {
        provider: emailSettingsForm.provider,
        fromEmail: emailSettingsForm.fromEmail,
        fromName: emailSettingsForm.fromName || '',
        replyToEmail: emailSettingsForm.replyToEmail || '',
        smtpHost: emailSettingsForm.provider === 'smtp' ? emailSettingsForm.smtpHost : '',
        smtpPort: emailSettingsForm.provider === 'smtp' ? emailSettingsForm.smtpPort : 587,
        smtpSecure: emailSettingsForm.provider === 'smtp' ? emailSettingsForm.smtpSecure : false,
        smtpUser: emailSettingsForm.provider === 'smtp' ? emailSettingsForm.smtpUser : '',
        smtpPassword: emailSettingsForm.provider === 'smtp' ? emailSettingsForm.smtpPassword : '',
        sendgridApiKey: emailSettingsForm.provider === 'sendgrid' ? emailSettingsForm.sendgridApiKey : '',
        mailgunApiKey: emailSettingsForm.provider === 'mailgun' ? emailSettingsForm.mailgunApiKey : '',
        mailgunDomain: emailSettingsForm.provider === 'mailgun' ? emailSettingsForm.mailgunDomain : '',
        sesAccessKey: emailSettingsForm.provider === 'ses' ? emailSettingsForm.sesAccessKey : '',
        sesSecretKey: emailSettingsForm.provider === 'ses' ? emailSettingsForm.sesSecretKey : '',
        sesRegion: emailSettingsForm.provider === 'ses' ? emailSettingsForm.sesRegion : 'us-east-1',
        gmailClientId: emailSettingsForm.provider === 'gmail' ? emailSettingsForm.gmailClientId : '',
        gmailClientSecret: emailSettingsForm.provider === 'gmail' ? emailSettingsForm.gmailClientSecret : '',
        gmailRefreshToken: emailSettingsForm.provider === 'gmail' ? emailSettingsForm.gmailRefreshToken : '',
        outlookClientId: emailSettingsForm.provider === 'outlook' ? emailSettingsForm.outlookClientId : '',
        outlookClientSecret: emailSettingsForm.provider === 'outlook' ? emailSettingsForm.outlookClientSecret : '',
        outlookRefreshToken: emailSettingsForm.provider === 'outlook' ? emailSettingsForm.outlookRefreshToken : ''
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/email-integrations`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(integrationData)
      })

      if (!response.ok) {
        if (response.status === 403) {
          alert('Only administrators can configure email integrations.')
          return
        }
        throw new Error('Failed to save email integration')
      }

      const result = await response.json()

      if (result.success) {
        setShowEmailSettings(false)
        alert('Email integration saved successfully!')
        // Refresh the integration data
        fetchEmailIntegration()
      } else {
        throw new Error('Failed to save email integration')
      }
      
    } catch (error) {
      console.error('Error saving email integration:', error)
      alert('Failed to save email integration. Please try again.')
    }
  }

  const testEmailIntegration = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) return

      const testEmail = currentUserProfile?.email || 'test@example.com'

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/email-integrations/test`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ testEmail })
      })

      if (!response.ok) {
        if (response.status === 403) {
          alert('Only administrators can test email integrations.')
          return
        }
        throw new Error('Failed to test email integration')
      }

      const result = await response.json()

      if (result.success && result.emailSent) {
        alert('Email integration test successful! Check your email for the test message.')
      } else if (result.success && result.connectionTest) {
        alert('Connection test successful, but test email failed to send. Please check your configuration.')
      } else {
        alert(`Email integration test failed: ${result.message}`)
      }

      // Refresh integration data to get test results
      fetchEmailIntegration()
    } catch (error) {
      console.error('Error testing email integration:', error)
      alert('Failed to test email integration. Please try again.')
    }
  }

  // Organization settings functions
  const fetchOrganizationSettings = async () => {
    setLoadingOrganization(true)
    try {
      const { data: user } = await supabase.auth.getUser()
      if (!user.user) return

      // Get user's organization
      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.user.id)
        .single()

      if (!profile?.organization_id) return

      const { data: org, error } = await supabase
        .from('organizations')
        .select('id, name, join_code, created_at, updated_at')
        .eq('id', profile.organization_id)
        .single()

      if (error) throw error
      
      // If organization doesn't have a join_code yet, set the org first then generate one
      if (!org.join_code) {
        setOrganizationSettings(org)
        // Generate a join code for this organization
        await regenerateJoinCodeForOrg(org.id)
        return
      }
      
      setOrganizationSettings(org)
    } catch (error) {
      console.error('Error fetching organization settings:', error)
    } finally {
      setLoadingOrganization(false)
    }
  }

  const regenerateJoinCodeForOrg = async (orgId: string) => {
    try {
      // Generate new unique code
      const generateJoinCode = () => {
        return Math.random().toString(36).substring(2, 8).toUpperCase()
      }

      let newJoinCode = generateJoinCode()
      
      // Ensure code is unique
      let isUnique = false
      let attempts = 0
      while (!isUnique && attempts < 10) {
        const { data: existingCode } = await supabase
          .from('organizations')
          .select('id')
          .eq('join_code', newJoinCode)
          .maybeSingle()
        
        if (!existingCode) {
          isUnique = true
        } else {
          newJoinCode = generateJoinCode()
          attempts++
        }
      }

      // Update organization with new code
      const { data, error } = await supabase
        .from('organizations')
        .update({ 
          join_code: newJoinCode,
          updated_at: new Date().toISOString()
        })
        .eq('id', orgId)
        .select('id, name, join_code, created_at, updated_at')
        .single()

      if (error) throw error
      
      setOrganizationSettings(data)
    } catch (error) {
      console.error('Error generating join code:', error)
    }
  }

  const regenerateJoinCode = async () => {
    if (!organizationSettings) return
    
    setLoadingOrganization(true)
    try {
      await regenerateJoinCodeForOrg(organizationSettings.id)
      alert('Join code regenerated successfully!')
    } catch (error) {
      console.error('Error regenerating join code:', error)
      alert('Failed to regenerate join code. Please try again.')
    } finally {
      setLoadingOrganization(false)
    }
  }

  const copyJoinCode = async () => {
    if (!organizationSettings?.join_code) return
    
    try {
      await navigator.clipboard.writeText(organizationSettings.join_code)
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 2000)
    } catch (error) {
      console.error('Failed to copy join code:', error)
      alert('Failed to copy join code. Please copy it manually.')
    }
  }

  const createTeam = async () => {
    if (!teamForm.name || !teamForm.department) return

    try {
      const { data: user } = await supabase.auth.getUser()
      if (!user.user) return

      // Get user's organization_id from profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.user.id)
        .single()

      // If no profile or organization, get default organization
      let organizationId = profile?.organization_id
      
      if (!organizationId) {
        const { data: defaultOrg } = await supabase
          .from('organizations')
          .select('id')
          .limit(1)
          .single()
        
        organizationId = defaultOrg?.id
      }

      if (!organizationId) {
        throw new Error('No organization found. Please contact your administrator.')
      }

      const { data, error } = await supabase
        .from('teams')
        .insert({
          name: teamForm.name,
          description: teamForm.description,
          department: teamForm.department,
          team_lead_id: teamForm.team_lead_id || user.user.id,
          organization_id: organizationId
        })
        .select()
        .single()

      if (error) throw error

      // Add creator as team lead
      await supabase
        .from('team_members')
        .insert({
          team_id: data.id,
          user_id: teamForm.team_lead_id || user.user.id,
          role: 'lead'
        })

      setTeams(prev => [data, ...prev])
      setTeamForm({ name: '', description: '', department: '', team_lead_id: '' })
      setShowCreateTeam(false)
      setSelectedTeam(data)
    } catch (error) {
      console.error('Error creating team:', error)
      alert('Failed to create team. Please try again.')
    }
  }

  const addTeamMember = async () => {
    if (!memberForm.email || !selectedTeam) return

    try {
      // Find user by email
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', memberForm.email)
        .single()

      if (userError || !userData) {
        alert('User not found with this email address')
        return
      }

      // Check if user is already a team member
      const { data: existingMember } = await supabase
        .from('team_members')
        .select('id')
        .eq('team_id', selectedTeam.id)
        .eq('user_id', userData.id)
        .single()

      if (existingMember) {
        alert('User is already a member of this team')
        return
      }

      const { error } = await supabase
        .from('team_members')
        .insert({
          team_id: selectedTeam.id,
          user_id: userData.id,
          role: memberForm.role
        })

      if (error) throw error

      setMemberForm({ email: '', role: 'member' })
      setShowAddMember(false)
      fetchTeamMembers(selectedTeam.id)
    } catch (error) {
      console.error('Error adding team member:', error)
      alert('Failed to add team member. Please try again.')
    }
  }

  const removeTeamMember = async (memberId: string) => {
    if (!confirm('Are you sure you want to remove this team member?')) return

    try {
      const { error } = await supabase
        .from('team_members')
        .delete()
        .eq('id', memberId)

      if (error) throw error

      setTeamMembers(prev => prev.filter(m => m.id !== memberId))
      if (selectedTeam) {
        fetchTeamStats(selectedTeam.id)
      }
    } catch (error) {
      console.error('Error removing team member:', error)
      alert('Failed to remove team member. Please try again.')
    }
  }

  const updateMemberRole = async (memberId: string, newRole: string) => {
    // Check permissions
    if (!selectedTeam || !canManageTeamMembers(selectedTeam)) {
      alert('You do not have permission to update member roles.')
      return
    }

    try {
      const { error } = await supabase
        .from('team_members')
        .update({ role: newRole })
        .eq('id', memberId)

      if (error) throw error

      setTeamMembers(prev => 
        prev.map(m => m.id === memberId ? { ...m, role: newRole as any } : m)
      )

      // If promoting to manager, update team lead
      if (newRole === 'manager' && selectedTeam) {
        const member = teamMembers.find(m => m.id === memberId)
        if (member) {
          await supabase
            .from('teams')
            .update({ team_lead_id: member.user_id })
            .eq('id', selectedTeam.id)

          fetchTeams() // Refresh teams to show new manager
        }
      }
    } catch (error) {
      console.error('Error updating member role:', error)
      alert('Failed to update member role. Please try again.')
    }
  }

  const updateUserProfileRole = async (userId: string, newRole: string) => {
    if (!canChangeUserRoles()) {
      alert('Only administrators can change user profile roles.')
      return
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId)

      if (error) throw error

      // Refresh data
      fetchAllUsers()
      if (selectedTeam) {
        fetchTeamMembers(selectedTeam.id)
      }

      alert('User profile role updated successfully!')
    } catch (error) {
      console.error('Error updating user profile role:', error)
      alert('Failed to update user profile role. Please try again.')
    }
  }

  const openRoleManagement = (user: any) => {
    setSelectedUser(user)
    setRoleManagementForm({
      profileRole: user.role || 'member',
      teamRole: 'member' // Will be set based on team membership
    })
    setShowManageUserRole(true)
  }

  const registerNewUser = async () => {
    if (!registerForm.email || !registerForm.fullName) {
      alert('Email and full name are required.')
      return
    }

    try {
      const { data: user } = await supabase.auth.getUser()
      if (!user.user) return

      // Get user's organization_id from profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.user.id)
        .single()

      // If no profile or organization, get default organization
      let organizationId = profile?.organization_id
      
      if (!organizationId) {
        const { data: defaultOrg } = await supabase
          .from('organizations')
          .select('id')
          .limit(1)
          .single()
        
        organizationId = defaultOrg?.id
      }

      if (!organizationId) {
        throw new Error('No organization found. Please contact your administrator.')
      }

      // Check if user already exists in profiles (use maybeSingle to avoid 406 errors)
      const { data: existingUser } = await supabase
        .from('profiles')
        .select('id, email')
        .eq('email', registerForm.email)
        .maybeSingle()

      if (existingUser) {
        alert('A user with this email already exists.')
        return
      }

      // For now, we'll create a simple invitation approach since client-side user creation 
      // requires admin privileges. In a production environment, this would typically
      // be handled by a server-side API endpoint.
      
      // Generate organization-specific signup URL
      const signupUrl = `${window.location.origin}/signup?org=${organizationId}&email=${encodeURIComponent(registerForm.email)}&name=${encodeURIComponent(registerForm.fullName)}`
      
      // Show invitation instructions with organization context
      const inviteMessage = `To invite ${registerForm.fullName} (${registerForm.email}):\n\n` +
        `1. Share this personalized signup link:\n${signupUrl}\n\n` +
        `2. They will automatically join your organization\n` +
        `3. Their pre-filled details:\n` +
        `   - Name: ${registerForm.fullName}\n` +
        `   - Department: ${registerForm.department || 'Not specified'}\n` +
        `   - Role: ${registerForm.role}\n\n` +
        (registerForm.addToTeam && selectedTeam ? 
          `4. Add them to team "${selectedTeam.name}" after they sign up` : 
          '4. Add them to appropriate teams after they sign up')

      // For demo purposes, we can also create a simple invitation record
      // This would typically be in a separate invitations table
      const invitationData = {
        email: registerForm.email,
        full_name: registerForm.fullName,
        phone: registerForm.phone || null,
        department: registerForm.department || null,
        role: registerForm.role,
        invited_by: user.user.id,
        team_id: registerForm.addToTeam ? selectedTeam?.id : null,
        organization_id: organizationId,
        created_at: new Date().toISOString(),
        status: 'pending'
      }

      // Log the invitation (in production, save this to a database table)
      devLog('User invitation created:', invitationData);

      // Show the invitation instructions
      alert(inviteMessage)

      // Reset form
      setRegisterForm({
        email: '',
        fullName: '',
        role: 'member',
        department: '',
        phone: '',
        addToTeam: false
      })
      setShowRegisterUser(false)

    } catch (error) {
      console.error('Error creating invitation:', error)
      alert('Failed to create user invitation. Please try again.')
    }
  }

  const sendInvitationEmail = async (invitationId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        alert('Authentication required.')
        return false
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/invitations/send-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ invitationId })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to send invitation email')
      }

      return true
    } catch (error) {
      console.error('Error sending invitation email:', error)
      alert(`Failed to send invitation email: ${error instanceof Error ? error.message : 'Unknown error'}`)
      return false
    }
  }

  const createInvitation = async () => {
    if (!invitationForm.email) {
      alert('Email is required.')
      return
    }

    try {
      const { data: user } = await supabase.auth.getUser()
      if (!user.user) return

      // Get user's organization
      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.user.id)
        .single()

      if (!profile?.organization_id) {
        alert('No organization found.')
        return
      }

      // Check if user already exists
      const { data: existingUser } = await supabase
        .from('profiles')
        .select('email')
        .eq('email', invitationForm.email)
        .maybeSingle()

      if (existingUser) {
        alert('A user with this email already exists in the system.')
        return
      }

      // Check if invitation already exists
      const { data: existingInvitation } = await supabase
        .from('company_invitations')
        .select('id, status')
        .eq('email', invitationForm.email)
        .eq('organization_id', profile.organization_id)
        .maybeSingle()

      if (existingInvitation && existingInvitation.status === 'pending') {
        alert('An invitation for this email is already pending.')
        return
      }

      // Create invitation
      const { data, error } = await supabase
        .from('company_invitations')
        .insert({
          organization_id: profile.organization_id,
          invited_by: user.user.id,
          email: invitationForm.email,
          role: invitationForm.role,
          department: invitationForm.department || null,
          personal_message: invitationForm.personalMessage || null,
          status: 'pending'
        })
        .select()
        .single()

      if (error) throw error

      // Send invitation email
      const emailSent = await sendInvitationEmail(data.id)

      // Reset form and close modal
      setInvitationForm({
        email: '',
        role: 'member',
        department: '',
        personalMessage: ''
      })
      setShowCreateInvitation(false)

      // Refresh invitations
      fetchPendingInvitations()

      if (emailSent) {
        alert('Invitation created and email sent successfully!')
      } else {
        alert('Invitation created, but email failed to send. You can resend it from the invitations table.')
      }
    } catch (error) {
      console.error('Error creating invitation:', error)
      alert('Failed to create invitation. Please try again.')
    }
  }

  const resendInvitation = async (invitationId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.access_token) {
        alert('Authentication required.')
        return
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/invitations/resend-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ invitationId })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to resend invitation email')
      }

      fetchPendingInvitations()
      alert('Invitation resent successfully!')
    } catch (error) {
      console.error('Error resending invitation:', error)
      alert(`Failed to resend invitation: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const cancelInvitation = async (invitationId: string) => {
    if (!confirm('Are you sure you want to cancel this invitation?')) return

    try {
      const { error } = await supabase
        .from('company_invitations')
        .update({ 
          status: 'cancelled',
          cancelled_at: new Date().toISOString()
        })
        .eq('id', invitationId)

      if (error) throw error

      fetchPendingInvitations()
      alert('Invitation cancelled successfully!')
    } catch (error) {
      console.error('Error cancelling invitation:', error)
      alert('Failed to cancel invitation. Please try again.')
    }
  }

  const getStatusBadge = (status: string, expiresAt?: string) => {
    const isExpired = expiresAt && new Date(expiresAt) < new Date()
    
    if (isExpired && status === 'pending') {
      return <Badge variant="destructive">Expired</Badge>
    }

    const variants = {
      pending: 'default',
      accepted: 'default',
      expired: 'destructive',
      cancelled: 'outline'
    } as const

    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      accepted: 'bg-green-100 text-green-800',
      expired: 'bg-red-100 text-red-800',
      cancelled: 'bg-gray-100 text-gray-800'
    }

    return (
      <Badge variant={variants[status as keyof typeof variants] || 'outline'} className={colors[status as keyof typeof colors]}>
        {status.toUpperCase()}
      </Badge>
    )
  }

  const getRoleBadge = (role: string, isProfileRole = false) => {
    const variants = {
      admin: 'destructive',
      manager: 'default', 
      member: 'outline'
    } as const

    const colors = {
      admin: 'bg-red-100 text-red-800',
      manager: 'bg-blue-100 text-blue-800',
      member: 'bg-gray-100 text-gray-800'
    }

    const labels = {
      admin: isProfileRole ? 'Administrator' : 'Admin',
      manager: 'Manager',
      member: 'Member'
    }

    return (
      <Badge variant={variants[role as keyof typeof variants] || 'outline'} className={colors[role as keyof typeof colors]}>
        {labels[role as keyof typeof labels] || role.toUpperCase()}
      </Badge>
    )
  }

  const filteredTeams = teams.filter(team =>
    team.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Teams</h1>
          <p className="text-gray-600">Manage your teams and members.</p>
        </div>
        <div className="flex space-x-3">
          {currentUserProfile && (
            <div className="flex items-center space-x-2 mr-4">
              <span className="text-sm text-gray-600">Role:</span>
              {getRoleBadge(currentUserProfile.role, true)}
            </div>
          )}
          {(canManageTeams() || canChangeUserRoles()) && (
            <Button 
              variant="outline" 
              onClick={() => setShowRegisterUser(true)}
              className="bg-blue-50 hover:bg-blue-100 border-blue-300"
            >
              <UserCheck className="h-4 w-4 mr-2" />
              Register User
            </Button>
          )}
          {canManageTeams() && (
            <Button onClick={() => setShowCreateTeam(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Team
            </Button>
          )}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('teams')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'teams'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Users className="h-5 w-5 mr-2 inline" />
            Teams & Members
          </button>
          {(canManageTeams() || canChangeUserRoles()) && (
            <button
              onClick={() => setActiveTab('invitations')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'invitations'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Mail className="h-5 w-5 mr-2 inline" />
              Invitations
            </button>
          )}
          {canManageTeams() && (
            <button
              onClick={() => setActiveTab('integrations')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'integrations'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Settings className="h-5 w-5 mr-2 inline" />
              Email Integration
            </button>
          )}
          {canManageTeams() && (
            <button
              onClick={() => setActiveTab('organization')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'organization'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Building className="h-5 w-5 mr-2 inline" />
              Organization
            </button>
          )}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'teams' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Teams Sidebar */}
        <div className="lg:col-span-1 space-y-4">
          {/* Search and Filter */}
          <Card>
            <CardContent className="p-4">
              <div className="space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search teams..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={filterDepartment} onValueChange={setFilterDepartment}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Departments</SelectItem>
                    {departments.map(dept => (
                      <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Teams List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="h-5 w-5 mr-2" />
                Teams ({filteredTeams.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {loading ? (
                <div className="p-4 text-center text-gray-500">Loading teams...</div>
              ) : filteredTeams.length === 0 ? (
                <div className="p-4 text-center text-gray-500">No teams found</div>
              ) : (
                <div className="space-y-1">
                  {filteredTeams.map(team => (
                    <button
                      key={team.id}
                      onClick={() => setSelectedTeam(team)}
                      className={`w-full text-left p-4 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 ${
                        selectedTeam?.id === team.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium truncate">{team.name}</h3>
                          <p className="text-sm text-gray-500">{team.department}</p>
                          <p className="text-xs text-gray-400 mt-1">
                            {team._count?.team_members || 0} members
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {selectedTeam ? (
            <>
              {/* Team Header */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center">
                        <Users className="h-6 w-6 mr-2" />
                        {selectedTeam.name}
                      </CardTitle>
                      <p className="text-gray-600 mt-1">{selectedTeam.department}</p>
                      {selectedTeam.description && (
                        <p className="text-sm text-gray-500 mt-2">{selectedTeam.description}</p>
                      )}
                    </div>
                    <div className="flex space-x-2">
                      {canManageTeamMembers(selectedTeam) && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowAddMember(true)}
                        >
                          <UserPlus className="h-4 w-4 mr-2" />
                          Add Member
                        </Button>
                      )}
                      {(canManageTeams() || canChangeUserRoles()) && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowRegisterUser(true)}
                          className="bg-blue-50 hover:bg-blue-100 border-blue-300"
                        >
                          <UserCheck className="h-4 w-4 mr-2" />
                          Register User
                        </Button>
                      )}
                      {canManageTeamMembers(selectedTeam) && (
                        <Button variant="outline" size="sm">
                          <Settings className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
              </Card>

              {/* Team Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4 text-center">
                    <Users className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold">{teamStats.totalMembers}</div>
                    <div className="text-sm text-gray-600">Members</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <Target className="h-8 w-8 text-green-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold">{teamStats.activeProjects}</div>
                    <div className="text-sm text-gray-600">Active Projects</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <Award className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold">{teamStats.completedTasks}</div>
                    <div className="text-sm text-gray-600">Completed Tasks</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <TrendingUp className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold">{teamStats.avgProductivity}%</div>
                    <div className="text-sm text-gray-600">Productivity</div>
                  </CardContent>
                </Card>
              </div>

              {/* Team Members */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Team Members ({teamMembers.length})</span>
                    {selectedTeam.team_lead && (
                      <Badge variant="outline">
                        Lead: {selectedTeam.team_lead.full_name}
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {teamMembers.length === 0 ? (
                    <div className="text-center py-8">
                      <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">No team members found</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {teamMembers.map(member => (
                        <div
                          key={member.id}
                          className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                        >
                          <div className="flex items-center space-x-4">
                            <div className="h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center">
                              <span className="text-sm font-medium text-gray-700">
                                {member.profiles.full_name.split(' ').map(n => n[0]).join('')}
                              </span>
                            </div>
                            <div>
                              <h4 className="font-medium">{member.profiles.full_name}</h4>
                              <div className="flex items-center space-x-4 text-sm text-gray-500">
                                <span className="flex items-center">
                                  <Mail className="h-3 w-3 mr-1" />
                                  {member.profiles.email}
                                </span>
                                {member.profiles.phone && (
                                  <span className="flex items-center">
                                    <Phone className="h-3 w-3 mr-1" />
                                    {member.profiles.phone}
                                  </span>
                                )}
                                <span className="flex items-center">
                                  <Calendar className="h-3 w-3 mr-1" />
                                  Joined {format(parseISO(member.joined_at), 'MMM d, yyyy')}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-3">
                            <div className="flex flex-col space-y-1">
                              <div className="flex items-center space-x-2">
                                <span className="text-xs text-gray-500">Team:</span>
                                {getRoleBadge(member.role)}
                              </div>
                              {allUsers.find(u => u.id === member.user_id)?.role && (
                                <div className="flex items-center space-x-2">
                                  <span className="text-xs text-gray-500">Profile:</span>
                                  {getRoleBadge(allUsers.find(u => u.id === member.user_id)?.role, true)}
                                </div>
                              )}
                            </div>
                            {canManageTeamMembers(selectedTeam) && (
                              <Select
                                value={member.role}
                                onValueChange={(value) => updateMemberRole(member.id, value)}
                              >
                                <SelectTrigger className="w-28">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="member">Member</SelectItem>
                                  <SelectItem value="manager">Manager</SelectItem>
                                </SelectContent>
                              </Select>
                            )}
                            {canChangeUserRoles() && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openRoleManagement(allUsers.find(u => u.id === member.user_id))}
                              >
                                <Settings className="h-4 w-4" />
                              </Button>
                            )}
                            {canManageTeamMembers(selectedTeam) && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => removeTeamMember(member.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No team selected</h3>
                <p className="text-gray-500">Select a team from the sidebar to view details and manage members.</p>
              </CardContent>
            </Card>
          )}
        </div>
        </div>
      )}

      {activeTab === 'invitations' && (
        <div className="space-y-6">
          {/* Invitation Header */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center">
                    <Mail className="h-5 w-5 mr-2" />
                    Invitations Management
                  </CardTitle>
                  <p className="text-gray-600 mt-1">Send and manage user invitations to your organization</p>
                </div>
                <Button onClick={() => setShowCreateInvitation(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Send Invitation
                </Button>
              </div>
            </CardHeader>
          </Card>

          {/* Invitations Table */}
          <Card>
            <CardHeader>
              <CardTitle>Pending Invitations ({invitations.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingInvitations ? (
                <div className="text-center py-8">
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span className="ml-2">Loading invitations...</span>
                  </div>
                </div>
              ) : invitations.length === 0 ? (
                <div className="text-center py-8">
                  <Mail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No invitations found</h3>
                  <p className="text-gray-500 mb-4">Start by sending your first invitation to invite users to your organization.</p>
                  <Button onClick={() => setShowCreateInvitation(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Send First Invitation
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {invitations.map(invitation => {
                    const isExpired = new Date(invitation.expires_at) < new Date()
                    const canResend = invitation.status === 'pending' && !isExpired
                    const canCancel = invitation.status === 'pending'
                    
                    return (
                      <div
                        key={invitation.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-4">
                            <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                              <Mail className="h-5 w-5 text-blue-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-gray-900">{invitation.email}</h4>
                              <div className="flex items-center space-x-4 text-sm text-gray-500">
                                <span>Role: {getRoleBadge(invitation.role)}</span>
                                {invitation.department && (
                                  <span>Department: {invitation.department}</span>
                                )}
                                <span>
                                  Invited: {format(parseISO(invitation.created_at), 'MMM d, yyyy')}
                                </span>
                                <span>
                                  Expires: {format(parseISO(invitation.expires_at), 'MMM d, yyyy')}
                                </span>
                              </div>
                              {invitation.invited_by_profile && (
                                <p className="text-xs text-gray-400 mt-1">
                                  Invited by: {invitation.invited_by_profile.full_name}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-3">
                          {getStatusBadge(invitation.status, invitation.expires_at)}
                          
                          {canResend && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => resendInvitation(invitation.id)}
                            >
                              <Mail className="h-4 w-4 mr-1" />
                              Resend
                            </Button>
                          )}
                          
                          {canCancel && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => cancelInvitation(invitation.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Create Team Modal */}
      {showCreateTeam && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>Create New Team</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="teamName">Team Name</Label>
                <Input
                  id="teamName"
                  value={teamForm.name}
                  onChange={(e) => setTeamForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter team name"
                />
              </div>
              <div>
                <Label htmlFor="department">Department</Label>
                <Select
                  value={teamForm.department}
                  onValueChange={(value) => setTeamForm(prev => ({ ...prev, department: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map(dept => (
                      <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  value={teamForm.description}
                  onChange={(e) => setTeamForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter team description"
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setShowCreateTeam(false)}
                >
                  Cancel
                </Button>
                <Button onClick={createTeam}>
                  Create Team
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Add Member Modal */}
      {showAddMember && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>Add Team Member</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="memberEmail">Email Address</Label>
                <Input
                  id="memberEmail"
                  type="email"
                  value={memberForm.email}
                  onChange={(e) => setMemberForm(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="Enter user email"
                />
              </div>
              <div>
                <Label htmlFor="memberRole">Role</Label>
                <Select
                  value={memberForm.role}
                  onValueChange={(value: 'member' | 'manager' | 'admin') => 
                    setMemberForm(prev => ({ ...prev, role: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="member">Member</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    {canChangeUserRoles() && <SelectItem value="admin">Admin</SelectItem>}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setShowAddMember(false)}
                >
                  Cancel
                </Button>
                <Button onClick={addTeamMember}>
                  Add Member
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Register User Modal */}
      {showRegisterUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Register New User</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="userEmail">Email Address *</Label>
                <Input
                  id="userEmail"
                  type="email"
                  value={registerForm.email}
                  onChange={(e) => setRegisterForm(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="Enter user email"
                />
              </div>
              <div>
                <Label htmlFor="userFullName">Full Name *</Label>
                <Input
                  id="userFullName"
                  value={registerForm.fullName}
                  onChange={(e) => setRegisterForm(prev => ({ ...prev, fullName: e.target.value }))}
                  placeholder="Enter full name"
                />
              </div>
              <div>
                <Label htmlFor="userPhone">Phone Number (Optional)</Label>
                <Input
                  id="userPhone"
                  type="tel"
                  value={registerForm.phone}
                  onChange={(e) => setRegisterForm(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="Enter phone number"
                />
              </div>
              <div>
                <Label htmlFor="userDepartment">Department</Label>
                <Select
                  value={registerForm.department}
                  onValueChange={(value) => setRegisterForm(prev => ({ ...prev, department: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map(dept => (
                      <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="userRole">Default Role</Label>
                <Select
                  value={registerForm.role}
                  onValueChange={(value: 'member' | 'manager' | 'admin') => 
                    setRegisterForm(prev => ({ ...prev, role: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="member">Member</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    {canChangeUserRoles() && <SelectItem value="admin">Admin</SelectItem>}
                  </SelectContent>
                </Select>
              </div>
              {selectedTeam && (
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="addToCurrentTeam"
                    checked={registerForm.addToTeam}
                    onChange={(e) => setRegisterForm(prev => ({ ...prev, addToTeam: e.target.checked }))}
                    className="rounded"
                  />
                  <Label htmlFor="addToCurrentTeam" className="text-sm">
                    Add to current team ({selectedTeam.name})
                  </Label>
                </div>
              )}
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> This will generate invitation instructions that you can share with the new user. They will need to sign up using the provided details.
                </p>
              </div>
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setShowRegisterUser(false)}
                >
                  Cancel
                </Button>
                <Button onClick={registerNewUser} className="bg-blue-600 hover:bg-blue-700">
                  Create Invitation
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Role Management Modal */}
      {showManageUserRole && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>Manage User Roles</CardTitle>
              <p className="text-sm text-gray-600">
                {selectedUser.full_name} ({selectedUser.email})
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label>Current Profile Role</Label>
                <div className="mt-2">
                  {getRoleBadge(selectedUser.role, true)}
                </div>
              </div>
              
              <div>
                <Label htmlFor="newProfileRole">New Profile Role</Label>
                <Select
                  value={roleManagementForm.profileRole}
                  onValueChange={(value: 'member' | 'manager' | 'admin') => 
                    setRoleManagementForm(prev => ({ ...prev, profileRole: value }))
                  }
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="member">Member</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="admin">Administrator</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500 mt-1">
                  Profile roles determine system-wide permissions
                </p>
              </div>

              <div className="bg-amber-50 p-3 rounded-lg">
                <h4 className="font-medium text-amber-800 mb-2">Role Permissions:</h4>
                <ul className="text-sm text-amber-700 space-y-1">
                  <li><strong>Administrator:</strong> Full system access, can manage all teams and users</li>
                  <li><strong>Manager:</strong> Can manage their own teams and approve requests</li>
                  <li><strong>Member:</strong> Basic access to their assigned teams</li>
                </ul>
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setShowManageUserRole(false)}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={() => {
                    updateUserProfileRole(selectedUser.id, roleManagementForm.profileRole)
                    setShowManageUserRole(false)
                  }}
                  disabled={roleManagementForm.profileRole === selectedUser.role}
                >
                  Update Role
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'integrations' && (
        <div className="space-y-6">
          {/* Integration Header */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center">
                    <Settings className="h-5 w-5 mr-2" />
                    Email Integration Settings
                  </CardTitle>
                  <p className="text-gray-600 mt-1">Configure your organization's email provider for sending invitations</p>
                </div>
                <Button onClick={() => setShowEmailSettings(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  {emailIntegration ? 'Update Settings' : 'Configure Email'}
                </Button>
              </div>
            </CardHeader>
          </Card>

          {/* Current Integration Status */}
          <Card>
            <CardHeader>
              <CardTitle>Current Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingIntegration ? (
                <div className="text-center py-8">
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span className="ml-2">Loading configuration...</span>
                  </div>
                </div>
              ) : emailIntegration ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 border rounded-lg">
                      <h3 className="font-medium text-gray-900 mb-2">Email Provider</h3>
                      <p className="text-sm text-gray-600 capitalize">{emailIntegration.provider}</p>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <h3 className="font-medium text-gray-900 mb-2">From Email</h3>
                      <p className="text-sm text-gray-600">{emailIntegration.from_email}</p>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <h3 className="font-medium text-gray-900 mb-2">Status</h3>
                      <div className="flex items-center space-x-2">
                        <div className={`h-2 w-2 rounded-full ${emailIntegration.is_active ? 'bg-green-500' : 'bg-red-500'}`}></div>
                        <span className="text-sm text-gray-600">
                          {emailIntegration.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <h3 className="font-medium text-gray-900 mb-2">Last Test</h3>
                      <div className="text-sm text-gray-600">
                        {emailIntegration.last_test_at ? (
                          <div>
                            <div className="flex items-center space-x-2">
                              <div className={`h-2 w-2 rounded-full ${
                                emailIntegration.last_test_status === 'success' ? 'bg-green-500' : 
                                emailIntegration.last_test_status === 'failed' ? 'bg-red-500' : 'bg-yellow-500'
                              }`}></div>
                              <span className="capitalize">{emailIntegration.last_test_status}</span>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">
                              {format(parseISO(emailIntegration.last_test_at), 'MMM d, yyyy HH:mm')}
                            </p>
                          </div>
                        ) : (
                          'Never tested'
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex space-x-3 pt-4">
                    <Button 
                      variant="outline" 
                      onClick={testEmailIntegration}
                    >
                      <Mail className="h-4 w-4 mr-2" />
                      Test Connection
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => setShowEmailSettings(true)}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit Settings
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No Email Integration Configured</h3>
                  <p className="text-gray-500 mb-4">Configure your email provider to send professional invitation emails.</p>
                  <Button onClick={() => setShowEmailSettings(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Configure Email Provider
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Provider Information */}
          <Card>
            <CardHeader>
              <CardTitle>Supported Email Providers</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="p-4 border rounded-lg">
                  <h3 className="font-medium text-gray-900 mb-2">SMTP</h3>
                  <p className="text-sm text-gray-600">Use any SMTP server (Gmail, Outlook, custom)</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <h3 className="font-medium text-gray-900 mb-2">SendGrid</h3>
                  <p className="text-sm text-gray-600">Professional email delivery service</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <h3 className="font-medium text-gray-900 mb-2">Mailgun</h3>
                  <p className="text-sm text-gray-600">Developer-friendly email service</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <h3 className="font-medium text-gray-900 mb-2">AWS SES</h3>
                  <p className="text-sm text-gray-600">Amazon Simple Email Service</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <h3 className="font-medium text-gray-900 mb-2">Gmail</h3>
                  <p className="text-sm text-gray-600">Google Workspace integration</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <h3 className="font-medium text-gray-900 mb-2">Outlook</h3>
                  <p className="text-sm text-gray-600">Microsoft 365 integration</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Create Invitation Modal */}
      {showCreateInvitation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>Send Invitation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="inviteEmail">Email Address *</Label>
                <Input
                  id="inviteEmail"
                  type="email"
                  value={invitationForm.email}
                  onChange={(e) => setInvitationForm(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="Enter email address"
                />
              </div>
              <div>
                <Label htmlFor="inviteRole">Role</Label>
                <Select
                  value={invitationForm.role}
                  onValueChange={(value: 'member' | 'manager' | 'admin') => 
                    setInvitationForm(prev => ({ ...prev, role: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="member">Member</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    {canChangeUserRoles() && <SelectItem value="admin">Admin</SelectItem>}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="inviteDepartment">Department (Optional)</Label>
                <Select
                  value={invitationForm.department}
                  onValueChange={(value) => setInvitationForm(prev => ({ ...prev, department: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map(dept => (
                      <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="personalMessage">Personal Message (Optional)</Label>
                <Textarea
                  id="personalMessage"
                  value={invitationForm.personalMessage}
                  onChange={(e) => setInvitationForm(prev => ({ ...prev, personalMessage: e.target.value }))}
                  placeholder="Add a personal message to the invitation..."
                  rows={3}
                />
              </div>
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> The user will receive an email with a secure link to accept the invitation and create their account.
                </p>
              </div>
              <div className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setShowCreateInvitation(false)}
                >
                  Cancel
                </Button>
                <Button onClick={createInvitation}>
                  Send Invitation
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Email Settings Modal */}
      {showEmailSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <CardTitle>Configure Email Provider</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Provider Selection */}
              <div>
                <Label htmlFor="provider">Email Provider</Label>
                <Select
                  value={emailSettingsForm.provider}
                  onValueChange={(value) => setEmailSettingsForm(prev => ({ ...prev, provider: value as any }))}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="smtp">SMTP (Generic)</SelectItem>
                    <SelectItem value="sendgrid">SendGrid</SelectItem>
                    <SelectItem value="mailgun">Mailgun</SelectItem>
                    <SelectItem value="ses">AWS SES</SelectItem>
                    <SelectItem value="gmail">Gmail</SelectItem>
                    <SelectItem value="outlook">Outlook</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Common Settings */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="fromEmail">From Email *</Label>
                  <Input
                    id="fromEmail"
                    type="email"
                    value={emailSettingsForm.fromEmail}
                    onChange={(e) => setEmailSettingsForm(prev => ({ ...prev, fromEmail: e.target.value }))}
                    placeholder="noreply@yourcompany.com"
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="fromName">From Name</Label>
                  <Input
                    id="fromName"
                    value={emailSettingsForm.fromName}
                    onChange={(e) => setEmailSettingsForm(prev => ({ ...prev, fromName: e.target.value }))}
                    placeholder="Your Company Name"
                    className="mt-2"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="replyToEmail">Reply-To Email</Label>
                <Input
                  id="replyToEmail"
                  type="email"
                  value={emailSettingsForm.replyToEmail}
                  onChange={(e) => setEmailSettingsForm(prev => ({ ...prev, replyToEmail: e.target.value }))}
                  placeholder="support@yourcompany.com"
                  className="mt-2"
                />
              </div>

              {/* Provider-Specific Settings */}
              {emailSettingsForm.provider === 'smtp' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">SMTP Configuration</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                      <Label htmlFor="smtpHost">SMTP Host *</Label>
                      <Input
                        id="smtpHost"
                        value={emailSettingsForm.smtpHost}
                        onChange={(e) => setEmailSettingsForm(prev => ({ ...prev, smtpHost: e.target.value }))}
                        placeholder="smtp.gmail.com"
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <Label htmlFor="smtpPort">Port *</Label>
                      <Input
                        id="smtpPort"
                        type="number"
                        value={emailSettingsForm.smtpPort}
                        onChange={(e) => setEmailSettingsForm(prev => ({ ...prev, smtpPort: parseInt(e.target.value) || 587 }))}
                        placeholder="587"
                        className="mt-2"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="smtpUser">Username *</Label>
                      <Input
                        id="smtpUser"
                        value={emailSettingsForm.smtpUser}
                        onChange={(e) => setEmailSettingsForm(prev => ({ ...prev, smtpUser: e.target.value }))}
                        placeholder="your-email@domain.com"
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <Label htmlFor="smtpPassword">Password *</Label>
                      <Input
                        id="smtpPassword"
                        type="password"
                        value={emailSettingsForm.smtpPassword}
                        onChange={(e) => setEmailSettingsForm(prev => ({ ...prev, smtpPassword: e.target.value }))}
                        placeholder="••••••••"
                        className="mt-2"
                      />
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="smtpSecure"
                      checked={emailSettingsForm.smtpSecure}
                      onChange={(e) => setEmailSettingsForm(prev => ({ ...prev, smtpSecure: e.target.checked }))}
                      className="rounded"
                    />
                    <Label htmlFor="smtpSecure" className="text-sm">Use SSL/TLS (recommended for port 465)</Label>
                  </div>
                </div>
              )}

              {emailSettingsForm.provider === 'sendgrid' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">SendGrid Configuration</h3>
                  <div>
                    <Label htmlFor="sendgridApiKey">SendGrid API Key *</Label>
                    <Input
                      id="sendgridApiKey"
                      type="password"
                      value={emailSettingsForm.sendgridApiKey}
                      onChange={(e) => setEmailSettingsForm(prev => ({ ...prev, sendgridApiKey: e.target.value }))}
                      placeholder="SG.••••••••"
                      className="mt-2"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Get your API key from SendGrid Dashboard → Settings → API Keys
                    </p>
                  </div>
                </div>
              )}

              {emailSettingsForm.provider === 'mailgun' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Mailgun Configuration</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="mailgunApiKey">Mailgun API Key *</Label>
                      <Input
                        id="mailgunApiKey"
                        type="password"
                        value={emailSettingsForm.mailgunApiKey}
                        onChange={(e) => setEmailSettingsForm(prev => ({ ...prev, mailgunApiKey: e.target.value }))}
                        placeholder="key-••••••••"
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <Label htmlFor="mailgunDomain">Mailgun Domain *</Label>
                      <Input
                        id="mailgunDomain"
                        value={emailSettingsForm.mailgunDomain}
                        onChange={(e) => setEmailSettingsForm(prev => ({ ...prev, mailgunDomain: e.target.value }))}
                        placeholder="mg.yourcompany.com"
                        className="mt-2"
                      />
                    </div>
                  </div>
                </div>
              )}

              {emailSettingsForm.provider === 'ses' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">AWS SES Configuration</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="sesAccessKey">Access Key ID *</Label>
                      <Input
                        id="sesAccessKey"
                        type="password"
                        value={emailSettingsForm.sesAccessKey}
                        onChange={(e) => setEmailSettingsForm(prev => ({ ...prev, sesAccessKey: e.target.value }))}
                        placeholder="AKIA••••••••"
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <Label htmlFor="sesSecretKey">Secret Access Key *</Label>
                      <Input
                        id="sesSecretKey"
                        type="password"
                        value={emailSettingsForm.sesSecretKey}
                        onChange={(e) => setEmailSettingsForm(prev => ({ ...prev, sesSecretKey: e.target.value }))}
                        placeholder="••••••••"
                        className="mt-2"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="sesRegion">AWS Region</Label>
                    <Select
                      value={emailSettingsForm.sesRegion}
                      onValueChange={(value) => setEmailSettingsForm(prev => ({ ...prev, sesRegion: value }))}
                    >
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="us-east-1">US East (N. Virginia)</SelectItem>
                        <SelectItem value="us-west-2">US West (Oregon)</SelectItem>
                        <SelectItem value="eu-west-1">Europe (Ireland)</SelectItem>
                        <SelectItem value="ap-southeast-2">Asia Pacific (Sydney)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {(emailSettingsForm.provider === 'gmail' || emailSettingsForm.provider === 'outlook') && (
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">
                    {emailSettingsForm.provider === 'gmail' ? 'Gmail' : 'Outlook'} OAuth Configuration
                  </h3>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <strong>Note:</strong> OAuth integration requires additional setup. 
                      For now, use SMTP with app-specific passwords for {emailSettingsForm.provider === 'gmail' ? 'Gmail' : 'Outlook'}.
                    </p>
                  </div>
                </div>
              )}

              <div className="bg-amber-50 p-4 rounded-lg">
                <h4 className="font-medium text-amber-800 mb-2">Security Notice</h4>
                <p className="text-sm text-amber-700">
                  Your credentials are encrypted and stored securely. We recommend using app-specific passwords 
                  or API keys instead of your main account password.
                </p>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowEmailSettings(false)}
                >
                  Cancel
                </Button>
                <Button onClick={saveEmailIntegration}>
                  Save Configuration
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Organization Settings Tab */}
      {activeTab === 'organization' && (
        <div className="space-y-6">
          {/* Organization Header */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center">
                    <Building className="h-5 w-5 mr-2" />
                    Organization Settings
                  </CardTitle>
                  <p className="text-gray-600 mt-1">Manage your organization's join code for new members</p>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Join Code Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Key className="h-5 w-5 mr-2" />
                Join Code
              </CardTitle>
              <p className="text-gray-600 text-sm">
                Share this code with new team members to join your organization
              </p>
            </CardHeader>
            <CardContent>
              {loadingOrganization ? (
                <div className="text-center py-8">
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span className="ml-2 text-gray-600">Loading organization settings...</span>
                  </div>
                </div>
              ) : organizationSettings ? (
                <div className="space-y-6">
                  {/* Organization Info */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-medium text-gray-900 mb-2">Organization</h3>
                    <p className="text-gray-600">{organizationSettings.name}</p>
                    <p className="text-sm text-gray-500 mt-1">
                      Created: {format(parseISO(organizationSettings.created_at), 'PPP')}
                    </p>
                  </div>

                  {/* Join Code Display */}
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                          Organization Join Code
                        </h3>
                        <div className="flex items-center justify-center space-x-2">
                          <div className="bg-blue-50 border-2 border-blue-200 rounded-lg px-6 py-3">
                            <span className="text-2xl font-mono font-bold text-blue-600 tracking-wider">
                              {organizationSettings.join_code}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex justify-center space-x-3">
                        <Button
                          onClick={copyJoinCode}
                          variant="outline"
                          className="flex items-center"
                        >
                          {copySuccess ? (
                            <>
                              <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                              Copied!
                            </>
                          ) : (
                            <>
                              <Copy className="h-4 w-4 mr-2" />
                              Copy Code
                            </>
                          )}
                        </Button>
                        
                        <Button
                          onClick={regenerateJoinCode}
                          variant="outline"
                          disabled={loadingOrganization}
                          className="flex items-center"
                        >
                          <RefreshCw className={`h-4 w-4 mr-2 ${loadingOrganization ? 'animate-spin' : ''}`} />
                          Regenerate
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Instructions */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-medium text-blue-900 mb-2">How to use the join code:</h4>
                    <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                      <li>Share this 6-character code with new team members</li>
                      <li>They can use it during signup by selecting "Join with Code"</li>
                      <li>New members will be automatically added to your organization</li>
                      <li>You can regenerate the code anytime for security</li>
                    </ol>
                  </div>

                  {/* Security Note */}
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <h4 className="font-medium text-yellow-900 mb-2">Security Note:</h4>
                    <p className="text-sm text-yellow-800">
                      Regenerate the join code if you suspect it has been compromised or shared with unauthorized individuals. 
                      All previous codes will become invalid when you generate a new one.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No organization found</h3>
                  <p className="text-gray-500">Unable to load organization settings.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}