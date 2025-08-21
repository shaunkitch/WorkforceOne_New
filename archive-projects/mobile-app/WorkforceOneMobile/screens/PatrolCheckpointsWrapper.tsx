import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { patrolService, PatrolRoute } from '../services/PatrolService';
import { supabase } from '../lib/supabase';
import PatrolCheckpointsScreen from './PatrolCheckpointsScreen';

export default function PatrolCheckpointsWrapper({ navigation }: any) {
  const [currentRoute, setCurrentRoute] = useState<PatrolRoute | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCurrentRoute();
  }, []);

  const loadCurrentRoute = async () => {
    try {
      await patrolService.initialize(supabase);
      const session = patrolService.getCurrentSession();
      
      // Load route from available routes based on session route_id
      if (session) {
        const routes = await patrolService.getPatrolRoutes();
        const route = routes.find(r => r.id === session.route_id);
        setCurrentRoute(route || null);
      } else {
        // No active session, show message to start patrol first
        setCurrentRoute(null);
      }
    } catch (error) {
      console.error('Error loading current route:', error);
      Alert.alert('Error', 'Failed to load patrol information.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <StatusBar style="light" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>Loading patrol information...</Text>
        </View>
      </View>
    );
  }

  if (!currentRoute) {
    return (
      <View style={styles.container}>
        <StatusBar style="light" />
        <View style={styles.emptyContainer}>
          <Ionicons name="shield-outline" size={64} color="#6b7280" />
          <Text style={styles.emptyTitle}>No Active Patrol</Text>
          <Text style={styles.emptyText}>
            Start a patrol session from the Security Patrol dashboard to view checkpoints.
          </Text>
          <TouchableOpacity
            style={styles.navigateButton}
            onPress={() => navigation.navigate('PatrolDashboard')}
          >
            <Ionicons name="shield" size={20} color="white" />
            <Text style={styles.navigateButtonText}>Go to Patrol Dashboard</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // If we have a current route, render the PatrolCheckpointsScreen
  return (
    <PatrolCheckpointsScreen 
      route={{ params: { route: currentRoute } }} 
      navigation={navigation} 
    />
  );
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
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 20,
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  navigateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3b82f6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  navigateButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});