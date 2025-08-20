export type ProductId = 'workforce-management' | 'time-tracker' | 'guard-management'

export interface Product {
  id: ProductId
  name: string
  description: string
  icon: string
  color: {
    primary: string
    secondary: string
    gradient: string[]
  }
  features: Array<{
    id: string
    name: string
    description: string
    screen?: string
    premium?: boolean
  }>
  navigation: Array<{
    id: string
    label: string
    screen: string
    icon: string
    badge?: string
  }>
}

export const PRODUCTS: Record<ProductId, Product> = {
  'workforce-management': {
    id: 'workforce-management',
    name: 'Workforce Management',
    description: 'Complete team and project management',
    icon: '👥',
    color: {
      primary: '#059669',
      secondary: '#10b981',
      gradient: ['#059669', '#10b981']
    },
    features: [
      {
        id: 'employee-management',
        name: 'Employee Management',
        description: 'Manage your team members and their roles',
        screen: 'Employees'
      },
      {
        id: 'project-tracking',
        name: 'Project Tracking',
        description: 'Track project progress and deadlines',
        screen: 'Projects'
      },
      {
        id: 'team-collaboration',
        name: 'Team Collaboration',
        description: 'Enable seamless team communication',
        screen: 'Teams'
      },
      {
        id: 'performance-analytics',
        name: 'Performance Analytics',
        description: 'Advanced reporting and insights',
        screen: 'Analytics',
        premium: true
      }
    ],
    navigation: [
      { id: 'dashboard', label: 'Dashboard', screen: 'WorkforceDashboard', icon: '📊' },
      { id: 'employees', label: 'Employees', screen: 'Employees', icon: '👤' },
      { id: 'projects', label: 'Projects', screen: 'Projects', icon: '📁' },
      { id: 'teams', label: 'Teams', screen: 'Teams', icon: '👥' },
      { id: 'analytics', label: 'Analytics', screen: 'Analytics', icon: '📈' }
    ]
  },

  'time-tracker': {
    id: 'time-tracker',
    name: 'Time Tracker',
    description: 'Advanced time tracking and productivity',
    icon: '⏱️',
    color: {
      primary: '#3b82f6',
      secondary: '#60a5fa',
      gradient: ['#3b82f6', '#60a5fa']
    },
    features: [
      {
        id: 'time-tracking',
        name: 'Time Tracking',
        description: 'Track time spent on tasks and projects',
        screen: 'Timer'
      },
      {
        id: 'project-allocation',
        name: 'Project Time Allocation',
        description: 'Allocate time across different projects',
        screen: 'Timesheet'
      },
      {
        id: 'productivity-reports',
        name: 'Productivity Reports',
        description: 'Detailed productivity analysis',
        screen: 'Reports'
      },
      {
        id: 'invoice-generation',
        name: 'Invoice Generation',
        description: 'Generate invoices from tracked time',
        screen: 'Invoices',
        premium: true
      }
    ],
    navigation: [
      { id: 'dashboard', label: 'Dashboard', screen: 'TimeDashboard', icon: '📊' },
      { id: 'timer', label: 'Timer', screen: 'Timer', icon: '⏱️' },
      { id: 'timesheet', label: 'Timesheet', screen: 'Timesheet', icon: '📋' },
      { id: 'reports', label: 'Reports', screen: 'Reports', icon: '📈' },
      { id: 'invoices', label: 'Invoices', screen: 'Invoices', icon: '💰' }
    ]
  },

  'guard-management': {
    id: 'guard-management',
    name: 'Guard Management',
    description: 'Complete security operations management',
    icon: '🛡️',
    color: {
      primary: '#7c3aed',
      secondary: '#a855f7',
      gradient: ['#7c3aed', '#a855f7']
    },
    features: [
      {
        id: 'guard-scheduling',
        name: 'Guard Scheduling',
        description: 'Schedule guards across multiple sites',
        screen: 'Schedule'
      },
      {
        id: 'site-management',
        name: 'Site Management',
        description: 'Manage security sites and locations',
        screen: 'Sites'
      },
      {
        id: 'incident-reporting',
        name: 'Incident Reporting',
        description: 'Report and track security incidents',
        screen: 'Incidents'
      },
      {
        id: 'qr-checkins',
        name: 'QR Code Check-ins',
        description: 'QR code-based site check-ins',
        screen: 'CheckIn'
      },
      {
        id: 'route-planning',
        name: 'Route Planning',
        description: 'Plan and optimize patrol routes',
        screen: 'Routes',
        premium: true
      }
    ],
    navigation: [
      { id: 'dashboard', label: 'Dashboard', screen: 'GuardDashboard', icon: '📊' },
      { id: 'sites', label: 'Sites', screen: 'Sites', icon: '📍' },
      { id: 'guards', label: 'Guards', screen: 'Guards', icon: '🛡️' },
      { id: 'checkin', label: 'Check In', screen: 'CheckIn', icon: '📱', badge: 'QR' },
      { id: 'incidents', label: 'Incidents', screen: 'Incidents', icon: '⚠️' }
    ]
  }
}

// Helper functions
export const getAvailableProducts = (userProducts: string[]): Product[] => {
  return userProducts
    .map(id => PRODUCTS[id as ProductId])
    .filter(product => product !== undefined)
}

export const getPrimaryProduct = (userProducts: string[]): Product | null => {
  if (userProducts.length === 0) return null
  
  // Prioritize based on business logic
  const priority: ProductId[] = ['guard-management', 'workforce-management', 'time-tracker']
  
  for (const productId of priority) {
    if (userProducts.includes(productId)) {
      return PRODUCTS[productId]
    }
  }
  
  return PRODUCTS[userProducts[0] as ProductId] || null
}

export const getProductTheme = (userProducts: string[]) => {
  const primaryProduct = getPrimaryProduct(userProducts)
  
  if (!primaryProduct) {
    return {
      primary: '#3b82f6',
      secondary: '#60a5fa',
      gradient: ['#3b82f6', '#60a5fa']
    }
  }
  
  return primaryProduct.color
}