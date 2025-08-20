import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { GuardStackParamList } from '../../navigation/DashboardNavigator';

type NavigationProp = StackNavigationProp<GuardStackParamList, 'GuardDashboard'>;

export default function GuardDashboardScreen() {
  const navigation = useNavigation<NavigationProp>();
  
  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <LinearGradient colors={['#7c3aed', '#a855f7']} style={styles.header}>
          <Text style={styles.headerTitle}>Security Operations</Text>
          <Text style={styles.headerSubtitle}>Guard Management System</Text>
        </LinearGradient>

        <View style={styles.content}>
          <View style={styles.statsGrid}>
            <View style={[styles.statCard, { backgroundColor: '#7c3aed' }]}>
              <Text style={styles.statValue}>24</Text>
              <Text style={styles.statLabel}>Active Guards</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: '#10b981' }]}>
              <Text style={styles.statValue}>8</Text>
              <Text style={styles.statLabel}>Sites</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: '#f59e0b' }]}>
              <Text style={styles.statValue}>3</Text>
              <Text style={styles.statLabel}>Incidents</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: '#3b82f6' }]}>
              <Text style={styles.statValue}>96%</Text>
              <Text style={styles.statLabel}>Coverage</Text>
            </View>
          </View>

          <View style={styles.quickActions}>
            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: '#7c3aed' }]}
              onPress={() => navigation.navigate('GuardCheckIn')}
            >
              <Text style={styles.actionIcon}>📱</Text>
              <Text style={styles.actionText}>QR Check-In</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: '#ef4444' }]}
              onPress={() => navigation.navigate('IncidentReport')}
            >
              <Text style={styles.actionIcon}>🚨</Text>
              <Text style={styles.actionText}>Report Incident</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { padding: 32, alignItems: 'center' },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff', marginBottom: 8 },
  headerSubtitle: { fontSize: 16, color: 'rgba(255,255,255,0.8)' },
  content: { padding: 20 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
  statCard: { flex: 1, minWidth: '45%', padding: 16, borderRadius: 12, alignItems: 'center' },
  statValue: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  statLabel: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  quickActions: { gap: 12 },
  actionButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 20, borderRadius: 12, gap: 12 },
  actionIcon: { fontSize: 24 },
  actionText: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
});