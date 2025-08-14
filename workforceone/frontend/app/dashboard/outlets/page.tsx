'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { PlusCircle, MapPin, Users, User, Edit, Trash2, Settings, Loader2, Upload, Download, Grid, List, Filter, Eye, EyeOff } from 'lucide-react'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Switch } from '@/components/ui/switch'

interface Outlet {
  id: string
  name: string
  outlet_code: string | null
  group_name: string | null
  address: string | null
  province: string | null
  phone: string | null
  email: string | null
  manager_name: string | null
  manager_phone: string | null
  manager_email: string | null
  latitude: number | null
  longitude: number | null
  organization_id: string
  form_required: boolean
  required_form_id: string | null
  created_at: string
  updated_at: string
}

interface Form {
  id: string
  title: string
  description: string | null
  organization_id: string
  status: 'draft' | 'active' | 'paused' | 'completed' | 'archived'
  fields?: any[]
  settings?: any
  created_by: string
  created_at: string
  updated_at: string
}

interface OutletGroupForm {
  id: string
  organization_id: string
  group_name: string
  form_id: string
  is_active: boolean
  form?: Form
}

interface Profile {
  id: string
  full_name: string
  email: string
  role: string
  organization_id: string
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
  const [showImportModal, setShowImportModal] = useState(false)
  const [selectedOutlet, setSelectedOutlet] = useState<Outlet | null>(null)
  const [userProfile, setUserProfile] = useState<Profile | null>(null)
  const [error, setError] = useState<string | null>(null)
  
  // New state for enhanced functionality
  const [viewMode, setViewMode] = useState<'tiles' | 'table'>('tiles')
  const [selectedGroup, setSelectedGroup] = useState<string>('all')
  const [hiddenGroups, setHiddenGroups] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  
  // Form management state
  const [forms, setForms] = useState<Form[]>([])
  const [groupForms, setGroupForms] = useState<OutletGroupForm[]>([])
  const [showGroupFormModal, setShowGroupFormModal] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    fetchUserProfile()
    fetchOutlets()
    fetchForms()
    fetchGroupForms()
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

      // Fetch outlets with form information
      const { data: outletsData, error: outletsError } = await supabase
        .from('outlets')
        .select('*, forms:required_form_id(id, title)')
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

  const fetchForms = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single()

      if (!profile?.organization_id) return

      const { data: formsData, error } = await supabase
        .from('forms')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .in('status', ['active', 'draft']) // Include active and draft forms
        .order('title')

