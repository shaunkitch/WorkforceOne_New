'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { PlusCircle, MapPin, Users, User, Edit, Trash2, Settings, Loader2 } from 'lucide-react'
import { Checkbox } from '@/components/ui/checkbox'

interface Outlet {
  id: string
  name: string
  address: string | null
  latitude: number | null
  longitude: number | null
  organization_id: string
  created_at: string
  updated_at: string
}

interface Profile {
  id: string
  full_name: string
  email: string
  role: string
}

interface Team {
  id: string
  name: string
}

interface OutletStats {
  userCount: number
  teamCount: number
}

export default function OutletsPage() {
  const [outlets, setOutlets] = useState<Outlet[]>([])
  const [outletStats, setOutletStats] = useState<Record<string, OutletStats>>({})
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [showEditForm, setShowEditForm] = useState(false)
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [selectedOutlet, setSelectedOutlet] = useState<Outlet | null>(null)
  const [userProfile, setUserProfile] = useState<Profile | null>(null)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  useEffect(() => {
    fetchUserProfile()
    fetchOutlets()
  }, [])

  const fetchUserProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error) throw error
      setUserProfile(profile)
    } catch (error) {
      console.error('Error fetching user profile:', error)
      setError('Failed to load user profile')
    }
  }

  const fetchOutlets = async () => {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single()

      if (!profile?.organization_id) throw new Error('No organization found')

      // Fetch outlets
      const { data: outletsData, error: outletsError } = await supabase
        .from('outlets')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .order('name')

      if (outletsError) throw outletsError

      setOutlets(outletsData || [])

      // Fetch stats for each outlet
      const statsPromises = (outletsData || []).map(async (outlet) => {
        const [userCountResult, teamCountResult] = await Promise.all([
          supabase
            .from('outlet_users')
            .select('*', { count: 'exact' })
            .eq('outlet_id', outlet.id),
          supabase
            .from('outlet_teams')
            .select('*', { count: 'exact' })
            .eq('outlet_id', outlet.id)
        ])

        return {
          outletId: outlet.id,
          userCount: userCountResult.count || 0,
          teamCount: teamCountResult.count || 0
        }
      })

      const stats = await Promise.all(statsPromises)
      const statsMap = stats.reduce((acc, stat) => {
        acc[stat.outletId] = {
          userCount: stat.userCount,
          teamCount: stat.teamCount
        }
        return acc
      }, {} as Record<string, OutletStats>)

      setOutletStats(statsMap)

    } catch (error) {
      console.error('Error fetching outlets:', error)
      setError('Failed to load outlets')
    } finally {
      setLoading(false)
    }
  }

  const canManageOutlets = () => {
    return userProfile?.role === 'admin' || userProfile?.role === 'manager'
  }

  const canDeleteOutlets = () => {
    return userProfile?.role === 'admin'
  }

  const handleCreateOutlet = () => {
    setSelectedOutlet(null)
    setShowCreateForm(true)
  }

  const handleEditOutlet = (outlet: Outlet) => {
    setSelectedOutlet(outlet)
    setShowEditForm(true)
  }

  const handleDeleteOutlet = async (outlet: Outlet) => {
    if (!window.confirm(`Are you sure you want to delete "${outlet.name}"? This will remove all assignments.`)) {
      return
    }

    try {
      const { error } = await supabase
        .from('outlets')
        .delete()
        .eq('id', outlet.id)

      if (error) throw error

      await fetchOutlets()
    } catch (error) {
      console.error('Error deleting outlet:', error)
      alert('Failed to delete outlet')
    }
  }

  const handleAssignUsers = (outlet: Outlet) => {
    setSelectedOutlet(outlet)
    setShowAssignModal(true)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <p className="text-gray-600">Loading outlets...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Outlets Management
          </h1>
          <p className="text-gray-600 mt-1">
            Manage your organization's outlets and assign teams or users
          </p>
        </div>
        {canManageOutlets() && (
          <Button onClick={handleCreateOutlet} className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800">
            <PlusCircle className="h-4 w-4 mr-2" />
            Create Outlet
          </Button>
        )}
      </div>

      {/* Outlets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {outlets.map((outlet) => (
          <Card key={outlet.id} className="group hover:shadow-lg transition-all duration-200 border-l-4 border-l-blue-500">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <MapPin className="h-5 w-5 text-blue-600" />
                  <span className="text-lg font-semibold">{outlet.name}</span>
                </div>
                {canManageOutlets() && (
                  <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditOutlet(outlet)}
                      className="h-8 w-8 p-0"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    {canDeleteOutlets() && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteOutlet(outlet)}
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                )}
              </CardTitle>
            </CardHeader>

            <CardContent>
              <div className="space-y-3">
                {outlet.address && (
                  <p className="text-sm text-gray-600 flex items-start space-x-2">
                    <MapPin className="h-4 w-4 mt-0.5 text-gray-400" />
                    <span>{outlet.address}</span>
                  </p>
                )}
                
                {(outlet.latitude && outlet.longitude) && (
                  <p className="text-xs text-gray-500">
                    Coordinates: {outlet.latitude}, {outlet.longitude}
                  </p>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                  <div className="flex items-center space-x-1 text-sm text-gray-600">
                    <Users className="h-4 w-4" />
                    <span>{outletStats[outlet.id]?.teamCount || 0} Teams</span>
                  </div>
                  <div className="flex items-center space-x-1 text-sm text-gray-600">
                    <User className="h-4 w-4" />
                    <span>{outletStats[outlet.id]?.userCount || 0} Users</span>
                  </div>
                </div>
              </div>
            </CardContent>

            <CardFooter>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => handleAssignUsers(outlet)}
                disabled={!canManageOutlets()}
              >
                <Settings className="h-4 w-4 mr-2" />
                Manage Assignments
              </Button>
            </CardFooter>
          </Card>
        ))}

        {outlets.length === 0 && (
          <div className="col-span-full">
            <Card className="border-dashed border-2 border-gray-300">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <MapPin className="h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No outlets yet</h3>
                <p className="text-gray-600 text-center mb-4">
                  Get started by creating your first outlet location
                </p>
                {canManageOutlets() && (
                  <Button onClick={handleCreateOutlet}>
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Create First Outlet
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreateForm && (
        <OutletFormModal
          isOpen={showCreateForm}
          onClose={() => setShowCreateForm(false)}
          onSuccess={fetchOutlets}
          title="Create New Outlet"
        />
      )}

      {/* Edit Modal */}
      {showEditForm && selectedOutlet && (
        <OutletFormModal
          isOpen={showEditForm}
          onClose={() => setShowEditForm(false)}
          onSuccess={fetchOutlets}
          title="Edit Outlet"
          outlet={selectedOutlet}
        />
      )}

      {/* Assignment Modal */}
      {showAssignModal && selectedOutlet && (
        <AssignmentModal
          isOpen={showAssignModal}
          onClose={() => setShowAssignModal(false)}
          onSuccess={fetchOutlets}
          outlet={selectedOutlet}
        />
      )}
    </div>
  )
}

