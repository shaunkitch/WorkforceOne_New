'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { getUserProducts, getUser } from '@/lib/supabase'
import { PRODUCTS, type ProductId } from '@/lib/products'
import { 
  ArrowLeft, CreditCard, Check, Star, 
  Building, Clock, Shield, Zap 
} from 'lucide-react'

interface PricingPlan {
  id: ProductId
  name: string
  description: string
  price: number
  features: string[]
  popular?: boolean
}

export default function BillingPage() {
  const [userProducts, setUserProducts] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const router = useRouter()

  useEffect(() => {
    loadUserData()
  }, [])

  const loadUserData = async () => {
    try {
      const { user } = await getUser()
      if (!user) {
        router.push('/')
        return
      }

      const products = await getUserProducts()
      setUserProducts(products)
    } catch (err) {
      setError('Failed to load user data')
    } finally {
      setLoading(false)
    }
  }

  const pricingPlans: PricingPlan[] = [
    {
      id: 'workforce-management',
      name: 'Workforce Management',
      description: 'Complete team and project management solution',
      price: 29,
      features: [
        'Employee Management',
        'Project Tracking',
        'Team Collaboration',
        'Attendance Monitoring',
        'Leave Management',
        'Performance Analytics'
      ]
    },
    {
      id: 'time-tracker',
      name: 'Time Tracker',
      description: 'Advanced time tracking and productivity monitoring',
      price: 15,
      popular: true,
      features: [
        'Time Tracking',
        'Project Time Allocation',
        'Productivity Reports',
        'Invoice Generation',
        'Mobile App',
        'Team Timesheets'
      ]
    },
    {
      id: 'guard-management',
      name: 'Guard Management',
      description: 'Complete security operations management',
      price: 39,
      features: [
        'Guard Scheduling',
        'Site Management',
        'Incident Reporting',
        'Route Planning',
        'QR Code Check-ins',
        'Real-time Monitoring'
      ]
    }
  ]

  const handleSubscribe = async (productId: ProductId) => {
    // In a real implementation, this would integrate with Stripe
    alert(`Subscribing to ${PRODUCTS[productId].name}... (Demo mode - integration with Stripe would happen here)`)
  }

  const handleManage = async () => {
    // In a real implementation, this would redirect to Stripe customer portal
    alert('Opening billing portal... (Demo mode - would redirect to Stripe customer portal)')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={() => router.push('/dashboard')}>Return to Dashboard</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-4">
              <Button 
                variant="outline" 
                onClick={() => router.push('/dashboard')}
                className="flex items-center"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
              <div className="flex items-center space-x-3">
                <CreditCard className="h-8 w-8 text-blue-600" />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Billing & Subscriptions</h1>
                  <p className="text-gray-600">Manage your WorkforceOne products</p>
                </div>
              </div>
            </div>
            <Button onClick={handleManage} variant="outline">
              Manage Billing
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Current Subscriptions */}
        <div className="mb-12">
          <h2 className="text-xl font-semibold mb-6">Your Current Subscriptions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {userProducts.map((productId) => {
              const product = PRODUCTS[productId as ProductId]
              const plan = pricingPlans.find(p => p.id === productId)
              if (!product || !plan) return null

              return (
                <Card key={productId} className="relative">
                  <CardHeader>
                    <div className="flex items-center space-x-3">
                      <div 
                        className="p-2 rounded-lg"
                        style={{ backgroundColor: product.color.primary + '20' }}
                      >
                        <product.icon 
                          className="h-6 w-6" 
                          style={{ color: product.color.primary }}
                        />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{product.name}</CardTitle>
                        <p className="text-sm text-muted-foreground">{plan.description}</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-baseline">
                        <span className="text-3xl font-bold">${plan.price}</span>
                        <span className="text-muted-foreground ml-2">/month</span>
                      </div>
                      
                      <Badge className="bg-green-100 text-green-800">
                        <Check className="h-3 w-3 mr-1" />
                        Active
                      </Badge>
                      
                      <div className="space-y-2">
                        {plan.features.slice(0, 3).map((feature, index) => (
                          <div key={index} className="flex items-center text-sm">
                            <Check className="h-4 w-4 text-green-500 mr-2" />
                            {feature}
                          </div>
                        ))}
                        <div className="text-sm text-muted-foreground">
                          +{plan.features.length - 3} more features
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>

        {/* Available Products */}
        <div>
          <h2 className="text-xl font-semibold mb-6">Available Products</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pricingPlans.map((plan) => {
              const product = PRODUCTS[plan.id]
              const isSubscribed = userProducts.includes(plan.id)
              
              return (
                <Card key={plan.id} className={`relative ${plan.popular ? 'ring-2 ring-blue-500' : ''}`}>
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <Badge className="bg-blue-600 text-white px-4 py-1">
                        <Star className="h-3 w-3 mr-1" />
                        Most Popular
                      </Badge>
                    </div>
                  )}
                  
                  <CardHeader>
                    <div className="flex items-center space-x-3">
                      <div 
                        className="p-2 rounded-lg"
                        style={{ backgroundColor: product.color.primary + '20' }}
                      >
                        <product.icon 
                          className="h-6 w-6" 
                          style={{ color: product.color.primary }}
                        />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{plan.name}</CardTitle>
                        <p className="text-sm text-muted-foreground">{plan.description}</p>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-baseline">
                        <span className="text-3xl font-bold">${plan.price}</span>
                        <span className="text-muted-foreground ml-2">/month</span>
                      </div>
                      
                      <div className="space-y-2">
                        {plan.features.map((feature, index) => (
                          <div key={index} className="flex items-center text-sm">
                            <Check className="h-4 w-4 text-green-500 mr-2" />
                            {feature}
                          </div>
                        ))}
                      </div>
                      
                      <Button 
                        onClick={() => handleSubscribe(plan.id)}
                        disabled={isSubscribed}
                        className={`w-full ${
                          isSubscribed 
                            ? 'bg-gray-100 text-gray-500 cursor-not-allowed' 
                            : plan.popular 
                              ? 'bg-blue-600 hover:bg-blue-700' 
                              : ''
                        }`}
                        style={{ 
                          backgroundColor: !isSubscribed && !plan.popular ? product.color.primary : undefined 
                        }}
                      >
                        {isSubscribed ? (
                          <>
                            <Check className="h-4 w-4 mr-2" />
                            Subscribed
                          </>
                        ) : (
                          <>
                            <Zap className="h-4 w-4 mr-2" />
                            Subscribe
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>

        {/* Bundle Offer */}
        <Card className="mt-12 bg-gradient-to-r from-purple-600 to-blue-600 text-white">
          <CardContent className="p-8">
            <div className="text-center">
              <h3 className="text-2xl font-bold mb-4">Complete WorkforceOne Suite</h3>
              <p className="text-lg mb-6 opacity-90">
                Get all three products and save 25%
              </p>
              
              <div className="flex items-center justify-center space-x-4 mb-6">
                <div className="flex items-center space-x-2">
                  <Building className="h-5 w-5" />
                  <span className="text-sm">Workforce</span>
                </div>
                <div className="text-2xl">+</div>
                <div className="flex items-center space-x-2">
                  <Clock className="h-5 w-5" />
                  <span className="text-sm">Time Tracker</span>
                </div>
                <div className="text-2xl">+</div>
                <div className="flex items-center space-x-2">
                  <Shield className="h-5 w-5" />
                  <span className="text-sm">Guard</span>
                </div>
              </div>
              
              <div className="flex items-center justify-center space-x-4 mb-6">
                <span className="text-lg line-through opacity-70">$83/month</span>
                <span className="text-3xl font-bold">$62/month</span>
                <Badge className="bg-white text-purple-600">Save $21</Badge>
              </div>
              
              <Button 
                size="lg" 
                className="bg-white text-purple-600 hover:bg-gray-100"
                onClick={() => alert('Bundle subscription... (Demo mode)')}
              >
                <Star className="h-5 w-5 mr-2" />
                Subscribe to Bundle
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}