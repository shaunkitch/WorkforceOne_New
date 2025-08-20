'use client';

import { useProductAccess } from '@/hooks/useProductAccess';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Lock, Users, Clock, Shield, ArrowLeft, CreditCard } from 'lucide-react';

interface RequireProductProps {
  product: 'remote' | 'time' | 'guard';
  children: React.ReactNode;
  fallback?: React.ReactNode;
  showUpgrade?: boolean;
}

const PRODUCT_CONFIG = {
  remote: {
    icon: Users,
    name: 'WorkforceOne Remote',
    description: 'Team management, tasks, projects, and forms',
    color: 'bg-blue-500',
    features: ['Team Management', 'Task Tracking', 'Project Planning', 'Custom Forms']
  },
  time: {
    icon: Clock,
    name: 'WorkforceOne Time',
    description: 'Time tracking, attendance, and leave management',
    color: 'bg-green-500',
    features: ['Time Clock', 'Attendance Tracking', 'Leave Management', 'Payroll Reports']
  },
  guard: {
    icon: Shield,
    name: 'WorkforceOne Guard',
    description: 'Security patrol, incident reporting, and monitoring',
    color: 'bg-orange-500',
    features: ['Patrol Routes', 'Incident Reports', 'Live Monitoring', 'QR Checkpoints']
  }
};

export function RequireProduct({ 
  product, 
  children, 
  fallback,
  showUpgrade = true
}: RequireProductProps) {
  const access = useProductAccess();
  const router = useRouter();
  
  const config = PRODUCT_CONFIG[product];
  const Icon = config.icon;
  
  if (access.loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }
  
  if (access[product]) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }
  
  if (!showUpgrade) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] p-8 text-center">
        <Lock className="h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-xl font-semibold text-gray-600 mb-2">
          Access Required
        </h3>
        <p className="text-gray-500">
          This feature requires {config.name} access.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[500px] p-8">
      <Card className="max-w-2xl w-full">
        <CardHeader className="text-center">
          <div className={`w-16 h-16 rounded-full ${config.color} flex items-center justify-center mx-auto mb-4`}>
            <Icon className="h-8 w-8 text-white" />
          </div>
          <CardTitle className="text-2xl">
            Upgrade to {config.name}
          </CardTitle>
          <CardDescription className="text-lg">
            {config.description}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Feature List */}
          <div>
            <h4 className="font-semibold mb-3 text-center">What you'll get:</h4>
            <div className="grid grid-cols-2 gap-2">
              {config.features.map(feature => (
                <div key={feature} className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${config.color}`} />
                  <span className="text-sm">{feature}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Pricing */}
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold">
              ${access.products.find(p => p.code === product)?.price_monthly || '8'}/user
            </div>
            <div className="text-sm text-gray-600">per month</div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 justify-center">
            <Button 
              onClick={() => router.push('/dashboard/billing')}
              className="flex items-center gap-2"
            >
              <CreditCard className="h-4 w-4" />
              Upgrade Now
            </Button>
            <Button 
              variant="outline" 
              onClick={() => router.back()}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Go Back
            </Button>
          </div>

          {/* Contact Sales */}
          <div className="text-center text-sm text-gray-600">
            Need multiple products? <br />
            <button 
              onClick={() => router.push('/contact')}
              className="text-blue-600 hover:underline font-medium"
            >
              Contact sales for bundle pricing
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Simplified version for inline use
export function RequireProductInline({ 
  product, 
  children 
}: { 
  product: 'remote' | 'time' | 'guard';
  children: React.ReactNode;
}) {
  const access = useProductAccess();
  
  if (access.loading) return null;
  if (!access[product]) return null;
  
  return <>{children}</>;
}

// Component for showing product access status
export function ProductAccessBadge({ 
  product 
}: { 
  product: 'remote' | 'time' | 'guard' 
}) {
  const access = useProductAccess();
  const config = PRODUCT_CONFIG[product];
  const Icon = config.icon;
  
  if (access.loading) {
    return <Badge variant="outline">Loading...</Badge>;
  }
  
  if (access[product]) {
    return (
      <Badge className={`${config.color} text-white`}>
        <Icon className="h-3 w-3 mr-1" />
        {config.name}
      </Badge>
    );
  }
  
  return (
    <Badge variant="outline" className="text-gray-500">
      <Lock className="h-3 w-3 mr-1" />
      {config.name}
    </Badge>
  );
}