# Technical Implementation Guide - Product Modularization

## Quick Start Code Examples

### 1. Database Schema Implementation

```sql
-- Run this migration first to set up product structure
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    code TEXT UNIQUE NOT NULL,
    display_name TEXT NOT NULL,
    description TEXT,
    price_monthly DECIMAL(10,2) NOT NULL,
    price_annual DECIMAL(10,2) NOT NULL,
    color_theme TEXT, -- hex color for UI theming
    icon_name TEXT, -- lucide icon name
    features JSONB NOT NULL DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert the three products
INSERT INTO products (code, name, display_name, description, price_monthly, price_annual, color_theme, icon_name, features) VALUES
('remote', 'WorkforceOne Remote', 'Remote', 'Complete remote workforce management', 8.00, 76.80, '#3B82F6', 'Users', 
 '{"teams": true, "tasks": true, "projects": true, "forms": true, "announcements": true}'),
('time', 'WorkforceOne Time', 'Time', 'Time tracking and attendance management', 6.00, 57.60, '#10B981', 'Clock',
 '{"clock": true, "attendance": true, "leave": true, "timesheets": true, "reports": true}'),
('guard', 'WorkforceOne Guard', 'Guard', 'Security patrol and incident management', 12.00, 115.20, '#F97316', 'Shield',
 '{"patrol": true, "routes": true, "incidents": true, "monitoring": true, "emergency": true}');

-- Organization subscriptions
CREATE TABLE organization_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id),
    status TEXT CHECK (status IN ('trial', 'active', 'past_due', 'cancelled', 'suspended')),
    trial_ends_at TIMESTAMPTZ,
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,
    cancel_at_period_end BOOLEAN DEFAULT false,
    cancelled_at TIMESTAMPTZ,
    stripe_subscription_id TEXT,
    stripe_price_id TEXT,
    user_count INTEGER DEFAULT 1,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(organization_id, product_id)
);

-- User access to products
CREATE TABLE user_product_access (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id),
    granted_at TIMESTAMPTZ DEFAULT NOW(),
    granted_by UUID REFERENCES profiles(id),
    revoked_at TIMESTAMPTZ,
    revoked_by UUID REFERENCES profiles(id),
    is_active BOOLEAN DEFAULT true,
    UNIQUE(user_id, product_id)
);

-- Create indexes
CREATE INDEX idx_org_subscriptions_org ON organization_subscriptions(organization_id);
CREATE INDEX idx_org_subscriptions_status ON organization_subscriptions(status);
CREATE INDEX idx_user_product_access_user ON user_product_access(user_id);
CREATE INDEX idx_user_product_access_active ON user_product_access(is_active);
```

### 2. Product Access Hook Implementation

```typescript
// hooks/useProductAccess.ts
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

export interface ProductAccess {
  remote: boolean;
  time: boolean;
  guard: boolean;
  loading: boolean;
  products: Product[];
}

export interface Product {
  id: string;
  code: string;
  name: string;
  display_name: string;
  features: Record<string, boolean>;
  has_access: boolean;
  subscription_status?: string;
}

export function useProductAccess() {
  const [access, setAccess] = useState<ProductAccess>({
    remote: false,
    time: false,
    guard: false,
    loading: true,
    products: []
  });

  const supabase = createClient();

  useEffect(() => {
    checkProductAccess();
  }, []);

  const checkProductAccess = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get user's product access
      const { data: userAccess } = await supabase
        .from('user_product_access')
        .select(`
          product_id,
          products (
            id,
            code,
            name,
            display_name,
            features
          )
        `)
        .eq('user_id', user.id)
        .eq('is_active', true);

      // Get organization subscriptions
      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', user.id)
        .single();

      if (profile?.organization_id) {
        const { data: subscriptions } = await supabase
          .from('organization_subscriptions')
          .select(`
            status,
            products (
              code
            )
          `)
          .eq('organization_id', profile.organization_id)
          .in('status', ['trial', 'active']);

        // Map access
        const accessMap = {
          remote: false,
          time: false,
          guard: false
        };

        userAccess?.forEach(item => {
          if (item.products?.code) {
            accessMap[item.products.code as keyof typeof accessMap] = true;
          }
        });

        setAccess({
          ...accessMap,
          loading: false,
          products: userAccess?.map(item => ({
            ...item.products,
            has_access: true,
            subscription_status: subscriptions?.find(
              s => s.products?.code === item.products?.code
            )?.status
          })) || []
        });
      }
    } catch (error) {
      console.error('Error checking product access:', error);
      setAccess(prev => ({ ...prev, loading: false }));
    }
  };

  return access;
}
```

