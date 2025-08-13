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
  Target
} from 'lucide-react'
import { format } from 'date-fns'
import GoogleMapComponent from '@/components/maps/GoogleMapComponent'
import { routeOptimizationService, type RouteStop, type OptimizedRoute } from '@/lib/routeOptimization'

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
  const [showSettings, setShowSettings] = useState(false)

  // Memoized markers for map to prevent re-renders
  const mapMarkers = useMemo(() => {
    const filteredOutlets = outlets.filter(outlet => outlet.latitude && outlet.longitude)
    console.log('Creating map markers for', filteredOutlets.length, 'outlets')
    
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
    
    console.log('Generated', markers.length, 'map markers:', markers)
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
    notes: ''
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
        notes: assignmentForm.notes
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
        notes: ''
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

  const transferRoute = async () => {
    try {
      if (!selectedRoute || !assignmentForm.assignee_id) {
        alert('Please select a route and new assignee')
        return
      }

      const profile = await getCurrentUserProfile()
      if (!profile) {
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
        assigned_by: profile.id,
        assigned_date: assignmentForm.assigned_date || new Date().toISOString().split('T')[0],
        status: 'assigned',
        completion_percentage: 0,
        notes: `TRANSFERRED FROM: ${currentAssignment.assignee_name || currentAssignment.assignee_id}\n` + 
               (assignmentForm.notes || 'Route transfer')
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
        notes: ''
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
          updated_at: new Date().toISOString()
        })
        .eq('id', routeId)

      if (updateError) throw updateError

      // Update route stops with new order and timing
      const updatePromises = optimizedRoute.stops.map((stop, index) => {
        const routeStop = route.route_stops?.find(rs => rs.outlet_id === stop.id)
        if (!routeStop) return Promise.resolve()

        return supabase
          .from('route_stops')
          .update({
            stop_order: index + 1,
            updated_at: new Date().toISOString()
          })
          .eq('id', routeStop.id)
      })

      await Promise.all(updatePromises)

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
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview & Map</TabsTrigger>
          <TabsTrigger value="routes">Routes Management</TabsTrigger>
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
                    <SelectContent>
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
                  optimizedRoute={(() => {
                    const route = showRouteOnMap ? optimizedRoutes.get(showRouteOnMap) : undefined
                    console.log('Passing to GoogleMapComponent:', {
                      showRouteOnMap,
                      hasRoute: !!route,
                      routeStops: route?.stops?.length || 0,
                      showRoutePolyline: !!showRouteOnMap
                    })
                    return route
                  })()}
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
                      onClick={() => {
                        const newRouteId = showRouteOnMap === route.id ? null : route.id
                        console.log('Show/Hide route clicked:', { 
                          routeId: route.id, 
                          routeName: route.name,
                          currentlyShowing: showRouteOnMap, 
                          newSelection: newRouteId,
                          hasOptimizedRoute: optimizedRoutes.has(route.id),
                          optimizedRoute: optimizedRoutes.get(route.id)
                        })
                        setShowRouteOnMap(newRouteId)
                        setActiveTab('overview') // Switch to map tab
                      }}
                    >
                      <MapIcon className="h-4 w-4 mr-1" />
                      {showRouteOnMap === route.id ? 'Hide' : 'Show'}
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>

                  {route.route_assignments && route.route_assignments.length > 0 && (
                    <div className="border-t pt-3">
                      <p className="text-xs font-medium text-gray-700 mb-2">Assignments</p>
                      <div className="space-y-1">
                        {route.route_assignments.map((assignment) => (
                          <div key={assignment.id} className="flex items-center justify-between text-xs">
                            <span className="text-gray-600">
                              {assignment.assignee_type === 'user' ? '👤' : '👥'} {assignment.assignee_id}
                            </span>
                            <Badge variant="secondary" className={getStatusColor(assignment.status)}>
                              {assignment.status}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
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
                  <SelectContent>
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
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
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
                <Select value={assignmentForm.assignee_type} onValueChange={(value: any) => setAssignmentForm({ ...assignmentForm, assignee_type: value, assignee_id: '' })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select assignment type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">👤 Individual User</SelectItem>
                    <SelectItem value="team">👥 Team</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>{assignmentForm.assignee_type === 'user' ? 'Select User' : 'Select Team'}</Label>
                <Select value={assignmentForm.assignee_id} onValueChange={(value) => setAssignmentForm({ ...assignmentForm, assignee_id: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder={`Choose ${assignmentForm.assignee_type === 'user' ? 'a user' : 'a team'}`} />
                  </SelectTrigger>
                  <SelectContent>
                    {assignmentForm.assignee_type === 'user' 
                      ? users.map(user => (
                          <SelectItem key={user.id} value={user.id}>
                            <div className="flex items-center space-x-2">
                              <span>👤</span>
                              <span>{user.full_name}</span>
                              <Badge variant="secondary" className="ml-2 text-xs">
                                {user.role}
                              </Badge>
                            </div>
                          </SelectItem>
                        ))
                      : teams.map(team => (
                          <SelectItem key={team.id} value={team.id}>
                            <div className="flex items-center space-x-2">
                              <span>👥</span>
                              <span>{team.name}</span>
                            </div>
                          </SelectItem>
                        ))
                    }
                  </SelectContent>
                </Select>
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