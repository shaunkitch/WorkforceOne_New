'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { useState } from 'react'
import {
  ArrowLeft, Search, BookOpen, Users, Clock, FileText,
  Play, Target, Settings, BarChart3, Shield, Zap,
  ChevronRight, Star, TrendingUp, Award, HelpCircle,
  Video, FileDown, Globe, Smartphone, CheckCircle
} from 'lucide-react'

const guideCategories = [
  {
    title: 'Getting Started',
    icon: Play,
    color: 'green',
    guides: [
      {
        title: 'Quick Start Guide',
        description: 'Get up and running with WorkforceOne in 5 minutes',
        readTime: '5 min',
        difficulty: 'Beginner',
        href: '/guides/getting-started'
      },
      {
        title: 'Initial Setup & Configuration',
        description: 'Configure your organization settings and preferences',
        readTime: '10 min',
        difficulty: 'Beginner',
        href: '/guides/getting-started#setup'
      },
      {
        title: 'Dashboard Overview',
        description: 'Understanding your dashboard and key metrics',
        readTime: '8 min',
        difficulty: 'Beginner',
        href: '/guides/getting-started#dashboard'
      }
    ]
  },
  {
    title: 'Team Management',
    icon: Users,
    color: 'purple',
    guides: [
      {
        title: 'Creating Teams & Departments',
        description: 'Organize your workforce into teams and departments',
        readTime: '7 min',
        difficulty: 'Intermediate',
        href: '/guides/team-management'
      },
      {
        title: 'Managing Roles & Permissions',
        description: 'Set up role-based access control for your organization',
        readTime: '12 min',
        difficulty: 'Advanced',
        href: '/guides/team-management#roles'
      },
      {
        title: 'Inviting Team Members',
        description: 'Add new members and manage invitations',
        readTime: '5 min',
        difficulty: 'Beginner',
        href: '/guides/team-management#invites'
      }
    ]
  },
  {
    title: 'Time & Attendance',
    icon: Clock,
    color: 'blue',
    guides: [
      {
        title: 'Setting Up Attendance Tracking',
        description: 'Configure attendance rules and policies',
        readTime: '10 min',
        difficulty: 'Intermediate',
        href: '/guides/attendance'
      },
      {
        title: 'Managing Leave Requests',
        description: 'Handle vacation, sick leave, and time-off requests',
        readTime: '8 min',
        difficulty: 'Intermediate',
        href: '/guides/attendance#leave'
      },
      {
        title: 'GPS & Location Tracking',
        description: 'Set up geofencing and location-based check-ins',
        readTime: '15 min',
        difficulty: 'Advanced',
        href: '/guides/attendance#location'
      }
    ]
  },
  {
    title: 'Forms & Workflows',
    icon: FileText,
    color: 'orange',
    guides: [
      {
        title: 'Creating Dynamic Forms',
        description: 'Build custom forms with our drag-and-drop builder',
        readTime: '12 min',
        difficulty: 'Intermediate',
        href: '/guides/forms-workflows'
      },
      {
        title: 'Workflow Automation',
        description: 'Automate approvals and multi-step processes',
        readTime: '15 min',
        difficulty: 'Advanced',
        href: '/guides/forms-workflows#automation'
      },
      {
        title: 'Form Templates',
        description: 'Use and customize pre-built form templates',
        readTime: '6 min',
        difficulty: 'Beginner',
        href: '/guides/forms-workflows#templates'
      }
    ]
  },
  {
    title: 'Analytics & Reports',
    icon: BarChart3,
    color: 'red',
    guides: [
      {
        title: 'Understanding Analytics',
        description: 'Make sense of your workforce data and metrics',
        readTime: '10 min',
        difficulty: 'Intermediate',
        href: '/guides/analytics'
      },
      {
        title: 'Creating Custom Reports',
        description: 'Build and export custom reports for your needs',
        readTime: '12 min',
        difficulty: 'Advanced',
        href: '/guides/analytics#reports'
      },
      {
        title: 'Predictive Analytics',
        description: 'Use AI to predict trends and patterns',
        readTime: '8 min',
        difficulty: 'Advanced',
        href: '/guides/analytics#predictive'
      }
    ]
  },
  {
    title: 'Mobile App',
    icon: Smartphone,
    color: 'teal',
    guides: [
      {
        title: 'Mobile App Setup',
        description: 'Install and configure the mobile app',
        readTime: '5 min',
        difficulty: 'Beginner',
        href: '/guides/mobile'
      },
      {
        title: 'Offline Mode',
        description: 'Work offline and sync when connected',
        readTime: '7 min',
        difficulty: 'Intermediate',
        href: '/guides/mobile#offline'
      },
      {
        title: 'Mobile Features',
        description: 'Complete guide to mobile-specific features',
        readTime: '10 min',
        difficulty: 'Intermediate',
        href: '/guides/mobile#features'
      }
    ]
  }
]

const videoTutorials = [
  { title: 'Getting Started with WorkforceOne', duration: '12:34', views: '5.2K' },
  { title: 'Team Management Best Practices', duration: '18:45', views: '3.1K' },
  { title: 'Advanced Form Builder Tutorial', duration: '22:10', views: '2.8K' },
  { title: 'Analytics Dashboard Deep Dive', duration: '15:22', views: '4.5K' }
]

