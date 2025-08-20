import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';

export default function TimesheetScreen() {
  const entries = [
    { project: 'Website Redesign', task: 'Frontend Dev', duration: '2h 30m', date: 'Today' },
    { project: 'Mobile App', task: 'API Integration', duration: '3h 15m', date: 'Today' },
    { project: 'Database Migration', task: 'Schema Design', duration: '1h 45m', date: 'Yesterday' },
  ];

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Timesheet</Text>
          <Text style={styles.totalTime}>7h 45m today</Text>
        </View>

        <View style={styles.entriesContainer}>
          {entries.map((entry, index) => (
            <TouchableOpacity key={index} style={styles.entryCard}>
              <View style={styles.entryHeader}>
                <Text style={styles.entryProject}>{entry.project}</Text>
                <Text style={styles.entryDuration}>{entry.duration}</Text>
              </View>
              <Text style={styles.entryTask}>{entry.task}</Text>
              <Text style={styles.entryDate}>{entry.date}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.addButton}>
          <Text style={styles.addButtonText}>+ Add Manual Entry</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { padding: 20, backgroundColor: '#3b82f6', alignItems: 'center' },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff', marginBottom: 8 },
  totalTime: { fontSize: 18, color: 'rgba(255,255,255,0.9)' },
  entriesContainer: { padding: 20, gap: 12 },
  entryCard: { backgroundColor: '#fff', padding: 16, borderRadius: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  entryHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  entryProject: { fontSize: 16, fontWeight: 'bold', color: '#1f2937' },
  entryDuration: { fontSize: 16, fontWeight: 'bold', color: '#3b82f6' },
  entryTask: { fontSize: 14, color: '#6b7280', marginBottom: 4 },
  entryDate: { fontSize: 12, color: '#9ca3af' },
  addButton: { margin: 20, backgroundColor: '#3b82f6', padding: 16, borderRadius: 12, alignItems: 'center' },
  addButtonText: { fontSize: 16, fontWeight: 'bold', color: '#fff' },
});