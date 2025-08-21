import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../contexts/AuthContext';
import { patrolService, PatrolSession, PatrolRoute } from '../services/PatrolService';
import { supabase } from '../lib/supabase';

const { width } = Dimensions.get('window');

export default function PatrolDashboardScreen({ navigation }: any) {
  const { user } = useAuth();
  const [currentSession, setCurrentSession] = useState<PatrolSession | null>(null);
  const [availableRoutes, setAvailableRoutes] = useState<PatrolRoute[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      initializePatrolService();
      loadData();
    }, [])
  );

  const initializePatrolService = async () => {
    try {
      setIsInitializing(true);
      await patrolService.initialize(supabase);
      
      // Check for existing session
      const session = patrolService.getCurrentSession();
      setCurrentSession(session);
      
    } catch (error) {
      console.error('Error initializing patrol service:', error);
      Alert.alert('Error', 'Failed to initialize patrol system. Please check location permissions.');
    } finally {
      setIsInitializing(false);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load available routes
      const routes = await patrolService.getPatrolRoutes();
      setAvailableRoutes(routes);
      
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Error', 'Failed to load patrol data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const startPatrol = async (routeId: string) => {
    try {
      Alert.alert(
        'Start Patrol',
        'Are you ready to start your security patrol? GPS tracking will begin.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Start Patrol',
            onPress: async () => {
              try {
                setLoading(true);
                const session = await patrolService.startPatrol(routeId);
                setCurrentSession(session);
                Alert.alert('Patrol Started', 'Your patrol session is now active. Stay safe!');
              } catch (error) {
                console.error('Error starting patrol:', error);
                Alert.alert('Error', 'Failed to start patrol. Please try again.');
              } finally {
                setLoading(false);
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error in startPatrol:', error);
    }
  };

  const endPatrol = async () => {
    if (!currentSession) return;

    Alert.alert(
      'End Patrol',
      'Are you sure you want to end your patrol session?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'End Patrol',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await patrolService.endPatrol();
              setCurrentSession(null);
              Alert.alert('Patrol Ended', 'Your patrol session has been completed successfully.');
            } catch (error) {
              console.error('Error ending patrol:', error);
              Alert.alert('Error', 'Failed to end patrol. Please try again.');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const pausePatrol = async () => {
    if (!currentSession) return;

    try {
      await patrolService.pausePatrol();
      const updatedSession = { ...currentSession, status: 'paused' as const };
      setCurrentSession(updatedSession);
      Alert.alert('Patrol Paused', 'GPS tracking has been paused.');
    } catch (error) {
      console.error('Error pausing patrol:', error);
      Alert.alert('Error', 'Failed to pause patrol.');
    }
  };

  const resumePatrol = async () => {
    if (!currentSession) return;

    try {
      await patrolService.resumePatrol();
      const updatedSession = { ...currentSession, status: 'active' as const };
      setCurrentSession(updatedSession);
      Alert.alert('Patrol Resumed', 'GPS tracking has been resumed.');
    } catch (error) {
      console.error('Error resuming patrol:', error);
      Alert.alert('Error', 'Failed to resume patrol.');
    }
  };

  const triggerPanicButton = async () => {
    Alert.alert(
      '🚨 EMERGENCY',
      'This will immediately alert supervisors and emergency contacts. Only use in real emergencies.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'EMERGENCY ALERT',
          style: 'destructive',
          onPress: async () => {
            try {
              await patrolService.triggerPanicButton();
              Alert.alert('🚨 EMERGENCY ALERT SENT', 'Help is on the way. Stay safe.');
            } catch (error) {
              console.error('Error triggering panic:', error);
              Alert.alert('Error', 'Failed to send emergency alert');
            }
          },
        },
      ]
    );
  };

  const navigateToCheckpoints = () => {
    const route = availableRoutes.find(r => r.id === currentSession?.route_id);
    if (route) {
      navigation.navigate('PatrolCheckpoints', { route });
    }
  };

  const formatDuration = (startTime: string) => {
    const start = new Date(startTime);
    const now = new Date();
    const diff = now.getTime() - start.getTime();
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${minutes}m`;
  };

  const getRouteById = (routeId: string) => {
    return availableRoutes.find(r => r.id === routeId);
  };

  if (isInitializing) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <StatusBar style="light" />
        <Ionicons name="location" size={64} color="#3b82f6" />
        <Text style={styles.loadingText}>Initializing Patrol System...</Text>
        <Text style={styles.loadingSubtext}>Setting up GPS and permissions</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Security Patrol</Text>
          <Text style={styles.headerSubtitle}>
            {currentSession ? 'Patrol Active' : 'Ready to Patrol'}
          </Text>
        </View>
        <View style={styles.headerActions}>
          {currentSession && (
            <TouchableOpacity style={styles.panicButton} onPress={triggerPanicButton}>
              <Ionicons name="warning" size={24} color="white" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Current Session Status */}
        {currentSession ? (
          <View style={styles.sessionCard}>
            <View style={styles.sessionHeader}>
              <View style={[styles.statusDot, { 
                backgroundColor: currentSession.status === 'active' ? '#10b981' : '#f59e0b' 
              }]} />
              <Text style={styles.sessionTitle}>Active Patrol Session</Text>
              <Text style={styles.sessionDuration}>
                {formatDuration(currentSession.start_time)}
              </Text>
            </View>

            <View style={styles.sessionDetails}>
              <Text style={styles.routeName}>
                Route: {getRouteById(currentSession.route_id)?.name || 'Unknown Route'}
              </Text>
              <Text style={styles.sessionStatus}>
                Status: {currentSession.status.charAt(0).toUpperCase() + currentSession.status.slice(1)}
              </Text>
            </View>

            {/* Session Actions */}
            <View style={styles.sessionActions}>
              <TouchableOpacity
                style={[styles.actionButton, styles.checkpointsButton]}
                onPress={navigateToCheckpoints}
              >
                <Ionicons name="checkmark-circle-outline" size={20} color="white" />
                <Text style={styles.actionButtonText}>Checkpoints</Text>
              </TouchableOpacity>

              {currentSession.status === 'active' ? (
                <TouchableOpacity
                  style={[styles.actionButton, styles.pauseButton]}
                  onPress={pausePatrol}
                >
                  <Ionicons name="pause" size={20} color="white" />
                  <Text style={styles.actionButtonText}>Pause</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[styles.actionButton, styles.resumeButton]}
                  onPress={resumePatrol}
                >
                  <Ionicons name="play" size={20} color="white" />
                  <Text style={styles.actionButtonText}>Resume</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={[styles.actionButton, styles.endButton]}
                onPress={endPatrol}
              >
                <Ionicons name="stop" size={20} color="white" />
                <Text style={styles.actionButtonText}>End Patrol</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          /* Available Routes */
          <View style={styles.routesSection}>
            <Text style={styles.sectionTitle}>Available Patrol Routes</Text>
            
            {loading ? (
              <View style={styles.loadingCard}>
                <Ionicons name="refresh" size={32} color="#6b7280" />
                <Text style={styles.loadingText}>Loading routes...</Text>
              </View>
            ) : availableRoutes.length > 0 ? (
              availableRoutes.map((route) => (
                <TouchableOpacity
                  key={route.id}
                  style={styles.routeCard}
                  onPress={() => startPatrol(route.id)}
                >
                  <View style={styles.routeHeader}>
                    <Ionicons name="map-outline" size={24} color="#3b82f6" />
                    <View style={styles.routeInfo}>
                      <Text style={styles.routeName}>{route.name}</Text>
                      <Text style={styles.routeDescription}>{route.description}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
                  </View>

                  <View style={styles.routeDetails}>
                    <View style={styles.routeDetail}>
                      <Ionicons name="time-outline" size={16} color="#6b7280" />
                      <Text style={styles.routeDetailText}>
                        Est. {route.estimated_duration}
                      </Text>
                    </View>
                    <View style={styles.routeDetail}>
                      <Ionicons name="location-outline" size={16} color="#6b7280" />
                      <Text style={styles.routeDetailText}>
                        {route.checkpoints.length} checkpoints
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="map-outline" size={64} color="#d1d5db" />
                <Text style={styles.emptyText}>No patrol routes available</Text>
                <Text style={styles.emptySubtext}>
                  Contact your supervisor to assign patrol routes
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Quick Actions */}
        {!currentSession && (
          <View style={styles.quickActions}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            
            <TouchableOpacity
              style={styles.quickActionCard}
              onPress={() => navigation.navigate('IncidentReport')}
            >
              <Ionicons name="warning-outline" size={24} color="#ef4444" />
              <View style={styles.quickActionText}>
                <Text style={styles.quickActionTitle}>Report Incident</Text>
                <Text style={styles.quickActionSubtitle}>Create new incident report</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickActionCard}
              onPress={() => navigation.navigate('PatrolHistory')}
            >
              <Ionicons name="time-outline" size={24} color="#3b82f6" />
              <View style={styles.quickActionText}>
                <Text style={styles.quickActionTitle}>Patrol History</Text>
                <Text style={styles.quickActionSubtitle}>View completed patrols</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
            </TouchableOpacity>
          </View>
        )}

        {/* Bottom spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: '#3b82f6',
    paddingTop: 30,
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
    fontSize: 14,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
  },
  panicButton: {
    backgroundColor: '#ef4444',
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  sessionCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    borderLeftWidth: 4,
    borderLeftColor: '#10b981',
  },
  sessionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  sessionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
  },
  sessionDuration: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  sessionDetails: {
    marginBottom: 16,
  },
  routeName: {
    fontSize: 16,
    color: '#374151',
    marginBottom: 4,
  },
  sessionStatus: {
    fontSize: 14,
    color: '#6b7280',
  },
  sessionActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  checkpointsButton: {
    backgroundColor: '#3b82f6',
  },
  pauseButton: {
    backgroundColor: '#f59e0b',
  },
  resumeButton: {
    backgroundColor: '#10b981',
  },
  endButton: {
    backgroundColor: '#ef4444',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  routesSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  loadingCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 40,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 8,
  },
  loadingSubtext: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 4,
  },
  routeCard: {
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
  routeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  routeInfo: {
    flex: 1,
    marginLeft: 12,
  },
  routeDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  routeDetails: {
    flexDirection: 'row',
    gap: 20,
  },
  routeDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  routeDetailText: {
    fontSize: 12,
    color: '#6b7280',
  },
  emptyState: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 40,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  emptyText: {
    fontSize: 18,
    color: '#9ca3af',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  quickActions: {
    marginBottom: 24,
  },
  quickActionCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  quickActionText: {
    flex: 1,
    marginLeft: 12,
  },
  quickActionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
  },
  quickActionSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  bottomSpacing: {
    height: 100,
  },
});