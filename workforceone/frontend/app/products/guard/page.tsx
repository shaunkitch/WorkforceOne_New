'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { 
  Shield, CheckCircle, ArrowRight, Star, Play, Camera,
  MapPin, AlertTriangle, QrCode, Smartphone, Clock,
  Users, BarChart3, FileText, Eye, Zap, Radio
} from 'lucide-react'

const features = [
  {
    category: 'Patrol Management',
    icon: MapPin,
    items: [
      {
        name: 'Dynamic Route Planning',
        description: 'Create flexible patrol routes with GPS waypoints and timing',
        benefit: 'Optimize coverage and ensure comprehensive security patrols'
      },
      {
        name: 'Real-time GPS Tracking',
        description: 'Monitor guard locations and patrol progress in real-time',
        benefit: 'Maintain accountability and respond quickly to incidents'
      },
      {
        name: 'Route Deviation Alerts',
        description: 'Automatic notifications when guards deviate from planned routes',
        benefit: 'Ensure complete area coverage and protocol adherence'
      }
    ]
  },
  {
    category: 'Checkpoint System',
    icon: QrCode,
    items: [
      {
        name: 'QR Code Checkpoints',
        description: 'Scan QR codes at key locations to verify patrol completion',
        benefit: 'Proof of presence and systematic checkpoint verification'
      },
      {
        name: 'NFC Tag Support',
        description: 'Alternative scanning method for harsh environments',
        benefit: 'Reliable checkpoint verification in all conditions'
      },
      {
        name: 'Missed Checkpoint Alerts',
        description: 'Immediate notifications for skipped or late checkpoints',
        benefit: 'Ensure complete patrol coverage and accountability'
      }
    ]
  },
  {
    category: 'Incident Reporting',
    icon: AlertTriangle,
    items: [
      {
        name: 'Mobile Incident Reports',
        description: 'Submit detailed incident reports with photos and location data',
        benefit: 'Complete documentation and evidence collection'
      },
      {
        name: 'Photo & Video Evidence',
        description: 'Capture visual evidence with automatic timestamp and location',
        benefit: 'Professional incident documentation for investigations'
      },
      {
        name: 'Emergency Escalation',
        description: 'One-touch emergency alerts with GPS location sharing',
        benefit: 'Rapid response to critical security situations'
      }
    ]
  },
  {
    category: 'Guard Management',
    icon: Users,
    items: [
      {
        name: 'Guard Scheduling',
        description: 'Assign guards to specific sites and shifts with skill matching',
        benefit: 'Optimal guard deployment and coverage planning'
      },
      {
        name: 'Performance Analytics',
        description: 'Track guard performance, response times, and patrol compliance',
        benefit: 'Data-driven guard evaluation and improvement'
      },
      {
        name: 'Communication Hub',
        description: 'Secure messaging and alert system for guard coordination',
        benefit: 'Seamless team coordination and information sharing'
      }
    ]
  }
]

const useCases = [
  {
    industry: 'Security Companies',
    icon: Shield,
    challenge: 'Managing multiple client sites with varying security requirements and protocols',
    solution: 'Multi-site management, custom patrol routes, and client-specific reporting',
    results: '40% improvement in patrol efficiency, 60% better client satisfaction'
  },
  {
    industry: 'Corporate Security',
    icon: Users,
    challenge: 'Ensuring comprehensive building security and emergency response readiness',
    solution: 'Systematic checkpoint verification, incident documentation, and emergency alerts',
    results: '90% reduction in security incidents, 50% faster emergency response'
  },
  {
    industry: 'Property Management',
    icon: MapPin,
    challenge: 'Monitoring large properties and ensuring tenant safety around the clock',
    solution: 'GPS tracking, photo verification, and automated reporting for property owners',
    results: '35% reduction in property crimes, 80% improvement in documentation'
  },
  {
    industry: 'Industrial Security',
    icon: AlertTriangle,
    challenge: 'Protecting high-value assets and ensuring compliance with safety protocols',
    solution: 'Asset-specific checkpoints, compliance reporting, and incident management',
    results: '25% reduction in security breaches, 100% audit compliance'
  }
]

const testimonials = [
  {
    quote: "WorkforceOne Guard transformed our security operations. We now have complete visibility into our guard activities across 50+ sites. Incident response time improved by 60% and client satisfaction scores are at an all-time high.",
    author: "Robert Johnson",
    role: "Operations Manager",
    company: "Premier Security Services",
    teamSize: "150+ security guards",
    savings: "60% faster incident response",
    rating: 5
  },
  {
    quote: "The checkpoint system is bulletproof. QR codes work perfectly even in our industrial environment, and the automated reporting saves us 20 hours per week. ROI was achieved in just 2 months.",
    author: "Sarah Kim", 
    role: "Security Director",
    company: "Industrial Safety Corp",
    teamSize: "40 security officers",
    savings: "20 hours/week saved on reporting",
    rating: 5
  }
]

