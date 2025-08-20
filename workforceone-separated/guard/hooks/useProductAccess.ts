'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';

export interface Product {
  id: string;
  code: string;
  name: string;
  display_name: string;
  description: string;
  price_monthly: number;
  price_annual: number;
  color_theme: string;
  icon_name: string;
  features: Record<string, boolean>;
  is_active: boolean;
  has_access: boolean;
  subscription_status?: 'trial' | 'active' | 'past_due' | 'cancelled' | 'suspended';
  is_primary?: boolean;
}

export interface ProductAccess {
  remote: boolean;
  time: boolean;
  guard: boolean;
  loading: boolean;
  products: Product[];
  primaryProduct?: Product;
  hasAnyAccess: boolean;
  refreshAccess: () => Promise<void>;
}

export function useProductAccess(): ProductAccess {
  const [access, setAccess] = useState<ProductAccess>({
    remote: false,
    time: false,
    guard: false,
    loading: true,
    products: [],
    hasAnyAccess: false,
    refreshAccess: async () => {}
  });

  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const supabase = createClient();

  // Get user and profile data
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        setProfile(profile);
      }
    };

    getUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUser(session.user);
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();
        setProfile(profile);
      } else {
        setUser(null);
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  const checkProductAccess = useCallback(async () => {
    if (!user || !profile?.organization_id) {
      setAccess(prev => ({ ...prev, loading: false }));
      return;
    }

    try {
      // Get all products first
      const { data: allProducts, error: productsError } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');

      if (productsError) {
        console.error('Error fetching products:', productsError);
        setAccess(prev => ({ ...prev, loading: false }));
        return;
      }

      // Get user's product access
      const { data: userAccess, error: accessError } = await supabase
        .from('user_product_access')
        .select(`
          product_id,
          is_active,
          permissions,
          products!inner (
            id,
            code,
            name,
            display_name,
            description,
            price_monthly,
            price_annual,
            color_theme,
            icon_name,
            features,
            is_active
          )
        `)
        .eq('user_id', user.id)
        .eq('is_active', true);

      if (accessError) {
        console.error('Error fetching user access:', accessError);
        setAccess(prev => ({ ...prev, loading: false }));
        return;
      }

      // Get organization subscriptions
      const { data: subscriptions, error: subError } = await supabase
        .from('organization_subscriptions')
        .select(`
          status,
          product_id,
          products!inner (
            code
          )
        `)
        .eq('organization_id', profile.organization_id)
        .in('status', ['trial', 'active']);

      if (subError) {
        console.error('Error fetching subscriptions:', subError);
      }

      // Build products array with access information
      const productsWithAccess: Product[] = [];
      const accessMap = {
        remote: false,
        time: false,
        guard: false
      };

      userAccess?.forEach(access => {
        if (access.products && access.is_active) {
          const subscription = subscriptions?.find(
            sub => sub.product_id === access.products.id
          );

          const product: Product = {
            ...access.products,
            has_access: true,
            subscription_status: subscription?.status,
            is_primary: access.permissions?.primary_product === true
          };

          productsWithAccess.push(product);

          // Update access map
          if (access.products.code === 'remote') accessMap.remote = true;
          if (access.products.code === 'time') accessMap.time = true;
          if (access.products.code === 'guard') accessMap.guard = true;
        }
      });

      // Find primary product
      const primaryProduct = productsWithAccess.find(p => p.is_primary) || 
                           productsWithAccess[0]; // Default to first if no primary

      const hasAnyAccess = productsWithAccess.length > 0;

      setAccess({
        ...accessMap,
        loading: false,
        products: productsWithAccess,
        primaryProduct,
        hasAnyAccess,
        refreshAccess: checkProductAccess
      });

    } catch (error) {
      console.error('Error checking product access:', error);
      setAccess(prev => ({ 
        ...prev, 
        loading: false,
        refreshAccess: checkProductAccess
      }));
    }
  }, [user, profile, supabase]);

  useEffect(() => {
    checkProductAccess();
  }, [checkProductAccess]);

  // Set up real-time updates for user access changes
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('user_product_access_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_product_access',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          checkProductAccess();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'organization_subscriptions',
          filter: `organization_id=eq.${profile?.organization_id}`
        },
        () => {
          checkProductAccess();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, profile?.organization_id, checkProductAccess, supabase]);

  return access;
}

// Helper hook for checking specific product access
export function useHasProduct(productCode: 'remote' | 'time' | 'guard'): boolean {
  const { [productCode]: hasAccess } = useProductAccess();
  return hasAccess;
}

// Helper hook for checking feature access
export function useHasFeature(productCode: string, featureKey: string): boolean {
  const { products } = useProductAccess();
  const product = products.find(p => p.code === productCode);
  
  if (!product?.has_access) return false;
  return product.features[featureKey] === true;
}

// Helper hook for getting product by code
export function useProduct(productCode: string): Product | undefined {
  const { products } = useProductAccess();
  return products.find(p => p.code === productCode);
}