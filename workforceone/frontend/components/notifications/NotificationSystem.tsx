'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Bell,
  X,
  Check,
  AlertCircle,
  Calendar,
  FileText,
  Users,
  Clock,
  CheckCircle,
  Info
} from 'lucide-react'
import { format, parseISO } from 'date-fns'

interface Notification {
  id: string
  title: string
  message: string
  type: 'general' | 'attendance' | 'leave' | 'task' | 'form' | 'reminder'
  priority: 'low' | 'normal' | 'high' | 'urgent'
  is_read: boolean
  is_dismissed: boolean
  action_url?: string
  created_at: string
  sender?: {
    full_name: string
    role: string
  }
}

interface NotificationSystemProps {
  className?: string
  showInline?: boolean
  maxItems?: number
}

export default function NotificationSystem({ 
  className = '', 
  showInline = false, 
  maxItems = 10 
}: NotificationSystemProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [showDropdown, setShowDropdown] = useState(false)
  
  const supabase = createClient()

  useEffect(() => {
    fetchCurrentUser()
  }, [])

  useEffect(() => {
    if (currentUser) {
      fetchNotifications()
      
      // Set up real-time subscription for new notifications
      const subscription = supabase
        .channel('notifications')
        .on('postgres_changes', 
          { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'notifications',
            filter: `recipient_id=eq.${currentUser.id}`
          }, 
          (payload) => {
            const newNotification = payload.new as Notification
            setNotifications(prev => [newNotification, ...prev])
          }
        )
        .subscribe()

      return () => {
        subscription.unsubscribe()
      }
    }
  }, [currentUser])

  const fetchCurrentUser = async () => {
    try {
      const { data: user } = await supabase.auth.getUser()
      if (user.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.user.id)
          .single()
        
        setCurrentUser({ ...user.user, profile })
      }
    } catch (error) {
      console.error('Error fetching current user:', error)
    }
  }

  const fetchNotifications = async () => {
    if (!currentUser?.id) return

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('notifications')
        .select(`
          *,
          sender:sender_id (
            full_name,
            role
          )
        `)
        .eq('recipient_id', currentUser.id)
        .eq('is_dismissed', false)
        .order('created_at', { ascending: false })
        .limit(maxItems)

      if (error) throw error
      setNotifications(data || [])
    } catch (error) {
      console.error('Error fetching notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId)

      if (error) throw error

      setNotifications(prev =>
        prev.map(notif =>
          notif.id === notificationId ? { ...notif, is_read: true } : notif
        )
      )
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const dismissNotification = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_dismissed: true })
        .eq('id', notificationId)

      if (error) throw error

      setNotifications(prev =>
        prev.filter(notif => notif.id !== notificationId)
      )
    } catch (error) {
      console.error('Error dismissing notification:', error)
    }
  }

  const markAllAsRead = async () => {
    try {
      const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id)
      if (unreadIds.length === 0) return

      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .in('id', unreadIds)

      if (error) throw error

      setNotifications(prev =>
        prev.map(notif => ({ ...notif, is_read: true }))
      )
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
    }
  }

  const getNotificationIcon = (type: Notification['type']) => {
    const iconMap = {
      general: Info,
      attendance: Calendar,
      leave: FileText,
      task: CheckCircle,
      form: FileText,
      reminder: Clock
    }
    const IconComponent = iconMap[type] || Info
    return <IconComponent className="h-4 w-4" />
  }

  const getNotificationColor = (type: Notification['type'], priority: Notification['priority']) => {
    if (priority === 'urgent') return 'text-red-600 bg-red-50'
    if (priority === 'high') return 'text-orange-600 bg-orange-50'
    
    const colorMap = {
      general: 'text-blue-600 bg-blue-50',
      attendance: 'text-green-600 bg-green-50',
      leave: 'text-purple-600 bg-purple-50',
      task: 'text-indigo-600 bg-indigo-50',
      form: 'text-cyan-600 bg-cyan-50',
      reminder: 'text-yellow-600 bg-yellow-50'
    }
    return colorMap[type] || 'text-gray-600 bg-gray-50'
  }

  const unreadCount = notifications.filter(n => !n.is_read).length

  if (showInline) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Notifications</h3>
          {unreadCount > 0 && (
            <Button onClick={markAllAsRead} variant="outline" size="sm">
              <Check className="h-4 w-4 mr-2" />
              Mark all read
            </Button>
          )}
        </div>
        
        {loading ? (
          <div className="text-center py-8 text-gray-500">Loading notifications...</div>
        ) : notifications.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No notifications</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {notifications.map((notification) => (
              <Card
                key={notification.id}
                className={`transition-all hover:shadow-md ${
                  !notification.is_read ? 'ring-2 ring-blue-200 bg-blue-50/30' : ''
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start space-x-3">
                    <div className={`p-2 rounded-full ${getNotificationColor(notification.type, notification.priority)}`}>
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="text-sm font-semibold text-gray-900 mb-1">
                            {notification.title}
                          </h4>
                          <p className="text-sm text-gray-600 mb-2">
                            {notification.message}
                          </p>
                          <div className="flex items-center space-x-3 text-xs text-gray-500">
                            <span>{format(parseISO(notification.created_at), 'MMM d, HH:mm')}</span>
                            {notification.sender && (
                              <span>from {notification.sender.full_name}</span>
                            )}
                            <Badge variant="outline" className="text-xs">
                              {notification.type}
                            </Badge>
                            {notification.priority !== 'normal' && (
                              <Badge 
                                variant={notification.priority === 'urgent' ? 'destructive' : 'secondary'}
                                className="text-xs"
                              >
                                {notification.priority}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-1 ml-2">
                          {!notification.is_read && (
                            <Button
                              onClick={() => markAsRead(notification.id)}
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            onClick={() => dismissNotification(notification.id)}
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    )
  }

  // Bell icon for top bar
  return (
    <div className="relative">
      <Button
        onClick={() => setShowDropdown(!showDropdown)}
        variant="ghost"
        size="sm"
        className="relative"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs">
            {unreadCount}
          </Badge>
        )}
      </Button>

      {showDropdown && (
        <div className="absolute right-0 top-full mt-2 w-96 max-h-96 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Notifications</h3>
              {unreadCount > 0 && (
                <Button onClick={markAllAsRead} variant="outline" size="sm">
                  Mark all read
                </Button>
              )}
            </div>
          </div>
          
          {loading ? (
            <div className="p-4 text-center text-gray-500">Loading...</div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center">
              <Bell className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500 text-sm">No notifications</p>
            </div>
          ) : (
            <div className="max-h-64 overflow-y-auto">
              {notifications.slice(0, 5).map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${
                    !notification.is_read ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => !notification.is_read && markAsRead(notification.id)}
                >
                  <div className="flex items-start space-x-3">
                    <div className={`p-1 rounded-full ${getNotificationColor(notification.type, notification.priority)}`}>
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-gray-900">
                        {notification.title}
                      </h4>
                      <p className="text-sm text-gray-600 truncate">
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {format(parseISO(notification.created_at), 'MMM d, HH:mm')}
                      </p>
                    </div>
                    {!notification.is_read && (
                      <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}