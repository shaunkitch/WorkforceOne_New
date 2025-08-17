'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { 
  Clock, Calendar, CreditCard, Gift, Sparkles, 
  AlertTriangle, CheckCircle, X 
} from 'lucide-react'
import { useSubscription } from '@/lib/feature-access'
import { formatPrice } from '@/lib/currency-utils'
import { createClient } from '@/lib/supabase/client'

interface TrialNotificationProps {
  onStartPayment: () => void
  onExtendTrial?: () => void
  userCurrency: any
}

export function TrialNotification({ 
  onStartPayment, 
  onExtendTrial, 
  userCurrency 
}: TrialNotificationProps) {
  const { subscription, status, loading } = useSubscription()
  const [dismissed, setDismissed] = useState(false)
  const [extensionUsed, setExtensionUsed] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    checkExtensionUsage()
  }, [])

  const checkExtensionUsage = async () => {
    if (!subscription?.organization_id) return

    const { data } = await supabase
      .from('subscriptions')
      .select('metadata')
      .eq('organization_id', subscription.organization_id)
      .single()

    const metadata = data?.metadata || {}
    setExtensionUsed(metadata.extension_used === true)
  }

  const handleExtendTrial = async () => {
    if (!subscription?.organization_id || extensionUsed) return

    try {
      const { error } = await supabase
        .from('subscriptions')
        .update({
          trial_ends_at: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
          metadata: { extension_used: true },
          updated_at: new Date().toISOString()
        })
        .eq('organization_id', subscription.organization_id)

      if (!error) {
        setExtensionUsed(true)
        if (onExtendTrial) onExtendTrial()
      }
    } catch (error) {
      console.error('Error extending trial:', error)
    }
  }

  if (loading || dismissed || !status?.isTrial) return null

  const daysRemaining = status.daysRemaining
  const isUrgent = daysRemaining <= 3
  const isExpired = daysRemaining <= 0

  return (
    <Card className={`mb-6 border-2 ${
      isExpired ? 'border-red-200 bg-red-50' : 
      isUrgent ? 'border-orange-200 bg-orange-50' : 
      'border-blue-200 bg-blue-50'
    }`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3 flex-1">
            <div className={`p-2 rounded-full ${
              isExpired ? 'bg-red-100' : 
              isUrgent ? 'bg-orange-100' : 
              'bg-blue-100'
            }`}>
              {isExpired ? (
                <AlertTriangle className={`h-5 w-5 text-red-600`} />
              ) : (
                <Clock className={`h-5 w-5 ${
                  isUrgent ? 'text-orange-600' : 'text-blue-600'
                }`} />
              )}
            </div>
            
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-1">
                <Badge variant="outline" className={
                  isExpired ? 'border-red-200 text-red-700' : 
                  isUrgent ? 'border-orange-200 text-orange-700' : 
                  'border-blue-200 text-blue-700'
                }>
                  <Sparkles className="h-3 w-3 mr-1" />
                  Free Trial
                </Badge>
                
                {!isExpired && (
                  <span className={`text-sm font-medium ${
                    isUrgent ? 'text-orange-700' : 'text-blue-700'
                  }`}>
                    {daysRemaining} {daysRemaining === 1 ? 'day' : 'days'} remaining
                  </span>
                )}
              </div>
              
              <p className={`text-sm ${
                isExpired ? 'text-red-700' : 
                isUrgent ? 'text-orange-700' : 
                'text-blue-700'
              }`}>
                {isExpired ? (
                  'Your free trial has expired. Upgrade now to continue using premium features.'
                ) : isUrgent ? (
                  'Your free trial is ending soon. Upgrade now to avoid any service interruption.'
                ) : (
                  'You\'re currently on a free trial with access to all premium features.'
                )}
              </p>

              {/* One-time extension offer */}
              {!extensionUsed && !isExpired && daysRemaining <= 5 && (
                <div className="mt-2 p-2 bg-white rounded-lg border border-green-200">
                  <div className="flex items-center space-x-2">
                    <Gift className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-green-700">
                      Special Offer: Get 10 more days free!
                    </span>
                  </div>
                  <p className="text-xs text-green-600 mt-1">
                    One-time extension available. No credit card required.
                  </p>
                </div>
              )}
            </div>
          </div>
          
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setDismissed(true)}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-gray-500" />
            <span className="text-xs text-gray-600">
              Trial {isExpired ? 'expired' : 'ends'}: {
                new Date(subscription?.trial_ends_at || '').toLocaleDateString()
              }
            </span>
          </div>

          <div className="flex space-x-2">
            {/* Extension button */}
            {!extensionUsed && !isExpired && daysRemaining <= 5 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleExtendTrial}
                className="text-green-700 border-green-200 hover:bg-green-50"
              >
                <Gift className="h-3 w-3 mr-1" />
                Extend 10 Days
              </Button>
            )}

            {/* Upgrade button */}
            <Button
              onClick={onStartPayment}
              size="sm"
              className={
                isExpired ? 'bg-red-600 hover:bg-red-700' : 
                isUrgent ? 'bg-orange-600 hover:bg-orange-700' : 
                'bg-blue-600 hover:bg-blue-700'
              }
            >
              <CreditCard className="h-3 w-3 mr-1" />
              {isExpired ? 'Reactivate Account' : 'Upgrade Now'}
            </Button>
          </div>
        </div>

        {/* Pricing preview */}
        {subscription?.monthly_total && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Your plan:</span>
              <span className="font-medium">
                {formatPrice(subscription.monthly_total, userCurrency)}/month
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}