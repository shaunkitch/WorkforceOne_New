'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  Users, Clock, Shield, ArrowRight, ArrowLeft, CheckCircle, 
  Building2, MapPin, DollarSign, Target, Sparkles, Star,
  Play, Zap, Award, TrendingUp
} from 'lucide-react'

interface Product {
  id: string
  name: string
  displayName: string
  description: string
  monthlyPrice: number
  annualPrice: number
  icon: React.ElementType
  color: string
  features: string[]
  useCases: string[]
}

const products: Product[] = [
  {
    id: 'remote',
    name: 'WorkforceOne Remote',
    displayName: 'Remote',
    description: 'Team & task management for distributed workforces',
    monthlyPrice: 8,
    annualPrice: 76.80,
    icon: Users,
    color: 'blue',
    features: ['Team Management', 'Task Assignment', 'Project Tracking', 'Route Planning', 'Dynamic Forms'],
    useCases: ['Remote teams', 'Field services', 'Sales teams', 'Consulting firms', 'Service companies']
  },
  {
    id: 'time',
    name: 'WorkforceOne Time',
    displayName: 'Time',
    description: 'Time tracking & attendance management',
    monthlyPrice: 6,
    annualPrice: 57.60,
    icon: Clock,
    color: 'green',
    features: ['GPS Time Clock', 'Attendance Tracking', 'Leave Management', 'Payroll Reports', 'Compliance'],
    useCases: ['Hourly workers', 'Manufacturing', 'Retail', 'Healthcare', 'Construction']
  },
  {
    id: 'guard',
    name: 'WorkforceOne Guard',
    displayName: 'Guard',
    description: 'Security patrol & incident management',
    monthlyPrice: 12,
    annualPrice: 115.20,
    icon: Shield,
    color: 'purple',
    features: ['Patrol Routes', 'Checkpoint System', 'Incident Reports', 'GPS Tracking', 'Evidence Capture'],
    useCases: ['Security companies', 'Property management', 'Corporate security', 'Industrial sites', 'Event security']
  }
]

interface OnboardingData {
  step: number
  companyInfo: {
    name: string
    industry: string
    teamSize: string
    workType: string
  }
  needs: {
    primaryGoals: string[]
    challenges: string[]
    budget: string
  }
  selectedProducts: string[]
  billingCycle: 'monthly' | 'annual'
}

const industries = [
  'Technology', 'Healthcare', 'Manufacturing', 'Retail', 'Construction', 
  'Security Services', 'Property Management', 'Consulting', 'Field Services', 'Other'
]

const teamSizes = [
  '1-10 employees', '11-50 employees', '51-200 employees', 
  '201-500 employees', '500+ employees'
]

const workTypes = [
  'Fully remote', 'Fully on-site', 'Hybrid (remote + office)', 
  'Field-based work', 'Multiple locations'
]

const goals = [
  'Improve team productivity', 'Track time accurately', 'Manage security operations',
  'Reduce operational costs', 'Ensure compliance', 'Better project management',
  'Streamline workflows', 'Improve accountability'
]

const challenges = [
  'Managing remote teams', 'Time theft and inaccurate time tracking', 'Security and patrol management',
  'Complex project coordination', 'Compliance and reporting', 'Communication across teams',
  'Inefficient processes', 'Lack of visibility into operations'
]

const budgetRanges = [
  'Under $1,000/month', '$1,000-$5,000/month', '$5,000-$15,000/month', 
  '$15,000-$50,000/month', 'Above $50,000/month'
]

