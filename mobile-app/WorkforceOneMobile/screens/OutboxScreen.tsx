import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  StyleSheet,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { offlineStorage, OfflineAction } from '../services/OfflineStorage';
import { syncService } from '../services/SyncService';

interface OutboxScreenProps {
  navigation: any;
}

interface StorageStats {
  outboxCount: number;
  formsCount: number;
  responsesCount: number;
  lastSync: string | null;
}

export default function OutboxScreen({ navigation }: OutboxScreenProps) {
  const [outboxItems, setOutboxItems] = useState<OfflineAction[]>([]);
  const [storageStats, setStorageStats] = useState<StorageStats>({
    outboxCount: 0,
    formsCount: 0,
    responsesCount: 0,
    lastSync: null,
  });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState({ isOnline: false, isSyncing: false });

  useEffect(() => {
    loadData();
    const interval = setInterval(() => {
      setSyncStatus(syncService.getSyncStatus());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      const [outbox, stats] = await Promise.all([
        offlineStorage.getOutbox(),
        offlineStorage.getStorageStats(),
      ]);
      
      setOutboxItems(outbox.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
      setStorageStats(stats);
      setSyncStatus(syncService.getSyncStatus());
    } catch (error) {
      console.error('Error loading outbox data:', error);
    }
  };

  const onRefresh = async () => {
    setIsRefreshing(true);
    await loadData();
    setIsRefreshing(false);
  };

  const handleManualSync = async () => {
    if (!syncStatus.isOnline) {
      Alert.alert('Offline', 'Cannot sync while offline. Please check your internet connection.');
      return;
    }

    setIsSyncing(true);
    try {
      const success = await syncService.forcSync();
      if (success) {
        Alert.alert('Sync Complete', 'All pending items have been synchronized.');
      } else {
        Alert.alert('Sync Issues', 'Some items could not be synchronized. Please try again later.');
      }
      await loadData();
    } catch (error) {
      Alert.alert('Sync Error', 'Failed to sync data. Please try again.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleClearCompleted = async () => {
    Alert.alert(
      'Clear Completed Items',
      'This will remove all successfully synced items from your outbox. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              await offlineStorage.clearCompletedActions();
              await loadData();
              Alert.alert('Success', 'Completed items have been cleared.');
            } catch (error) {
              Alert.alert('Error', 'Failed to clear completed items.');
            }
          },
        },
      ]
    );
  };

  const handleClearFailed = async () => {
    const failedCount = outboxItems.filter(item => item.status === 'failed').length;
    
    if (failedCount === 0) {
      Alert.alert('No Failed Items', 'There are no failed items to clear.');
      return;
    }

    Alert.alert(
      'Clear Failed Items',
      `This will remove ${failedCount} failed sync items from your outbox. These items will be permanently lost. Are you sure?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear Failed',
          style: 'destructive',
          onPress: async () => {
            try {
              await offlineStorage.clearFailedActions();
              await loadData();
              Alert.alert('Success', `${failedCount} failed items have been cleared.`);
            } catch (error) {
              console.error('Error clearing failed items:', error);
              Alert.alert('Error', 'Failed to clear failed items.');
            }
          },
        },
      ]
    );
  };

  const handleViewItemDetails = (item: OfflineAction) => {
    const details = JSON.stringify(item.data, null, 2);
    Alert.alert(
      `Action Details: ${item.id}`,
      `Type: ${item.type}\nStatus: ${item.status}\nRetries: ${item.retryCount}\nTimestamp: ${new Date(item.timestamp).toLocaleString()}\n\nData:\n${details.substring(0, 500)}${details.length > 500 ? '...' : ''}`,
      [{ text: 'OK' }]
    );
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Ionicons name="time-outline" size={20} color="#FFA500" />;
      case 'syncing':
        return <Ionicons name="sync-outline" size={20} color="#007AFF" />;
      case 'completed':
        return <Ionicons name="checkmark-circle-outline" size={20} color="#34C759" />;
      case 'failed':
        return <Ionicons name="close-circle-outline" size={20} color="#FF3B30" />;
      default:
        return <Ionicons name="help-circle-outline" size={20} color="#8E8E93" />;
    }
  };

  const getActionTypeLabel = (type: string) => {
    switch (type) {
      case 'form_response':
        return 'Form Response';
      case 'attendance':
        return 'Attendance';
      case 'outlet_visit':
        return 'Outlet Visit';
      case 'leave_request':
        return 'Leave Request';
      case 'check_in':
        return 'Check In';
      case 'check_out':
        return 'Check Out';
      default:
        return type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
  };

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const renderOutboxItem = ({ item }: { item: OfflineAction }) => (
    <TouchableOpacity 
      style={styles.itemContainer} 
      onPress={() => handleViewItemDetails(item)}
      activeOpacity={0.7}
    >
      <View style={styles.itemHeader}>
        <View style={styles.itemHeaderLeft}>
          {getStatusIcon(item.status)}
          <Text style={styles.itemType}>{getActionTypeLabel(item.type)}</Text>
        </View>
        <Text style={styles.itemTimestamp}>{formatDate(item.timestamp)}</Text>
      </View>
      
      <Text style={styles.itemStatus}>
        Status: <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
          {item.status.toUpperCase()}
        </Text>
      </Text>
      
      {item.retryCount > 0 && (
        <Text style={styles.retryCount}>Retry attempts: {item.retryCount}</Text>
      )}
      
      <View style={styles.itemFooter}>
        <Text style={styles.itemId}>ID: {item.id}</Text>
        <Text style={styles.tapHint}>Tap for details</Text>
      </View>
    </TouchableOpacity>
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return '#FFA500';
      case 'syncing':
        return '#007AFF';
      case 'completed':
        return '#34C759';
      case 'failed':
        return '#FF3B30';
      default:
        return '#8E8E93';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Sync Outbox</Text>
        <TouchableOpacity
          onPress={onRefresh}
          style={styles.refreshButton}
          disabled={isRefreshing}
        >
          <Ionicons 
            name="refresh" 
            size={24} 
            color={isRefreshing ? '#8E8E93' : '#007AFF'} 
          />
        </TouchableOpacity>
      </View>

      {/* Connection Status */}
      <View style={[styles.statusBar, { backgroundColor: syncStatus.isOnline ? '#34C759' : '#FF3B30' }]}>
        <Ionicons 
          name={syncStatus.isOnline ? 'wifi' : 'wifi-off'} 
          size={16} 
          color="white" 
        />
        <Text style={styles.statusText}>
          {syncStatus.isOnline ? 'Online' : 'Offline'}
          {syncStatus.isSyncing && ' - Syncing...'}
        </Text>
      </View>

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{storageStats.outboxCount}</Text>
          <Text style={styles.statLabel}>Pending Items</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{storageStats.formsCount}</Text>
          <Text style={styles.statLabel}>Cached Forms</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{storageStats.responsesCount}</Text>
          <Text style={styles.statLabel}>Draft responses</Text>
        </View>
      </View>

      {/* Last Sync Info */}
      {storageStats.lastSync && (
        <View style={styles.lastSyncContainer}>
          <Ionicons name="time-outline" size={16} color="#8E8E93" />
          <Text style={styles.lastSyncText}>
            Last sync: {formatDate(storageStats.lastSync)}
          </Text>
        </View>
      )}

      {/* Action Buttons */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={[
            styles.actionButton,
            styles.syncButton,
            (!syncStatus.isOnline || isSyncing) && styles.disabledButton
          ]}
          onPress={handleManualSync}
          disabled={!syncStatus.isOnline || isSyncing}
        >
          <Ionicons 
            name="sync" 
            size={20} 
            color={(!syncStatus.isOnline || isSyncing) ? '#8E8E93' : 'white'} 
          />
          <Text style={[
            styles.actionButtonText,
            (!syncStatus.isOnline || isSyncing) && styles.disabledButtonText
          ]}>
            {isSyncing ? 'Syncing...' : 'Sync Now'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.clearButton]}
          onPress={handleClearCompleted}
        >
          <Ionicons name="trash-outline" size={20} color="white" />
          <Text style={styles.actionButtonText}>Clear Completed</Text>
        </TouchableOpacity>
      </View>

      {/* Additional Action Buttons Row */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={[styles.actionButton, styles.clearFailedButton]}
          onPress={handleClearFailed}
        >
          <Ionicons name="warning-outline" size={20} color="white" />
          <Text style={styles.actionButtonText}>Clear Failed</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.clearAllButton]}
          onPress={() => {
            Alert.alert(
              'Clear All Items',
              'This will remove ALL items from your outbox (pending, failed, and completed). This action cannot be undone. Are you sure?',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Clear All',
                  style: 'destructive',
                  onPress: async () => {
                    try {
                      await offlineStorage.clearAllActions();
                      await loadData();
                      Alert.alert('Success', 'All outbox items have been cleared.');
                    } catch (error) {
                      Alert.alert('Error', 'Failed to clear all items.');
                    }
                  },
                },
              ]
            );
          }}
        >
          <Ionicons name="nuclear-outline" size={20} color="white" />
          <Text style={styles.actionButtonText}>Clear All</Text>
        </TouchableOpacity>
      </View>

      {/* Outbox Items List */}
      <FlatList
        data={outboxItems}
        renderItem={renderOutboxItem}
        keyExtractor={(item) => item.id}
        style={styles.list}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="checkmark-circle-outline" size={64} color="#34C759" />
            <Text style={styles.emptyTitle}>All Caught Up!</Text>
            <Text style={styles.emptyMessage}>
              Your outbox is empty. All work has been synchronized.
            </Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  refreshButton: {
    padding: 8,
  },
  statusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  statusText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  statLabel: {
    fontSize: 12,
    color: '#8E8E93',
    textAlign: 'center',
    marginTop: 4,
  },
  lastSyncContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  lastSyncText: {
    fontSize: 14,
    color: '#8E8E93',
    marginLeft: 6,
  },
  actionsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  syncButton: {
    backgroundColor: '#007AFF',
  },
  clearButton: {
    backgroundColor: '#FF3B30',
  },
  clearFailedButton: {
    backgroundColor: '#FF9500',
  },
  clearAllButton: {
    backgroundColor: '#8E0000',
  },
  disabledButton: {
    backgroundColor: '#E5E5EA',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButtonText: {
    color: '#8E8E93',
  },
  list: {
    flex: 1,
    paddingHorizontal: 16,
  },
  itemContainer: {
    backgroundColor: 'white',
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  itemType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  itemTimestamp: {
    fontSize: 12,
    color: '#8E8E93',
  },
  itemStatus: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 4,
  },
  statusText: {
    fontWeight: '600',
  },
  retryCount: {
    fontSize: 12,
    color: '#FF3B30',
    marginBottom: 4,
  },
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  itemId: {
    fontSize: 11,
    color: '#C7C7CC',
    fontFamily: 'monospace',
  },
  tapHint: {
    fontSize: 11,
    color: '#007AFF',
    fontStyle: 'italic',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 64,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 16,
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: 22,
  },
});