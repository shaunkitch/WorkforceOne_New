import React, { useEffect } from 'react'
import 'react-native-gesture-handler'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { AuthProvider } from './contexts/AuthContext'
import AppNavigator from './navigation/AppNavigator'
import { notificationService } from './lib/notifications'
import { offlineService } from './lib/offline'
import { syncService } from './services/SyncService'

export default function App() {
  useEffect(() => {
    // Initialize services
    const initializeServices = async () => {
      try {
        await notificationService.initialize()
        await offlineService.initialize()
        // SyncService initializes automatically via its constructor
        console.log('All services initialized successfully')
      } catch (error) {
        console.error('Error initializing services:', error)
      }
    }

    initializeServices()

    // Cleanup function
    return () => {
      syncService.destroy()
    }
  }, [])

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <AppNavigator />
      </AuthProvider>
    </SafeAreaProvider>
  )
}
