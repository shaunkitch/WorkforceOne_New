import NetInfo from '@react-native-community/netinfo'
import { supabase } from '../lib/supabase'
import { offlineStorage, OfflineAction } from './OfflineStorage'

class SyncService {
  private isOnline: boolean = false
  private isSyncing: boolean = false
  private syncInterval: NodeJS.Timeout | null = null
  private retryTimeout: NodeJS.Timeout | null = null

  constructor() {
    this.initializeNetworkListener()
    this.startPeriodicSync()
  }

  private initializeNetworkListener() {
    NetInfo.addEventListener(state => {
      const wasOnline = this.isOnline
      this.isOnline = state.isConnected ?? false
      
      console.log('Network state changed:', {
        isConnected: state.isConnected,
        type: state.type,
        details: state.details
      })

      // If we just came online, trigger sync
      if (!wasOnline && this.isOnline) {
        console.log('Device came online, triggering sync...')
        this.syncData()
      }
    })
  }

  private startPeriodicSync() {
    // Sync every 5 minutes when online
    this.syncInterval = setInterval(() => {
      if (this.isOnline && !this.isSyncing) {
        this.syncData()
      }
    }, 5 * 60 * 1000) // 5 minutes
  }

  async syncData(): Promise<{ success: number; failed: number; errors: string[] }> {
    if (this.isSyncing || !this.isOnline) {
      return { success: 0, failed: 0, errors: ['Sync already in progress or offline'] }
    }

    this.isSyncing = true
    console.log('Starting sync process...')

    const results = { success: 0, failed: 0, errors: [] as string[] }

    try {
      // Get all pending actions from outbox
      const outbox = await offlineStorage.getOutbox()
      const pendingActions = outbox.filter(action => action.status === 'pending' || action.status === 'failed')

      console.log(`Found ${pendingActions.length} pending actions to sync`)

      for (const action of pendingActions) {
        try {
          await offlineStorage.updateOutboxAction(action.id, { status: 'syncing' })
          
          const syncResult = await this.syncAction(action)
          
          if (syncResult.success) {
            await offlineStorage.updateOutboxAction(action.id, { status: 'completed' })
            results.success++
            console.log(`Successfully synced action: ${action.id}`)
          } else {
            await this.handleSyncFailure(action, syncResult.error)
            results.failed++
            results.errors.push(`${action.type}: ${syncResult.error}`)
          }
        } catch (error) {
          console.error(`Error syncing action ${action.id}:`, error)
          await this.handleSyncFailure(action, error instanceof Error ? error.message : 'Unknown error')
          results.failed++
          results.errors.push(`${action.type}: ${error}`)
        }
      }

      // Clean up completed actions
      await offlineStorage.clearCompletedActions()

      // Update last sync time
      await offlineStorage.setLastSyncTime()

      console.log(`Sync completed: ${results.success} success, ${results.failed} failed`)

    } catch (error) {
      console.error('Sync process error:', error)
      results.errors.push(`Sync process error: ${error}`)
    } finally {
      this.isSyncing = false
    }

    return results
  }

