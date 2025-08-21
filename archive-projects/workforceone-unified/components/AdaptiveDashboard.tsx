'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  getUserProfile, 
  getUserProducts,
  logProductAccess 
} from '@/lib/supabase'
import { 
  PRODUCTS, 
  getAvailableProducts, 
  getPrimaryProduct, 
  getProductTheme,
  type ProductId,
  type Product
} from '@/lib/products'
import { 
  Building, Clock, Shield, Users, BarChart3, 
  Timer, Activity, Monitor, Target, CheckCircle,
  ArrowRight, Zap, Star, TrendingUp, Globe
} from 'lucide-react'

interface DashboardProps {
  userProducts: string[]
}

export default function AdaptiveDashboard({ userProducts }: DashboardProps) {
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<Record<string, any>>({})
  
  const availableProducts = getAvailableProducts(userProducts)
  const primaryProduct = getPrimaryProduct(userProducts)
  const theme = getProductTheme(userProducts)

  useEffect(() => {
    loadUserProfile()
    loadDashboardStats()
  }, [])

  const loadUserProfile = async () => {
    try {
      const { profile } = await getUserProfile()
      setProfile(profile)
    } catch (error) {
      console.error('Failed to load profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadDashboardStats = async () => {
    // Mock stats - in real implementation, load from API
    setStats({
      'workforce-management': {
        organizations: 3,
        employees: 127,
        projects: 15,
        completion: 85
      },
      'time-tracker': {
        hoursToday: 6.5,
        hoursWeek: 32.5,
        projects: 8,
        productivity: 92
      },
      'guard-management': {
        guards: 24,
        sites: 8,
        incidents: 3,
        coverage: 96
      }
    })
  }

  const handleProductNavigation = async (productId: ProductId, route: string) => {
    await logProductAccess(productId, 'feature_access', { route })
    window.location.href = `/${productId}${route}`
  }

  const renderProductCard = (product: Product) => {
    const productStats = stats[product.id] || {}
    
    return (
      <Card key={product.id} className="hover:shadow-lg transition-shadow cursor-pointer">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
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
                <p className="text-sm text-muted-foreground">{product.description}</p>
              </div>
            </div>
            <Badge 
              className="text-white"
              style={{ backgroundColor: product.color.primary }}
            >
              Active
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Product-specific stats */}
            {product.id === 'workforce-management' && (
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {productStats.employees || 0}
                  </div>
                  <div className="text-xs text-muted-foreground">Employees</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {productStats.projects || 0}
                  </div>
                  <div className="text-xs text-muted-foreground">Projects</div>
                </div>
              </div>
            )}
            
            {product.id === 'time-tracker' && (
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {productStats.hoursToday || 0}h
                  </div>
                  <div className="text-xs text-muted-foreground">Today</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {productStats.productivity || 0}%
                  </div>
                  <div className="text-xs text-muted-foreground">Productivity</div>
                </div>
              </div>
            )}
            
            {product.id === 'guard-management' && (
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {productStats.guards || 0}
                  </div>
                  <div className="text-xs text-muted-foreground">Guards</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {productStats.coverage || 0}%
                  </div>
                  <div className="text-xs text-muted-foreground">Coverage</div>
                </div>
              </div>
            )}
            
            {/* Quick actions */}
            <div className="grid grid-cols-2 gap-2 mt-4">
              {product.navigation.slice(0, 4).map((navItem) => (
                <Button
                  key={navItem.id}
                  variant="outline"
                  size="sm"
                  onClick={() => handleProductNavigation(product.id, navItem.href)}
                  className="text-xs h-8"
                >
                  <navItem.icon className="h-3 w-3 mr-1" />
                  {navItem.label}
                </Button>
              ))}
            </div>
            
            <Button 
              onClick={() => handleProductNavigation(product.id, '/dashboard')}
              className="w-full mt-3"
              style={{ backgroundColor: product.color.primary }}
            >
              Open {product.name}
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br ${primaryProduct?.color.gradient || 'from-slate-50 to-blue-50'}`}>
      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center space-x-4">
              <div className="h-12 w-12 bg-gradient-to-br from-blue-600 via-purple-600 to-green-600 rounded-xl flex items-center justify-center">
                <Zap className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Welcome back, {profile?.full_name || 'User'}!
                </h1>
                <p className="text-gray-600">
                  You have access to {availableProducts.length} product{availableProducts.length !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {availableProducts.map((product) => (
                <Badge
                  key={product.id}
                  className="text-white"
                  style={{ backgroundColor: product.color.primary }}
                >
                  <product.icon className="h-3 w-3 mr-1" />
                  {product.name.split(' ')[0]}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Globe className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-muted-foreground">Products</p>
                  <p className="text-2xl font-bold">{availableProducts.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-muted-foreground">Status</p>
                  <p className="text-lg font-bold text-green-600">Active</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-muted-foreground">Performance</p>
                  <p className="text-2xl font-bold">94%</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Star className="h-6 w-6 text-orange-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-muted-foreground">Rating</p>
                  <p className="text-2xl font-bold">4.8</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Product Dashboard Cards */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Your Products</h2>
            <Button variant="outline">
              <Target className="h-4 w-4 mr-2" />
              Manage Access
            </Button>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {availableProducts.map(renderProductCard)}
          </div>
        </div>

        {/* Recent Activity */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { action: 'Signed in', product: 'Workforce Management', time: '2 minutes ago', icon: Building },
                { action: 'Started timer', product: 'Time Tracker', time: '15 minutes ago', icon: Timer },
                { action: 'Viewed guards', product: 'Guard Management', time: '1 hour ago', icon: Shield },
                { action: 'Generated report', product: 'Workforce Management', time: '2 hours ago', icon: BarChart3 },
              ].map((activity, index) => (
                <div key={index} className="flex items-center space-x-4 p-3 hover:bg-gray-50 rounded-lg">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <activity.icon className="h-4 w-4 text-gray-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{activity.action}</p>
                    <p className="text-xs text-muted-foreground">{activity.product}</p>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {activity.time}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}