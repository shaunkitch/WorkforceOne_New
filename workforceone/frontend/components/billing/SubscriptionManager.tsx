'use client';

import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { Check, CreditCard, Users, DollarSign, Package } from 'lucide-react';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface Product {
  code: 'remote' | 'time' | 'guard';
  name: string;
  displayName: string;
  monthlyPrice: number;
  annualPrice: number;
  features: string[];
  userCount: number;
}

interface PricingCalculation {
  subtotal: number;
  discountAmount: number;
  total: number;
  isBundle: boolean;
  billingInterval: 'monthly' | 'annual';
  itemizedPricing: any[];
  bundleDiscount?: string;
}

const PRODUCTS: Omit<Product, 'userCount'>[] = [
  {
    code: 'remote',
    name: 'WorkforceOne Remote',
    displayName: 'Remote',
    monthlyPrice: 8,
    annualPrice: 76.80,
    features: [
      'Team Management',
      'Task Assignment & Tracking',
      'Project Management',
      'Form Builder & Responses',
      'Route Planning',
      'Real-time Communication',
      'Workflow Automation'
    ]
  },
  {
    code: 'time',
    name: 'WorkforceOne Time',
    displayName: 'Time',
    monthlyPrice: 6,
    annualPrice: 57.60,
    features: [
      'Time Clock & Attendance',
      'Timesheet Management',
      'Leave Requests & Approvals',
      'Leave Balance Tracking',
      'Payroll Integration',
      'Attendance Reports',
      'Overtime Tracking'
    ]
  },
  {
    code: 'guard',
    name: 'WorkforceOne Guard',
    displayName: 'Guard',
    monthlyPrice: 12,
    annualPrice: 115.20,
    features: [
      'Patrol Route Management',
      'Checkpoint Scanning',
      'Incident Reporting',
      'Guard Scheduling',
      'Real-time GPS Tracking',
      'Security Analytics',
      'Emergency Alerts'
    ]
  }
];

interface CheckoutFormProps {
  pricing: PricingCalculation;
  onSuccess: () => void;
  onError: (error: string) => void;
}

const CheckoutForm: React.FC<CheckoutFormProps> = ({ pricing, onSuccess, onError }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setLoading(true);

    try {
      // Create subscription
      const response = await fetch('/api/billing/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          products: pricing.itemizedPricing.map(item => ({
            code: item.code,
            userCount: item.userCount
          })),
          billingInterval: pricing.billingInterval
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Subscription creation failed');
      }

      // Confirm payment
      const { error: confirmError } = await stripe.confirmCardPayment(result.clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement)!,
        }
      });

      if (confirmError) {
        throw new Error(confirmError.message);
      }

      onSuccess();
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Payment failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="font-semibold mb-2 flex items-center">
          <CreditCard className="mr-2 h-4 w-4" />
          Payment Information
        </h3>
        <div className="border border-gray-300 rounded p-3 bg-white">
          <CardElement
            options={{
              style: {
                base: {
                  fontSize: '16px',
                  color: '#424770',
                  '::placeholder': {
                    color: '#aab7c4',
                  },
                },
              },
            }}
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={!stripe || loading}
        className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
      >
        {loading ? (
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
        ) : (
          <DollarSign className="mr-2 h-4 w-4" />
        )}
        {loading ? 'Processing...' : `Subscribe for $${pricing.total.toFixed(2)}/${pricing.billingInterval === 'monthly' ? 'month' : 'year'}`}
      </button>
    </form>
  );
};

