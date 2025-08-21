'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useProductAccess } from '@/hooks/useProductAccess'
import UnifiedOverview from './UnifiedOverview'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ProductSwitcher } from '@/components/navigation/ProductSwitcher'
import { 
  Users, Clock, Shield, ArrowRight, 
  Home, Loader2, AlertCircle 
} from 'lucide-react'
import Link from 'next/link'

const PRODUCT_INFO = {
  remote: {
    icon: Users,
    name: 'Remote Workforce',
    description: 'Team & task management for distributed workforces',
    color: 'blue',
    dashboard: '/dashboard/remote'
  },
  time: {
    icon: Clock,
    name: 'Time Management',
    description: 'Time tracking & attendance management',
    color: 'green',
    dashboard: '/dashboard/time'
  },
  guard: {
    icon: Shield,
    name: 'Security Guard',
    description: 'Security patrol & incident management',
    color: 'purple',
    dashboard: '/dashboard/guard'
  }
}

export default function DashboardPage() {
  const { products, loading, primaryProduct } = useProductAccess()
  const router = useRouter()
  const [selectedProduct, setSelectedProduct] = useState<string>('')

  useEffect(() => {
    if (loading) return

    // If user has no products, show product selection within dashboard
    // Don't redirect - let them choose products from the dashboard
    if (products.length === 0) {
      // Stay on dashboard and show product selection
      return
    }

    // If user has only one product, redirect to that product's dashboard
    if (products.length === 1) {
      const product = products[0]
      const productInfo = PRODUCT_INFO[product.code as keyof typeof PRODUCT_INFO]
      if (productInfo) {
        router.push(productInfo.dashboard)
      }
      return
    }

    // If user has a primary product, redirect to that dashboard
    if (primaryProduct) {
      const productInfo = PRODUCT_INFO[primaryProduct.code as keyof typeof PRODUCT_INFO]
      if (productInfo) {
        router.push(productInfo.dashboard)
      }
      return
    }

    // If we reach here, user has multiple products but no primary set
    // Show product selection interface
  }, [products, loading, primaryProduct, router])

  const handleProductSelect = (productCode: string) => {
    const productInfo = PRODUCT_INFO[productCode as keyof typeof PRODUCT_INFO]
    if (productInfo) {
      router.push(productInfo.dashboard)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <div className="text-muted-foreground">Loading your workspace...</div>
        </div>
      </div>
    )
  }

  if (products.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md text-center">
          <CardHeader>
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <CardTitle>No Products Available</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-6">
              You don't have access to any WorkforceOne products yet. 
              Choose the products that fit your needs to get started.
            </p>
            <div className="space-y-3">
              <Button asChild className="w-full">
                <Link href="/products">
                  Choose Products
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button variant="outline" asChild className="w-full">
                <Link href="/help/products">
                  View Products
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // For multiple products, show the unified overview dashboard
  if (products.length > 1) {
    return <UnifiedOverview />
  }

  // Show product selection interface for users with products but no primary set
  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="flex items-center justify-center mb-4">
          <Home className="h-8 w-8 text-blue-600" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome to WorkforceOne
        </h1>
        <p className="text-lg text-gray-600">
          Choose a product to access your dashboard
        </p>
      </div>

      {/* Product Selection */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product) => {
          const productInfo = PRODUCT_INFO[product.code as keyof typeof PRODUCT_INFO]
          if (!productInfo) return null

          const IconComponent = productInfo.icon
          
          return (
            <Card 
              key={product.id}
              className="hover:shadow-lg transition-all cursor-pointer group hover:scale-105"
              onClick={() => handleProductSelect(product.code)}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div 
                    className="w-12 h-12 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: product.color_theme + '20' }}
                  >
                    <IconComponent 
                      className="h-6 w-6" 
                      style={{ color: product.color_theme }} 
                    />
                  </div>
                  <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-gray-600 transition-colors" />
                </div>
                <CardTitle className="text-xl">
                  {product.display_name}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {product.subscription_status}
                  </Badge>
                  {product.is_primary && (
                    <Badge className="text-xs bg-blue-600">
                      Primary
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  {productInfo.description}
                </p>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">${product.price_monthly}/user/month</span>
                  <span className="font-medium text-blue-600">
                    Access Dashboard →
                  </span>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Bundle Info */}
      {products.length === 3 && (
        <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200">
          <CardContent className="p-8 text-center">
            <div className="flex items-center justify-center mb-4">
              <div className="flex -space-x-2">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <Users className="h-4 w-4 text-blue-600" />
                </div>
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <Clock className="h-4 w-4 text-green-600" />
                </div>
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <Shield className="h-4 w-4 text-purple-600" />
                </div>
              </div>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Complete Bundle Active
            </h3>
            <p className="text-gray-700 mb-4">
              You have access to all WorkforceOne products with bundle savings
            </p>
            <Badge className="bg-green-600 text-white">
              Save 23% with Bundle Pricing
            </Badge>
          </CardContent>
        </Card>
      )}

      {/* Quick Links */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8 border-t">
        <Button variant="outline" asChild>
          <Link href="/dashboard/settings">
            Manage Products
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/help/products">
            Learn More
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/pricing-calculator">
            View Pricing
          </Link>
        </Button>
      </div>
    </div>
  )
}