'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  ArrowLeft, Check, X, Star, Users, Building2, Crown,
  Zap, Shield, HeadphonesIcon, Clock, Calendar, FileText,
  BarChart3, MapPin, Smartphone, Globe, ChevronRight,
  Info, Sparkles, Target, TrendingUp, Layers, Settings,
  Calculator
} from 'lucide-react'
import { 
  getUserLocationAndCurrency, 
  formatPrice, 
  type CountryInfo, 
  type CurrencyInfo,
  CURRENCIES 
} from '@/lib/currency-utils'

interface PricingTier {
  id: string
  name: string
  description: string
  priceUSD: number
  priceYearlyUSD: number
  icon: React.ComponentType<any>
  color: string
  popular?: boolean
  features: {
    name: string
    included: boolean
    description?: string
  }[]
  limits: {
    users: string
    storage: string
    support: string
  }
}

const pricingTiers: PricingTier[] = [
  {
    id: 'starter',
    name: 'Starter',
    description: 'Perfect for small teams getting started',
    priceUSD: 5,
    priceYearlyUSD: 4, // 20% discount
    icon: Users,
    color: 'blue',
    features: [
      { name: 'Team Management', included: true, description: 'Up to 30 team members' },
      { name: 'Basic Attendance Tracking', included: true, description: 'Check-in/out, basic reports' },
      { name: 'Task Management', included: true, description: 'Create and assign tasks' },
      { name: 'Mobile App', included: true, description: 'iOS and Android apps' },
      { name: 'Email Support', included: true, description: 'Business hours support' },
      { name: 'Basic Forms', included: true, description: 'Up to 5 custom forms' },
      { name: 'Time Tracking', included: true, description: 'Basic time tracking' },
      { name: 'Basic Reports', included: true, description: 'Standard reporting' },
      { name: 'GPS Tracking', included: false },
      { name: 'Advanced Analytics', included: false },
      { name: 'Workflow Automation', included: false },
      { name: 'Route Optimization', included: false },
      { name: 'API Access', included: false },
      { name: 'Custom Integrations', included: false },
      { name: 'Priority Support', included: false },
      { name: 'Dedicated Account Manager', included: false }
    ],
    limits: {
      users: 'Up to 30 users',
      storage: '200GB storage',
      support: 'Email support'
    }
  },
  {
    id: 'professional',
    name: 'Professional',
    description: 'For growing businesses with advanced needs',
    priceUSD: 9,
    priceYearlyUSD: 7, // 22% discount (rounded)
    icon: Building2,
    color: 'purple',
    popular: true,
    features: [
      { name: 'Team Management', included: true, description: 'Up to 100 team members' },
      { name: 'Advanced Attendance Tracking', included: true, description: 'Full attendance suite' },
      { name: 'Task Management', included: true, description: 'Advanced task workflows' },
      { name: 'Mobile App', included: true, description: 'iOS and Android apps' },
      { name: 'Priority Support', included: true, description: '24/7 chat and email' },
      { name: 'Advanced Forms', included: true, description: 'Unlimited custom forms' },
      { name: 'Time Tracking', included: true, description: 'Advanced time tracking' },
      { name: 'Advanced Reports', included: true, description: 'Custom reporting' },
      { name: 'GPS Tracking', included: true, description: 'Location-based features' },
      { name: 'Advanced Analytics', included: true, description: 'Detailed insights' },
      { name: 'Workflow Automation', included: true, description: 'Automate processes' },
      { name: 'Route Optimization', included: true, description: 'AI-powered routes' },
      { name: 'API Access', included: true, description: 'RESTful API access' },
      { name: 'Custom Integrations', included: false },
      { name: 'Dedicated Account Manager', included: false },
      { name: 'On-premise Deployment', included: false }
    ],
    limits: {
      users: 'Up to 100 users',
      storage: '500GB storage',
      support: '24/7 priority support'
    }
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'For large organizations with custom requirements',
    priceUSD: 21,
    priceYearlyUSD: 17, // 19% discount (rounded)
    icon: Crown,
    color: 'gold',
    features: [
      { name: 'Team Management', included: true, description: 'Unlimited team members' },
      { name: 'Enterprise Attendance', included: true, description: 'Full enterprise suite' },
      { name: 'Advanced Task Management', included: true, description: 'Enterprise workflows' },
      { name: 'Mobile App', included: true, description: 'White-label options' },
      { name: 'Dedicated Account Manager', included: true, description: 'Personal support' },
      { name: 'Enterprise Forms', included: true, description: 'Advanced form builder' },
      { name: 'Enterprise Time Tracking', included: true, description: 'Complete time suite' },
      { name: 'Custom Reports', included: true, description: 'Tailored reporting' },
      { name: 'Advanced GPS Tracking', included: true, description: 'Enterprise location' },
      { name: 'Predictive Analytics', included: true, description: 'AI-powered insights' },
      { name: 'Advanced Automation', included: true, description: 'Complex workflows' },
      { name: 'Route Optimization', included: true, description: 'Enterprise routing' },
      { name: 'Full API Access', included: true, description: 'Complete API suite' },
      { name: 'Custom Integrations', included: true, description: 'Bespoke integrations' },
      { name: 'SSO & LDAP', included: true, description: 'Enterprise authentication' },
      { name: 'On-premise Deployment', included: true, description: 'Self-hosted options' }
    ],
    limits: {
      users: 'Unlimited users',
      storage: 'Unlimited storage',
      support: 'Dedicated support team'
    }
  }
]

