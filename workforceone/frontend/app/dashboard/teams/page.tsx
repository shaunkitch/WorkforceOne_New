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
  UserCheck
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
      console.log('User invitation created:', invitationData)

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
    </div>
  )
}