const SubscriptionManager: React.FC = () => {
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);
  const [billingInterval, setBillingInterval] = useState<'monthly' | 'annual'>('monthly');
  const [userCounts, setUserCounts] = useState<Record<string, number>>({
    remote: 5,
    time: 5,
    guard: 5
  });
  const [pricing, setPricing] = useState<PricingCalculation | null>(null);
  const [showCheckout, setShowCheckout] = useState(false);
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(false);

  // Load existing subscriptions
  useEffect(() => {
    loadSubscriptions();
  }, []);

  const loadSubscriptions = async () => {
    try {
      const response = await fetch('/api/billing/subscriptions');
      const data = await response.json();
      setSubscriptions(data.subscriptions || []);
    } catch (error) {
      console.error('Failed to load subscriptions:', error);
    }
  };

  const toggleProduct = (productCode: string) => {
    const product = PRODUCTS.find(p => p.code === productCode);
    if (!product) return;

    const isSelected = selectedProducts.some(p => p.code === productCode);
    
    if (isSelected) {
      setSelectedProducts(prev => prev.filter(p => p.code !== productCode));
    } else {
      setSelectedProducts(prev => [...prev, {
        ...product,
        userCount: userCounts[productCode] || 5
      }]);
    }
  };

  const updateUserCount = (productCode: string, count: number) => {
    setUserCounts(prev => ({ ...prev, [productCode]: Math.max(1, count) }));
    setSelectedProducts(prev => 
      prev.map(p => p.code === productCode ? { ...p, userCount: count } : p)
    );
  };

  const calculatePricing = async () => {
    if (selectedProducts.length === 0) {
      setPricing(null);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/billing/calculate-pricing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          products: selectedProducts.map(p => ({
            code: p.code,
            userCount: p.userCount
          })),
          billingInterval
        })
      });

      const data = await response.json();
      setPricing(data);
    } catch (error) {
      console.error('Pricing calculation failed:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    calculatePricing();
  }, [selectedProducts, billingInterval]);

  const handleSubscriptionSuccess = () => {
    setShowCheckout(false);
    setSelectedProducts([]);
    setPricing(null);
    loadSubscriptions();
  };

  const handleSubscriptionError = (error: string) => {
    alert(`Subscription failed: ${error}`);
  };

  if (subscriptions.length > 0) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <h2 className="text-2xl font-bold mb-6">Current Subscriptions</h2>
        
        <div className="grid gap-4">
          {subscriptions.map((sub: any) => (
            <div key={sub.id} className="border rounded-lg p-4 bg-white shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">{sub.products.display_name}</h3>
                  <p className="text-gray-600">
                    {sub.user_count} users • ${sub.unit_price}/user/month
                  </p>
                  <p className="text-sm text-gray-500">
                    Status: <span className="capitalize">{sub.status}</span>
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">
                    ${(sub.unit_price * sub.user_count).toFixed(2)}/month
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 p-4 bg-blue-50 rounded-lg">
          <p className="text-blue-800">
            <strong>Note:</strong> You have active subscriptions. To modify your plan, 
            please contact support or cancel your current subscriptions first.
          </p>
        </div>
      </div>
    );
  }

  if (showCheckout && pricing) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <h2 className="text-2xl font-bold mb-6">Complete Your Subscription</h2>
        
        {/* Order Summary */}
        <div className="bg-gray-50 p-4 rounded-lg mb-6">
          <h3 className="font-semibold mb-3">Order Summary</h3>
          {pricing.itemizedPricing.map((item, index) => (
            <div key={index} className="flex justify-between py-2">
              <span>{item.name} ({item.userCount} users)</span>
              <span>${item.lineTotal.toFixed(2)}</span>
            </div>
          ))}
          
          <div className="border-t pt-2 mt-2">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>${pricing.subtotal.toFixed(2)}</span>
            </div>
            {pricing.discountAmount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>{pricing.bundleDiscount}</span>
                <span>-${pricing.discountAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-lg">
              <span>Total</span>
              <span>${pricing.total.toFixed(2)}/{pricing.billingInterval === 'monthly' ? 'mo' : 'yr'}</span>
            </div>
          </div>
        </div>

        <Elements stripe={stripePromise}>
          <CheckoutForm
            pricing={pricing}
            onSuccess={handleSubscriptionSuccess}
            onError={handleSubscriptionError}
          />
        </Elements>

        <button
          onClick={() => setShowCheckout(false)}
          className="mt-4 text-gray-600 hover:text-gray-800"
        >
          ← Back to product selection
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h2 className="text-3xl font-bold mb-4">Choose Your WorkforceOne Products</h2>
        <p className="text-gray-600">
          Select the products that fit your business needs. Mix and match or get all three for maximum savings.
        </p>
      </div>

      {/* Billing Interval Toggle */}
      <div className="flex justify-center mb-8">
        <div className="bg-gray-100 p-1 rounded-lg flex">
          <button
            onClick={() => setBillingInterval('monthly')}
            className={`px-4 py-2 rounded-md font-medium transition-colors ${
              billingInterval === 'monthly'
                ? 'bg-white shadow-sm text-blue-600'
                : 'text-gray-700 hover:text-blue-600'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingInterval('annual')}
            className={`px-4 py-2 rounded-md font-medium transition-colors ${
              billingInterval === 'annual'
                ? 'bg-white shadow-sm text-blue-600'
                : 'text-gray-700 hover:text-blue-600'
            }`}
          >
            Annual <span className="text-sm text-green-600">(Save 20%)</span>
          </button>
        </div>
      </div>

      {/* Product Selection */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        {PRODUCTS.map((product) => {
          const isSelected = selectedProducts.some(p => p.code === product.code);
          const price = billingInterval === 'annual' ? product.annualPrice : product.monthlyPrice;
          
          return (
            <div
              key={product.code}
              className={`border-2 rounded-xl p-6 cursor-pointer transition-all ${
                isSelected
                  ? 'border-blue-500 bg-blue-50 shadow-lg'
                  : 'border-gray-200 hover:border-blue-300 hover:shadow-md'
              }`}
              onClick={() => toggleProduct(product.code)}
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold">{product.displayName}</h3>
                  <p className="text-2xl font-bold text-blue-600">
                    ${price.toFixed(2)}
                    <span className="text-sm text-gray-600 font-normal">
                      /user/{billingInterval === 'monthly' ? 'month' : 'year'}
                    </span>
                  </p>
                </div>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                  isSelected ? 'bg-blue-500' : 'border-2 border-gray-300'
                }`}>
                  {isSelected && <Check className="h-4 w-4 text-white" />}
                </div>
              </div>

              {isSelected && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Number of users
                  </label>
                  <div className="flex items-center">
                    <Users className="h-4 w-4 text-gray-400 mr-2" />
                    <input
                      type="number"
                      min="1"
                      value={userCounts[product.code] || 5}
                      onChange={(e) => updateUserCount(product.code, parseInt(e.target.value))}
                      onClick={(e) => e.stopPropagation()}
                      className="border border-gray-300 rounded px-3 py-1 w-20 text-center"
                    />
                  </div>
                </div>
              )}

              <ul className="space-y-2">
                {product.features.slice(0, 4).map((feature, index) => (
                  <li key={index} className="flex items-start text-sm">
                    <Check className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
                {product.features.length > 4 && (
                  <li className="text-sm text-gray-600">
                    + {product.features.length - 4} more features
                  </li>
                )}
              </ul>
            </div>
          );
        })}
      </div>

      {/* Bundle Promotion */}
      {selectedProducts.length === 3 && (
        <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <Package className="h-5 w-5 text-green-600 mr-2" />
            <span className="font-semibold text-green-800">
              🎉 Complete Bundle Selected! Save 23% on your total
            </span>
          </div>
        </div>
      )}

      {/* Pricing Summary */}
      {pricing && selectedProducts.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold mb-4">Pricing Summary</h3>
          
          {pricing.itemizedPricing.map((item, index) => (
            <div key={index} className="flex justify-between py-2">
              <span>{item.name} ({item.userCount} users)</span>
              <span>${item.lineTotal.toFixed(2)}</span>
            </div>
          ))}
          
          <div className="border-t pt-3 mt-3">
            {pricing.isBundle && (
              <div className="flex justify-between text-green-600 font-medium">
                <span>Bundle Discount (23% off)</span>
                <span>-${pricing.discountAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-xl font-bold">
              <span>Total</span>
              <span>
                ${pricing.total.toFixed(2)}
                <span className="text-sm font-normal text-gray-600">
                  /{billingInterval === 'monthly' ? 'month' : 'year'}
                </span>
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Continue Button */}
      {selectedProducts.length > 0 && (
        <div className="text-center">
          <button
            onClick={() => setShowCheckout(true)}
            disabled={loading}
            className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Calculating...' : 'Continue to Payment'}
          </button>
        </div>
      )}
    </div>
  );
};

export default SubscriptionManager;