// Outlet Form Modal Component
interface OutletFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  title: string
  outlet?: Outlet
}

function OutletFormModal({ isOpen, onClose, onSuccess, title, outlet }: OutletFormModalProps) {
  const [formData, setFormData] = useState({
    name: outlet?.name || '',
    address: outlet?.address || '',
    latitude: outlet?.latitude?.toString() || '',
    longitude: outlet?.longitude?.toString() || ''
  })
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single()

      if (!profile?.organization_id) throw new Error('No organization found')

      const outletData = {
        name: formData.name.trim(),
        address: formData.address.trim() || null,
        latitude: formData.latitude ? parseFloat(formData.latitude) : null,
        longitude: formData.longitude ? parseFloat(formData.longitude) : null,
        organization_id: profile.organization_id
      }

      let error
      if (outlet) {
        const result = await supabase
          .from('outlets')
          .update(outletData)
          .eq('id', outlet.id)
        error = result.error
      } else {
        const result = await supabase
          .from('outlets')
          .insert([outletData])
        error = result.error
      }

      if (error) throw error

      onSuccess()
      onClose()
    } catch (error) {
      console.error('Error saving outlet:', error)
      alert('Failed to save outlet. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-90vh overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Outlet Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter outlet name"
                required
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Enter outlet address"
                rows={2}
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="latitude">Latitude</Label>
                <Input
                  id="latitude"
                  type="number"
                  step="any"
                  value={formData.latitude}
                  onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                  placeholder="e.g., 40.7128"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="longitude">Longitude</Label>
                <Input
                  id="longitude"
                  type="number"
                  step="any"
                  value={formData.longitude}
                  onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                  placeholder="e.g., -74.0060"
                  className="mt-1"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading || !formData.name.trim()}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  outlet ? 'Update Outlet' : 'Create Outlet'
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

// Assignment Modal Component
interface AssignmentModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  outlet: Outlet
}