### 3. Product-Based Navigation

```typescript
// components/navigation/ProductNav.tsx
import { useProductAccess } from '@/hooks/useProductAccess';
import { 
  Users, Clock, Shield, 
  LayoutDashboard, Settings, 
  CreditCard, HelpCircle 
} from 'lucide-react';

const PRODUCT_NAVIGATION = {
  remote: [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Teams', href: '/dashboard/teams', icon: Users },
    { label: 'Tasks', href: '/dashboard/tasks', icon: CheckSquare },
    { label: 'Projects', href: '/dashboard/projects', icon: FolderOpen },
    { label: 'Forms', href: '/dashboard/forms', icon: FileText },
  ],
  time: [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Time Clock', href: '/dashboard/clock', icon: Clock },
    { label: 'Attendance', href: '/dashboard/attendance', icon: Calendar },
    { label: 'Leave', href: '/dashboard/leave', icon: Calendar },
    { label: 'Reports', href: '/dashboard/reports', icon: BarChart },
  ],
  guard: [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Patrol', href: '/dashboard/patrol', icon: Shield },
    { label: 'Routes', href: '/dashboard/routes', icon: Route },
    { label: 'Incidents', href: '/dashboard/incidents', icon: AlertTriangle },
    { label: 'Monitor', href: '/dashboard/security', icon: Monitor },
  ]
};

export function ProductNav() {
  const { remote, time, guard, products } = useProductAccess();
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  
  // Determine active products
  const activeProducts = products.filter(p => p.has_access);
  
  // Auto-select if only one product
  useEffect(() => {
    if (activeProducts.length === 1) {
      setSelectedProduct(activeProducts[0].code);
    }
  }, [activeProducts]);

  // Get navigation items based on selected product
  const navItems = selectedProduct ? PRODUCT_NAVIGATION[selectedProduct] : [];

  return (
    <div className="flex flex-col h-full">
      {/* Product Switcher */}
      {activeProducts.length > 1 && (
        <div className="p-4 border-b">
          <Select value={selectedProduct} onValueChange={setSelectedProduct}>
            <SelectTrigger>
              <SelectValue placeholder="Select Product" />
            </SelectTrigger>
            <SelectContent>
              {activeProducts.map(product => (
                <SelectItem key={product.id} value={product.code}>
                  <div className="flex items-center gap-2">
                    {product.code === 'remote' && <Users className="h-4 w-4" />}
                    {product.code === 'time' && <Clock className="h-4 w-4" />}
                    {product.code === 'guard' && <Shield className="h-4 w-4" />}
                    {product.display_name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Navigation Items */}
      <nav className="flex-1 p-4">
        {navItems.map(item => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100"
          >
            <item.icon className="h-5 w-5" />
            {item.label}
          </Link>
        ))}
      </nav>

      {/* Shared Navigation */}
      <div className="p-4 border-t">
        <Link href="/dashboard/settings" className="flex items-center gap-3 px-3 py-2">
          <Settings className="h-5 w-5" />
          Settings
        </Link>
        <Link href="/dashboard/billing" className="flex items-center gap-3 px-3 py-2">
          <CreditCard className="h-5 w-5" />
          Billing
        </Link>
        <Link href="/help" className="flex items-center gap-3 px-3 py-2">
          <HelpCircle className="h-5 w-5" />
          Help
        </Link>
      </div>
    </div>
  );
}
```

### 4. Product Access Guard Component

