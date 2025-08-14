import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
} from 'react-native'
import { StatusBar } from 'expo-status-bar'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

// Configuration for form completion
const CONFIG = {
  // Change this to your actual web app URL when testing on a real device
  // Examples: 
  // - Local network: 'http://192.168.1.100:3001'
  // - Production: 'https://your-workforceone-app.com'
  WEB_APP_URL: 'http://localhost:3001',
  // Set to true to show simulation options in development
  SHOW_DEV_OPTIONS: false
}

interface Outlet {
  id: string
  name: string
  address: string
  phone?: string
  contact_person?: string
  latitude?: number
  longitude?: number
  group_name?: string
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
  status: 'pending' | 'in_transit' | 'arrived' | 'completed' | 'skipped'
  priority: number
  outlet: Outlet
}

interface DailyRoute {
  id: string
  name: string
  route_date: string
  status: string
  total_stops: number
  completed_stops: number
  stops: RouteStop[]
}

export default function DailyCallsScreen({ navigation }: any) {
  const { user, profile } = useAuth()
  const [loading, setLoading] = useState(true)
  const [routes, setRoutes] = useState<DailyRoute[]>([])
  const [selectedRoute, setSelectedRoute] = useState<DailyRoute | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    fetchTodayRoutes()
  }, [])

  const fetchTodayRoutes = async () => {
    if (!user || !profile?.organization_id) return

    try {
      const today = new Date().toISOString().split('T')[0]
      
      // Get routes assigned to the user for today
      const { data: routeAssignments, error: assignmentsError } = await supabase
        .from('route_assignments')
        .select(`
          route_id,
          routes!inner (
            id,
            name,
            route_date,
            status,
            total_stops
          )
        `)
        .eq('assignee_type', 'user')
        .eq('assignee_id', user.id)
        .eq('routes.route_date', today)
        .eq('routes.organization_id', profile.organization_id)

      if (assignmentsError) throw assignmentsError

      if (!routeAssignments || routeAssignments.length === 0) {
        setRoutes([])
        return
      }

      // Get detailed route information with stops
      const routeIds = routeAssignments.map(ra => ra.route_id)
      
      const enrichedRoutes = await Promise.all(
        routeAssignments.map(async (assignment) => {
          const route = assignment.routes

          // Get route stops with outlet information
          const { data: stops, error: stopsError } = await supabase
            .from('route_stops')
            .select('*')
            .eq('route_id', route.id)
            .order('stop_order', { ascending: true })

          if (stopsError) {
            console.error('Error fetching stops:', stopsError)
            return {
              ...route,
              completed_stops: 0,
              stops: []
            }
          }

          // Get outlet details for each stop
          const stopsWithOutlets = await Promise.all(
            (stops || []).map(async (stop) => {
              const { data: outlet, error: outletError } = await supabase
                .from('outlets')
                .select('*')
                .eq('id', stop.outlet_id)
                .single()

              if (outletError) {
                console.error('Error fetching outlet:', outletError)
                return {
                  ...stop,
                  outlet: {
                    id: stop.outlet_id,
                    name: 'Unknown Outlet',
                    address: '',
                  }
                }
              }

              return {
                ...stop,
                outlet
              }
            })
          )

          const completedCount = stopsWithOutlets.filter(
            stop => stop.status === 'completed'
          ).length

          return {
            ...route,
            completed_stops: completedCount,
            stops: stopsWithOutlets
          }
        })
      )

      setRoutes(enrichedRoutes)
      
      // Auto-select the first route if available
      if (enrichedRoutes.length > 0) {
        setSelectedRoute(enrichedRoutes[0])
      }

    } catch (error) {
      console.error('Error fetching daily routes:', error)
      Alert.alert('Error', 'Failed to load daily routes')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#10b981'
      case 'arrived': return '#3b82f6'
      case 'in_transit': return '#f59e0b'
      case 'pending': return '#6b7280'
      case 'skipped': return '#ef4444'
      default: return '#6b7280'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return 'checkmark-circle'
      case 'arrived': return 'location'
      case 'in_transit': return 'car'
      case 'pending': return 'time'
      case 'skipped': return 'close-circle'
      default: return 'ellipse'
    }
  }

  const getPriorityColor = (priority: number) => {
    switch (priority) {
      case 1: return '#ef4444' // High - Red
      case 2: return '#f59e0b' // Medium - Orange  
      case 3: return '#10b981' // Low - Green
      default: return '#6b7280'
    }
  }

  const getPriorityText = (priority: number) => {
    switch (priority) {
      case 1: return 'High'
      case 2: return 'Medium'
      case 3: return 'Low'
      default: return 'Normal'
    }
  }

  const handleStopPress = (stop: RouteStop) => {
    Alert.alert(
      stop.outlet.name,
      `Address: ${stop.outlet.address}${stop.outlet.contact_person ? `\nContact: ${stop.outlet.contact_person}` : ''}${stop.outlet.phone ? `\nPhone: ${stop.outlet.phone}` : ''}\n\nWhat would you like to do?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Get Directions', 
          onPress: () => showDirectionsOptions(stop.outlet)
        },
        { 
          text: 'Check In', 
          onPress: () => checkInToOutlet(stop),
          style: 'default'
        },
      ]
    )
  }

  const showDirectionsOptions = (outlet: Outlet) => {
    const options: any[] = [
      { text: 'Cancel', style: 'cancel' }
    ]

    if (Platform.OS === 'ios') {
      options.unshift({ 
        text: 'Apple Maps', 
        onPress: () => openAppleMaps(outlet) 
      })
    }
    
    options.unshift({ 
      text: 'Google Maps', 
      onPress: () => openGoogleMaps(outlet) 
    })

    Alert.alert(
      'Choose Maps App',
      `Get directions to ${outlet.name}`,
      options
    )
  }

  const openAppleMaps = async (outlet: Outlet) => {
    try {
      let url: string
      if (outlet.latitude && outlet.longitude) {
        url = `maps://app?daddr=${outlet.latitude},${outlet.longitude}&dirflg=d`
      } else {
        const address = encodeURIComponent(outlet.address)
        url = `maps://app?daddr=${address}&dirflg=d`
      }
      
      const canOpen = await Linking.canOpenURL(url)
      if (canOpen) {
        await Linking.openURL(url)
      } else {
        Alert.alert('Error', 'Apple Maps is not available on this device.')
      }
    } catch (error) {
      console.error('Error opening Apple Maps:', error)
      Alert.alert('Error', 'Failed to open Apple Maps')
    }
  }

  const openGoogleMaps = async (outlet: Outlet) => {
    try {
      let url: string
      
      if (Platform.OS === 'android') {
        // Try Google Maps app first on Android
        if (outlet.latitude && outlet.longitude) {
          url = `google.navigation:q=${outlet.latitude},${outlet.longitude}&mode=d`
        } else {
          const address = encodeURIComponent(outlet.address)
          url = `google.navigation:q=${address}&mode=d`
        }
        
        const canOpenApp = await Linking.canOpenURL(url)
        if (canOpenApp) {
          await Linking.openURL(url)
          return
        }
      }
      
      // Fallback to web Google Maps
      let destination: string
      if (outlet.latitude && outlet.longitude) {
        destination = `${outlet.latitude},${outlet.longitude}`
      } else {
        destination = encodeURIComponent(outlet.address)
      }
      
      url = `https://maps.google.com?daddr=${destination}&directionsmode=driving`
      
      const canOpenWeb = await Linking.canOpenURL(url)
      if (canOpenWeb) {
        await Linking.openURL(url)
      } else {
        Alert.alert('Error', 'Google Maps is not available')
      }
    } catch (error) {
      console.error('Error opening Google Maps:', error)
      Alert.alert('Error', 'Failed to open Google Maps')
    }
  }


  const checkInToOutlet = async (stop: RouteStop) => {
    setActionLoading(true)
    try {
      // First, create an outlet visit record
      const { data: visitData, error: visitError } = await supabase
        .from('outlet_visits')
        .insert({
          outlet_id: stop.outlet.id,
          user_id: user!.id,
          route_stop_id: stop.id,
          organization_id: profile!.organization_id,
          check_in_time: new Date().toISOString(),
          form_completed: false
        })
        .select()
        .single()

      if (visitError) throw visitError

      // Update route stop status to 'arrived'
      const { error: updateError } = await supabase
        .from('route_stops')
        .update({
          status: 'arrived',
          actual_arrival_time: new Date().toISOString()
        })
        .eq('id', stop.id)

      if (updateError) throw updateError

      // Check if outlet requires a form using the enhanced system
      const { data: outletFormData, error: outletFormError } = await supabase
        .from('outlet_form_requirements')
        .select('*')
        .eq('outlet_id', stop.outlet.id)
        .single()

      if (outletFormError) {
        console.error('Error fetching outlet form requirements:', outletFormError)
      }

      const hasRequiredForm = outletFormData?.form_required === true && outletFormData?.effective_form_id != null

      if (hasRequiredForm && outletFormData) {
        // Get the full form details for the effective form
        const { data: formDetails, error: formError } = await supabase
          .from('forms')
          .select('*')
          .eq('id', outletFormData.effective_form_id)
          .single()

        if (formError) {
          console.error('Error fetching form details:', formError)
        }

        const formToUse = formDetails || {
          id: outletFormData.effective_form_id,
          title: outletFormData.effective_form_title || 'Required Form',
          description: 'Please complete this form for the outlet visit',
          fields: []
        }

        Alert.alert(
          'Checked In Successfully!',
          `You've checked in to ${stop.outlet.name}. Please complete the required form: "${formToUse.title}"${outletFormData.group_form_id ? ' (Group Required)' : ''}`,
          [
            {
              text: 'Complete Form Later',
              style: 'cancel'
            },
            {
              text: 'Complete Form Now',
              onPress: () => openOutletForm(formToUse, visitData.id, stop)
            },
            // Add development option if configured
            ...(CONFIG.SHOW_DEV_OPTIONS ? [{
              text: 'Dev: Simulate',
              onPress: () => simulateFormCompletion(formToUse.id, visitData.id, stop.id),
              style: 'destructive' as const
            }] : [])
          ]
        )
      } else {
        // Determine the reason no form is required
        let message = `You've checked in to ${stop.outlet.name}.`
        
        if (outletFormData?.form_required === false) {
          message += ' Form requirement disabled for this outlet.'
        } else if (outletFormData?.form_required === true) {
          message += ' No form assigned to this outlet or group.'
        } else {
          message += ' No form required for this outlet.'
        }

        Alert.alert(
          'Checked In Successfully!',
          message,
          [
            {
              text: 'Mark as Completed',
              onPress: () => markStopCompleted(stop.id)
            }
          ]
        )
      }

      // Refresh data
      await fetchTodayRoutes()

    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to check in')
    } finally {
      setActionLoading(false)
    }
  }

  const openOutletForm = (form: any, visitId: string, stop: RouteStop) => {
    // Construct the web form URL using configuration
    const formUrl = `${CONFIG.WEB_APP_URL}/dashboard/outlets/complete-form?form=${form.id}&outlet=${stop.outlet.id}&visit=${visitId}`
    
    // Directly open the form in the web browser
    Linking.openURL(formUrl).catch(err => {
      console.error('Error opening web form:', err)
      // Fall back to showing options if direct opening fails
      Alert.alert(
        'Error Opening Form',
        'Could not open the form directly. What would you like to do?',
        [
          {
            text: 'Cancel',
            style: 'cancel'
          },
          {
            text: 'Try Again',
            onPress: () => {
              Linking.openURL(formUrl).catch(() => {
                Alert.alert('Error', 'Could not open web form. Please ensure you have a web browser installed.')
              })
            }
          },
          {
            text: 'Simulate Completion',
            onPress: () => simulateFormCompletion(form.id, visitId, stop.id),
            style: 'destructive'
          }
        ]
      )
    })
  }

  const simulateFormCompletion = async (formId: string, visitId: string, stopId: string) => {
    setActionLoading(true)
    try {
      // Create a form response (using actual schema)
      const { data: responseData, error: responseError } = await supabase
        .from('form_responses')
        .insert({
          form_id: formId,
          organization_id: profile!.organization_id,
          respondent_id: user!.id,
          responses: {
            'simulated': true,
            'completed_at': new Date().toISOString(),
            '_metadata': {
              'outlet_visit_id': visitId,
              'simulation': true
            }
          },
          status: 'completed',
          submitted_at: new Date().toISOString()
        })
        .select()
        .single()

      if (responseError) throw responseError

      // Update the outlet visit to mark form as completed
      const { error: visitUpdateError } = await supabase
        .from('outlet_visits')
        .update({
          form_completed: true,
          form_response_id: responseData.id
        })
        .eq('id', visitId)

      if (visitUpdateError) throw visitUpdateError

      // Mark the route stop as completed
      await markStopCompleted(stopId)

      Alert.alert('Success!', 'Form completed and outlet visit finished.')

    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to complete form')
    } finally {
      setActionLoading(false)
    }
  }

  const markStopCompleted = async (stopId: string) => {
    try {
      const { error } = await supabase
        .from('route_stops')
        .update({
          status: 'completed',
          actual_departure_time: new Date().toISOString()
        })
        .eq('id', stopId)

      if (error) throw error

      // Refresh data to show updated status
      await fetchTodayRoutes()

    } catch (error: any) {
      console.error('Error marking stop completed:', error)
    }
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Loading daily routes...</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Daily Calls</Text>
          <Text style={styles.headerSubtitle}>
            {new Date().toLocaleDateString()} - Your outlet visits
          </Text>
        </View>
        <TouchableOpacity onPress={fetchTodayRoutes}>
          <Ionicons name="refresh" size={24} color="white" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {routes.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="map-outline" size={48} color="#d1d5db" />
            <Text style={styles.emptyText}>No routes assigned for today</Text>
            <Text style={styles.emptySubtext}>
              Check back later or contact your manager
            </Text>
          </View>
        ) : (
          <>
            {/* Route Summary */}
            {selectedRoute && (
              <View style={styles.routeCard}>
                <Text style={styles.routeName}>{selectedRoute.name}</Text>
                <View style={styles.routeStats}>
                  <View style={styles.statItem}>
                    <Text style={styles.statNumber}>{selectedRoute.total_stops}</Text>
                    <Text style={styles.statLabel}>Total Stops</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statNumber}>{selectedRoute.completed_stops}</Text>
                    <Text style={styles.statLabel}>Completed</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statNumber}>
                      {Math.round((selectedRoute.completed_stops / selectedRoute.total_stops) * 100) || 0}%
                    </Text>
                    <Text style={styles.statLabel}>Progress</Text>
                  </View>
                </View>
              </View>
            )}

            {/* Route Stops List */}
            <View style={styles.stopsContainer}>
              <Text style={styles.sectionTitle}>Route Stops</Text>
              {selectedRoute?.stops.map((stop, index) => (
                <TouchableOpacity
                  key={stop.id}
                  style={[
                    styles.stopCard,
                    stop.status === 'completed' && styles.completedStopCard
                  ]}
                  onPress={() => handleStopPress(stop)}
                >
                  <View style={styles.stopHeader}>
                    <View style={styles.stopNumber}>
                      <Text style={styles.stopNumberText}>{stop.stop_order}</Text>
                    </View>
                    <View style={styles.stopInfo}>
                      <Text style={styles.outletName}>{stop.outlet.name}</Text>
                      <Text style={styles.outletAddress}>{stop.outlet.address}</Text>
                      {stop.outlet.contact_person && (
                        <Text style={styles.contactPerson}>
                          Contact: {stop.outlet.contact_person}
                        </Text>
                      )}
                    </View>
                    <View style={styles.stopStatus}>
                      <Ionicons
                        name={getStatusIcon(stop.status) as any}
                        size={20}
                        color={getStatusColor(stop.status)}
                      />
                    </View>
                  </View>

                  <View style={styles.stopFooter}>
                    <View style={[styles.priorityBadge, { backgroundColor: getPriorityColor(stop.priority) }]}>
                      <Text style={styles.priorityText}>{getPriorityText(stop.priority)}</Text>
                    </View>
                    
                    <Text style={styles.statusText}>
                      {stop.status.replace('_', ' ').toUpperCase()}
                    </Text>
                    
                    {stop.estimated_duration && (
                      <Text style={styles.durationText}>
                        ~{stop.estimated_duration}min
                      </Text>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {/* Bottom spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>

      {actionLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#3b82f6" />
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  loadingText: {
    marginTop: 12,
    color: '#6b7280',
    fontSize: 16,
  },
  header: {
    backgroundColor: '#3b82f6',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    color: '#93c5fd',
    fontSize: 16,
    marginTop: 4,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    color: '#9ca3af',
    marginTop: 12,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  routeCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  routeName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
  routeStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#3b82f6',
  },
  statLabel: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  stopsContainer: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
  },
  stopCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  completedStopCard: {
    backgroundColor: '#f0fdf4',
    borderLeftWidth: 4,
    borderLeftColor: '#10b981',
  },
  stopHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  stopNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#3b82f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  stopNumberText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  stopInfo: {
    flex: 1,
    marginRight: 8,
  },
  outletName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  outletAddress: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 2,
  },
  contactPerson: {
    fontSize: 12,
    color: '#6b7280',
  },
  stopStatus: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  stopFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  priorityText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  statusText: {
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  durationText: {
    fontSize: 12,
    color: '#6b7280',
  },
  bottomSpacing: {
    height: 100,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
})