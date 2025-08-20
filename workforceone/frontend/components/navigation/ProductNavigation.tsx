'use client';

import { useState, useEffect } from 'react';
import { useProductAccess } from '@/hooks/useProductAccess';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Users, Clock, Shield, LayoutDashboard, Settings, 
  CheckSquare, FolderOpen, FileText, Calendar, 
  BarChart, Route, AlertTriangle, Monitor,
  Bell, CreditCard, HelpCircle, LogOut,
  ChevronRight, Home
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Navigation structure for each product
const PRODUCT_NAVIGATION = {
  remote: {
    icon: Users,
    color: '#3B82F6',
    routes: [
      { 
        label: 'Dashboard', 
        href: '/dashboard/remote', 
        icon: LayoutDashboard,
        description: 'Remote workforce overview'
      },
      { 
        label: 'Teams', 
        href: '/dashboard/teams', 
        icon: Users,
        description: 'Manage team structure'
      },
      { 
        label: 'Tasks', 
        href: '/dashboard/tasks', 
        icon: CheckSquare,
        description: 'Track and assign tasks'
      },
      { 
        label: 'Projects', 
        href: '/dashboard/projects', 
        icon: FolderOpen,
        description: 'Project management'
      },
      { 
        label: 'Forms', 
        href: '/dashboard/forms', 
        icon: FileText,
        description: 'Custom forms and data collection'
      },
      { 
        label: 'Routes', 
        href: '/dashboard/routes', 
        icon: Route,
        description: 'Daily route planning'
      }
    ]
  },
  time: {
    icon: Clock,
    color: '#10B981',
    routes: [
      { 
        label: 'Dashboard', 
        href: '/dashboard/time', 
        icon: LayoutDashboard,
        description: 'Time tracking overview'
      },
      { 
        label: 'Time Tracker', 
        href: '/dashboard/time-tracker', 
        icon: Clock,
        description: 'Clock in and track time'
      },
      { 
        label: 'Attendance', 
        href: '/dashboard/attendance', 
        icon: Calendar,
        description: 'Attendance records'
      },
      { 
        label: 'Shifts', 
        href: '/dashboard/shifts', 
        icon: Calendar,
        description: 'Shift management'
      },
      { 
        label: 'Leave', 
        href: '/dashboard/leave', 
        icon: Calendar,
        description: 'Leave requests and balances'
      },
      { 
        label: 'Payroll', 
        href: '/dashboard/payroll', 
        icon: BarChart,
        description: 'Time and payroll reports'
      }
    ]
  },
  guard: {
    icon: Shield,
    color: '#8B5CF6',
    routes: [
      { 
        label: 'Dashboard', 
        href: '/dashboard/guard', 
        icon: LayoutDashboard,
        description: 'Security overview'
      },
      { 
        label: 'Patrols', 
        href: '/dashboard/patrols', 
        icon: Shield,
        description: 'Active patrols and routes'
      },
      { 
        label: 'Incidents', 
        href: '/dashboard/incidents', 
        icon: AlertTriangle,
        description: 'Incident reports'
      },
      { 
        label: 'Checkpoints', 
        href: '/dashboard/checkpoints', 
        icon: Monitor,
        description: 'QR code checkpoints'
      },
      { 
        label: 'Guards', 
        href: '/dashboard/guards', 
        icon: Users,
        description: 'Guard scheduling and management'
      },
      { 
        label: 'Live Monitor', 
        href: '/dashboard/monitoring', 
        icon: Monitor,
        description: 'Real-time security monitoring'
      }
    ]
  }
};

// Shared navigation items
const SHARED_ROUTES = [
  { 
    label: 'Settings', 
    href: '/dashboard/settings', 
    icon: Settings,
    description: 'Account and organization settings'
  },
  { 
    label: 'Billing', 
    href: '/dashboard/billing', 
    icon: CreditCard,
    description: 'Subscription and billing'
  },
  { 
    label: 'Help', 
    href: '/help', 
    icon: HelpCircle,
    description: 'Help and support'
  }
];

interface ProductNavigationProps {
  currentProduct?: string;
  compact?: boolean;
  showProductSwitcher?: boolean;
  className?: string;
}