```typescript
// components/guards/RequireProduct.tsx
import { useProductAccess } from '@/hooks/useProductAccess';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Lock } from 'lucide-react';

interface RequireProductProps {
  product: 'remote' | 'time' | 'guard';
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function RequireProduct({ 
  product, 
  children, 
  fallback 
}: RequireProductProps) {
  const access = useProductAccess();
  const router = useRouter();
  
  if (access.loading) {
    return <div>Loading...</div>;
  }
  
  if (!access[product]) {
    if (fallback) {
      return <>{fallback}</>;
    }
    
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-8">
        <Lock className="h-12 w-12 text-gray-400 mb-4" />
        <h2 className="text-2xl font-bold mb-2">
          Upgrade to Access This Feature
        </h2>
        <p className="text-gray-600 mb-6 text-center max-w-md">
          This feature is part of WorkforceOne {product.charAt(0).toUpperCase() + product.slice(1)}.
          Upgrade your subscription to unlock it.
        </p>
        <div className="flex gap-3">
          <Button onClick={() => router.push('/dashboard/billing')}>
            View Plans
          </Button>
          <Button variant="outline" onClick={() => router.back()}>
            Go Back
          </Button>
        </div>
      </div>
    );
  }
  
  return <>{children}</>;
}
```

### 5. Dashboard Product Switcher

```typescript
// app/dashboard/page.tsx
import { useProductAccess } from '@/hooks/useProductAccess';

export default function Dashboard() {
  const { remote, time, guard, products } = useProductAccess();
  
  // Show combined dashboard if multiple products
  if (products.length > 1) {
    return <CombinedDashboard products={products} />;
  }
  
  // Show product-specific dashboard
  if (remote) return <RemoteDashboard />;
  if (time) return <TimeDashboard />;
  if (guard) return <GuardDashboard />;
  
  // No products
  return <NoProductsView />;
}

function CombinedDashboard({ products }: { products: Product[] }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {products.map(product => (
        <Card key={product.id}>
          <CardHeader>
            <CardTitle>{product.display_name}</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Product-specific widgets */}
            {product.code === 'remote' && <RemoteWidget />}
            {product.code === 'time' && <TimeWidget />}
            {product.code === 'guard' && <GuardWidget />}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
```

### 6. Billing Integration

```typescript
// app/dashboard/billing/page.tsx
export default function BillingPage() {
  const { products } = useProductAccess();
  const [subscriptions, setSubscriptions] = useState([]);
  
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Billing & Subscriptions</h1>
      
      {/* Active Subscriptions */}
      <Card>
        <CardHeader>
          <CardTitle>Active Products</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {products.map(product => (
              <div key={product.id} className="flex justify-between items-center p-4 border rounded">
                <div>
                  <h3 className="font-semibold">{product.display_name}</h3>
                  <p className="text-sm text-gray-600">
                    ${product.price_monthly}/user/month
                  </p>
                </div>
                <Badge>{product.subscription_status}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      
      {/* Available Products */}
      <Card>
        <CardHeader>
          <CardTitle>Add Products</CardTitle>
        </CardHeader>
        <CardContent>
          <ProductGrid 
            excludeProducts={products.map(p => p.code)} 
            onSubscribe={handleSubscribe}
          />
        </CardContent>
      </Card>
    </div>
  );
}
```

### 7. Mobile App Product Detection

```typescript
// mobile-app/contexts/ProductContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ProductContext = createContext<ProductContextType>({});

export function ProductProvider({ children }: { children: React.ReactNode }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [activeProduct, setActiveProduct] = useState<string | null>(null);
  
  useEffect(() => {
    loadProductAccess();
    loadSavedProduct();
  }, []);
  
  const loadProductAccess = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    
    const { data } = await supabase
      .from('user_product_access')
      .select('products(*)')
      .eq('user_id', user.id)
      .eq('is_active', true);
      
    setProducts(data?.map(d => d.products) || []);
  };
  
  const loadSavedProduct = async () => {
    const saved = await AsyncStorage.getItem('selected_product');
    if (saved) setActiveProduct(saved);
  };
  
  const switchProduct = async (productCode: string) => {
    setActiveProduct(productCode);
    await AsyncStorage.setItem('selected_product', productCode);
  };
  
  return (
    <ProductContext.Provider value={{ 
      products, 
      activeProduct, 
      switchProduct,
      hasProduct: (code: string) => products.some(p => p.code === code)
    }}>
      {children}
    </ProductContext.Provider>
  );
}
```

### 8. Feature Flag Implementation

