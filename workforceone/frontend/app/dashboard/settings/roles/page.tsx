'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Shield, Users, Crown, Eye, Wrench, UserCheck, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import { devLog } from '@/lib/utils/logger'

interface User {
  id: string
  full_name: string
  email: string
  role: string
  work_type?: string
  department?: string
  is_active: boolean
}

interface Role {
  id: string
  name: string
  description: string
}

const roleIcons: Record<string, { icon: any, color: string, bgColor: string }> = {
  super_admin: { icon: Crown, color: 'text-purple-600', bgColor: 'bg-purple-50 border-purple-200' },
  organization_admin: { icon: Shield, color: 'text-red-600', bgColor: 'bg-red-50 border-red-200' },
  manager: { icon: UserCheck, color: 'text-blue-600', bgColor: 'bg-blue-50 border-blue-200' },
  supervisor: { icon: Eye, color: 'text-green-600', bgColor: 'bg-green-50 border-green-200' },
  employee: { icon: Users, color: 'text-gray-600', bgColor: 'bg-gray-50 border-gray-200' },
  guard: { icon: Shield, color: 'text-amber-600', bgColor: 'bg-amber-50 border-amber-200' },
  rep: { icon: Wrench, color: 'text-indigo-600', bgColor: 'bg-indigo-50 border-indigo-200' }
}

export default function RoleManagementPage() {
  const [users, setUsers] = useState<User[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState<string | null>(null)

  useEffect(() => {
    fetchRolesAndUsers()
  }, [])

  const fetchRolesAndUsers = async () => {
    try {
      const response = await fetch('/api/roles')
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to fetch roles and users')
      }
      
      const data = await response.json()
      setUsers(data.users || [])
      setRoles(data.roles || [])
      devLog('Loaded roles and users:', data)
    } catch (error: any) {
      console.error('Error fetching roles and users:', error)
      toast.error(error.message || 'Failed to load roles and users')
    } finally {
      setLoading(false)
    }
  }

  const updateUserRole = async (userId: string, newRole: string, workType?: string) => {
    if (updating) return
    
    setUpdating(userId)
    try {
      const response = await fetch('/api/roles', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          role: newRole,
          work_type: workType
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update user role')
      }

      // Update local state
      setUsers(users.map(user => 
        user.id === userId 
          ? { ...user, role: newRole, work_type: workType || user.work_type }
          : user
      ))

      toast.success('User role updated successfully')
    } catch (error: any) {
      console.error('Error updating user role:', error)
      toast.error(error.message || 'Failed to update user role')
    } finally {
      setUpdating(null)
    }
  }

  const getRoleInfo = (roleId: string) => {
    return roleIcons[roleId] || roleIcons.employee
  }

  const getWorkTypeColor = (workType?: string) => {
    switch (workType) {
      case 'security': return 'bg-amber-100 text-amber-800'
      case 'field': return 'bg-green-100 text-green-800'
      case 'remote': return 'bg-blue-100 text-blue-800'
      case 'hybrid': return 'bg-purple-100 text-purple-800'
      case 'office': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-600'
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto py-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3 mb-8"></div>
          <div className="space-y-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Role Management</h1>
        <p className="text-gray-600 mt-2">
          Manage user roles and permissions across your organization. Control access to different product features and system capabilities.
        </p>
      </div>

      {/* Role Overview */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-600" />
            Role Overview
          </CardTitle>
          <CardDescription>
            Understanding the role hierarchy and their capabilities within the WorkforceOne system.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {roles.map((role) => {
              const roleInfo = getRoleInfo(role.id)
              const Icon = roleInfo.icon
              
              return (
                <div key={role.id} className={`p-4 rounded-lg border ${roleInfo.bgColor}`}>
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-white rounded-lg shadow-sm">
                      <Icon className={`h-5 w-5 ${roleInfo.color}`} />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">{role.name}</h4>
                      <p className="text-sm text-gray-600 mt-1">{role.description}</p>
                      <div className="mt-2">
                        <Badge variant="secondary" className="text-xs">
                          {users.filter(u => u.role === role.id).length} users
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* User Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-green-600" />
            User Role Assignments
          </CardTitle>
          <CardDescription>
            Assign roles and work types to control user access across Guard Management, Workforce Management, and Time Tracking systems.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {users.map((user) => {
              const roleInfo = getRoleInfo(user.role)
              const Icon = roleInfo.icon
              const isUpdating = updating === user.id
              
              return (
                <div key={user.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
                  <div className="flex items-center gap-4 flex-1">
                    <div className={`p-2 rounded-lg ${roleInfo.bgColor}`}>
                      <Icon className={`h-4 w-4 ${roleInfo.color}`} />
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <span className="font-semibold text-gray-900">{user.full_name}</span>
                        <Badge 
                          variant={user.is_active ? "default" : "secondary"}
                          className="text-xs"
                        >
                          {user.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                        {user.work_type && (
                          <Badge className={`text-xs ${getWorkTypeColor(user.work_type)}`}>
                            {user.work_type.replace('_', ' ')}
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">{user.email}</p>
                      {user.department && (
                        <p className="text-xs text-gray-400 mt-1">{user.department}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex flex-col gap-2">
                      <Select
                        value={user.role}
                        onValueChange={(newRole) => updateUserRole(user.id, newRole, user.work_type)}
                        disabled={isUpdating}
                      >
                        <SelectTrigger className="w-48">
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                          {roles.map((role) => (
                            <SelectItem key={role.id} value={role.id}>
                              <div className="flex items-center gap-2">
                                {React.createElement(getRoleInfo(role.id).icon, {
                                  className: `h-4 w-4 ${getRoleInfo(role.id).color}`
                                })}
                                {role.name}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      <Select
                        value={user.work_type || 'field'}
                        onValueChange={(workType) => updateUserRole(user.id, user.role, workType)}
                        disabled={isUpdating}
                      >
                        <SelectTrigger className="w-48">
                          <SelectValue placeholder="Work type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="field">Field Worker</SelectItem>
                          <SelectItem value="remote">Remote Worker</SelectItem>
                          <SelectItem value="hybrid">Hybrid Worker</SelectItem>
                          <SelectItem value="office">Office Worker</SelectItem>
                          <SelectItem value="security">Security Guard</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {isUpdating && (
                      <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                    )}
                  </div>
                </div>
              )
            })}
            
            {users.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p className="text-lg font-medium">No users found</p>
                <p className="text-sm">Users will appear here once they're added to your organization.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Security Notice */}
      <Card className="mt-6 border-amber-200 bg-gradient-to-r from-amber-50 to-yellow-50">
        <CardContent className="p-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-6 w-6 text-amber-600 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-semibold text-amber-900 mb-2">Important Security Notes</h4>
              <ul className="text-sm text-amber-800 space-y-1">
                <li>• <strong>Super Admin</strong> and <strong>Organization Admin</strong> roles have full system access</li>
                <li>• <strong>Security Guards</strong> need both "guard" role and "security" work type for mobile app access</li>
                <li>• Role changes take effect immediately and may affect user's current session</li>
                <li>• Work type determines which mobile app features are visible to users</li>
                <li>• Only admins can modify roles - ensure at least one admin remains active</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}