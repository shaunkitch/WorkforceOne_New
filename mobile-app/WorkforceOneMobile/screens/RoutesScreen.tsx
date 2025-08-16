import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

interface Route {
  id: string
  name: string
  description?: string
  status: string
  total_stops: number
  total_estimated_distance: number
  total_estimated_duration: number
  route_date?: string
  route_stops: Array<{
    outlet: {
      name: string
      address: string
    }
  }>
}

export default function RoutesScreen() {
  const { profile } = useAuth()
  const [routes, setRoutes] = useState<Route[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    fetchRoutes()
  }, [])

  const fetchRoutes = async () => {
    if (!profile?.organization_id) return

    try {
      const { data, error } = await supabase
        .from('routes')
        .select(`
          id,
          name,
          description,
          status,
          total_stops,
          total_estimated_distance,
          total_estimated_duration,
          route_date,
          route_stops (
            outlet:outlets (
              name,
              address
            )
          )
        `)
        .eq('organization_id', profile.organization_id)
        .order('created_at', { ascending: false })

      if (error) throw error

      setRoutes(data || [])
    } catch (error) {
      console.error('Error fetching routes:', error)
      Alert.alert('Error', 'Failed to load routes')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const onRefresh = () => {
    setRefreshing(true)
    fetchRoutes()
  }

  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60)
    const mins = Math.round(minutes % 60)
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#10b981'
      case 'completed': return '#6b7280'
      case 'draft': return '#f59e0b'
      default: return '#6b7280'
    }
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Loading routes...</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Routes</Text>
        <Text style={styles.headerSubtitle}>Manage delivery and service routes</Text>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {routes.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="location-outline" size={64} color="#d1d5db" />
            <Text style={styles.emptyTitle}>No routes found</Text>
            <Text style={styles.emptyText}>Routes will appear here when created</Text>
          </View>
        ) : (
          <View style={styles.routesList}>
            {routes.map((route) => (
              <View key={route.id} style={styles.routeCard}>
                <View style={styles.routeHeader}>
                  <View style={styles.routeInfo}>
                    <Text style={styles.routeName}>{route.name}</Text>
                    {route.description && (
                      <Text style={styles.routeDescription}>{route.description}</Text>
                    )}
                    {route.route_date && (
                      <Text style={styles.routeDate}>
                        {new Date(route.route_date).toLocaleDateString()}
                      </Text>
                    )}
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(route.status) }]}>
                    <Text style={styles.statusText}>{route.status}</Text>
                  </View>
                </View>

                <View style={styles.routeStats}>
                  <View style={styles.statItem}>
                    <Ionicons name="location" size={16} color="#6b7280" />
                    <Text style={styles.statText}>{route.total_stops} stops</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Ionicons name="navigate" size={16} color="#6b7280" />
                    <Text style={styles.statText}>{route.total_estimated_distance?.toFixed(1)} km</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Ionicons name="time" size={16} color="#6b7280" />
                    <Text style={styles.statText}>{formatDuration(route.total_estimated_duration || 0)}</Text>
                  </View>
                </View>

                {route.route_stops && route.route_stops.length > 0 && (
                  <View style={styles.stopsSection}>
                    <Text style={styles.stopsTitle}>Stops:</Text>
                    {route.route_stops.slice(0, 3).map((stop, index) => (
                      <Text key={index} style={styles.stopText}>
                        {index + 1}. {stop.outlet.name}
                      </Text>
                    ))}
                    {route.route_stops.length > 3 && (
                      <Text style={styles.moreStops}>
                        +{route.route_stops.length - 3} more stops
                      </Text>
                    )}
                  </View>
                )}
              </View>
            ))}
          </View>
        )}
      </ScrollView>
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
    paddingTop: 30,
    paddingHorizontal: 20,
    paddingBottom: 20,
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
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#374151',
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 8,
    textAlign: 'center',
  },
  routesList: {
    paddingBottom: 20,
  },
  routeCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  routeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  routeInfo: {
    flex: 1,
    marginRight: 12,
  },
  routeName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
  },
  routeDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  routeDate: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  routeStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    fontSize: 12,
    color: '#6b7280',
    marginLeft: 4,
  },
  stopsSection: {
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    paddingTop: 12,
  },
  stopsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  stopText: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 2,
  },
  moreStops: {
    fontSize: 12,
    color: '#9ca3af',
    fontStyle: 'italic',
  },
})