import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
});

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface ProductSubscriptionRequest {
  organizationId: string;
  products: {
    code: 'remote' | 'time' | 'guard';
    userCount: number;
  }[];
  billingInterval: 'monthly' | 'annual';
}

export interface SubscriptionResult {
  success: boolean;
  clientSecret?: string;
  subscriptionId?: string;
  error?: string;
}

class StripeService {
  // Create Stripe customer for organization
  async createCustomer(organizationId: string, email: string, name: string): Promise<Stripe.Customer> {
    const customer = await stripe.customers.create({
      email,
      name,
      metadata: {
        organizationId,
        source: 'workforceone'
      }
    });

    // Store customer ID in database
    await supabase
      .from('organizations')
      .update({ stripe_customer_id: customer.id })
      .eq('id', organizationId);

    return customer;
  }

  // Get or create customer
  async getOrCreateCustomer(organizationId: string): Promise<string> {
    // Check if customer already exists
    const { data: org } = await supabase
      .from('organizations')
      .select('stripe_customer_id, name, email')
      .eq('id', organizationId)
      .single();

    if (org?.stripe_customer_id) {
      return org.stripe_customer_id;
    }

    // Create new customer
    const customer = await this.createCustomer(
      organizationId, 
      org?.email || 'noreply@workforceone.com',
      org?.name || 'WorkforceOne Organization'
    );

    return customer.id;
  }

