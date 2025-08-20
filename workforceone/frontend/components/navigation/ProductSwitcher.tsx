'use client';

import { useState } from 'react';
import { useProductAccess, Product } from '@/hooks/useProductAccess';
import { useRouter, usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { 
  Users, Clock, Shield, Plus, 
  ChevronDown, Check, Settings 
} from 'lucide-react';

const PRODUCT_ICONS = {
  remote: Users,
  time: Clock,
  guard: Shield
};

interface ProductSwitcherProps {
  compact?: boolean;
  showAddProducts?: boolean;
  currentProduct?: string;
  onProductChange?: (productCode: string) => void;
}

export function ProductSwitcher({ 
  compact = false,
  showAddProducts = true,
  currentProduct,
  onProductChange
}: ProductSwitcherProps) {
  const { products, loading, primaryProduct } = useProductAccess();
  const router = useRouter();
  const pathname = usePathname();
  
  const [selectedProduct, setSelectedProduct] = useState<string>(
    currentProduct || primaryProduct?.code || (products[0]?.code ?? '')
  );

  if (loading) {
    return (
      <div className="flex items-center gap-2">
        <div className="animate-pulse bg-gray-200 h-8 w-32 rounded" />
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <Card className="max-w-md">
        <CardHeader>
          <CardTitle>No Products Available</CardTitle>
          <CardDescription>
            Contact your administrator to get access to WorkforceOne products.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => router.push('/dashboard/billing')}>
            View Available Products
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (products.length === 1) {
    const product = products[0];
    const Icon = PRODUCT_ICONS[product.code as keyof typeof PRODUCT_ICONS];
    
    return (
      <div className="flex items-center gap-2">
        <div 
          className="flex items-center gap-2 px-3 py-2 rounded-lg"
          style={{ backgroundColor: product.color_theme + '10' }}
        >
          <Icon 
            className="h-4 w-4" 
            style={{ color: product.color_theme }} 
          />
          <span className="font-medium">
            {compact ? product.display_name : product.name}
          </span>
          <Badge variant="outline" className="text-xs">
            {product.subscription_status}
          </Badge>
        </div>
      </div>
    );
  }

  const handleProductChange = (productCode: string) => {
    setSelectedProduct(productCode);
    onProductChange?.(productCode);
    
    // If no custom handler, navigate based on current path
    if (!onProductChange) {
      const basePath = pathname.split('/')[1]; // e.g., 'dashboard'
      router.push(`/${basePath}?product=${productCode}`);
    }
  };

  const selectedProductData = products.find(p => p.code === selectedProduct);
  const SelectedIcon = selectedProductData 
    ? PRODUCT_ICONS[selectedProductData.code as keyof typeof PRODUCT_ICONS]
    : Users;

  if (compact) {
    return (
      <Select value={selectedProduct} onValueChange={handleProductChange}>
        <SelectTrigger className="w-48">
          <div className="flex items-center gap-2">
            <SelectedIcon className="h-4 w-4" />
            <SelectValue>
              {selectedProductData?.display_name || 'Select Product'}
            </SelectValue>
          </div>
        </SelectTrigger>
        <SelectContent>
          {products.map(product => {
            const Icon = PRODUCT_ICONS[product.code as keyof typeof PRODUCT_ICONS];
            return (
              <SelectItem key={product.id} value={product.code}>
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4" />
                  <span>{product.display_name}</span>
                  <Badge variant="outline" className="text-xs ml-2">
                    {product.subscription_status}
                  </Badge>
                </div>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
    );
  }

  return (
    <div className="space-y-4">
      {/* Product Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {products.map(product => {
          const Icon = PRODUCT_ICONS[product.code as keyof typeof PRODUCT_ICONS];
          const isSelected = selectedProduct === product.code;
          
          return (
            <Card 
              key={product.id}
              className={`cursor-pointer transition-all border-2 ${
                isSelected 
                  ? 'border-blue-500 shadow-md' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => handleProductChange(product.code)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div 
                    className="w-10 h-10 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: product.color_theme + '20' }}
                  >
                    <Icon 
                      className="h-5 w-5" 
                      style={{ color: product.color_theme }} 
                    />
                  </div>
                  {isSelected && (
                    <Check className="h-5 w-5 text-blue-500" />
                  )}
                </div>
                <CardTitle className="text-lg">
                  {product.display_name}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Badge 
                    variant={product.subscription_status === 'active' ? 'default' : 'outline'}
                    className="text-xs"
                  >
                    {product.subscription_status}
                  </Badge>
                  {product.is_primary && (
                    <Badge variant="outline" className="text-xs">
                      Primary
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-sm">
                  {product.description}
                </CardDescription>
                <div className="mt-3">
                  <span className="text-lg font-semibold">
                    ${product.price_monthly}
                  </span>
                  <span className="text-sm text-gray-500">/user/month</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
        
        {/* Add Product Card */}
        {showAddProducts && (
          <Card 
            className="cursor-pointer transition-all border-2 border-dashed border-gray-300 hover:border-gray-400 bg-gray-50/50"
            onClick={() => router.push('/dashboard/billing')}
          >
            <CardContent className="flex flex-col items-center justify-center h-full min-h-[200px] text-center">
              <div className="w-10 h-10 rounded-lg bg-gray-200 flex items-center justify-center mb-3">
                <Plus className="h-5 w-5 text-gray-500" />
              </div>
              <CardTitle className="text-lg text-gray-600 mb-2">
                Add Product
              </CardTitle>
              <CardDescription>
                Expand your capabilities with additional products
              </CardDescription>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-4">
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => router.push('/dashboard/settings')}
          className="flex items-center gap-2"
        >
          <Settings className="h-4 w-4" />
          Product Settings
        </Button>
        
        <div className="text-sm text-gray-500">
          {products.length} product{products.length !== 1 ? 's' : ''} active
        </div>
      </div>
    </div>
  );
}

// Simplified product selector for dropdowns
export function ProductSelector({ 
  value, 
  onChange, 
  placeholder = "Select product",
  className = ""
}: {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}) {
  const { products, loading } = useProductAccess();
  
  if (loading) {
    return (
      <div className={`animate-pulse bg-gray-200 h-10 w-full rounded ${className}`} />
    );
  }
  
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className={className}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {products.map(product => {
          const Icon = PRODUCT_ICONS[product.code as keyof typeof PRODUCT_ICONS];
          return (
            <SelectItem key={product.id} value={product.code}>
              <div className="flex items-center gap-2">
                <Icon className="h-4 w-4" />
                <span>{product.display_name}</span>
              </div>
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}