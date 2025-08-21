import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'

interface Payslip {
  id: string
  pay_period_start: string
  pay_period_end: string
  gross_pay: number
  net_pay: number
  tax_deductions: number
  other_deductions: number
  status: 'draft' | 'processed' | 'paid'
  created_at: string
  pay_date?: string
}

export default function PayslipsScreen() {
  const { user, profile } = useAuth()
  const [payslips, setPayslips] = useState<Payslip[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    fetchPayslips()
  }, [])

  const fetchPayslips = async () => {
    if (!user?.id) return

    try {
      const { data, error } = await supabase
        .from('payslips')
        .select('*')
        .eq('user_id', user.id)
        .order('pay_period_end', { ascending: false })

      if (error) throw error

      setPayslips(data || [])
    } catch (error) {
      console.error('Error fetching payslips:', error)
      Alert.alert('Error', 'Failed to load payslips')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const onRefresh = () => {
    setRefreshing(true)
    fetchPayslips()
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return '#10b981'
      case 'processed': return '#3b82f6'
      case 'draft': return '#f59e0b'
      default: return '#6b7280'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid': return 'checkmark-circle'
      case 'processed': return 'time'
      case 'draft': return 'document-text'
      default: return 'help-circle'
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const handlePayslipPress = (payslip: Payslip) => {
    Alert.alert(
      'Payslip Details',
      `Pay Period: ${formatDate(payslip.pay_period_start)} - ${formatDate(payslip.pay_period_end)}\n\nGross Pay: ${formatCurrency(payslip.gross_pay)}\nTax Deductions: ${formatCurrency(payslip.tax_deductions)}\nOther Deductions: ${formatCurrency(payslip.other_deductions)}\nNet Pay: ${formatCurrency(payslip.net_pay)}\n\nStatus: ${payslip.status.toUpperCase()}${payslip.pay_date ? `\nPay Date: ${formatDate(payslip.pay_date)}` : ''}`,
      [
        { text: 'Close', style: 'cancel' },
        { 
          text: 'Download PDF', 
          onPress: () => Alert.alert('Feature Coming Soon', 'PDF download will be available in a future update.')
        }
      ]
    )
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Loading payslips...</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Payslips</Text>
        <Text style={styles.headerSubtitle}>View your pay history</Text>
      </LinearGradient>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {payslips.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="document-text-outline" size={64} color="#d1d5db" />
            <Text style={styles.emptyTitle}>No payslips available</Text>
            <Text style={styles.emptyText}>Your payslips will appear here once processed</Text>
          </View>
        ) : (
          <View style={styles.payslipsList}>
            {payslips.map((payslip) => (
              <TouchableOpacity
                key={payslip.id}
                style={styles.payslipCard}
                onPress={() => handlePayslipPress(payslip)}
              >
                <View style={styles.payslipHeader}>
                  <View style={styles.payslipInfo}>
                    <Text style={styles.payPeriod}>
                      {formatDate(payslip.pay_period_start)} - {formatDate(payslip.pay_period_end)}
                    </Text>
                    <Text style={styles.netPay}>{formatCurrency(payslip.net_pay)}</Text>
                    <Text style={styles.grossPay}>
                      Gross: {formatCurrency(payslip.gross_pay)}
                    </Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(payslip.status) }]}>
                    <Ionicons name={getStatusIcon(payslip.status)} size={16} color="white" />
                    <Text style={styles.statusText}>{payslip.status}</Text>
                  </View>
                </View>

                <View style={styles.payslipFooter}>
                  <View style={styles.deductionsSection}>
                    <Text style={styles.deductionsLabel}>Deductions:</Text>
                    <Text style={styles.deductionsAmount}>
                      {formatCurrency(payslip.tax_deductions + payslip.other_deductions)}
                    </Text>
                  </View>
                  
                  {payslip.pay_date && (
                    <Text style={styles.payDate}>
                      Paid: {formatDate(payslip.pay_date)}
                    </Text>
                  )}
                </View>

                <View style={styles.viewMoreIndicator}>
                  <Text style={styles.viewMoreText}>Tap for details</Text>
                  <Ionicons name="chevron-forward" size={16} color="#9ca3af" />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
  },
  loadingText: {
    marginTop: 12,
    color: '#6b7280',
    fontSize: 16,
  },
  header: {
    paddingTop: 30,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerTitle: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    color: '#93c5fd',
    fontSize: 16,
    marginTop: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#374151',
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 8,
    textAlign: 'center',
  },
  payslipsList: {
    paddingBottom: 20,
  },
  payslipCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  payslipHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  payslipInfo: {
    flex: 1,
    marginRight: 12,
  },
  payPeriod: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },
  netPay: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#10b981',
    marginBottom: 2,
  },
  grossPay: {
    fontSize: 14,
    color: '#6b7280',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
    marginLeft: 4,
  },
  payslipFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  deductionsSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deductionsLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginRight: 8,
  },
  deductionsAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ef4444',
  },
  payDate: {
    fontSize: 12,
    color: '#9ca3af',
    fontStyle: 'italic',
  },
  viewMoreIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  viewMoreText: {
    fontSize: 12,
    color: '#9ca3af',
    marginRight: 4,
  },
})