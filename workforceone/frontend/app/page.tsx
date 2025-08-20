'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { 
  Users, Clock, Calendar, BarChart3, Shield, Zap,
  CheckCircle, ArrowRight, Star, Menu, X, ChevronRight,
  MapPin, FileText, Phone, Building2, Route, ClipboardList,
  Brain, Sparkles, Globe, Smartphone, Cloud, Lock,
  TrendingUp, Award, Headphones, BookOpen, Play,
  DollarSign, Target, Layers, GitBranch, Settings,
  UserCheck, BellRing, Workflow, FormInput, PieChart,
  Package, Check, Minus, AlertTriangle, Patrol, Camera
} from 'lucide-react'

const stats = [
  { label: 'Active Users', value: '50,000+', growth: '+23%' },
  { label: 'Companies', value: '500+', growth: '+41%' },
  { label: 'Countries', value: '45', growth: '+12%' },
  { label: 'Uptime', value: '99.99%', growth: 'SLA' }
]

// New product-focused structure
const products = [
  {
    code: 'remote',
    name: 'WorkforceOne Remote',
    displayName: 'Remote',
    tagline: 'Team & Task Management',
    description: 'Complete workforce management for distributed teams. Manage projects, assign tasks, track progress, and keep everyone connected.',
    monthlyPrice: 8,
    annualPrice: 76.80,
    color: 'blue',
    icon: Users,
    popularWith: 'Remote teams, Service companies, Consultancies',
    features: [
      'Advanced Team Management & User Roles',
      'AI-Powered Task Assignment & Tracking', 
      'Project Management with Templates',
      'Drag & Drop Form Builder',
      'Smart Route Optimization',
      'Multi-Location Outlet Management',
      'White Label & Custom Branding',
      'Client Portal Access',
      'Workflow Automation',
      'Real-time Notifications & Communication'
    ],
    useCases: [
      'Manage distributed sales teams',
      'Coordinate field service operations',
      'Track project deliverables',
      'Automate approval workflows'
    ]
  },
  {
    code: 'time',
    name: 'WorkforceOne Time',
    displayName: 'Time',
    tagline: 'Time & Attendance Tracking',
    description: 'Comprehensive time tracking and attendance management. Perfect for businesses that need accurate time records and payroll integration.',
    monthlyPrice: 6,
    annualPrice: 57.60,
    color: 'green',
    icon: Clock,
    popularWith: 'Hourly workers, Manufacturing, Retail',
    features: [
      'GPS Time Clock with Geofencing',
      'Automated Attendance Monitoring',
      'Complex Shift Scheduling',
      'Leave Management & Balance Tracking',
      'FLSA-Compliant Overtime Calculation',
      'Break & Meal Period Tracking',
      'Payroll Integration (QuickBooks, ADP, etc.)',
      'Time Theft Prevention with Photo Verification',
      'Team Management & User Roles',
      'Compliance Reporting & Analytics'
    ],
    useCases: [
      'Track employee attendance',
      'Manage shift schedules',
      'Process leave requests',
      'Generate payroll reports'
    ]
  },
  {
    code: 'guard',
    name: 'WorkforceOne Guard',
    displayName: 'Guard',
    tagline: 'Security & Patrol Management',
    description: 'Specialized security management system for patrol operations, incident reporting, and checkpoint monitoring.',
    monthlyPrice: 12,
    annualPrice: 115.20,
    color: 'purple',
    icon: Shield,
    popularWith: 'Security companies, Guard services, Properties',
    features: [
      'Dynamic Patrol Route Management',
      'QR Code & NFC Checkpoint Scanning',
      'Real-time GPS Guard Tracking',
      'Detailed Incident Reporting with Evidence',
      'Photo & Video Evidence Capture',
      'Guard Scheduling & Site Assignment',
      'Emergency Escalation & One-Touch Alerts',
      'Automated Client Reporting Dashboards',
      'Team Management & User Roles',
      'Industry Compliance (ASIS, SOC 2, ISO 27001)'
    ],
    useCases: [
      'Monitor security patrols',
      'Track checkpoint scans',
      'Report security incidents',
      'Manage guard assignments'
    ]
  }
]

const bundleDiscount = 23; // 23% off for all three products
const bundlePrice = 20; // $20/user/month for all three

