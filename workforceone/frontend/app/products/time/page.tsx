'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { 
  Clock, CheckCircle, ArrowRight, Star, Play, Calculator,
  MapPin, Calendar, DollarSign, Smartphone, Shield,
  Users, BarChart3, FileText, AlertCircle, Zap
} from 'lucide-react'

const features = [
  {
    category: 'Time Tracking',
    icon: Clock,
    items: [
      {
        name: 'GPS Time Clock',
        description: 'Location-based clock in/out with geofencing technology',
        benefit: 'Eliminate time theft and ensure accurate attendance'
      },
      {
        name: 'Mobile Time Clock',
        description: 'Clock in from anywhere with photo verification',
        benefit: 'Flexibility for remote and field workers'
      },
      {
        name: 'Offline Capability',
        description: 'Continue tracking time even without internet connection',
        benefit: 'Never lose time data, even in remote locations'
      }
    ]
  },
  {
    category: 'Attendance Management',
    icon: Users,
    items: [
      {
        name: 'Automated Attendance',
        description: 'Real-time attendance tracking with instant notifications',
        benefit: 'Reduce manual processes and improve accuracy'
      },
      {
        name: 'Shift Management',
        description: 'Create and manage complex shift patterns and schedules',
        benefit: 'Optimize workforce scheduling and coverage'
      },
      {
        name: 'Late/Early Warnings',
        description: 'Automatic alerts for tardiness and early departures',
        benefit: 'Proactive attendance management'
      }
    ]
  },
  {
    category: 'Leave Management',
    icon: Calendar,
    items: [
      {
        name: 'Leave Requests',
        description: 'Digital leave application with approval workflows',
        benefit: 'Streamlined leave processes and better planning'
      },
      {
        name: 'Balance Tracking',
        description: 'Automatic calculation of leave balances and accruals',
        benefit: 'Transparent leave management for employees'
      },
      {
        name: 'Policy Enforcement',
        description: 'Configurable leave policies with automatic validation',
        benefit: 'Ensure compliance with company policies'
      }
    ]
  },
  {
    category: 'Payroll Integration',
    icon: DollarSign,
    items: [
      {
        name: 'Overtime Calculation',
        description: 'Automatic overtime detection and calculation',
        benefit: 'Accurate payroll and compliance with labor laws'
      },
      {
        name: 'Payroll Reports',
        description: 'Detailed time reports ready for payroll processing',
        benefit: 'Reduce payroll processing time by 80%'
      },
      {
        name: 'Multi-rate Support',
        description: 'Different pay rates for various types of work',
        benefit: 'Accurate compensation for diverse work types'
      }
    ]
  }
]

const useCases = [
  {
    industry: 'Manufacturing',
    icon: Users,
    challenge: 'Tracking hourly workers across multiple shifts with complex overtime rules',
    solution: 'Shift management, automated overtime, and payroll integration',
    results: '90% reduction in payroll errors, 50% faster payroll processing'
  },
  {
    industry: 'Retail',
    icon: Clock,
    challenge: 'Managing part-time staff schedules and preventing time theft',
    solution: 'GPS time clock, geofencing, and real-time attendance monitoring',
    results: '15% reduction in labor costs, 99% attendance accuracy'
  },
  {
    industry: 'Healthcare',
    icon: Shield,
    challenge: 'Compliance with labor laws and managing nurse schedules',
    solution: 'Automated compliance reporting and flexible scheduling',
    results: '100% compliance, 30% improvement in staff satisfaction'
  },
  {
    industry: 'Construction',
    icon: MapPin,
    challenge: 'Tracking workers across multiple job sites with varying conditions',
    solution: 'Mobile time clock, offline capability, and photo verification',
    results: '25% improvement in time accuracy, 60% reduction in disputes'
  }
]

