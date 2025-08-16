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
  UserCheck, BellRing, Workflow, FormInput, PieChart
} from 'lucide-react'

const stats = [
  { label: 'Active Users', value: '50,000+', growth: '+23%' },
  { label: 'Companies', value: '500+', growth: '+41%' },
  { label: 'Countries', value: '45', growth: '+12%' },
  { label: 'Uptime', value: '99.99%', growth: 'SLA' }
]

const features = [
  {
    category: 'Workforce Management',
    icon: Users,
    color: 'blue',
    items: [
      { name: 'Multi-tenant Organization', desc: 'Manage multiple organizations with complete data isolation' },
      { name: 'Team Hierarchy', desc: 'Create complex team structures with managers and reporting lines' },
      { name: 'Role-based Access', desc: 'Granular permissions for admins, managers, and employees' },
      { name: 'Employee Profiles', desc: 'Comprehensive profiles with skills, documents, and history' }
    ]
  },
  {
    category: 'Time & Attendance',
    icon: Clock,
    color: 'green',
    items: [
      { name: 'GPS Check-in/out', desc: 'Location-based attendance with geofencing support' },
      { name: 'Shift Management', desc: 'Create and manage complex shift patterns and schedules' },
      { name: 'Leave Management', desc: 'Handle vacation requests, sick leaves, and approvals' },
      { name: 'Overtime Tracking', desc: 'Automatic overtime calculation with custom rules' }
    ]
  },
  {
    category: 'Field Operations',
    icon: MapPin,
    color: 'purple',
    items: [
      { name: 'Route Optimization', desc: 'AI-powered route planning for field teams' },
      { name: 'Outlet Management', desc: 'Track visits, manage outlets, and monitor performance' },
      { name: 'Daily Call Reports', desc: 'Structured reporting for field sales and service teams' },
      { name: 'Live Location Tracking', desc: 'Real-time team member location for better coordination' }
    ]
  },
  {
    category: 'Forms & Workflows',
    icon: FileText,
    color: 'orange',
    items: [
      { name: 'Dynamic Form Builder', desc: 'Drag-and-drop form creation with conditional logic' },
      { name: 'Workflow Automation', desc: 'Automate approvals and multi-step processes' },
      { name: 'Digital Signatures', desc: 'Legally binding e-signatures for documents' },
      { name: 'Template Library', desc: 'Pre-built templates for common business forms' }
    ]
  },
  {
    category: 'Analytics & Insights',
    icon: Brain,
    color: 'red',
    items: [
      { name: 'Predictive Analytics', desc: 'AI-powered predictions for attendance and performance' },
      { name: 'Custom Dashboards', desc: 'Build personalized dashboards with drag-and-drop widgets' },
      { name: 'Real-time Reports', desc: 'Live data updates with export to Excel, PDF, and CSV' },
      { name: 'Power BI Integration', desc: 'Native integration with Microsoft Power BI' }
    ]
  },
  {
    category: 'Communication',
    icon: BellRing,
    color: 'teal',
    items: [
      { name: 'Push Notifications', desc: 'Instant alerts for important events and updates' },
      { name: 'Team Announcements', desc: 'Broadcast messages to teams or entire organization' },
      { name: 'Task Comments', desc: 'Collaborate on tasks with threaded discussions' },
      { name: 'Email Integration', desc: 'Automated email notifications and reminders' }
    ]
  }
]

