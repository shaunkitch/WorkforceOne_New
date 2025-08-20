import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';

export default function SitesScreen() {
  const sites = [
    { name: 'Downtown Office', guards: 4, status: 'Active', coverage: 100 },
    { name: 'Warehouse District', guards: 2, status: 'Active', coverage: 85 },
    { name: 'Retail Plaza', guards: 1, status: 'Maintenance', coverage: 50 },
    { name: 'Corporate HQ', guards: 6, status: 'Active', coverage: 100 },
  ];

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Security Sites</Text>
          <TouchableOpacity style={styles.addButton}>
            <Text style={styles.addButtonText}>+ Add Site</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.sitesContainer}>
          {sites.map((site, index) => (
            <TouchableOpacity key={index} style={styles.siteCard}>
              <View style={styles.siteHeader}>
                <Text style={styles.siteName}>{site.name}</Text>
                <View style={[
                  styles.statusBadge,
                  { backgroundColor: site.status === 'Active' ? '#10b981' : '#f59e0b' }
                ]}>
                  <Text style={styles.statusText}>{site.status}</Text>
                </View>
              </View>
              
              <View style={styles.siteStats}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{site.guards}</Text>
                  <Text style={styles.statLabel}>Guards</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{site.coverage}%</Text>
                  <Text style={styles.statLabel}>Coverage</Text>
                </View>
              </View>
              
              <View style={styles.siteActions}>
                <TouchableOpacity style={styles.actionBtn}>
                  <Text style={styles.actionBtnText}>👁️ View</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionBtn}>
                  <Text style={styles.actionBtnText}>📍 Map</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.actionBtn}>
                  <Text style={styles.actionBtnText}>🛡️ Guards</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#1f2937' },
  addButton: { backgroundColor: '#7c3aed', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  addButtonText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  sitesContainer: { padding: 20, gap: 16 },
  siteCard: { backgroundColor: '#fff', borderRadius: 16, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 },
  siteHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  siteName: { fontSize: 18, fontWeight: 'bold', color: '#1f2937', flex: 1 },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  statusText: { fontSize: 12, color: '#fff', fontWeight: '600' },
  siteStats: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 16 },
  statItem: { alignItems: 'center' },
  statValue: { fontSize: 24, fontWeight: 'bold', color: '#7c3aed' },
  statLabel: { fontSize: 12, color: '#6b7280', marginTop: 4 },
  siteActions: { flexDirection: 'row', gap: 8 },
  actionBtn: { flex: 1, backgroundColor: '#f3f4f6', borderRadius: 8, paddingVertical: 10, alignItems: 'center' },
  actionBtnText: { fontSize: 12, color: '#4b5563', fontWeight: '600' },
});