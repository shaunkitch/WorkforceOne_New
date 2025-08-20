import express from 'express';
import StripeService from '../services/StripeService';
import { requireAuth, requireRole } from '../middleware/auth';

const router = express.Router();

// Create subscription for multiple products
router.post('/subscribe', requireAuth, requireRole(['admin']), async (req, res) => {
  try {
    const { products, billingInterval = 'monthly' } = req.body;
    const organizationId = req.user.organization_id;

    if (!products || !Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ error: 'Products array is required' });
    }

    // Validate products
    const validProducts = ['remote', 'time', 'guard'];
    for (const product of products) {
      if (!validProducts.includes(product.code)) {
        return res.status(400).json({ error: `Invalid product code: ${product.code}` });
      }
      if (!product.userCount || product.userCount < 1) {
        return res.status(400).json({ error: 'User count must be at least 1' });
      }
    }

    const result = await StripeService.createMultiProductSubscription({
      organizationId,
      products,
      billingInterval
    });

    if (result.success) {
      res.json({
        clientSecret: result.clientSecret,
        subscriptionId: result.subscriptionId
      });
    } else {
      res.status(400).json({ error: result.error });
    }
  } catch (error) {
    console.error('Subscription creation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get current subscriptions
router.get('/subscriptions', requireAuth, async (req, res) => {
  try {
    const organizationId = req.user.organization_id;
    const subscriptions = await StripeService.getOrganizationSubscriptions(organizationId);
    
    res.json({ subscriptions });
  } catch (error) {
    console.error('Get subscriptions error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Calculate pricing for products
router.post('/calculate-pricing', requireAuth, async (req, res) => {
  try {
    const { products, billingInterval = 'monthly' } = req.body;

    if (!products || !Array.isArray(products)) {
      return res.status(400).json({ error: 'Products array is required' });
    }

    // Get product pricing from database
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: productData } = await supabase
      .from('products')
      .select('*')
      .in('code', products.map((p: any) => p.code));

    if (!productData) {
      return res.status(404).json({ error: 'Products not found' });
    }

    let totalPrice = 0;
    const itemizedPricing = [];

    for (const productRequest of products) {
      const product = productData.find(p => p.code === productRequest.code);
      if (!product) continue;

      const unitPrice = billingInterval === 'annual' 
        ? product.price_annual 
        : product.price_monthly;
      
      const lineTotal = unitPrice * productRequest.userCount;
      totalPrice += lineTotal;

      itemizedPricing.push({
        code: product.code,
        name: product.display_name,
        unitPrice,
        userCount: productRequest.userCount,
        lineTotal,
        features: product.features
      });
    }

    // Apply bundle discount if all 3 products
    let discountAmount = 0;
    const isBundle = products.length === 3 && 
      products.some((p: any) => p.code === 'remote') &&
      products.some((p: any) => p.code === 'time') &&
      products.some((p: any) => p.code === 'guard');

    if (isBundle) {
      discountAmount = totalPrice * 0.23; // 23% discount
    }

    const finalTotal = totalPrice - discountAmount;

    res.json({
      subtotal: totalPrice,
      discountAmount,
      total: finalTotal,
      isBundle,
      billingInterval,
      itemizedPricing,
      bundleDiscount: isBundle ? '23% off complete bundle' : null
    });

  } catch (error) {
    console.error('Pricing calculation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Stripe webhook endpoint
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const signature = req.headers['stripe-signature'] as string;
    await StripeService.handleWebhook(req.body.toString(), signature);
    res.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(400).json({ error: 'Webhook signature verification failed' });
  }
});

// Update subscription (add/remove products or change user counts)
router.put('/subscriptions/:subscriptionId', requireAuth, requireRole(['admin']), async (req, res) => {
  try {
    const { subscriptionId } = req.params;
    const { products } = req.body;
    const organizationId = req.user.organization_id;

    // TODO: Implement subscription modification
    // This would involve updating the Stripe subscription items
    // and syncing changes back to the database

    res.status(501).json({ error: 'Subscription modification not yet implemented' });
  } catch (error) {
    console.error('Subscription update error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Cancel subscription
router.delete('/subscriptions/:subscriptionId', requireAuth, requireRole(['admin']), async (req, res) => {
  try {
    const { subscriptionId } = req.params;
    const organizationId = req.user.organization_id;

    // TODO: Implement subscription cancellation
    // This would cancel the Stripe subscription and update database status

    res.status(501).json({ error: 'Subscription cancellation not yet implemented' });
  } catch (error) {
    console.error('Subscription cancellation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;