'use client'

import { useState } from 'react'
import { Mail, Phone, MapPin, Clock, Send, MessageSquare, Users, Zap } from 'lucide-react'

export default function ContactUsPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    subject: '',
    message: '',
    inquiryType: 'general'
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Handle form submission here
    console.log('Form submitted:', formData)
    alert('Thank you for your message! We\'ll get back to you within 24 hours.')
    setFormData({
      name: '',
      email: '',
      company: '',
      subject: '',
      message: '',
      inquiryType: 'general'
    })
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const contactInfo = [
    {
      icon: Mail,
      title: "Email Support",
      primary: "support@workforceone.com",
      secondary: "sales@workforceone.com",
      description: "Get help with technical issues or general inquiries"
    },
    {
      icon: Phone,
      title: "Phone Support",
      primary: "+1 (555) 123-4567",
      secondary: "+1 (555) 123-4568 (Sales)",
      description: "Speak directly with our support team"
    },
    {
      icon: MapPin,
      title: "Office Address",
      primary: "123 Business District",
      secondary: "Suite 456, Your City, State 12345",
      description: "Visit our headquarters"
    },
    {
      icon: Clock,
      title: "Business Hours",
      primary: "Monday - Friday: 9:00 AM - 6:00 PM",
      secondary: "Saturday: 10:00 AM - 4:00 PM",
      description: "Eastern Time Zone (EST/EDT)"
    }
  ]

  const features = [
    {
      icon: MessageSquare,
      title: "24/7 Chat Support",
      description: "Get instant help through our in-app chat system available to all premium users."
    },
    {
      icon: Users,
      title: "Dedicated Account Manager",
      description: "Enterprise customers get a dedicated account manager for personalized support."
    },
    {
      icon: Zap,
      title: "Priority Response",
      description: "Critical issues receive priority attention with guaranteed response times."
    }
  ]

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
          <h1 className="text-4xl font-bold text-white mb-4">Contact Us</h1>
          <p className="text-xl text-blue-100 mb-8">
            Get in touch with our team for support, sales inquiries, or general questions
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Contact Form */}
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Send us a message</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Your full name"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="your@email.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-2">
                    Company/Organization
                  </label>
                  <input
                    type="text"
                    id="company"
                    name="company"
                    value={formData.company}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Your company name"
                  />
                </div>
                <div>
                  <label htmlFor="inquiryType" className="block text-sm font-medium text-gray-700 mb-2">
                    Inquiry Type *
                  </label>
                  <select
                    id="inquiryType"
                    name="inquiryType"
                    required
                    value={formData.inquiryType}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="general">General Inquiry</option>
                    <option value="sales">Sales & Pricing</option>
                    <option value="support">Technical Support</option>
                    <option value="demo">Request Demo</option>
                    <option value="partnership">Partnership</option>
                    <option value="media">Media & Press</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                  Subject *
                </label>
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  required
                  value={formData.subject}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Brief description of your inquiry"
                />
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                  Message *
                </label>
                <textarea
                  id="message"
                  name="message"
                  required
                  rows={6}
                  value={formData.message}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical"
                  placeholder="Please provide details about your inquiry..."
                />
              </div>

              <button
                type="submit"
                className="w-full flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                <Send className="h-5 w-5 mr-2" />
                Send Message
              </button>
            </form>
          </div>

          {/* Contact Information */}
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Get in touch</h2>
              <div className="space-y-6">
                {contactInfo.map((info, index) => (
                  <div key={index} className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        <info.icon className="h-6 w-6 text-blue-600" />
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">{info.title}</h3>
                      <p className="text-blue-600 font-medium">{info.primary}</p>
                      <p className="text-gray-600">{info.secondary}</p>
                      <p className="text-sm text-gray-500 mt-1">{info.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Support Features */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Premium Support Features</h3>
              <div className="space-y-4">
                {features.map((feature, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <feature.icon className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{feature.title}</h4>
                      <p className="text-sm text-gray-600">{feature.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Response Times */}
            <div className="bg-blue-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-4">Response Times</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-blue-700">General Inquiries:</span>
                  <span className="font-medium text-blue-900">24-48 hours</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-700">Technical Support:</span>
                  <span className="font-medium text-blue-900">4-8 hours</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-700">Critical Issues:</span>
                  <span className="font-medium text-blue-900">1-2 hours</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-700">Sales Inquiries:</span>
                  <span className="font-medium text-blue-900">2-4 hours</span>
                </div>
              </div>
            </div>

            {/* Alternative Contact Methods */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Other Ways to Reach Us</h3>
              <div className="space-y-3">
                <div>
                  <h4 className="font-medium text-gray-900">Schedule a Demo</h4>
                  <p className="text-sm text-gray-600">Book a personalized demo with our sales team</p>
                  <a href="/demo" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                    Schedule Now →
                  </a>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Help Center</h4>
                  <p className="text-sm text-gray-600">Browse our comprehensive documentation and FAQs</p>
                  <a href="/help" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                    Visit Help Center →
                  </a>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Community Forum</h4>
                  <p className="text-sm text-gray-600">Connect with other WorkforceOne users</p>
                  <a href="/community" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                    Join Community →
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Quick answers to common questions. Can't find what you're looking for? Contact us directly.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="font-semibold text-gray-900 mb-2">How quickly can I get started?</h3>
                <p className="text-gray-600 text-sm">
                  You can start using WorkforceOne immediately after signup. Our onboarding process takes just a few minutes, and our team can help you import existing data.
                </p>
              </div>
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="font-semibold text-gray-900 mb-2">Do you offer training for new users?</h3>
                <p className="text-gray-600 text-sm">
                  Yes! We provide comprehensive training including video tutorials, documentation, live training sessions, and dedicated onboarding support for enterprise customers.
                </p>
              </div>
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="font-semibold text-gray-900 mb-2">Can I integrate with existing systems?</h3>
                <p className="text-gray-600 text-sm">
                  WorkforceOne offers extensive integration capabilities with popular HR, payroll, and business systems. Our API allows for custom integrations as well.
                </p>
              </div>
            </div>
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="font-semibold text-gray-900 mb-2">Is my data secure and compliant?</h3>
                <p className="text-gray-600 text-sm">
                  Absolutely. We maintain SOC 2 Type II certification, GDPR compliance, and use enterprise-grade security measures including encryption at rest and in transit.
                </p>
              </div>
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="font-semibold text-gray-900 mb-2">What support is included in my plan?</h3>
                <p className="text-gray-600 text-sm">
                  All plans include email support and access to our help center. Premium and Enterprise plans include priority support, phone support, and dedicated account management.
                </p>
              </div>
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="font-semibold text-gray-900 mb-2">Can I cancel my subscription anytime?</h3>
                <p className="text-gray-600 text-sm">
                  Yes, you can cancel your subscription at any time. There are no long-term contracts or cancellation fees. Your data remains accessible during the notice period.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}