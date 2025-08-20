'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js'

interface RealtimeContextType {
  isConnected: boolean
  subscribe: (table: string, callback: (payload: RealtimePostgresChangesPayload<any>) => void) => () => void
  unsubscribe: (table: string) => void
  broadcastMessage: (channel: string, event: string, payload: any) => void
  subscribeToPresence: (channel: string, callback: (payload: any) => void) => () => void
}

const RealtimeContext = createContext<RealtimeContextType | undefined>(undefined)

interface RealtimeProviderProps {
  children: React.ReactNode
}

export function RealtimeProvider({ children }: RealtimeProviderProps) {
  const [isConnected, setIsConnected] = useState(false)
  const [channels, setChannels] = useState<Map<string, RealtimeChannel>>(new Map())
  const supabase = createClient()

  useEffect(() => {
    // Listen for connection status changes
    supabase.realtime.onOpen(() => {
      console.log('Realtime connected')
      setIsConnected(true)
    })

    supabase.realtime.onClose(() => {
      console.log('Realtime disconnected')
      setIsConnected(false)
    })

    return () => {
      // Cleanup all channels on unmount
      channels.forEach(channel => {
        supabase.removeChannel(channel)
      })
    }
  }, [])

  const subscribe = (table: string, callback: (payload: RealtimePostgresChangesPayload<any>) => void) => {
    const channelName = `${table}_changes`
    
    // Remove existing channel if it exists
    const existingChannel = channels.get(channelName)
    if (existingChannel) {
      supabase.removeChannel(existingChannel)
    }

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: table 
        },
        callback
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log(`Subscribed to ${table} changes`)
        }
      })

    setChannels(prev => new Map(prev).set(channelName, channel))

    // Return unsubscribe function
    return () => {
      supabase.removeChannel(channel)
      setChannels(prev => {
        const newChannels = new Map(prev)
        newChannels.delete(channelName)
        return newChannels
      })
    }
  }

  const unsubscribe = (table: string) => {
    const channelName = `${table}_changes`
    const channel = channels.get(channelName)
    
    if (channel) {
      supabase.removeChannel(channel)
      setChannels(prev => {
        const newChannels = new Map(prev)
        newChannels.delete(channelName)
        return newChannels
      })
    }
  }

  const broadcastMessage = (channelName: string, event: string, payload: any) => {
    let channel = channels.get(channelName)
    
    if (!channel) {
      channel = supabase
        .channel(channelName)
        .subscribe()
      
      setChannels(prev => new Map(prev).set(channelName, channel))
    }

    channel.send({
      type: 'broadcast',
      event: event,
      payload: payload
    })
  }

  const subscribeToPresence = (channelName: string, callback: (payload: any) => void) => {
    const channel = supabase
      .channel(channelName)
      .on('presence', { event: 'sync' }, callback)
      .on('presence', { event: 'join' }, callback)
      .on('presence', { event: 'leave' }, callback)
      .subscribe()

    setChannels(prev => new Map(prev).set(channelName, channel))

    return () => {
      supabase.removeChannel(channel)
      setChannels(prev => {
        const newChannels = new Map(prev)
        newChannels.delete(channelName)
        return newChannels
      })
    }
  }

  const value: RealtimeContextType = {
    isConnected,
    subscribe,
    unsubscribe,
    broadcastMessage,
    subscribeToPresence
  }

  return (
    <RealtimeContext.Provider value={value}>
      {children}
    </RealtimeContext.Provider>
  )
}

export const useRealtime = () => {
  const context = useContext(RealtimeContext)
  if (context === undefined) {
    throw new Error('useRealtime must be used within a RealtimeProvider')
  }
  return context
}