export default function GuidesPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  const filteredCategories = guideCategories.filter(category => {
    if (selectedCategory && category.title !== selectedCategory) return false
    if (!searchQuery) return true
    
    const query = searchQuery.toLowerCase()
    return category.title.toLowerCase().includes(query) ||
           category.guides.some(guide => 
             guide.title.toLowerCase().includes(query) ||
             guide.description.toLowerCase().includes(query)
           )
  })

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link href="/">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Home
                </Button>
              </Link>
              <div className="h-8 w-px bg-gray-300" />
              <h1 className="text-xl font-bold">WorkforceOne Guides</h1>
            </div>
            <Link href="/dashboard">
              <Button>Go to Dashboard</Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <section className="py-12 bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <Badge variant="outline" className="mb-4">
              <BookOpen className="h-3 w-3 mr-1" />
              Knowledge Base
            </Badge>
            <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
              How-To Guides & Documentation
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
              Everything you need to know to get the most out of WorkforceOne
            </p>
            
            {/* Search Bar */}
            <div className="max-w-2xl mx-auto relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Search guides, tutorials, and documentation..."
                className="pl-12 pr-4 py-3 text-lg"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Quick Links */}
      <section className="py-8 bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap gap-2 justify-center">
            <Button
              variant={selectedCategory === null ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(null)}
            >
              All Guides
            </Button>
            {guideCategories.map((category) => (
              <Button
                key={category.title}
                variant={selectedCategory === category.title ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(
                  selectedCategory === category.title ? null : category.title
                )}
              >
                <category.icon className="h-4 w-4 mr-1" />
                {category.title}
              </Button>
            ))}
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Guides List */}
            <div className="lg:col-span-2 space-y-8">
              {filteredCategories.map((category) => (
                <div key={category.title}>
                  <div className="flex items-center mb-4">
                    <div className={`w-10 h-10 bg-gradient-to-br from-${category.color}-500 to-${category.color}-600 rounded-lg flex items-center justify-center mr-3`}>
                      <category.icon className="h-5 w-5 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">{category.title}</h2>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-4">
                    {category.guides.map((guide) => (
                      <Link key={guide.title} href={guide.href}>
                        <Card className="hover:shadow-lg transition-all cursor-pointer">
                          <CardContent className="p-6">
                            <div className="flex justify-between items-start mb-2">
                              <h3 className="text-lg font-semibold text-gray-900">
                                {guide.title}
                              </h3>
                              <ChevronRight className="h-5 w-5 text-gray-400" />
                            </div>
                            <p className="text-gray-600 mb-3">{guide.description}</p>
                            <div className="flex items-center space-x-4 text-sm">
                              <Badge variant="secondary">
                                {guide.difficulty}
                              </Badge>
                              <span className="text-gray-500">
                                {guide.readTime} read
                              </span>
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Video Tutorials */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Video className="h-5 w-5 mr-2" />
                    Video Tutorials
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {videoTutorials.map((video) => (
                      <div key={video.title} className="flex items-start space-x-3">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2" />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{video.title}</p>
                          <p className="text-xs text-gray-500">
                            {video.duration} • {video.views} views
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <Button variant="outline" className="w-full mt-4">
                    View All Videos
                  </Button>
                </CardContent>
              </Card>

              {/* Popular Topics */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <TrendingUp className="h-5 w-5 mr-2" />
                    Popular Topics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {[
                      'GPS Check-in Setup',
                      'Creating Custom Forms',
                      'Team Hierarchy',
                      'Leave Management',
                      'Report Generation',
                      'Mobile App Features'
                    ].map((topic) => (
                      <Link key={topic} href="#" className="block">
                        <div className="flex items-center justify-between py-2 hover:bg-gray-50 rounded px-2">
                          <span className="text-sm text-gray-700">{topic}</span>
                          <ChevronRight className="h-4 w-4 text-gray-400" />
                        </div>
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Need Help? */}
              <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
                <CardContent className="p-6">
                  <div className="text-center">
                    <HelpCircle className="h-12 w-12 text-blue-600 mx-auto mb-3" />
                    <h3 className="font-bold text-lg mb-2">Need Help?</h3>
                    <p className="text-sm text-gray-600 mb-4">
                      Can't find what you're looking for? Our support team is here to help.
                    </p>
                    <Link href="/contact">
                      <Button className="w-full">Contact Support</Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>

              {/* Download Resources */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <FileDown className="h-5 w-5 mr-2" />
                    Resources
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <a href="#" className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                      <span className="text-sm">Quick Start PDF</span>
                      <FileDown className="h-4 w-4 text-gray-400" />
                    </a>
                    <a href="#" className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                      <span className="text-sm">API Documentation</span>
                      <FileDown className="h-4 w-4 text-gray-400" />
                    </a>
                    <a href="#" className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                      <span className="text-sm">Best Practices Guide</span>
                      <FileDown className="h-4 w-4 text-gray-400" />
                    </a>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}