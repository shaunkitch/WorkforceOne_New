import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, RefreshControl } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { GuardStackParamList } from '../../navigation/DashboardNavigator';
import AsyncStorage from '@react-native-async-storage/async-storage';

type NavigationProp = StackNavigationProp<GuardStackParamList, 'GuardDashboard'>;

export default function GuardDashboardScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [refreshing, setRefreshing] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<string>('Off Duty');
  
  useEffect(() => {
    loadDashboardData();
    loadCurrentStatus();
  }, []);


  const loadDashboardData = async () => {
    try {
      console.log('🔄 Loading guard dashboard...');
      // Dashboard data loading logic here if needed
    } catch (error) {
      console.error('❌ Failed to load dashboard:', error);
    }
  };

  const loadCurrentStatus = async () => {
    try {
      const currentCheckIn = await AsyncStorage.getItem('currentCheckIn');
      const activePatrol = await AsyncStorage.getItem('activePatrol');
      
      if (activePatrol) {
        setCurrentStatus('On Patrol');
      } else if (currentCheckIn) {
        const checkIn = JSON.parse(currentCheckIn);
        setCurrentStatus(`Checked in at ${checkIn.siteName}`);
      } else {
        setCurrentStatus('Off Duty');
      }
    } catch (error) {
      console.error('Failed to load status:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    await loadCurrentStatus();
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        <LinearGradient colors={['#7c3aed', '#a855f7']} style={styles.header}>
          <Text style={styles.headerTitle}>Security Operations</Text>
          <Text style={styles.headerSubtitle}>{currentStatus}</Text>
        </LinearGradient>

        <View style={styles.content}>
          <View style={styles.actionsGrid}>
            {/* Row 1 */}
            <TouchableOpacity 
              style={[styles.actionButton, styles.checkInButton]}
              onPress={() => navigation.navigate('GuardCheckIn')}
            >
              <View style={styles.buttonContent}>
                <View style={styles.iconContainer}>
                  <Text style={styles.actionIcon}>📱</Text>
                </View>
                <Text style={styles.actionText}>Check In</Text>
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.actionButton, styles.patrolButton]}
              onPress={() => navigation.navigate('PatrolSession')}
            >
              <View style={styles.buttonContent}>
                <View style={styles.iconContainer}>
                  <Text style={styles.actionIcon}>🚶‍♂️</Text>
                </View>
                <Text style={styles.actionText}>Start Patrol</Text>
              </View>
            </TouchableOpacity>
            
            {/* Row 2 */}
            <TouchableOpacity 
              style={[styles.actionButton, styles.incidentButton]}
              onPress={() => navigation.navigate('IncidentReport', {})}
            >
              <View style={styles.buttonContent}>
                <View style={styles.iconContainer}>
                  <Text style={styles.actionIcon}>🚨</Text>
                </View>
                <Text style={styles.actionText}>Report Incident</Text>
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.actionButton, styles.backupButton]}
              onPress={() => {/* TODO: Add backup request functionality */}}
            >
              <View style={styles.buttonContent}>
                <View style={styles.iconContainer}>
                  <Text style={styles.actionIcon}>🆘</Text>
                </View>
                <Text style={styles.actionText}>Request Backup</Text>
              </View>
            </TouchableOpacity>
            
            {/* Row 3 */}
            <TouchableOpacity 
              style={[styles.actionButton, styles.reportButton]}
              onPress={() => {/* TODO: Add daily report functionality */}}
            >
              <View style={styles.buttonContent}>
                <View style={styles.iconContainer}>
                  <Text style={styles.actionIcon}>📋</Text>
                </View>
                <Text style={styles.actionText}>Daily Report</Text>
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.actionButton, styles.kpiButton]}
              onPress={() => navigation.navigate('GuardKPI')}
            >
              <View style={styles.buttonContent}>
                <View style={styles.iconContainer}>
                  <Text style={styles.actionIcon}>📊</Text>
                </View>
                <Text style={styles.actionText}>My KPIs</Text>
              </View>
            </TouchableOpacity>
          </View>
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
  content: { 
    padding: 24, 
    flex: 1, 
    justifyContent: 'center'
  },
  actionsGrid: { 
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    justifyContent: 'space-between'
  },
  actionButton: { 
    width: '47%',
    aspectRatio: 1.1,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    padding: 16
  },
  buttonContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    backgroundColor: 'rgba(0,0,0,0.02)'
  },
  actionIcon: { 
    fontSize: 28,
    textAlign: 'center'
  },
  actionText: { 
    fontSize: 14, 
    fontWeight: '600', 
    textAlign: 'center',
    color: '#374151',
    lineHeight: 18,
    marginTop: 4
  },
  checkInButton: {
    borderLeftWidth: 4,
    borderLeftColor: '#7c3aed'
  },
  patrolButton: {
    borderLeftWidth: 4,
    borderLeftColor: '#10b981'
  },
  incidentButton: {
    borderLeftWidth: 4,
    borderLeftColor: '#ef4444'
  },
  backupButton: {
    borderLeftWidth: 4,
    borderLeftColor: '#f59e0b'
  },
  reportButton: {
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6'
  },
  kpiButton: {
    borderLeftWidth: 4,
    borderLeftColor: '#8b5cf6'
  },
});