const testimonials = [
  {
    quote: "WorkforceOne Time solved our biggest headache - payroll accuracy. We went from spending 8 hours weekly on time corrections to just 30 minutes. The GPS tracking eliminated buddy punching completely.",
    author: "Maria Rodriguez",
    role: "HR Manager",
    company: "Precision Manufacturing",
    teamSize: "150 hourly workers",
    savings: "90% reduction in payroll errors",
    rating: 5
  },
  {
    quote: "The mobile time clock is a game-changer for our field crews. Workers love the simplicity, and we finally have accurate time data from all our job sites. ROI was immediate.",
    author: "James Thompson", 
    role: "Operations Director",
    company: "BuildRight Construction",
    teamSize: "75 field workers",
    savings: "25% improvement in time accuracy",
    rating: 5
  }
]

const complianceFeatures = [
  {
    name: 'FLSA Compliance',
    description: 'Automatic overtime calculations meeting federal standards',
    icon: Shield
  },
  {
    name: 'Break Tracking',
    description: 'Monitor required breaks and meal periods',
    icon: Clock
  },
  {
    name: 'Labor Law Reports',
    description: 'Generate compliance reports for audits',
    icon: FileText
  },
  {
    name: 'Wage & Hour Protection',
    description: 'Prevent underpayment with automated calculations',
    icon: DollarSign
  }
]

const integrations = [
  { name: 'QuickBooks', logo: '💰', description: 'Direct payroll export' },
  { name: 'ADP', logo: '💼', description: 'Seamless payroll integration' },
  { name: 'Paychex', logo: '💳', description: 'Automated time sync' },
  { name: 'BambooHR', logo: '🌿', description: 'HR system integration' },
  { name: 'Gusto', logo: '🎯', description: 'Payroll and benefits sync' },
  { name: 'Workday', logo: '📊', description: 'Enterprise HR integration' }
]

