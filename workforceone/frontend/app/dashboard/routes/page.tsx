'use client'

import React, { useState, useEffect, useMemo } from 'react'
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
import { Modal } from '@/components/ui/modal'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import { 
  MapPin,
  Route,
  Users,
  Plus,
  Settings,
  Navigation,
  Clock,
  Truck,
  Zap,
  TrendingUp,
  Calendar,
  User,
  Edit,
  Trash2,
  Play,
  Pause,
  Square,
  RotateCcw,
  RefreshCw,
  Download,
  Upload,
  MapIcon,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Target,
  ArrowRight,
  X
} from 'lucide-react'
import { format } from 'date-fns'
import GoogleMapComponent from '@/components/maps/GoogleMapComponent'
import { routeOptimizationService, type RouteStop, type OptimizedRoute } from '@/lib/routeOptimization'
import MemberRoutes from '@/components/routes/MemberRoutes'

interface Outlet {
  id: string
  name: string
  address: string
  province?: string
  phone?: string
  email?: string
  manager_name?: string
  manager_phone?: string
  manager_email?: string
  latitude?: number
  longitude?: number
  status: 'active' | 'inactive' | 'maintenance'
  organization_id: string
  created_at: string
}

interface RouteData {
  id: string
  name: string
  description?: string
  status: 'draft' | 'active' | 'archived' | 'completed'
  optimization_type: 'distance' | 'time' | 'balanced' | 'custom'
  total_estimated_duration: number
  total_estimated_distance: number
  total_stops: number
  route_date?: string
  start_location?: any
  end_location?: any
  created_at: string
  route_stops?: RouteStop[]
  route_assignments?: RouteAssignment[]
}

interface RouteStop {
  id: string
  route_id: string
  outlet_id: string
  stop_order: number
  estimated_arrival_time?: string
  estimated_duration: number
  actual_arrival_time?: string
  actual_departure_time?: string
  distance_from_previous?: number
  travel_time_from_previous?: number
  status: 'pending' | 'in_transit' | 'arrived' | 'completed' | 'skipped'
  notes?: string
  priority: number
  outlet?: Outlet
}

interface RouteAssignment {
  id: string
  route_id: string
  assignee_type: 'user' | 'team'
  assignee_id: string
  assigned_by: string
  assigned_date: string
  status: 'assigned' | 'accepted' | 'in_progress' | 'completed' | 'rejected'
  actual_start_time?: string
  actual_end_time?: string
  actual_total_distance?: number
  actual_total_duration?: number
  completion_percentage: number
  performance_score?: number
  notes?: string
  assignee_name?: string
}

interface User {
  id: string
  full_name: string
  email: string
  role: string
}

interface Team {
  id: string
  name: string
  description?: string
}

interface RouteOptimizationSettings {
  id?: string
  organization_id: string
  default_optimization_type: 'distance' | 'time' | 'balanced' | 'custom'
  default_stop_duration: number
  max_route_duration: number
  max_daily_distance: number
  avoid_tolls: boolean
  avoid_highways: boolean
  prefer_main_roads: boolean
  working_hours_start: string
  working_hours_end: string
  break_duration: number
  travel_speed_factor: number
  map_service: 'google' | 'openstreet' | 'mapbox'
}

