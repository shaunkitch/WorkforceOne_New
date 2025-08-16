'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  ArrowLeft, ArrowRight, CheckCircle, Play, Settings,
  Users, Building2, UserPlus, Shield, Clock, FileText,
  Mail, Key, Globe, Smartphone, HelpCircle, BookOpen,
  ChevronRight, Target, Zap, Info, AlertTriangle
} from 'lucide-react'

export default function GettingStartedGuide() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Link href="/guides">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  All Guides
                </Button>
              </Link>
              <div className="h-8 w-px bg-gray-300" />
              <Badge variant="secondary">
                <Play className="h-3 w-3 mr-1" />
                Getting Started
              </Badge>
            </div>
            <Link href="/dashboard">
              <Button>Go to Dashboard</Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Hero */}
      <section className="py-12 bg-gradient-to-br from-green-50 to-emerald-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Play className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Getting Started with WorkforceOne
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Welcome! This guide will help you set up your WorkforceOne account and get your team up and running in just a few minutes.
            </p>
            <div className="flex items-center justify-center gap-4 mt-6 text-sm text-gray-500">
              <span>⏱ 5 min read</span>
              <span>•</span>
              <span>📚 Beginner friendly</span>
              <span>•</span>
              <span>✅ Step-by-step</span>
            </div>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Prerequisites */}
          <Alert className="mb-8">
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>Before you begin:</strong> Make sure you have your company details ready, including organization name, team structure, and any existing employee data you want to import.
            </AlertDescription>
          </Alert>

          {/* Step 1: Create Your Account */}
          <div className="mb-12" id="create-account">
            <div className="flex items-center mb-6">
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold mr-4">
                1
              </div>
              <h2 className="text-2xl font-bold">Create Your Account</h2>
            </div>
            
            <Card className="mb-6">
              <CardContent className="p-6">
                <p className="mb-4">Start by creating your WorkforceOne account. You have two options:</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div className="border rounded-lg p-4">
                    <h3 className="font-semibold mb-2 flex items-center">
                      <Building2 className="h-5 w-5 mr-2 text-blue-500" />
                      Create New Organization
                    </h3>
                    <p className="text-sm text-gray-600 mb-3">
                      Start fresh with a new organization if you're the first from your company.
                    </p>
                    <ul className="text-sm space-y-1">
                      <li className="flex items-start">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5" />
                        <span>You'll be the admin</span>
                      </li>
                      <li className="flex items-start">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5" />
                        <span>Full control over settings</span>
                      </li>
                      <li className="flex items-start">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5" />
                        <span>Invite your team members</span>
                      </li>
                    </ul>
                  </div>
                  
                  <div className="border rounded-lg p-4">
                    <h3 className="font-semibold mb-2 flex items-center">
                      <Users className="h-5 w-5 mr-2 text-purple-500" />
                      Join Existing Organization
                    </h3>
                    <p className="text-sm text-gray-600 mb-3">
                      Join if your organization is already using WorkforceOne.
                    </p>
                    <ul className="text-sm space-y-1">
                      <li className="flex items-start">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5" />
                        <span>Request from your admin</span>
                      </li>
                      <li className="flex items-start">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5" />
                        <span>Use invitation link</span>
                      </li>
                      <li className="flex items-start">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5" />
                        <span>Automatic team assignment</span>
                      </li>
                    </ul>
                  </div>
                </div>

                <div className="bg-blue-50 rounded-lg p-4">
                  <h4 className="font-semibold mb-2">Quick Setup:</h4>
                  <ol className="text-sm space-y-2">
                    <li>1. Go to <Link href="/signup" className="text-blue-600 hover:underline">workforceone.com/signup</Link></li>
                    <li>2. Enter your email and create a strong password</li>
                    <li>3. Choose "Create Organization" or "Join Organization"</li>
                    <li>4. Fill in your details and click "Get Started"</li>
                  </ol>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Step 2: Set Up Your Organization */}
          <div className="mb-12" id="setup">
            <div className="flex items-center mb-6">
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold mr-4">
                2
              </div>
              <h2 className="text-2xl font-bold">Set Up Your Organization</h2>
            </div>
            
            <Card>
              <CardContent className="p-6">
                <p className="mb-6">Once logged in, configure your organization settings:</p>
                
                <div className="space-y-6">
                  <div className="flex items-start">
                    <Settings className="h-5 w-5 text-blue-500 mr-3 mt-0.5" />
                    <div>
                      <h3 className="font-semibold mb-2">Basic Information</h3>
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li>• Organization name and description</li>
                        <li>• Company logo and branding</li>
                        <li>• Contact information</li>
                        <li>• Time zone and regional settings</li>
                      </ul>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <Clock className="h-5 w-5 text-green-500 mr-3 mt-0.5" />
                    <div>
                      <h3 className="font-semibold mb-2">Work Settings</h3>
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li>• Working hours and days</li>
                        <li>• Holiday calendar</li>
                        <li>• Attendance policies</li>
                        <li>• Leave types and quotas</li>
                      </ul>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <Shield className="h-5 w-5 text-purple-500 mr-3 mt-0.5" />
                    <div>
                      <h3 className="font-semibold mb-2">Security & Permissions</h3>
                      <ul className="text-sm text-gray-600 space-y-1">
                        <li>• Role definitions (Admin, Manager, Employee)</li>
                        <li>• Feature access controls</li>
                        <li>• Two-factor authentication</li>
                        <li>• IP restrictions (optional)</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <Alert className="mt-6">
                  <Zap className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Pro tip:</strong> You can always change these settings later from Dashboard → Settings.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </div>

          {/* Step 3: Invite Your Team */}
          <div className="mb-12" id="invite-team">
            <div className="flex items-center mb-6">
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold mr-4">
                3
              </div>
              <h2 className="text-2xl font-bold">Invite Your Team</h2>
            </div>
            
            <Card>
              <CardContent className="p-6">
                <p className="mb-6">Add team members to your organization:</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div>
                    <h3 className="font-semibold mb-3 flex items-center">
                      <Mail className="h-5 w-5 mr-2 text-blue-500" />
                      Email Invitations
                    </h3>
                    <ol className="text-sm space-y-2">
                      <li>1. Go to Dashboard → Teams</li>
                      <li>2. Click "Invite Members"</li>
                      <li>3. Enter email addresses</li>
                      <li>4. Assign roles and teams</li>
                      <li>5. Send invitations</li>
                    </ol>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold mb-3 flex items-center">
                      <UserPlus className="h-5 w-5 mr-2 text-green-500" />
                      Bulk Import
                    </h3>
                    <ol className="text-sm space-y-2">
                      <li>1. Download CSV template</li>
                      <li>2. Fill in employee details</li>
                      <li>3. Upload the CSV file</li>
                      <li>4. Review and confirm</li>
                      <li>5. Auto-send invitations</li>
                    </ol>
                  </div>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-semibold mb-1">Important:</p>
                      <p>Team members will receive an email with instructions to set up their accounts. Make sure email addresses are correct before sending invitations.</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Step 4: Explore the Dashboard */}
          <div className="mb-12" id="dashboard">
            <div className="flex items-center mb-6">
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold mr-4">
                4
              </div>
              <h2 className="text-2xl font-bold">Explore Your Dashboard</h2>
            </div>
            
            <Card>
              <CardContent className="p-6">
                <p className="mb-6">Your dashboard is the command center for managing your workforce:</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { icon: Users, title: 'Team Overview', desc: 'View all team members and their status' },
                    { icon: Clock, title: 'Attendance', desc: 'Track check-ins, check-outs, and hours' },
                    { icon: FileText, title: 'Forms', desc: 'Create and manage digital forms' },
                    { icon: Target, title: 'Tasks', desc: 'Assign and track team tasks' },
                    { icon: Globe, title: 'Routes', desc: 'Plan and optimize field routes' },
                    { icon: Settings, title: 'Settings', desc: 'Configure your preferences' }
                  ].map((item) => (
                    <div key={item.title} className="flex items-start space-x-3">
                      <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <item.icon className="h-5 w-5 text-gray-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold">{item.title}</h4>
                        <p className="text-sm text-gray-600">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Next Steps */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold mb-6">What's Next?</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Link href="/guides/team-management">
                <Card className="hover:shadow-lg transition-all cursor-pointer h-full">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold mb-2">Team Management Guide</h3>
                        <p className="text-sm text-gray-600">Learn how to organize teams, assign roles, and manage permissions.</p>
                      </div>
                      <ChevronRight className="h-5 w-5 text-gray-400" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
              
              <Link href="/guides/attendance">
                <Card className="hover:shadow-lg transition-all cursor-pointer h-full">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold mb-2">Attendance Setup</h3>
                        <p className="text-sm text-gray-600">Configure attendance tracking, shifts, and leave management.</p>
                      </div>
                      <ChevronRight className="h-5 w-5 text-gray-400" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
              
              <Link href="/guides/forms-workflows">
                <Card className="hover:shadow-lg transition-all cursor-pointer h-full">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold mb-2">Forms & Workflows</h3>
                        <p className="text-sm text-gray-600">Create dynamic forms and automate your workflows.</p>
                      </div>
                      <ChevronRight className="h-5 w-5 text-gray-400" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
              
              <Link href="/guides/mobile">
                <Card className="hover:shadow-lg transition-all cursor-pointer h-full">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold mb-2">Mobile App Setup</h3>
                        <p className="text-sm text-gray-600">Get the mobile app for iOS and Android devices.</p>
                      </div>
                      <ChevronRight className="h-5 w-5 text-gray-400" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </div>
          </div>

          {/* Help Section */}
          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
            <CardContent className="p-8">
              <div className="text-center">
                <HelpCircle className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                <h3 className="text-xl font-bold mb-2">Need More Help?</h3>
                <p className="text-gray-600 mb-6">
                  Our support team is here to help you get started successfully.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link href="/contact">
                    <Button>
                      Contact Support
                    </Button>
                  </Link>
                  <Link href="/guides">
                    <Button variant="outline">
                      <BookOpen className="h-4 w-4 mr-2" />
                      Browse All Guides
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  )
}