function AssignmentModal({ isOpen, onClose, onSuccess, outlet }: AssignmentModalProps) {
  const [activeTab, setActiveTab] = useState<'users' | 'teams'>('users')
  const [users, setUsers] = useState<Profile[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [assignedUsers, setAssignedUsers] = useState<string[]>([])
  const [assignedTeams, setAssignedTeams] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  const supabase = createClient()

  useEffect(() => {
    if (isOpen) {
      fetchAssignmentData()
    }
  }, [isOpen, outlet.id])

  const fetchAssignmentData = async () => {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single()

      if (!profile?.organization_id) throw new Error('No organization found')

      // Fetch users, teams, and current assignments in parallel
      const [usersResult, teamsResult, userAssignmentsResult, teamAssignmentsResult] = await Promise.all([
        supabase
          .from('profiles')
          .select('id, full_name, email, role')
          .eq('organization_id', profile.organization_id)
          .eq('is_active', true)
          .order('full_name'),
        
        supabase
          .from('teams')
          .select('id, name')
          .eq('organization_id', profile.organization_id)
          .order('name'),
        
        supabase
          .from('outlet_users')
          .select('user_id')
          .eq('outlet_id', outlet.id),
        
        supabase
          .from('outlet_teams')
          .select('team_id')
          .eq('outlet_id', outlet.id)
      ])

      if (usersResult.error) throw usersResult.error
      if (teamsResult.error) throw teamsResult.error
      if (userAssignmentsResult.error) throw userAssignmentsResult.error
      if (teamAssignmentsResult.error) throw teamAssignmentsResult.error

      setUsers(usersResult.data || [])
      setTeams(teamsResult.data || [])
      setAssignedUsers(userAssignmentsResult.data?.map(a => a.user_id) || [])
      setAssignedTeams(teamAssignmentsResult.data?.map(a => a.team_id) || [])

    } catch (error) {
      console.error('Error fetching assignment data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)

      // Update user assignments
      await supabase
        .from('outlet_users')
        .delete()
        .eq('outlet_id', outlet.id)

      if (assignedUsers.length > 0) {
        const userInserts = assignedUsers.map(userId => ({
          outlet_id: outlet.id,
          user_id: userId
        }))
        
        const { error: userError } = await supabase
          .from('outlet_users')
          .insert(userInserts)
        
        if (userError) throw userError
      }

      // Update team assignments
      await supabase
        .from('outlet_teams')
        .delete()
        .eq('outlet_id', outlet.id)

      if (assignedTeams.length > 0) {
        const teamInserts = assignedTeams.map(teamId => ({
          outlet_id: outlet.id,
          team_id: teamId
        }))
        
        const { error: teamError } = await supabase
          .from('outlet_teams')
          .insert(teamInserts)
        
        if (teamError) throw teamError
      }

      onSuccess()
      onClose()
      
    } catch (error) {
      console.error('Error saving assignments:', error)
      alert('Failed to save assignments. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const toggleUserAssignment = (userId: string) => {
    setAssignedUsers(prev => 
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    )
  }

  const toggleTeamAssignment = (teamId: string) => {
    setAssignedTeams(prev => 
      prev.includes(teamId)
        ? prev.filter(id => id !== teamId)
        : [...prev, teamId]
    )
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-90vh overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              Manage Assignments - {outlet.name}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200 mb-6">
            <nav className="flex space-x-8">
              <button
                onClick={() => setActiveTab('users')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'users'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Users ({assignedUsers.length})
              </button>
              <button
                onClick={() => setActiveTab('teams')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'teams'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Teams ({assignedTeams.length})
              </button>
            </nav>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
              <span className="ml-2 text-gray-600">Loading...</span>
            </div>
          ) : (
            <div className="space-y-4">
              {activeTab === 'users' && (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {users.map(user => (
                    <div key={user.id} className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded">
                      <Checkbox
                        id={`user-${user.id}`}
                        checked={assignedUsers.includes(user.id)}
                        onCheckedChange={() => toggleUserAssignment(user.id)}
                      />
                      <div className="flex-1">
                        <Label htmlFor={`user-${user.id}`} className="text-sm font-medium cursor-pointer">
                          {user.full_name}
                        </Label>
                        <p className="text-xs text-gray-500">{user.email} • {user.role}</p>
                      </div>
                    </div>
                  ))}
                  {users.length === 0 && (
                    <p className="text-gray-500 text-center py-4">No users found</p>
                  )}
                </div>
              )}

              {activeTab === 'teams' && (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {teams.map(team => (
                    <div key={team.id} className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded">
                      <Checkbox
                        id={`team-${team.id}`}
                        checked={assignedTeams.includes(team.id)}
                        onCheckedChange={() => toggleTeamAssignment(team.id)}
                      />
                      <Label htmlFor={`team-${team.id}`} className="text-sm font-medium cursor-pointer flex-1">
                        {team.name}
                      </Label>
                    </div>
                  ))}
                  {teams.length === 0 && (
                    <p className="text-gray-500 text-center py-4">No teams found</p>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-6 border-t">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving || loading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}