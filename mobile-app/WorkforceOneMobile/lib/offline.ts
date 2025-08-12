import AsyncStorage from '@react-native-async-storage/async-storage'
import NetInfo from '@react-native-community/netinfo'
import { supabase } from './supabase'

interface OfflineAction {
  id: string
  type: 'create' | 'update' | 'delete'
  table: string
  data: any
  timestamp: number
  retryCount: number
}

interface SyncableData {
  tasks: any[]
  projects: any[]
  timeEntries: any[]
  attendance: any[]
  lastSync: number
}

class OfflineService {
  private isOnline: boolean = true
  private syncQueue: OfflineAction[] = []
  private readonly STORAGE_KEYS = {
    SYNC_QUEUE: '@workforceone_sync_queue',
    OFFLINE_DATA: '@workforceone_offline_data',
    LAST_SYNC: '@workforceone_last_sync',
  }

  async initialize() {
    // Listen for network changes
    NetInfo.addEventListener(state => {
      const wasOffline = !this.isOnline
      this.isOnline = state.isConnected ?? false
      
      // If we just came back online, sync pending changes
      if (wasOffline && this.isOnline) {
        this.syncPendingChanges()
      }
    })

    // Load pending sync queue
    await this.loadSyncQueue()
    
    // Check current network status
    const netInfo = await NetInfo.fetch()
    this.isOnline = netInfo.isConnected ?? false
  }

  async addToSyncQueue(action: Omit<OfflineAction, 'id' | 'timestamp' | 'retryCount'>) {
    const offlineAction: OfflineAction = {
      ...action,
      id: Date.now().toString(),
      timestamp: Date.now(),
      retryCount: 0,
    }

    this.syncQueue.push(offlineAction)
    await this.saveSyncQueue()

    // If online, try to sync immediately
    if (this.isOnline) {
      this.syncPendingChanges()
    }
  }

  async syncPendingChanges() {
    if (!this.isOnline || this.syncQueue.length === 0) {
      return
    }

    console.log(`Syncing ${this.syncQueue.length} pending changes...`)
    const failedActions: OfflineAction[] = []

    for (const action of this.syncQueue) {
      try {
        await this.executeAction(action)
        console.log(`Synced action: ${action.type} on ${action.table}`)
      } catch (error) {
        console.error(`Failed to sync action:`, error)
        
        // Retry logic
        action.retryCount++
        if (action.retryCount < 3) {
          failedActions.push(action)
        } else {
          console.log(`Action ${action.id} exceeded retry limit, discarding`)
        }
      }
    }

    // Update sync queue with failed actions
    this.syncQueue = failedActions
    await this.saveSyncQueue()

    // Update last sync timestamp
    await AsyncStorage.setItem(this.STORAGE_KEYS.LAST_SYNC, Date.now().toString())
  }

  private async executeAction(action: OfflineAction) {
    const { type, table, data } = action

    switch (type) {
      case 'create':
        await supabase.from(table).insert(data)
        break
      case 'update':
        await supabase.from(table).update(data.updates).eq('id', data.id)
        break
      case 'delete':
        await supabase.from(table).delete().eq('id', data.id)
        break
    }
  }

  async cacheDataForOffline(organizationId: string) {
    if (!this.isOnline) {
      console.log('Cannot cache data while offline')
      return
    }

    try {
      // Fetch recent data for offline use
      const [tasks, projects, timeEntries, attendance] = await Promise.all([
        supabase
          .from('tasks')
          .select('*')
          .eq('organization_id', organizationId)
          .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
          .order('created_at', { ascending: false }),
        
        supabase
          .from('projects')
          .select('*')
          .eq('organization_id', organizationId)
          .order('created_at', { ascending: false }),
        
        supabase
          .from('time_entries')
          .select('*')
          .eq('organization_id', organizationId)
          .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
          .order('start_time', { ascending: false }),
        
        supabase
          .from('attendance')
          .select('*')
          .eq('organization_id', organizationId)
          .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
          .order('created_at', { ascending: false }),
      ])

      const offlineData: SyncableData = {
        tasks: tasks.data || [],
        projects: projects.data || [],
        timeEntries: timeEntries.data || [],
        attendance: attendance.data || [],
        lastSync: Date.now(),
      }

      await AsyncStorage.setItem(this.STORAGE_KEYS.OFFLINE_DATA, JSON.stringify(offlineData))
      console.log('Data cached for offline use')
    } catch (error) {
      console.error('Error caching data for offline:', error)
    }
  }