      if (error) throw error
      setForms(formsData || [])
    } catch (error) {
      console.error('Error fetching forms:', error)
    }
  }

  const fetchGroupForms = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single()

      if (!profile?.organization_id) return

      const { data: groupFormsData, error } = await supabase
        .from('outlet_group_forms')
        .select('*, form:forms(id, title, description)')
        .eq('organization_id', profile.organization_id)
        .eq('is_active', true)
        .order('group_name')

      if (error) throw error
      setGroupForms(groupFormsData || [])
    } catch (error) {
      console.error('Error fetching group forms:', error)
    }
  }

  const canManageOutlets = () => {
    return userProfile?.role === 'admin' || userProfile?.role === 'manager'
  }

  const canDeleteOutlets = () => {
    return userProfile?.role === 'admin'
  }

  const toggleFormRequired = async (outlet: Outlet, formRequired: boolean) => {
    try {
      const { error } = await supabase
        .from('outlets')
        .update({ form_required: formRequired })
        .eq('id', outlet.id)

      if (error) throw error

      // Update local state
      setOutlets(outlets.map(o => 
        o.id === outlet.id ? { ...o, form_required: formRequired } : o
      ))

    } catch (error) {
      console.error('Error updating form requirement:', error)
      alert('Failed to update form requirement')
    }
  }

  const updateOutletForm = async (outlet: Outlet, formId: string | null) => {
    try {
      const { error } = await supabase
        .from('outlets')
        .update({ required_form_id: formId })
        .eq('id', outlet.id)

      if (error) throw error

      // Update local state
      setOutlets(outlets.map(o => 
        o.id === outlet.id ? { ...o, required_form_id: formId } : o
      ))

    } catch (error) {
      console.error('Error updating outlet form:', error)
      alert('Failed to update outlet form')
    }
  }

  // Legacy functions - keeping for reference
  // const assignFormToGroup = async (groupName: string, formId: string) => {
  //   try {
  //     if (!userProfile?.organization_id) return

  //     const { error } = await supabase
  //       .from('outlet_group_forms')
  //       .upsert({
  //         organization_id: userProfile.organization_id,
  //         group_name: groupName,
  //         form_id: formId,
  //         created_by: userProfile.id,
  //         is_active: true
  //       })

  //     if (error) throw error

  //     await fetchGroupForms()
  //     alert('Form assigned to group successfully!')

  //   } catch (error) {
  //     console.error('Error assigning form to group:', error)
  //     alert('Failed to assign form to group')
  //   }
  // }

  // const removeGroupForm = async (groupFormId: string) => {
  //   try {
  //     const { error } = await supabase
  //       .from('outlet_group_forms')
  //       .delete()
  //       .eq('id', groupFormId)

  //     if (error) throw error

  //     await fetchGroupForms()

  //   } catch (error) {
  //     console.error('Error removing group form:', error)
  //     alert('Failed to remove group form')
  //   }
  // }

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

  // Helper functions for grouping and filtering
  const getUniqueGroups = () => {
    const groups = [...new Set(outlets.map(outlet => outlet.group_name || 'Ungrouped'))]
    return groups.sort()
  }

  const getFilteredOutlets = () => {
    let filtered = outlets

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(outlet => 
        outlet.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        outlet.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        outlet.group_name?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filter by selected group
    if (selectedGroup !== 'all') {
      filtered = filtered.filter(outlet => 
        (outlet.group_name || 'Ungrouped') === selectedGroup
      )
    }

    return filtered
  }

  const getGroupedOutlets = () => {
    const filtered = getFilteredOutlets()
    const grouped: Record<string, Outlet[]> = {}

    filtered.forEach(outlet => {
      const groupName = outlet.group_name || 'Ungrouped'
      if (!grouped[groupName]) {
        grouped[groupName] = []
      }
      grouped[groupName].push(outlet)
    })

    // Sort outlets within each group
    Object.keys(grouped).forEach(group => {
      grouped[group].sort((a, b) => a.name.localeCompare(b.name))
    })

    return grouped
  }

  const toggleGroupVisibility = (groupName: string) => {
    setHiddenGroups(prev => 
      prev.includes(groupName)
        ? prev.filter(g => g !== groupName)
        : [...prev, groupName]
    )
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
      {/* Enhanced Header */}
      <div className="space-y-6">
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
            <div className="flex items-center space-x-3">
              <Button 
                onClick={() => setShowImportModal(true)} 
                variant="outline"
                className="border-blue-200 text-blue-700 hover:bg-blue-50"
              >
                <Upload className="h-4 w-4 mr-2" />
                Import CSV
              </Button>
              <Button onClick={handleCreateOutlet} className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800">
                <PlusCircle className="h-4 w-4 mr-2" />
                Create Outlet
              </Button>
              <Button 
                onClick={() => setShowGroupFormModal(true)}
                variant="outline" 
                className="border-blue-200 hover:bg-blue-50"
              >
                <Settings className="h-4 w-4 mr-2" />
                Manage Group Forms
              </Button>
            </div>
          )}
        </div>

        {/* Controls Bar */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between bg-white p-4 rounded-lg border">
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
            {/* Search */}
            <div className="relative">
              <Input
                placeholder="Search outlets..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64 pl-10"
              />
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            </div>

            {/* Group Filter */}
            <Select value={selectedGroup} onValueChange={setSelectedGroup}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Groups" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Groups</SelectItem>
                {getUniqueGroups().map(group => (
                  <SelectItem key={group} value={group}>
                    {group} ({outlets.filter(o => (o.group_name || 'Ungrouped') === group).length})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* View Toggle */}
          <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-1">
            <Button
              variant={viewMode === 'tiles' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('tiles')}
              className="flex items-center space-x-2"
            >
              <Grid className="h-4 w-4" />
              <span>Tiles</span>
            </Button>
            <Button
              variant={viewMode === 'table' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('table')}
              className="flex items-center space-x-2"
            >
              <List className="h-4 w-4" />
              <span>Table</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Outlets Display */}
      {viewMode === 'tiles' ? (
        /* Tiles View - Grouped */
        <div className="space-y-8">
          {Object.entries(getGroupedOutlets()).map(([groupName, groupOutlets]) => (
            <div key={groupName} className="space-y-4">
              {/* Group Header */}
              <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg border">
                <div className="flex items-center space-x-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleGroupVisibility(groupName)}
                    className="p-1 h-8 w-8"
                  >
                    {hiddenGroups.includes(groupName) ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                  <h2 className="text-xl font-semibold text-gray-800">{groupName}</h2>
                  <span className="text-sm text-gray-500 bg-gray-200 px-2 py-1 rounded-full">
                    {groupOutlets.length} outlet{groupOutlets.length !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>

              {/* Group Outlets */}
              {!hiddenGroups.includes(groupName) && (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {groupOutlets.map((outlet) => (
                    <Card key={outlet.id} className="group hover:shadow-lg transition-all duration-200 border-l-4 border-l-blue-500">
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                              <MapPin className="h-5 w-5 text-blue-600" />
                              <span className="text-lg font-semibold">{outlet.name}</span>
                            </div>
                            {outlet.outlet_code && (
                              <div className="text-sm text-gray-500 font-mono">
                                {outlet.outlet_code}
                              </div>
                            )}
                            {outlet.group_name && (
                              <div className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full inline-block">
                                {outlet.group_name}
                              </div>
                            )}
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
                          <div className="space-y-2">
                            {outlet.address && (
                              <p className="text-sm text-gray-600 flex items-start space-x-2">
                                <MapPin className="h-4 w-4 mt-0.5 text-gray-400" />
                                <span>
                                  {outlet.address}
                                  {outlet.province && <>, {outlet.province}</>}
                                </span>
                              </p>
                            )}
                            
                            {outlet.phone && (
                              <p className="text-sm text-gray-600">
                                📞 {outlet.phone}
                              </p>
                            )}
                            
                            {outlet.email && (
                              <p className="text-sm text-gray-600">
                                ✉️ {outlet.email}
                              </p>
                            )}
                            
                            {outlet.manager_name && (
                              <p className="text-sm text-gray-600">
                                👤 Manager: {outlet.manager_name}
                              </p>
                            )}
                          </div>
                          
                          {(outlet.latitude && outlet.longitude) && (
                            <p className="text-xs text-gray-500 border-t pt-2">
                              Coordinates: {outlet.latitude}, {outlet.longitude}
                            </p>
                          )}

                          {/* Form Requirements Section */}
                          {canManageOutlets() && (
                            <div className="pt-3 border-t border-gray-100 space-y-3">
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-gray-700">Form Required</span>
                                <Switch
                                  checked={outlet.form_required || false}
                                  onCheckedChange={(checked) => toggleFormRequired(outlet, checked)}
                                />
                              </div>
                              
                              {outlet.form_required && (
                                <div className="space-y-2">
                                  <Label className="text-xs text-gray-600">Individual Form Assignment</Label>
                                  <Select
                                    value={outlet.required_form_id || 'none'}
                                    onValueChange={(value) => updateOutletForm(outlet, value === 'none' ? null : value)}
                                  >
                                    <SelectTrigger className="h-8 text-xs">
                                      <SelectValue placeholder="Select form..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="none">No individual form</SelectItem>
                                      {forms.map((form) => (
                                        <SelectItem key={form.id} value={form.id}>
                                          {form.title}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  
                                  {/* Show group form if applicable */}
                                  {outlet.group_name && (() => {
                                    const groupForm = groupForms.find(gf => gf.group_name === outlet.group_name)
                                    if (groupForm) {
                                      return (
                                        <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded flex items-center justify-between">
                                          <span>📋 Group Form: {groupForm.form?.title}</span>
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => window.open(`/dashboard/outlets/complete-form?form=${groupForm.form_id}&outlet=${outlet.id}`, '_blank')}
                                            className="text-xs h-6 px-2"
                                          >
                                            Test Form
                                          </Button>
                                        </div>
                                      )
                                    }
                                    return null
                                  })()}

                                  {/* Show individual form if assigned */}
                                  {outlet.required_form_id && (
                                    <div className="text-xs text-green-600 bg-green-50 p-2 rounded flex items-center justify-between">
                                      <span>📝 Individual Form Required</span>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => window.open(`/dashboard/outlets/complete-form?form=${outlet.required_form_id}&outlet=${outlet.id}`, '_blank')}
                                        className="text-xs h-6 px-2"
                                      >
                                        Test Form
                                      </Button>
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
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
                </div>
              )}
            </div>
          ))}

          {outlets.length === 0 && (
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
          )}
        </div>
      ) : (
        /* Table View - Grouped */
        <div className="space-y-6">
          {Object.entries(getGroupedOutlets()).map(([groupName, groupOutlets]) => (
            <Card key={groupName} className="overflow-hidden">
              <CardHeader className="bg-gray-50 border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleGroupVisibility(groupName)}
                      className="p-1 h-8 w-8"
                    >
                      {hiddenGroups.includes(groupName) ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                    <CardTitle className="text-lg">{groupName}</CardTitle>
                    <span className="text-sm text-gray-500 bg-gray-200 px-2 py-1 rounded-full">
                      {groupOutlets.length} outlet{groupOutlets.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
              </CardHeader>

              {!hiddenGroups.includes(groupName) && (
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b">
                        <tr>
                          <th className="text-left p-4 font-medium text-gray-900">Name</th>
                          <th className="text-left p-4 font-medium text-gray-900">Address</th>
                          <th className="text-left p-4 font-medium text-gray-900">Manager</th>
                          <th className="text-center p-4 font-medium text-gray-900">Teams</th>
                          <th className="text-center p-4 font-medium text-gray-900">Users</th>
                          {canManageOutlets() && (
                            <th className="text-center p-4 font-medium text-gray-900">Actions</th>
                          )}
                        </tr>
                      </thead>
                      <tbody>
                        {groupOutlets.map((outlet) => (
                          <tr key={outlet.id} className="border-b hover:bg-gray-50">
                            <td className="p-4">
                              <div className="flex items-center space-x-2">
                                <MapPin className="h-4 w-4 text-blue-600" />
                                <div>
                                  <div className="font-medium">{outlet.name}</div>
                                  {outlet.outlet_code && (
                                    <div className="text-sm text-gray-500 font-mono">{outlet.outlet_code}</div>
                                  )}
                                </div>
                              </div>
                            </td>
                            <td className="p-4 text-gray-600">
                              <div>
                                {outlet.address || '-'}
                                {outlet.province && <div className="text-sm text-gray-500">{outlet.province}</div>}
                              </div>
                            </td>
                            <td className="p-4 text-gray-600">
                              {outlet.manager_name || '-'}
                              {outlet.manager_phone && (
                                <div className="text-sm text-gray-500">{outlet.manager_phone}</div>
                              )}
                            </td>
                            <td className="p-4 text-center">
                              <span className="inline-flex items-center space-x-1">
                                <Users className="h-4 w-4 text-gray-500" />
                                <span>{outletStats[outlet.id]?.teamCount || 0}</span>
                              </span>
                            </td>
                            <td className="p-4 text-center">
                              <span className="inline-flex items-center space-x-1">
                                <User className="h-4 w-4 text-gray-500" />
                                <span>{outletStats[outlet.id]?.userCount || 0}</span>
                              </span>
                            </td>
                            {canManageOutlets() && (
                              <td className="p-4">
                                <div className="flex items-center justify-center space-x-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleAssignUsers(outlet)}
                                    className="h-8 w-8 p-0"
                                  >
                                    <Settings className="h-4 w-4" />
                                  </Button>
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
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              )}
            </Card>
          ))}

          {outlets.length === 0 && (
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
          )}
        </div>
      )}

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

      {/* Import CSV Modal */}
      {showImportModal && (
        <ImportCSVModal
          isOpen={showImportModal}
          onClose={() => setShowImportModal(false)}
          onSuccess={fetchOutlets}
        />
      )}

      {/* Group Forms Management Modal */}
      {showGroupFormModal && (
        <GroupFormsModal
          isOpen={showGroupFormModal}
          onClose={() => setShowGroupFormModal(false)}
          onSuccess={() => {
            fetchGroupForms()
            fetchOutlets()
          }}
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
    group_name: outlet?.group_name || '',
    address: outlet?.address || '',
    province: outlet?.province || '',
    phone: outlet?.phone || '',
    email: outlet?.email || '',
    manager_name: outlet?.manager_name || '',
    manager_phone: outlet?.manager_phone || '',
    manager_email: outlet?.manager_email || '',
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
        group_name: formData.group_name.trim() || null,
        address: formData.address.trim() || null,
        province: formData.province.trim() || null,
        phone: formData.phone.trim() || null,
        email: formData.email.trim() || null,
        manager_name: formData.manager_name.trim() || null,
        manager_phone: formData.manager_phone.trim() || null,
        manager_email: formData.manager_email.trim() || null,
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
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-90vh overflow-y-auto">
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
              <Label htmlFor="group_name">Group / Category</Label>
              <Input
                id="group_name"
                value={formData.group_name}
                onChange={(e) => setFormData({ ...formData, group_name: e.target.value })}
                placeholder="e.g., Main Branches, Sub Offices, Retail Stores"
                className="mt-1"
              />
              <p className="text-xs text-gray-500 mt-1">
                Optional: Group outlets by type, region, or category for better organization
              </p>
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

            <div>
              <Label htmlFor="province">Province/State</Label>
              <Input
                id="province"
                value={formData.province}
                onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                placeholder="Enter province or state"
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="Outlet phone number"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="Outlet email address"
                  className="mt-1"
                />
              </div>
            </div>

            <div className="border-t pt-4">
              <h3 className="text-sm font-medium text-gray-900 mb-3">Manager Information</h3>
              
              <div>
                <Label htmlFor="manager_name">Manager Name</Label>
                <Input
                  id="manager_name"
                  value={formData.manager_name}
                  onChange={(e) => setFormData({ ...formData, manager_name: e.target.value })}
                  placeholder="Manager full name"
                  className="mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <Label htmlFor="manager_phone">Manager Phone</Label>
                  <Input
                    id="manager_phone"
                    value={formData.manager_phone}
                    onChange={(e) => setFormData({ ...formData, manager_phone: e.target.value })}
                    placeholder="Manager phone number"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="manager_email">Manager Email</Label>
                  <Input
                    id="manager_email"
                    type="email"
                    value={formData.manager_email}
                    onChange={(e) => setFormData({ ...formData, manager_email: e.target.value })}
                    placeholder="Manager email address"
                    className="mt-1"
                  />
                </div>
              </div>
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
          .select('id, full_name, email, role, organization_id')
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

// Import CSV Modal Component
interface ImportCSVModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

interface CSVOutletData {
  name: string
  group_name?: string
  address?: string
  province?: string
  phone?: string
  email?: string
  manager_name?: string
  manager_phone?: string
  manager_email?: string
  latitude?: number
  longitude?: number
}

function ImportCSVModal({ isOpen, onClose, onSuccess }: ImportCSVModalProps) {
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [previewData, setPreviewData] = useState<CSVOutletData[]>([])
  const [showPreview, setShowPreview] = useState(false)
  const [errors, setErrors] = useState<string[]>([])
  const [assignToGroup, setAssignToGroup] = useState<string>('')
  const [existingGroups, setExistingGroups] = useState<string[]>([])
  const supabase = createClient()

  useEffect(() => {
    if (isOpen) {
      fetchExistingGroups()
    }
  }, [isOpen])

  const fetchExistingGroups = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single()

      if (!profile?.organization_id) return

      const { data: outlets } = await supabase
        .from('outlets')
        .select('group_name')
        .eq('organization_id', profile.organization_id)

      if (outlets) {
        const groups = [...new Set(outlets.map(o => o.group_name).filter(Boolean))]
        setExistingGroups(groups.sort())
      }
    } catch (error) {
      console.error('Error fetching existing groups:', error)
    }
  }

  const downloadTemplate = () => {
    const link = document.createElement('a')
    link.href = '/templates/outlets_template.csv'
    link.download = 'outlets_template.csv'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const parseCSV = (text: string): CSVOutletData[] => {
    const lines = text.trim().split('\n')
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
    
    return lines.slice(1).map(line => {
      const values: string[] = []
      let current = ''
      let inQuotes = false
      
      for (let i = 0; i < line.length; i++) {
        const char = line[i]
        if (char === '"' && (i === 0 || line[i-1] === ',')) {
          inQuotes = true
        } else if (char === '"' && (i === line.length - 1 || line[i+1] === ',')) {
          inQuotes = false
        } else if (char === ',' && !inQuotes) {
          values.push(current.trim())
          current = ''
        } else {
          current += char
        }
      }
      values.push(current.trim())

      const outlet: any = {}
      headers.forEach((header, index) => {
        const value = values[index]?.replace(/"/g, '') || ''
        
        switch (header.toLowerCase()) {
          case 'name':
            outlet.name = value
            break
          case 'group_name':
          case 'group':
            outlet.group_name = value || null
            break
          case 'address':
            outlet.address = value || null
            break
          case 'province':
            outlet.province = value || null
            break
          case 'phone':
            outlet.phone = value || null
            break
          case 'email':
            outlet.email = value || null
            break
          case 'manager_name':
            outlet.manager_name = value || null
            break
          case 'manager_phone':
            outlet.manager_phone = value || null
            break
          case 'manager_email':
            outlet.manager_email = value || null
            break
          case 'latitude':
            outlet.latitude = value ? parseFloat(value) : null
            break
          case 'longitude':
            outlet.longitude = value ? parseFloat(value) : null
            break
        }
      })
      
      return outlet
    })
  }

  const validateData = (data: CSVOutletData[]): string[] => {
    const validationErrors: string[] = []
    
    data.forEach((outlet, index) => {
      const row = index + 2 // +2 because index starts at 0 and we skip header
      
      if (!outlet.name || outlet.name.trim() === '') {
        validationErrors.push(`Row ${row}: Name is required`)
      }
      
      if (outlet.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(outlet.email)) {
        validationErrors.push(`Row ${row}: Invalid email format`)
      }
      
      if (outlet.manager_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(outlet.manager_email)) {
        validationErrors.push(`Row ${row}: Invalid manager email format`)
      }
      
      if (outlet.latitude && (isNaN(outlet.latitude) || outlet.latitude < -90 || outlet.latitude > 90)) {
        validationErrors.push(`Row ${row}: Invalid latitude (must be between -90 and 90)`)
      }
      
      if (outlet.longitude && (isNaN(outlet.longitude) || outlet.longitude < -180 || outlet.longitude > 180)) {
        validationErrors.push(`Row ${row}: Invalid longitude (must be between -180 and 180)`)
      }
    })
    
    return validationErrors
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile && selectedFile.type === 'text/csv') {
      setFile(selectedFile)
      setShowPreview(false)
      setPreviewData([])
      setErrors([])
    } else {
      alert('Please select a valid CSV file')
    }
  }

  const handlePreview = async () => {
    if (!file) return
    
    setLoading(true)
    try {
      const text = await file.text()
      const data = parseCSV(text)
      const validationErrors = validateData(data)
      
      setPreviewData(data)
      setErrors(validationErrors)
      setShowPreview(true)
    } catch (error) {
      console.error('Error parsing CSV:', error)
      alert('Error parsing CSV file. Please check the format.')
    } finally {
      setLoading(false)
    }
  }

  const handleImport = async () => {
    if (!file || errors.length > 0) return
    
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

      const outletsToInsert = previewData.map(outlet => ({
        ...outlet,
        group_name: (assignToGroup && assignToGroup !== '__no_group__') ? assignToGroup : outlet.group_name || null,
        organization_id: profile.organization_id
      }))

      const { error } = await supabase
        .from('outlets')
        .insert(outletsToInsert)

      if (error) throw error

      onSuccess()
      onClose()
      alert(`Successfully imported ${outletsToInsert.length} outlets!`)
    } catch (error) {
      console.error('Error importing outlets:', error)
      alert('Failed to import outlets. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-90vh overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Import Outlets from CSV</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {!showPreview ? (
            <div className="space-y-6">
              <div className="text-center border-2 border-dashed border-gray-300 rounded-lg p-8">
                <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <div className="space-y-2">
                  <p className="text-lg font-medium text-gray-900">Upload CSV File</p>
                  <p className="text-sm text-gray-600">
                    Import multiple outlets at once using a CSV file
                  </p>
                </div>
                
                <div className="mt-4">
                  <Input
                    type="file"
                    accept=".csv"
                    onChange={handleFileChange}
                    className="max-w-xs mx-auto"
                  />
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-medium text-blue-900 mb-2">CSV Format Requirements:</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• <strong>Required:</strong> name</li>
                  <li>• <strong>Optional:</strong> group_name (or group), address, province, phone, email</li>
                  <li>• <strong>Optional:</strong> manager_name, manager_phone, manager_email</li>
                  <li>• <strong>Optional:</strong> latitude, longitude</li>
                </ul>
              </div>

              {/* Group Assignment Option */}
              <div className="bg-gray-50 p-4 rounded-lg border">
                <h3 className="font-medium text-gray-900 mb-3">Group Assignment</h3>
                <p className="text-sm text-gray-600 mb-3">
                  Optionally assign all imported outlets to a specific group. This will override any group_name values in the CSV.
                </p>
                <div className="flex items-center space-x-3">
                  <Label htmlFor="assignGroup" className="text-sm font-medium min-w-0">
                    Assign to Group:
                  </Label>
                  <div className="flex-1 max-w-xs">
                    <Select value={assignToGroup} onValueChange={setAssignToGroup}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select group (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__no_group__">No group assignment</SelectItem>
                        {existingGroups.map(group => (
                          <SelectItem key={group} value={group}>
                            {group}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="text-sm text-gray-500">
                    or
                  </div>
                  <Input
                    placeholder="Create new group"
                    value={assignToGroup && assignToGroup !== '__no_group__' && !existingGroups.includes(assignToGroup) ? assignToGroup : ''}
                    onChange={(e) => setAssignToGroup(e.target.value)}
                    className="max-w-40"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <Button
                  onClick={downloadTemplate}
                  variant="outline"
                  className="flex items-center"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download Template
                </Button>
                
                <Button
                  onClick={handlePreview}
                  disabled={!file || loading}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    'Preview Data'
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Preview ({previewData.length} outlets)</h3>
                <Button
                  onClick={() => setShowPreview(false)}
                  variant="outline"
                  size="sm"
                >
                  Back to Upload
                </Button>
              </div>

              {errors.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <h4 className="font-medium text-red-900 mb-2">Validation Errors:</h4>
                  <ul className="text-sm text-red-800 space-y-1">
                    {errors.map((error, index) => (
                      <li key={index}>• {error}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="border rounded-lg overflow-hidden">
                <div className="max-h-96 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="text-left p-3 border-b">Name</th>
                        <th className="text-left p-3 border-b">Group</th>
                        <th className="text-left p-3 border-b">Address</th>
                        <th className="text-left p-3 border-b">Province</th>
                        <th className="text-left p-3 border-b">Phone</th>
                        <th className="text-left p-3 border-b">Manager</th>
                      </tr>
                    </thead>
                    <tbody>
                      {previewData.map((outlet, index) => {
                        const finalGroup = (assignToGroup && assignToGroup !== '__no_group__') ? assignToGroup : outlet.group_name || 'Ungrouped'
                        return (
                          <tr key={index} className="border-b">
                            <td className="p-3 font-medium">{outlet.name}</td>
                            <td className="p-3">
                              <span className={`text-xs px-2 py-1 rounded-full ${
                                finalGroup === 'Ungrouped' 
                                  ? 'bg-gray-100 text-gray-600' 
                                  : 'bg-blue-100 text-blue-700'
                              }`}>
                                {finalGroup}
                              </span>
                            </td>
                            <td className="p-3 text-gray-600">{outlet.address || '-'}</td>
                            <td className="p-3 text-gray-600">{outlet.province || '-'}</td>
                            <td className="p-3 text-gray-600">{outlet.phone || '-'}</td>
                            <td className="p-3 text-gray-600">{outlet.manager_name || '-'}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <Button
                  onClick={onClose}
                  variant="outline"
                  disabled={loading}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleImport}
                  disabled={loading || errors.length > 0}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Importing...
                    </>
                  ) : (
                    `Import ${previewData.length} Outlets`
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Group Forms Management Modal Component
interface GroupFormsModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

function GroupFormsModal({ isOpen, onClose, onSuccess }: GroupFormsModalProps) {
  const [selectedGroup, setSelectedGroup] = useState('')
  const [selectedForm, setSelectedForm] = useState('')
  const [loading, setLoading] = useState(false)
  const supabase = createClient()
  
  // Get unique group names from outlets
  const [outlets, setOutlets] = useState<Outlet[]>([])
  const [forms, setForms] = useState<Form[]>([])
  const [groupForms, setGroupForms] = useState<OutletGroupForm[]>([])
  const [userProfile, setUserProfile] = useState<Profile | null>(null)

  useEffect(() => {
    if (isOpen) {
      fetchData()
    }
  }, [isOpen])

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (!profile?.organization_id) return
      setUserProfile(profile)

      // Fetch outlets for group names
      const { data: outletsData } = await supabase
        .from('outlets')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .order('name')

      setOutlets(outletsData || [])

      // Fetch forms (using status instead of is_active)
      const { data: formsData, error: formsError } = await supabase
        .from('forms')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .in('status', ['active', 'draft']) // Include active and draft forms
        .order('title')

      if (formsError) {
        console.error('Error fetching forms:', formsError)
      } else {
        console.log('Fetched forms:', formsData)
      }

      setForms(formsData || [])

      // Fetch existing group forms
      const { data: groupFormsData } = await supabase
        .from('outlet_group_forms')
        .select('*, form:forms(id, title, description)')
        .eq('organization_id', profile.organization_id)
        .eq('is_active', true)
        .order('group_name')

      setGroupForms(groupFormsData || [])

    } catch (error) {
      console.error('Error fetching data:', error)
    }
  }

  const createSampleForms = async () => {
    if (!userProfile?.organization_id) return
    
    try {
      const sampleForms = [
        {
          title: 'Daily Visit Report',
          description: 'Standard daily outlet visit report form',
          organization_id: userProfile.organization_id,
          created_by: userProfile.id,
          is_active: true,
          fields: [
            { type: 'text', label: 'Outlet Condition', required: true },
            { type: 'select', label: 'Service Quality', options: ['Excellent', 'Good', 'Fair', 'Poor'], required: true },
            { type: 'textarea', label: 'Notes', required: false }
          ]
        },
        {
          title: 'Quality Inspection Form',
          description: 'Form for quality inspection visits',
          organization_id: userProfile.organization_id,
          created_by: userProfile.id,
          is_active: true,
          fields: [
            { type: 'checkbox', label: 'Safety Standards Met', required: true },
            { type: 'number', label: 'Cleanliness Score (1-10)', required: true },
            { type: 'textarea', label: 'Improvement Recommendations', required: false }
          ]
        },
        {
          title: 'Customer Feedback Collection',
          description: 'Form to collect customer feedback during visits',
          organization_id: userProfile.organization_id,
          created_by: userProfile.id,
          is_active: true,
          fields: [
            { type: 'text', label: 'Customer Name', required: false },
            { type: 'select', label: 'Overall Satisfaction', options: ['Very Satisfied', 'Satisfied', 'Neutral', 'Dissatisfied'], required: true },
            { type: 'textarea', label: 'Customer Comments', required: false }
          ]
        }
      ]

      const { error } = await supabase
        .from('forms')
        .insert(sampleForms)

      if (error) throw error

      await fetchData()
      alert('Sample forms created successfully!')

    } catch (error) {
      console.error('Error creating sample forms:', error)
      alert('Failed to create sample forms')
    }
  }

  const handleAssignForm = async () => {
    if (!selectedGroup || !selectedForm || !userProfile) return

    setLoading(true)
    try {
      const { error } = await supabase
        .from('outlet_group_forms')
        .upsert({
          organization_id: userProfile.organization_id,
          group_name: selectedGroup,
          form_id: selectedForm,
          created_by: userProfile.id,
          is_active: true
        })

      if (error) throw error

      setSelectedGroup('')
      setSelectedForm('')
      await fetchData()
      onSuccess()
      alert('Form assigned to group successfully!')

    } catch (error) {
      console.error('Error assigning form:', error)
      alert('Failed to assign form to group')
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveGroupForm = async (groupFormId: string) => {
    try {
      const { error } = await supabase
        .from('outlet_group_forms')
        .delete()
        .eq('id', groupFormId)

      if (error) throw error

      await fetchData()
      onSuccess()

    } catch (error) {
      console.error('Error removing group form:', error)
      alert('Failed to remove group form')
    }
  }

  // Get unique group names
  const uniqueGroups = Array.from(
    new Set(outlets.filter(o => o.group_name).map(o => o.group_name))
  ).filter(Boolean)

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold">Manage Group Forms</h2>
          <p className="text-sm text-gray-600 mt-1">
            Assign forms to entire outlet groups
          </p>
        </div>

        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {/* Assign New Group Form */}
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-medium mb-3">Assign Form to Group</h3>
            {/* Debug info */}
            {process.env.NODE_ENV === 'development' && (
              <div className="text-xs text-gray-500 mb-2">
                Debug: {uniqueGroups.length} groups, {forms.length} forms available
                {forms.length === 0 && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={createSampleForms}
                    className="ml-2 text-xs h-6"
                  >
                    Create Sample Forms
                  </Button>
                )}
              </div>
            )}
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <Label className="text-sm">Select Group</Label>
                <Select value={selectedGroup} onValueChange={setSelectedGroup}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose group..." />
                  </SelectTrigger>
                  <SelectContent>
                    {uniqueGroups.map((group) => (
                      <SelectItem key={group} value={group!}>
                        {group}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-sm">Select Form</Label>
                <Select value={selectedForm} onValueChange={setSelectedForm}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose form..." />
                  </SelectTrigger>
                  <SelectContent>
                    {forms.length === 0 ? (
                      <SelectItem value="no-forms" disabled>
                        No forms available
                      </SelectItem>
                    ) : (
                      forms.map((form) => (
                        <SelectItem key={form.id} value={form.id}>
                          {form.title}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button 
              onClick={handleAssignForm}
              disabled={!selectedGroup || !selectedForm || loading}
              className="w-full"
            >
              {loading ? 'Assigning...' : 'Assign Form to Group'}
            </Button>
          </div>

          {/* Current Group Forms */}
          <div>
            <h3 className="font-medium mb-3">Current Group Form Assignments</h3>
            {groupForms.length === 0 ? (
              <p className="text-sm text-gray-500 py-4 text-center">
                No group forms assigned yet
              </p>
            ) : (
              <div className="space-y-2">
                {groupForms.map((groupForm) => (
                  <div key={groupForm.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">{groupForm.group_name}</div>
                      <div className="text-sm text-gray-600">
                        📋 {groupForm.form?.title}
                      </div>
                      <div className="text-xs text-gray-500">
                        {outlets.filter(o => o.group_name === groupForm.group_name).length} outlets in group
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRemoveGroupForm(groupForm.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="p-6 border-t flex justify-end space-x-3">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  )
}