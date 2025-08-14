import AsyncStorage from '@react-native-async-storage/async-storage'

export interface OfflineAction {
  id: string
  type: 'form_response' | 'attendance' | 'outlet_visit' | 'leave_request' | 'check_in' | 'check_out'
  data: any
  timestamp: string
  retryCount: number
  userId: string
  organizationId: string
  status: 'pending' | 'syncing' | 'completed' | 'failed'
}

export interface OfflineFormResponse {
  id: string
  formId: string
  outletId: string
  visitId: string
  responses: Record<string, any>
  timestamp: string
  status: 'draft' | 'completed'
}

class OfflineStorageService {
  private readonly OUTBOX_KEY = 'offline_outbox'
  private readonly FORMS_KEY = 'offline_forms'
  private readonly FORM_RESPONSES_KEY = 'offline_form_responses'
  private readonly USER_DATA_KEY = 'offline_user_data'
  private readonly OUTLETS_KEY = 'offline_outlets'
  private readonly ROUTES_KEY = 'offline_routes'

  // Outbox Management
  async addToOutbox(action: Omit<OfflineAction, 'id' | 'retryCount' | 'status'>): Promise<string> {
    try {
      const actionId = `${action.type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      const fullAction: OfflineAction = {
        ...action,
        id: actionId,
        retryCount: 0,
        status: 'pending'
      }

      const outbox = await this.getOutbox()
      outbox.push(fullAction)
      
      await AsyncStorage.setItem(this.OUTBOX_KEY, JSON.stringify(outbox))
      console.log('Added to outbox:', actionId)
      return actionId
    } catch (error) {
      console.error('Error adding to outbox:', error)
      throw error
    }
  }

  async getOutbox(): Promise<OfflineAction[]> {
    try {
      const outboxStr = await AsyncStorage.getItem(this.OUTBOX_KEY)
      return outboxStr ? JSON.parse(outboxStr) : []
    } catch (error) {
      console.error('Error getting outbox:', error)
      return []
    }
  }

  async updateOutboxAction(actionId: string, updates: Partial<OfflineAction>): Promise<void> {
    try {
      const outbox = await this.getOutbox()
      const index = outbox.findIndex(action => action.id === actionId)
      
      if (index !== -1) {
        outbox[index] = { ...outbox[index], ...updates }
        await AsyncStorage.setItem(this.OUTBOX_KEY, JSON.stringify(outbox))
      }
    } catch (error) {
      console.error('Error updating outbox action:', error)
    }
  }

  async removeFromOutbox(actionId: string): Promise<void> {
    try {
      const outbox = await this.getOutbox()
      const filteredOutbox = outbox.filter(action => action.id !== actionId)
      await AsyncStorage.setItem(this.OUTBOX_KEY, JSON.stringify(filteredOutbox))
      console.log('Removed from outbox:', actionId)
    } catch (error) {
      console.error('Error removing from outbox:', error)
    }
  }

  async clearCompletedActions(): Promise<void> {
    try {
      const outbox = await this.getOutbox()
      const pendingActions = outbox.filter(action => action.status !== 'completed')
      await AsyncStorage.setItem(this.OUTBOX_KEY, JSON.stringify(pendingActions))
    } catch (error) {
      console.error('Error clearing completed actions:', error)
    }
  }

  // Form Storage
  async storeForms(forms: any[]): Promise<void> {
    try {
      await AsyncStorage.setItem(this.FORMS_KEY, JSON.stringify(forms))
    } catch (error) {
      console.error('Error storing forms:', error)
    }
  }

  async getForms(): Promise<any[]> {
    try {
      const formsStr = await AsyncStorage.getItem(this.FORMS_KEY)
      return formsStr ? JSON.parse(formsStr) : []
    } catch (error) {
      console.error('Error getting forms:', error)
      return []
    }
  }

  async getForm(formId: string): Promise<any | null> {
    try {
      const forms = await this.getForms()
      return forms.find(form => form.id === formId) || null
    } catch (error) {
      console.error('Error getting form:', error)
      return null
    }
  }

  // Form Responses Storage
  async saveFormResponse(response: OfflineFormResponse): Promise<void> {
    try {
      const responses = await this.getFormResponses()
      const existingIndex = responses.findIndex(r => r.id === response.id)
      
      if (existingIndex !== -1) {
        responses[existingIndex] = response
      } else {
        responses.push(response)
      }
      
      await AsyncStorage.setItem(this.FORM_RESPONSES_KEY, JSON.stringify(responses))
      console.log('Saved form response:', response.id)
    } catch (error) {
      console.error('Error saving form response:', error)
    }
  }

  async getFormResponses(): Promise<OfflineFormResponse[]> {
    try {
      const responsesStr = await AsyncStorage.getItem(this.FORM_RESPONSES_KEY)
      return responsesStr ? JSON.parse(responsesStr) : []
    } catch (error) {
      console.error('Error getting form responses:', error)
      return []
    }
  }

  async getFormResponse(visitId: string): Promise<OfflineFormResponse | null> {
    try {
      const responses = await this.getFormResponses()
      return responses.find(r => r.visitId === visitId) || null
    } catch (error) {
      console.error('Error getting form response:', error)
      return null
    }
  }

  // User Data Storage
  async storeUserData(userData: any): Promise<void> {
    try {
      await AsyncStorage.setItem(this.USER_DATA_KEY, JSON.stringify(userData))
    } catch (error) {
      console.error('Error storing user data:', error)
    }
  }

  async getUserData(): Promise<any | null> {
    try {
      const userDataStr = await AsyncStorage.getItem(this.USER_DATA_KEY)
      return userDataStr ? JSON.parse(userDataStr) : null
    } catch (error) {
      console.error('Error getting user data:', error)
      return null
    }
  }

  // Outlets Storage
  async storeOutlets(outlets: any[]): Promise<void> {
    try {
      await AsyncStorage.setItem(this.OUTLETS_KEY, JSON.stringify(outlets))
    } catch (error) {
      console.error('Error storing outlets:', error)
    }
  }

  async getOutlets(): Promise<any[]> {
    try {
      const outletsStr = await AsyncStorage.getItem(this.OUTLETS_KEY)
      return outletsStr ? JSON.parse(outletsStr) : []
    } catch (error) {
      console.error('Error getting outlets:', error)
      return []
    }
  }

  // Routes Storage
  async storeRoutes(routes: any[]): Promise<void> {
    try {
      await AsyncStorage.setItem(this.ROUTES_KEY, JSON.stringify(routes))
    } catch (error) {
      console.error('Error storing routes:', error)
    }
  }

  async getRoutes(): Promise<any[]> {
    try {
      const routesStr = await AsyncStorage.getItem(this.ROUTES_KEY)
      return routesStr ? JSON.parse(routesStr) : []
    } catch (error) {
      console.error('Error getting routes:', error)
      return []
    }
  }

  // Network Status
  async setLastSyncTime(): Promise<void> {
    try {
      await AsyncStorage.setItem('last_sync_time', new Date().toISOString())
    } catch (error) {
      console.error('Error setting last sync time:', error)
    }
  }

  async getLastSyncTime(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem('last_sync_time')
    } catch (error) {
      console.error('Error getting last sync time:', error)
      return null
    }
  }

  // Clear all data
  async clearAllData(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        this.OUTBOX_KEY,
        this.FORMS_KEY,
        this.FORM_RESPONSES_KEY,
        this.USER_DATA_KEY,
        this.OUTLETS_KEY,
        this.ROUTES_KEY,
        'last_sync_time'
      ])
      console.log('All offline data cleared')
    } catch (error) {
      console.error('Error clearing all data:', error)
    }
  }

  // Get storage statistics
  async getStorageStats(): Promise<{
    outboxCount: number
    formsCount: number
    responsesCount: number
    lastSync: string | null
  }> {
    try {
      const [outbox, forms, responses, lastSync] = await Promise.all([
        this.getOutbox(),
        this.getForms(),
        this.getFormResponses(),
        this.getLastSyncTime()
      ])

      return {
        outboxCount: outbox.length,
        formsCount: forms.length,
        responsesCount: responses.length,
        lastSync
      }
    } catch (error) {
      console.error('Error getting storage stats:', error)
      return {
        outboxCount: 0,
        formsCount: 0,
        responsesCount: 0,
        lastSync: null
      }
    }
  }
}

export const offlineStorage = new OfflineStorageService()
export default OfflineStorageService