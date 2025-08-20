'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { 
  Calculator, Users, Clock, Shield, ArrowRight, CheckCircle,
  DollarSign, TrendingUp, Zap, Target
} from 'lucide-react'

interface ProductConfig {
  id: string
  name: string
  monthlyPrice: number
  annualPrice: number
  icon: React.ElementType
  color: string
  features: string[]
  roiMetrics: {
    timeSavings: number // hours per user per month
    costSavings: number // dollars per user per month
    efficiencyGain: number // percentage
  }
}

const products: ProductConfig[] = [
  {
    id: 'remote',
    name: 'Remote',
    monthlyPrice: 8,
    annualPrice: 76.80,
    icon: Users,
    color: 'blue',
    features: ['Team Management', 'Task Assignment', 'Route Optimization', 'Dynamic Forms'],
    roiMetrics: {
      timeSavings: 8,
      costSavings: 45,
      efficiencyGain: 25
    }
  },
  {
    id: 'time',
    name: 'Time',
    monthlyPrice: 6,
    annualPrice: 57.60,
    icon: Clock,
    color: 'green',
    features: ['GPS Time Clock', 'Attendance Tracking', 'Leave Management', 'Payroll Reports'],
    roiMetrics: {
      timeSavings: 6,
      costSavings: 75,
      efficiencyGain: 40
    }
  },
  {
    id: 'guard',
    name: 'Guard',
    monthlyPrice: 12,
    annualPrice: 115.20,
    icon: Shield,
    color: 'purple',
    features: ['Patrol Routes', 'Incident Reports', 'Checkpoint System', 'GPS Tracking'],
    roiMetrics: {
      timeSavings: 10,
      costSavings: 65,
      efficiencyGain: 30
    }
  }
]

