'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  ArrowLeft,
  Users,
  User,
  Building2,
  Calendar,
  Bell,
  Send,
  Trash2,
  Plus,
  Search
} from 'lucide-react'
import { format, addDays } from 'date-fns'

interface Form {
  id: string
  title: string
  description?: string
  status: string
}

interface Profile {
  id: string
  full_name: string
  email: string
  role: string
  department?: string
  is_active: boolean
}

interface Team {
  id: string
  name: string
  department: string
  team_members: { profiles: Profile }[]
}

interface Assignment {
  id: string
  assigned_to_user_id?: string
  assigned_to_team_id?: string
  assigned_to_role?: string
  assigned_to_department?: string
  is_mandatory: boolean
  due_date?: string
  reminder_enabled: boolean
  reminder_days_before: number
  assigned_at: string
  assigned_by: string
  profiles?: Profile
  teams?: Team
}

export default function FormAssignPage() {
  const params = useParams()
  const router = useRouter()
  const formId = params.id as string
  
  const [form, setForm] = useState<Form | null>(null)
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [users, setUsers] = useState<Profile[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  
  // Assignment form state
  const [assignmentType, setAssignmentType] = useState<'user' | 'team' | 'role' | 'department'>('user')
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [selectedTeams, setSelectedTeams] = useState<string[]>([])
  const [selectedRole, setSelectedRole] = useState('')
  const [selectedDepartment, setSelectedDepartment] = useState('')
  const [isMandatory, setIsMandatory] = useState(false)
  const [dueDate, setDueDate] = useState('')
  const [reminderEnabled, setReminderEnabled] = useState(true)
  const [reminderDaysBefore, setReminderDaysBefore] = useState(3)

  const supabase = createClient()

  const roles = ['admin', 'manager', 'lead', 'member']
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
    fetchForm()
    fetchAssignments()
    fetchUsers()
    fetchTeams()
  }, [formId])

  const fetchForm = async () => {
    try {
      const { data, error } = await supabase
        .from('forms')
        .select('id, title, description, status')
        .eq('id', formId)
        .single()

      if (error) throw error
      setForm(data)
    } catch (error) {
      console.error('Error fetching form:', error)
    }
  }

  const fetchAssignments = async () => {
    try {
      const { data, error } = await supabase
        .from('form_assignments')
        .select(`
          *,
          profiles:assigned_to_user_id(full_name, email),
          teams:assigned_to_team_id(name, department)
        `)
        .eq('form_id', formId)
        .order('assigned_at', { ascending: false })

      if (error) throw error
      setAssignments(data || [])
    } catch (error) {
      console.error('Error fetching assignments:', error)
    }
  }

  const fetchUsers = async () => {
    try {
      const { data: user } = await supabase.auth.getUser()
      if (!user.user) return

      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.user.id)
        .single()

      if (!profile?.organization_id) return

      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, role, department, is_active')
        .eq('organization_id', profile.organization_id)
        .eq('is_active', true)
        .order('full_name')

      if (error) throw error
      setUsers(data || [])
    } catch (error) {
      console.error('Error fetching users:', error)
    }
  }

  const fetchTeams = async () => {
    try {
      const { data: user } = await supabase.auth.getUser()
      if (!user.user) return

      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.user.id)
        .single()

      if (!profile?.organization_id) return

      const { data, error } = await supabase
        .from('teams')
        .select(`
          id,
          name,
          department,
          team_members(
            profiles(id, full_name, email, role, department)
          )
        `)
        .eq('organization_id', profile.organization_id)
        .order('name')

      if (error) throw error
      setTeams(data || [])
    } catch (error) {
      console.error('Error fetching teams:', error)
    } finally {
      setLoading(false)
    }
  }

  const createAssignment = async () => {
    if (!form) return

    setSaving(true)
    try {
      const { data: user } = await supabase.auth.getUser()
      if (!user.user) return

      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.user.id)
        .single()

      if (!profile?.organization_id) return

      const baseAssignment = {
        form_id: formId,
        organization_id: profile.organization_id,
        is_mandatory: isMandatory,
        due_date: dueDate || null,
        reminder_enabled: reminderEnabled,
        reminder_days_before: reminderDaysBefore,
        assigned_by: user.user.id
      }

      const assignments = []

      // Create assignments based on type
      switch (assignmentType) {
        case 'user':
          for (const userId of selectedUsers) {
            assignments.push({
              ...baseAssignment,
              assigned_to_user_id: userId
            })
          }
          break
        
        case 'team':
          for (const teamId of selectedTeams) {
            assignments.push({
              ...baseAssignment,
              assigned_to_team_id: teamId
            })
          }
          break
        
        case 'role':
          assignments.push({
            ...baseAssignment,
            assigned_to_role: selectedRole
          })
          break
        
        case 'department':
          assignments.push({
            ...baseAssignment,
            assigned_to_department: selectedDepartment
          })
          break
      }

      if (assignments.length === 0) {
        alert('Please select at least one target for assignment.')
        return
      }

      const { error } = await supabase
        .from('form_assignments')
        .insert(assignments)

      if (error) throw error

      // Reset form
      setSelectedUsers([])
      setSelectedTeams([])
      setSelectedRole('')
      setSelectedDepartment('')
      setIsMandatory(false)
      setDueDate('')
      setReminderEnabled(true)
      setReminderDaysBefore(3)

      // Refresh assignments
      await fetchAssignments()
      
      alert('Form assigned successfully!')
    } catch (error) {
      console.error('Error creating assignment:', error)
      alert('Failed to assign form. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const deleteAssignment = async (assignmentId: string) => {
    if (!confirm('Are you sure you want to remove this assignment?')) return

    try {
      const { error } = await supabase
        .from('form_assignments')
        .delete()
        .eq('id', assignmentId)

      if (error) throw error

      setAssignments(assignments.filter(a => a.id !== assignmentId))
    } catch (error) {
      console.error('Error deleting assignment:', error)
      alert('Failed to remove assignment. Please try again.')
    }
  }

  const getAssignmentTarget = (assignment: Assignment) => {
    if (assignment.assigned_to_user_id && assignment.profiles) {
      return {
        type: 'User',
        name: assignment.profiles.full_name,
        icon: User
      }
    } else if (assignment.assigned_to_team_id && assignment.teams) {
      return {
        type: 'Team',
        name: assignment.teams.name,
        icon: Users
      }
    } else if (assignment.assigned_to_role) {
      return {
        type: 'Role',
        name: assignment.assigned_to_role.charAt(0).toUpperCase() + assignment.assigned_to_role.slice(1),
        icon: Building2
      }
    } else if (assignment.assigned_to_department) {
      return {
        type: 'Department',
        name: assignment.assigned_to_department,
        icon: Building2
      }
    }
    return { type: 'Unknown', name: 'Unknown', icon: User }
  }

  const filteredUsers = users.filter(user => 
    user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const filteredTeams = teams.filter(team =>
    team.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    team.department.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading assignment page...</div>
      </div>
    )
  }

  if (!form) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Form not found</h3>
        <p className="text-gray-500 mb-4">The requested form could not be found.</p>
        <Button onClick={() => router.push('/dashboard/forms')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Forms
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button 
            variant="outline" 
            onClick={() => router.push('/dashboard/forms')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Assign Form</h1>
            <p className="text-gray-600">{form.title}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Assignment Form */}
        <Card>
          <CardHeader>
            <CardTitle>Create New Assignment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Assignment Type */}
            <div>
              <Label>Assignment Type</Label>
              <Select value={assignmentType} onValueChange={(value: any) => setAssignmentType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">Individual Users</SelectItem>
                  <SelectItem value="team">Teams</SelectItem>
                  <SelectItem value="role">By Role</SelectItem>
                  <SelectItem value="department">By Department</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Target Selection */}
            {assignmentType === 'user' && (
              <div>
                <Label>Select Users</Label>
                <div className="space-y-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search users..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  <div className="max-h-48 overflow-y-auto space-y-2">
                    {filteredUsers.map(user => (
                      <div key={user.id} className="flex items-center space-x-2">
                        <Checkbox
                          checked={selectedUsers.includes(user.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedUsers([...selectedUsers, user.id])
                            } else {
                              setSelectedUsers(selectedUsers.filter(id => id !== user.id))
                            }
                          }}
                        />
                        <div className="flex-1">
                          <div className="text-sm font-medium">{user.full_name}</div>
                          <div className="text-xs text-gray-500">{user.email} • {user.role}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {assignmentType === 'team' && (
              <div>
                <Label>Select Teams</Label>
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
                  <div className="max-h-48 overflow-y-auto space-y-2">
                    {filteredTeams.map(team => (
                      <div key={team.id} className="flex items-center space-x-2">
                        <Checkbox
                          checked={selectedTeams.includes(team.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedTeams([...selectedTeams, team.id])
                            } else {
                              setSelectedTeams(selectedTeams.filter(id => id !== team.id))
                            }
                          }}
                        />
                        <div className="flex-1">
                          <div className="text-sm font-medium">{team.name}</div>
                          <div className="text-xs text-gray-500">
                            {team.department} • {team.team_members?.length || 0} members
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {assignmentType === 'role' && (
              <div>
                <Label>Select Role</Label>
                <Select value={selectedRole} onValueChange={setSelectedRole}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a role" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map(role => (
                      <SelectItem key={role} value={role}>
                        {role.charAt(0).toUpperCase() + role.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {assignmentType === 'department' && (
              <div>
                <Label>Select Department</Label>
                <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map(dept => (
                      <SelectItem key={dept} value={dept}>
                        {dept}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Assignment Settings */}
            <div className="space-y-4 border-t pt-4">
              <div className="flex items-center space-x-2">
                <Switch checked={isMandatory} onCheckedChange={setIsMandatory} />
                <Label>Mandatory assignment</Label>
              </div>

              <div>
                <Label htmlFor="dueDate">Due Date (Optional)</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  min={format(new Date(), 'yyyy-MM-dd')}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch checked={reminderEnabled} onCheckedChange={setReminderEnabled} />
                <Label>Send reminders</Label>
              </div>

              {reminderEnabled && (
                <div>
                  <Label htmlFor="reminderDays">Reminder days before due date</Label>
                  <Input
                    id="reminderDays"
                    type="number"
                    value={reminderDaysBefore}
                    onChange={(e) => setReminderDaysBefore(parseInt(e.target.value))}
                    min="1"
                    max="30"
                  />
                </div>
              )}
            </div>

            <Button 
              onClick={createAssignment} 
              disabled={saving}
              className="w-full"
            >
              <Send className="h-4 w-4 mr-2" />
              {saving ? 'Creating Assignment...' : 'Create Assignment'}
            </Button>
          </CardContent>
        </Card>

        {/* Current Assignments */}
        <Card>
          <CardHeader>
            <CardTitle>Current Assignments ({assignments.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {assignments.length === 0 ? (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No assignments yet</h3>
                <p className="text-gray-500">Create your first assignment to get started.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {assignments.map(assignment => {
                  const target = getAssignmentTarget(assignment)
                  const IconComponent = target.icon
                  
                  return (
                    <div key={assignment.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3">
                          <IconComponent className="h-5 w-5 text-gray-400 mt-0.5" />
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="font-medium">{target.name}</span>
                              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                                {target.type}
                              </span>
                              {assignment.is_mandatory && (
                                <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded">
                                  Mandatory
                                </span>
                              )}
                            </div>
                            <div className="text-sm text-gray-500 mt-1">
                              Assigned {format(new Date(assignment.assigned_at), 'MMM d, yyyy')}
                            </div>
                            {assignment.due_date && (
                              <div className="flex items-center text-sm text-gray-500 mt-1">
                                <Calendar className="h-3 w-3 mr-1" />
                                Due {format(new Date(assignment.due_date), 'MMM d, yyyy')}
                              </div>
                            )}
                            {assignment.reminder_enabled && (
                              <div className="flex items-center text-sm text-gray-500 mt-1">
                                <Bell className="h-3 w-3 mr-1" />
                                Reminder {assignment.reminder_days_before} days before
                              </div>
                            )}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => deleteAssignment(assignment.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}