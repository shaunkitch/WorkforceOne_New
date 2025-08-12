'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PlusCircle, MapPin, User, Users, Edit, Trash2, Settings, ArrowRight, ArrowLeft } from 'lucide-react'
import { Modal } from '@/components/ui/modal'
import { Checkbox } from '@/components/ui/checkbox'

// Define the Outlet type
interface Outlet {
  id: string
  name: string
  address: string | null
  latitude: number | null
  longitude: number | null
  userCount?: number
  teamCount?: number
}

// Form data type
type OutletFormData = Omit<Outlet, 'id' | 'userCount' | 'teamCount'>

interface Profile {
  id: string
  full_name: string
}

interface Team {
  id: string
  name: string
}

export default function OutletsPage() {
  const [outlets, setOutlets] = useState<Outlet[]>([])
  const [loading, setLoading] = useState(true)
  const [isFormModalOpen, setIsFormModalOpen] = useState(false)
  const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState(false)
  const [selectedOutlet, setSelectedOutlet] = useState<Outlet | null>(null)
  const [userProfile, setUserProfile] = useState<any>(null)

  const supabase = createClient()
  const organizationId = useMemo(() => {
    return supabase.auth.getUser().then(res => {
      if (!res.data.user) return null
      return supabase.from('profiles').select('organization_id').eq('id', res.data.user.id).single().then(p => p.data?.organization_id)
    })
  }, [supabase])

  const fetchOutlets = useCallback(async () => {
    setLoading(true)
    try {
      const orgId = await organizationId
      if (!orgId) return

      const { data, error } = await supabase
        .from('outlets')
        .select('*, outlet_users(count), outlet_teams(count)')
        .eq('organization_id', orgId)
      
      if (error) throw error

      const formattedOutlets = data.map(o => ({
        ...o,
        userCount: o.outlet_users[0]?.count || 0,
        teamCount: o.outlet_teams[0]?.count || 0,
      }))

      setOutlets(formattedOutlets)
    } catch (error) {
      console.error('Error fetching outlets:', error)
    } finally {
      setLoading(false)
    }
  }, [supabase, organizationId])

  useEffect(() => {
    fetchUserProfile()
    fetchOutlets()
  }, [fetchOutlets])

  const fetchUserProfile = async () => {
    try {
      const { data: user } = await supabase.auth.getUser()
      if (!user.user) return

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.user.id)
        .single()

      setUserProfile(profile)
    } catch (error) {
      console.error('Error fetching user profile:', error)
    }
  }

  // Permission helper functions
  const canCreateOutlets = () => {
    return userProfile?.role === 'admin' || userProfile?.role === 'manager'
  }

  const canEditOutlets = () => {
    return userProfile?.role === 'admin' || userProfile?.role === 'manager'
  }

  const canDeleteOutlets = () => {
    return userProfile?.role === 'admin'
  }

  const handleAddOutlet = () => {
    setSelectedOutlet(null)
    setIsFormModalOpen(true)
  }

  const handleEditOutlet = (outlet: Outlet) => {
    setSelectedOutlet(outlet)
    setIsFormModalOpen(true)
  }

  const handleOpenAssignmentModal = (outlet: Outlet) => {
    setSelectedOutlet(outlet)
    setIsAssignmentModalOpen(true)
  }

  const handleDeleteOutlet = async (outletId: string) => {
    if (window.confirm('Are you sure you want to delete this outlet?')) {
      try {
        const { error } = await supabase.from('outlets').delete().eq('id', outletId)
        if (error) throw error
        fetchOutlets() // Refresh the list
      } catch (error) {
        console.error('Error deleting outlet:', error)
      }
    }
  }

  const handleFormSubmit = async (formData: OutletFormData) => {
    try {
      const orgId = await organizationId
      if (!orgId) throw new Error('Organization not found')

      const dataToUpsert = {
        ...formData,
        latitude: formData.latitude ? parseFloat(String(formData.latitude)) : null,
        longitude: formData.longitude ? parseFloat(String(formData.longitude)) : null,
        organization_id: orgId,
      }

      let error
      if (selectedOutlet) {
        const result = await supabase.from('outlets').update(dataToUpsert).eq('id', selectedOutlet.id)
        error = result.error
      } else {
        const result = await supabase.from('outlets').insert(dataToUpsert)
        error = result.error
      }

      if (error) throw error

      setIsFormModalOpen(false)
      fetchOutlets()
    } catch (error) {
      console.error('Error saving outlet:', error)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Outlets</h1>
          <p className="text-gray-600">Manage your organization's outlets and assign them to users or teams.</p>
        </div>
        {canCreateOutlets() && (
          <Button onClick={handleAddOutlet}>
            <PlusCircle className="h-4 w-4 mr-2" />
            Add Outlet
          </Button>
        )}
      </div>

      {loading ? (
        <p>Loading outlets...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {outlets.map(outlet => (
            <Card key={outlet.id} className="flex flex-col">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center">
                    <MapPin className="h-5 w-5 mr-2" />
                    {outlet.name}
                  </div>
                  <div className="flex items-center space-x-2">
                    {canEditOutlets() && (
                      <Button variant="ghost" size="icon" onClick={() => handleEditOutlet(outlet)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                    )}
                    {canDeleteOutlets() && (
                      <Button variant="ghost" size="icon" onClick={() => handleDeleteOutlet(outlet.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-grow">
                <p className="text-sm text-gray-600 mb-4">{outlet.address || 'No address provided'}</p>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-2">
                    <Users className="h-4 w-4 text-gray-500" />
                    <span>{outlet.teamCount} Teams</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-gray-500" />
                    <span>{outlet.userCount} Users</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full" onClick={() => handleOpenAssignmentModal(outlet)}>
                  <Settings className="h-4 w-4 mr-2" />
                  Manage Assignments
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {isFormModalOpen && (
        <Modal isOpen={isFormModalOpen} onClose={() => setIsFormModalOpen(false)} title={selectedOutlet ? 'Edit Outlet' : 'Add Outlet'}>
          <OutletForm 
            onSubmit={handleFormSubmit} 
            initialData={selectedOutlet} 
          />
        </Modal>
      )}

      {isAssignmentModalOpen && selectedOutlet && (
        <Modal isOpen={isAssignmentModalOpen} onClose={() => setIsAssignmentModalOpen(false)} title={`Manage Assignments for ${selectedOutlet.name}`} className="sm:max-w-2xl">
          <AssignmentManager outlet={selectedOutlet} organizationId={organizationId} onAssignmentsChanged={fetchOutlets} />
        </Modal>
      )}
    </div>
  )
}

// Outlet Form Component
interface OutletFormProps {
  onSubmit: (data: OutletFormData) => void
  initialData: Outlet | null
}

function OutletForm({ onSubmit, initialData }: OutletFormProps) {
  const [formData, setFormData] = useState<OutletFormData>({
    name: initialData?.name || '',
    address: initialData?.address || '',
    latitude: initialData?.latitude || null,
    longitude: initialData?.longitude || null,
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">Outlet Name</Label>
        <Input id="name" name="name" value={formData.name} onChange={handleChange} required />
      </div>
      <div>
        <Label htmlFor="address">Address</Label>
        <Input id="address" name="address" value={formData.address || ''} onChange={handleChange} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="latitude">Latitude</Label>
          <Input id="latitude" name="latitude" type="number" value={formData.latitude || ''} onChange={handleChange} />
        </div>
        <div>
          <Label htmlFor="longitude">Longitude</Label>
          <Input id="longitude" name="longitude" type="number" value={formData.longitude || ''} onChange={handleChange} />
        </div>
      </div>
      <div className="flex justify-end">
        <Button type="submit">{initialData ? 'Update' : 'Create'} Outlet</Button>
      </div>
    </form>
  )
}

// Assignment Manager Component
interface AssignmentManagerProps {
  outlet: Outlet
  organizationId: Promise<string | null | undefined>
  onAssignmentsChanged: () => void
}

function AssignmentManager({ outlet, organizationId, onAssignmentsChanged }: AssignmentManagerProps) {
  const [activeTab, setActiveTab] = useState('users')
  const [users, setUsers] = useState<Profile[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [assignedUsers, setAssignedUsers] = useState<string[]>([])
  const [assignedTeams, setAssignedTeams] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  const supabase = createClient()

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const orgId = await organizationId
      if (!orgId) return

      const { data: usersData } = await supabase.from('profiles').select('id, full_name').eq('organization_id', orgId)
      setUsers(usersData || [])

      const { data: teamsData } = await supabase.from('teams').select('id, name').eq('organization_id', orgId)
      setTeams(teamsData || [])

      const { data: assignedUsersData } = await supabase.from('outlet_users').select('user_id').eq('outlet_id', outlet.id)
      setAssignedUsers(assignedUsersData?.map(u => u.user_id) || [])

      const { data: assignedTeamsData } = await supabase.from('outlet_teams').select('team_id').eq('outlet_id', outlet.id)
      setAssignedTeams(assignedTeamsData?.map(t => t.team_id) || [])

    } catch (error) {
      console.error('Error fetching assignment data:', error)
    } finally {
      setLoading(false)
    }
  }, [supabase, organizationId, outlet.id])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleUserAssignmentChange = (userId: string, isAssigned: boolean) => {
    setAssignedUsers(prev => isAssigned ? [...prev, userId] : prev.filter(id => id !== userId))
  }

  const handleTeamAssignmentChange = (teamId: string, isAssigned: boolean) => {
    setAssignedTeams(prev => isAssigned ? [...prev, teamId] : prev.filter(id => id !== teamId))
  }

  const handleSaveChanges = async () => {
    try {
      await supabase.from('outlet_users').delete().eq('outlet_id', outlet.id)
      if (assignedUsers.length > 0) {
        await supabase.from('outlet_users').insert(assignedUsers.map(user_id => ({ outlet_id: outlet.id, user_id })))
      }

      await supabase.from('outlet_teams').delete().eq('outlet_id', outlet.id)
      if (assignedTeams.length > 0) {
        await supabase.from('outlet_teams').insert(assignedTeams.map(team_id => ({ outlet_id: outlet.id, team_id })))
      }
      onAssignmentsChanged()
      alert('Assignments saved successfully!')
    } catch (error) {
      console.error('Error saving assignments:', error)
      alert('Failed to save assignments.')
    }
  }

  if (loading) return <p>Loading assignments...</p>

  return (
    <div>
      <div className="flex border-b">
        <button onClick={() => setActiveTab('users')} className={`px-4 py-2 ${activeTab === 'users' ? 'border-b-2 border-blue-500' : ''}`}>Users</button>
        <button onClick={() => setActiveTab('teams')} className={`px-4 py-2 ${activeTab === 'teams' ? 'border-b-2 border-blue-500' : ''}`}>Teams</button>
      </div>

      <div className="py-4">
        {activeTab === 'users' && (
          <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto">
            {users.map(user => (
              <div key={user.id} className="flex items-center space-x-2">
                <Checkbox id={`user-${user.id}`} checked={assignedUsers.includes(user.id)} onCheckedChange={checked => handleUserAssignmentChange(user.id, !!checked)} />
                <Label htmlFor={`user-${user.id}`}>{user.full_name}</Label>
              </div>
            ))}
          </div>
        )}
        {activeTab === 'teams' && (
          <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto">
            {teams.map(team => (
              <div key={team.id} className="flex items-center space-x-2">
                <Checkbox id={`team-${team.id}`} checked={assignedTeams.includes(team.id)} onCheckedChange={checked => handleTeamAssignmentChange(team.id, !!checked)} />
                <Label htmlFor={`team-${team.id}`}>{team.name}</Label>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-end mt-4">
        <Button onClick={handleSaveChanges}>Save Changes</Button>
      </div>
    </div>
  )
}
