'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRealtime } from './realtime-context'
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js'
import { devLog } from '../utils/logger'

// Hook for real-time time entries
export function useRealtimeTimeEntries(onUpdate?: (payload: RealtimePostgresChangesPayload<any>) => void) {
  const { subscribe } = useRealtime()
  
  useEffect(() => {
    const unsubscribe = subscribe('time_entries', (payload) => {
      devLog('Time entry change:', payload);
      if (onUpdate) {
        onUpdate(payload)
      }
    })

    return unsubscribe
  }, [subscribe, onUpdate])
}

// Hook for real-time team presence
export function useTeamPresence() {
  const { subscribeToPresence, broadcastMessage } = useRealtime()
  const [onlineUsers, setOnlineUsers] = useState<any[]>([])

  useEffect(() => {
    const unsubscribe = subscribeToPresence('team_presence', (payload) => {
      devLog('Presence update:', payload);
      // Handle presence updates
      if (payload.event === 'sync') {
        const users = Object.values(payload.state || {})
        setOnlineUsers(users)
      }
    })

    return unsubscribe
  }, [subscribeToPresence])

  const updatePresence = useCallback((status: 'online' | 'away' | 'busy') => {
    broadcastMessage('team_presence', 'presence_update', {
      status,
      timestamp: new Date().toISOString()
    })
  }, [broadcastMessage])

  return { onlineUsers, updatePresence }
}

// Hook for real-time notifications
export function useRealtimeNotifications() {
  const { subscribe } = useRealtime()
  const [notifications, setNotifications] = useState<any[]>([])

  useEffect(() => {
    const unsubscribe = subscribe('notifications', (payload) => {
      devLog('Notification:', payload);
      
      if (payload.eventType === 'INSERT') {
        setNotifications(prev => [payload.new, ...prev])
        
        // Show browser notification if permission granted
        if (Notification.permission === 'granted') {
          new Notification(payload.new.title || 'New Notification', {
            body: payload.new.message,
            icon: '/favicon.ico'
          })
        }
      }
    })

    return unsubscribe
  }, [subscribe])

  const clearNotifications = useCallback(() => {
    setNotifications([])
  }, [])

  return { notifications, clearNotifications }
}

// Hook for real-time project updates
export function useRealtimeProjects(onUpdate?: (payload: RealtimePostgresChangesPayload<any>) => void) {
  const { subscribe } = useRealtime()
  
  useEffect(() => {
    const unsubscribe = subscribe('projects', (payload) => {
      devLog('Project change:', payload);
      if (onUpdate) {
        onUpdate(payload)
      }
    })

    return unsubscribe
  }, [subscribe, onUpdate])
}

// Hook for real-time task updates
export function useRealtimeTasks(onUpdate?: (payload: RealtimePostgresChangesPayload<any>) => void) {
  const { subscribe } = useRealtime()
  
  useEffect(() => {
    const unsubscribe = subscribe('tasks', (payload) => {
      devLog('Task change:', payload);
      if (onUpdate) {
        onUpdate(payload)
      }
    })

    return unsubscribe
  }, [subscribe, onUpdate])
}

// Hook for real-time attendance updates
export function useRealtimeAttendance(onUpdate?: (payload: RealtimePostgresChangesPayload<any>) => void) {
  const { subscribe } = useRealtime()
  
  useEffect(() => {
    const unsubscribe = subscribe('attendance', (payload) => {
      devLog('Attendance change:', payload);
      if (onUpdate) {
        onUpdate(payload)
      }
    })

    return unsubscribe
  }, [subscribe, onUpdate])
}