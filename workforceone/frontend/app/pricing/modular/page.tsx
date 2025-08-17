'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Checkbox } from '@/components/ui/checkbox'
import { Slider } from '@/components/ui/slider'
import {
  ArrowLeft, Check, X, Star, Users, Building2, Crown,
  Zap, Shield, HeadphonesIcon, Clock, Calendar, FileText,
  BarChart3, MapPin, Smartphone, Globe, ChevronRight,
  Info, Sparkles, Target, TrendingUp, Layers, Settings,
  Calculator, ShoppingCart, Plus, Minus
} from 'lucide-react'
import { 
  getUserLocationAndCurrency, 
  formatPrice, 
  type CountryInfo, 
  type CurrencyInfo,
  CURRENCIES 
} from '@/lib/currency-utils'

interface Feature {
  id: string
  name: string
  description: string
  category: 'core' | 'productivity' | 'analytics' | 'location' | 'integration' | 'support'
  price: number
  icon: React.ComponentType<any>
  isFree: boolean
  dependencies?: string[]
  popular?: boolean
  unit?: 'user' | 'organization' | 'feature'
}

interface UserTier {
  from: number
  to: number | null
  price: number
  name: string
}

const userTiers: UserTier[] = [
  { from: 1, to: 10, price: 0, name: 'Starter (1-10 users)' },
  { from: 11, to: 50, price: 2, name: 'Small Team (11-50 users)' },
  { from: 51, to: 200, price: 4, name: 'Medium Team (51-200 users)' },
  { from: 201, to: null, price: 6, name: 'Large Team (201+ users)' }
]

const features: Feature[] = [
  // Core Features (Free)
  {
    id: 'team_management',
    name: 'Team Management',
    description: 'Create and manage teams, assign roles, and organize your workforce',
    category: 'core',
    price: 0,
    icon: Users,
    isFree: true,
    unit: 'organization'
  },
  {
    id: 'basic_attendance',
    name: 'Basic Attendance',
    description: 'Clock in/out tracking, basic attendance reports',
    category: 'core',
    price: 0,
    icon: Clock,
    isFree: true,
    unit: 'organization'
  },
  {
    id: 'overview_dashboard',
    name: 'Overview Dashboard',
    description: 'Essential metrics and team overview',
    category: 'core',
    price: 0,
    icon: BarChart3,
    isFree: true,
    unit: 'organization'
  },
  {
    id: 'basic_tasks',
    name: 'Basic Task Management',
    description: 'Create, assign, and track simple tasks',
    category: 'core',
    price: 0,
    icon: FileText,
    isFree: true,
    unit: 'organization'
  },
  {
    id: 'mobile_app',
    name: 'Mobile App Access',
    description: 'iOS and Android mobile applications',
    category: 'core',
    price: 0,
    icon: Smartphone,
    isFree: true,
    unit: 'organization'
  },

  // Productivity Features
  {
    id: 'advanced_tasks',
    name: 'Advanced Task Management',
    description: 'Workflows, dependencies, custom fields, and automation',
    category: 'productivity',
    price: 3,
    icon: Target,
    isFree: false,
    unit: 'user',
    popular: true
  },
  {
    id: 'time_tracking',
    name: 'Time Tracking',
    description: 'Detailed time tracking, timesheets, and billing integration',
    category: 'productivity',
    price: 2,
    icon: Clock,
    isFree: false,
    unit: 'user'
  },
  {
    id: 'advanced_forms',
    name: 'Advanced Forms',
    description: 'Custom form builder, conditional logic, and AI form scanner',
    category: 'productivity',
    price: 4,
    icon: FileText,
    isFree: false,
    unit: 'user',
    popular: true
  },
  {
    id: 'leave_management',
    name: 'Leave Management',
    description: 'Leave requests, approvals, balances, and calendar integration',
    category: 'productivity',
    price: 2,
    icon: Calendar,
    isFree: false,
    unit: 'user'
  },
  {
    id: 'workflow_automation',
    name: 'Workflow Automation',
    description: 'Automate repetitive tasks and business processes',
    category: 'productivity',
    price: 5,
    icon: Zap,
    isFree: false,
    unit: 'user'
  },
  {
    id: 'site_outlet_visits',
    name: 'Site/Outlet Visits',
    description: 'Track field visits, retail audits, customer check-ins with photo verification',
    category: 'productivity',
    price: 3,
    icon: Building2,
    isFree: false,
    unit: 'user',
    popular: true
  },

  // Analytics Features
  {
    id: 'advanced_analytics',
    name: 'Advanced Analytics',
    description: 'Detailed insights, custom dashboards, and predictive analytics',
    category: 'analytics',
    price: 50,
    icon: TrendingUp,
    isFree: false,
    unit: 'organization'
  },
  {
    id: 'custom_reports',
    name: 'Custom Reports',
    description: 'Build custom reports, scheduled delivery, and data exports',
    category: 'analytics',
    price: 30,
    icon: BarChart3,
    isFree: false,
    unit: 'organization'
  },
  {
    id: 'performance_tracking',
    name: 'Performance Tracking',
    description: 'Employee performance metrics and KPI monitoring',
    category: 'analytics',
    price: 40,
    icon: Target,
    isFree: false,
    unit: 'organization'
  },

  // Location Features
  {
    id: 'gps_tracking',
    name: 'GPS Tracking',
    description: 'Real-time location tracking and geofencing',
    category: 'location',
    price: 3,
    icon: MapPin,
    isFree: false,
    unit: 'user'
  },
  {
    id: 'route_optimization',
    name: 'Route Optimization',
    description: 'AI-powered route planning and optimization',
    category: 'location',
    price: 4,
    icon: MapPin,
    isFree: false,
    unit: 'user',
    dependencies: ['gps_tracking']
  },

  // Integration Features
  {
    id: 'ai_form_scanner',
    name: 'AI Form Scanner',
    description: 'Convert paper forms to digital instantly using Claude AI vision technology',
    category: 'integration',
    price: 50,
    icon: Sparkles,
    isFree: false,
    unit: 'organization',
    popular: true
  },
  {
    id: 'api_access',
    name: 'API Access',
    description: 'RESTful API access for custom integrations',
    category: 'integration',
    price: 75,
    icon: Layers,
    isFree: false,
    unit: 'organization'
  },
  {
    id: 'sso_integration',
    name: 'SSO & LDAP',
    description: 'Single sign-on and enterprise authentication',
    category: 'integration',
    price: 100,
    icon: Shield,
    isFree: false,
    unit: 'organization'
  },
  {
    id: 'custom_integrations',
    name: 'Custom Integrations',
    description: 'Bespoke integrations with your existing systems',
    category: 'integration',
    price: 250,
    icon: Settings,
    isFree: false,
    unit: 'organization'
  },

  // Support Features
  {
    id: 'priority_support',
    name: 'Priority Support',
    description: '24/7 chat and email support with faster response times',
    category: 'support',
    price: 75,
    icon: HeadphonesIcon,
    isFree: false,
    unit: 'organization'
  },
  {
    id: 'dedicated_manager',
    name: 'Dedicated Account Manager',
    description: 'Personal account manager for enterprise support',
    category: 'support',
    price: 500,
    icon: Crown,
    isFree: false,
    unit: 'organization'
  }
]