const securityFeatures = [
  {
    name: 'End-to-End Encryption',
    description: 'All data encrypted in transit and at rest',
    icon: Shield
  },
  {
    name: 'Tamper Detection',
    description: 'Detect attempts to manipulate location or time data',
    icon: Eye
  },
  {
    name: 'Audit Trail',
    description: 'Complete activity logging for compliance and investigations',
    icon: FileText
  },
  {
    name: 'Emergency Protocols',
    description: 'Automated escalation and emergency response procedures',
    icon: AlertTriangle
  }
]

const industryCompliance = [
  { name: 'ASIS Standards', description: 'American Society for Industrial Security compliance' },
  { name: 'ISO 27001', description: 'Information security management certification' },
  { name: 'SOC 2 Type II', description: 'Security and availability controls audited' },
  { name: 'GDPR Compliant', description: 'European data protection regulation compliance' },
  { name: 'HIPAA Ready', description: 'Healthcare information protection standards' },
  { name: 'PCI DSS', description: 'Payment card industry data security standard' }
]

export default function GuardProductPage() {
  const [selectedFeature, setSelectedFeature] = useState(0)

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative py-20 lg:py-32 overflow-hidden bg-gradient-to-br from-purple-50 to-indigo-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="flex items-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center mr-4">
                  <Shield className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 mb-2">
                    WorkforceOne Guard
                  </h1>
                  <p className="text-xl text-purple-600 font-semibold">Security & Patrol Management</p>
                </div>
              </div>
              
              <p className="text-xl text-gray-700 mb-8 leading-relaxed">
                Professional security management system designed for guard services and patrol operations. 
                Monitor patrols, manage incidents, and ensure comprehensive security coverage with advanced tracking technology.
              </p>

              <div className="flex items-center space-x-6 mb-8">
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-900">$12</div>
                  <div className="text-sm text-gray-600">per user/month</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-900">$115.20</div>
                  <div className="text-sm text-gray-600">per user/year</div>
                  <Badge className="mt-1 bg-purple-600">Save 20%</Badge>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <Link href="/signup?product=guard">
                  <Button size="lg" className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-lg px-8">
                    Start Free Trial
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/demo?product=guard">
                  <Button variant="outline" size="lg" className="text-lg px-8">
                    <Play className="mr-2 h-5 w-5" />
                    Watch Demo
                  </Button>
                </Link>
              </div>

              <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-purple-500 mr-2" />
                  14-day free trial
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-purple-500 mr-2" />
                  SOC 2 certified
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-purple-500 mr-2" />
                  24/7 support
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="bg-white rounded-2xl shadow-2xl p-8 transform rotate-3">
                <div className="bg-purple-600 text-white p-4 rounded-lg mb-4">
                  <h3 className="font-bold">Perfect for:</h3>
                </div>
                <ul className="space-y-3">
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-purple-500 mr-3" />
                    Security guard companies
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-purple-500 mr-3" />
                    Corporate security teams
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-purple-500 mr-3" />
                    Property management
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-purple-500 mr-3" />
                    Industrial security
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-purple-500 mr-3" />
                    Event security
                  </li>
                </ul>
              </div>

              {/* Floating Security Badge */}
              <div className="absolute -top-4 -right-4 bg-purple-600 text-white p-4 rounded-xl shadow-lg">
                <div className="text-center">
                  <Shield className="h-8 w-8 mx-auto mb-1" />
                  <div className="text-sm font-bold">SOC 2</div>
                  <div className="text-xs">Certified</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Security Banner */}
      <section className="py-12 bg-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold mb-4">Enterprise-Grade Security</h2>
            <p className="text-purple-100 max-w-2xl mx-auto">
              Military-grade encryption and security protocols trusted by leading security companies
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {securityFeatures.map((feature, idx) => (
              <div key={idx} className="text-center">
                <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <feature.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-semibold mb-2">{feature.name}</h3>
                <p className="text-sm text-purple-100">{feature.description}</p>
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
              Complete Security Operations Platform
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              From patrol planning to incident reporting, everything security teams need
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12">
            {/* Feature List */}
            <div className="space-y-6">
              {features.map((category, idx) => (
                <Card 
                  key={idx} 
                  className={`cursor-pointer transition-all ${
                    selectedFeature === idx ? 'border-purple-500 shadow-lg' : 'hover:shadow-md'
                  }`}
                  onClick={() => setSelectedFeature(idx)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-center mb-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center mr-4">
                        <category.icon className="h-6 w-6 text-white" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900">{category.category}</h3>
                    </div>
                    <div className="space-y-3">
                      {category.items.map((item, itemIdx) => (
                        <div key={itemIdx} className="border-l-4 border-purple-200 pl-4">
                          <h4 className="font-semibold text-gray-900">{item.name}</h4>
                          <p className="text-sm text-gray-600">{item.description}</p>
                          <p className="text-sm text-purple-600 font-medium">✓ {item.benefit}</p>
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
                    return <IconComponent className="h-8 w-8 text-purple-600 mr-3" />
                  })()}
                  <h3 className="text-2xl font-bold text-gray-900">
                    {features[selectedFeature].category}
                  </h3>
                </div>
                
                <div className="space-y-4 mb-6">
                  {features[selectedFeature].items.map((item, idx) => (
                    <div key={idx} className="p-4 bg-purple-50 rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold text-gray-900">{item.name}</h4>
                        <CheckCircle className="h-5 w-5 text-purple-500 flex-shrink-0" />
                      </div>
                      <p className="text-gray-700 mb-2">{item.description}</p>
                      <div className="text-sm font-medium text-purple-600 bg-purple-100 px-3 py-1 rounded-full inline-block">
                        {item.benefit}
                      </div>
                    </div>
                  ))}
                </div>

                <Button className="w-full bg-gradient-to-r from-purple-600 to-indigo-600">
                  Try This Feature Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Technology Showcase */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Advanced Technology Stack
            </h2>
            <p className="text-xl text-gray-600">
              Cutting-edge technology designed for security professionals
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="text-center p-8">
              <QrCode className="h-16 w-16 text-purple-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-4">QR Code Technology</h3>
              <ul className="text-left space-y-2 text-gray-600">
                <li>• Weather-resistant QR codes</li>
                <li>• Instant scanning verification</li>
                <li>• Tamper-evident placement</li>
                <li>• Custom checkpoint data</li>
              </ul>
            </Card>

            <Card className="text-center p-8">
              <MapPin className="h-16 w-16 text-purple-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-4">GPS Tracking</h3>
              <ul className="text-left space-y-2 text-gray-600">
                <li>• Sub-meter GPS accuracy</li>
                <li>• Real-time location updates</li>
                <li>• Geofencing capabilities</li>
                <li>• Route optimization algorithms</li>
              </ul>
            </Card>

            <Card className="text-center p-8">
              <Camera className="h-16 w-16 text-purple-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-4">Evidence Capture</h3>
              <ul className="text-left space-y-2 text-gray-600">
                <li>• Automatic timestamp/location</li>
                <li>• High-resolution photo/video</li>
                <li>• Secure cloud storage</li>
                <li>• Chain of custody tracking</li>
              </ul>
            </Card>
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Proven Security Solutions
            </h2>
            <p className="text-xl text-gray-600">
              Trusted by security professionals across industries
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {useCases.map((useCase, idx) => (
              <Card key={idx} className="hover:shadow-xl transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center mr-4">
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
                      <h4 className="font-semibold text-purple-600 mb-2">Solution:</h4>
                      <p className="text-gray-700">{useCase.solution}</p>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold text-green-600 mb-2">Results:</h4>
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
      <section className="py-20 bg-gradient-to-br from-purple-50 to-indigo-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              What Security Professionals Say
            </h2>
            <p className="text-xl text-gray-600">
              Trusted by leading security companies and operations teams
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
                        <div className="text-purple-600 font-medium">{testimonial.company}</div>
                      </div>
                      <Badge className="bg-purple-600">Guard Customer</Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Team Size:</span>
                        <div className="font-semibold text-gray-900">{testimonial.teamSize}</div>
                      </div>
                      <div>
                        <span className="text-gray-600">Impact:</span>
                        <div className="font-semibold text-purple-600">{testimonial.savings}</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Compliance Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Industry Standards & Compliance
            </h2>
            <p className="text-xl text-gray-600">
              Meeting the highest security and compliance standards
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            {industryCompliance.map((standard, idx) => (
              <Card key={idx} className="text-center p-6 hover:shadow-lg transition-shadow">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="h-6 w-6 text-purple-600" />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{standard.name}</h3>
                <p className="text-sm text-gray-600">{standard.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-purple-600 to-indigo-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Elevate Your Security Operations?
          </h2>
          <p className="text-xl text-purple-100 mb-8">
            Join leading security companies using WorkforceOne Guard to deliver superior protection and accountability.
          </p>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 mb-8 max-w-md mx-auto">
            <div className="text-3xl font-bold text-white mb-2">$12/user/month</div>
            <div className="text-purple-100">Enterprise security • 14-day free trial</div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup?product=guard">
              <Button size="lg" className="bg-white text-purple-600 hover:bg-gray-50 text-lg px-8">
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/demo?product=guard">
              <Button 
                variant="outline" 
                size="lg" 
                className="text-white border-white hover:bg-white hover:text-purple-600 text-lg px-8"
              >
                <Shield className="mr-2 h-5 w-5" />
                Security Demo
              </Button>
            </Link>
          </div>
          
          <div className="flex justify-center gap-8 mt-8 text-purple-100 text-sm">
            <div>✓ SOC 2 certified</div>
            <div>✓ 24/7 support</div>
            <div>✓ Military-grade encryption</div>
          </div>
        </div>
      </section>
    </div>
  )
}