  async getOfflineData(): Promise<SyncableData | null> {
    try {
      const data = await AsyncStorage.getItem(this.STORAGE_KEYS.OFFLINE_DATA)
      return data ? JSON.parse(data) : null
    } catch (error) {
      console.error('Error getting offline data:', error)
      return null
    }
  }

  async createTaskOffline(taskData: any) {
    // Generate temporary ID
    const tempId = `temp_${Date.now()}`
    const task = { ...taskData, id: tempId, created_at: new Date().toISOString() }

    // Add to offline storage
    await this.addToOfflineCache('tasks', task)

    // Queue for sync when online
    await this.addToSyncQueue({
      type: 'create',
      table: 'tasks',
      data: { ...taskData, id: undefined }, // Remove temp ID for actual creation
    })

    return task
  }

  async updateTaskOffline(taskId: string, updates: any) {
    // Update in offline cache
    await this.updateOfflineCache('tasks', taskId, updates)

    // Queue for sync
    await this.addToSyncQueue({
      type: 'update',
      table: 'tasks',
      data: { id: taskId, updates },
    })
  }

  async createTimeEntryOffline(entryData: any) {
    const tempId = `temp_${Date.now()}`
    const entry = { ...entryData, id: tempId, created_at: new Date().toISOString() }

    await this.addToOfflineCache('timeEntries', entry)
    await this.addToSyncQueue({
      type: 'create',
      table: 'time_entries',
      data: { ...entryData, id: undefined },
    })

    return entry
  }

  async createAttendanceOffline(attendanceData: any) {
    const tempId = `temp_${Date.now()}`
    const attendance = { ...attendanceData, id: tempId, created_at: new Date().toISOString() }

    await this.addToOfflineCache('attendance', attendance)
    await this.addToSyncQueue({
      type: 'create',
      table: 'attendance',
      data: { ...attendanceData, id: undefined },
    })

    return attendance
  }

  private async addToOfflineCache(table: string, item: any) {
    const offlineData = await this.getOfflineData()
    if (!offlineData) return

    const tableData = offlineData[table as keyof SyncableData] as any[]
    if (Array.isArray(tableData)) {
      tableData.unshift(item)
      await AsyncStorage.setItem(this.STORAGE_KEYS.OFFLINE_DATA, JSON.stringify(offlineData))
    }
  }

  private async updateOfflineCache(table: string, itemId: string, updates: any) {
    const offlineData = await this.getOfflineData()
    if (!offlineData) return

    const tableData = offlineData[table as keyof SyncableData] as any[]
    if (Array.isArray(tableData)) {
      const index = tableData.findIndex(item => item.id === itemId)
      if (index !== -1) {
        tableData[index] = { ...tableData[index], ...updates }
        await AsyncStorage.setItem(this.STORAGE_KEYS.OFFLINE_DATA, JSON.stringify(offlineData))
      }
    }
  }

  private async loadSyncQueue() {
    try {
      const queueData = await AsyncStorage.getItem(this.STORAGE_KEYS.SYNC_QUEUE)
      this.syncQueue = queueData ? JSON.parse(queueData) : []
    } catch (error) {
      console.error('Error loading sync queue:', error)
      this.syncQueue = []
    }
  }

  private async saveSyncQueue() {
    try {
      await AsyncStorage.setItem(this.STORAGE_KEYS.SYNC_QUEUE, JSON.stringify(this.syncQueue))
    } catch (error) {
      console.error('Error saving sync queue:', error)
    }
  }

  isConnected() {
    return this.isOnline
  }

  getPendingSyncCount() {
    return this.syncQueue.length
  }

  async clearOfflineData() {
    await AsyncStorage.multiRemove([
      this.STORAGE_KEYS.OFFLINE_DATA,
      this.STORAGE_KEYS.SYNC_QUEUE,
      this.STORAGE_KEYS.LAST_SYNC,
    ])
    this.syncQueue = []
  }

  async getLastSyncTime(): Promise<number | null> {
    try {
      const timestamp = await AsyncStorage.getItem(this.STORAGE_KEYS.LAST_SYNC)
      return timestamp ? parseInt(timestamp) : null
    } catch (error) {
      console.error('Error getting last sync time:', error)
      return null
    }
  }

  async forceSync() {
    await this.syncPendingChanges()
  }
}

export const offlineService = new OfflineService()