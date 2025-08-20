'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  Users, Clock, Shield, Search, ChevronRight, ArrowRight,
  CheckCircle, DollarSign, Star, HelpCircle, BookOpen,
  Target, Zap, Award, TrendingUp, Package, Settings,
  Phone, MessageSquare, FileText, ExternalLink
} from 'lucide-react'

const products = [
  {
    id: 'remote',
    name: 'WorkforceOne Remote',
    displayName: 'Remote',
    tagline: 'Team & Task Management',
    description: 'Complete workforce management solution for distributed teams and field workers.',
    monthlyPrice: 8,
    annualPrice: 76.80,
    icon: Users,
    color: 'blue',
    features: [
      { name: 'Team Management & Hierarchy', description: 'Organize teams with managers and reporting structures' },
      { name: 'Smart Task Assignment', description: 'AI-powered task distribution based on workload and skills' },
      { name: 'Project Management', description: 'Track projects from start to finish with templates and milestones' },
      { name: 'Dynamic Form Builder', description: 'Create custom forms with drag-and-drop interface and conditional logic' },
      { name: 'Route Optimization', description: 'AI-powered route planning for field teams to minimize travel time' },
      { name: 'Real-time Communication', description: 'Built-in messaging and notification system' },
      { name: 'Workflow Automation', description: 'Automate repetitive tasks and approval processes' },
      { name: 'Custom Dashboards', description: 'Personalized dashboards with key metrics and KPIs' },
      { name: 'Mobile Apps', description: 'Native iOS and Android apps for field workers' },
      { name: 'API Integrations', description: 'Connect with 1000+ business tools via Zapier and direct APIs' }
    ],
    useCases: [
      'Remote and distributed teams',
      'Field service companies',
      'Sales organizations',
      'Consulting firms',
      'Service-based businesses',
      'Property management',
      'Delivery and logistics'
    ],
    faqs: [
      {
        question: 'Can I manage multiple teams with different structures?',
        answer: 'Yes, Remote supports complex team hierarchies with different managers, reporting lines, and permissions for each team.'
      },
      {
        question: 'How does the route optimization work?',
        answer: 'Our AI analyzes factors like traffic, distance, appointment times, and team member skills to create the most efficient routes for your field teams.'
      },
      {
        question: 'Can I create custom forms for different types of work?',
        answer: 'Absolutely! The drag-and-drop form builder lets you create unlimited custom forms with conditional logic, file uploads, signatures, and more.'
      }
    ]
  },
  {
    id: 'time',
    name: 'WorkforceOne Time',
    displayName: 'Time',
    tagline: 'Time & Attendance Tracking',
    description: 'Comprehensive time tracking and attendance management designed for hourly workforces.',
    monthlyPrice: 6,
    annualPrice: 57.60,
    icon: Clock,
    color: 'green',
    features: [
      { name: 'GPS Time Clock', description: 'Location-verified clock in/out with geofencing technology' },
      { name: 'Mobile Time Clock', description: 'Clock in from anywhere with photo verification and offline capability' },
      { name: 'Automated Attendance', description: 'Real-time attendance tracking with instant notifications for tardiness' },
      { name: 'Shift Management', description: 'Create and manage complex shift patterns and schedules' },
      { name: 'Leave Management', description: 'Digital leave requests with approval workflows and balance tracking' },
      { name: 'Overtime Calculation', description: 'Automatic overtime detection and calculation based on labor laws' },
      { name: 'Payroll Integration', description: 'Direct export to QuickBooks, ADP, Paychex, and other payroll systems' },
      { name: 'Compliance Reporting', description: 'FLSA-compliant reports for audits and labor law compliance' },
      { name: 'Break Tracking', description: 'Monitor required breaks and meal periods for compliance' },
      { name: 'Time Theft Prevention', description: 'GPS verification and photo capture prevent buddy punching' }
    ],
    useCases: [
      'Hourly and shift workers',
      'Manufacturing companies',
      'Retail operations',
      'Healthcare facilities',
      'Construction companies',
      'Restaurants and hospitality',
      'Warehouses and distribution'
    ],
    faqs: [
      {
        question: 'How accurate is the GPS time tracking?',
        answer: 'Our GPS tracking is accurate to within 3-5 meters and uses geofencing to ensure employees are at the correct location when clocking in.'
      },
      {
        question: 'What happens if there\'s no internet connection?',
        answer: 'The mobile app works offline and automatically syncs time entries when connection is restored, ensuring no time data is ever lost.'
      },
      {
        question: 'Does it integrate with our existing payroll system?',
        answer: 'Yes, Time integrates with major payroll systems including QuickBooks, ADP, Paychex, Gusto, and others. We also provide CSV export for any system.'
      }
    ]
  },
  {
    id: 'guard',
    name: 'WorkforceOne Guard',
    displayName: 'Guard',
    tagline: 'Security & Patrol Management',
    description: 'Professional security management system designed for guard services and patrol operations.',
    monthlyPrice: 12,
    annualPrice: 115.20,
    icon: Shield,
    color: 'purple',
    features: [
      { name: 'Dynamic Patrol Routes', description: 'Create flexible patrol routes with GPS waypoints and timing requirements' },
      { name: 'QR Code Checkpoints', description: 'Scan QR codes and NFC tags at key locations to verify patrol completion' },
      { name: 'Real-time GPS Tracking', description: 'Monitor guard locations and patrol progress with live GPS tracking' },
      { name: 'Incident Reporting', description: 'Submit detailed incident reports with photos, videos, and location data' },
      { name: 'Evidence Capture', description: 'Capture visual evidence with automatic timestamp and GPS coordinates' },
      { name: 'Emergency Escalation', description: 'One-touch emergency alerts with GPS location sharing' },
      { name: 'Guard Scheduling', description: 'Assign guards to specific sites and shifts with skill matching' },
      { name: 'Performance Analytics', description: 'Track guard performance, response times, and patrol compliance' },
      { name: 'Client Reporting', description: 'Automated reports for clients with patrol summaries and incidents' },
      { name: 'Compliance Features', description: 'Meet industry standards including ASIS, ISO 27001, and SOC 2' }
    ],
    useCases: [
      'Security guard companies',
      'Corporate security teams',
      'Property management',
      'Industrial security',
      'Event security',
      'Healthcare security',
      'Educational institutions'
    ],
    faqs: [
      {
        question: 'How do the QR code checkpoints work?',
        answer: 'QR codes are placed at strategic locations. Guards scan them with the mobile app to prove they visited that location at a specific time. The system detects missed or late checkpoints.'
      },
      {
        question: 'Can we customize reports for different clients?',
        answer: 'Yes, Guard provides customizable reporting templates for different client needs, including automated daily, weekly, and monthly reports.'
      },
      {
        question: 'Is the system compliant with security industry standards?',
        answer: 'Yes, Guard meets ASIS standards, is ISO 27001 certified, SOC 2 compliant, and includes features for GDPR and other regulatory requirements.'
      }
    ]
  }
]