const testimonials = [
  {
    quote: "The Remote product transformed how we manage our distributed sales team. Task tracking and route optimization alone saved us 30% in operational costs.",
    author: "Sarah Chen",
    role: "VP of Operations", 
    company: "TechCorp Global",
    product: "Remote",
    rating: 5
  },
  {
    quote: "WorkforceOne Time eliminated our attendance headaches. GPS time clock and automated overtime calculations are game-changers for our hourly workforce.",
    author: "Michael Rodriguez",
    role: "HR Director",
    company: "Innovate Manufacturing",
    product: "Time", 
    rating: 5
  },
  {
    quote: "The Guard product gave us complete visibility into our security operations. Incident reporting and checkpoint monitoring improved our service quality dramatically.",
    author: "Emily Watson",
    role: "Security Operations Manager",
    company: "Metro Security Services",
    product: "Guard",
    rating: 5
  }
]

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setSelectedProduct((prev) => (prev + 1) % products.length)
    }, 6000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50">
      {/* Navigation */}
      <nav className="border-b bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-lg">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div>
                <span className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  WorkforceOne
                </span>
                <Badge variant="secondary" className="ml-2 text-xs">v2.0</Badge>
              </div>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <Link href="#products" className="text-gray-600 hover:text-gray-900 font-medium">
                Products
              </Link>
              <Link href="/pricing-calculator" className="text-gray-600 hover:text-gray-900 font-medium">
                Pricing
              </Link>
              <Link href="#guides" className="text-gray-600 hover:text-gray-900 font-medium">
                Resources
              </Link>
              <Link href="/help" className="text-gray-600 hover:text-gray-900 font-medium">
                Help
              </Link>
            </div>

            <div className="hidden md:flex items-center space-x-4">
              <Link href="/login" className="text-gray-600 hover:text-gray-900 font-medium">
                Sign In
              </Link>
              <Link href="/signup">
                <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg">
                  Start Free Trial
                </Button>
              </Link>
            </div>

            {/* Mobile menu button */}
            <button
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-t">
            <div className="px-4 py-2 space-y-1">
              <Link href="#products" className="block px-3 py-2 text-gray-600 hover:text-gray-900 font-medium">
                Products
              </Link>
              <Link href="/pricing-calculator" className="block px-3 py-2 text-gray-600 hover:text-gray-900 font-medium">
                Pricing
              </Link>
              <Link href="#guides" className="block px-3 py-2 text-gray-600 hover:text-gray-900 font-medium">
                Resources
              </Link>
              <Link href="/help" className="block px-3 py-2 text-gray-600 hover:text-gray-900 font-medium">
                Help
              </Link>
              <div className="pt-4 pb-3 border-t">
                <Link href="/login" className="block px-3 py-2 text-gray-600 hover:text-gray-900 font-medium">
                  Sign In
                </Link>
                <Link href="/signup" className="block px-3 py-2">
                  <Button className="w-full bg-gradient-to-r from-blue-600 to-indigo-600">
                    Start Free Trial
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative py-20 lg:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 opacity-50" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <Badge variant="outline" className="px-4 py-1">
                <Sparkles className="h-3 w-3 mr-1" />
                Three Products. One Platform. Complete Control.
              </Badge>
            </div>
            <h1 className="text-5xl lg:text-7xl font-bold mb-6 leading-tight">
              Choose Your Perfect
              <span className="block bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Workforce Solution
              </span>
            </h1>
            <p className="text-xl lg:text-2xl text-gray-600 mt-4 mb-8 max-w-4xl mx-auto leading-relaxed">
              Pay only for what you need. Start with one product or get the complete bundle. 
              Each solution is designed for specific workforce challenges.
            </p>
            
            {/* Quick Product Selector */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto mb-10">
              {products.map((product, idx) => {
                const IconComponent = product.icon
                const isSelected = selectedProduct === idx
                return (
                  <div 
                    key={idx} 
                    className={`p-4 rounded-xl cursor-pointer transition-all duration-300 ${
                      isSelected
                        ? product.color === 'blue' 
                          ? 'bg-blue-100 border-2 border-blue-500 shadow-lg transform scale-105'
                          : product.color === 'green'
                          ? 'bg-green-100 border-2 border-green-500 shadow-lg transform scale-105'
                          : 'bg-purple-100 border-2 border-purple-500 shadow-lg transform scale-105'
                        : 'bg-white border border-gray-200 hover:shadow-md'
                    }`}
                    onClick={() => setSelectedProduct(idx)}
                  >
                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-3 ${
                      product.color === 'blue' ? 'bg-gradient-to-br from-blue-500 to-blue-600' :
                      product.color === 'green' ? 'bg-gradient-to-br from-green-500 to-green-600' :
                      'bg-gradient-to-br from-purple-500 to-purple-600'
                    }`}>
                      <IconComponent className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="font-bold text-lg">{product.displayName}</h3>
                    <p className="text-sm text-gray-600 mb-2">{product.tagline}</p>
                    <p className="text-2xl font-bold text-gray-900">
                      ${product.monthlyPrice}
                      <span className="text-sm font-normal text-gray-600">/user/mo</span>
                    </p>
                  </div>
                )
              })}
            </div>

            {/* Bundle Offer */}
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl p-6 max-w-2xl mx-auto mb-8">
              <div className="flex items-center justify-center mb-3">
                <Package className="h-6 w-6 text-green-600 mr-2" />
                <span className="font-bold text-green-800">Complete Bundle</span>
                <Badge className="ml-2 bg-green-600">Save {bundleDiscount}%</Badge>
              </div>
              <p className="text-3xl font-bold text-green-900 mb-2">
                ${bundlePrice}/user/month
                <span className="text-lg line-through text-gray-500 ml-2">${products.reduce((sum, p) => sum + p.monthlyPrice, 0)}</span>
              </p>
              <p className="text-green-700">Get all three products for maximum savings</p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/signup">
                <Button size="lg" className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-lg px-8 shadow-xl">
                  Start Free 14-Day Trial
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/pricing-calculator">
                <Button variant="outline" size="lg" className="text-lg px-8 border-2">
                  <DollarSign className="mr-2 h-5 w-5" />
                  Calculate Your Cost
                </Button>
              </Link>
            </div>
            <p className="text-sm text-gray-500 mt-4">
              No credit card required • Setup in 5 minutes • Cancel anytime
            </p>
          </div>
        </div>
      </section>

      {/* Product Deep Dive */}
      <section id="products" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4">
              <Target className="h-3 w-3 mr-1" />
              Three Focused Solutions
            </Badge>
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              Built for Your Specific Needs
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Each product is expertly crafted to solve specific workforce challenges. 
              Choose one or combine them for maximum impact.
            </p>
          </div>

          {/* Product Tabs */}
          <div className="flex flex-wrap justify-center gap-2 mb-12">
            {products.map((product, idx) => {
              const IconComponent = product.icon
              const isSelected = selectedProduct === idx
              return (
                <button
                  key={idx}
                  onClick={() => setSelectedProduct(idx)}
                  className={`flex items-center px-6 py-3 rounded-xl font-medium transition-all ${
                    isSelected
                      ? product.color === 'blue'
                        ? 'bg-blue-100 text-blue-700 border-2 border-blue-500'
                        : product.color === 'green'
                        ? 'bg-green-100 text-green-700 border-2 border-green-500'
                        : 'bg-purple-100 text-purple-700 border-2 border-purple-500'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <IconComponent className="h-5 w-5 mr-2" />
                  {product.displayName}
                  <span className="ml-2 text-sm opacity-75">${product.monthlyPrice}/mo</span>
                </button>
              )
            })}
          </div>

          {/* Selected Product Details */}
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-8 lg:p-12">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <div className="flex items-center mb-6">
                  <div className={`w-16 h-16 rounded-xl flex items-center justify-center mr-4 ${
                    products[selectedProduct].color === 'blue' ? 'bg-gradient-to-br from-blue-500 to-blue-600' :
                    products[selectedProduct].color === 'green' ? 'bg-gradient-to-br from-green-500 to-green-600' :
                    'bg-gradient-to-br from-purple-500 to-purple-600'
                  }`}>
                    {(() => {
                      const IconComponent = products[selectedProduct].icon
                      return <IconComponent className="h-8 w-8 text-white" />
                    })()}
                  </div>
                  <div>
                    <h3 className="text-3xl font-bold text-gray-900">{products[selectedProduct].name}</h3>
                    <p className="text-lg text-gray-600">{products[selectedProduct].tagline}</p>
                  </div>
                </div>
                
                <p className="text-xl text-gray-700 mb-6 leading-relaxed">
                  {products[selectedProduct].description}
                </p>

                <div className="mb-6">
                  <h4 className="font-semibold text-gray-900 mb-3">Perfect for:</h4>
                  <p className="text-gray-600">{products[selectedProduct].popularWith}</p>
                </div>

                <div className="mb-6">
                  <h4 className="font-semibold text-gray-900 mb-3">Common Use Cases:</h4>
                  <ul className="space-y-2">
                    {products[selectedProduct].useCases.map((useCase, idx) => (
                      <li key={idx} className="flex items-start">
                        <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">{useCase}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex items-center space-x-4">
                  <div>
                    <span className="text-3xl font-bold text-gray-900">
                      ${products[selectedProduct].monthlyPrice}
                    </span>
                    <span className="text-lg text-gray-600">/user/month</span>
                  </div>
                  <span className="text-gray-400">or</span>
                  <div>
                    <span className="text-2xl font-bold text-gray-900">
                      ${products[selectedProduct].annualPrice}
                    </span>
                    <span className="text-sm text-gray-600">/user/year</span>
                    <Badge className="ml-2 bg-green-600">Save 20%</Badge>
                  </div>
                </div>
              </div>

              <div>
                <div className="bg-white rounded-xl p-6 shadow-lg">
                  <h4 className="font-bold text-xl mb-4 text-gray-900">Core Features</h4>
                  <ul className="space-y-3">
                    {products[selectedProduct].features.map((feature, idx) => (
                      <li key={idx} className="flex items-start">
                        <Check className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mt-6 pt-6 border-t">
                    <Link href={`/signup?product=${products[selectedProduct].code}`}>
                      <Button className={`w-full ${
                        products[selectedProduct].color === 'blue' 
                          ? 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800'
                          : products[selectedProduct].color === 'green'
                          ? 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800'
                          : 'bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800'
                      }`}>
                        Start Free Trial
                        <ArrowRight className="ml-2 h-5 w-5" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-4">
              <GitBranch className="h-3 w-3 mr-1" />
              Product Comparison
            </Badge>
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Choose What Fits Your Business
            </h2>
            <p className="text-xl text-gray-600 max-w-4xl mx-auto">
              All products share core workforce management capabilities, but each excels in specific areas. 
              Compare features to find your perfect match.
            </p>
          </div>

          {/* Key Distinctions */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  <Users className="h-8 w-8 text-blue-600 mr-3" />
                  <h3 className="font-bold text-lg text-blue-900">Remote Excels At</h3>
                </div>
                <ul className="space-y-2 text-sm text-blue-800">
                  <li>• <strong>Project Management:</strong> Complex workflows and task dependencies</li>
                  <li>• <strong>Route Optimization:</strong> AI-powered routing for field teams</li>
                  <li>• <strong>Outlet Management:</strong> Multi-location business operations</li>
                  <li>• <strong>White Labeling:</strong> Custom branding for resellers</li>
                  <li>• <strong>Client Portals:</strong> Customer-facing dashboards</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-green-200 bg-green-50">
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  <Clock className="h-8 w-8 text-green-600 mr-3" />
                  <h3 className="font-bold text-lg text-green-900">Time Excels At</h3>
                </div>
                <ul className="space-y-2 text-sm text-green-800">
                  <li>• <strong>GPS Time Tracking:</strong> Location-verified clock in/out</li>
                  <li>• <strong>Labor Compliance:</strong> FLSA overtime and break tracking</li>
                  <li>• <strong>Payroll Integration:</strong> Direct export to accounting systems</li>
                  <li>• <strong>Shift Management:</strong> Complex scheduling patterns</li>
                  <li>• <strong>Time Theft Prevention:</strong> Photo verification and geofencing</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-purple-200 bg-purple-50">
              <CardContent className="p-6">
                <div className="flex items-center mb-4">
                  <Shield className="h-8 w-8 text-purple-600 mr-3" />
                  <h3 className="font-bold text-lg text-purple-900">Guard Excels At</h3>
                </div>
                <ul className="space-y-2 text-sm text-purple-800">
                  <li>• <strong>Patrol Management:</strong> Dynamic routes with GPS waypoints</li>
                  <li>• <strong>Checkpoint Verification:</strong> QR code and NFC scanning</li>
                  <li>• <strong>Incident Documentation:</strong> Evidence capture and chain of custody</li>
                  <li>• <strong>Emergency Response:</strong> One-touch alerts and escalation</li>
                  <li>• <strong>Security Compliance:</strong> Industry standards (ASIS, SOC 2)</li>
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Shared Core Features */}
          <div className="bg-gray-50 rounded-2xl p-8 mb-12">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
              Core Features Available in All Products
            </h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { name: 'Team Management', desc: 'Add members, assign roles, manage permissions' },
                { name: 'Mobile Apps', desc: 'Native iOS & Android applications' },
                { name: 'Real-time GPS', desc: 'Live location tracking and geofencing' },
                { name: 'Notifications', desc: 'Push alerts and messaging system' },
                { name: 'Custom Reporting', desc: 'Analytics and dashboard customization' },
                { name: 'API Access', desc: 'REST API and webhook integrations' },
                { name: 'Multi-language', desc: 'Localization for global teams' },
                { name: 'Data Export', desc: 'CSV exports and automated backups' }
              ].map((feature, idx) => (
                <div key={idx} className="bg-white p-4 rounded-lg">
                  <div className="font-semibold text-gray-900 mb-1">{feature.name}</div>
                  <div className="text-xs text-gray-600">{feature.desc}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Feature Legend */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            <div className="flex items-center p-3 bg-blue-50 rounded-lg">
              <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
              <span className="text-sm font-medium text-gray-700">Core Features</span>
            </div>
            <div className="flex items-center p-3 bg-blue-25 rounded-lg">
              <div className="w-3 h-3 bg-blue-600 rounded-full mr-2"></div>
              <span className="text-sm font-medium text-gray-700">Remote Features</span>
            </div>
            <div className="flex items-center p-3 bg-green-25 rounded-lg">
              <div className="w-3 h-3 bg-green-600 rounded-full mr-2"></div>
              <span className="text-sm font-medium text-gray-700">Time Features</span>
            </div>
            <div className="flex items-center p-3 bg-purple-25 rounded-lg">
              <div className="w-3 h-3 bg-purple-600 rounded-full mr-2"></div>
              <span className="text-sm font-medium text-gray-700">Guard Features</span>
            </div>
            <div className="flex items-center p-3 bg-gray-50 rounded-lg">
              <div className="w-3 h-3 bg-gray-500 rounded-full mr-2"></div>
              <span className="text-sm font-medium text-gray-700">Shared Features</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Features</th>
                    {products.map((product) => {
                      const IconComponent = product.icon
                      return (
                        <th key={product.code} className="px-6 py-4 text-center">
                          <div className={`w-12 h-12 rounded-lg flex items-center justify-center mx-auto mb-2 ${
                            product.color === 'blue' ? 'bg-gradient-to-br from-blue-500 to-blue-600' :
                            product.color === 'green' ? 'bg-gradient-to-br from-green-500 to-green-600' :
                            'bg-gradient-to-br from-purple-500 to-purple-600'
                          }`}>
                            <IconComponent className="h-6 w-6 text-white" />
                          </div>
                          <div className="font-bold text-gray-900">{product.displayName}</div>
                          <div className="text-sm text-gray-600">${product.monthlyPrice}/user/mo</div>
                        </th>
                      )
                    })}
                    <th className="px-6 py-4 text-center">
                      <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center mx-auto mb-2">
                        <Package className="h-6 w-6 text-white" />
                      </div>
                      <div className="font-bold text-gray-900">Bundle</div>
                      <div className="text-sm text-gray-600">${bundlePrice}/user/mo</div>
                      <Badge className="mt-1 bg-green-600 text-xs">Save {bundleDiscount}%</Badge>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {[
                    // Core Foundation Features (All Products Need These)
                    { category: 'Team Management & User Roles', remote: true, time: true, guard: true, type: 'foundation', description: 'Add team members, assign roles, manage permissions' },
                    { category: 'Organization Management', remote: true, time: true, guard: true, type: 'foundation', description: 'Multi-tenant organization structure' },
                    { category: 'Mobile Apps (iOS & Android)', remote: true, time: true, guard: true, type: 'foundation', description: 'Native mobile applications' },
                    { category: 'Real-time Notifications', remote: true, time: true, guard: true, type: 'foundation', description: 'Push notifications and alerts' },
                    { category: 'API Access & Integrations', remote: true, time: true, guard: true, type: 'foundation', description: 'REST API and webhook support' },
                    
                    // Remote Product Specific Features
                    { category: 'Advanced Task Assignment', remote: true, time: false, guard: false, type: 'remote', description: 'AI-powered task distribution and project management' },
                    { category: 'Route Optimization', remote: true, time: false, guard: false, type: 'remote', description: 'Smart routing for field teams and service calls' },
                    { category: 'Outlet Management', remote: true, time: false, guard: false, type: 'remote', description: 'Multi-location business management' },
                    { category: 'Dynamic Form Builder', remote: true, time: false, guard: false, type: 'remote', description: 'Drag-and-drop custom forms with conditional logic' },
                    { category: 'Workflow Automation', remote: true, time: false, guard: false, type: 'remote', description: 'Automated business processes and approvals' },
                    { category: 'Project Templates', remote: true, time: false, guard: false, type: 'remote', description: 'Pre-built templates for common projects' },
                    { category: 'White Label Options', remote: true, time: false, guard: false, type: 'remote', description: 'Custom branding and white-label deployment' },
                    { category: 'Client Portal Access', remote: true, time: false, guard: false, type: 'remote', description: 'Customer-facing project dashboards' },
                    
                    // Time Product Specific Features
                    { category: 'GPS Time Clock', remote: false, time: true, guard: false, type: 'time', description: 'Location-verified time tracking with geofencing' },
                    { category: 'Automated Attendance', remote: false, time: true, guard: false, type: 'time', description: 'Real-time attendance monitoring and alerts' },
                    { category: 'Leave Management', remote: false, time: true, guard: false, type: 'time', description: 'PTO requests, approvals, and balance tracking' },
                    { category: 'Payroll Integration', remote: false, time: true, guard: false, type: 'time', description: 'Direct export to QuickBooks, ADP, Paychex, etc.' },
                    { category: 'Overtime Calculation', remote: false, time: true, guard: false, type: 'time', description: 'FLSA-compliant overtime tracking and reporting' },
                    { category: 'Break & Meal Tracking', remote: false, time: true, guard: false, type: 'time', description: 'Labor law compliance for breaks' },
                    { category: 'Shift Scheduling', remote: false, time: true, guard: false, type: 'time', description: 'Complex shift patterns and scheduling' },
                    { category: 'Time Theft Prevention', remote: false, time: true, guard: false, type: 'time', description: 'Photo verification and GPS validation' },
                    
                    // Guard Product Specific Features
                    { category: 'Patrol Route Management', remote: false, time: false, guard: true, type: 'guard', description: 'Dynamic patrol routes with GPS waypoints' },
                    { category: 'QR Code Checkpoints', remote: false, time: false, guard: true, type: 'guard', description: 'Checkpoint verification with QR/NFC scanning' },
                    { category: 'Incident Reporting', remote: false, time: false, guard: true, type: 'guard', description: 'Detailed incident reports with evidence capture' },
                    { category: 'Evidence Management', remote: false, time: false, guard: true, type: 'guard', description: 'Photo/video evidence with chain of custody' },
                    { category: 'Emergency Escalation', remote: false, time: false, guard: true, type: 'guard', description: 'One-touch emergency alerts and response' },
                    { category: 'Guard Scheduling & Assignment', remote: false, time: false, guard: true, type: 'guard', description: 'Site-specific guard assignments and skills matching' },
                    { category: 'Client Reporting Dashboard', remote: false, time: false, guard: true, type: 'guard', description: 'Automated security reports for clients' },
                    { category: 'Compliance Monitoring', remote: false, time: false, guard: true, type: 'guard', description: 'ASIS, SOC 2, and industry standard compliance' },
                    
                    // Shared Features (Multiple Products)
                    { category: 'Advanced GPS Tracking', remote: true, time: true, guard: true, type: 'shared', description: 'Real-time location tracking and geofencing' },
                    { category: 'Custom Reporting', remote: true, time: true, guard: true, type: 'shared', description: 'Customizable reports and analytics dashboards' },
                    { category: 'Data Export & Backup', remote: true, time: true, guard: true, type: 'shared', description: 'CSV exports and automated backups' },
                    { category: 'Multi-language Support', remote: true, time: true, guard: true, type: 'shared', description: 'Localization for global teams' },
                    
                  ].map((feature, idx) => {
                    const getRowClass = (type: string) => {
                      switch(type) {
                        case 'foundation': return 'bg-blue-50'
                        case 'remote': return 'bg-blue-25'
                        case 'time': return 'bg-green-25'  
                        case 'guard': return 'bg-purple-25'
                        case 'shared': return 'bg-gray-50'
                        default: return ''
                      }
                    }
                    
                    return (
                      <tr key={idx} className={`${getRowClass(feature.type)} hover:bg-opacity-75`}>
                        <td className="px-6 py-4">
                          <div className="flex items-start">
                            <div className="flex-1">
                              <div className="text-sm font-medium text-gray-900">{feature.category}</div>
                              <div className="text-xs text-gray-600 mt-1">{feature.description}</div>
                            </div>
                            {feature.type === 'foundation' && (
                              <Badge className="ml-2 bg-blue-600 text-xs">Core</Badge>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          {feature.remote ? (
                            <Check className="h-5 w-5 text-green-500 mx-auto" />
                          ) : (
                            <Minus className="h-5 w-5 text-gray-300 mx-auto" />
                          )}
                        </td>
                        <td className="px-6 py-4 text-center">
                          {feature.time ? (
                            <Check className="h-5 w-5 text-green-500 mx-auto" />
                          ) : (
                            <Minus className="h-5 w-5 text-gray-300 mx-auto" />
                          )}
                        </td>
                        <td className="px-6 py-4 text-center">
                          {feature.guard ? (
                            <Check className="h-5 w-5 text-green-500 mx-auto" />
                          ) : (
                            <Minus className="h-5 w-5 text-gray-300 mx-auto" />
                          )}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <Check className="h-5 w-5 text-green-500 mx-auto" />
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            <div className="bg-gray-50 px-6 py-4">
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/signup">
                  <Button size="lg" className="bg-gradient-to-r from-blue-600 to-indigo-600">
                    Get Started Free
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/pricing-calculator">
                  <Button variant="outline" size="lg">
                    <DollarSign className="mr-2 h-5 w-5" />
                    Calculate Your Cost
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials - Updated for Products */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4">
              <Award className="h-3 w-3 mr-1" />
              Customer Success Stories
            </Badge>
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              Real Results from Real Customers
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              See how our focused product approach delivers targeted solutions
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, idx) => {
              const product = products.find(p => p.displayName === testimonial.product)
              const badgeColor = product?.color === 'blue' ? 'bg-blue-600' :
                                product?.color === 'green' ? 'bg-green-600' : 'bg-purple-600'
              return (
                <Card key={idx} className="hover:shadow-xl transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center mb-4">
                      <Badge className={`mr-2 ${badgeColor}`}>
                        {testimonial.product}
                      </Badge>
                    <div className="flex">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 text-yellow-400 fill-current" />
                      ))}
                    </div>
                  </div>
                    <p className="text-gray-700 mb-4 italic">"{testimonial.quote}"</p>
                    <div className="border-t pt-4">
                      <div className="font-bold text-gray-900">{testimonial.author}</div>
                      <div className="text-sm text-gray-600">{testimonial.role}</div>
                      <div className="text-sm text-blue-600">{testimonial.company}</div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      </section>

      {/* Getting Started Guides */}
      <section id="guides" className="py-20 bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-4">
              <BookOpen className="h-3 w-3 mr-1" />
              Quick Start Guides
            </Badge>
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              Get Up and Running Fast
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Product-specific guides to help you maximize value from day one
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                title: 'Getting Started',
                description: 'Complete setup guide for new users',
                icon: Play,
                color: 'green',
                href: '/guides/getting-started'
              },
              {
                title: 'Remote Setup',
                description: 'Configure teams, tasks, and workflows',
                icon: Users,
                color: 'blue', 
                href: '/guides/remote'
              },
              {
                title: 'Time Tracking',
                description: 'Set up attendance and time management',
                icon: Clock,
                color: 'green',
                href: '/guides/time'
              },
              {
                title: 'Guard Operations',
                description: 'Configure patrols and security workflows',
                icon: Shield,
                color: 'purple',
                href: '/guides/guard'
              }
            ].map((guide, idx) => {
              const IconComponent = guide.icon
              return (
                <Link key={idx} href={guide.href}>
                  <Card className="hover:shadow-xl transition-all cursor-pointer h-full">
                    <CardContent className="p-6">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${
                        guide.color === 'blue' ? 'bg-gradient-to-br from-blue-500 to-blue-600' :
                        guide.color === 'green' ? 'bg-gradient-to-br from-green-500 to-green-600' :
                        guide.color === 'purple' ? 'bg-gradient-to-br from-purple-500 to-purple-600' :
                        'bg-gradient-to-br from-gray-500 to-gray-600'
                      }`}>
                        <IconComponent className="h-6 w-6 text-white" />
                      </div>
                    <h3 className="font-bold text-lg mb-2">{guide.title}</h3>
                    <p className="text-gray-600 text-sm mb-3">{guide.description}</p>
                      <div className="text-blue-600 font-medium text-sm flex items-center">
                        View Guide <ChevronRight className="h-4 w-4 ml-1" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
          </div>

          <div className="text-center mt-8">
            <Link href="/guides">
              <Button variant="outline" size="lg">
                View All Guides
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6">
            Ready to Transform Your Workforce Management?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Choose the perfect product combination for your business. Start free, scale as you grow.
          </p>
          
          {/* Pricing Summary */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 mb-8 max-w-2xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-white">
              <div>
                <div className="text-2xl font-bold">$8</div>
                <div className="text-sm opacity-90">Remote</div>
              </div>
              <div>
                <div className="text-2xl font-bold">$6</div>
                <div className="text-sm opacity-90">Time</div>
              </div>
              <div>
                <div className="text-2xl font-bold">$12</div>
                <div className="text-sm opacity-90">Guard</div>
              </div>
              <div>
                <div className="text-2xl font-bold">$20</div>
                <div className="text-sm opacity-90">Bundle (Save 23%)</div>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Link href="/signup">
              <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-50 text-lg px-8 shadow-xl">
                Start Free 14-Day Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/pricing-calculator">
              <Button 
                variant="outline" 
                size="lg" 
                className="text-white border-2 border-white/80 hover:bg-white hover:text-blue-600 hover:border-white transition-all duration-300 text-lg px-8 backdrop-blur-sm bg-white/10"
              >
                <DollarSign className="mr-2 h-5 w-5" />
                Calculate Your Cost
              </Button>
            </Link>
          </div>
          <div className="flex flex-wrap justify-center gap-6 text-white/90 text-sm">
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 mr-2" />
              No credit card required
            </div>
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 mr-2" />
              14-day free trial
            </div>
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 mr-2" />
              Cancel anytime
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-8">
            <div className="lg:col-span-2">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <span className="text-2xl font-bold">WorkforceOne</span>
              </div>
              <p className="text-gray-400 mb-6 max-w-md">
                Three focused workforce management products designed for modern businesses. 
                Pay only for what you need, scale as you grow.
              </p>
              <div className="flex space-x-4">
                <Badge variant="secondary" className="bg-gray-800">
                  SOC 2 Certified
                </Badge>
                <Badge variant="secondary" className="bg-gray-800">
                  GDPR Compliant
                </Badge>
                <Badge variant="secondary" className="bg-gray-800">
                  ISO 27001
                </Badge>
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4 text-gray-100">Products</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/products/remote" className="hover:text-white transition">Remote ($8/user)</Link></li>
                <li><Link href="/products/time" className="hover:text-white transition">Time ($6/user)</Link></li>
                <li><Link href="/products/guard" className="hover:text-white transition">Guard ($12/user)</Link></li>
                <li><Link href="/products/bundle" className="hover:text-white transition">Complete Bundle ($20)</Link></li>
                <li><Link href="/pricing-calculator" className="hover:text-white transition">Pricing Calculator</Link></li>
                <li><Link href="/mobile" className="hover:text-white transition">Mobile Apps</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4 text-gray-100">Resources</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/guides" className="hover:text-white transition">Setup Guides</Link></li>
                <li><Link href="/help" className="hover:text-white transition">Help Center</Link></li>
                <li><Link href="/api-docs" className="hover:text-white transition">API Docs</Link></li>
                <li><Link href="/status" className="hover:text-white transition">System Status</Link></li>
                <li><Link href="/security" className="hover:text-white transition">Security</Link></li>
                <li><Link href="/integrations" className="hover:text-white transition">Integrations</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4 text-gray-100">Company</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/about" className="hover:text-white transition">About Us</Link></li>
                <li><Link href="/contact" className="hover:text-white transition">Contact Sales</Link></li>
                <li><Link href="/careers" className="hover:text-white transition">Careers</Link></li>
                <li><Link href="/press" className="hover:text-white transition">Press Kit</Link></li>
                <li><Link href="/partners" className="hover:text-white transition">Partners</Link></li>
                <li><Link href="/blog" className="hover:text-white transition">Blog</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="flex flex-wrap justify-center md:justify-start gap-6 text-gray-400 text-sm mb-4 md:mb-0">
                <Link href="/privacy" className="hover:text-white transition">Privacy Policy</Link>
                <Link href="/terms" className="hover:text-white transition">Terms of Service</Link>
                <Link href="/cookies" className="hover:text-white transition">Cookie Policy</Link>
                <Link href="/dpa" className="hover:text-white transition">DPA</Link>
                <Link href="/sla" className="hover:text-white transition">SLA</Link>
              </div>
              <p className="text-center text-gray-400 text-sm">
                © 2025 WorkforceOne. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}