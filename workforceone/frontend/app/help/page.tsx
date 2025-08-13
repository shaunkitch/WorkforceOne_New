'use client'

import { useState } from 'react'
import { ChevronDown, ChevronRight, Search, Book, MessageCircle, Mail, Phone, HelpCircle } from 'lucide-react'

export default function HelpCenterPage() {
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  const faqCategories = [
    {
      title: "Getting Started",
      faqs: [
        {
          question: "How do I set up my WorkforceOne account?",
          answer: "To set up your account: 1) Sign up with your email and organization details, 2) Verify your email address, 3) Complete your profile information, 4) Invite team members, and 5) Configure your organization settings. Your admin will provide you with access to specific features based on your role."
        },
        {
          question: "What are the different user roles available?",
          answer: "WorkforceOne offers three main user roles: Admin (full access to all features and settings), Manager (can manage teams, view reports, and approve requests), and Employee (can track time, submit requests, and collaborate on projects). Each role has specific permissions tailored to common organizational needs."
        },
        {
          question: "How do I invite team members to my organization?",
          answer: "Admins and managers can invite team members by going to Settings > Team Management > Invite Users. Enter the email addresses of people you want to invite, assign their roles, and send invitations. New users will receive an email with setup instructions."
        }
      ]
    },
    {
      title: "Attendance & Time Tracking",
      faqs: [
        {
          question: "How do I clock in and out using the mobile app?",
          answer: "Open the WorkforceOne mobile app, tap the 'Check In' button on your dashboard. The app will record your location (if enabled) and timestamp. To clock out, simply tap 'Check Out' when your workday ends. You can also add notes about your work session if needed."
        },
        {
          question: "Can I track time for different projects or tasks?",
          answer: "Yes! When logging time, you can select the specific project and task you're working on. This helps your organization track project costs and your personal productivity. You can switch between projects throughout the day and the system will track time accordingly."
        },
        {
          question: "What happens if I forget to clock in or out?",
          answer: "If you forget to clock in/out, you can manually adjust your time entries within your organization's allowed timeframe. Go to Attendance > My Time Entries, find the relevant date, and click 'Edit' to make corrections. Some organizations require manager approval for time adjustments."
        },
        {
          question: "How does location tracking work for attendance?",
          answer: "When enabled, the mobile app uses GPS to verify you're at the correct work location when clocking in. This prevents time theft and ensures accurate attendance records. Location data is only collected during clock in/out events and is kept secure according to our privacy policy."
        }
      ]
    },
    {
      title: "Leave Management",
      faqs: [
        {
          question: "How do I request time off?",
          answer: "Navigate to Leave > Request Leave, select your leave type (vacation, sick, personal), choose your dates, and add any necessary details or documentation. Your request will be sent to your manager for approval. You'll receive notifications about the status of your request."
        },
        {
          question: "How can I check my leave balance?",
          answer: "Your current leave balances are displayed on your dashboard and in the Leave section. You can see how many vacation days, sick days, and personal days you have remaining for the current year. The system automatically updates your balance when leave is approved and taken."
        },
        {
          question: "Can I cancel a leave request after it's been submitted?",
          answer: "Yes, you can cancel pending leave requests by going to Leave > My Requests and clicking 'Cancel' next to the relevant request. Once approved, you'll need to contact your manager to cancel the leave, as this may require a new process depending on your organization's policies."
        }
      ]
    },
    {
      title: "Teams & Collaboration",
      faqs: [
        {
          question: "How do I create and manage teams?",
          answer: "Admins and managers can create teams in Settings > Team Management. Click 'Create Team', add team details, and assign team members. You can set team leads, define team-specific settings, and manage member permissions. Teams can be organized by department, project, or any structure that works for your organization."
        },
        {
          question: "How do I assign tasks to team members?",
          answer: "Go to Tasks > Create Task, fill in the task details, and choose whether to assign to individual users or entire teams. You can set priorities, due dates, estimated hours, and add descriptions. Team members will receive notifications about new assignments and can update task progress."
        },
        {
          question: "Can I see my team's availability and schedules?",
          answer: "Yes, managers and team leads can view team calendars, attendance status, and current availability. The Dashboard provides real-time insights into who's working, on break, or out of office. This helps with resource planning and ensuring adequate coverage."
        }
      ]
    },
    {
      title: "Mobile App",
      faqs: [
        {
          question: "Is the mobile app available for both iOS and Android?",
          answer: "Yes, WorkforceOne mobile apps are available for both iOS (App Store) and Android (Google Play Store). The apps provide full functionality including attendance tracking, task management, team communication, and report access - all optimized for mobile use."
        },
        {
          question: "Can I use the app offline?",
          answer: "The app has limited offline functionality. You can view previously loaded data and clock in/out, but sync will occur when you reconnect to the internet. For full functionality including real-time updates, task assignments, and team collaboration, an internet connection is required."
        },
        {
          question: "How do I enable location services for attendance?",
          answer: "When first opening the app, you'll be prompted to allow location access. If you declined initially, go to your device Settings > Privacy > Location Services > WorkforceOne and enable location access. This ensures accurate attendance tracking and location verification."
        }
      ]
    },
    {
      title: "Reports & Analytics",
      faqs: [
        {
          question: "What types of reports can I generate?",
          answer: "WorkforceOne offers various reports including attendance summaries, time tracking reports, project progress, team performance analytics, and leave usage reports. Admins and managers can access comprehensive organizational reports, while employees can view their personal reports and timesheets."
        },
        {
          question: "Can I export reports to Excel or PDF?",
          answer: "Yes, most reports can be exported in multiple formats including Excel (CSV), PDF, and directly printed. Look for the export button in the top right of any report page. You can also schedule automated reports to be emailed to stakeholders on a regular basis."
        },
        {
          question: "How do I set up automated reports?",
          answer: "Admins can configure automated reports in Settings > Reports > Automated Reports. Choose the report type, recipients, frequency (daily, weekly, monthly), and any specific filters. Reports will be automatically generated and emailed according to your schedule."
        }
      ]
    }
  ]

  const quickLinks = [
    { title: "User Guide", description: "Comprehensive guide to using WorkforceOne", icon: Book, link: "/help/user-guide" },
    { title: "Video Tutorials", description: "Step-by-step video tutorials", icon: MessageCircle, link: "/help/tutorials" },
    { title: "API Documentation", description: "Developer resources and API docs", icon: HelpCircle, link: "/help/api-docs" },
    { title: "System Status", description: "Check current system status", icon: HelpCircle, link: "/help/status" }
  ]

  const contactOptions = [
    { title: "Email Support", description: "Get help via email", icon: Mail, contact: "support@workforceone.com", response: "24-48 hours" },
    { title: "Live Chat", description: "Chat with our support team", icon: MessageCircle, contact: "Available in app", response: "Instant" },
    { title: "Phone Support", description: "Speak with a support agent", icon: Phone, contact: "+1 (555) 123-4567", response: "Business hours" }
  ]

  const filteredFaqs = faqCategories.map(category => ({
    ...category,
    faqs: category.faqs.filter(faq => 
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(category => category.faqs.length > 0)

  const toggleFaq = (index: number) => {
    setExpandedFaq(expandedFaq === index ? null : index)
  }

  let faqIndex = 0

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <nav className="border-b bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-white">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
                  <path d="M16 3.128a4 4 0 0 1 0 7.744"></path>
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
                  <circle cx="9" cy="7" r="4"></circle>
                </svg>
              </div>
              <span className="text-2xl font-bold text-gray-900">WorkforceOne</span>
            </div>
            <div className="flex items-center space-x-4">
              <a className="text-gray-600 hover:text-gray-900 font-medium" href="/">Home</a>
              <a className="text-gray-600 hover:text-gray-900 font-medium" href="/login">Sign In</a>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-bold text-white mb-4">Help Center</h1>
          <p className="text-xl text-blue-100 mb-8">Find answers, tutorials, and support for WorkforceOne</p>
          
          {/* Search Bar */}
          <div className="max-w-2xl mx-auto">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search for help articles, guides, and FAQs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-4 text-lg border border-transparent rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Quick Links */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Quick Links</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {quickLinks.map((link, index) => (
                  <a
                    key={index}
                    href={link.link}
                    className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow border border-gray-200"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0">
                        <link.icon className="h-8 w-8 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">{link.title}</h3>
                        <p className="text-gray-600">{link.description}</p>
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            </section>

            {/* FAQ Section */}
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Frequently Asked Questions</h2>
              {searchQuery && filteredFaqs.length === 0 && (
                <div className="bg-white p-8 rounded-lg shadow-md text-center">
                  <p className="text-gray-500">No results found for "{searchQuery}". Try different keywords or browse categories below.</p>
                </div>
              )}
              
              {(searchQuery ? filteredFaqs : faqCategories).map((category, categoryIndex) => (
                <div key={categoryIndex} className="mb-8">
                  <h3 className="text-xl font-semibold text-gray-800 mb-4">{category.title}</h3>
                  <div className="space-y-2">
                    {category.faqs.map((faq, faqIdx) => {
                      const currentIndex = faqIndex++
                      return (
                        <div key={faqIdx} className="bg-white rounded-lg shadow-md">
                          <button
                            className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset"
                            onClick={() => toggleFaq(currentIndex)}
                          >
                            <span className="font-medium text-gray-900">{faq.question}</span>
                            {expandedFaq === currentIndex ? (
                              <ChevronDown className="h-5 w-5 text-gray-500" />
                            ) : (
                              <ChevronRight className="h-5 w-5 text-gray-500" />
                            )}
                          </button>
                          {expandedFaq === currentIndex && (
                            <div className="px-6 pb-4">
                              <p className="text-gray-700 leading-relaxed">{faq.answer}</p>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </section>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Contact Support */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Support</h3>
              <div className="space-y-4">
                {contactOptions.map((option, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <option.icon className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{option.title}</h4>
                      <p className="text-sm text-gray-600">{option.description}</p>
                      <p className="text-sm text-blue-600 font-medium">{option.contact}</p>
                      <p className="text-xs text-gray-500">Response: {option.response}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Popular Articles */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Popular Articles</h3>
              <div className="space-y-3">
                <a href="/help/getting-started" className="block text-blue-600 hover:text-blue-800">
                  Getting Started with WorkforceOne
                </a>
                <a href="/help/mobile-app-setup" className="block text-blue-600 hover:text-blue-800">
                  Setting Up the Mobile App
                </a>
                <a href="/help/time-tracking-guide" className="block text-blue-600 hover:text-blue-800">
                  Complete Time Tracking Guide
                </a>
                <a href="/help/manager-tools" className="block text-blue-600 hover:text-blue-800">
                  Manager Tools and Features
                </a>
                <a href="/help/troubleshooting" className="block text-blue-600 hover:text-blue-800">
                  Common Issues and Solutions
                </a>
              </div>
            </div>

            {/* Feature Requests */}
            <div className="bg-blue-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-2">Feature Requests</h3>
              <p className="text-blue-700 text-sm mb-4">
                Have an idea for a new feature? We'd love to hear from you!
              </p>
              <a
                href="/help/feature-request"
                className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                Submit Feature Request
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}