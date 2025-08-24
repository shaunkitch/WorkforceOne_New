import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { GuardStackParamList } from '../../navigation/DashboardNavigator';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { supabase } from '../../lib/supabase';
import { syncManager } from '../../lib/syncManager';

type NavigationProp = StackNavigationProp<GuardStackParamList, 'PatrolSession'>;

interface PatrolSession {
  id: string;
  guard_id: string;
  guard_name: string;
  start_time: string;
  status: 'active' | 'paused' | 'completed';
  current_latitude?: number;
  current_longitude?: number;
  route_name?: string;
  checkpoints_completed: number;
  incidents_reported: number;
  distance_covered: number; // in meters
}

// Generate UUID v4
const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

export default function PatrolSessionScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [activePatrol, setActivePatrol] = useState<PatrolSession | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    loadActivePatrol();
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const loadActivePatrol = async () => {
    try {
      const patrol = await AsyncStorage.getItem('activePatrol');
      if (patrol) {
        setActivePatrol(JSON.parse(patrol));
      }
    } catch (error) {
      console.error('Failed to load active patrol:', error);
    }
  };

  const startPatrol = async () => {
    setLoading(true);
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) {
        Alert.alert('Error', 'Please log in to start patrol');
        return;
      }

      // Get current location
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Error', 'Location access required to start patrol');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});

      const newPatrol: PatrolSession = {
        id: generateUUID(),
        guard_id: user.user.id,
        guard_name: user.user.email?.split('@')[0] || 'Guard',
        start_time: new Date().toISOString(),
        status: 'active',
        current_latitude: location.coords.latitude,
        current_longitude: location.coords.longitude,
        route_name: 'Standard Patrol Route',
        checkpoints_completed: 0,
        incidents_reported: 0,
        distance_covered: 0
      };

      // Save to local storage
      await AsyncStorage.setItem('activePatrol', JSON.stringify(newPatrol));
      
      // Sync to database
      await syncManager.syncData('patrol_sessions', {
        id: newPatrol.id,
        guard_id: newPatrol.guard_id,
        organization_id: 'default-org',
        route_id: 'default-route',
        start_time: newPatrol.start_time,
        status: newPatrol.status,
        current_latitude: newPatrol.current_latitude,
        current_longitude: newPatrol.current_longitude,
        device_info: { platform: 'mobile', patrol_version: '1.0' }
      });

      setActivePatrol(newPatrol);
      Alert.alert(
        'Patrol Started', 
        'Your patrol session has been started successfully. Stay safe!',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Failed to start patrol:', error);
      Alert.alert('Error', 'Failed to start patrol. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const pausePatrol = async () => {
    if (!activePatrol) return;

    const updatedPatrol = { ...activePatrol, status: 'paused' as const };
    setActivePatrol(updatedPatrol);
    await AsyncStorage.setItem('activePatrol', JSON.stringify(updatedPatrol));
    
    Alert.alert('Patrol Paused', 'Your patrol has been paused. Tap Resume to continue.');
  };

  const resumePatrol = async () => {
    if (!activePatrol) return;

    const updatedPatrol = { ...activePatrol, status: 'active' as const };
    setActivePatrol(updatedPatrol);
    await AsyncStorage.setItem('activePatrol', JSON.stringify(updatedPatrol));
    
    Alert.alert('Patrol Resumed', 'Your patrol has been resumed.');
  };

  const endPatrol = async () => {
    if (!activePatrol) return;

    Alert.alert(
      'End Patrol',
      'Are you sure you want to end your patrol session?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'End Patrol',
          style: 'destructive',
          onPress: async () => {
            const updatedPatrol = { ...activePatrol, status: 'completed' as const };
            
            // Update database
            await syncManager.syncData('patrol_sessions', {
              id: activePatrol.id,
              status: 'completed',
              end_time: new Date().toISOString()
            });

            // Clear from local storage
            await AsyncStorage.removeItem('activePatrol');
            setActivePatrol(null);
            
            Alert.alert('Patrol Ended', 'Your patrol session has been completed successfully.');
            navigation.goBack();
          }
        }
      ]
    );
  };

  const handleReportIncident = () => {
    if (!activePatrol) {
      Alert.alert('No Active Patrol', 'You must have an active patrol to report incidents.');
      return;
    }
    
    navigation.navigate('IncidentReport', { fromPatrol: true });
  };

  const handleCheckpoint = async () => {
    if (!activePatrol) return;

    const updatedPatrol = { 
      ...activePatrol, 
      checkpoints_completed: activePatrol.checkpoints_completed + 1 
    };
    setActivePatrol(updatedPatrol);
    await AsyncStorage.setItem('activePatrol', JSON.stringify(updatedPatrol));

    Alert.alert(
      'Checkpoint Completed',
      `Checkpoint ${updatedPatrol.checkpoints_completed} has been logged.`
    );
  };

  const formatDuration = (startTime: string) => {
    const start = new Date(startTime);
    const now = currentTime;
    const diff = now.getTime() - start.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <LinearGradient colors={['#7c3aed', '#a855f7']} style={styles.header}>
          <Text style={styles.headerTitle}>Patrol Session</Text>
          <Text style={styles.headerSubtitle}>
            {activePatrol ? 'Active Patrol' : 'No Active Patrol'}
          </Text>
        </LinearGradient>

        <View style={styles.content}>
          {activePatrol ? (
            <>
              {/* Active Patrol Status */}
              <View style={styles.statusCard}>
                <View style={styles.statusHeader}>
                  <Text style={styles.statusTitle}>Current Patrol</Text>
                  <View style={[
                    styles.statusIndicator,
                    { backgroundColor: activePatrol.status === 'active' ? '#10b981' : '#f59e0b' }
                  ]} />
                </View>
                
                <Text style={styles.patrolRoute}>{activePatrol.route_name}</Text>
                <Text style={styles.guardName}>Guard: {activePatrol.guard_name}</Text>
                <Text style={styles.duration}>
                  Duration: {formatDuration(activePatrol.start_time)}
                </Text>
                <Text style={styles.status}>
                  Status: {activePatrol.status.toUpperCase()}
                </Text>
              </View>

              {/* Patrol Statistics */}
              <View style={styles.statsGrid}>
                <View style={[styles.statCard, { backgroundColor: '#3b82f6' }]}>
                  <Text style={styles.statValue}>{activePatrol.checkpoints_completed}</Text>
                  <Text style={styles.statLabel}>Checkpoints</Text>
                </View>
                <View style={[styles.statCard, { backgroundColor: '#f59e0b' }]}>
                  <Text style={styles.statValue}>{activePatrol.incidents_reported}</Text>
                  <Text style={styles.statLabel}>Incidents</Text>
                </View>
                <View style={[styles.statCard, { backgroundColor: '#10b981' }]}>
                  <Text style={styles.statValue}>{(activePatrol.distance_covered / 1000).toFixed(1)}km</Text>
                  <Text style={styles.statLabel}>Distance</Text>
                </View>
              </View>

              {/* Patrol Actions */}
              <View style={styles.actionsSection}>
                <Text style={styles.sectionTitle}>Patrol Actions</Text>
                
                <TouchableOpacity 
                  style={[styles.actionButton, { backgroundColor: '#ef4444' }]}
                  onPress={handleReportIncident}
                >
                  <Text style={styles.actionIcon}>🚨</Text>
                  <Text style={styles.actionText}>Report Incident</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.actionButton, { backgroundColor: '#3b82f6' }]}
                  onPress={handleCheckpoint}
                >
                  <Text style={styles.actionIcon}>📍</Text>
                  <Text style={styles.actionText}>Complete Checkpoint</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.actionButton, { backgroundColor: '#6b7280' }]}
                  onPress={() => navigation.navigate('GuardCheckIn')}
                >
                  <Text style={styles.actionIcon}>📱</Text>
                  <Text style={styles.actionText}>QR Check-In</Text>
                </TouchableOpacity>
              </View>

              {/* Patrol Control */}
              <View style={styles.controlSection}>
                <Text style={styles.sectionTitle}>Patrol Control</Text>
                
                <View style={styles.controlButtons}>
                  {activePatrol.status === 'active' ? (
                    <TouchableOpacity 
                      style={[styles.controlButton, { backgroundColor: '#f59e0b' }]}
                      onPress={pausePatrol}
                    >
                      <Text style={styles.controlButtonText}>⏸️ Pause Patrol</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity 
                      style={[styles.controlButton, { backgroundColor: '#10b981' }]}
                      onPress={resumePatrol}
                    >
                      <Text style={styles.controlButtonText}>▶️ Resume Patrol</Text>
                    </TouchableOpacity>
                  )}
                  
                  <TouchableOpacity 
                    style={[styles.controlButton, { backgroundColor: '#ef4444' }]}
                    onPress={endPatrol}
                  >
                    <Text style={styles.controlButtonText}>⏹️ End Patrol</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </>
          ) : (
            <>
              {/* No Active Patrol */}
              <View style={styles.noPatrolCard}>
                <Text style={styles.noPatrolTitle}>No Active Patrol</Text>
                <Text style={styles.noPatrolText}>
                  Start a patrol session to begin monitoring your route and reporting incidents.
                </Text>
                
                <TouchableOpacity 
                  style={styles.startPatrolButton}
                  onPress={startPatrol}
                  disabled={loading}
                >
                  <LinearGradient
                    colors={['#7c3aed', '#a855f7']}
                    style={styles.startPatrolGradient}
                  >
                    <Text style={styles.startPatrolIcon}>🚁</Text>
                    <Text style={styles.startPatrolText}>Start Patrol</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { padding: 32, alignItems: 'center' },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff', marginBottom: 8 },
  headerSubtitle: { fontSize: 16, color: 'rgba(255,255,255,0.8)' },
  content: { padding: 20 },
  
  // Status Card
  statusCard: {
    backgroundColor: '#ffffff',
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusTitle: { fontSize: 18, fontWeight: 'bold', color: '#1f2937' },
  statusIndicator: { width: 12, height: 12, borderRadius: 6 },
  patrolRoute: { fontSize: 20, fontWeight: 'bold', color: '#7c3aed', marginBottom: 8 },
  guardName: { fontSize: 14, color: '#6b7280', marginBottom: 4 },
  duration: { fontSize: 16, fontWeight: '600', color: '#1f2937', marginBottom: 4 },
  status: { fontSize: 14, color: '#6b7280' },

  // Stats Grid
  statsGrid: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  statCard: { flex: 1, padding: 16, borderRadius: 12, alignItems: 'center' },
  statValue: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  statLabel: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 4 },

  // Actions Section
  actionsSection: { marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#1f2937', marginBottom: 16 },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    gap: 12
  },
  actionIcon: { fontSize: 24 },
  actionText: { fontSize: 16, fontWeight: 'bold', color: '#fff' },

  // Control Section
  controlSection: { marginBottom: 24 },
  controlButtons: { gap: 12 },
  controlButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  controlButtonText: { fontSize: 16, fontWeight: 'bold', color: '#fff' },

  // No Patrol Card
  noPatrolCard: {
    backgroundColor: '#ffffff',
    padding: 32,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  noPatrolTitle: { fontSize: 20, fontWeight: 'bold', color: '#1f2937', marginBottom: 12 },
  noPatrolText: { fontSize: 16, color: '#6b7280', textAlign: 'center', marginBottom: 24, lineHeight: 22 },
  
  startPatrolButton: { borderRadius: 16, overflow: 'hidden' },
  startPatrolGradient: {
    padding: 20,
    alignItems: 'center',
    flexDirection: 'row',
    gap: 12
  },
  startPatrolIcon: { fontSize: 24 },
  startPatrolText: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
});