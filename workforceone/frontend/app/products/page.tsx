'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, Clock, Shield, CheckCircle, ArrowRight, Award } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

const products = [
  {
    id: 'remote',
    name: 'WorkforceOne Remote',
    displayName: 'Remote',
    description: 'Team & task management for distributed workforces',
    monthlyPrice: 8,
    icon: Users,
    color: 'blue',
    features: ['Team Management', 'Task Assignment', 'Project Tracking', 'Route Planning', 'Dynamic Forms']
  },
  {
    id: 'time',
    name: 'WorkforceOne Time',
    displayName: 'Time',
    description: 'Time tracking & attendance management',
    monthlyPrice: 6,
    icon: Clock,
    color: 'green',
    features: ['GPS Time Clock', 'Attendance Tracking', 'Leave Management', 'Payroll Reports', 'Compliance']
  },
  {
    id: 'guard',
    name: 'WorkforceOne Guard',
    displayName: 'Guard',
    description: 'Security patrol & incident management',
    monthlyPrice: 12,
    icon: Shield,
    color: 'purple',
    features: ['Patrol Routes', 'Checkpoint System', 'Incident Reports', 'GPS Tracking', 'Evidence Capture']
  }
];

export default function ProductSelectionPage() {
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const toggleProduct = (productId: string) => {
    setSelectedProducts(prev => 
      prev.includes(productId)
        ? prev.filter(p => p !== productId)
        : [...prev, productId]
    );
  };

  const calculateTotal = () => {
    const selectedProductsData = products.filter(p => selectedProducts.includes(p.id));
    const isBundle = selectedProductsData.length === 3;
    const bundlePrice = 20;
    
    if (isBundle) return bundlePrice;
    
    return selectedProductsData.reduce((total, product) => total + product.monthlyPrice, 0);
  };

  const handleContinue = async () => {
    if (selectedProducts.length === 0) return;

    setLoading(true);
    try {
      // Get current user and organization
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      // Get user's profile to find organization
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single();

      if (profileError || !profile?.organization_id) {
        throw new Error('User organization not found');
      }

      // Get product IDs from codes
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('id, code')
        .in('code', selectedProducts);

      if (productsError || !productsData) {
        throw new Error('Products not found');
      }

      // Grant access to selected products
      const productAccessData = productsData.map(product => ({
        user_id: user.id,
        organization_id: profile.organization_id,
        product_id: product.id,
        is_active: true,
        granted_at: new Date().toISOString(),
        granted_by: user.id // Self-granted during onboarding
      }));

      const { error } = await supabase
        .from('user_product_access')
        .upsert(productAccessData, { 
          onConflict: 'user_id,product_id',
          ignoreDuplicates: false 
        });

      if (error) throw error;

      // Also create organization subscriptions for trial access
      const subscriptionData = productsData.map(product => ({
        organization_id: profile.organization_id,
        product_id: product.id,
        status: 'trial',
        trial_starts_at: new Date().toISOString(),
        trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days
        billing_period: 'monthly'
      }));

      const { error: subscriptionError } = await supabase
        .from('organization_subscriptions')
        .upsert(subscriptionData, {
          onConflict: 'organization_id,product_id',
          ignoreDuplicates: false
        });

      if (subscriptionError) {
        console.warn('Warning: Could not create organization subscriptions:', subscriptionError);
        // Don't block the flow if subscriptions fail
      }

      // Redirect to dashboard
      router.push('/dashboard');
    } catch (error) {
      console.error('Error granting product access:', error);
      alert('There was an error setting up your products. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <h1 className="text-3xl font-bold text-gray-900 text-center">Choose Your Products</h1>
          <p className="text-gray-600 mt-2 text-center">
            Select the WorkforceOne products that fit your needs. You can add more products later.
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Product Selection */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {products.map((product) => {
            const IconComponent = product.icon;
            const isSelected = selectedProducts.includes(product.id);
            
            return (
              <Card 
                key={product.id}
                className={`cursor-pointer transition-all relative ${
                  isSelected 
                    ? `ring-2 ring-${product.color}-500 bg-${product.color}-50 shadow-lg` 
                    : 'hover:shadow-md border-gray-200'
                }`}
                onClick={() => toggleProduct(product.id)}
              >
                <CardHeader className="text-center">
                  <div className={`w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-4 ${
                    product.color === 'blue' ? 'bg-blue-100' :
                    product.color === 'green' ? 'bg-green-100' : 'bg-purple-100'
                  }`}>
                    <IconComponent className={`h-8 w-8 ${
                      product.color === 'blue' ? 'text-blue-600' :
                      product.color === 'green' ? 'text-green-600' : 'text-purple-600'
                    }`} />
                  </div>
                  <CardTitle className="text-xl">{product.displayName}</CardTitle>
                  <p className="text-gray-600 text-sm">{product.description}</p>
                </CardHeader>
                
                <CardContent>
                  <div className="text-center mb-6">
                    <div className="text-3xl font-bold text-gray-900">${product.monthlyPrice}</div>
                    <div className="text-sm text-gray-600">per user/month</div>
                  </div>

                  <div className="space-y-3 mb-6">
                    <h4 className="font-semibold text-sm text-gray-900">Key Features:</h4>
                    <ul className="space-y-2">
                      {product.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start text-sm text-gray-600">
                          <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="text-center">
                    {isSelected && (
                      <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                        product.color === 'blue' ? 'bg-blue-100 text-blue-800' :
                        product.color === 'green' ? 'bg-green-100 text-green-800' : 'bg-purple-100 text-purple-800'
                      }`}>
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Selected
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Bundle Pricing */}
        {selectedProducts.length === 3 && (
          <div className="max-w-2xl mx-auto mb-8">
            <div className="p-6 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-2xl">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-lg text-green-900 flex items-center">
                    <Award className="w-5 h-5 mr-2 text-green-600" />
                    Complete Bundle Selected!
                  </h4>
                  <p className="text-green-700">Save 23% with all three products</p>
                </div>
                <Badge className="bg-green-600 text-lg px-4 py-2">23% OFF</Badge>
              </div>
            </div>
          </div>
        )}

        {/* Pricing Summary */}
        {selectedProducts.length > 0 && (
          <div className="max-w-md mx-auto mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between text-xl font-bold">
                  <span>Total per user/month:</span>
                  <span>${calculateTotal()}</span>
                </div>
                <div className="mt-2 text-center">
                  <Badge variant="secondary" className="text-green-700 bg-green-50">
                    14-day free trial • No credit card required
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Continue Button */}
        <div className="text-center">
          <Button
            onClick={handleContinue}
            disabled={selectedProducts.length === 0 || loading}
            size="lg"
            className="bg-blue-600 hover:bg-blue-700 text-lg px-8 py-3"
          >
            {loading ? (
              'Setting up your account...'
            ) : (
              <>
                Continue to Dashboard
                <ArrowRight className="ml-2 h-5 w-5" />
              </>
            )}
          </Button>
          {selectedProducts.length === 0 && (
            <p className="text-sm text-gray-500 mt-2">Please select at least one product to continue</p>
          )}
        </div>
      </div>
    </div>
  );
}