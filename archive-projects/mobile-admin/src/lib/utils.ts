export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount)
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function formatDateTime(date: string | Date): string {
  return new Date(date).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatRelativeTime(date: string | Date): string {
  const now = new Date()
  const target = new Date(date)
  const diffInMs = now.getTime() - target.getTime()
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))
  
  if (diffInDays === 0) {
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60))
    if (diffInHours === 0) {
      const diffInMinutes = Math.floor(diffInMs / (1000 * 60))
      return `${diffInMinutes}m ago`
    }
    return `${diffInHours}h ago`
  } else if (diffInDays === 1) {
    return 'Yesterday'
  } else if (diffInDays < 7) {
    return `${diffInDays}d ago`
  } else {
    return formatDate(date)
  }
}

export function getHealthStatus(score: number): {
  status: 'healthy' | 'warning' | 'critical'
  color: string
  label: string
} {
  if (score >= 80) {
    return { status: 'healthy', color: '#10b981', label: 'Healthy' }
  } else if (score >= 60) {
    return { status: 'warning', color: '#f59e0b', label: 'Warning' }
  } else {
    return { status: 'critical', color: '#ef4444', label: 'Critical' }
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

export function getStatusBadgeColor(status: string): string {
  switch (status) {
    case 'active': return '#10b981'
    case 'trial': return '#3b82f6'
    case 'expired': return '#ef4444'
    case 'past_due': return '#f59e0b'
    case 'canceled': return '#6b7280'
    default: return '#6b7280'
  }
}

export function getTrendColor(value: number): string {
  if (value > 0) return '#10b981'
  if (value < 0) return '#ef4444'
  return '#6b7280'
}

export function abbreviateNumber(num: number): string {
  if (num >= 1000000000) {
    return (num / 1000000000).toFixed(1) + 'B'
  }
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M'
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K'
  }
  return num.toString()
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => func(...args), delay)
  }
}