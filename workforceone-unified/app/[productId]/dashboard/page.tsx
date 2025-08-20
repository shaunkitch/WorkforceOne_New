'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { getUserProducts, getUser, hasProductAccess, logProductAccess } from '@/lib/supabase'
import { PRODUCTS, type ProductId } from '@/lib/products'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  ArrowLeft, Shield, Clock, Building, Users, BarChart3,
  Activity, Monitor, Target, CheckCircle, AlertTriangle,
  Timer, UserPlus, MapPin, Calendar, Settings
} from 'lucide-react'

export default function ProductDashboardPage() {
  const [userProducts, setUserProducts] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const router = useRouter()
  const params = useParams()
  const productId = params?.productId as ProductId

  const product = PRODUCTS[productId]

  useEffect(() => {
    if (productId) {
      checkProductAccess()
    }
  }, [productId])

  const checkProductAccess = async () => {
    try {
      const { user } = await getUser()
      if (!user) {
        router.push('/')
        return
      }

      const hasAccess = await hasProductAccess(productId)
      if (!hasAccess) {
        setError(`You don't have access to ${product?.name}. Please contact your administrator.`)
        setLoading(false)
        return
      }

      // Log product access
      await logProductAccess(productId, 'dashboard_view')
      
      const products = await getUserProducts()
      setUserProducts(products)
    } catch (err) {
      setError('Failed to verify product access')
    } finally {
      setLoading(false)
    }
  }

  const handleNavigation = async (href: string) => {
    await logProductAccess(productId, 'feature_access', { route: href })
    // In a real implementation, this would load the actual product component
    router.push(`/${productId}${href}`)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading {product?.name}...</p>
        </div>
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              {error || 'Product not found'}
            </AlertDescription>
          </Alert>
          <div className="mt-4 text-center space-x-4">
            <button
              onClick={() => router.push('/dashboard')}
              className="text-blue-600 hover:text-blue-800 text-sm"
            >
              Return to Dashboard
            </button>
            <button
              onClick={() => router.push('/')}
              className="text-gray-600 hover:text-gray-800 text-sm"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br ${product.color.gradient}`}>
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
                Back
              </Button>
              <div className="flex items-center space-x-3">
                <div 
                  className="p-3 rounded-xl"
                  style={{ backgroundColor: product.color.primary + '20' }}
                >
                  <product.icon 
                    className="h-8 w-8" 
                    style={{ color: product.color.primary }}
                  />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{product.name}</h1>
                  <p className="text-gray-600">{product.description}</p>
                </div>
              </div>
            </div>
            <Badge 
              className="text-white px-4 py-2"
              style={{ backgroundColor: product.color.primary }}
            >
              Active
            </Badge>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Product Features */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {product.features.map((feature) => (
              <Card key={feature.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center space-x-3">
                    <div 
                      className="p-2 rounded-lg"
                      style={{ backgroundColor: product.color.primary + '20' }}
                    >
                      <feature.icon 
                        className="h-5 w-5" 
                        style={{ color: product.color.primary }}
                      />
                    </div>
                    <div>
                      <h3 className="font-medium text-sm">{feature.name}</h3>
                      <p className="text-xs text-muted-foreground">{feature.description}</p>
                      {feature.premium && (
                        <Badge variant="outline" className="mt-1">Premium</Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Navigation */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {product.navigation.map((navItem) => (
              <Button
                key={navItem.id}
                variant="outline"
                className="h-24 flex-col space-y-2"
                onClick={() => handleNavigation(navItem.href)}
              >
                <navItem.icon className="h-6 w-6" />
                <span className="text-sm">{navItem.label}</span>
                {navItem.badge && (
                  <Badge variant="outline" className="text-xs">{navItem.badge}</Badge>
                )}
              </Button>
            ))}
          </div>
        </div>

        {/* Product-specific Dashboard Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Welcome to {product.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-muted-foreground">
                    This is your {product.name.toLowerCase()} dashboard. Here you can access all the features and tools you need.
                  </p>
                  
                  {productId === 'workforce-management' && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">127</div>
                        <div className="text-sm text-green-700">Total Employees</div>
                      </div>
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">15</div>
                        <div className="text-sm text-blue-700">Active Projects</div>
                      </div>
                    </div>
                  )}
                  
                  {productId === 'time-tracker' && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">6.5h</div>
                        <div className="text-sm text-blue-700">Hours Today</div>
                      </div>
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">92%</div>
                        <div className="text-sm text-green-700">Productivity</div>
                      </div>
                    </div>
                  )}
                  
                  {productId === 'guard-management' && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-4 bg-purple-50 rounded-lg">
                        <div className="text-2xl font-bold text-purple-600">24</div>
                        <div className="text-sm text-purple-700">Active Guards</div>
                      </div>
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">96%</div>
                        <div className="text-sm text-green-700">Site Coverage</div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    'Logged in to dashboard',
                    'Viewed analytics report',
                    'Updated project status',
                    'Generated timesheet'
                  ].map((activity, index) => (
                    <div key={index} className="flex items-center space-x-3 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>{activity}</span>
                      <span className="text-muted-foreground ml-auto">
                        {index + 1} hour{index !== 0 ? 's' : ''} ago
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Your Products</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {userProducts.map((prodId) => {
                    const prod = PRODUCTS[prodId as ProductId]
                    if (!prod) return null
                    
                    return (
                      <div key={prodId} className="flex items-center space-x-2">
                        <prod.icon className="h-4 w-4" style={{ color: prod.color.primary }} />
                        <span className="text-sm">{prod.name}</span>
                        {prodId === productId && (
                          <Badge variant="outline" className="ml-auto">Current</Badge>
                        )}
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Quick Stats</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Status</span>
                    <Badge className="bg-green-100 text-green-800">Active</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Last Login</span>
                    <span className="text-sm">Just now</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Usage</span>
                    <span className="text-sm">High</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}