export function ProductNavigation({ 
  currentProduct,
  compact = false,
  showProductSwitcher = true,
  className
}: ProductNavigationProps) {
  const { products, loading, primaryProduct } = useProductAccess();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  // Determine active product
  const [activeProduct, setActiveProduct] = useState<string>(
    currentProduct || 
    searchParams.get('product') || 
    primaryProduct?.code || 
    (products[0]?.code ?? '')
  );

  // Update active product when URL changes
  useEffect(() => {
    const urlProduct = searchParams.get('product');
    if (urlProduct && products.some(p => p.code === urlProduct)) {
      setActiveProduct(urlProduct);
    }
  }, [searchParams, products]);

  const handleProductSwitch = (productCode: string) => {
    setActiveProduct(productCode);
    // Update URL with product parameter
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.set('product', productCode);
    router.push(newUrl.pathname + newUrl.search);
  };

  const isActiveRoute = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard';
    }
    return pathname.startsWith(href);
  };

  if (loading) {
    return (
      <div className="flex flex-col space-y-2 p-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="animate-pulse bg-gray-200 h-10 w-full rounded" />
        ))}
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8">
        <Home className="h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-semibold text-gray-600 mb-2">
          No Products Available
        </h3>
        <p className="text-gray-500 text-center mb-4">
          Contact your administrator to get access to products.
        </p>
        <Button onClick={() => router.push('/dashboard/billing')}>
          View Products
        </Button>
      </div>
    );
  }

  const activeProductData = products.find(p => p.code === activeProduct);
  const navigation = activeProductData ? PRODUCT_NAVIGATION[activeProduct as keyof typeof PRODUCT_NAVIGATION] : null;

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Product Switcher */}
      {showProductSwitcher && products.length > 1 && (
        <div className="p-4 border-b bg-gray-50/50">
          <div className="space-y-2">
            <div className="text-sm font-medium text-gray-700 mb-2">
              Active Product
            </div>
            <div className="space-y-1">
              {products.map(product => {
                const Icon = PRODUCT_NAVIGATION[product.code as keyof typeof PRODUCT_NAVIGATION]?.icon || Users;
                const isActive = activeProduct === product.code;
                
                return (
                  <button
                    key={product.id}
                    onClick={() => handleProductSwitch(product.code)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors",
                      isActive 
                        ? "bg-white shadow-sm border" 
                        : "hover:bg-gray-100"
                    )}
                  >
                    <Icon 
                      className="h-4 w-4" 
                      style={{ color: product.color_theme }} 
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">
                        {product.display_name}
                      </div>
                      {!compact && (
                        <div className="text-xs text-gray-500 truncate">
                          {product.subscription_status}
                        </div>
                      )}
                    </div>
                    {isActive && <ChevronRight className="h-4 w-4 text-gray-400" />}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Current Product Header (for single product or when switcher is hidden) */}
      {(!showProductSwitcher || products.length === 1) && activeProductData && (
        <div className="p-4 border-b">
          <div className="flex items-center gap-3">
            <div 
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: activeProductData.color_theme + '20' }}
            >
              {navigation && (
                <navigation.icon 
                  className="h-4 w-4" 
                  style={{ color: activeProductData.color_theme }} 
                />
              )}
            </div>
            <div>
              <div className="font-semibold text-sm">
                {activeProductData.display_name}
              </div>
              {!compact && (
                <div className="text-xs text-gray-500">
                  {activeProductData.subscription_status}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Navigation */}
      <nav className="flex-1 p-4">
        {navigation && (
          <div className="space-y-1">
            {navigation.routes.map(route => {
              const isActive = isActiveRoute(route.href);
              
              return (
                <Link
                  key={route.href}
                  href={route.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors group",
                    isActive
                      ? "bg-blue-50 text-blue-700 border border-blue-200"
                      : "text-gray-700 hover:bg-gray-100"
                  )}
                >
                  <route.icon className={cn(
                    "h-4 w-4",
                    isActive ? "text-blue-600" : "text-gray-500"
                  )} />
                  <div className="flex-1">
                    <div className="font-medium text-sm">
                      {route.label}
                    </div>
                    {!compact && (
                      <div className="text-xs text-gray-500 group-hover:text-gray-600">
                        {route.description}
                      </div>
                    )}
                  </div>
                  {isActive && (
                    <div className="w-2 h-2 rounded-full bg-blue-600" />
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </nav>

      {/* Shared Navigation */}
      <div className="p-4 border-t bg-gray-50/50 space-y-1">
        {SHARED_ROUTES.map(route => {
          const isActive = isActiveRoute(route.href);
          
          return (
            <Link
              key={route.href}
              href={route.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sm",
                isActive
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-600 hover:text-gray-900 hover:bg-white/50"
              )}
            >
              <route.icon className="h-4 w-4" />
              {route.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

// Breadcrumb component for product-aware navigation
export function ProductBreadcrumb({ 
  items = [] 
}: { 
  items?: Array<{ label: string; href?: string }> 
}) {
  const { products } = useProductAccess();
  const searchParams = useSearchParams();
  const activeProduct = searchParams.get('product');
  
  const activeProductData = products.find(p => p.code === activeProduct);
  
  return (
    <nav className="flex items-center space-x-1 text-sm text-gray-500">
      <Link href="/dashboard" className="hover:text-gray-700">
        Dashboard
      </Link>
      
      {activeProductData && (
        <>
          <ChevronRight className="h-4 w-4" />
          <span className="font-medium" style={{ color: activeProductData.color_theme }}>
            {activeProductData.display_name}
          </span>
        </>
      )}
      
      {items.map((item, index) => (
        <div key={index} className="flex items-center space-x-1">
          <ChevronRight className="h-4 w-4" />
          {item.href ? (
            <Link href={item.href} className="hover:text-gray-700">
              {item.label}
            </Link>
          ) : (
            <span className="font-medium text-gray-900">
              {item.label}
            </span>
          )}
        </div>
      ))}
    </nav>
  );
}