  private async syncAction(action: OfflineAction): Promise<{ success: boolean; error?: string }> {
    try {
      switch (action.type) {
        case 'form_response':
          return await this.syncFormResponse(action)
        case 'attendance':
          return await this.syncAttendance(action)
        case 'outlet_visit':
          return await this.syncOutletVisit(action)
        case 'leave_request':
          return await this.syncLeaveRequest(action)
        case 'check_in':
          return await this.syncCheckIn(action)
        case 'check_out':
          return await this.syncCheckOut(action)
        default:
          return { success: false, error: `Unknown action type: ${action.type}` }
      }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  private async syncFormResponse(action: OfflineAction): Promise<{ success: boolean; error?: string }> {
    try {
      const { data } = action

      const { error } = await supabase
        .from('form_responses')
        .insert({
          form_id: data.formId,
          organization_id: data.organizationId,
          respondent_id: data.userId,
          responses: data.responses,
          status: 'completed',
          submitted_at: data.timestamp
        })

      if (error) throw error

      // Update visit if provided
      if (data.visitId) {
        await supabase
          .from('outlet_visits')
          .update({
            form_completed: true,
            check_out_time: data.timestamp
          })
          .eq('id', data.visitId)
      }

      return { success: true }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  private async syncAttendance(action: OfflineAction): Promise<{ success: boolean; error?: string }> {
    try {
      const { data } = action

      const { error } = await supabase
        .from('attendance')
        .upsert({
          user_id: data.userId,
          organization_id: data.organizationId,
          date: data.date,
          status: data.status,
          check_in_time: data.checkInTime,
          check_out_time: data.checkOutTime,
          location: data.location,
          notes: data.notes
        })

      if (error) throw error
      return { success: true }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  private async syncOutletVisit(action: OfflineAction): Promise<{ success: boolean; error?: string }> {
    try {
      const { data } = action

      const { error } = await supabase
        .from('outlet_visits')
        .insert({
          outlet_id: data.outletId,
          user_id: data.userId,
          organization_id: data.organizationId,
          check_in_time: data.checkInTime,
          check_out_time: data.checkOutTime,
          form_completed: data.formCompleted || false,
          route_stop_id: data.routeStopId,
          notes: data.notes,
          location: data.location
        })

      if (error) throw error

      // If form is completed and route stop exists, mark it as completed
      if (data.formCompleted && data.routeStopId) {
        await supabase
          .from('route_stops')
          .update({
            status: 'completed',
            actual_departure_time: data.checkOutTime || new Date().toISOString()
          })
          .eq('id', data.routeStopId)
      }

      return { success: true }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  private async syncLeaveRequest(action: OfflineAction): Promise<{ success: boolean; error?: string }> {
    try {
      const { data } = action

      const { error } = await supabase
        .from('leave_requests')
        .insert({
          employee_id: data.employeeId || data.userId, // Support both for backward compatibility
          organization_id: data.organizationId,
          type: data.type,
          start_date: data.startDate,
          end_date: data.endDate,
          reason: data.reason,
          status: 'pending',
          requested_at: data.timestamp
        })

      if (error) throw error
      return { success: true }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  private async syncCheckIn(action: OfflineAction): Promise<{ success: boolean; error?: string }> {
    // Handle check-in specific sync
    return await this.syncAttendance(action)
  }

  private async syncCheckOut(action: OfflineAction): Promise<{ success: boolean; error?: string }> {
    // Handle check-out specific sync
    return await this.syncAttendance(action)
  }

  private async handleSyncFailure(action: OfflineAction, error: string) {
    const newRetryCount = action.retryCount + 1
    const maxRetries = 3

    if (newRetryCount >= maxRetries) {
      // Mark as failed after max retries
      await offlineStorage.updateOutboxAction(action.id, {
        status: 'failed',
        retryCount: newRetryCount
      })
      console.log(`Action ${action.id} failed after ${maxRetries} retries`)
    } else {
      // Schedule retry
      await offlineStorage.updateOutboxAction(action.id, {
        status: 'pending',
        retryCount: newRetryCount
      })
      console.log(`Action ${action.id} will retry (attempt ${newRetryCount + 1}/${maxRetries})`)
    }
  }

  // Download fresh data when online
  async downloadFreshData(userId: string, organizationId: string): Promise<boolean> {
    if (!this.isOnline) {
      console.log('Cannot download data while offline')
      return false
    }

    try {
      console.log('Downloading fresh data...')

      // Download forms
      const { data: forms, error: formsError } = await supabase
        .from('forms')
        .select('*')
        .eq('organization_id', organizationId)
        .in('status', ['active', 'draft'])

      if (formsError) throw formsError
      await offlineStorage.storeForms(forms || [])

      // Download outlets
      const { data: outlets, error: outletsError } = await supabase
        .from('outlets')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('is_active', true)

      if (outletsError) throw outletsError
      await offlineStorage.storeOutlets(outlets || [])

      // Download routes
      const { data: routes, error: routesError } = await supabase
        .from('routes')
        .select(`
          *,
          route_stops (
            *,
            outlet:outlets (*)
          )
        `)
        .eq('organization_id', organizationId)
        .eq('is_active', true)

      if (routesError) throw routesError
      await offlineStorage.storeRoutes(routes || [])

      console.log('Fresh data downloaded successfully')
      return true
    } catch (error) {
      console.error('Error downloading fresh data:', error)
      return false
    }
  }

  // Force sync now
  async forcSync(): Promise<boolean> {
    if (!this.isOnline) {
      console.log('Cannot force sync while offline')
      return false
    }

    const results = await this.syncData()
    return results.failed === 0
  }

  // Get sync status
  getSyncStatus(): {
    isOnline: boolean
    isSyncing: boolean
  } {
    return {
      isOnline: this.isOnline,
      isSyncing: this.isSyncing
    }
  }

  // Cleanup
  destroy() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval)
    }
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout)
    }
  }
}

export const syncService = new SyncService()
export default SyncService