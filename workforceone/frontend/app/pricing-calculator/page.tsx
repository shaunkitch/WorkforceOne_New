import { PricingCalculator } from '@/components/PricingCalculator'

export default function PricingCalculatorPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <PricingCalculator />
    </div>
  )
}

export const metadata = {
  title: 'Pricing Calculator | WorkforceOne',
  description: 'Calculate your costs and ROI for WorkforceOne Remote, Time, and Guard products. See how much you can save with our workforce management solutions.',
}