'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { 
  Users, CheckCircle, ArrowRight, Star, Play, FileText,
  MapPin, Workflow, BarChart3, Smartphone, Clock,
  MessageSquare, Calendar, Target, Zap, Route
} from 'lucide-react'

const features = [
  {
    category: 'Team Management',
    icon: Users,
    items: [
      {
        name: 'Team Hierarchy',
        description: 'Create complex team structures with managers and reporting lines',
        benefit: 'Clear accountability and streamlined communication'
      },
      {
        name: 'Role-based Permissions',
        description: 'Granular access control for different team roles',
        benefit: 'Enhanced security and appropriate data access'
      },
      {
        name: 'Team Performance Analytics',
        description: 'Track team productivity and identify improvement areas',
        benefit: 'Data-driven team optimization'
      }
    ]
  },
  {
    category: 'Task & Project Management',
    icon: Target,
    items: [
      {
        name: 'Smart Task Assignment',
        description: 'AI-powered task distribution based on workload and skills',
        benefit: 'Balanced workloads and improved efficiency'
      },
      {
        name: 'Project Templates',
        description: 'Pre-built templates for common project types',
        benefit: 'Faster project setup and consistency'
      },
      {
        name: 'Progress Tracking',
        description: 'Real-time visibility into task and project progress',
        benefit: 'Better project control and deadline management'
      }
    ]
  },
  {
    category: 'Dynamic Forms',
    icon: FileText,
    items: [
      {
        name: 'Drag & Drop Builder',
        description: 'Visual form creation with conditional logic',
        benefit: 'Custom forms without technical knowledge'
      },
      {
        name: 'Digital Signatures',
        description: 'Legally binding e-signatures integrated into forms',
        benefit: 'Paperless workflows and faster approvals'
      },
      {
        name: 'Form Analytics',
        description: 'Track form completion rates and user behavior',
        benefit: 'Optimize forms for better completion rates'
      }
    ]
  },
  {
    category: 'Route Optimization',
    icon: MapPin,
    items: [
      {
        name: 'AI Route Planning',
        description: 'Intelligent route optimization for field teams',
        benefit: 'Reduced travel time and fuel costs'
      },
      {
        name: 'Real-time GPS Tracking',
        description: 'Live location tracking for all field personnel',
        benefit: 'Better coordination and customer updates'
      },
      {
        name: 'Geofenced Check-ins',
        description: 'Automatic check-ins when arriving at locations',
        benefit: 'Accurate visit tracking and accountability'
      }
    ]
  }
]

const useCases = [
  {
    industry: 'Sales Teams',
    icon: Users,
    challenge: 'Managing distributed sales reps and tracking territory performance',
    solution: 'Territory management, lead assignment, and performance analytics',
    results: '30% increase in sales productivity, 45% better territory coverage'
  },
  {
    industry: 'Field Services',
    icon: Route,
    challenge: 'Coordinating technicians and optimizing service routes',
    solution: 'Route optimization, real-time tracking, and job assignment',
    results: '25% reduction in travel time, 40% more jobs completed daily'
  },
  {
    industry: 'Consulting Firms',
    icon: BarChart3,
    challenge: 'Project management and resource allocation across clients',
    solution: 'Project templates, resource planning, and time tracking',
    results: '20% improvement in project delivery, 35% better resource utilization'
  },
  {
    industry: 'Property Management',
    icon: MapPin,
    challenge: 'Managing maintenance teams across multiple properties',
    solution: 'Work order management, inspector routing, and tenant communication',
    results: '50% faster response times, 60% increase in tenant satisfaction'
  }
]

const testimonials = [
  {
    quote: "WorkforceOne Remote revolutionized how we manage our 50+ field sales reps. The route optimization alone saved us $50K annually in travel costs, and task tracking improved our close rate by 35%.",
    author: "Jennifer Martinez",
    role: "VP of Sales Operations",
    company: "TechSolutions Inc.",
    teamSize: "50+ field reps",
    savings: "$50K annually",
    rating: 5
  },
  {
    quote: "The form builder is incredible. We created custom inspection forms in minutes that used to take our IT team weeks to develop. Our field teams love the mobile app - it's intuitive and fast.",
    author: "David Chen", 
    role: "Operations Director",
    company: "Metro Property Services",
    teamSize: "25 inspectors",
    savings: "80% faster form creation",
    rating: 5
  }
]

const integrations = [
  { name: 'Google Workspace', logo: '📧', description: 'Calendar sync and email integration' },
  { name: 'Microsoft 365', logo: '💼', description: 'Teams integration and file sync' },
  { name: 'Slack', logo: '💬', description: 'Real-time notifications and updates' },
  { name: 'Salesforce', logo: '☁️', description: 'CRM sync and lead management' },
  { name: 'QuickBooks', logo: '💰', description: 'Financial reporting integration' },
  { name: 'Zapier', logo: '⚡', description: '1000+ app integrations' }
]