export default function RoutesPage() {
  // State management
  const [activeTab, setActiveTab] = useState('overview')
  const [outlets, setOutlets] = useState<Outlet[]>([])
  const [filteredOutlets, setFilteredOutlets] = useState<Outlet[]>([])
  const [outletSearchTerm, setOutletSearchTerm] = useState('')
  const [routes, setRoutes] = useState<RouteData[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [settings, setSettings] = useState<RouteOptimizationSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [userProfile, setUserProfile] = useState<any>(null)

  // Map state
  const [mapCenter, setMapCenter] = useState({ lat: 40.7128, lng: -74.0060 })
  const [selectedOutlets, setSelectedOutlets] = useState<Outlet[]>([])
  const [selectedRoute, setSelectedRoute] = useState<RouteData | null>(null)
  const [showRouteOnMap, setShowRouteOnMap] = useState<string | null>(null) // route ID to show on map
  const [optimizedRoutes, setOptimizedRoutes] = useState<Map<string, OptimizedRoute>>(new Map())

  // Form states
  const [showCreateRoute, setShowCreateRoute] = useState(false)
  const [showAssignRoute, setShowAssignRoute] = useState(false)
  const [showTransferRoute, setShowTransferRoute] = useState(false)
  const [showEditRoute, setShowEditRoute] = useState(false)
  const [showSettings, setShowSettings] = useState(false)

  // Memoized markers for map to prevent re-renders
  const mapMarkers = useMemo(() => {
    const filteredOutlets = outlets.filter(outlet => outlet.latitude && outlet.longitude)
    
    const markers = filteredOutlets.map(outlet => {
      // Check if this outlet is part of the route being shown
      const routeToShow = showRouteOnMap ? optimizedRoutes.get(showRouteOnMap) : null
      const isPartOfRoute = routeToShow?.stops.some(stop => stop.id === outlet.id)
      const routeStopIndex = routeToShow?.stops.findIndex(stop => stop.id === outlet.id)
      
      return {
        id: outlet.id,
        position: { lat: outlet.latitude!, lng: outlet.longitude! },
        title: `${outlet.name}${isPartOfRoute && routeStopIndex !== undefined && routeStopIndex >= 0 ? ` (Stop ${routeStopIndex + 1})` : ''}`,
        icon: {
          color: isPartOfRoute ? '#2563eb' : // Blue for route outlets
                 outlet.status === 'active' ? '#10b981' : 
                 outlet.status === 'inactive' ? '#ef4444' : '#f59e0b',
          scale: isPartOfRoute ? 14 : 12 // Larger for route outlets
        },
        infoContent: `
          <div class="p-4 min-w-[240px] bg-white rounded-lg shadow-lg">
            <div class="flex items-center space-x-3 mb-3">
              <div class="w-4 h-4 rounded-full" style="background-color: ${
                outlet.status === 'active' ? '#10b981' : 
                outlet.status === 'inactive' ? '#ef4444' : '#f59e0b'
              }"></div>
              <span class="font-semibold text-gray-900">${outlet.name}</span>
            </div>
            <div class="text-sm text-gray-600 space-y-2">
              <p><span class="font-medium">Address:</span> ${outlet.address}</p>
              ${outlet.province ? `<p><span class="font-medium">Province:</span> ${outlet.province}</p>` : ''}
              ${outlet.phone ? `<p><span class="font-medium">Phone:</span> ${outlet.phone}</p>` : ''}
              ${outlet.manager_name ? `<p><span class="font-medium">Manager:</span> ${outlet.manager_name}</p>` : ''}
              <p><span class="font-medium">Status:</span> <span class="capitalize">${outlet.status}</span></p>
              ${isPartOfRoute && routeStopIndex !== undefined && routeStopIndex >= 0 ? `<p><span class="font-medium">Route Stop:</span> #${routeStopIndex + 1}</p>` : ''}
            </div>
          </div>
        `,
        onClick: () => {
          // Toggle outlet selection for route creation
          setSelectedOutlets(prev => {
            const newSelection = prev.find(o => o.id === outlet.id)
              ? prev.filter(o => o.id !== outlet.id)
              : [...prev, outlet]
            return newSelection
          })
        }
      }
    })
    
    return markers
  }, [outlets, showRouteOnMap, optimizedRoutes])
  const [routeForm, setRouteForm] = useState({
    name: '',
    description: '',
    route_date: '',
    optimization_type: 'balanced' as const,
    start_location_type: 'outlet' as 'outlet' | 'custom',
    start_outlet_id: '',
    custom_start_address: '',
    end_location_type: 'same' as 'same' | 'outlet' | 'custom',
    end_outlet_id: '',
    custom_end_address: ''
  })

  const [assignmentForm, setAssignmentForm] = useState({
    assignee_type: 'user' as 'user' | 'team',
    assignee_id: '',
    assigned_date: '',
    notes: '',
    day_of_week: null as number | null, // 0=Sunday, 1=Monday, etc.
    is_recurring: false,
    recurrence_pattern: 'weekly' as 'weekly' | 'biweekly' | 'monthly',
    recurring_until: ''
  })

  const supabase = createClient()

  useEffect(() => {
    initializeData()
  }, [])

  // Filter outlets based on search term
  useEffect(() => {
    if (!outletSearchTerm) {
      setFilteredOutlets(outlets)
    } else {
      const filtered = outlets.filter(outlet =>
        outlet.name.toLowerCase().includes(outletSearchTerm.toLowerCase()) ||
        outlet.address.toLowerCase().includes(outletSearchTerm.toLowerCase()) ||
        outlet.province?.toLowerCase().includes(outletSearchTerm.toLowerCase())
      )
      setFilteredOutlets(filtered)
    }
  }, [outlets, outletSearchTerm])

  const initializeData = async () => {
    try {
      setLoading(true)
      await Promise.all([
        fetchUserProfile(),
        fetchOutlets(),
        fetchRoutes(),
        fetchUsers(),
        fetchTeams(),
        fetchOptimizationSettings()
      ])
    } catch (error) {
      console.error('Error initializing data:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchUserProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      setUserProfile(profile)
    } catch (error) {
      console.error('Error fetching user profile:', error)
    }
  }

  const fetchOutlets = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single()

      if (!profile?.organization_id) return

      const { data, error } = await supabase
        .from('outlets')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .order('name')

      if (error) throw error
      
      console.log('Fetched outlets from database:', data?.length || 0, data)
      setOutlets(data || [])

      // Set map center to first outlet with coordinates
      const outletWithLocation = data?.find(o => o.latitude && o.longitude)
      // console.log('Outlet with location:', outletWithLocation)
      if (outletWithLocation) {
        setMapCenter({ lat: outletWithLocation.latitude!, lng: outletWithLocation.longitude! })
      }
    } catch (error) {
      console.error('Error fetching outlets:', error)
    }
  }

  const fetchRoutes = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single()

      if (!profile?.organization_id) return

      const { data, error } = await supabase
        .from('routes')
        .select(`
          *,
          route_stops:route_stops(
            *,
            outlet:outlets(*)
          ),
          route_assignments:route_assignments(
            *
          )
        `)
        .eq('organization_id', profile.organization_id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setRoutes(data || [])
    } catch (error) {
      console.error('Error fetching routes:', error)
    }
  }

  const fetchUsers = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single()

      if (!profile?.organization_id) return

      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, role')
        .eq('organization_id', profile.organization_id)
        .order('full_name')

      if (error) throw error
      
      // Map to expected User interface format
      const mappedUsers = (data || []).map(p => ({
        id: p.id,
        full_name: p.full_name || p.email || 'Unknown User',
        email: p.email,
        role: p.role || 'employee'
      }))
      
      console.log('Fetched users:', mappedUsers)
      setUsers(mappedUsers)
    } catch (error) {
      console.error('Error fetching users:', error)
    }
  }

  const fetchTeams = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single()

      if (!profile?.organization_id) return

      const { data, error } = await supabase
        .from('teams')
        .select('id, name, description')
        .eq('organization_id', profile.organization_id)
        .order('name')

      if (error) throw error
      setTeams(data || [])
    } catch (error) {
      console.error('Error fetching teams:', error)
    }
  }

  const fetchOptimizationSettings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single()

      if (!profile?.organization_id) return

      const { data, error } = await supabase
        .from('route_optimization_settings')
        .select('*')
        .eq('organization_id', profile.organization_id)
        .single()

      if (error && error.code !== 'PGRST116') throw error
      
      if (data) {
        setSettings(data)
      } else {
        // Create default settings
        const defaultSettings: Partial<RouteOptimizationSettings> = {
          organization_id: profile.organization_id,
          default_optimization_type: 'balanced',
          default_stop_duration: 30,
          max_route_duration: 480,
          max_daily_distance: 300,
          avoid_tolls: false,
          avoid_highways: false,
          prefer_main_roads: true,
          working_hours_start: '08:00',
          working_hours_end: '17:00',
          break_duration: 60,
          travel_speed_factor: 1.0,
          map_service: 'google'
        }

        const { data: newSettings, error: createError } = await supabase
          .from('route_optimization_settings')
          .insert(defaultSettings)
          .select()
          .single()

        if (createError) throw createError
        setSettings(newSettings)
      }
    } catch (error) {
      console.error('Error fetching optimization settings:', error)
    }
  }

  const createRoute = async () => {
    try {
      if (!userProfile?.organization_id) {
        alert('Organization not found')
        return
      }

      // Validate form
      if (!routeForm.name || selectedOutlets.length === 0) {
        alert('Please provide a route name and select at least one outlet')
        return
      }

      // Create route data
      const routeData = {
        name: routeForm.name,
        description: routeForm.description,
        organization_id: userProfile.organization_id,
        created_by: userProfile.id,
        route_date: routeForm.route_date || null,
        optimization_type: routeForm.optimization_type,
        status: 'draft',
        start_location: routeForm.start_location_type === 'outlet' 
          ? { outlet_id: routeForm.start_outlet_id }
          : routeForm.start_location_type === 'custom'
          ? { address: routeForm.custom_start_address }
          : null,
        end_location: routeForm.end_location_type === 'outlet' 
          ? { outlet_id: routeForm.end_outlet_id }
          : routeForm.end_location_type === 'custom'
          ? { address: routeForm.custom_end_address }
          : null
      }

      const { data: newRoute, error } = await supabase
        .from('routes')
        .insert(routeData)
        .select()
        .single()

      if (error) throw error

      // Create route stops
      const routeStops = selectedOutlets.map((outlet, index) => ({
        route_id: newRoute.id,
        outlet_id: outlet.id,
        stop_order: index + 1,
        estimated_duration: settings?.default_stop_duration || 30,
        status: 'pending',
        priority: 1
      }))

      const { error: stopsError } = await supabase
        .from('route_stops')
        .insert(routeStops)

      if (stopsError) throw stopsError

      // Reset form and close modal
      setRouteForm({
        name: '',
        description: '',
        route_date: '',
        optimization_type: 'balanced',
        start_location_type: 'outlet',
        start_outlet_id: '',
        custom_start_address: '',
        end_location_type: 'same',
        end_outlet_id: '',
        custom_end_address: ''
      })
      setSelectedOutlets([])
      setShowCreateRoute(false)
      
      await fetchRoutes()

      // Ask if user wants to optimize the route immediately
      const shouldOptimize = confirm(`Route "${routeForm.name}" created successfully! 

Would you like to optimize it now using Google Maps?
This will calculate the best order for visiting all outlets.`)

      if (shouldOptimize) {
        await optimizeRoute(newRoute.id)
      }
    } catch (error) {
      console.error('Error creating route:', error)
      alert('Failed to create route. Please try again.')
    }
  }

  const assignRoute = async () => {
    try {
      if (!selectedRoute || !assignmentForm.assignee_id) {
        alert('Please select a route and assignee')
        return
      }

      const assignmentData = {
        route_id: selectedRoute.id,
        assignee_type: assignmentForm.assignee_type,
        assignee_id: assignmentForm.assignee_id,
        assigned_by: userProfile.id,
        assigned_date: assignmentForm.assigned_date,
        status: 'assigned',
        completion_percentage: 0,
        notes: assignmentForm.notes,
        day_of_week: assignmentForm.day_of_week,
        is_recurring: assignmentForm.is_recurring,
        recurrence_pattern: assignmentForm.recurrence_pattern,
        recurring_until: assignmentForm.recurring_until || null
      }

      const { error } = await supabase
        .from('route_assignments')
        .insert(assignmentData)

      if (error) throw error

      // Reset form and refresh data
      setAssignmentForm({
        assignee_type: 'user',
        assignee_id: '',
        assigned_date: '',
        notes: '',
        day_of_week: null,
        is_recurring: false,
        recurrence_pattern: 'weekly',
        recurring_until: ''
      })
      setShowAssignRoute(false)
      setSelectedRoute(null)
      
      await fetchRoutes()
      alert('Route assigned successfully!')
    } catch (error) {
      console.error('Error assigning route:', error)
      alert('Failed to assign route. Please try again.')
    }
  }

  // Load saved optimization data from database
  const loadSavedOptimization = async (routeId: string) => {
    try {
      const { data: routeData, error } = await supabase
        .from('routes')
        .select('optimized_route_data, optimization_timestamp')
        .eq('id', routeId)
        .single()

      if (error) {
        // If no optimization data exists, this is not an error - just means route hasn't been optimized yet
        if (error.code === 'PGRST116') {
          console.log('No saved optimization found for route:', routeId)
          return false
        }
        throw error
      }

      if (routeData?.optimized_route_data && routeData?.optimization_timestamp) {
        console.log('Loading saved optimization data for route:', routeId)
        const optimizedRoute = routeData.optimized_route_data as OptimizedRoute
        setOptimizedRoutes(prev => new Map(prev.set(routeId, optimizedRoute)))
        
        const optimizedDate = new Date(routeData.optimization_timestamp)
        console.log(`Loaded optimization from ${optimizedDate.toLocaleString()}`)
        return true
      }
      
      console.log('Route exists but has no optimization data yet')
      return false
    } catch (error) {
      console.log('Could not load saved optimization:', error)
      return false
    }
  }

  // Create recurring assignments for active recurring route assignments
  const generateRecurringAssignments = async () => {
    try {
      if (!userProfile) {
        alert('User profile not found')
        return
      }

      // Get all active recurring assignments
      const { data: recurringAssignments, error: fetchError } = await supabase
        .from('route_assignments')
        .select(`
          *,
          routes!inner(*)
        `)
        .eq('is_recurring', true)
        .in('status', ['assigned', 'accepted'])
        .or('recurring_until.is.null,recurring_until.gte.now()')

      if (fetchError) throw fetchError

      const today = new Date()
      const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
      
      let createdCount = 0

      for (const assignment of recurringAssignments || []) {
        // Check if we need to create assignment for next occurrence
        const currentDate = new Date(assignment.assigned_date)
        let nextDate = new Date(currentDate)

        // Calculate next occurrence based on pattern
        switch (assignment.recurrence_pattern) {
          case 'weekly':
            nextDate.setDate(currentDate.getDate() + 7)
            break
          case 'biweekly':
            nextDate.setDate(currentDate.getDate() + 14)
            break
          case 'monthly':
            nextDate.setMonth(currentDate.getMonth() + 1)
            break
        }

        // Check if next assignment should be created (within next week)
        if (nextDate <= nextWeek) {
          // Check if assignment already exists for that date
          const { data: existingAssignment } = await supabase
            .from('route_assignments')
            .select('id')
            .eq('route_id', assignment.route_id)
            .eq('assignee_id', assignment.assignee_id)
            .eq('assigned_date', nextDate.toISOString().split('T')[0])
            .single()

          if (!existingAssignment) {
            // Create new assignment
            const newAssignment = {
              route_id: assignment.route_id,
              assignee_type: assignment.assignee_type,
              assignee_id: assignment.assignee_id,
              assigned_by: assignment.assigned_by,
              assigned_date: nextDate.toISOString().split('T')[0],
              status: 'assigned',
              completion_percentage: 0,
              notes: `Auto-generated recurring assignment (${assignment.recurrence_pattern})`,
              day_of_week: assignment.day_of_week,
              is_recurring: assignment.is_recurring,
              recurrence_pattern: assignment.recurrence_pattern,
              recurring_until: assignment.recurring_until
            }

            const { error: insertError } = await supabase
              .from('route_assignments')
              .insert(newAssignment)

            if (!insertError) {
              createdCount++
            }
          }
        }
      }

      if (createdCount > 0) {
        alert(`✅ Created ${createdCount} recurring route assignments!`)
        await fetchRoutes()
      } else {
        alert('No new recurring assignments needed at this time.')
      }

    } catch (error) {
      console.error('Error generating recurring assignments:', error)
      alert('Failed to generate recurring assignments. Please try again.')
    }
  }

  // Delete route function
  const deleteRoute = async (routeId: string) => {
    try {
      const confirmDelete = confirm('Are you sure you want to delete this route? This action cannot be undone.')
      if (!confirmDelete) return

      const { error } = await supabase
        .from('routes')
        .delete()
        .eq('id', routeId)

      if (error) throw error

      await fetchRoutes()
      alert('Route deleted successfully!')
    } catch (error) {
      console.error('Error deleting route:', error)
      alert('Failed to delete route. Please try again.')
    }
  }

  // Edit route function
  const editRoute = (route: RouteData) => {
    setSelectedRoute(route)
    setRouteForm({
      name: route.name,
      description: route.description || '',
      route_date: route.route_date || '',
      optimization_type: route.optimization_type || 'balanced',
      starting_point: 'first_outlet',
      ending_point: 'last_outlet',
      custom_start_address: '',
      custom_end_address: '',
      start_outlet_id: '',
      end_outlet_id: ''
    })
    setShowEditRoute(true)
  }

  // Update route function
  const updateRoute = async () => {
    try {
      if (!selectedRoute) return

      // If custom optimization, save settings to route
      const updateData: any = {
        name: routeForm.name,
        description: routeForm.description,
        route_date: routeForm.route_date || null,
        optimization_type: routeForm.optimization_type,
        created_by: selectedRoute.created_by, // Include owner transfer if changed
        updated_at: new Date().toISOString()
      }

      // Add custom optimization settings if applicable
      if (routeForm.optimization_type === 'custom' && settings) {
        updateData.optimization_settings = {
          avoid_tolls: settings.avoid_tolls,
          avoid_highways: settings.avoid_highways,
          prefer_main_roads: settings.prefer_main_roads,
          max_daily_distance: settings.max_daily_distance,
          max_route_duration: settings.max_route_duration
        }
      }

      const { error } = await supabase
        .from('routes')
        .update(updateData)
        .eq('id', selectedRoute.id)

      if (error) throw error

      // Reset form
      setRouteForm({
        name: '',
        description: '',
        route_date: '',
        optimization_type: 'balanced',
        starting_point: 'first_outlet',
        ending_point: 'last_outlet',
        custom_start_address: '',
        custom_end_address: '',
        start_outlet_id: '',
        end_outlet_id: ''
      })
      setShowEditRoute(false)
      setSelectedRoute(null)
      
      await fetchRoutes()
      alert('Route updated successfully!')
    } catch (error) {
      console.error('Error updating route:', error)
      alert('Failed to update route. Please try again.')
    }
  }

  const transferRoute = async () => {
    try {
      if (!selectedRoute || !assignmentForm.assignee_id) {
        alert('Please select a route and new assignee')
        return
      }

      if (!userProfile) {
        alert('User profile not found')
        return
      }

      // Get current assignment
      const currentAssignment = selectedRoute.route_assignments?.[0]
      if (!currentAssignment) {
        alert('No current assignment found for this route')
        return
      }

      // Update current assignment status to 'transferred'
      const { error: updateError } = await supabase
        .from('route_assignments')
        .update({ 
          status: 'transferred',
          notes: currentAssignment.notes + 
            `\n--- TRANSFERRED on ${new Date().toLocaleDateString()} ---\n` +
            `From: ${currentAssignment.assignee_name || currentAssignment.assignee_id}\n` +
            `Reason: ${assignmentForm.notes || 'No reason provided'}`
        })
        .eq('id', currentAssignment.id)

      if (updateError) throw updateError

      // Create new assignment
      const assignmentData = {
        route_id: selectedRoute.id,
        assignee_type: assignmentForm.assignee_type,
        assignee_id: assignmentForm.assignee_id,
        assigned_by: userProfile.id,
        assigned_date: assignmentForm.assigned_date || new Date().toISOString().split('T')[0],
        status: 'assigned',
        completion_percentage: 0,
        notes: `TRANSFERRED FROM: ${currentAssignment.assignee_name || currentAssignment.assignee_id}\n` + 
               (assignmentForm.notes || 'Route transfer'),
        day_of_week: assignmentForm.day_of_week,
        is_recurring: assignmentForm.is_recurring,
        recurrence_pattern: assignmentForm.recurrence_pattern,
        recurring_until: assignmentForm.recurring_until || null
      }

      const { error } = await supabase
        .from('route_assignments')
        .insert(assignmentData)

      if (error) throw error

      // Reset form and refresh data
      setAssignmentForm({
        assignee_type: 'user',
        assignee_id: '',
        assigned_date: '',
        notes: '',
        day_of_week: null,
        is_recurring: false,
        recurrence_pattern: 'weekly',
        recurring_until: ''
      })
      setShowTransferRoute(false)
      setSelectedRoute(null)
      
      await fetchRoutes()
      alert('Route transferred successfully!')
    } catch (error) {
      console.error('Error transferring route:', error)
      alert('Failed to transfer route. Please try again.')
    }
  }

  const optimizeRoute = async (routeId: string) => {
    try {
      console.log('Starting route optimization for route:', routeId)
      
      // Find the route
      const route = routes.find(r => r.id === routeId)
      if (!route || !route.route_stops) {
        alert('Route or route stops not found')
        return
      }

      // Convert route stops to optimization format
      const routeStops: RouteStop[] = route.route_stops.map(stop => ({
        id: stop.outlet_id,
        name: stop.outlet?.name || 'Unknown Outlet',
        address: stop.outlet?.address || '',
        latitude: stop.outlet?.latitude || 0,
        longitude: stop.outlet?.longitude || 0,
        estimatedDuration: stop.estimated_duration,
        priority: stop.priority
      })).filter(stop => stop.latitude && stop.longitude)

      if (routeStops.length < 2) {
        alert('Route needs at least 2 outlets with valid coordinates for optimization')
        return
      }

      // Get optimization settings from route or use defaults
      const optimizationSettings = {
        optimizationType: route.optimization_type as 'distance' | 'time' | 'balanced',
        avoidTolls: settings?.avoid_tolls || false,
        avoidHighways: settings?.avoid_highways || false,
        preferMainRoads: settings?.prefer_main_roads || true,
        travelMode: 'DRIVING' as const,
        maxRouteDistance: settings?.max_daily_distance,
        maxRouteDuration: settings?.max_route_duration
      }

      // Show loading indicator
      console.log('About to start route optimization...')
      alert('Optimizing route... This may take a few moments.')
      
      // Optimize the route
      console.log('Calling routeOptimizationService.optimizeRoute with:', {
        routeStops,
        optimizationSettings
      })
      
      const optimizedRoute: OptimizedRoute = await routeOptimizationService.optimizeRoute(
        routeStops,
        undefined, // start location (use first stop)
        undefined, // end location (use last stop)
        optimizationSettings
      )
      
      console.log('Route optimization completed successfully:', optimizedRoute)

      // Update the route in the database with optimized data
      const { error: updateError } = await supabase
        .from('routes')
        .update({
          total_estimated_duration: Math.round(optimizedRoute.totalDuration),
          total_estimated_distance: optimizedRoute.totalDistance,
          optimized_route_data: optimizedRoute,
          optimization_timestamp: new Date().toISOString(),
          polyline_encoded: optimizedRoute.polyline || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', routeId)

      if (updateError) throw updateError

      // Update route stops with new order and timing
      // First, set all stop_order to negative values to avoid unique constraint conflicts
      const routeStopsToUpdate = optimizedRoute.stops
        .map((stop, index) => {
          const routeStop = route.route_stops?.find(rs => rs.outlet_id === stop.id)
          return routeStop ? { routeStop, newOrder: index + 1 } : null
        })
        .filter(Boolean)

      if (routeStopsToUpdate.length > 0) {
        // Step 1: Set temporary negative orders to avoid conflicts
        const tempOrderPromises = routeStopsToUpdate.map(({ routeStop }) => 
          supabase
            .from('route_stops')
            .update({ stop_order: -Math.abs(Math.random() * 1000) }) // Temporary negative value
            .eq('id', routeStop.id)
        )

        await Promise.all(tempOrderPromises)

        // Step 2: Set the correct orders
        const finalOrderPromises = routeStopsToUpdate.map(({ routeStop, newOrder }) => 
          supabase
            .from('route_stops')
            .update({
              stop_order: newOrder,
              updated_at: new Date().toISOString()
            })
            .eq('id', routeStop.id)
        )

        await Promise.all(finalOrderPromises)
      }

      // Store optimized route for map display
      setOptimizedRoutes(prev => new Map(prev.set(routeId, optimizedRoute)))

      // Refresh routes data
      await fetchRoutes()

      // Show detailed optimization results
      const hours = Math.floor(optimizedRoute.totalDuration / 60)
      const minutes = Math.round(optimizedRoute.totalDuration % 60)
      
      alert(`🎉 Route Optimized Successfully!

📊 Performance Metrics:
• Distance: ${optimizedRoute.totalDistance} km
• Duration: ${hours}h ${minutes}m
• Stops: ${optimizedRoute.stops.length} outlets
• Fuel: ${optimizedRoute.estimatedFuel} L
• Cost: $${optimizedRoute.estimatedCost}

🛣️ Optimization: ${route.optimization_type.toUpperCase()}
✅ Route stops have been reordered for optimal efficiency!`)

    } catch (error) {
      console.error('Error optimizing route:', error)
      alert(`Failed to optimize route: ${error}`)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'completed': return 'bg-blue-100 text-blue-800'
      case 'in_progress': return 'bg-yellow-100 text-yellow-800'
      case 'assigned': return 'bg-purple-100 text-purple-800'
      case 'draft': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getOptimizationIcon = (type: string) => {
    switch (type) {
      case 'distance': return <Target className="h-4 w-4" />
      case 'time': return <Clock className="h-4 w-4" />
      case 'balanced': return <TrendingUp className="h-4 w-4" />
      default: return <Settings className="h-4 w-4" />
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          <p className="text-gray-600">Loading route optimization system...</p>
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
            Route Optimization
          </h1>
          <p className="text-gray-600 mt-1">
            Plan, optimize, and manage efficient routes for your field operations
          </p>
        </div>
        <div className="flex space-x-3">
          <Button variant="outline" onClick={() => {
            console.log('Settings button clicked')
            setShowSettings(true)
          }}>
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
          <Button onClick={() => {
            console.log('Create Route button clicked')
            setShowCreateRoute(true)
          }} className="bg-gradient-to-r from-blue-600 to-blue-700">
            <Plus className="h-4 w-4 mr-2" />
            Create Route
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Routes
            </CardTitle>
            <Route className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{routes.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Active Routes
            </CardTitle>
            <Activity className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {routes.filter(r => r.status === 'active').length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Outlets
            </CardTitle>
            <MapPin className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{outlets.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Assignments
            </CardTitle>
            <Users className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              {routes.reduce((total, route) => total + (route.route_assignments?.length || 0), 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview & Map</TabsTrigger>
          <TabsTrigger value="routes">Routes Management</TabsTrigger>
          <TabsTrigger value="member-routes">Member Routes</TabsTrigger>
          <TabsTrigger value="assignments">Assignments & Tracking</TabsTrigger>
        </TabsList>

        {/* Overview & Map Tab */}
        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center">
                  <MapIcon className="h-5 w-5 mr-2 text-blue-600" />
                  Outlets & Routes Map
                </CardTitle>
                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" onClick={() => initializeData()}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                  <Select defaultValue="all">
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Filter routes" />
                    </SelectTrigger>
                    <SelectContent className="z-[10001]">
                      <SelectItem value="all">All Routes</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="relative">
                <GoogleMapComponent
                  center={mapCenter}
                  zoom={12}
                  markers={mapMarkers}
                  style={{ height: '500px' }}
                  className="rounded-lg"
                  optimizedRoute={showRouteOnMap ? optimizedRoutes.get(showRouteOnMap) : undefined}
                  showRoutePolyline={!!showRouteOnMap}
                />
                
                {/* Selected outlets indicator */}
                {selectedOutlets.length > 0 && (
                  <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm rounded-lg p-3 shadow-lg border">
                    <div className="text-sm font-medium text-gray-900 mb-2">
                      Selected Outlets ({selectedOutlets.length})
                    </div>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {selectedOutlets.map((outlet, index) => (
                        <div key={outlet.id} className="text-xs text-gray-600 flex items-center">
                          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded mr-2">
                            {index + 1}
                          </span>
                          {outlet.name}
                        </div>
                      ))}
                    </div>
                    <Button 
                      size="sm" 
                      className="mt-3 w-full"
                      onClick={() => setShowCreateRoute(true)}
                    >
                      Create Route with Selected
                    </Button>
                  </div>
                )}

                {/* Route visualization indicator */}
                {showRouteOnMap && optimizedRoutes.get(showRouteOnMap) && (
                  <div className="absolute top-4 right-4 bg-blue-600 text-white rounded-lg p-3 shadow-lg border">
                    <div className="text-sm font-medium mb-2 flex items-center">
                      <MapIcon className="h-4 w-4 mr-1" />
                      Route Visualization
                    </div>
                    <div className="text-xs space-y-1">
                      {(() => {
                        const route = optimizedRoutes.get(showRouteOnMap)
                        const routeData = routes.find(r => r.id === showRouteOnMap)
                        return (
                          <div>
                            <p><strong>{routeData?.name}</strong></p>
                            <p>{route?.stops.length} stops</p>
                            <p>{route?.totalDistance.toFixed(1)} km</p>
                            <p>{Math.floor((route?.totalDuration || 0) / 60)}h {Math.round((route?.totalDuration || 0) % 60)}m</p>
                          </div>
                        )
                      })()}
                    </div>
                    <Button 
                      size="sm" 
                      variant="ghost"
                      className="mt-2 w-full text-white hover:bg-blue-700"
                      onClick={() => setShowRouteOnMap(null)}
                    >
                      Hide Route
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Routes Management Tab */}
        <TabsContent value="routes" className="space-y-6">
          {/* Recurring Assignments Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Recurring Assignments</CardTitle>
                  <p className="text-sm text-gray-600 mt-1">Manage automatic weekly route assignments</p>
                </div>
                <Button
                  onClick={generateRecurringAssignments}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  Generate This Week
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-gray-600">
                <p>• Routes with recurring assignments will automatically create new assignments</p>
                <p>• This generates assignments for the upcoming week based on your recurring schedules</p>
                <p>• Use the "Assign" or "Transfer" modals to set up recurring weekly assignments</p>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {routes.map((route) => (
              <Card key={route.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">{route.name}</CardTitle>
                      <p className="text-sm text-gray-600">{route.description}</p>
                    </div>
                    <Badge className={getStatusColor(route.status)}>
                      {route.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="space-y-1">
                      <p className="font-medium text-gray-700">Stops</p>
                      <p className="text-gray-600">{route.total_stops}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="font-medium text-gray-700">Distance</p>
                      <p className="text-gray-600">{route.total_estimated_distance.toFixed(1)} km</p>
                    </div>
                    <div className="space-y-1">
                      <p className="font-medium text-gray-700">Duration</p>
                      <p className="text-gray-600">{Math.round(route.total_estimated_duration / 60)}h {route.total_estimated_duration % 60}m</p>
                    </div>
                    <div className="space-y-1">
                      <p className="font-medium text-gray-700">Optimization</p>
                      <div className="flex items-center">
                        {getOptimizationIcon(route.optimization_type)}
                        <span className="ml-1 text-gray-600 capitalize">{route.optimization_type}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {route.route_assignments && route.route_assignments.length > 0 ? (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => {
                          setSelectedRoute(route)
                          setShowTransferRoute(true)
                        }}
                      >
                        <Users className="h-4 w-4 mr-1" />
                        Transfer
                      </Button>
                    ) : (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => {
                          setSelectedRoute(route)
                          setShowAssignRoute(true)
                        }}
                      >
                        <Users className="h-4 w-4 mr-1" />
                        Assign
                      </Button>
                    )}
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => optimizeRoute(route.id)}
                      disabled={!route.route_stops || route.route_stops.length < 2}
                    >
                      <Zap className="h-4 w-4 mr-1" />
                      Optimize
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={async () => {
                        const newRouteId = showRouteOnMap === route.id ? null : route.id
                        console.log('Show/Hide route clicked:', { 
                          routeId: route.id, 
                          routeName: route.name,
                          currentlyShowing: showRouteOnMap, 
                          newSelection: newRouteId,
                          hasOptimizedRoute: optimizedRoutes.has(route.id),
                          optimizedRoute: optimizedRoutes.get(route.id)
                        })
                        
                        // If showing a route and we don't have optimization data, try to load from DB
                        if (newRouteId && !optimizedRoutes.has(route.id)) {
                          const loaded = await loadSavedOptimization(newRouteId)
                          if (loaded) {
                            console.log('Successfully loaded saved optimization for route')
                          } else {
                            console.log('No saved optimization found for route')
                          }
                        }
                        
                        setShowRouteOnMap(newRouteId)
                        setActiveTab('overview') // Switch to map tab
                      }}
                    >
                      <MapIcon className="h-4 w-4 mr-1" />
                      {showRouteOnMap === route.id ? 'Hide' : 'Show'}
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => editRoute(route)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => deleteRoute(route.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  {route.route_assignments && route.route_assignments.length > 0 && (
                    <div className="border-t pt-3">
                      <p className="text-xs font-medium text-gray-700 mb-2">Assignments</p>
                      <div className="space-y-1">
                        {route.route_assignments.map((assignment) => {
                          const assigneeName = assignment.assignee_type === 'user' 
                            ? users.find(u => u.id === assignment.assignee_id)?.full_name || assignment.assignee_id
                            : teams.find(t => t.id === assignment.assignee_id)?.name || assignment.assignee_id
                          
                          return (
                            <div key={assignment.id} className="flex items-center justify-between text-xs">
                              <span className="text-gray-600">
                                {assignment.assignee_type === 'user' ? '👤' : '👥'} {assigneeName}
                              </span>
                              <Badge variant="secondary" className={getStatusColor(assignment.status)}>
                                {assignment.status}
                              </Badge>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Member Routes Tab */}
        <TabsContent value="member-routes" className="space-y-6">
          <MemberRoutes />
        </TabsContent>

        {/* Assignments & Tracking Tab */}
        <TabsContent value="assignments" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Route Assignments & Tracking</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Activity className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Real-time Tracking</h3>
                <p className="text-gray-600 mb-6">
                  Live tracking and performance monitoring for assigned routes
                </p>
                <p className="text-sm text-gray-500">
                  This feature will integrate with GPS tracking and mobile apps for real-time route monitoring
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Route Modal - Enhanced with outlet selection */}
      {/* {console.log('Create Route Modal isOpen:', showCreateRoute)} */}
      {showCreateRoute && (
        <div className="fixed inset-0 z-[9999] overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Create New Route</h2>
              <button
                onClick={() => setShowCreateRoute(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="route-name">Route Name *</Label>
                  <Input
                    id="route-name"
                    value={routeForm.name}
                    onChange={(e) => setRouteForm({ ...routeForm, name: e.target.value })}
                    placeholder="Enter route name"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="route-date">Planned Date</Label>
                  <Input
                    id="route-date"
                    type="date"
                    value={routeForm.route_date}
                    onChange={(e) => setRouteForm({ ...routeForm, route_date: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="route-description">Description</Label>
                <Textarea
                  id="route-description"
                  value={routeForm.description}
                  onChange={(e) => setRouteForm({ ...routeForm, description: e.target.value })}
                  placeholder="Route description (optional)"
                  rows={2}
                />
              </div>

              <div>
                <Label>Route Optimization</Label>
                <Select 
                  value={routeForm.optimization_type} 
                  onValueChange={(value: any) => setRouteForm({ ...routeForm, optimization_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="z-[10001]">
                    <SelectItem value="distance">🎯 Shortest Distance - Minimize total kilometers</SelectItem>
                    <SelectItem value="time">⚡ Fastest Time - Minimize travel time</SelectItem>
                    <SelectItem value="balanced">⚖️ Balanced - Optimize time, distance & priorities</SelectItem>
                    <SelectItem value="custom">🛠️ Custom - Use organization settings</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Select Outlets for Route</Label>
                {/* {console.log('Outlets in modal:', outlets.length, outlets.map(o => o.name))} */}
                <div className="mt-2 space-y-2">
                  {/* Search box */}
                  <div className="relative">
                    <Input
                      type="text"
                      placeholder="Search outlets by name, address, or province..."
                      value={outletSearchTerm}
                      onChange={(e) => setOutletSearchTerm(e.target.value)}
                      className="pl-8"
                    />
                    <svg className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    {outletSearchTerm && (
                      <button
                        onClick={() => setOutletSearchTerm('')}
                        className="absolute right-2 top-2.5 text-gray-400 hover:text-gray-600"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  {/* Available outlets list */}
                  <div className="border rounded-lg p-2 max-h-48 overflow-y-auto">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-sm font-medium text-gray-700">
                        Available Outlets ({filteredOutlets.length} of {outlets.length})
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => {
                            const unselectedFiltered = filteredOutlets.filter(o => 
                              !selectedOutlets.some(s => s.id === o.id)
                            )
                            setSelectedOutlets(prev => [...prev, ...unselectedFiltered])
                          }}
                          className="text-xs text-blue-600 hover:text-blue-800"
                          disabled={filteredOutlets.every(o => selectedOutlets.some(s => s.id === o.id))}
                        >
                          Select All
                        </button>
                        <button
                          onClick={() => setSelectedOutlets([])}
                          className="text-xs text-red-600 hover:text-red-800"
                          disabled={selectedOutlets.length === 0}
                        >
                          Clear All
                        </button>
                      </div>
                    </div>
                    {filteredOutlets.length === 0 ? (
                      <p className="text-sm text-gray-500">
                        {outletSearchTerm ? 'No outlets match your search' : 'No outlets available'}
                      </p>
                    ) : (
                      <div className="space-y-1">
                        {filteredOutlets.map(outlet => {
                          const isSelected = selectedOutlets.some(o => o.id === outlet.id)
                          return (
                            <div
                              key={outlet.id}
                              onClick={() => {
                                setSelectedOutlets(prev => {
                                  if (isSelected) {
                                    return prev.filter(o => o.id !== outlet.id)
                                  } else {
                                    return [...prev, outlet]
                                  }
                                })
                              }}
                              className={`p-2 rounded cursor-pointer transition-colors ${
                                isSelected 
                                  ? 'bg-blue-100 border-blue-300 border' 
                                  : 'hover:bg-gray-50 border border-transparent'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <div className="font-medium text-sm">{outlet.name}</div>
                                  <div className="text-xs text-gray-600">{outlet.address}</div>
                                </div>
                                <div className="ml-2">
                                  {isSelected ? (
                                    <span className="text-blue-600">✓</span>
                                  ) : (
                                    <span className="text-gray-300">○</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>

                  {/* Selected outlets */}
                  {selectedOutlets.length > 0 && (
                    <div className="border-t pt-2">
                      <div className="text-sm font-medium text-gray-700 mb-2">
                        Selected Outlets ({selectedOutlets.length})
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {selectedOutlets.map(outlet => (
                          <span
                            key={outlet.id}
                            className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                          >
                            {outlet.name}
                            <button
                              onClick={() => setSelectedOutlets(prev => prev.filter(o => o.id !== outlet.id))}
                              className="ml-1 text-blue-600 hover:text-blue-800"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setShowCreateRoute(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={createRoute}
                  disabled={!routeForm.name || selectedOutlets.length === 0}
                >
                  Create Route ({selectedOutlets.length} outlets)
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Assign Route Modal - Inline version */}
      {showAssignRoute && (
        <div className="fixed inset-0 z-[9999] overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto relative z-[10000]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Assign Route</h2>
              <button
                onClick={() => setShowAssignRoute(false)}
                className="text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-md p-2"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 mb-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-medium text-blue-900 mb-1">Route Details</h3>
                <p className="text-sm text-blue-700">
                  <strong>Name:</strong> {selectedRoute?.name}
                </p>
                <p className="text-sm text-blue-700">
                  <strong>Stops:</strong> {selectedRoute?.total_stops || 0} outlets
                </p>
                <p className="text-sm text-blue-700">
                  <strong>Distance:</strong> {selectedRoute?.total_estimated_distance?.toFixed(1) || 0} km
                </p>
                <p className="text-sm text-blue-700">
                  <strong>Duration:</strong> {selectedRoute ? Math.round((selectedRoute.total_estimated_duration || 0) / 60) : 0}h {selectedRoute ? Math.round((selectedRoute.total_estimated_duration || 0) % 60) : 0}m
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label>Assignment Type</Label>
                <Select 
                  value={assignmentForm.assignee_type} 
                  onValueChange={(value: any) => {
                    console.log('Assignment type selected:', value)
                    setAssignmentForm({ ...assignmentForm, assignee_type: value, assignee_id: '' })
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select assignment type" />
                  </SelectTrigger>
                  <SelectContent className="z-[10001]">
                    <SelectItem value="user">👤 Individual User</SelectItem>
                    <SelectItem value="team">👥 Team</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>{assignmentForm.assignee_type === 'user' ? 'Select User' : 'Select Team'}</Label>
                <Select 
                  value={assignmentForm.assignee_id} 
                  onValueChange={(value) => {
                    console.log('User/Team selected:', value)
                    setAssignmentForm({ ...assignmentForm, assignee_id: value })
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={`Choose ${assignmentForm.assignee_type === 'user' ? 'a user' : 'a team'}`} />
                  </SelectTrigger>
                  <SelectContent className="z-[10001]">
                    {assignmentForm.assignee_type === 'user' 
                      ? users.map(user => {
                          console.log('Rendering user option:', user)
                          return (
                            <SelectItem key={user.id} value={user.id} textValue={`${user.full_name} (${user.role})`}>
                              <div className="flex items-center space-x-2">
                                <span>👤</span>
                                <span>{user.full_name}</span>
                                <Badge variant="secondary" className="ml-2 text-xs">
                                  {user.role}
                                </Badge>
                              </div>
                            </SelectItem>
                          )
                        })
                      : teams.map(team => (
                          <SelectItem key={team.id} value={team.id} textValue={team.name}>
                            <div className="flex items-center space-x-2">
                              <span>👥</span>
                              <span>{team.name}</span>
                            </div>
                          </SelectItem>
                        ))
                    }
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500 mt-1">
                  Available {assignmentForm.assignee_type === 'user' ? 'users' : 'teams'}: {assignmentForm.assignee_type === 'user' ? users.length : teams.length}
                </p>
              </div>

              <div>
                <Label>Assignment Date</Label>
                <Input
                  type="date"
                  value={assignmentForm.assigned_date}
                  onChange={(e) => setAssignmentForm({ ...assignmentForm, assigned_date: e.target.value })}
                  min={new Date().toISOString().split('T')[0]}
                />
                <p className="text-xs text-gray-500 mt-1">When should this route be completed?</p>
              </div>

              {/* Recurring Assignment Options */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="is_recurring"
                    checked={assignmentForm.is_recurring}
                    onChange={(e) => setAssignmentForm({ 
                      ...assignmentForm, 
                      is_recurring: e.target.checked,
                      day_of_week: e.target.checked ? (assignmentForm.day_of_week ?? 1) : null
                    })}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <Label htmlFor="is_recurring" className="text-sm font-medium cursor-pointer">
                    Make this a recurring assignment
                  </Label>
                </div>

                {assignmentForm.is_recurring && (
                  <div className="grid grid-cols-1 gap-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div>
                      <Label className="text-sm font-medium">Day of the Week</Label>
                      <Select 
                        value={assignmentForm.day_of_week?.toString() || ''} 
                        onValueChange={(value) => setAssignmentForm({ ...assignmentForm, day_of_week: parseInt(value) })}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select day of week" />
                        </SelectTrigger>
                        <SelectContent className="z-[10001]">
                          <SelectItem value="0">Sunday</SelectItem>
                          <SelectItem value="1">Monday</SelectItem>
                          <SelectItem value="2">Tuesday</SelectItem>
                          <SelectItem value="3">Wednesday</SelectItem>
                          <SelectItem value="4">Thursday</SelectItem>
                          <SelectItem value="5">Friday</SelectItem>
                          <SelectItem value="6">Saturday</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-blue-600 mt-1">Route will be assigned every week on this day</p>
                    </div>

                    <div>
                      <Label className="text-sm font-medium">Recurrence Pattern</Label>
                      <Select 
                        value={assignmentForm.recurrence_pattern} 
                        onValueChange={(value) => setAssignmentForm({ 
                          ...assignmentForm, 
                          recurrence_pattern: value as 'weekly' | 'biweekly' | 'monthly' 
                        })}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="z-[10001]">
                          <SelectItem value="weekly">Every week</SelectItem>
                          <SelectItem value="biweekly">Every 2 weeks</SelectItem>
                          <SelectItem value="monthly">Every month</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-sm font-medium">End Date (Optional)</Label>
                      <Input
                        type="date"
                        value={assignmentForm.recurring_until}
                        onChange={(e) => setAssignmentForm({ ...assignmentForm, recurring_until: e.target.value })}
                        min={new Date().toISOString().split('T')[0]}
                        className="mt-1"
                      />
                      <p className="text-xs text-blue-600 mt-1">Leave empty for indefinite recurring assignment</p>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <Label>Assignment Notes</Label>
                <Textarea
                  value={assignmentForm.notes}
                  onChange={(e) => setAssignmentForm({ ...assignmentForm, notes: e.target.value })}
                  placeholder="Any special instructions or notes for the assignee..."
                  rows={3}
                  className="resize-none"
                />
              </div>
            </div>

            <div className="flex justify-between items-center mt-8 pt-4 border-t">
              <div className="text-sm text-gray-500">
                Route will be assigned with "assigned" status
              </div>
              <div className="flex space-x-2">
                <Button variant="outline" onClick={() => setShowAssignRoute(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={assignRoute}
                  disabled={!assignmentForm.assignee_id}
                  className="min-w-[120px]"
                >
                  <Users className="h-4 w-4 mr-2" />
                  Assign Route
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Transfer Route Modal - Inline version */}
      {showTransferRoute && (
        <div className="fixed inset-0 z-[9999] overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Transfer Route</h2>
              <button
                onClick={() => setShowTransferRoute(false)}
                className="text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-md p-2"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 mb-6">
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <h3 className="font-medium text-orange-900 mb-1">Current Assignment</h3>
                <p className="text-sm text-orange-700">
                  <strong>Currently assigned to:</strong> {selectedRoute?.route_assignments?.[0]?.profiles?.first_name} {selectedRoute?.route_assignments?.[0]?.profiles?.last_name}
                </p>
                <p className="text-sm text-orange-700">
                  <strong>Status:</strong> {selectedRoute?.route_assignments?.[0]?.status}
                </p>
                <p className="text-sm text-orange-700">
                  <strong>Assigned Date:</strong> {selectedRoute?.route_assignments?.[0]?.assigned_date ? new Date(selectedRoute.route_assignments[0].assigned_date).toLocaleDateString() : 'N/A'}
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-medium text-blue-900 mb-1">Route Details</h3>
                <p className="text-sm text-blue-700">
                  <strong>Name:</strong> {selectedRoute?.name}
                </p>
                <p className="text-sm text-blue-700">
                  <strong>Stops:</strong> {selectedRoute?.total_stops || 0} outlets
                </p>
                <p className="text-sm text-blue-700">
                  <strong>Distance:</strong> {selectedRoute?.total_estimated_distance?.toFixed(1) || 0} km
                </p>
                <p className="text-sm text-blue-700">
                  <strong>Duration:</strong> {selectedRoute ? Math.round((selectedRoute.total_estimated_duration || 0) / 60) : 0}h {selectedRoute ? Math.round((selectedRoute.total_estimated_duration || 0) % 60) : 0}m
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Transfer to Team Member *</Label>
                <Select 
                  value={assignmentForm.assignee_id} 
                  onValueChange={(value) => setAssignmentForm({ ...assignmentForm, assignee_id: value })}
                >
                  <SelectTrigger className="w-full mt-1">
                    <SelectValue placeholder="Select new assignee" />
                  </SelectTrigger>
                  <SelectContent className="z-[10001]">
                    {users
                      .filter(user => user.id !== selectedRoute?.route_assignments?.[0]?.assignee_id) // Exclude current assignee
                      .map(user => (
                      <SelectItem key={user.id} value={user.id} textValue={`${user.full_name} - ${user.role}`}>
                        <div className="flex items-center">
                          <div className="w-2 h-2 rounded-full bg-green-500 mr-2" />
                          {user.full_name} - {user.role}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500 mt-1">Choose who should receive this route</p>
              </div>

              <div>
                <Label>Transfer Date</Label>
                <Input
                  type="date"
                  value={assignmentForm.assigned_date}
                  onChange={(e) => setAssignmentForm({ ...assignmentForm, assigned_date: e.target.value })}
                  min={new Date().toISOString().split('T')[0]}
                />
                <p className="text-xs text-gray-500 mt-1">When should the new assignee complete this route?</p>
              </div>

              {/* Recurring Assignment Options */}
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="is_recurring_transfer"
                    checked={assignmentForm.is_recurring}
                    onChange={(e) => setAssignmentForm({ 
                      ...assignmentForm, 
                      is_recurring: e.target.checked,
                      day_of_week: e.target.checked ? (assignmentForm.day_of_week ?? 1) : null
                    })}
                    className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                  />
                  <Label htmlFor="is_recurring_transfer" className="text-sm font-medium cursor-pointer">
                    Make this a recurring assignment
                  </Label>
                </div>

                {assignmentForm.is_recurring && (
                  <div className="grid grid-cols-1 gap-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                    <div>
                      <Label className="text-sm font-medium">Day of the Week</Label>
                      <Select 
                        value={assignmentForm.day_of_week?.toString() || ''} 
                        onValueChange={(value) => setAssignmentForm({ ...assignmentForm, day_of_week: parseInt(value) })}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select day of week" />
                        </SelectTrigger>
                        <SelectContent className="z-[10001]">
                          <SelectItem value="0">Sunday</SelectItem>
                          <SelectItem value="1">Monday</SelectItem>
                          <SelectItem value="2">Tuesday</SelectItem>
                          <SelectItem value="3">Wednesday</SelectItem>
                          <SelectItem value="4">Thursday</SelectItem>
                          <SelectItem value="5">Friday</SelectItem>
                          <SelectItem value="6">Saturday</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-orange-600 mt-1">Route will be transferred every week on this day</p>
                    </div>

                    <div>
                      <Label className="text-sm font-medium">Recurrence Pattern</Label>
                      <Select 
                        value={assignmentForm.recurrence_pattern} 
                        onValueChange={(value) => setAssignmentForm({ 
                          ...assignmentForm, 
                          recurrence_pattern: value as 'weekly' | 'biweekly' | 'monthly' 
                        })}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="z-[10001]">
                          <SelectItem value="weekly">Every week</SelectItem>
                          <SelectItem value="biweekly">Every 2 weeks</SelectItem>
                          <SelectItem value="monthly">Every month</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-sm font-medium">End Date (Optional)</Label>
                      <Input
                        type="date"
                        value={assignmentForm.recurring_until}
                        onChange={(e) => setAssignmentForm({ ...assignmentForm, recurring_until: e.target.value })}
                        min={new Date().toISOString().split('T')[0]}
                        className="mt-1"
                      />
                      <p className="text-xs text-orange-600 mt-1">Leave empty for indefinite recurring assignment</p>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <Label>Transfer Notes</Label>
                <Textarea
                  value={assignmentForm.notes}
                  onChange={(e) => setAssignmentForm({ ...assignmentForm, notes: e.target.value })}
                  placeholder="Reason for transfer and any instructions for the new assignee..."
                  rows={3}
                  className="resize-none"
                />
                <p className="text-xs text-gray-500 mt-1">Include transfer reason and handover notes</p>
              </div>
            </div>

            <div className="flex justify-between items-center mt-8 pt-4 border-t">
              <div className="text-sm text-gray-500">
                Current assignment will be marked as "transferred"
              </div>
              <div className="flex space-x-2">
                <Button variant="outline" onClick={() => setShowTransferRoute(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={transferRoute}
                  disabled={!assignmentForm.assignee_id}
                  className="min-w-[120px] bg-orange-600 hover:bg-orange-700"
                >
                  <ArrowRight className="h-4 w-4 mr-2" />
                  Transfer Route
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Route Modal */}
      {showEditRoute && (
        <div className="fixed inset-0 z-[9999] overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Edit Route</h2>
              <button
                onClick={() => setShowEditRoute(false)}
                className="text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-md p-2"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-route-name">Route Name *</Label>
                <Input
                  id="edit-route-name"
                  value={routeForm.name}
                  onChange={(e) => setRouteForm({ ...routeForm, name: e.target.value })}
                  placeholder="Enter route name"
                  className="mt-1"
                  required
                />
              </div>

              <div>
                <Label htmlFor="edit-route-description">Description</Label>
                <Textarea
                  id="edit-route-description"
                  value={routeForm.description}
                  onChange={(e) => setRouteForm({ ...routeForm, description: e.target.value })}
                  placeholder="Optional route description"
                  rows={3}
                  className="mt-1 resize-none"
                />
              </div>

              <div>
                <Label htmlFor="edit-route-date">Route Date</Label>
                <Input
                  id="edit-route-date"
                  type="date"
                  value={routeForm.route_date}
                  onChange={(e) => setRouteForm({ ...routeForm, route_date: e.target.value })}
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">When should this route be executed?</p>
              </div>

              <div>
                <Label htmlFor="edit-optimization-type">Optimization Type</Label>
                <Select 
                  value={routeForm.optimization_type} 
                  onValueChange={(value) => setRouteForm({ ...routeForm, optimization_type: value as 'distance' | 'time' | 'balanced' | 'custom' })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="z-[10001]">
                    <SelectItem value="distance">
                      <div className="flex items-center">
                        <Route className="h-4 w-4 mr-2" />
                        Shortest Distance
                      </div>
                    </SelectItem>
                    <SelectItem value="time">
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-2" />
                        Fastest Time
                      </div>
                    </SelectItem>
                    <SelectItem value="balanced">
                      <div className="flex items-center">
                        <TrendingUp className="h-4 w-4 mr-2" />
                        Balanced (Recommended)
                      </div>
                    </SelectItem>
                    <SelectItem value="custom">
                      <div className="flex items-center">
                        <Settings className="h-4 w-4 mr-2" />
                        Custom Settings
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500 mt-1">How should the route be optimized?</p>
              </div>

              {/* Optimization Type Details */}
              {routeForm.optimization_type && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2 flex items-center">
                    {routeForm.optimization_type === 'distance' && <Route className="h-4 w-4 mr-2" />}
                    {routeForm.optimization_type === 'time' && <Clock className="h-4 w-4 mr-2" />}
                    {routeForm.optimization_type === 'balanced' && <TrendingUp className="h-4 w-4 mr-2" />}
                    {routeForm.optimization_type === 'custom' && <Settings className="h-4 w-4 mr-2" />}
                    Optimization Strategy: {routeForm.optimization_type.charAt(0).toUpperCase() + routeForm.optimization_type.slice(1)}
                  </h4>
                  <div className="text-sm text-gray-600 space-y-2">
                    {routeForm.optimization_type === 'distance' && (
                      <>
                        <p>• Minimizes total travel distance</p>
                        <p>• Best for reducing fuel costs</p>
                        <p>• May take longer due to traffic or road conditions</p>
                        <p>• Ideal for deliveries with flexible time windows</p>
                      </>
                    )}
                    {routeForm.optimization_type === 'time' && (
                      <>
                        <p>• Minimizes total travel time</p>
                        <p>• Considers traffic patterns and road speeds</p>
                        <p>• May cover more distance on faster routes</p>
                        <p>• Best for time-sensitive deliveries</p>
                      </>
                    )}
                    {routeForm.optimization_type === 'balanced' && (
                      <>
                        <p>• Balances distance and time considerations</p>
                        <p>• Optimizes for overall efficiency</p>
                        <p>• Considers both fuel costs and time costs</p>
                        <p>• Recommended for most use cases</p>
                      </>
                    )}
                    {routeForm.optimization_type === 'custom' && (
                      <>
                        <p>• Configure advanced optimization parameters</p>
                        <p>• Set priorities for different stops</p>
                        <p>• Define time windows and constraints</p>
                        <p>• Apply specific business rules</p>
                      </>
                    )}
                  </div>

                  {/* Additional settings for custom optimization */}
                  {routeForm.optimization_type === 'custom' && settings && (
                    <div className="mt-4 pt-4 border-t border-gray-200 space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm">Avoid Tolls</Label>
                        <input
                          type="checkbox"
                          checked={settings.avoid_tolls}
                          onChange={(e) => setSettings({ ...settings, avoid_tolls: e.target.checked })}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label className="text-sm">Avoid Highways</Label>
                        <input
                          type="checkbox"
                          checked={settings.avoid_highways}
                          onChange={(e) => setSettings({ ...settings, avoid_highways: e.target.checked })}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label className="text-sm">Prefer Main Roads</Label>
                        <input
                          type="checkbox"
                          checked={settings.prefer_main_roads}
                          onChange={(e) => setSettings({ ...settings, prefer_main_roads: e.target.checked })}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <Label className="text-sm">Max Route Distance (km)</Label>
                        <Input
                          type="number"
                          value={settings.max_daily_distance || ''}
                          onChange={(e) => setSettings({ ...settings, max_daily_distance: parseFloat(e.target.value) })}
                          className="mt-1"
                          placeholder="e.g., 300"
                        />
                      </div>
                      <div>
                        <Label className="text-sm">Max Route Duration (minutes)</Label>
                        <Input
                          type="number"
                          value={settings.max_route_duration || ''}
                          onChange={(e) => setSettings({ ...settings, max_route_duration: parseInt(e.target.value) })}
                          className="mt-1"
                          placeholder="e.g., 480"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="border-t pt-4">
                <Label htmlFor="route-owner">Route Owner (Transfer Ownership)</Label>
                <Select 
                  value={selectedRoute?.created_by || ''} 
                  onValueChange={(value) => {
                    if (selectedRoute) {
                      setSelectedRoute({ ...selectedRoute, created_by: value })
                    }
                  }}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select route owner" />
                  </SelectTrigger>
                  <SelectContent className="z-[10001]">
                    {users.map(user => (
                      <SelectItem key={user.id} value={user.id} textValue={`${user.full_name} - ${user.role}`}>
                        <div className="flex items-center">
                          <User className="h-4 w-4 mr-2" />
                          {user.full_name} - {user.role}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500 mt-1">Transfer ownership of this route to another user</p>
              </div>

              {selectedRoute && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-medium text-blue-900 mb-2">Route Information</h3>
                  <div className="text-sm text-blue-700 space-y-1">
                    <p><strong>Stops:</strong> {selectedRoute.total_stops} outlets</p>
                    <p><strong>Distance:</strong> {selectedRoute.total_estimated_distance?.toFixed(1)} km</p>
                    <p><strong>Duration:</strong> {Math.round((selectedRoute.total_estimated_duration || 0) / 60)}h {Math.round((selectedRoute.total_estimated_duration || 0) % 60)}m</p>
                    <p><strong>Status:</strong> {selectedRoute.status}</p>
                    <p><strong>Created:</strong> {new Date(selectedRoute.created_at).toLocaleDateString()}</p>
                    <p><strong>Current Owner:</strong> {users.find(u => u.id === selectedRoute.created_by)?.full_name || 'Unknown'}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-between items-center mt-8 pt-4 border-t">
              <div className="text-sm text-gray-500">
                Changes will be saved immediately
              </div>
              <div className="flex space-x-2">
                <Button variant="outline" onClick={() => setShowEditRoute(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={updateRoute}
                  disabled={!routeForm.name}
                  className="min-w-[120px]"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Update Route
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal - Using inline modal for testing */}
      {showSettings && (
        <div className="fixed inset-0 z-[9999] overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Route Optimization Settings</h2>
              <button
                onClick={() => setShowSettings(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <p>This is a test settings modal.</p>
              
              {settings && (
                <div>
                  <div>
                    <Label>Default Optimization: {settings.default_optimization_type}</Label>
                  </div>
                  <div>
                    <Label>Default Stop Duration</Label>
                    <Input
                      type="number"
                      value={settings.default_stop_duration}
                      onChange={(e) => setSettings({ ...settings, default_stop_duration: parseInt(e.target.value) || 30 })}
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setShowSettings(false)}>
                  Cancel
                </Button>
                <Button onClick={() => {
                  setShowSettings(false)
                  alert('Settings saved!')
                }}>
                  Save Settings
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}