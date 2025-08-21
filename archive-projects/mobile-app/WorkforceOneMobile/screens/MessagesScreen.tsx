import React, { useState, useEffect, useCallback } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  RefreshControl,
} from 'react-native'
import { StatusBar } from 'expo-status-bar'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { useFocusEffect } from '@react-navigation/native'

interface Message {
  id: string
  sender_id: string
  recipient_id: string
  subject?: string
  message: string
  message_type: string
  priority: string
  is_read: boolean
  read_at?: string
  created_at: string
  sender?: {
    full_name: string
    role: string
  }
  recipient?: {
    full_name: string
    role: string
  }
}

interface User {
  id: string
  full_name: string
  email: string
  role: string
  department?: string
}

export default function MessagesScreen({ navigation }: any) {
  const { user, profile } = useAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [showCompose, setShowCompose] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [messageSubject, setMessageSubject] = useState('')
  const [messageBody, setMessageBody] = useState('')
  const [sending, setSending] = useState(false)
  const [filter, setFilter] = useState<'all' | 'unread' | 'sent'>('all')

  useFocusEffect(
    useCallback(() => {
      loadMessages()
      loadUsers()
    }, [])
  )

  const loadMessages = async () => {
    if (!user || !profile?.organization_id) return

    try {
      // Get messages where user is sender or recipient
      const { data, error } = await supabase
        .from('in_app_messages')
        .select(`
          *,
          sender:profiles!sender_id(full_name, role),
          recipient:profiles!recipient_id(full_name, role)
        `)
        .eq('organization_id', profile.organization_id)
        .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error loading messages:', error)
        return
      }

      setMessages(data || [])
    } catch (error) {
      console.error('Error loading messages:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const loadUsers = async () => {
    if (!user || !profile?.organization_id) return

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, role, department')
        .eq('organization_id', profile.organization_id)
        .eq('is_active', true)
        .neq('id', user.id) // Exclude current user
        .order('full_name')

      if (error) {
        console.error('Error loading users:', error)
        return
      }

      setUsers(data || [])
    } catch (error) {
      console.error('Error loading users:', error)
    }
  }

  const onRefresh = () => {
    setRefreshing(true)
    loadMessages()
  }

  const sendMessage = async () => {
    if (!selectedUser || !messageBody.trim()) {
      Alert.alert('Error', 'Please select a recipient and enter a message.')
      return
    }

    setSending(true)
    try {
      const { error } = await supabase
        .from('in_app_messages')
        .insert({
          sender_id: user?.id,
          recipient_id: selectedUser.id,
          organization_id: profile?.organization_id,
          subject: messageSubject.trim() || null,
          message: messageBody.trim(),
          message_type: 'direct',
          priority: 'normal'
        })

      if (error) throw error

      // Reset form
      setSelectedUser(null)
      setMessageSubject('')
      setMessageBody('')
      setShowCompose(false)

      // Reload messages
      await loadMessages()
      
      Alert.alert('Success', 'Message sent successfully!')
    } catch (error: any) {
      console.error('Error sending message:', error)
      Alert.alert('Error', error.message || 'Failed to send message')
    } finally {
      setSending(false)
    }
  }

  const markAsRead = async (messageId: string) => {
    try {
      const { error } = await supabase
        .from('in_app_messages')
        .update({
          is_read: true,
          read_at: new Date().toISOString()
        })
        .eq('id', messageId)
        .eq('recipient_id', user?.id)

      if (error) throw error

      // Update local state
      setMessages(prev => 
        prev.map(msg => 
          msg.id === messageId 
            ? { ...msg, is_read: true, read_at: new Date().toISOString() }
            : msg
        )
      )
    } catch (error) {
      console.error('Error marking message as read:', error)
    }
  }

  const handleMessagePress = (message: Message) => {
    // Mark as read if it's received and unread
    if (message.recipient_id === user?.id && !message.is_read) {
      markAsRead(message.id)
    }

    // Show message details
    Alert.alert(
      message.subject || 'Message',
      message.message,
      [
        { text: 'Close', style: 'cancel' },
        ...(message.sender_id !== user?.id ? [{
          text: 'Reply',
          onPress: () => {
            const sender = users.find(u => u.id === message.sender_id)
            if (sender) {
              setSelectedUser(sender)
              setMessageSubject(`Re: ${message.subject || 'Message'}`)
              setShowCompose(true)
            }
          }
        }] : [])
      ]
    )
  }

  const getFilteredMessages = () => {
    switch (filter) {
      case 'unread':
        return messages.filter(m => m.recipient_id === user?.id && !m.is_read)
      case 'sent':
        return messages.filter(m => m.sender_id === user?.id)
      default:
        return messages
    }
  }

  const getMessageCounts = () => {
    return {
      all: messages.length,
      unread: messages.filter(m => m.recipient_id === user?.id && !m.is_read).length,
      sent: messages.filter(m => m.sender_id === user?.id).length
    }
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffHours / 24)

    if (diffHours < 1) return 'Just now'
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return '#ef4444'
      case 'high': return '#f97316'
      case 'normal': return '#3b82f6'
      case 'low': return '#6b7280'
      default: return '#6b7280'
    }
  }

  const filteredMessages = getFilteredMessages()
  const counts = getMessageCounts()

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Messages</Text>
          <Text style={styles.headerSubtitle}>
            {counts.unread} unread messages
          </Text>
        </View>
        <TouchableOpacity 
          style={styles.composeButton}
          onPress={() => setShowCompose(true)}
        >
          <Ionicons name="add" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {[
            { key: 'all', label: `All (${counts.all})` },
            { key: 'unread', label: `Unread (${counts.unread})` },
            { key: 'sent', label: `Sent (${counts.sent})` },
          ].map((item) => (
            <TouchableOpacity
              key={item.key}
              style={[
                styles.filterTab,
                filter === item.key && styles.filterTabActive
              ]}
              onPress={() => setFilter(item.key as any)}
            >
              <Text style={[
                styles.filterTabText,
                filter === item.key && styles.filterTabTextActive
              ]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Messages List */}
      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading messages...</Text>
          </View>
        ) : filteredMessages.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="mail-outline" size={64} color="#d1d5db" />
            <Text style={styles.emptyText}>No messages</Text>
            <Text style={styles.emptySubtext}>
              {filter === 'unread' 
                ? "No unread messages" 
                : filter === 'sent'
                ? "No sent messages"
                : "Start a conversation with your team"}
            </Text>
          </View>
        ) : (
          <View style={styles.messagesList}>
            {filteredMessages.map((message) => {
              const isReceived = message.recipient_id === user?.id
              const contact = isReceived ? message.sender : message.recipient
              
              return (
                <TouchableOpacity
                  key={message.id}
                  style={[
                    styles.messageCard,
                    isReceived && !message.is_read && styles.unreadCard
                  ]}
                  onPress={() => handleMessagePress(message)}
                >
                  <View style={styles.messageHeader}>
                    <View style={styles.messageMeta}>
                      <View style={styles.contactInfo}>
                        <Text style={styles.contactName}>
                          {isReceived ? 'From: ' : 'To: '}{contact?.full_name}
                        </Text>
                        <Text style={styles.contactRole}>{contact?.role}</Text>
                      </View>
                      <View 
                        style={[
                          styles.priorityDot, 
                          { backgroundColor: getPriorityColor(message.priority) }
                        ]} 
                      />
                    </View>
                    <View style={styles.messageInfo}>
                      <Text style={styles.timeText}>
                        {formatTime(message.created_at)}
                      </Text>
                      {isReceived && !message.is_read && (
                        <View style={styles.unreadDot} />
                      )}
                    </View>
                  </View>
                  
                  {message.subject && (
                    <Text style={styles.messageSubject} numberOfLines={1}>
                      {message.subject}
                    </Text>
                  )}
                  
                  <Text style={styles.messagePreview} numberOfLines={2}>
                    {message.message}
                  </Text>
                  
                  <View style={styles.messageFooter}>
                    <View style={styles.messageIcons}>
                      <Ionicons 
                        name={isReceived ? "arrow-down" : "arrow-up"} 
                        size={14} 
                        color="#6b7280" 
                      />
                      {message.message_type === 'announcement' && (
                        <Ionicons name="megaphone" size={14} color="#f59e0b" />
                      )}
                    </View>
                    <Ionicons name="chevron-forward" size={16} color="#9ca3af" />
                  </View>
                </TouchableOpacity>
              )
            })}
          </View>
        )}
        
        {/* Bottom spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Compose Message Modal */}
      <Modal
        visible={showCompose}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowCompose(false)}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>New Message</Text>
            <TouchableOpacity 
              onPress={sendMessage}
              disabled={sending || !selectedUser || !messageBody.trim()}
            >
              <Text style={[
                styles.modalSendText,
                (!selectedUser || !messageBody.trim()) && styles.modalSendTextDisabled
              ]}>
                {sending ? 'Sending...' : 'Send'}
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {/* Recipient Selection */}
            <View style={styles.formSection}>
              <Text style={styles.formLabel}>To:</Text>
              <TouchableOpacity
                style={styles.recipientSelector}
                onPress={() => {
                  Alert.alert(
                    'Select Recipient',
                    'Choose who to send this message to:',
                    users.map(user => ({
                      text: `${user.full_name} (${user.role})`,
                      onPress: () => setSelectedUser(user)
                    })).concat([{ text: 'Cancel', style: 'cancel' }])
                  )
                }}
              >
                <Text style={[
                  styles.recipientText,
                  !selectedUser && styles.placeholderText
                ]}>
                  {selectedUser ? `${selectedUser.full_name} (${selectedUser.role})` : 'Select recipient...'}
                </Text>
                <Ionicons name="chevron-down" size={20} color="#6b7280" />
              </TouchableOpacity>
            </View>

            {/* Subject */}
            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Subject (Optional):</Text>
              <TextInput
                style={styles.textInput}
                value={messageSubject}
                onChangeText={setMessageSubject}
                placeholder="Enter subject..."
                placeholderTextColor="#9ca3af"
              />
            </View>

            {/* Message */}
            <View style={styles.formSection}>
              <Text style={styles.formLabel}>Message:</Text>
              <TextInput
                style={[styles.textInput, styles.messageInput]}
                value={messageBody}
                onChangeText={setMessageBody}
                placeholder="Type your message here..."
                placeholderTextColor="#9ca3af"
                multiline
                numberOfLines={8}
                textAlignVertical="top"
              />
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    backgroundColor: '#3b82f6',
    paddingTop: 30,
    paddingHorizontal: 20,
    paddingBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    color: '#93c5fd',
    fontSize: 14,
    marginTop: 2,
  },
  composeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterContainer: {
    backgroundColor: 'white',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 4,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
  },
  filterTabActive: {
    backgroundColor: '#3b82f6',
  },
  filterTabText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  filterTabTextActive: {
    color: 'white',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    color: '#6b7280',
    fontSize: 16,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    fontSize: 18,
    color: '#9ca3af',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    paddingHorizontal: 40,
    lineHeight: 20,
  },
  messagesList: {
    gap: 12,
  },
  messageCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  unreadCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  messageMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  contactRole: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  priorityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  messageInfo: {
    alignItems: 'flex-end',
    gap: 4,
  },
  timeText: {
    fontSize: 12,
    color: '#6b7280',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3b82f6',
  },
  messageSubject: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  messagePreview: {
    fontSize: 14,
    color: '#6b7280',
    lineHeight: 20,
    marginBottom: 12,
  },
  messageFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  messageIcons: {
    flexDirection: 'row',
    gap: 8,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  modalHeader: {
    backgroundColor: 'white',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalCancelText: {
    fontSize: 16,
    color: '#6b7280',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  modalSendText: {
    fontSize: 16,
    color: '#3b82f6',
    fontWeight: '600',
  },
  modalSendTextDisabled: {
    color: '#9ca3af',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  formSection: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  recipientSelector: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  recipientText: {
    fontSize: 16,
    color: '#111827',
    flex: 1,
  },
  placeholderText: {
    color: '#9ca3af',
  },
  textInput: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#111827',
  },
  messageInput: {
    height: 120,
    textAlignVertical: 'top',
  },
  bottomSpacing: {
    height: 100,
  },
})