export default function TimeProductPage() {
  const [selectedFeature, setSelectedFeature] = useState(0)

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative py-20 lg:py-32 overflow-hidden bg-gradient-to-br from-green-50 to-emerald-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="flex items-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center mr-4">
                  <Clock className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 mb-2">
                    WorkforceOne Time
                  </h1>
                  <p className="text-xl text-green-600 font-semibold">Time & Attendance Tracking</p>
                </div>
              </div>
              
              <p className="text-xl text-gray-700 mb-8 leading-relaxed">
                Comprehensive time tracking and attendance management designed for hourly workforces. 
                Eliminate time theft, ensure compliance, and streamline payroll with GPS-enabled time tracking.
              </p>

              <div className="flex items-center space-x-6 mb-8">
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-900">$6</div>
                  <div className="text-sm text-gray-600">per user/month</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-900">$57.60</div>
                  <div className="text-sm text-gray-600">per user/year</div>
                  <Badge className="mt-1 bg-green-600">Save 20%</Badge>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <Link href="/signup?product=time">
                  <Button size="lg" className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-lg px-8">
                    Start Free Trial
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/demo?product=time">
                  <Button variant="outline" size="lg" className="text-lg px-8">
                    <Play className="mr-2 h-5 w-5" />
                    Watch Demo
                  </Button>
                </Link>
              </div>

              <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  14-day free trial
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  No setup fees
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  FLSA compliant
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="bg-white rounded-2xl shadow-2xl p-8 transform -rotate-2">
                <div className="bg-green-600 text-white p-4 rounded-lg mb-4">
                  <h3 className="font-bold">Perfect for:</h3>
                </div>
                <ul className="space-y-3">
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                    Hourly & shift workers
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                    Manufacturing companies
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                    Retail operations
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                    Healthcare facilities
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                    Field service teams
                  </li>
                </ul>
              </div>

              {/* Floating ROI Card */}
              <div className="absolute -top-4 -right-4 bg-green-600 text-white p-4 rounded-xl shadow-lg">
                <div className="text-center">
                  <div className="text-2xl font-bold">ROI</div>
                  <div className="text-sm">3-6 months</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Compliance Banner */}
      <section className="py-12 bg-green-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold mb-4">Built for Compliance & Accuracy</h2>
            <p className="text-green-100 max-w-2xl mx-auto">
              Stay compliant with federal and state labor laws while eliminating payroll errors
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {complianceFeatures.map((feature, idx) => (
              <div key={idx} className="text-center">
                <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <feature.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-semibold mb-2">{feature.name}</h3>
                <p className="text-sm text-green-100">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature Deep Dive */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Complete Time & Attendance Solution
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              From clock-in to payroll, every feature designed for hourly workforces
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12">
            {/* Feature List */}
            <div className="space-y-6">
              {features.map((category, idx) => (
                <Card 
                  key={idx} 
                  className={`cursor-pointer transition-all ${
                    selectedFeature === idx ? 'border-green-500 shadow-lg' : 'hover:shadow-md'
                  }`}
                  onClick={() => setSelectedFeature(idx)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-center mb-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center mr-4">
                        <category.icon className="h-6 w-6 text-white" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900">{category.category}</h3>
                    </div>
                    <div className="space-y-3">
                      {category.items.map((item, itemIdx) => (
                        <div key={itemIdx} className="border-l-4 border-green-200 pl-4">
                          <h4 className="font-semibold text-gray-900">{item.name}</h4>
                          <p className="text-sm text-gray-600">{item.description}</p>
                          <p className="text-sm text-green-600 font-medium">✓ {item.benefit}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Feature Preview */}
            <div className="sticky top-8">
              <div className="bg-white rounded-xl shadow-xl p-8">
                <div className="flex items-center mb-6">
                  {(() => {
                    const IconComponent = features[selectedFeature].icon
                    return <IconComponent className="h-8 w-8 text-green-600 mr-3" />
                  })()}
                  <h3 className="text-2xl font-bold text-gray-900">
                    {features[selectedFeature].category}
                  </h3>
                </div>
                
                <div className="space-y-4 mb-6">
                  {features[selectedFeature].items.map((item, idx) => (
                    <div key={idx} className="p-4 bg-green-50 rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold text-gray-900">{item.name}</h4>
                        <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                      </div>
                      <p className="text-gray-700 mb-2">{item.description}</p>
                      <div className="text-sm font-medium text-green-600 bg-green-100 px-3 py-1 rounded-full inline-block">
                        {item.benefit}
                      </div>
                    </div>
                  ))}
                </div>

                <Button className="w-full bg-gradient-to-r from-green-600 to-emerald-600">
                  Try This Feature Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ROI Calculator */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Calculate Your Time Tracking ROI
            </h2>
            <p className="text-xl text-gray-600">
              See how much WorkforceOne Time can save your business
            </p>
          </div>

          <Card className="p-8">
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">Annual Savings</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg">
                    <span className="text-gray-700">Reduced payroll processing time</span>
                    <span className="font-bold text-green-600">$8,000</span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg">
                    <span className="text-gray-700">Eliminated time theft</span>
                    <span className="font-bold text-green-600">$12,000</span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg">
                    <span className="text-gray-700">Compliance cost avoidance</span>
                    <span className="font-bold text-green-600">$5,000</span>
                  </div>
                  <div className="border-t pt-4">
                    <div className="flex justify-between items-center text-lg font-bold">
                      <span>Total Annual Savings</span>
                      <span className="text-green-600">$25,000</span>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">Investment</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                    <span className="text-gray-700">50 employees × $6/month</span>
                    <span className="font-bold text-gray-900">$3,600/year</span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                    <span className="text-gray-700">Setup & training</span>
                    <span className="font-bold text-gray-900">$1,000</span>
                  </div>
                  <div className="border-t pt-4">
                    <div className="flex justify-between items-center text-lg font-bold">
                      <span>Total Investment</span>
                      <span className="text-gray-900">$4,600</span>
                    </div>
                  </div>
                </div>

                <div className="mt-8 p-6 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl text-center">
                  <div className="text-3xl font-bold mb-2">443% ROI</div>
                  <div className="text-green-100">Net savings: $20,400/year</div>
                  <div className="text-sm text-green-200 mt-2">Based on industry averages</div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Proven Results Across Industries
            </h2>
            <p className="text-xl text-gray-600">
              See how Time solves industry-specific challenges
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {useCases.map((useCase, idx) => (
              <Card key={idx} className="hover:shadow-xl transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center mr-4">
                      <useCase.icon className="h-6 w-6 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">{useCase.industry}</h3>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-red-600 mb-2">Challenge:</h4>
                      <p className="text-gray-700">{useCase.challenge}</p>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold text-green-600 mb-2">Solution:</h4>
                      <p className="text-gray-700">{useCase.solution}</p>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold text-blue-600 mb-2">Results:</h4>
                      <p className="text-gray-700 font-medium">{useCase.results}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Customer Testimonials */}
      <section className="py-20 bg-gradient-to-br from-green-50 to-emerald-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              What Our Time Customers Say
            </h2>
            <p className="text-xl text-gray-600">
              Real results from businesses improving their time tracking
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {testimonials.map((testimonial, idx) => (
              <Card key={idx} className="hover:shadow-xl transition-shadow">
                <CardContent className="p-8">
                  <div className="flex mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  
                  <p className="text-lg text-gray-700 mb-6 italic">"{testimonial.quote}"</p>
                  
                  <div className="border-t pt-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <div className="font-bold text-gray-900">{testimonial.author}</div>
                        <div className="text-gray-600">{testimonial.role}</div>
                        <div className="text-green-600 font-medium">{testimonial.company}</div>
                      </div>
                      <Badge className="bg-green-600">Time Customer</Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Team Size:</span>
                        <div className="font-semibold text-gray-900">{testimonial.teamSize}</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Impact:</span>
                        <div className="font-semibold text-green-600">{testimonial.savings}</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Integrations */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Seamless Payroll Integrations
            </h2>
            <p className="text-xl text-gray-600">
              Export time data directly to your existing payroll system
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {integrations.map((integration, idx) => (
              <Card key={idx} className="text-center p-6 hover:shadow-lg transition-shadow">
                <div className="text-4xl mb-3">{integration.logo}</div>
                <h3 className="font-semibold text-gray-900 mb-2">{integration.name}</h3>
                <p className="text-sm text-gray-600">{integration.description}</p>
              </Card>
            ))}
          </div>

          <div className="text-center mt-12">
            <p className="text-gray-600 mb-4">Plus CSV export for any payroll system</p>
            <Link href="/integrations">
              <Button variant="outline" size="lg">
                View All Integrations
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-green-600 to-emerald-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Eliminate Time Tracking Headaches?
          </h2>
          <p className="text-xl text-green-100 mb-8">
            Join thousands of businesses saving time and money with accurate, compliant time tracking.
          </p>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 mb-8 max-w-md mx-auto">
            <div className="text-3xl font-bold text-white mb-2">$6/user/month</div>
            <div className="text-green-100">FLSA compliant • 14-day free trial</div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup?product=time">
              <Button size="lg" className="bg-white text-green-600 hover:bg-gray-50 text-lg px-8">
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/pricing-calculator">
              <Button 
                variant="outline" 
                size="lg" 
                className="text-white border-white hover:bg-white hover:text-green-600 text-lg px-8"
              >
                <Calculator className="mr-2 h-5 w-5" />
                Calculate ROI
              </Button>
            </Link>
          </div>
          
          <div className="flex justify-center gap-8 mt-8 text-green-100 text-sm">
            <div>✓ No setup fees</div>
            <div>✓ FLSA compliant</div>
            <div>✓ 443% average ROI</div>
          </div>
        </div>
      </section>
    </div>
  )
}