export default function RemoteProductPage() {
  const [selectedFeature, setSelectedFeature] = useState(0)

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative py-20 lg:py-32 overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="flex items-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center mr-4">
                  <Users className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 mb-2">
                    WorkforceOne Remote
                  </h1>
                  <p className="text-xl text-blue-600 font-semibold">Team & Task Management</p>
                </div>
              </div>
              
              <p className="text-xl text-gray-700 mb-8 leading-relaxed">
                Complete workforce management solution for distributed teams. Manage projects, 
                assign tasks, optimize routes, and keep everyone connected with powerful collaboration tools.
              </p>

              <div className="flex items-center space-x-6 mb-8">
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-900">$8</div>
                  <div className="text-sm text-gray-600">per user/month</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-900">$76.80</div>
                  <div className="text-sm text-gray-600">per user/year</div>
                  <Badge className="mt-1 bg-green-600">Save 20%</Badge>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <Link href="/signup?product=remote">
                  <Button size="lg" className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-lg px-8">
                    Start Free Trial
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/demo?product=remote">
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
                  No credit card required
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                  Setup in 5 minutes
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="bg-white rounded-2xl shadow-2xl p-8 transform rotate-2">
                <div className="bg-blue-600 text-white p-4 rounded-lg mb-4">
                  <h3 className="font-bold">Perfect for:</h3>
                </div>
                <ul className="space-y-3">
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                    Remote & distributed teams
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                    Field service companies
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                    Sales organizations
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                    Consulting firms
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-500 mr-3" />
                    Project-based businesses
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Deep Dive */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Everything You Need to Manage Remote Teams
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Comprehensive tools designed specifically for distributed workforce challenges
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12">
            {/* Feature List */}
            <div className="space-y-6">
              {features.map((category, idx) => (
                <Card 
                  key={idx} 
                  className={`cursor-pointer transition-all ${
                    selectedFeature === idx ? 'border-blue-500 shadow-lg' : 'hover:shadow-md'
                  }`}
                  onClick={() => setSelectedFeature(idx)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-center mb-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center mr-4">
                        <category.icon className="h-6 w-6 text-white" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900">{category.category}</h3>
                    </div>
                    <div className="space-y-3">
                      {category.items.map((item, itemIdx) => (
                        <div key={itemIdx} className="border-l-4 border-blue-200 pl-4">
                          <h4 className="font-semibold text-gray-900">{item.name}</h4>
                          <p className="text-sm text-gray-600">{item.description}</p>
                          <p className="text-sm text-blue-600 font-medium">✓ {item.benefit}</p>
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
                    return <IconComponent className="h-8 w-8 text-blue-600 mr-3" />
                  })()}
                  <h3 className="text-2xl font-bold text-gray-900">
                    {features[selectedFeature].category}
                  </h3>
                </div>
                
                <div className="space-y-4 mb-6">
                  {features[selectedFeature].items.map((item, idx) => (
                    <div key={idx} className="p-4 bg-blue-50 rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold text-gray-900">{item.name}</h4>
                        <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                      </div>
                      <p className="text-gray-700 mb-2">{item.description}</p>
                      <div className="text-sm font-medium text-blue-600 bg-blue-100 px-3 py-1 rounded-full inline-block">
                        {item.benefit}
                      </div>
                    </div>
                  ))}
                </div>

                <Button className="w-full bg-gradient-to-r from-blue-600 to-indigo-600">
                  Try This Feature Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Proven Results Across Industries
            </h2>
            <p className="text-xl text-gray-600">
              See how Remote transforms different types of businesses
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {useCases.map((useCase, idx) => (
              <Card key={idx} className="hover:shadow-xl transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center mr-4">
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
                      <h4 className="font-semibold text-blue-600 mb-2">Solution:</h4>
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
      <section className="py-20 bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              What Our Remote Customers Say
            </h2>
            <p className="text-xl text-gray-600">
              Real stories from businesses transforming their operations
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
                        <div className="text-blue-600 font-medium">{testimonial.company}</div>
                      </div>
                      <Badge className="bg-blue-600">Remote Customer</Badge>
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
              Integrates with Your Existing Tools
            </h2>
            <p className="text-xl text-gray-600">
              Connect Remote with the tools your team already uses
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
            <p className="text-gray-600 mb-4">Plus 1000+ more integrations via Zapier</p>
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
      <section className="py-20 bg-gradient-to-r from-blue-600 to-indigo-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Transform Your Remote Team Management?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of teams already using WorkforceOne Remote to streamline operations and boost productivity.
          </p>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 mb-8 max-w-md mx-auto">
            <div className="text-3xl font-bold text-white mb-2">$8/user/month</div>
            <div className="text-blue-100">Everything included • 14-day free trial</div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup?product=remote">
              <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-50 text-lg px-8">
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/demo?product=remote">
              <Button 
                variant="outline" 
                size="lg" 
                className="text-white border-white hover:bg-white hover:text-blue-600 text-lg px-8"
              >
                <Play className="mr-2 h-5 w-5" />
                Watch Demo
              </Button>
            </Link>
          </div>
          
          <div className="flex justify-center gap-8 mt-8 text-blue-100 text-sm">
            <div>✓ No credit card required</div>
            <div>✓ Setup in 5 minutes</div>
            <div>✓ Cancel anytime</div>
          </div>
        </div>
      </section>
    </div>
  )
}