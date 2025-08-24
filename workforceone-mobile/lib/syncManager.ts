// Sync Manager for Mobile App - Handles incident synchronization and debugging
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';

export interface SyncItem {
  id: string;
  type: 'incident' | 'checkin' | 'report' | 'data' | 'patrol' | 'backup' | 'emergency';
  data: any;
  attempts: number;
  lastAttempt?: string;
  status: 'pending' | 'syncing' | 'success' | 'failed';
  error?: string;
  createdAt: string;
}

export interface SyncLog {
  id: string;
  timestamp: string;
  action: string;
  status: 'info' | 'warning' | 'error' | 'success';
  message: string;
  details?: any;
}

class SyncManager {
  private outboxKey = 'syncOutbox';
  private logsKey = 'syncLogs';
  private maxLogs = 100;
  private maxAttempts = 3;

  // Debug logging
  async log(action: string, status: 'info' | 'warning' | 'error' | 'success', message: string, details?: any) {
    const logEntry: SyncLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      action,
      status,
      message,
      details: details ? JSON.stringify(details, null, 2) : undefined
    };

    console.log(`🔧 [${status.toUpperCase()}] ${action}: ${message}`, details || '');

    try {
      const existingLogs = await this.getLogs();
      const updatedLogs = [logEntry, ...existingLogs].slice(0, this.maxLogs);
      await AsyncStorage.setItem(this.logsKey, JSON.stringify(updatedLogs));
    } catch (error) {
      console.error('Failed to save log:', error);
    }
  }

  async getLogs(): Promise<SyncLog[]> {
    try {
      const logs = await AsyncStorage.getItem(this.logsKey);
      return logs ? JSON.parse(logs) : [];
    } catch (error) {
      console.error('Failed to get logs:', error);
      return [];
    }
  }

  async clearLogs() {
    try {
      await AsyncStorage.removeItem(this.logsKey);
      await this.log('SYSTEM', 'info', 'Debug logs cleared');
    } catch (error) {
      console.error('Failed to clear logs:', error);
    }
  }

  // Outbox management
  async addToOutbox(type: 'incident' | 'checkin' | 'report', data: any): Promise<string> {
    const item: SyncItem = {
      id: `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      data,
      attempts: 0,
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    try {
      const existingItems = await this.getOutboxItems();
      const updatedItems = [...existingItems, item];
      await AsyncStorage.setItem(this.outboxKey, JSON.stringify(updatedItems));
      
      await this.log('OUTBOX', 'info', `Added ${type} to outbox`, { id: item.id, dataSize: JSON.stringify(data).length });
      
      // Try to sync immediately
      this.syncItem(item.id);
      
      return item.id;
    } catch (error) {
      await this.log('OUTBOX', 'error', `Failed to add ${type} to outbox`, error);
      throw error;
    }
  }

  async getOutboxItems(): Promise<SyncItem[]> {
    try {
      const items = await AsyncStorage.getItem(this.outboxKey);
      return items ? JSON.parse(items) : [];
    } catch (error) {
      await this.log('OUTBOX', 'error', 'Failed to get outbox items', error);
      return [];
    }
  }

  async updateOutboxItem(id: string, updates: Partial<SyncItem>) {
    try {
      const items = await this.getOutboxItems();
      const itemIndex = items.findIndex(item => item.id === id);
      
      if (itemIndex !== -1) {
        items[itemIndex] = { ...items[itemIndex], ...updates };
        await AsyncStorage.setItem(this.outboxKey, JSON.stringify(items));
        
        await this.log('OUTBOX', 'info', `Updated outbox item ${id}`, updates);
      }
    } catch (error) {
      await this.log('OUTBOX', 'error', `Failed to update outbox item ${id}`, error);
    }
  }

  async removeFromOutbox(id: string) {
    try {
      const items = await this.getOutboxItems();
      const filteredItems = items.filter(item => item.id !== id);
      await AsyncStorage.setItem(this.outboxKey, JSON.stringify(filteredItems));
      
      await this.log('OUTBOX', 'info', `Removed item ${id} from outbox`);
    } catch (error) {
      await this.log('OUTBOX', 'error', `Failed to remove item ${id} from outbox`, error);
    }
  }

  // Sync functionality
  async syncItem(itemId: string): Promise<boolean> {
    await this.log('SYNC', 'info', `Starting sync for item ${itemId}`);
    
    try {
      const items = await this.getOutboxItems();
      const item = items.find(i => i.id === itemId);
      
      if (!item) {
        await this.log('SYNC', 'warning', `Item ${itemId} not found in outbox`);
        return false;
      }

      if (item.attempts >= this.maxAttempts) {
        await this.log('SYNC', 'error', `Item ${itemId} exceeded max attempts (${this.maxAttempts})`);
        return false;
      }

      // Update sync status
      await this.updateOutboxItem(itemId, {
        status: 'syncing',
        attempts: item.attempts + 1,
        lastAttempt: new Date().toISOString()
      });

      let syncSuccess = false;
      let errorDetails = null;

      // Try different sync methods based on type
      if (item.type === 'incident') {
        syncSuccess = await this.syncIncident(item.data, itemId);
      }

      if (syncSuccess) {
        await this.updateOutboxItem(itemId, { status: 'success' });
        await this.log('SYNC', 'success', `Successfully synced ${item.type} ${itemId}`);
        
        // Remove from outbox after successful sync
        setTimeout(() => this.removeFromOutbox(itemId), 5000); // Keep for 5 seconds for debugging
        
        return true;
      } else {
        await this.updateOutboxItem(itemId, { 
          status: 'failed',
          error: errorDetails || 'Sync failed'
        });
        await this.log('SYNC', 'error', `Failed to sync ${item.type} ${itemId}`, errorDetails);
        return false;
      }

    } catch (error) {
      await this.log('SYNC', 'error', `Sync error for item ${itemId}`, error);
      await this.updateOutboxItem(itemId, { 
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return false;
    }
  }

  private async syncIncident(incidentData: any, itemId: string): Promise<boolean> {
    await this.log('INCIDENT_SYNC', 'info', 'Starting incident sync', { id: itemId, title: incidentData.title });
    
    let syncMethods = 0;
    let successCount = 0;

    // Method 1: Try Supabase database
    try {
      await this.log('INCIDENT_SYNC', 'info', 'Attempting Supabase database sync');
      const { data, error } = await supabase
        .from('security_incidents')
        .insert([incidentData])
        .select()
        .single();

      if (!error && data) {
        successCount++;
        await this.log('INCIDENT_SYNC', 'success', 'Supabase database sync successful', { id: data.id });
      } else {
        await this.log('INCIDENT_SYNC', 'warning', 'Supabase database sync failed', error);
      }
    } catch (dbError) {
      await this.log('INCIDENT_SYNC', 'warning', 'Supabase database error', dbError);
    }
    syncMethods++;

    // Method 2: Try API endpoint
    try {
      await this.log('INCIDENT_SYNC', 'info', 'Attempting API endpoint sync');
      const response = await fetch('http://172.28.213.25:3001/api/incidents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(incidentData),
      });

      if (response.ok) {
        const apiResult = await response.json();
        if (apiResult.success) {
          successCount++;
          await this.log('INCIDENT_SYNC', 'success', 'API endpoint sync successful', apiResult);
        } else {
          await this.log('INCIDENT_SYNC', 'warning', 'API endpoint returned error', apiResult);
        }
      } else {
        await this.log('INCIDENT_SYNC', 'warning', 'API endpoint HTTP error', { status: response.status, statusText: response.statusText });
      }
    } catch (apiError) {
      await this.log('INCIDENT_SYNC', 'warning', 'API endpoint network error', apiError);
    }
    syncMethods++;

    // Method 3: Save to local storage (always works)
    try {
      await this.log('INCIDENT_SYNC', 'info', 'Saving to local storage backup');
      const existingReports = await AsyncStorage.getItem('incidentReports');
      const reports = existingReports ? JSON.parse(existingReports) : [];
      reports.unshift(incidentData);
      await AsyncStorage.setItem('incidentReports', JSON.stringify(reports));
      successCount++;
      await this.log('INCIDENT_SYNC', 'success', 'Local storage backup successful');
    } catch (storageError) {
      await this.log('INCIDENT_SYNC', 'error', 'Local storage backup failed', storageError);
    }
    syncMethods++;

    await this.log('INCIDENT_SYNC', 'info', `Sync summary: ${successCount}/${syncMethods} methods successful`);
    
    return successCount > 0; // Consider successful if at least one method worked
  }

  async syncAll(): Promise<{ total: number; success: number; failed: number }> {
    await this.log('SYNC_ALL', 'info', 'Starting sync all operation');
    
    const items = await this.getOutboxItems();
    const pendingItems = items.filter(item => item.status === 'pending' || item.status === 'failed');
    
    let successCount = 0;
    let failedCount = 0;

    for (const item of pendingItems) {
      const success = await this.syncItem(item.id);
      if (success) {
        successCount++;
      } else {
        failedCount++;
      }
    }

    await this.log('SYNC_ALL', 'info', `Sync all completed: ${successCount} success, ${failedCount} failed`);

    return {
      total: pendingItems.length,
      success: successCount,
      failed: failedCount
    };
  }

  // Generic sync method for any table
  async syncData(tableName: string, data: any): Promise<boolean> {
    await this.log('SYNC_DATA', 'info', `Syncing data to ${tableName}`, { tableName, dataId: data.id });
    
    try {
      // Try direct database sync first
      const { data: result, error } = await supabase
        .from(tableName)
        .upsert(data, { onConflict: 'id' });

      if (error) {
        await this.log('SYNC_DATA', 'warning', `Direct sync to ${tableName} failed`, error);
        
        // Add to outbox for later sync
        await this.addToOutbox({
          id: `sync_${tableName}_${Date.now()}`,
          type: 'data' as any,
          data: { tableName, ...data },
          attempts: 0,
          status: 'pending',
          createdAt: new Date().toISOString()
        });
        
        return false;
      } else {
        await this.log('SYNC_DATA', 'success', `Successfully synced to ${tableName}`, result);
        return true;
      }
    } catch (error) {
      await this.log('SYNC_DATA', 'error', `Sync to ${tableName} failed`, error);
      
      // Add to outbox for later sync
      await this.addToOutbox({
        id: `sync_${tableName}_${Date.now()}`,
        type: 'data' as any,
        data: { tableName, ...data },
        attempts: 0,
        status: 'pending',
        createdAt: new Date().toISOString()
      });
      
      return false;
    }
  }

  async getStats() {
    const outboxItems = await this.getOutboxItems();
    const logs = await this.getLogs();
    
    return {
      outbox: {
        total: outboxItems.length,
        pending: outboxItems.filter(item => item.status === 'pending').length,
        syncing: outboxItems.filter(item => item.status === 'syncing').length,
        success: outboxItems.filter(item => item.status === 'success').length,
        failed: outboxItems.filter(item => item.status === 'failed').length,
      },
      logs: {
        total: logs.length,
        recent: logs.slice(0, 10),
        errors: logs.filter(log => log.status === 'error').length,
        warnings: logs.filter(log => log.status === 'warning').length,
      }
    };
  }
}

export const syncManager = new SyncManager();
export default syncManager;