  // Create subscription for multiple products
  async createMultiProductSubscription(request: ProductSubscriptionRequest): Promise<SubscriptionResult> {
    try {
      const customerId = await this.getOrCreateCustomer(request.organizationId);

      // Get product prices from database
      const { data: products } = await supabase
        .from('products')
        .select('*')
        .in('code', request.products.map(p => p.code));

      if (!products || products.length === 0) {
        return { success: false, error: 'Products not found' };
      }

      // Calculate line items for subscription
      const lineItems: Stripe.SubscriptionCreateParams.Item[] = [];
      let totalMonthlyPrice = 0;

      for (const productRequest of request.products) {
        const product = products.find(p => p.code === productRequest.code);
        if (!product) continue;

        const unitPrice = request.billingInterval === 'annual' 
          ? product.price_annual 
          : product.price_monthly;

        totalMonthlyPrice += unitPrice * productRequest.userCount;

        // Create Stripe price if doesn't exist
        const stripePrice = await this.getOrCreateStripePrice(
          product.code,
          unitPrice,
          request.billingInterval
        );

        lineItems.push({
          price: stripePrice.id,
          quantity: productRequest.userCount,
        });
      }

      // Check for bundle discount (20% off when buying all 3 products)
      const isBundle = request.products.length === 3 && 
        request.products.some(p => p.code === 'remote') &&
        request.products.some(p => p.code === 'time') &&
        request.products.some(p => p.code === 'guard');

      let discountCoupon: string | undefined;
      if (isBundle) {
        discountCoupon = await this.getOrCreateBundleDiscount();
      }

      // Create subscription
      const subscriptionParams: Stripe.SubscriptionCreateParams = {
        customer: customerId,
        items: lineItems,
        payment_behavior: 'default_incomplete',
        payment_settings: {
          payment_method_types: ['card'],
          save_default_payment_method: 'on_subscription'
        },
        expand: ['latest_invoice.payment_intent'],
        metadata: {
          organizationId: request.organizationId,
          productCount: request.products.length.toString(),
          isBundle: isBundle.toString()
        }
      };

      if (discountCoupon) {
        subscriptionParams.coupon = discountCoupon;
      }

      const subscription = await stripe.subscriptions.create(subscriptionParams);

      // Store subscription in database
      await this.storeSubscriptionInDatabase(subscription, request);

      const invoice = subscription.latest_invoice as Stripe.Invoice;
      const paymentIntent = invoice.payment_intent as Stripe.PaymentIntent;

      return {
        success: true,
        clientSecret: paymentIntent.client_secret!,
        subscriptionId: subscription.id
      };

    } catch (error) {
      console.error('Stripe subscription creation error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // Get or create Stripe price for product
  private async getOrCreateStripePrice(
    productCode: string, 
    unitPrice: number, 
    interval: 'monthly' | 'annual'
  ): Promise<Stripe.Price> {
    const priceId = `workforceone_${productCode}_${interval}_${Math.round(unitPrice * 100)}`;
    
    try {
      // Try to retrieve existing price
      return await stripe.prices.retrieve(priceId);
    } catch (error) {
      // Create new price
      const stripeProduct = await this.getOrCreateStripeProduct(productCode);
      
      return await stripe.prices.create({
        id: priceId,
        product: stripeProduct.id,
        unit_amount: Math.round(unitPrice * 100), // Convert to cents
        currency: 'usd',
        recurring: {
          interval: interval === 'annual' ? 'year' : 'month'
        },
        metadata: {
          productCode,
          interval
        }
      });
    }
  }

  // Get or create Stripe product
  private async getOrCreateStripeProduct(productCode: string): Promise<Stripe.Product> {
    const productId = `workforceone_${productCode}`;
    
    try {
      return await stripe.products.retrieve(productId);
    } catch (error) {
      // Get product details from database
      const { data: product } = await supabase
        .from('products')
        .select('*')
        .eq('code', productCode)
        .single();

      if (!product) {
        throw new Error(`Product ${productCode} not found in database`);
      }

      return await stripe.products.create({
        id: productId,
        name: product.display_name,
        description: `${product.name} - Professional workforce management`,
        metadata: {
          productCode,
          features: JSON.stringify(product.features)
        }
      });
    }
  }

  // Create bundle discount coupon
  private async getOrCreateBundleDiscount(): Promise<string> {
    const couponId = 'workforceone_bundle_23percent';
    
    try {
      await stripe.coupons.retrieve(couponId);
      return couponId;
    } catch (error) {
      await stripe.coupons.create({
        id: couponId,
        name: 'WorkforceOne Complete Bundle',
        percent_off: 23, // 23% discount brings $26 total down to $20
        duration: 'forever',
        metadata: {
          type: 'bundle_discount',
          description: 'Multi-product bundle discount'
        }
      });
      return couponId;
    }
  }

  // Store subscription data in database
  private async storeSubscriptionInDatabase(
    subscription: Stripe.Subscription,
    request: ProductSubscriptionRequest
  ): Promise<void> {
    const { organizationId, products } = request;

    // Store organization subscriptions
    for (const productRequest of products) {
      // Get product ID
      const { data: product } = await supabase
        .from('products')
        .select('id')
        .eq('code', productRequest.code)
        .single();

      if (!product) continue;

      // Store subscription
      await supabase
        .from('organization_subscriptions')
        .upsert({
          organization_id: organizationId,
          product_id: product.id,
          stripe_subscription_id: subscription.id,
          status: subscription.status === 'active' ? 'active' : 'trial',
          current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          user_count: productRequest.userCount,
          unit_price: request.billingInterval === 'annual' 
            ? products.find(p => p.code === productRequest.code)?.price_annual || 0
            : products.find(p => p.code === productRequest.code)?.price_monthly || 0,
          metadata: {
            stripe_subscription_id: subscription.id,
            billing_interval: request.billingInterval,
            created_via: 'api'
          }
        });
    }
  }

  // Handle webhook events
  async handleWebhook(body: string, signature: string): Promise<void> {
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;
    
    try {
      const event = stripe.webhooks.constructEvent(body, signature, endpointSecret);

      switch (event.type) {
        case 'invoice.payment_succeeded':
          await this.handlePaymentSucceeded(event.data.object as Stripe.Invoice);
          break;
        case 'invoice.payment_failed':
          await this.handlePaymentFailed(event.data.object as Stripe.Invoice);
          break;
        case 'customer.subscription.updated':
          await this.handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
          break;
        case 'customer.subscription.deleted':
          await this.handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
          break;
        default:
          console.log(`Unhandled event type: ${event.type}`);
      }
    } catch (error) {
      console.error('Webhook error:', error);
      throw error;
    }
  }

  private async handlePaymentSucceeded(invoice: Stripe.Invoice): Promise<void> {
    const subscriptionId = invoice.subscription as string;
    
    // Update subscription status to active
    await supabase
      .from('organization_subscriptions')
      .update({ 
        status: 'active',
        last_payment_date: new Date().toISOString()
      })
      .eq('stripe_subscription_id', subscriptionId);
  }

  private async handlePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
    const subscriptionId = invoice.subscription as string;
    
    // Update subscription status
    await supabase
      .from('organization_subscriptions')
      .update({ status: 'past_due' })
      .eq('stripe_subscription_id', subscriptionId);
  }

  private async handleSubscriptionUpdated(subscription: Stripe.Subscription): Promise<void> {
    await supabase
      .from('organization_subscriptions')
      .update({
        status: subscription.status === 'active' ? 'active' : 'trial',
        current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString()
      })
      .eq('stripe_subscription_id', subscription.id);
  }

  private async handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<void> {
    await supabase
      .from('organization_subscriptions')
      .update({ status: 'cancelled' })
      .eq('stripe_subscription_id', subscription.id);
  }

  // Get organization's current subscriptions
  async getOrganizationSubscriptions(organizationId: string) {
    const { data, error } = await supabase
      .from('organization_subscriptions')
      .select(`
        *,
        products (
          code,
          name,
          display_name,
          price_monthly,
          price_annual,
          features
        )
      `)
      .eq('organization_id', organizationId)
      .eq('status', 'active');

    if (error) throw error;
    return data;
  }
}

export default new StripeService();