```typescript
// lib/features.ts
export const FEATURE_FLAGS = {
  remote: {
    teams: true,
    tasks: true,
    projects: true,
    forms: true,
    announcements: true,
    analytics: true,
  },
  time: {
    clock: true,
    attendance: true,
    leave: true,
    timesheets: true,
    overtime: true,
    reports: true,
  },
  guard: {
    patrol: true,
    routes: true,
    incidents: true,
    checkpoints: true,
    monitoring: true,
    emergency: true,
  }
};

export function hasFeature(
  product: string, 
  feature: string, 
  userAccess: ProductAccess
): boolean {
  if (!userAccess[product]) return false;
  return FEATURE_FLAGS[product]?.[feature] || false;
}
```

### 9. Migration Script for Existing Users

```typescript
// scripts/migrate-to-products.ts
async function migrateExistingUsers() {
  // Get all organizations
  const { data: orgs } = await supabase
    .from('organizations')
    .select('id');
    
  // Get product IDs
  const { data: products } = await supabase
    .from('products')
    .select('id, code');
    
  const productMap = Object.fromEntries(
    products.map(p => [p.code, p.id])
  );
  
  for (const org of orgs) {
    // Create subscriptions for all products (grandfathered)
    await supabase.from('organization_subscriptions').insert([
      {
        organization_id: org.id,
        product_id: productMap.remote,
        status: 'active',
        user_count: 999, // Unlimited for grandfathered
      },
      {
        organization_id: org.id,
        product_id: productMap.time,
        status: 'active',
        user_count: 999,
      },
      {
        organization_id: org.id,
        product_id: productMap.guard,
        status: 'active',
        user_count: 999,
      }
    ]);
    
    // Grant access to all users
    const { data: users } = await supabase
      .from('profiles')
      .select('id')
      .eq('organization_id', org.id);
      
    for (const user of users) {
      await supabase.from('user_product_access').insert([
        {
          user_id: user.id,
          organization_id: org.id,
          product_id: productMap.remote,
          is_active: true,
        },
        {
          user_id: user.id,
          organization_id: org.id,
          product_id: productMap.time,
          is_active: true,
        },
        {
          user_id: user.id,
          organization_id: org.id,
          product_id: productMap.guard,
          is_active: true,
        }
      ]);
    }
  }
}
```

### 10. Product Selection on Signup

```typescript
// app/signup/ProductSelection.tsx
export function ProductSelection({ 
  onSelect 
}: { 
  onSelect: (products: string[]) => void 
}) {
  const [selected, setSelected] = useState<string[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  
  const calculatePrice = () => {
    const individual = selected.reduce((sum, code) => {
      const product = products.find(p => p.code === code);
      return sum + (product?.price_monthly || 0);
    }, 0);
    
    const bundle = selected.length === 3 ? 20 : individual;
    const savings = individual - bundle;
    
    return { individual, bundle, savings };
  };
  
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Choose Your Products</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {products.map(product => (
          <Card 
            key={product.code}
            className={cn(
              "cursor-pointer transition-all",
              selected.includes(product.code) && "ring-2 ring-blue-500"
            )}
            onClick={() => toggleProduct(product.code)}
          >
            <CardHeader>
              <CardTitle>{product.display_name}</CardTitle>
              <CardDescription>${product.price_monthly}/user/month</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {Object.entries(product.features).map(([key, enabled]) => (
                  enabled && (
                    <li key={key} className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      {key}
                    </li>
                  )
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {/* Bundle Offer */}
      {selected.length > 1 && (
        <Alert>
          <AlertDescription>
            {selected.length === 3 ? (
              <>
                <strong>Bundle Discount Applied!</strong> 
                Save ${calculatePrice().savings}/user/month
              </>
            ) : (
              <>Add {3 - selected.length} more product(s) to get bundle discount</>
            )}
          </AlertDescription>
        </Alert>
      )}
      
      <Button 
        onClick={() => onSelect(selected)}
        disabled={selected.length === 0}
      >
        Continue with {selected.length} product(s) - ${calculatePrice().bundle}/user/month
      </Button>
    </div>
  );
}
```

---

This technical guide provides the actual code implementation for the modularization. Each section can be implemented incrementally, tested, and deployed separately.