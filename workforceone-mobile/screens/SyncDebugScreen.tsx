import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import syncManager, { SyncItem, SyncLog } from '../lib/syncManager';

export default function SyncDebugScreen() {
  const [stats, setStats] = useState<any>(null);
  const [outboxItems, setOutboxItems] = useState<SyncItem[]>([]);
  const [logs, setLogs] = useState<SyncLog[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedLog, setSelectedLog] = useState<SyncLog | null>(null);
  const [showLogModal, setShowLogModal] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [statsData, outboxData, logsData] = await Promise.all([
        syncManager.getStats(),
        syncManager.getOutboxItems(),
        syncManager.getLogs()
      ]);
      
      setStats(statsData);
      setOutboxItems(outboxData);
      setLogs(logsData.slice(0, 50)); // Show only recent 50 logs
    } catch (error) {
      console.error('Failed to load sync data:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleSyncAll = async () => {
    Alert.alert(
      'Sync All Items',
      'This will attempt to sync all pending items. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sync All',
          onPress: async () => {
            try {
              const result = await syncManager.syncAll();
              Alert.alert(
                'Sync Complete',
                `Synced ${result.success}/${result.total} items successfully. ${result.failed} failed.`
              );
              await loadData();
            } catch (error) {
              Alert.alert('Sync Error', 'Failed to sync items');
            }
          }
        }
      ]
    );
  };

  const handleClearLogs = async () => {
    Alert.alert(
      'Clear Debug Logs',
      'This will clear all debug logs. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          onPress: async () => {
            await syncManager.clearLogs();
            await loadData();
          }
        }
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return '#10b981';
      case 'pending': return '#f59e0b';
      case 'syncing': return '#3b82f6';
      case 'failed': return '#ef4444';
      case 'error': return '#ef4444';
      case 'warning': return '#f59e0b';
      case 'info': return '#6b7280';
      default: return '#6b7280';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return '✅';
      case 'pending': return '⏳';
      case 'syncing': return '🔄';
      case 'failed': return '❌';
      case 'error': return '🚨';
      case 'warning': return '⚠️';
      case 'info': return 'ℹ️';
      default: return '📄';
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        <LinearGradient colors={['#6366f1', '#8b5cf6']} style={styles.header}>
          <Text style={styles.headerTitle}>Sync & Debug</Text>
          <Text style={styles.headerSubtitle}>Monitor data synchronization</Text>
        </LinearGradient>

        <View style={styles.content}>
          {/* Stats Overview */}
          {stats && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Sync Status Overview</Text>
              <View style={styles.statsGrid}>
                <View style={[styles.statCard, { backgroundColor: '#3b82f6' }]}>
                  <Text style={styles.statValue}>{stats.outbox.total}</Text>
                  <Text style={styles.statLabel}>Total Items</Text>
                </View>
                <View style={[styles.statCard, { backgroundColor: '#f59e0b' }]}>
                  <Text style={styles.statValue}>{stats.outbox.pending}</Text>
                  <Text style={styles.statLabel}>Pending</Text>
                </View>
                <View style={[styles.statCard, { backgroundColor: '#10b981' }]}>
                  <Text style={styles.statValue}>{stats.outbox.success}</Text>
                  <Text style={styles.statLabel}>Success</Text>
                </View>
                <View style={[styles.statCard, { backgroundColor: '#ef4444' }]}>
                  <Text style={styles.statValue}>{stats.outbox.failed}</Text>
                  <Text style={styles.statLabel}>Failed</Text>
                </View>
              </View>
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Actions</Text>
            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.actionButton} onPress={handleSyncAll}>
                <Text style={styles.actionButtonText}>🔄 Sync All</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton} onPress={onRefresh}>
                <Text style={styles.actionButtonText}>🔄 Refresh</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton} onPress={handleClearLogs}>
                <Text style={styles.actionButtonText}>🗑️ Clear Logs</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Outbox Items */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Outbox Items ({outboxItems.length})</Text>
            {outboxItems.length > 0 ? (
              outboxItems.map((item) => (
                <View key={item.id} style={styles.outboxItem}>
                  <View style={styles.outboxItemHeader}>
                    <Text style={styles.outboxItemType}>{item.type.toUpperCase()}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
                      <Text style={styles.statusBadgeText}>{getStatusIcon(item.status)} {item.status}</Text>
                    </View>
                  </View>
                  <Text style={styles.outboxItemTitle} numberOfLines={2}>
                    {item.data.title || item.data.siteName || 'Untitled'}
                  </Text>
                  <View style={styles.outboxItemDetails}>
                    <Text style={styles.outboxItemDetail}>Created: {formatTime(item.createdAt)}</Text>
                    <Text style={styles.outboxItemDetail}>Attempts: {item.attempts}</Text>
                    {item.lastAttempt && (
                      <Text style={styles.outboxItemDetail}>Last: {formatTime(item.lastAttempt)}</Text>
                    )}
                  </View>
                  {item.error && (
                    <Text style={styles.errorText} numberOfLines={2}>{item.error}</Text>
                  )}
                </View>
              ))
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>📭 No items in outbox</Text>
              </View>
            )}
          </View>

          {/* Recent Logs */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Debug Logs (Recent 20)</Text>
            {logs.slice(0, 20).map((log) => (
              <TouchableOpacity
                key={log.id}
                style={styles.logItem}
                onPress={() => {
                  setSelectedLog(log);
                  setShowLogModal(true);
                }}
              >
                <View style={styles.logItemHeader}>
                  <Text style={[styles.logStatus, { color: getStatusColor(log.status) }]}>
                    {getStatusIcon(log.status)}
                  </Text>
                  <Text style={styles.logAction}>{log.action}</Text>
                  <Text style={styles.logTime}>{formatTime(log.timestamp)}</Text>
                </View>
                <Text style={styles.logMessage} numberOfLines={2}>{log.message}</Text>
              </TouchableOpacity>
            ))}
            {logs.length === 0 && (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>📋 No debug logs</Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Log Detail Modal */}
      <Modal
        visible={showLogModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowLogModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Debug Log Details</Text>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowLogModal(false)}
            >
              <Text style={styles.modalCloseText}>✕</Text>
            </TouchableOpacity>
          </View>
          
          {selectedLog && (
            <ScrollView style={styles.modalContent}>
              <View style={styles.logDetailItem}>
                <Text style={styles.logDetailLabel}>Status:</Text>
                <Text style={[styles.logDetailValue, { color: getStatusColor(selectedLog.status) }]}>
                  {getStatusIcon(selectedLog.status)} {selectedLog.status}
                </Text>
              </View>
              
              <View style={styles.logDetailItem}>
                <Text style={styles.logDetailLabel}>Action:</Text>
                <Text style={styles.logDetailValue}>{selectedLog.action}</Text>
              </View>
              
              <View style={styles.logDetailItem}>
                <Text style={styles.logDetailLabel}>Timestamp:</Text>
                <Text style={styles.logDetailValue}>
                  {formatDate(selectedLog.timestamp)} {formatTime(selectedLog.timestamp)}
                </Text>
              </View>
              
              <View style={styles.logDetailItem}>
                <Text style={styles.logDetailLabel}>Message:</Text>
                <Text style={styles.logDetailValue}>{selectedLog.message}</Text>
              </View>
              
              {selectedLog.details && (
                <View style={styles.logDetailItem}>
                  <Text style={styles.logDetailLabel}>Details:</Text>
                  <ScrollView style={styles.detailsContainer} horizontal>
                    <Text style={styles.detailsText}>{selectedLog.details}</Text>
                  </ScrollView>
                </View>
              )}
            </ScrollView>
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { padding: 32, alignItems: 'center' },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff', marginBottom: 8 },
  headerSubtitle: { fontSize: 16, color: 'rgba(255,255,255,0.8)' },
  content: { padding: 20 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#1f2937', marginBottom: 12 },
  
  // Stats
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  statCard: { flex: 1, minWidth: '22%', padding: 12, borderRadius: 8, alignItems: 'center' },
  statValue: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  statLabel: { fontSize: 10, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  
  // Action buttons
  buttonRow: { flexDirection: 'row', gap: 12 },
  actionButton: { flex: 1, backgroundColor: '#3b82f6', padding: 12, borderRadius: 8, alignItems: 'center' },
  actionButtonText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  
  // Outbox items
  outboxItem: { backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 8, borderWidth: 1, borderColor: '#e5e7eb' },
  outboxItemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  outboxItemType: { fontSize: 12, fontWeight: '600', color: '#6b7280' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  statusBadgeText: { fontSize: 10, color: '#fff', fontWeight: '600' },
  outboxItemTitle: { fontSize: 14, fontWeight: '600', color: '#1f2937', marginBottom: 8 },
  outboxItemDetails: { flexDirection: 'row', gap: 12 },
  outboxItemDetail: { fontSize: 11, color: '#6b7280' },
  errorText: { fontSize: 11, color: '#ef4444', marginTop: 4, fontStyle: 'italic' },
  
  // Logs
  logItem: { backgroundColor: '#fff', padding: 12, borderRadius: 8, marginBottom: 4, borderWidth: 1, borderColor: '#e5e7eb' },
  logItemHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  logStatus: { fontSize: 14, fontWeight: 'bold' },
  logAction: { fontSize: 12, fontWeight: '600', color: '#6b7280', flex: 1 },
  logTime: { fontSize: 10, color: '#9ca3af' },
  logMessage: { fontSize: 12, color: '#1f2937' },
  
  // Empty states
  emptyState: { padding: 32, alignItems: 'center' },
  emptyStateText: { fontSize: 14, color: '#6b7280', textAlign: 'center' },
  
  // Modal
  modalContainer: { flex: 1, backgroundColor: '#fff' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#e5e7eb' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: '#1f2937' },
  modalCloseButton: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#f3f4f6', alignItems: 'center', justifyContent: 'center' },
  modalCloseText: { fontSize: 16, color: '#6b7280' },
  modalContent: { flex: 1, padding: 20 },
  logDetailItem: { marginBottom: 16 },
  logDetailLabel: { fontSize: 12, fontWeight: '600', color: '#6b7280', marginBottom: 4 },
  logDetailValue: { fontSize: 14, color: '#1f2937' },
  detailsContainer: { backgroundColor: '#f8fafc', padding: 12, borderRadius: 8, maxHeight: 200 },
  detailsText: { fontSize: 11, fontFamily: 'monospace', color: '#374151' },
});