const categoryColors = {
  core: 'green',
  productivity: 'blue',
  analytics: 'purple',
  location: 'orange',
  integration: 'red',
  support: 'yellow'
}

const categoryNames = {
  core: 'Core Features (Free)',
  productivity: 'Productivity',
  analytics: 'Analytics',
  location: 'Location Services',
  integration: 'Integrations',
  support: 'Support'
}

export default function ModularPricingPage() {
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([])
  const [userCount, setUserCount] = useState(25)
  const [isYearly, setIsYearly] = useState(false)
  const [locationInfo, setLocationInfo] = useState<CountryInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedCurrency, setSelectedCurrency] = useState<CurrencyInfo>(CURRENCIES.USD)

  useEffect(() => {
    getUserLocationAndCurrency().then(info => {
      setLocationInfo(info)
      setSelectedCurrency(info.currency)
      setIsLoading(false)
    }).catch(() => {
      setLocationInfo(null)
      setSelectedCurrency(CURRENCIES.USD)
      setIsLoading(false)
    })
  }, [])

  // Auto-select free features
  useEffect(() => {
    const freeFeatures = features.filter(f => f.isFree).map(f => f.id)
    setSelectedFeatures(freeFeatures)
  }, [])

  const getCurrentUserTier = () => {
    return userTiers.find(tier => 
      userCount >= tier.from && (tier.to === null || userCount <= tier.to)
    ) || userTiers[userTiers.length - 1]
  }

  const calculatePrice = () => {
    const currentTier = getCurrentUserTier()
    let totalPrice = 0

    // Base user pricing
    if (currentTier.price > 0) {
      totalPrice += userCount * currentTier.price
    }

    // Feature pricing
    selectedFeatures.forEach(featureId => {
      const feature = features.find(f => f.id === featureId)
      if (feature && !feature.isFree) {
        if (feature.unit === 'user') {
          totalPrice += userCount * feature.price
        } else {
          totalPrice += feature.price
        }
      }
    })

    return isYearly ? totalPrice * 12 * 0.8 : totalPrice // 20% yearly discount
  }

  const toggleFeature = (featureId: string) => {
    const feature = features.find(f => f.id === featureId)
    if (feature?.isFree) return // Can't toggle free features

    if (selectedFeatures.includes(featureId)) {
      // Remove feature and its dependents
      const dependents = features
        .filter(f => f.dependencies?.includes(featureId))
        .map(f => f.id)
      
      setSelectedFeatures(prev => 
        prev.filter(id => id !== featureId && !dependents.includes(id))
      )
    } else {
      // Add feature and its dependencies
      const dependencies = feature?.dependencies || []
      setSelectedFeatures(prev => [...prev, featureId, ...dependencies])
    }
  }

  const getSelectedFeaturesByCategory = () => {
    const grouped: Record<string, Feature[]> = {}
    
    Object.keys(categoryNames).forEach(cat => {
      grouped[cat] = features
        .filter(f => f.category === cat && selectedFeatures.includes(f.id))
        .sort((a, b) => a.isFree ? -1 : b.isFree ? 1 : 0)
    })
    
    return grouped
  }

  const monthlyPrice = calculatePrice()
  const yearlyPrice = monthlyPrice * 12 * 0.8
  const currentPrice = isYearly ? yearlyPrice : monthlyPrice

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link href="/pricing">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Pricing
                </Button>
              </Link>
              <div className="h-8 w-px bg-gray-300" />
              <h1 className="text-xl font-bold">Modular Pricing</h1>
            </div>
            <Link href="/signup">
              <Button>Start Free Trial</Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Feature Selection */}
          <div className="lg:col-span-2 space-y-6">
            <div className="text-center lg:text-left">
              <Badge variant="outline" className="mb-4">
                <Calculator className="h-3 w-3 mr-1" />
                Build Your Perfect Plan
              </Badge>
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                Pay Only for What You Need
              </h1>
              <p className="text-lg text-gray-600">
                Start with free core features, then add exactly what your team needs.
              </p>
            </div>

            {/* User Count Slider */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="h-5 w-5 mr-2" />
                  Team Size
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Number of users</span>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setUserCount(Math.max(1, userCount - 5))}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="font-bold text-lg w-16 text-center">{userCount}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setUserCount(userCount + 5)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <Slider
                    value={[userCount]}
                    onValueChange={(values) => setUserCount(values[0])}
                    max={500}
                    min={1}
                    step={1}
                    className="w-full"
                  />
                  <div className="text-sm text-blue-600 font-medium">
                    {getCurrentUserTier().name} - {formatPrice(getCurrentUserTier().price, selectedCurrency)}/user/month
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Per-User Features Section */}
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h2 className="text-lg font-semibold text-blue-900 flex items-center">
                  <Users className="h-5 w-5 mr-2" />
                  Per-User Features
                </h2>
                <p className="text-sm text-blue-700 mt-1">
                  These features are charged based on your team size ({userCount} users)
                </p>
              </div>

              {/* Core Features (Free) */}
              {(() => {
                const coreFeatures = features.filter(f => f.category === 'core')
                return coreFeatures.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <div className={`w-3 h-3 rounded-full bg-green-500 mr-2`} />
                        Core Features (Free)
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {coreFeatures.map(feature => (
                          <div 
                            key={feature.id}
                            className="border border-green-200 bg-green-50 rounded-lg p-4 opacity-75"
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center space-x-2">
                                <feature.icon className="h-5 w-5 text-green-600" />
                                <h4 className="font-medium">{feature.name}</h4>
                              </div>
                              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                Free
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600">{feature.description}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )
              })()}

              {/* Productivity Features */}
              {(() => {
                const productivityFeatures = features.filter(f => f.category === 'productivity')
                return productivityFeatures.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <div className={`w-3 h-3 rounded-full bg-blue-500 mr-2`} />
                        Productivity Features
                        <Badge className="ml-2" variant="outline">Per User</Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {productivityFeatures.map(feature => (
                          <div 
                            key={feature.id}
                            className={`border rounded-lg p-4 transition-all cursor-pointer ${
                              selectedFeatures.includes(feature.id)
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                            onClick={() => toggleFeature(feature.id)}
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center space-x-2">
                                <feature.icon className="h-5 w-5 text-gray-600" />
                                <h4 className="font-medium">{feature.name}</h4>
                                {feature.popular && (
                                  <Badge variant="secondary" className="text-xs">
                                    Popular
                                  </Badge>
                                )}
                              </div>
                              <Checkbox
                                checked={selectedFeatures.includes(feature.id)}
                              />
                            </div>
                            <p className="text-sm text-gray-600 mb-2">{feature.description}</p>
                            <div className="flex items-center justify-between">
                              <div className="text-sm font-medium text-blue-600">
                                {formatPrice(feature.price, selectedCurrency)}/user/month
                              </div>
                              <div className="text-xs text-gray-500">
                                Total: {formatPrice(feature.price * userCount, selectedCurrency)}/month
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )
              })()}

              {/* Location Features */}
              {(() => {
                const locationFeatures = features.filter(f => f.category === 'location')
                return locationFeatures.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <div className={`w-3 h-3 rounded-full bg-orange-500 mr-2`} />
                        Location Services
                        <Badge className="ml-2" variant="outline">Per User</Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {locationFeatures.map(feature => (
                          <div 
                            key={feature.id}
                            className={`border rounded-lg p-4 transition-all cursor-pointer ${
                              selectedFeatures.includes(feature.id)
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                            onClick={() => toggleFeature(feature.id)}
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center space-x-2">
                                <feature.icon className="h-5 w-5 text-gray-600" />
                                <h4 className="font-medium">{feature.name}</h4>
                              </div>
                              <Checkbox
                                checked={selectedFeatures.includes(feature.id)}
                              />
                            </div>
                            <p className="text-sm text-gray-600 mb-2">{feature.description}</p>
                            <div className="flex items-center justify-between">
                              <div className="text-sm font-medium text-blue-600">
                                {formatPrice(feature.price, selectedCurrency)}/user/month
                              </div>
                              <div className="text-xs text-gray-500">
                                Total: {formatPrice(feature.price * userCount, selectedCurrency)}/month
                              </div>
                            </div>
                            {feature.dependencies && (
                              <div className="text-xs text-gray-500 mt-1">
                                Requires: {feature.dependencies.map(dep => 
                                  features.find(f => f.id === dep)?.name
                                ).join(', ')}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )
              })()}
            </div>

            {/* Organization-Level Features Section */}
            <div className="space-y-6">
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <h2 className="text-lg font-semibold text-purple-900 flex items-center">
                  <Building2 className="h-5 w-5 mr-2" />
                  Organization Features
                </h2>
                <p className="text-sm text-purple-700 mt-1">
                  Fixed monthly pricing for your entire organization
                </p>
              </div>

              {/* Analytics Features */}
              {(() => {
                const analyticsFeatures = features.filter(f => f.category === 'analytics')
                return analyticsFeatures.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <div className={`w-3 h-3 rounded-full bg-purple-500 mr-2`} />
                        Analytics
                        <Badge className="ml-2" variant="outline">Fixed Price</Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {analyticsFeatures.map(feature => (
                          <div 
                            key={feature.id}
                            className={`border rounded-lg p-4 transition-all cursor-pointer ${
                              selectedFeatures.includes(feature.id)
                                ? 'border-purple-500 bg-purple-50'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                            onClick={() => toggleFeature(feature.id)}
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center space-x-2">
                                <feature.icon className="h-5 w-5 text-gray-600" />
                                <h4 className="font-medium">{feature.name}</h4>
                              </div>
                              <Checkbox
                                checked={selectedFeatures.includes(feature.id)}
                              />
                            </div>
                            <p className="text-sm text-gray-600 mb-2">{feature.description}</p>
                            <div className="text-sm font-medium text-purple-600">
                              {formatPrice(feature.price, selectedCurrency)}/month
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )
              })()}

              {/* Integration Features */}
              {(() => {
                const integrationFeatures = features.filter(f => f.category === 'integration')
                return integrationFeatures.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <div className={`w-3 h-3 rounded-full bg-red-500 mr-2`} />
                        Integrations
                        <Badge className="ml-2" variant="outline">Fixed Price</Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {integrationFeatures.map(feature => (
                          <div 
                            key={feature.id}
                            className={`border rounded-lg p-4 transition-all cursor-pointer ${
                              selectedFeatures.includes(feature.id)
                                ? 'border-purple-500 bg-purple-50'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                            onClick={() => toggleFeature(feature.id)}
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center space-x-2">
                                <feature.icon className="h-5 w-5 text-gray-600" />
                                <h4 className="font-medium">{feature.name}</h4>
                                {feature.popular && (
                                  <Badge variant="secondary" className="text-xs">
                                    Popular
                                  </Badge>
                                )}
                              </div>
                              <Checkbox
                                checked={selectedFeatures.includes(feature.id)}
                              />
                            </div>
                            <p className="text-sm text-gray-600 mb-2">{feature.description}</p>
                            <div className="text-sm font-medium text-purple-600">
                              {formatPrice(feature.price, selectedCurrency)}/month
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )
              })()}

              {/* Support Features */}
              {(() => {
                const supportFeatures = features.filter(f => f.category === 'support')
                return supportFeatures.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <div className={`w-3 h-3 rounded-full bg-yellow-500 mr-2`} />
                        Support
                        <Badge className="ml-2" variant="outline">Fixed Price</Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {supportFeatures.map(feature => (
                          <div 
                            key={feature.id}
                            className={`border rounded-lg p-4 transition-all cursor-pointer ${
                              selectedFeatures.includes(feature.id)
                                ? 'border-purple-500 bg-purple-50'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                            onClick={() => toggleFeature(feature.id)}
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center space-x-2">
                                <feature.icon className="h-5 w-5 text-gray-600" />
                                <h4 className="font-medium">{feature.name}</h4>
                              </div>
                              <Checkbox
                                checked={selectedFeatures.includes(feature.id)}
                              />
                            </div>
                            <p className="text-sm text-gray-600 mb-2">{feature.description}</p>
                            <div className="text-sm font-medium text-purple-600">
                              {formatPrice(feature.price, selectedCurrency)}/month
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )
              })()}
            </div>
          </div>

          {/* Pricing Summary */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <ShoppingCart className="h-5 w-5 mr-2" />
                    Your Custom Plan
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Billing Toggle */}
                  <div className="flex items-center justify-center space-x-3 p-3 bg-gray-50 rounded-lg">
                    <span className={`text-sm ${!isYearly ? 'font-medium' : 'text-gray-600'}`}>
                      Monthly
                    </span>
                    <Switch
                      checked={isYearly}
                      onCheckedChange={setIsYearly}
                    />
                    <span className={`text-sm ${isYearly ? 'font-medium' : 'text-gray-600'}`}>
                      Yearly
                    </span>
                    {isYearly && (
                      <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">
                        20% OFF
                      </Badge>
                    )}
                  </div>

                  {/* Price Breakdown */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center pb-2 border-b">
                      <span className="text-sm text-gray-600">Team Size</span>
                      <span className="font-medium">{userCount} users</span>
                    </div>

                    {/* Selected Features by Category */}
                    {Object.entries(getSelectedFeaturesByCategory()).map(([category, features]) => {
                      if (features.length === 0) return null
                      
                      return (
                        <div key={category} className="space-y-2">
                          <h4 className="text-sm font-medium text-gray-700 border-b pb-1">
                            {categoryNames[category as keyof typeof categoryNames]}
                          </h4>
                          {features.map(feature => (
                            <div key={feature.id} className="flex justify-between items-center text-sm">
                              <span className={feature.isFree ? 'text-green-600' : 'text-gray-600'}>
                                {feature.name}
                              </span>
                              <span className={feature.isFree ? 'text-green-600 font-medium' : ''}>
                                {feature.isFree ? 'Free' : (
                                  feature.unit === 'user' 
                                    ? `${formatPrice(feature.price * userCount, selectedCurrency)}`
                                    : formatPrice(feature.price, selectedCurrency)
                                )}
                              </span>
                            </div>
                          ))}
                        </div>
                      )
                    })}
                  </div>

                  {/* Total Price */}
                  <div className="border-t pt-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-lg font-semibold">Total</span>
                      <div className="text-right">
                        <div className="text-2xl font-bold">
                          {formatPrice(currentPrice, selectedCurrency)}
                        </div>
                        <div className="text-sm text-gray-600">
                          {isYearly ? 'per year' : 'per month'}
                        </div>
                      </div>
                    </div>
                    
                    {isYearly && monthlyPrice > 0 && (
                      <div className="text-sm text-green-600 text-right">
                        Save {formatPrice(monthlyPrice * 12 - yearlyPrice, selectedCurrency)} annually
                      </div>
                    )}
                  </div>

                  {/* CTA Button */}
                  <Button className="w-full" size="lg">
                    Start Free Trial
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                  
                  <p className="text-xs text-gray-500 text-center">
                    14-day free trial • No credit card required
                  </p>
                </CardContent>
              </Card>

              {/* Features Summary */}
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle className="text-sm">Plan Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm space-y-2">
                    <div className="flex justify-between">
                      <span>Selected Features</span>
                      <span className="font-medium">{selectedFeatures.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Free Features</span>
                      <span className="text-green-600 font-medium">
                        {features.filter(f => f.isFree && selectedFeatures.includes(f.id)).length}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Premium Features</span>
                      <span className="text-blue-600 font-medium">
                        {selectedFeatures.filter(id => !features.find(f => f.id === id)?.isFree).length}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}