import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date): string {
  const userLocale = typeof window !== 'undefined' 
    ? navigator.language || 'en-US' 
    : 'en-US'
    
  return new Date(date).toLocaleDateString(userLocale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function formatDateTime(date: string | Date): string {
  const userLocale = typeof window !== 'undefined' 
    ? navigator.language || 'en-US' 
    : 'en-US'
    
  return new Date(date).toLocaleString(userLocale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatCurrency(amount: number, currency?: string): string {
  // Detect user's locale and preferred currency
  const userLocale = typeof window !== 'undefined' 
    ? navigator.language || 'en-US' 
    : 'en-US'
  
  // Default to USD if no currency specified, but allow override
  const defaultCurrency = currency || 'USD'
  
  try {
    return new Intl.NumberFormat(userLocale, {
      style: 'currency',
      currency: defaultCurrency,
    }).format(amount)
  } catch (error) {
    // Fallback to en-US if user's locale causes issues
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: defaultCurrency,
    }).format(amount)
  }
}

export function getHealthStatus(score: number): {
  status: 'healthy' | 'warning' | 'critical'
  color: string
  label: string
} {
  if (score >= 80) {
    return { status: 'healthy', color: 'text-green-600', label: 'Healthy' }
  } else if (score >= 60) {
    return { status: 'warning', color: 'text-yellow-600', label: 'Warning' }
  } else {
    return { status: 'critical', color: 'text-red-600', label: 'Critical' }
  }
}

export function calculateHealthScore(org: any): number {
  let score = 100
  
  // Deduct points for various issues
  if (org.subscription_status === 'expired') score -= 30
  if (org.subscription_status === 'past_due') score -= 20
  if (org.active_users === 0) score -= 25
  if (org.last_activity && new Date(org.last_activity) < new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)) score -= 15
  if (org.support_tickets_open > 0) score -= (org.support_tickets_open * 5)
  
  return Math.max(0, score)
}