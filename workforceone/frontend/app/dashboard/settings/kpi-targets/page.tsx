'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { createClient } from '@/lib/supabase/client'
import { 
  Target, Plus, Save, Users, BarChart3, TrendingUp,
  Clock, Shield, CheckCircle, AlertTriangle, Settings,
  Calendar, Award, Activity, Edit, Trash2, Loader2,
  RefreshCw, AlertCircle
} from 'lucide-react'

interface KPITarget {
  id: string
  guard_id?: string
  guard_name?: string
  guard_email?: string
  target_type: 'check_ins' | 'patrols' | 'incidents' | 'daily_reports'
  target_value: number
  target_period: 'daily' | 'weekly' | 'monthly'
  is_active: boolean
  created_at: string
  updated_at: string
}

interface Guard {
  id: string
  name: string
  email: string
}

export default function KPITargetsPage() {
  const [kpiTargets, setKpiTargets] = useState<KPITarget[]>([])
  const [guards, setGuards] = useState<Guard[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [editingTarget, setEditingTarget] = useState<KPITarget | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const [newTarget, setNewTarget] = useState({
    guard_id: '',
    target_type: 'check_ins' as const,
    target_value: 8,
    target_period: 'daily' as const
  })

  useEffect(() => {
    loadKPITargets()
    loadGuards()
  }, [])

  const loadKPITargets = async () => {
    try {
      setError(null)
      const response = await fetch('/api/kpi-targets')
      const data = await response.json()
      
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to load targets')
      }
      
      setKpiTargets(data.targets || [])
    } catch (error) {
      console.error('Error loading KPI targets:', error)
      setError(error instanceof Error ? error.message : 'Failed to load targets')
    } finally {
      setLoading(false)
    }
  }

  const loadGuards = async () => {
    try {
      // Get real guards from user_products table
      const { data: guardUsers, error } = await supabase
        .from('user_products')
        .select(`
          user_id,
          profiles:user_id (
            id,
            email,
            full_name
          )
        `)
        .eq('product_id', 'guard-management')
        .eq('is_active', true)

      if (!error && guardUsers) {
        const transformedGuards: Guard[] = guardUsers.map(gu => {
          const profile = Array.isArray(gu.profiles) ? gu.profiles[0] : gu.profiles;
          return {
            id: gu.user_id,
            name: profile?.full_name || profile?.email || 'Unknown Guard',
            email: profile?.email || 'no-email@example.com'
          }
        })
        setGuards(transformedGuards)
      }
    } catch (error) {
      console.error('Error loading guards:', error)
    }
  }

  const handleCreateTarget = async () => {
    if (!newTarget.target_value || newTarget.target_value < 1) {
      setError('Target value must be greater than 0')
      return
    }

    setSaving(true)
    setError(null)
    
    try {
      const response = await fetch('/api/kpi-targets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newTarget),
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create target')
      }

      // Refresh the targets list
      await loadKPITargets()
      
      // Reset form and close modal
      setIsCreateModalOpen(false)
      setNewTarget({
        guard_id: '',
        target_type: 'check_ins',
        target_value: 8,
        target_period: 'daily'
      })
      
    } catch (error) {
      console.error('Error creating target:', error)
      setError(error instanceof Error ? error.message : 'Failed to create target')
    } finally {
      setSaving(false)
    }
  }

  const handleUpdateTarget = async (targetId: string, updates: Partial<KPITarget>) => {
    setSaving(true)
    setError(null)
    
    try {
      const response = await fetch('/api/kpi-targets', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: targetId,
          ...updates
        }),
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update target')
      }

      // Update local state
      setKpiTargets(targets => 
        targets.map(target => 
          target.id === targetId ? { ...target, ...updates } : target
        )
      )
      
      setIsEditModalOpen(false)
      setEditingTarget(null)
      
    } catch (error) {
      console.error('Error updating target:', error)
      setError(error instanceof Error ? error.message : 'Failed to update target')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteTarget = async (targetId: string) => {
    if (!confirm('Are you sure you want to delete this target? This action cannot be undone.')) {
      return
    }

    setSaving(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/kpi-targets?id=${targetId}`, {
        method: 'DELETE',
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete target')
      }

      // Remove from local state
      setKpiTargets(targets => targets.filter(t => t.id !== targetId))
      
    } catch (error) {
      console.error('Error deleting target:', error)
      setError(error instanceof Error ? error.message : 'Failed to delete target')
    } finally {
      setSaving(false)
    }
  }

  const toggleTargetActive = async (targetId: string, isActive: boolean) => {
    await handleUpdateTarget(targetId, { is_active: isActive })
  }

  const openEditModal = (target: KPITarget) => {
    setEditingTarget(target)
    setIsEditModalOpen(true)
  }

  const getTargetTypeDisplay = (type: string) => {
    switch (type) {
      case 'check_ins': return { label: 'Check-Ins', icon: '📱', color: 'bg-purple-100 text-purple-800' }
      case 'patrols': return { label: 'Patrols', icon: '🚶‍♂️', color: 'bg-green-100 text-green-800' }
      case 'incidents': return { label: 'Incidents', icon: '🚨', color: 'bg-red-100 text-red-800' }
      case 'daily_reports': return { label: 'Daily Reports', icon: '📋', color: 'bg-blue-100 text-blue-800' }
      default: return { label: type, icon: '📊', color: 'bg-gray-100 text-gray-800' }
    }
  }

  const getPeriodColor = (period: string) => {
    switch (period) {
      case 'daily': return 'bg-green-100 text-green-800'
      case 'weekly': return 'bg-blue-100 text-blue-800'
      case 'monthly': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Loader2 className="animate-spin h-8 w-8 text-purple-600 mx-auto mb-4" />
              <p className="text-gray-600">Loading KPI targets...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <Target className="h-8 w-8 text-purple-600 mr-3" />
              KPI Target Management
            </h1>
            <p className="text-gray-600 mt-1">Set performance targets for guards and track progress</p>
          </div>
          <div className="flex space-x-3">
            <Button variant="outline" onClick={loadKPITargets} disabled={loading || saving}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading || saving ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button variant="outline" onClick={() => window.location.href = '/dashboard/guards'}>
              <Users className="h-4 w-4 mr-2" />
              View Guards
            </Button>
            <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
              <DialogTrigger asChild>
                <Button className="bg-purple-600 hover:bg-purple-700" disabled={saving}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Target
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Create KPI Target</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  {error && (
                    <div className="flex items-center space-x-2 text-red-600 bg-red-50 p-3 rounded-lg">
                      <AlertCircle className="h-4 w-4" />
                      <span className="text-sm">{error}</span>
                    </div>
                  )}
                  
                  <div>
                    <Label htmlFor="guard_id">Target Scope</Label>
                    <Select value={newTarget.guard_id || 'organization-default'} onValueChange={(value) => setNewTarget({...newTarget, guard_id: value === 'organization-default' ? '' : value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select scope" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="organization-default">Organization Default</SelectItem>
                        {guards.map(guard => (
                          <SelectItem key={guard.id} value={guard.id}>
                            {guard.name} ({guard.email})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="target_type">KPI Type</Label>
                    <Select value={newTarget.target_type} onValueChange={(value: any) => setNewTarget({...newTarget, target_type: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="check_ins">📱 Check-Ins</SelectItem>
                        <SelectItem value="patrols">🚶‍♂️ Patrols</SelectItem>
                        <SelectItem value="incidents">🚨 Incidents</SelectItem>
                        <SelectItem value="daily_reports">📋 Daily Reports</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="target_value">Target Value</Label>
                    <Input
                      type="number"
                      min="1"
                      value={newTarget.target_value}
                      onChange={(e) => setNewTarget({...newTarget, target_value: parseInt(e.target.value) || 0})}
                    />
                  </div>

                  <div>
                    <Label htmlFor="target_period">Period</Label>
                    <Select value={newTarget.target_period} onValueChange={(value: any) => setNewTarget({...newTarget, target_period: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button onClick={handleCreateTarget} className="w-full bg-purple-600 hover:bg-purple-700" disabled={saving}>
                    {saving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Create Target
                      </>
                    )}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <Card className="border-red-200">
            <CardContent className="p-4">
              <div className="flex items-center space-x-2 text-red-600">
                <AlertCircle className="h-5 w-5" />
                <span>{error}</span>
                <Button variant="outline" size="sm" onClick={() => setError(null)}>
                  Dismiss
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* KPI Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="border-l-4 border-purple-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Targets</p>
                  <p className="text-2xl font-bold text-gray-900">{kpiTargets.filter(t => t.is_active).length}</p>
                  <p className="text-xs text-green-500">Organization-wide</p>
                </div>
                <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Target className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-green-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Guards Tracked</p>
                  <p className="text-2xl font-bold text-gray-900">{guards.length}</p>
                  <p className="text-xs text-green-500">Active guards</p>
                </div>
                <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Shield className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-blue-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Avg Daily Target</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {kpiTargets.length > 0 
                      ? Math.round(kpiTargets.filter(t => t.target_period === 'daily').reduce((sum, t) => sum + t.target_value, 0) / 4)
                      : 0
                    }
                  </p>
                  <p className="text-xs text-blue-500">Per guard</p>
                </div>
                <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <BarChart3 className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-orange-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Targets</p>
                  <p className="text-2xl font-bold text-gray-900">{kpiTargets.length}</p>
                  <p className="text-xs text-orange-500">All periods</p>
                </div>
                <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* KPI Targets Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Settings className="h-5 w-5 mr-2" />
              Current KPI Targets ({kpiTargets.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {kpiTargets.length === 0 ? (
              <div className="text-center py-8">
                <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">No KPI targets configured yet</p>
                <Button onClick={() => setIsCreateModalOpen(true)} className="bg-purple-600 hover:bg-purple-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Target
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {kpiTargets.map((target) => {
                  const typeInfo = getTargetTypeDisplay(target.target_type)
                  return (
                    <div key={target.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                      <div className="flex items-center space-x-4">
                        <div className="text-2xl">{typeInfo.icon}</div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <h3 className="font-semibold">{typeInfo.label}</h3>
                            <Badge className={typeInfo.color}>
                              {target.target_value} per {target.target_period}
                            </Badge>
                            <Badge className={getPeriodColor(target.target_period)}>
                              {target.target_period}
                            </Badge>
                          </div>
                          <div className="flex items-center space-x-2 mt-1">
                            <p className="text-sm text-gray-600">
                              {target.guard_name || 'Organization Default'}
                              {target.guard_email && (
                                <span className="text-gray-400"> • {target.guard_email}</span>
                              )}
                            </p>
                            <Switch
                              checked={target.is_active}
                              onCheckedChange={(checked) => toggleTargetActive(target.id, checked)}
                              disabled={saving}
                            />
                            <span className={`text-xs ${target.is_active ? 'text-green-600' : 'text-gray-500'}`}>
                              {target.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => openEditModal(target)}
                          disabled={saving}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleDeleteTarget(target.id)}
                          disabled={saving}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Edit Modal */}
        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Edit KPI Target</DialogTitle>
            </DialogHeader>
            {editingTarget && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="edit_target_value">Target Value</Label>
                  <Input
                    type="number"
                    min="1"
                    value={editingTarget.target_value}
                    onChange={(e) => setEditingTarget({
                      ...editingTarget,
                      target_value: parseInt(e.target.value) || 0
                    })}
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    checked={editingTarget.is_active}
                    onCheckedChange={(checked) => setEditingTarget({
                      ...editingTarget,
                      is_active: checked
                    })}
                  />
                  <Label>Active</Label>
                </div>

                <div className="flex space-x-3">
                  <Button 
                    onClick={() => handleUpdateTarget(editingTarget.id, {
                      target_value: editingTarget.target_value,
                      is_active: editingTarget.is_active
                    })} 
                    className="flex-1 bg-purple-600 hover:bg-purple-700" 
                    disabled={saving}
                  >
                    {saving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setIsEditModalOpen(false)
                      setEditingTarget(null)
                    }}
                    disabled={saving}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}