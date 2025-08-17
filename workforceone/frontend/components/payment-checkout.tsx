'use client'

import { useState, useEffect } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import {
  Elements,
  CardElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { 
  CreditCard, Lock, CheckCircle, AlertCircle, 
  Loader2, Shield, Calendar, Users 
} from 'lucide-react'
import { formatPrice } from '@/lib/currency-utils'
import { useSubscription } from '@/lib/feature-access'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

interface PaymentFormProps {
  organizationId: string
  selectedFeatures: string[]
  userCount: number
  billingPeriod: 'monthly' | 'yearly'
  amount: number
  userCurrency: any
  onSuccess: () => void
  onCancel: () => void
}

function PaymentForm({
  organizationId,
  selectedFeatures,
  userCount,
  billingPeriod,
  amount,
  userCurrency,
  onSuccess,
  onCancel
}: PaymentFormProps) {
  const stripe = useStripe()
  const elements = useElements()
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [clientSecret, setClientSecret] = useState<string>('')

  useEffect(() => {
    // Create payment intent when component mounts
    createPaymentIntent()
  }, [])

  const createPaymentIntent = async () => {
    try {
      const response = await fetch('/api/stripe/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId,
          selectedFeatures,
          userCount,
          billingPeriod
        })
      })

      const data = await response.json()
      if (data.clientSecret) {
        setClientSecret(data.clientSecret)
      } else {
        setError('Failed to initialize payment')
      }
    } catch (err) {
      setError('Failed to create payment intent')
    }
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!stripe || !elements || !clientSecret) {
      return
    }

    setProcessing(true)
    setError(null)

    const cardElement = elements.getElement(CardElement)
    if (!cardElement) return

    const { error: confirmError, paymentIntent } = await stripe.confirmCardPayment(
      clientSecret,
      {
        payment_method: {
          card: cardElement,
        }
      }
    )

    if (confirmError) {
      setError(confirmError.message || 'Payment failed')
      setProcessing(false)
    } else if (paymentIntent.status === 'succeeded') {
      onSuccess()
    }
  }

  const cardElementOptions = {
    style: {
      base: {
        fontSize: '16px',
        color: '#424770',
        '::placeholder': {
          color: '#aab7c4',
        },
      },
    },
  }

  return (
    <div className="max-w-md mx-auto space-y-6">
      {/* Order Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5" />
            <span>Order Summary</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Team Size</span>
            <span className="font-medium">{userCount} users</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Features</span>
            <span className="font-medium">{selectedFeatures.length} premium</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-600">Billing Period</span>
            <div className="flex items-center space-x-2">
              <span className="font-medium">{billingPeriod}</span>
              {billingPeriod === 'yearly' && (
                <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                  Save 20%
                </Badge>
              )}
            </div>
          </div>
          <div className="border-t pt-3">
            <div className="flex justify-between">
              <span className="font-semibold">Total</span>
              <span className="font-bold text-lg">
                {formatPrice(amount, userCurrency)}/{billingPeriod === 'yearly' ? 'year' : 'month'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <CreditCard className="h-5 w-5" />
            <span>Payment Details</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="p-3 border rounded-lg">
              <CardElement options={cardElementOptions} />
            </div>

            {error && (
              <Alert className="border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-700">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            <div className="flex items-center space-x-2 text-xs text-gray-600">
              <Shield className="h-3 w-3" />
              <span>Secured by Stripe. Your card details are encrypted and secure.</span>
            </div>

            <div className="flex space-x-3">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={processing}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!stripe || processing}
                className="flex-1"
              >
                {processing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Lock className="h-4 w-4 mr-2" />
                    Pay {formatPrice(amount, userCurrency)}
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

export function PaymentCheckout(props: PaymentFormProps) {
  return (
    <Elements stripe={stripePromise}>
      <PaymentForm {...props} />
    </Elements>
  )
}