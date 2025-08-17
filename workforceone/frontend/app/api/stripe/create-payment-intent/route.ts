import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@/lib/supabase/server'
import { featureAccess } from '@/lib/feature-access'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { organizationId, selectedFeatures, userCount, billingPeriod } = body

    // Validate the request
    if (!organizationId || !selectedFeatures || !userCount) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Calculate pricing
    const pricing = await featureAccess.calculatePricing(
      selectedFeatures,
      userCount,
      billingPeriod
    )

    const amount = Math.round(
      (billingPeriod === 'yearly' ? pricing.yearlyTotal : pricing.monthlyTotal) * 100
    ) // Convert to cents

    // Create or retrieve Stripe customer
    const supabase = createClient()
    const { data: organization } = await supabase
      .from('organizations')
      .select('stripe_customer_id, name')
      .eq('id', organizationId)
      .single()

    let customerId = organization?.stripe_customer_id

    if (!customerId) {
      const customer = await stripe.customers.create({
        name: organization?.name,
        metadata: {
          organizationId,
        },
      })
      customerId = customer.id

      // Update organization with customer ID
      await supabase
        .from('organizations')
        .update({ stripe_customer_id: customerId })
        .eq('id', organizationId)
    }

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: 'usd', // We'll handle currency conversion in frontend
      customer: customerId,
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        organizationId,
        selectedFeatures: JSON.stringify(selectedFeatures),
        userCount: userCount.toString(),
        billingPeriod,
        type: 'subscription_payment',
      },
    })

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      amount: pricing.monthlyTotal,
      yearlyAmount: pricing.yearlyTotal,
    })
  } catch (error) {
    console.error('Error creating payment intent:', error)
    return NextResponse.json(
      { error: 'Failed to create payment intent' },
      { status: 500 }
    )
  }
}