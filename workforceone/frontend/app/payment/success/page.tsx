'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  CheckCircle, ArrowRight, Calendar, Users, Package,
  CreditCard, Download, Mail, Star 
} from 'lucide-react'
import { useSubscription } from '@/lib/feature-access'
import { formatPrice } from '@/lib/currency-utils'

export default function PaymentSuccessPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { subscription, refresh } = useSubscription()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Refresh subscription data after payment
    const timer = setTimeout(() => {
      refresh()
      setLoading(false)
    }, 2000) // Give webhook time to process

    return () => clearTimeout(timer)
  }, [refresh])

  const paymentIntent = searchParams.get('payment_intent')
  const redirectStatus = searchParams.get('redirect_status')

  if (redirectStatus !== 'succeeded') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="max-w-md w-full">
          <CardContent className="text-center p-6">
            <div className="text-red-600 mb-4">
              <svg className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">Payment Failed</h1>
            <p className="text-gray-600 mb-4">
              There was an issue processing your payment. Please try again.
            </p>
            <Button onClick={() => router.push('/dashboard/subscription')}>
              Return to Subscription
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
      <div className="max-w-2xl mx-auto space-y-6 pt-8">
        {/* Success Header */}
        <Card className="border-green-200 bg-green-50">
          <CardContent className="text-center p-8">
            <div className="text-green-600 mb-4">
              <CheckCircle className="h-20 w-20 mx-auto" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Payment Successful! 🎉
            </h1>
            <p className="text-lg text-gray-600 mb-4">
              Welcome to your premium WorkforceOne experience
            </p>
            <Badge className="bg-green-100 text-green-800 px-4 py-2">
              <Star className="h-4 w-4 mr-1" />
              Premium Account Active
            </Badge>
          </CardContent>
        </Card>

        {/* Subscription Details */}
        {subscription && !loading && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Package className="h-5 w-5" />
                <span>Your Subscription</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <Users className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-blue-900">{subscription.user_count}</div>
                  <div className="text-sm text-blue-600">Team Members</div>
                </div>
                
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <Package className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-purple-900">
                    {subscription.features?.length || 0}
                  </div>
                  <div className="text-sm text-purple-600">Premium Features</div>
                </div>
                
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <CreditCard className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-green-900">
                    ${subscription.monthly_total}
                  </div>
                  <div className="text-sm text-green-600">
                    Per {subscription.billing_period === 'yearly' ? 'Year' : 'Month'}
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-medium text-gray-900 mb-2">Active Features:</h4>
                <div className="flex flex-wrap gap-2">
                  {subscription.features?.map((feature: string) => (
                    <Badge key={feature} variant="outline" className="bg-blue-50">
                      {feature.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Next Steps */}
        <Card>
          <CardHeader>
            <CardTitle>What's Next?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <div className="bg-blue-100 p-2 rounded-full">
                  <Package className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <div className="font-medium">Explore Premium Features</div>
                  <div className="text-sm text-gray-600">
                    Start using advanced analytics, AI form scanner, and more
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <div className="bg-green-100 p-2 rounded-full">
                  <Mail className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <div className="font-medium">Check Your Email</div>
                  <div className="text-sm text-gray-600">
                    Receipt and subscription details sent to your email
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <div className="bg-purple-100 p-2 rounded-full">
                  <Download className="h-4 w-4 text-purple-600" />
                </div>
                <div>
                  <div className="font-medium">Download Mobile App</div>
                  <div className="text-sm text-gray-600">
                    Get the full experience on iOS and Android
                  </div>
                </div>
              </div>
            </div>

            <div className="flex space-x-3 pt-4">
              <Button 
                onClick={() => router.push('/dashboard')}
                className="flex-1"
              >
                Go to Dashboard
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
              <Button 
                variant="outline" 
                onClick={() => router.push('/dashboard/subscription')}
              >
                Manage Subscription
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Support */}
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="text-center p-6">
            <h3 className="font-bold text-blue-900 mb-2">Need Help?</h3>
            <p className="text-blue-700 text-sm mb-4">
              Our support team is here to help you get the most out of WorkforceOne
            </p>
            <Button variant="outline" className="text-blue-700 border-blue-300">
              Contact Support
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}