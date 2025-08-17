import { loadStripe, Stripe } from '@stripe/stripe-js'

let stripePromise: Promise<Stripe | null>

export const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)
  }
  return stripePromise
}

export interface PaymentIntentData {
  amount: number
  currency: string
  organizationId: string
  subscriptionId: string
  selectedFeatures: string[]
  userCount: number
  billingPeriod: 'monthly' | 'yearly'
}

export interface SubscriptionData {
  organizationId: string
  selectedFeatures: string[]
  userCount: number
  billingPeriod: 'monthly' | 'yearly'
  priceId?: string
}