const testimonials = [
  {
    quote: "WorkforceOne transformed how we manage our distributed sales team. The route optimization alone saved us 30% in travel costs.",
    author: "Sarah Chen",
    role: "VP of Operations",
    company: "TechCorp Global",
    rating: 5
  },
  {
    quote: "The forms and workflow automation features eliminated hours of paperwork. Our HR team is now 50% more productive.",
    author: "Michael Rodriguez",
    role: "HR Director",
    company: "Innovate Solutions",
    rating: 5
  },
  {
    quote: "Real-time attendance tracking and predictive analytics helped us reduce absenteeism by 40% in just 3 months.",
    author: "Emily Watson",
    role: "CEO",
    company: "NextGen Retail",
    rating: 5
  }
]

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [activeFeature, setActiveFeature] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % features.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50">
      {/* Navigation */}
      <nav className="border-b bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              {/* Logo - Replace /logo.png with your actual logo path */}
              <img 
                src="/logo.png" 
                alt="WorkforceOne Logo" 
                className="h-10 w-auto"
                onError={(e) => {
                  // Fallback to icon if logo doesn't exist
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.nextElementSibling?.classList.remove('hidden');
                }}
              />
              <div className="hidden w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-lg">
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
              <Link href="/guides" className="text-gray-600 hover:text-gray-900 font-medium">
                Guides
              </Link>
              <Link href="#features" className="text-gray-600 hover:text-gray-900 font-medium">
                Features
              </Link>
              <Link href="/pricing" className="text-gray-600 hover:text-gray-900 font-medium">
                Pricing
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
              <Link href="/guides" className="block px-3 py-2 text-gray-600 hover:text-gray-900 font-medium">
                Guides
              </Link>
              <Link href="#features" className="block px-3 py-2 text-gray-600 hover:text-gray-900 font-medium">
                Features
              </Link>
              <Link href="/pricing" className="block px-3 py-2 text-gray-600 hover:text-gray-900 font-medium">
                Pricing
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
                AI-Powered Workforce Management
              </Badge>
            </div>
            <h1 className="text-5xl lg:text-7xl font-bold mb-6 leading-tight">
              The Complete Platform for
              <span className="block bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Modern Workforce Management
              </span>
            </h1>
            <p className="text-xl lg:text-2xl text-gray-600 mt-4 mb-8 max-w-4xl mx-auto leading-relaxed">
              From attendance tracking to predictive analytics, manage your entire workforce 
              with one powerful platform. Built for teams of all sizes, from startups to enterprises.
            </p>
            
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto mb-10">
              {stats.map((stat, idx) => (
                <div key={idx} className="bg-white rounded-xl p-4 shadow-sm border">
                  <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                  <div className="text-sm text-gray-600">{stat.label}</div>
                  <Badge variant="secondary" className="mt-1 text-xs">
                    {stat.growth}
                  </Badge>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/signup">
                <Button size="lg" className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-lg px-8 shadow-xl">
                  Start 14-Day Free Trial
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/guides">
                <Button variant="outline" size="lg" className="text-lg px-8 border-2">
                  <BookOpen className="mr-2 h-5 w-5" />
                  View Guides
                </Button>
              </Link>
            </div>
            <p className="text-sm text-gray-500 mt-4">
              No credit card required • Setup in 5 minutes • Cancel anytime
            </p>
          </div>
        </div>
      </section>

      {/* Core Features Grid */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4">
              <Layers className="h-3 w-3 mr-1" />
              Complete Feature Set
            </Badge>
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              Everything You Need in One Platform
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Comprehensive tools designed for the modern distributed workforce
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8 mb-16">
            {features.map((category, idx) => (
              <Card 
                key={idx} 
                className={`border-2 hover:shadow-xl transition-all cursor-pointer ${
                  activeFeature === idx ? 'border-blue-500 shadow-xl' : ''
                }`}
                onClick={() => setActiveFeature(idx)}
              >
                <CardContent className="p-6">
                  <div className={`w-12 h-12 bg-gradient-to-br from-${category.color}-500 to-${category.color}-600 rounded-xl flex items-center justify-center mb-4`}>
                    <category.icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-4">{category.category}</h3>
                  <ul className="space-y-3">
                    {category.items.map((item, itemIdx) => (
                      <li key={itemIdx} className="flex items-start">
                        <CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                        <div>
                          <div className="font-medium text-gray-900">{item.name}</div>
                          <div className="text-sm text-gray-600">{item.desc}</div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Platform Highlights */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Smartphone className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-lg font-bold mb-2">Mobile First</h3>
              <p className="text-gray-600">Native iOS and Android apps with offline support</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-violet-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Cloud className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-lg font-bold mb-2">Cloud Native</h3>
              <p className="text-gray-600">Scalable infrastructure with 99.99% uptime SLA</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Lock className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-lg font-bold mb-2">Enterprise Security</h3>
              <p className="text-gray-600">SOC 2 compliant with end-to-end encryption</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4">
              <Workflow className="h-3 w-3 mr-1" />
              Simple Setup Process
            </Badge>
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              Get Started in Minutes
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our guided setup makes it easy to get your team up and running quickly
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              { step: '1', title: 'Sign Up', desc: 'Create your free account in seconds', icon: UserCheck },
              { step: '2', title: 'Setup Organization', desc: 'Configure your company settings', icon: Building2 },
              { step: '3', title: 'Invite Team', desc: 'Add team members and assign roles', icon: Users },
              { step: '4', title: 'Start Managing', desc: 'Begin tracking and managing your workforce', icon: Target }
            ].map((item, idx) => (
              <div key={idx} className="relative">
                <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-lg mb-4">
                    {item.step}
                  </div>
                  <item.icon className="h-8 w-8 text-blue-600 mb-3" />
                  <h3 className="font-bold text-lg mb-2">{item.title}</h3>
                  <p className="text-gray-600 text-sm">{item.desc}</p>
                </div>
                {idx < 3 && (
                  <ChevronRight className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2 h-8 w-8 text-gray-300" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4">
              <Award className="h-3 w-3 mr-1" />
              Customer Success Stories
            </Badge>
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              Trusted by Industry Leaders
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              See how companies are transforming their workforce management
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, idx) => (
              <Card key={idx} className="hover:shadow-xl transition-shadow">
                <CardContent className="p-6">
                  <div className="flex mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <p className="text-gray-700 mb-4 italic">"{testimonial.quote}"</p>
                  <div className="border-t pt-4">
                    <div className="font-bold text-gray-900">{testimonial.author}</div>
                    <div className="text-sm text-gray-600">{testimonial.role}</div>
                    <div className="text-sm text-blue-600">{testimonial.company}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Quick Start Guides */}
      <section className="py-20 bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-4">
              <BookOpen className="h-3 w-3 mr-1" />
              Learning Resources
            </Badge>
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              How-To Guides & Resources
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Everything you need to master WorkforceOne
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Link href="/guides/getting-started">
              <Card className="hover:shadow-xl transition-all cursor-pointer h-full">
                <CardContent className="p-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center mb-4">
                    <Play className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="font-bold text-lg mb-2">Getting Started</h3>
                  <p className="text-gray-600 text-sm mb-3">Complete setup guide for new users</p>
                  <div className="text-blue-600 font-medium text-sm flex items-center">
                    View Guide <ChevronRight className="h-4 w-4 ml-1" />
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/guides/team-management">
              <Card className="hover:shadow-xl transition-all cursor-pointer h-full">
                <CardContent className="p-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl flex items-center justify-center mb-4">
                    <Users className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="font-bold text-lg mb-2">Team Management</h3>
                  <p className="text-gray-600 text-sm mb-3">Organize teams and assign roles</p>
                  <div className="text-blue-600 font-medium text-sm flex items-center">
                    View Guide <ChevronRight className="h-4 w-4 ml-1" />
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/guides/attendance">
              <Card className="hover:shadow-xl transition-all cursor-pointer h-full">
                <CardContent className="p-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center mb-4">
                    <Clock className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="font-bold text-lg mb-2">Time & Attendance</h3>
                  <p className="text-gray-600 text-sm mb-3">Track time and manage attendance</p>
                  <div className="text-blue-600 font-medium text-sm flex items-center">
                    View Guide <ChevronRight className="h-4 w-4 ml-1" />
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link href="/guides/forms-workflows">
              <Card className="hover:shadow-xl transition-all cursor-pointer h-full">
                <CardContent className="p-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center mb-4">
                    <FileText className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="font-bold text-lg mb-2">Forms & Workflows</h3>
                  <p className="text-gray-600 text-sm mb-3">Create forms and automate workflows</p>
                  <div className="text-blue-600 font-medium text-sm flex items-center">
                    View Guide <ChevronRight className="h-4 w-4 ml-1" />
                  </div>
                </CardContent>
              </Card>
            </Link>
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
            Join 500+ companies already using WorkforceOne to streamline their operations
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Link href="/signup">
              <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-50 text-lg px-8 shadow-xl">
                Start Free 14-Day Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Button 
              variant="outline" 
              size="lg" 
              className="text-white border-2 border-white/80 hover:bg-white hover:text-blue-600 hover:border-white transition-all duration-300 text-lg px-8 backdrop-blur-sm bg-white/10"
            >
              <Headphones className="mr-2 h-5 w-5" />
              Talk to Sales
            </Button>
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
                The complete workforce management platform trusted by 500+ companies worldwide. 
                Streamline operations, boost productivity, and scale with confidence.
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
              <h3 className="font-semibold mb-4 text-gray-100">Product</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/features" className="hover:text-white transition">Features</Link></li>
                <li><Link href="/pricing" className="hover:text-white transition">Pricing</Link></li>
                <li><Link href="/guides" className="hover:text-white transition">Guides</Link></li>
                <li><Link href="/integrations" className="hover:text-white transition">Integrations</Link></li>
                <li><Link href="/mobile" className="hover:text-white transition">Mobile Apps</Link></li>
                <li><Link href="/changelog" className="hover:text-white transition">Changelog</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4 text-gray-100">Resources</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/help" className="hover:text-white transition">Help Center</Link></li>
                <li><Link href="/guides" className="hover:text-white transition">How-To Guides</Link></li>
                <li><Link href="/api-docs" className="hover:text-white transition">API Docs</Link></li>
                <li><Link href="/status" className="hover:text-white transition">System Status</Link></li>
                <li><Link href="/security" className="hover:text-white transition">Security</Link></li>
                <li><Link href="/community" className="hover:text-white transition">Community</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4 text-gray-100">Company</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/about" className="hover:text-white transition">About Us</Link></li>
                <li><Link href="/contact" className="hover:text-white transition">Contact</Link></li>
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