export function PricingCalculator() {
  const [selectedProducts, setSelectedProducts] = useState<string[]>(['remote'])
  const [userCount, setUserCount] = useState<number>(10)
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly')
  const [avgHourlyWage, setAvgHourlyWage] = useState<number>(25)
  const [showROI, setShowROI] = useState<boolean>(false)

  const toggleProduct = (productId: string) => {
    setSelectedProducts(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    )
  }

  const selectedProductsData = products.filter(p => selectedProducts.includes(p.id))
  
  // Calculate pricing
  const bundlePrice = billingCycle === 'monthly' ? 20 : 192
  const isBundle = selectedProducts.length === 3
  
  const individualTotal = selectedProductsData.reduce((sum, product) => {
    return sum + (billingCycle === 'monthly' ? product.monthlyPrice : product.annualPrice)
  }, 0)

  const finalPrice = isBundle ? bundlePrice : individualTotal
  const totalCost = finalPrice * userCount
  const annualCost = billingCycle === 'monthly' ? totalCost * 12 : totalCost
  
  // Calculate savings
  const fullPriceMonthly = selectedProductsData.reduce((sum, p) => sum + p.monthlyPrice, 0)
  const fullPriceAnnual = selectedProductsData.reduce((sum, p) => sum + p.annualPrice, 0)
  const annualSavings = billingCycle === 'annual' ? (fullPriceMonthly * 12 - fullPriceAnnual) * userCount : 0
  const bundleSavings = isBundle ? (individualTotal - bundlePrice) * userCount : 0

  // Calculate ROI
  const totalTimeSavings = selectedProductsData.reduce((sum, p) => sum + p.roiMetrics.timeSavings, 0)
  const totalCostSavings = selectedProductsData.reduce((sum, p) => sum + p.roiMetrics.costSavings, 0)
  const avgEfficiencyGain = selectedProductsData.reduce((sum, p) => sum + p.roiMetrics.efficiencyGain, 0) / selectedProductsData.length
  
  const monthlyTimeSavingsValue = (totalTimeSavings * userCount * avgHourlyWage)
  const monthlyCostSavings = (totalCostSavings * userCount)
  const totalMonthlySavings = monthlyTimeSavingsValue + monthlyCostSavings
  const annualSavingsValue = totalMonthlySavings * 12
  
  const roiPercentage = annualCost > 0 ? ((annualSavingsValue - annualCost) / annualCost * 100) : 0
  const paybackMonths = annualCost > 0 ? Math.ceil(annualCost / totalMonthlySavings) : 0

  useEffect(() => {
    if (selectedProducts.length === 0) {
      setSelectedProducts(['remote'])
    }
  }, [selectedProducts])

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-xl mb-4">
          <Calculator className="h-8 w-8 text-blue-600" />
        </div>
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Pricing Calculator
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Calculate your costs and ROI for WorkforceOne products
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Configuration Panel */}
        <div className="lg:col-span-2 space-y-8">
          {/* Product Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Target className="h-5 w-5 mr-2" />
                Select Products
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4">
                {products.map((product) => {
                  const isSelected = selectedProducts.includes(product.id)
                  const IconComponent = product.icon
                  
                  return (
                    <Card 
                      key={product.id}
                      className={`cursor-pointer transition-all ${
                        isSelected 
                          ? product.color === 'blue' 
                            ? 'border-blue-500 bg-blue-50 shadow-md'
                            : product.color === 'green'
                            ? 'border-green-500 bg-green-50 shadow-md'
                            : 'border-purple-500 bg-purple-50 shadow-md'
                          : 'hover:shadow-md'
                      }`}
                      onClick={() => toggleProduct(product.id)}
                    >
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                            product.color === 'blue' ? 'bg-blue-100' :
                            product.color === 'green' ? 'bg-green-100' :
                            'bg-purple-100'
                          }`}>
                            <IconComponent className={`h-6 w-6 ${
                              product.color === 'blue' ? 'text-blue-600' :
                              product.color === 'green' ? 'text-green-600' :
                              'text-purple-600'
                            }`} />
                          </div>
                          {isSelected && (
                            <CheckCircle className={`h-6 w-6 ${
                              product.color === 'blue' ? 'text-blue-600' :
                              product.color === 'green' ? 'text-green-600' :
                              'text-purple-600'
                            }`} />
                          )}
                        </div>
                        
                        <h3 className="font-bold text-gray-900 mb-2">{product.name}</h3>
                        
                        <div className="mb-4">
                          <div className="text-2xl font-bold text-gray-900">
                            ${billingCycle === 'monthly' ? product.monthlyPrice : product.annualPrice}
                          </div>
                          <div className="text-sm text-gray-600">
                            per user/{billingCycle === 'monthly' ? 'month' : 'year'}
                          </div>
                        </div>
                        
                        <ul className="space-y-1 text-sm text-gray-600">
                          {product.features.slice(0, 2).map((feature, idx) => (
                            <li key={idx} className="flex items-center">
                              <CheckCircle className="h-3 w-3 text-green-500 mr-2 flex-shrink-0" />
                              {feature}
                            </li>
                          ))}
                          {product.features.length > 2 && (
                            <li className="text-gray-500">+{product.features.length - 2} more</li>
                          )}
                        </ul>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
              
              {selectedProducts.length === 3 && (
                <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border-2 border-blue-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-gray-900">Bundle Discount Applied!</h4>
                      <p className="text-gray-600">Save ${((individualTotal - bundlePrice) * userCount).toLocaleString()} with our complete bundle</p>
                    </div>
                    <Badge className="bg-green-600">23% OFF</Badge>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Configuration Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* User Count */}
              <div className="space-y-4">
                <Label className="text-base font-medium">
                  Number of Users: <span className="text-blue-600 font-bold">{userCount}</span>
                </Label>
                <Slider
                  value={[userCount]}
                  onValueChange={(value) => setUserCount(value[0])}
                  min={1}
                  max={500}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-gray-500">
                  <span>1 user</span>
                  <span>500+ users</span>
                </div>
              </div>

              {/* Billing Cycle */}
              <div className="flex items-center justify-between">
                <Label className="text-base font-medium">Billing Cycle</Label>
                <div className="flex items-center space-x-2">
                  <span className={billingCycle === 'monthly' ? 'font-medium' : 'text-gray-500'}>
                    Monthly
                  </span>
                  <Switch
                    checked={billingCycle === 'annual'}
                    onCheckedChange={(checked) => setBillingCycle(checked ? 'annual' : 'monthly')}
                  />
                  <span className={billingCycle === 'annual' ? 'font-medium' : 'text-gray-500'}>
                    Annual
                  </span>
                  {billingCycle === 'annual' && (
                    <Badge className="bg-green-600 ml-2">Save 20%</Badge>
                  )}
                </div>
              </div>

              {/* ROI Calculator Toggle */}
              <div className="flex items-center justify-between pt-4 border-t">
                <Label className="text-base font-medium">Show ROI Analysis</Label>
                <Switch
                  checked={showROI}
                  onCheckedChange={setShowROI}
                />
              </div>

              {/* ROI Settings */}
              {showROI && (
                <div className="space-y-4 pt-4 border-t">
                  <div>
                    <Label htmlFor="hourlyWage" className="text-sm font-medium">
                      Average Hourly Wage ($)
                    </Label>
                    <Input
                      id="hourlyWage"
                      type="number"
                      value={avgHourlyWage}
                      onChange={(e) => setAvgHourlyWage(parseFloat(e.target.value) || 0)}
                      min="0"
                      step="0.50"
                      className="mt-1"
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Results Panel */}
        <div className="space-y-6">
          {/* Pricing Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <DollarSign className="h-5 w-5 mr-2" />
                Pricing Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {selectedProductsData.map((product) => (
                  <div key={product.id} className="flex justify-between items-center">
                    <span className="text-gray-700">{product.name}</span>
                    <span className="font-medium">
                      ${billingCycle === 'monthly' ? product.monthlyPrice : product.annualPrice}
                    </span>
                  </div>
                ))}
                
                {bundleSavings > 0 && (
                  <div className="flex justify-between items-center text-green-600">
                    <span>Bundle Discount</span>
                    <span className="font-medium">-${bundleSavings.toFixed(2)}</span>
                  </div>
                )}
                
                <div className="border-t pt-4">
                  <div className="flex justify-between items-center text-lg font-bold">
                    <span>Per User Cost</span>
                    <span>${finalPrice.toFixed(2)}</span>
                  </div>
                  <div className="text-sm text-gray-500">
                    per {billingCycle === 'monthly' ? 'month' : 'year'}
                  </div>
                </div>
                
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600">
                      ${totalCost.toLocaleString()}
                    </div>
                    <div className="text-sm text-blue-700">
                      Total {billingCycle} cost for {userCount} users
                    </div>
                    
                    {annualSavings > 0 && (
                      <div className="mt-2 text-sm text-green-600 font-medium">
                        Save ${annualSavings.toLocaleString()} annually
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ROI Analysis */}
          {showROI && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2" />
                  ROI Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">
                        {Math.round(roiPercentage)}%
                      </div>
                      <div className="text-sm text-green-700">Annual ROI</div>
                    </div>
                    
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">
                        {paybackMonths}
                      </div>
                      <div className="text-sm text-blue-700">Months to Payback</div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-semibold text-gray-900">Annual Savings Breakdown</h4>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700">Time Savings ({totalTimeSavings}h/user/month)</span>
                      <span className="font-medium text-green-600">
                        ${(monthlyTimeSavingsValue * 12).toLocaleString()}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700">Operational Savings</span>
                      <span className="font-medium text-green-600">
                        ${(monthlyCostSavings * 12).toLocaleString()}
                      </span>
                    </div>
                    
                    <div className="border-t pt-3">
                      <div className="flex justify-between items-center font-bold">
                        <span>Total Annual Savings</span>
                        <span className="text-green-600">
                          ${annualSavingsValue.toLocaleString()}
                        </span>
                      </div>
                      <div className="text-sm text-gray-500 text-right">
                        vs ${annualCost.toLocaleString()} investment
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-yellow-50 rounded-lg">
                    <div className="flex items-start">
                      <Zap className="h-5 w-5 text-yellow-600 mt-0.5 mr-2 flex-shrink-0" />
                      <div>
                        <div className="font-medium text-yellow-800">
                          Efficiency Boost: +{Math.round(avgEfficiencyGain)}%
                        </div>
                        <div className="text-sm text-yellow-700 mt-1">
                          Average productivity increase across selected products
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* CTA */}
          <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
            <CardContent className="p-6 text-center">
              <h3 className="text-xl font-bold mb-2">Ready to Get Started?</h3>
              <p className="text-blue-100 mb-4">
                Start your 14-day free trial with {selectedProductsData.length} product{selectedProductsData.length !== 1 ? 's' : ''}
              </p>
              
              <Link href="/onboarding">
                <Button 
                  size="lg" 
                  className="bg-white text-blue-600 hover:bg-gray-50 w-full mb-3"
                >
                  Start Free Trial
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              
              <div className="text-sm text-blue-100">
                No credit card required • Cancel anytime
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default PricingCalculator