export default function PricingPage() {
  const [isYearly, setIsYearly] = useState(false)
  const [locationInfo, setLocationInfo] = useState<CountryInfo | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedCurrency, setSelectedCurrency] = useState<CurrencyInfo>(CURRENCIES.USD)

  useEffect(() => {
    getUserLocationAndCurrency().then(info => {
      setLocationInfo(info)
      setSelectedCurrency(info.currency)
      setIsLoading(false)
    }).catch(() => {
      setLocationInfo(null)
      setSelectedCurrency(CURRENCIES.USD)
      setIsLoading(false)
    })
  }, [])

  const calculateSavings = (tier: PricingTier) => {
    const monthly = tier.priceUSD * 12
    const yearly = tier.priceYearlyUSD * 12
    const savings = ((monthly - yearly) / monthly) * 100
    return Math.round(savings)
  }

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
              <h1 className="text-xl font-bold">Pricing Plans</h1>
            </div>
            <div className="flex space-x-3">
              <Link href="/pricing/modular">
                <Button variant="outline">
                  <Calculator className="h-4 w-4 mr-2" />
                  Custom Pricing
                </Button>
              </Link>
              <Link href="/signup">
                <Button>Start Free Trial</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Hero Section */}
      <section className="py-16 bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Badge variant="outline" className="mb-4">
            <Sparkles className="h-3 w-3 mr-1" />
            Simple, Transparent Pricing
          </Badge>
          <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            Choose the Perfect Plan for Your Team
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-6">
            Start with a 14-day free trial. No credit card required. Scale as you grow.
          </p>
          
          <div className="bg-gradient-to-r from-purple-100 to-blue-100 border border-purple-200 rounded-lg p-4 max-w-2xl mx-auto mb-8">
            <div className="flex items-center justify-center space-x-3">
              <Calculator className="h-5 w-5 text-purple-600" />
              <span className="text-purple-800 font-medium">
                New: Build your perfect plan with modular pricing
              </span>
              <Link href="/pricing/modular">
                <Button size="sm" variant="outline" className="border-purple-300 text-purple-700 hover:bg-purple-50">
                  Try Custom Pricing
                  <ChevronRight className="h-3 w-3 ml-1" />
                </Button>
              </Link>
            </div>
          </div>

          {/* Location & Currency Info */}
          {!isLoading && locationInfo && (
            <div className="inline-flex items-center bg-white rounded-lg p-3 shadow-sm border mb-8">
              <Globe className="h-4 w-4 text-blue-500 mr-2" />
              <span className="text-sm text-gray-600">
                Pricing shown in {selectedCurrency.name} ({selectedCurrency.code}) for {locationInfo.country}
              </span>
            </div>
          )}

          {/* Billing Toggle */}
          <div className="flex items-center justify-center space-x-4 mb-8">
            <span className={`font-medium ${!isYearly ? 'text-gray-900' : 'text-gray-500'}`}>
              Monthly
            </span>
            <Switch
              checked={isYearly}
              onCheckedChange={setIsYearly}
              className="data-[state=checked]:bg-blue-600"
            />
            <span className={`font-medium ${isYearly ? 'text-gray-900' : 'text-gray-500'}`}>
              Yearly
            </span>
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              Save 20%
            </Badge>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {pricingTiers.map((tier) => (
              <Card 
                key={tier.id} 
                className={`relative ${
                  tier.popular 
                    ? 'border-2 border-purple-500 shadow-xl scale-105' 
                    : 'border border-gray-200 shadow-lg hover:shadow-xl transition-shadow'
                }`}
              >
                {tier.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-purple-500 text-white px-4 py-1">
                      <Star className="h-3 w-3 mr-1" />
                      Most Popular
                    </Badge>
                  </div>
                )}

                <CardHeader className="text-center pb-8">
                  <div className={`w-16 h-16 bg-gradient-to-br from-${tier.color}-500 to-${tier.color}-600 rounded-2xl flex items-center justify-center mx-auto mb-4`}>
                    <tier.icon className="h-8 w-8 text-white" />
                  </div>
                  
                  <CardTitle className="text-2xl font-bold mb-2">
                    {tier.name}
                  </CardTitle>
                  
                  <p className="text-gray-600 mb-6">
                    {tier.description}
                  </p>

                  <div className="space-y-2">
                    <div className="flex items-baseline justify-center">
                      <span className="text-4xl font-bold">
                        {formatPrice(isYearly ? tier.priceYearlyUSD : tier.priceUSD, selectedCurrency)}
                      </span>
                      <span className="text-gray-600 ml-2">
                        /user/{isYearly ? 'month' : 'month'}
                      </span>
                    </div>
                    
                    {isYearly && (
                      <div className="text-sm text-green-600 font-medium">
                        Save {calculateSavings(tier)}% with annual billing
                      </div>
                    )}

                    <div className="text-sm text-gray-500">
                      {formatPrice((isYearly ? tier.priceYearlyUSD : tier.priceUSD) * 12, selectedCurrency)} 
                      {isYearly ? ' billed annually' : ' per year'}
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-6">
                  {/* Limits */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-semibold mb-2 text-sm text-gray-700">Plan Includes:</h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• {tier.limits.users}</li>
                      <li>• {tier.limits.storage}</li>
                      <li>• {tier.limits.support}</li>
                    </ul>
                  </div>

                  {/* Features */}
                  <div className="space-y-3">
                    <h4 className="font-semibold text-sm text-gray-700">Features:</h4>
                    {tier.features.slice(0, 8).map((feature, idx) => (
                      <div key={idx} className="flex items-start space-x-3">
                        {feature.included ? (
                          <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                        ) : (
                          <X className="h-5 w-5 text-gray-300 flex-shrink-0 mt-0.5" />
                        )}
                        <div className={feature.included ? 'text-gray-700' : 'text-gray-400'}>
                          <div className="font-medium text-sm">{feature.name}</div>
                          {feature.description && (
                            <div className="text-xs text-gray-500 mt-1">
                              {feature.description}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                    
                    {tier.features.length > 8 && (
                      <details className="group">
                        <summary className="cursor-pointer text-sm text-blue-600 hover:text-blue-700 font-medium">
                          View all {tier.features.length} features
                        </summary>
                        <div className="mt-3 space-y-3">
                          {tier.features.slice(8).map((feature, idx) => (
                            <div key={idx + 8} className="flex items-start space-x-3">
                              {feature.included ? (
                                <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                              ) : (
                                <X className="h-5 w-5 text-gray-300 flex-shrink-0 mt-0.5" />
                              )}
                              <div className={feature.included ? 'text-gray-700' : 'text-gray-400'}>
                                <div className="font-medium text-sm">{feature.name}</div>
                                {feature.description && (
                                  <div className="text-xs text-gray-500 mt-1">
                                    {feature.description}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </details>
                    )}
                  </div>

                  {/* CTA Button */}
                  <div className="pt-6">
                    <Link href="/signup">
                      <Button 
                        className={`w-full ${
                          tier.popular 
                            ? 'bg-purple-600 hover:bg-purple-700' 
                            : ''
                        }`}
                        size="lg"
                      >
                        Start Free Trial
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </Link>
                    <p className="text-xs text-gray-500 text-center mt-2">
                      14-day free trial • No credit card required
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">Frequently Asked Questions</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[
              {
                q: "Can I change plans anytime?",
                a: "Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately."
              },
              {
                q: "What happens during the free trial?",
                a: "You get full access to your chosen plan for 14 days. No credit card required to start."
              },
              {
                q: "Is my data secure?",
                a: "Yes, we use enterprise-grade security with SOC 2 compliance and end-to-end encryption."
              },
              {
                q: "Do you offer refunds?",
                a: "Yes, we offer a 30-day money-back guarantee if you're not satisfied."
              },
              {
                q: "Can I pay in my local currency?",
                a: "Yes, we automatically detect your location and show prices in your local currency."
              },
              {
                q: "Is there setup assistance?",
                a: "Yes, we provide onboarding assistance for Professional and Enterprise plans."
              }
            ].map((faq, idx) => (
              <div key={idx} className="bg-white rounded-lg p-6 shadow-sm">
                <h3 className="font-semibold text-gray-900 mb-2">{faq.q}</h3>
                <p className="text-gray-600 text-sm">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-indigo-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-blue-100 text-lg mb-8">
            Join thousands of companies already using WorkforceOne
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup">
              <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-50">
                Start Free Trial
                <ChevronRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/contact">
              <Button variant="outline" size="lg" className="text-white border-2 border-white/80 hover:bg-white hover:text-blue-600 hover:border-white transition-all duration-300 backdrop-blur-sm bg-white/10">
                <HeadphonesIcon className="mr-2 h-5 w-5" />
                Contact Sales
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}