export default function OnboardingPage() {
  const router = useRouter()
  const [data, setData] = useState<OnboardingData>({
    step: 1,
    companyInfo: {
      name: '',
      industry: '',
      teamSize: '',
      workType: ''
    },
    needs: {
      primaryGoals: [],
      challenges: [],
      budget: ''
    },
    selectedProducts: [],
    billingCycle: 'monthly'
  })

  const totalSteps = 4
  const progress = (data.step / totalSteps) * 100

  // Smart product recommendations based on user input
  const getRecommendedProducts = () => {
    const recommendations: string[] = []
    const { industry, workType } = data.companyInfo
    const { primaryGoals, challenges } = data.needs

    // Remote product recommendations
    if (workType?.includes('remote') || 
        workType?.includes('Field') || 
        workType?.includes('Multiple') ||
        primaryGoals.includes('Improve team productivity') ||
        primaryGoals.includes('Better project management') ||
        challenges.includes('Managing remote teams') ||
        challenges.includes('Complex project coordination')) {
      recommendations.push('remote')
    }

    // Time product recommendations
    if (industry === 'Manufacturing' || industry === 'Retail' || industry === 'Healthcare' ||
        workType?.includes('on-site') ||
        primaryGoals.includes('Track time accurately') ||
        primaryGoals.includes('Ensure compliance') ||
        challenges.includes('Time theft and inaccurate time tracking') ||
        challenges.includes('Compliance and reporting')) {
      recommendations.push('time')
    }

    // Guard product recommendations  
    if (industry === 'Security Services' || industry === 'Property Management' ||
        primaryGoals.includes('Manage security operations') ||
        challenges.includes('Security and patrol management')) {
      recommendations.push('guard')
    }

    return recommendations
  }

  const handleNext = () => {
    if (data.step < totalSteps) {
      setData(prev => ({ ...prev, step: prev.step + 1 }))
    }
  }

  const handleBack = () => {
    if (data.step > 1) {
      setData(prev => ({ ...prev, step: prev.step - 1 }))
    }
  }

  const handleComplete = () => {
    // In a real app, this would save the onboarding data and redirect to signup
    const productParams = data.selectedProducts.join(',')
    const billingParam = data.billingCycle === 'annual' ? '&billing=annual' : ''
    router.push(`/signup?products=${productParams}${billingParam}&onboarding=complete`)
  }

  const updateCompanyInfo = (field: string, value: string) => {
    setData(prev => ({
      ...prev,
      companyInfo: { ...prev.companyInfo, [field]: value }
    }))
  }

  const updateNeeds = (field: string, value: any) => {
    setData(prev => ({
      ...prev,
      needs: { ...prev.needs, [field]: value }
    }))
  }

  const toggleGoal = (goal: string) => {
    setData(prev => ({
      ...prev,
      needs: {
        ...prev.needs,
        primaryGoals: prev.needs.primaryGoals.includes(goal)
          ? prev.needs.primaryGoals.filter(g => g !== goal)
          : [...prev.needs.primaryGoals, goal]
      }
    }))
  }

  const toggleChallenge = (challenge: string) => {
    setData(prev => ({
      ...prev,
      needs: {
        ...prev.needs,
        challenges: prev.needs.challenges.includes(challenge)
          ? prev.needs.challenges.filter(c => c !== challenge)
          : [...prev.needs.challenges, challenge]
      }
    }))
  }

  const toggleProduct = (productId: string) => {
    setData(prev => ({
      ...prev,
      selectedProducts: prev.selectedProducts.includes(productId)
        ? prev.selectedProducts.filter(p => p !== productId)
        : [...prev.selectedProducts, productId]
    }))
  }

  const getSelectedProductsData = () => {
    return products.filter(p => data.selectedProducts.includes(p.id))
  }

  const calculateTotal = () => {
    const selectedProductsData = getSelectedProductsData()
    const isBundle = selectedProductsData.length === 3
    const bundlePrice = data.billingCycle === 'monthly' ? 20 : 192
    
    if (isBundle) return bundlePrice
    
    return selectedProductsData.reduce((total, product) => {
      return total + (data.billingCycle === 'monthly' ? product.monthlyPrice : product.annualPrice)
    }, 0)
  }

  // Auto-select recommended products when reaching step 3
  useEffect(() => {
    if (data.step === 3 && data.selectedProducts.length === 0) {
      const recommended = getRecommendedProducts()
      if (recommended.length > 0) {
        setData(prev => ({ ...prev, selectedProducts: recommended }))
      }
    }
  }, [data.step])

  const renderStep = () => {
    switch (data.step) {
      case 1:
        return (
          <Card className="w-full max-w-2xl">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Building2 className="h-8 w-8 text-blue-600" />
              </div>
              <CardTitle className="text-2xl">Tell us about your company</CardTitle>
              <p className="text-gray-600">Help us understand your business to recommend the best solution</p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="companyName">Company Name</Label>
                <Input
                  id="companyName"
                  value={data.companyInfo.name}
                  onChange={(e) => updateCompanyInfo('name', e.target.value)}
                  placeholder="Enter your company name"
                  className="mt-1"
                />
              </div>

              <div>
                <Label>Industry</Label>
                <RadioGroup 
                  value={data.companyInfo.industry}
                  onValueChange={(value) => updateCompanyInfo('industry', value)}
                  className="mt-2 grid grid-cols-2 gap-2"
                >
                  {industries.map((industry) => (
                    <div key={industry} className="flex items-center space-x-2">
                      <RadioGroupItem value={industry} id={industry} />
                      <Label htmlFor={industry} className="text-sm">{industry}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              <div>
                <Label>Team Size</Label>
                <RadioGroup 
                  value={data.companyInfo.teamSize}
                  onValueChange={(value) => updateCompanyInfo('teamSize', value)}
                  className="mt-2 grid grid-cols-1 gap-2"
                >
                  {teamSizes.map((size) => (
                    <div key={size} className="flex items-center space-x-2">
                      <RadioGroupItem value={size} id={size} />
                      <Label htmlFor={size} className="text-sm">{size}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              <div>
                <Label>Work Type</Label>
                <RadioGroup 
                  value={data.companyInfo.workType}
                  onValueChange={(value) => updateCompanyInfo('workType', value)}
                  className="mt-2 grid grid-cols-1 gap-2"
                >
                  {workTypes.map((type) => (
                    <div key={type} className="flex items-center space-x-2">
                      <RadioGroupItem value={type} id={type} />
                      <Label htmlFor={type} className="text-sm">{type}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            </CardContent>
          </Card>
        )

      case 2:
        return (
          <Card className="w-full max-w-2xl">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Target className="h-8 w-8 text-green-600" />
              </div>
              <CardTitle className="text-2xl">What are your primary goals?</CardTitle>
              <p className="text-gray-600">Select all that apply to help us understand your needs</p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label className="text-base font-medium mb-4 block">Primary Goals (select all that apply)</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {goals.map((goal) => (
                    <div 
                      key={goal}
                      className={`p-4 rounded-lg border cursor-pointer transition-all ${
                        data.needs.primaryGoals.includes(goal)
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => toggleGoal(goal)}
                    >
                      <div className="flex items-start space-x-3">
                        <Checkbox 
                          checked={data.needs.primaryGoals.includes(goal)}
                          onChange={() => toggleGoal(goal)}
                        />
                        <span className="text-sm font-medium">{goal}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-base font-medium mb-4 block">Current Challenges (select all that apply)</Label>
                <div className="grid grid-cols-1 gap-3">
                  {challenges.map((challenge) => (
                    <div 
                      key={challenge}
                      className={`p-4 rounded-lg border cursor-pointer transition-all ${
                        data.needs.challenges.includes(challenge)
                          ? 'border-red-500 bg-red-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => toggleChallenge(challenge)}
                    >
                      <div className="flex items-start space-x-3">
                        <Checkbox 
                          checked={data.needs.challenges.includes(challenge)}
                          onChange={() => toggleChallenge(challenge)}
                        />
                        <span className="text-sm font-medium">{challenge}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label>Monthly Budget Range</Label>
                <RadioGroup 
                  value={data.needs.budget}
                  onValueChange={(value) => updateNeeds('budget', value)}
                  className="mt-2 grid grid-cols-1 gap-2"
                >
                  {budgetRanges.map((range) => (
                    <div key={range} className="flex items-center space-x-2">
                      <RadioGroupItem value={range} id={range} />
                      <Label htmlFor={range} className="text-sm">{range}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            </CardContent>
          </Card>
        )

      case 3:
        const recommendedProducts = getRecommendedProducts()
        return (
          <Card className="w-full max-w-4xl">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Sparkles className="h-8 w-8 text-purple-600" />
              </div>
              <CardTitle className="text-2xl">Choose your products</CardTitle>
              <p className="text-gray-600">Based on your needs, we recommend these products</p>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6 mb-8">
                {products.map((product) => {
                  const isSelected = data.selectedProducts.includes(product.id)
                  const isRecommended = recommendedProducts.includes(product.id)
                  const IconComponent = product.icon
                  
                  return (
                    <Card 
                      key={product.id}
                      className={`cursor-pointer transition-all relative ${
                        isSelected 
                          ? `border-${product.color}-500 bg-${product.color}-50 shadow-md` 
                          : 'hover:shadow-md'
                      }`}
                      onClick={() => toggleProduct(product.id)}
                    >
                      {isRecommended && (
                        <div className="absolute -top-3 -right-3 z-10">
                          <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white">
                            <Star className="w-3 h-3 mr-1" />
                            Recommended
                          </Badge>
                        </div>
                      )}
                      
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className={`w-12 h-12 bg-${product.color}-100 rounded-lg flex items-center justify-center`}>
                            <IconComponent className={`h-6 w-6 text-${product.color}-600`} />
                          </div>
                          {isSelected && (
                            <CheckCircle className={`h-6 w-6 text-${product.color}-600`} />
                          )}
                        </div>
                        
                        <h3 className="font-bold text-lg mb-2">{product.displayName}</h3>
                        <p className="text-gray-600 text-sm mb-4">{product.description}</p>
                        
                        <div className="mb-4">
                          <div className="text-2xl font-bold">
                            ${data.billingCycle === 'monthly' ? product.monthlyPrice : product.annualPrice}
                          </div>
                          <div className="text-sm text-gray-600">
                            per user/{data.billingCycle === 'monthly' ? 'month' : 'year'}
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <h4 className="font-semibold text-sm">Key Features:</h4>
                          <ul className="space-y-1">
                            {product.features.slice(0, 3).map((feature, idx) => (
                              <li key={idx} className="flex items-center text-sm text-gray-600">
                                <CheckCircle className="h-3 w-3 text-green-500 mr-2 flex-shrink-0" />
                                {feature}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>

              {data.selectedProducts.length === 3 && (
                <div className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border-2 border-blue-200 mb-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-lg text-gray-900 flex items-center">
                        <Award className="w-5 h-5 mr-2 text-yellow-500" />
                        Complete Bundle Selected!
                      </h4>
                      <p className="text-gray-600">Save 23% with all three products</p>
                    </div>
                    <Badge className="bg-green-600 text-lg px-4 py-2">23% OFF</Badge>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-center space-x-4 mb-6">
                <Label className="font-medium">Billing Cycle:</Label>
                <div className="flex items-center space-x-2">
                  <span className={data.billingCycle === 'monthly' ? 'font-medium' : 'text-gray-500'}>
                    Monthly
                  </span>
                  <button
                    type="button"
                    onClick={() => setData(prev => ({ 
                      ...prev, 
                      billingCycle: prev.billingCycle === 'monthly' ? 'annual' : 'monthly' 
                    }))}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                      data.billingCycle === 'annual' ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        data.billingCycle === 'annual' ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                  <span className={data.billingCycle === 'annual' ? 'font-medium' : 'text-gray-500'}>
                    Annual
                  </span>
                  {data.billingCycle === 'annual' && (
                    <Badge className="bg-green-600 ml-2">Save 20%</Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )

      case 4:
        const selectedProductsData = getSelectedProductsData()
        const total = calculateTotal()
        const isBundle = selectedProductsData.length === 3
        
        return (
          <Card className="w-full max-w-2xl">
            <CardHeader className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="h-8 w-8 text-green-600" />
              </div>
              <CardTitle className="text-2xl">Perfect! Let's get you started</CardTitle>
              <p className="text-gray-600">Review your selection and start your free trial</p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-gray-50 p-6 rounded-lg">
                <h3 className="font-bold text-lg mb-4">Your Selection</h3>
                <div className="space-y-3">
                  {selectedProductsData.map((product) => {
                    const IconComponent = product.icon
                    return (
                      <div key={product.id} className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className={`w-10 h-10 bg-${product.color}-100 rounded-lg flex items-center justify-center mr-3`}>
                            <IconComponent className={`h-5 w-5 text-${product.color}-600`} />
                          </div>
                          <div>
                            <div className="font-medium">{product.displayName}</div>
                            <div className="text-sm text-gray-600">{product.description}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">
                            ${data.billingCycle === 'monthly' ? product.monthlyPrice : product.annualPrice}
                          </div>
                          <div className="text-sm text-gray-600">
                            per user/{data.billingCycle === 'monthly' ? 'month' : 'year'}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                  
                  {isBundle && (
                    <div className="border-t pt-3 mt-3">
                      <div className="flex items-center justify-between text-green-600 font-medium">
                        <span>Bundle Discount (23% off)</span>
                        <span>-${(selectedProductsData.reduce((sum, p) => 
                          sum + (data.billingCycle === 'monthly' ? p.monthlyPrice : p.annualPrice), 0
                        ) - total).toFixed(2)}</span>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="border-t pt-4 mt-4">
                  <div className="flex items-center justify-between text-xl font-bold">
                    <span>Total per user</span>
                    <span>${total.toFixed(2)}/{data.billingCycle === 'monthly' ? 'month' : 'year'}</span>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold text-blue-900 mb-2">What happens next?</h4>
                <ul className="space-y-2 text-sm text-blue-800">
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 mr-2 text-blue-600" />
                    Start your 14-day free trial immediately
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 mr-2 text-blue-600" />
                    Access all features of your selected products
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 mr-2 text-blue-600" />
                    Get personalized onboarding support
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="h-4 w-4 mr-2 text-blue-600" />
                    No credit card required during trial
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="text-2xl font-bold text-blue-600">WorkforceOne</div>
              <div className="ml-4 text-sm text-gray-600">Product Selection Wizard</div>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/signup" className="text-sm text-gray-600 hover:text-gray-900">
                Skip to Signup →
              </Link>
              <div className="text-sm text-gray-600">
                Step {data.step} of {totalSteps}
              </div>
            </div>
          </div>
          <div className="mt-4">
            <Progress value={progress} className="h-2" />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex items-center justify-center min-h-[calc(100vh-140px)] p-4">
        {renderStep()}
      </div>

      {/* Navigation */}
      <div className="bg-white border-t">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              {data.step > 1 && (
                <Button
                  variant="outline"
                  onClick={handleBack}
                  className="flex items-center"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              )}
            </div>
            
            <div className="flex items-center space-x-4">
              {data.step < totalSteps && (
                <Button
                  onClick={handleNext}
                  disabled={
                    (data.step === 1 && (!data.companyInfo.name || !data.companyInfo.industry || !data.companyInfo.teamSize || !data.companyInfo.workType)) ||
                    (data.step === 2 && (data.needs.primaryGoals.length === 0 || !data.needs.budget)) ||
                    (data.step === 3 && data.selectedProducts.length === 0)
                  }
                  className="bg-blue-600 hover:bg-blue-700 flex items-center"
                >
                  Continue
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              )}
              
              {data.step === totalSteps && (
                <Button
                  onClick={handleComplete}
                  className="bg-green-600 hover:bg-green-700 flex items-center text-lg px-8"
                  size="lg"
                >
                  Start Free Trial
                  <Play className="h-5 w-5 ml-2" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}