const bundleFeatures = [
  'All features from Remote, Time, and Guard products',
  'Cross-product data sharing and reporting',
  'Unified dashboard with all business metrics',
  'Advanced analytics across all operations',
  'Priority customer support',
  'Custom integrations and implementations',
  'Volume discounts for large deployments'
]

export default function ProductsHelpPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null)
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null)

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    product.features.some(feature => 
      feature.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      feature.description.toLowerCase().includes(searchQuery.toLowerCase())
    )
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">WorkforceOne Products</h1>
              <p className="text-lg text-gray-600 mt-2">
                Choose the right products for your business needs
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/pricing-calculator">
                <Button variant="outline" className="flex items-center">
                  <DollarSign className="h-4 w-4 mr-2" />
                  Pricing Calculator
                </Button>
              </Link>
              <Link href="/onboarding">
                <Button className="bg-blue-600 hover:bg-blue-700 flex items-center">
                  <Star className="h-4 w-4 mr-2" />
                  Get Started
                </Button>
              </Link>
            </div>
          </div>

          {/* Search */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search products and features..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-8 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Quick Navigation</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <button
                    onClick={() => setSelectedProduct(null)}
                    className={`w-full text-left px-3 py-2 rounded-md transition-colors ${
                      selectedProduct === null ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'
                    }`}
                  >
                    <Package className="h-4 w-4 inline mr-2" />
                    All Products
                  </button>
                  {products.map((product) => {
                    const IconComponent = product.icon
                    return (
                      <button
                        key={product.id}
                        onClick={() => setSelectedProduct(product.id)}
                        className={`w-full text-left px-3 py-2 rounded-md transition-colors ${
                          selectedProduct === product.id 
                            ? `bg-${product.color}-100 text-${product.color}-700` 
                            : 'hover:bg-gray-100'
                        }`}
                      >
                        <IconComponent className="h-4 w-4 inline mr-2" />
                        {product.displayName}
                      </button>
                    )
                  })}
                  <button
                    onClick={() => setSelectedProduct('bundle')}
                    className={`w-full text-left px-3 py-2 rounded-md transition-colors ${
                      selectedProduct === 'bundle' ? 'bg-gradient-to-r from-blue-100 to-purple-100 text-gray-700' : 'hover:bg-gray-100'
                    }`}
                  >
                    <Award className="h-4 w-4 inline mr-2" />
                    Complete Bundle
                  </button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Need Help?</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Link href="/help/getting-started">
                    <Button variant="outline" className="w-full justify-start">
                      <BookOpen className="h-4 w-4 mr-2" />
                      Getting Started Guide
                    </Button>
                  </Link>
                  <Link href="/demo">
                    <Button variant="outline" className="w-full justify-start">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Watch Product Demos
                    </Button>
                  </Link>
                  <Link href="/contact">
                    <Button variant="outline" className="w-full justify-start">
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Contact Support
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {selectedProduct === 'bundle' ? (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-2xl flex items-center">
                        <Award className="h-8 w-8 mr-3 text-yellow-500" />
                        Complete Bundle
                      </CardTitle>
                      <p className="text-gray-600 mt-2">
                        Get all three products for maximum value and capabilities
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-gray-900">$20</div>
                      <div className="text-sm text-gray-600">per user/month</div>
                      <Badge className="bg-green-600 mt-2">Save 23%</Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-8">
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg">
                    <h3 className="text-xl font-bold mb-4">Why Choose the Complete Bundle?</h3>
                    <ul className="grid md:grid-cols-2 gap-3">
                      {bundleFeatures.map((feature, idx) => (
                        <li key={idx} className="flex items-start">
                          <CheckCircle className="h-5 w-5 text-green-500 mr-3 flex-shrink-0 mt-0.5" />
                          <span className="text-gray-700">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="grid md:grid-cols-3 gap-6">
                    {products.map((product) => {
                      const IconComponent = product.icon
                      return (
                        <Card key={product.id} className={`border-2 border-${product.color}-200`}>
                          <CardContent className="p-6">
                            <div className="flex items-center mb-4">
                              <div className={`w-12 h-12 bg-${product.color}-100 rounded-lg flex items-center justify-center mr-3`}>
                                <IconComponent className={`h-6 w-6 text-${product.color}-600`} />
                              </div>
                              <div>
                                <h4 className="font-bold">{product.displayName}</h4>
                                <p className="text-sm text-gray-600">{product.tagline}</p>
                              </div>
                            </div>
                            <p className="text-sm text-gray-700 mb-4">{product.description}</p>
                            <div className="text-sm text-gray-600">
                              <span className="font-medium">Standalone: ${product.monthlyPrice}/user</span>
                              <br />
                              <span className="text-green-600 font-medium">In Bundle: ${(20/3).toFixed(2)}/user</span>
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>

                  <div className="text-center">
                    <Link href="/onboarding">
                      <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                        Start Complete Bundle Free Trial
                        <ArrowRight className="ml-2 h-5 w-5" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ) : selectedProduct ? (
              (() => {
                const product = products.find(p => p.id === selectedProduct)!
                const IconComponent = product.icon
                return (
                  <div className="space-y-8">
                    {/* Product Overview */}
                    <Card>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <div className={`w-16 h-16 bg-${product.color}-100 rounded-xl flex items-center justify-center mr-4`}>
                              <IconComponent className={`h-8 w-8 text-${product.color}-600`} />
                            </div>
                            <div>
                              <CardTitle className="text-3xl">{product.name}</CardTitle>
                              <p className="text-lg text-gray-600 mt-1">{product.tagline}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-3xl font-bold text-gray-900">${product.monthlyPrice}</div>
                            <div className="text-sm text-gray-600">per user/month</div>
                            <div className="text-sm text-gray-500 mt-1">${product.annualPrice}/year (save 20%)</div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-lg text-gray-700 mb-6">{product.description}</p>
                        <div className="flex flex-col sm:flex-row gap-4">
                          <Link href={`/products/${product.id}`}>
                            <Button size="lg" className={`bg-${product.color}-600 hover:bg-${product.color}-700`}>
                              View Full Product Page
                              <ArrowRight className="ml-2 h-5 w-5" />
                            </Button>
                          </Link>
                          <Link href="/onboarding">
                            <Button variant="outline" size="lg">
                              Start Free Trial
                            </Button>
                          </Link>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Features */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-xl">Key Features</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid md:grid-cols-2 gap-6">
                          {product.features.map((feature, idx) => (
                            <div key={idx} className="flex items-start">
                              <CheckCircle className={`h-5 w-5 text-${product.color}-500 mr-3 flex-shrink-0 mt-1`} />
                              <div>
                                <h4 className="font-semibold text-gray-900">{feature.name}</h4>
                                <p className="text-sm text-gray-600 mt-1">{feature.description}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Use Cases */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-xl">Perfect For</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {product.useCases.map((useCase, idx) => (
                            <div key={idx} className={`flex items-center p-3 bg-${product.color}-50 rounded-lg`}>
                              <Target className={`h-4 w-4 text-${product.color}-600 mr-2`} />
                              <span className="text-gray-700">{useCase}</span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    {/* FAQ */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-xl">Frequently Asked Questions</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {product.faqs.map((faq, idx) => (
                          <div key={idx} className="border rounded-lg">
                            <button
                              className="w-full text-left px-4 py-3 flex items-center justify-between hover:bg-gray-50"
                              onClick={() => setExpandedFaq(expandedFaq === `${product.id}-${idx}` ? null : `${product.id}-${idx}`)}
                            >
                              <span className="font-medium text-gray-900">{faq.question}</span>
                              <ChevronRight className={`h-4 w-4 text-gray-500 transition-transform ${
                                expandedFaq === `${product.id}-${idx}` ? 'rotate-90' : ''
                              }`} />
                            </button>
                            {expandedFaq === `${product.id}-${idx}` && (
                              <div className="px-4 pb-4 text-gray-700">
                                {faq.answer}
                              </div>
                            )}
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  </div>
                )
              })()
            ) : (
              <div className="space-y-8">
                {/* Overview */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-2xl">Choose Your WorkforceOne Products</CardTitle>
                    <p className="text-gray-600">
                      WorkforceOne offers three specialized products that work together or independently. 
                      Each product is designed to solve specific workforce management challenges.
                    </p>
                  </CardHeader>
                </Card>

                {/* Products Grid */}
                <div className="grid lg:grid-cols-2 gap-8">
                  {filteredProducts.map((product) => {
                    const IconComponent = product.icon
                    return (
                      <Card key={product.id} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setSelectedProduct(product.id)}>
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center">
                              <div className={`w-12 h-12 bg-${product.color}-100 rounded-lg flex items-center justify-center mr-4`}>
                                <IconComponent className={`h-6 w-6 text-${product.color}-600`} />
                              </div>
                              <div>
                                <h3 className="text-xl font-bold text-gray-900">{product.displayName}</h3>
                                <p className={`text-${product.color}-600 font-medium`}>{product.tagline}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-2xl font-bold text-gray-900">${product.monthlyPrice}</div>
                              <div className="text-sm text-gray-600">per user/month</div>
                            </div>
                          </div>
                          
                          <p className="text-gray-700 mb-4">{product.description}</p>
                          
                          <div className="space-y-2 mb-4">
                            {product.features.slice(0, 4).map((feature, idx) => (
                              <div key={idx} className="flex items-center text-sm">
                                <CheckCircle className={`h-3 w-3 text-${product.color}-500 mr-2`} />
                                <span className="text-gray-600">{feature.name}</span>
                              </div>
                            ))}
                            {product.features.length > 4 && (
                              <div className="text-sm text-gray-500">
                                +{product.features.length - 4} more features
                              </div>
                            )}
                          </div>
                          
                          <div className="flex items-center text-sm text-gray-600">
                            <span>Perfect for: {product.useCases.slice(0, 2).join(', ')}</span>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>

                {/* Bundle CTA */}
                <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200">
                  <CardContent className="p-8 text-center">
                    <div className="flex items-center justify-center mb-4">
                      <Award className="h-12 w-12 text-yellow-500" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">
                      Get All Three Products for Maximum Value
                    </h3>
                    <p className="text-lg text-gray-700 mb-4">
                      Complete Bundle: $20/user/month (save 23% vs individual products)
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                      <Button 
                        size="lg" 
                        className="bg-gradient-to-r from-blue-600 to-purple-600"
                        onClick={() => setSelectedProduct('bundle')}
                      >
                        <Award className="mr-2 h-5 w-5" />
                        View Bundle Details
                      </Button>
                      <Link href="/onboarding">
                        <Button variant="outline" size="lg">
                          Start Bundle Trial
                          <ArrowRight className="ml-2 h-5 w-5" />
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}