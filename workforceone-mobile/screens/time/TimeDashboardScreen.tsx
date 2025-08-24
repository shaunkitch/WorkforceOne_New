import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function TimeDashboardScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="automatic"
      >
        <LinearGradient colors={['#3b82f6', '#60a5fa']} style={styles.header}>
          <Text style={styles.headerTitle}>Time Tracker</Text>
          <Text style={styles.currentTime}>6h 32m</Text>
          <Text style={styles.currentLabel}>Today's Progress</Text>
        </LinearGradient>

        <View style={styles.content}>
          <View style={styles.statsGrid}>
            <View style={[styles.statCard, { backgroundColor: '#3b82f6' }]}>
              <Text style={styles.statValue}>6.5h</Text>
              <Text style={styles.statLabel}>Today</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: '#10b981' }]}>
              <Text style={styles.statValue}>32.5h</Text>
              <Text style={styles.statLabel}>This Week</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: '#f59e0b' }]}>
              <Text style={styles.statValue}>8</Text>
              <Text style={styles.statLabel}>Projects</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: '#8b5cf6' }]}>
              <Text style={styles.statValue}>92%</Text>
              <Text style={styles.statLabel}>Efficiency</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.timerButton}>
            <Text style={styles.timerIcon}>⏱️</Text>
            <Text style={styles.timerText}>Start Timer</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { padding: 32, alignItems: 'center' },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff', marginBottom: 16 },
  currentTime: { fontSize: 48, fontWeight: 'bold', color: '#fff' },
  currentLabel: { fontSize: 16, color: 'rgba(255,255,255,0.8)' },
  content: { padding: 20 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
  statCard: { flex: 1, minWidth: '45%', padding: 16, borderRadius: 12, alignItems: 'center' },
  statValue: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  statLabel: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  timerButton: { backgroundColor: '#3b82f6', borderRadius: 16, padding: 20, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 12 },
  timerIcon: { fontSize: 24 },
  timerText: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
});