'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { 
  Shield, Users, FileText, Clock, MapPin, QrCode, 
  Settings, BarChart3, Navigation, AlertTriangle,
  Package, Timer, Briefcase, Home, ArrowRight,
  CheckCircle, Wrench, Code, Database, Smartphone
} from 'lucide-react'

export default function DeveloperDashboard() {
  const productionFeatures = [
    {
      title: 'Guard Management Dashboard',
      path: '/dashboard/guard',
      icon: Shield,
      description: 'Real-time guard management with live database data',
      techStack: 'Next.js, Supabase, Real-time subscriptions',
      status: 'production',
      dataSource: 'user_products table'
    },
    {
      title: 'Security Operations Center',
      path: '/dashboard/security',
      icon: AlertTriangle,
      description: 'Live security monitoring and incident management',
      techStack: 'React, Google Maps, WebSockets',
      status: 'production',
      dataSource: 'user_products, patrol_sessions'
    },
    {
      title: 'Live Guard Map',
      path: '/dashboard/security/map',
      icon: MapPin,
      description: 'Real-time guard location tracking on map',
      techStack: 'Google Maps API, Geolocation',
      status: 'production',
      dataSource: 'Real-time location updates'
    },
    {
      title: 'QR Invitation System',
      path: '/dashboard/settings/invitations',
      icon: QrCode,
      description: 'Generate QR codes for guard invitations with auto sign-in',
      techStack: 'QR Code generation, Supabase Auth',
      status: 'production',
      dataSource: 'security_guard_invitations'
    }
  ]

  const workingFeatures = [
    {
      title: 'Forms Management',
      path: '/dashboard/forms',
      icon: FileText,
      description: 'AI-powered form scanning and builder',
      status: 'functional'
    },
    {
      title: 'Team Management',
      path: '/dashboard/teams',
      icon: Users,
      description: 'Team creation and member management',
      status: 'functional'
    },
    {
      title: 'Project Tracking',
      path: '/dashboard/projects',
      icon: Briefcase,
      description: 'Project management with tasks',
      status: 'functional'
    },
    {
      title: 'Time Tracking',
      path: '/dashboard/time-tracker',
      icon: Timer,
      description: 'Clock in/out and timesheet management',
      status: 'functional'
    },
    {
      title: 'Attendance System',
      path: '/dashboard/attendance',
      icon: Clock,
      description: 'Employee attendance tracking',
      status: 'functional'
    },
    {
      title: 'Route Planning',
      path: '/dashboard/routes',
      icon: Navigation,
      description: 'Patrol route optimization',
      status: 'functional'
    }
  ]

  const keyComponents = [
    {
      name: 'ProductInvitationQR',
      path: '/components/mobile/ProductInvitationQR.tsx',
      description: 'QR code generator for product invitations'
    },
    {
      name: 'SecurityMap',
      path: '/components/security/SecurityMap.tsx',
      description: 'Interactive map for security operations'
    },
    {
      name: 'RequireProduct',
      path: '/components/guards/RequireProduct.tsx',
      description: 'Product access control component'
    },
    {
      name: 'ProductNavigation',
      path: '/components/navigation/ProductNavigation.tsx',
      description: 'Dynamic navigation based on product access'
    }
  ]

  const apiEndpoints = [
    {
      method: 'POST',
      path: '/api/forms/scan',
      description: 'AI form scanning'
    },
    {
      method: 'POST',
      path: '/api/stripe/webhook',
      description: 'Stripe payment webhooks'
    },
    {
      method: 'POST',
      path: '/api/stripe/create-payment-intent',
      description: 'Create payment intent'
    }
  ]

  const mobileIntegration = {
    app: 'workforceone-mobile',
    features: [
      'QR Code Scanning',
      'Auto Sign-in',
      'Product-based Dashboard',
      'Offline Support'
    ],
    status: 'production'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            🛠️ Developer Dashboard
          </h1>
          <p className="text-gray-600">
            Quick access to all working components and features
          </p>
          <div className="mt-4 flex justify-center gap-4">
            <Badge className="bg-green-100 text-green-800">
              <CheckCircle className="h-3 w-3 mr-1" />
              {productionFeatures.length} Production Ready
            </Badge>
            <Badge className="bg-blue-100 text-blue-800">
              <Wrench className="h-3 w-3 mr-1" />
              {workingFeatures.length} Functional
            </Badge>
            <Badge className="bg-purple-100 text-purple-800">
              <Database className="h-3 w-3 mr-1" />
              Real Database Integration
            </Badge>
          </div>
        </div>

        {/* Production Features */}
        <Card>
          <CardHeader className="bg-green-50">
            <CardTitle className="text-green-800 flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Production Ready Features (With Real Data)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid md:grid-cols-2 gap-4">
              {productionFeatures.map((feature) => (
                <Link key={feature.path} href={feature.path}>
                  <div className="p-4 border rounded-lg hover:border-green-400 hover:bg-green-50 transition-all cursor-pointer">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <feature.icon className="h-5 w-5 text-green-600" />
                        <h3 className="font-semibold">{feature.title}</h3>
                      </div>
                      <ArrowRight className="h-4 w-4 text-gray-400" />
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      {feature.description}
                    </p>
                    <div className="space-y-1">
                      <div className="text-xs text-gray-500">
                        <span className="font-medium">Tech:</span> {feature.techStack}
                      </div>
                      <div className="text-xs text-gray-500">
                        <span className="font-medium">Data:</span> {feature.dataSource}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Working Features */}
        <Card>
          <CardHeader className="bg-blue-50">
            <CardTitle className="text-blue-800 flex items-center gap-2">
              <Wrench className="h-5 w-5" />
              Functional Features
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid md:grid-cols-3 gap-4">
              {workingFeatures.map((feature) => (
                <Link key={feature.path} href={feature.path}>
                  <div className="p-4 border rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-all cursor-pointer">
                    <div className="flex items-center gap-2 mb-2">
                      <feature.icon className="h-4 w-4 text-blue-600" />
                      <h3 className="font-medium">{feature.title}</h3>
                    </div>
                    <p className="text-sm text-gray-600">
                      {feature.description}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Key Components */}
          <Card>
            <CardHeader className="bg-purple-50">
              <CardTitle className="text-purple-800 flex items-center gap-2">
                <Code className="h-5 w-5" />
                Key Components
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-3">
                {keyComponents.map((component) => (
                  <div key={component.name} className="p-3 bg-gray-50 rounded-lg">
                    <div className="font-mono text-sm font-medium text-purple-600">
                      {component.name}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {component.path}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      {component.description}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* API Endpoints */}
          <Card>
            <CardHeader className="bg-orange-50">
              <CardTitle className="text-orange-800 flex items-center gap-2">
                <Database className="h-5 w-5" />
                API Endpoints
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="space-y-3">
                {apiEndpoints.map((endpoint, idx) => (
                  <div key={idx} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-orange-100 text-orange-700 text-xs">
                        {endpoint.method}
                      </Badge>
                      <span className="font-mono text-sm">{endpoint.path}</span>
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      {endpoint.description}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Mobile Integration */}
        <Card className="border-2 border-purple-200">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-indigo-50">
            <CardTitle className="text-purple-800 flex items-center gap-2">
              <Smartphone className="h-5 w-5" />
              Mobile App Integration
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-2">Mobile App Location</h3>
                <div className="font-mono text-sm bg-gray-100 p-2 rounded">
                  /workforceone-mobile/
                </div>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Key Features</h3>
                <div className="space-y-1">
                  {mobileIntegration.features.map((feature, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <CheckCircle className="h-3 w-3 text-green-500" />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <Link href="/dashboard">
                <Button>
                  <Home className="h-4 w-4 mr-2" />
                  Main Dashboard
                </Button>
              </Link>
              <Link href="/dashboard/guard">
                <Button variant="outline" className="border-green-500 text-green-600">
                  <Shield className="h-4 w-4 mr-2" />
                  Guard Dashboard
                </Button>
              </Link>
              <Link href="/dashboard/security/map">
                <Button variant="outline" className="border-blue-500 text-blue-600">
                  <MapPin className="h-4 w-4 mr-2" />
                  Live Map
                </Button>
              </Link>
              <Link href="/dashboard/settings/invitations">
                <Button variant="outline" className="border-purple-500 text-purple-600">
                  <QrCode className="h-4 w-4 mr-2" />
                  QR Invitations
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Status Summary */}
        <Card className="bg-gradient-to-r from-green-50 to-blue-50">
          <CardContent className="p-6 text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              System Status: 🟢 Production Ready
            </h2>
            <p className="text-gray-600">
              QR auto sign-in working • Real database integration active • 
              Guards appearing in system • Mobile app functional
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}