// Product Configuration and Management System
import { 
  Building, Clock, Shield, Users, 
  BarChart3, MapPin, Calendar, Settings,
  Timer, Activity, Monitor, UserPlus,
  Target, CheckCircle, AlertTriangle, Eye
} from 'lucide-react'

export type ProductId = 'workforce-management' | 'time-tracker' | 'guard-management'

export interface Product {
  id: ProductId
  name: string
  description: string
  icon: any
  color: {
    primary: string
    secondary: string
    accent: string
    gradient: string
  }
  features: ProductFeature[]
  navigation: NavigationItem[]
  pricing: ProductPricing
  onboarding: OnboardingFlow
}

export interface ProductFeature {
  id: string
  name: string
  description: string
  icon: any
  available: boolean
  premium: boolean
}

export interface NavigationItem {
  id: string
  label: string
  href: string
  icon: any
  badge?: string
  children?: NavigationItem[]
}

export interface ProductPricing {
  free: boolean
  monthlyPrice: number
  yearlyPrice: number
  features: string[]
  limits: Record<string, number | string>
}

export interface OnboardingFlow {
  steps: OnboardingStep[]
  completionRoute: string
}

export interface OnboardingStep {
  id: string
  title: string
  description: string
  component: string
  required: boolean
}

// Product Definitions
export const PRODUCTS: Record<ProductId, Product> = {
  'workforce-management': {
    id: 'workforce-management',
    name: 'Workforce Management',
    description: 'Complete workforce management solution for organizations',
    icon: Building,
    color: {
      primary: '#059669', // green-600
      secondary: '#10b981', // green-500  
      accent: '#065f46', // green-800
      gradient: 'from-green-50 to-blue-100'
    },
    features: [
      {
        id: 'organizations',
        name: 'Multi-tenant Organizations',
        description: 'Manage multiple organizations and teams',
        icon: Building,
        available: true,
        premium: false
      },
      {
        id: 'analytics',
        name: 'Advanced Analytics',
        description: 'Comprehensive reporting and insights',
        icon: BarChart3,
        available: true,
        premium: true
      },
      {
        id: 'projects',
        name: 'Project Management',
        description: 'Track projects and deliverables',
        icon: Target,
        available: true,
        premium: false
      },
      {
        id: 'payroll',
        name: 'Payroll Integration',
        description: 'Integrated payroll processing',
        icon: Users,
        available: true,
        premium: true
      }
    ],
    navigation: [
      {
        id: 'dashboard',
        label: 'Dashboard',
        href: '/dashboard',
        icon: BarChart3
      },
      {
        id: 'organizations',
        label: 'Organizations',
        href: '/organizations',
        icon: Building
      },
      {
        id: 'projects',
        label: 'Projects',
        href: '/projects',
        icon: Target
      },
      {
        id: 'analytics',
        label: 'Analytics',
        href: '/analytics',
        icon: BarChart3
      },
      {
        id: 'settings',
        label: 'Settings',
        href: '/settings',
        icon: Settings
      }
    ],
    pricing: {
      free: true,
      monthlyPrice: 29,
      yearlyPrice: 290,
      features: ['Up to 50 employees', 'Basic reporting', '24/7 support'],
      limits: {
        employees: 50,
        projects: 10,
        storage: '10GB'
      }
    },
    onboarding: {
      steps: [
        {
          id: 'organization',
          title: 'Setup Organization',
          description: 'Create your organization profile',
          component: 'OrganizationSetup',
          required: true
        },
        {
          id: 'team',
          title: 'Add Team Members',
          description: 'Invite your team to the platform',
          component: 'TeamSetup',
          required: false
        }
      ],
      completionRoute: '/dashboard'
    }
  },

  'time-tracker': {
    id: 'time-tracker',
    name: 'Time Tracker',
    description: 'Advanced time tracking and productivity monitoring',
    icon: Timer,
    color: {
      primary: '#2563eb', // blue-600
      secondary: '#3b82f6', // blue-500
      accent: '#1d4ed8', // blue-700  
      gradient: 'from-blue-50 to-indigo-100'
    },
    features: [
      {
        id: 'time-tracking',
        name: 'Real-time Tracking',
        description: 'Track time with precision',
        icon: Clock,
        available: true,
        premium: false
      },
      {
        id: 'gps-verification',
        name: 'GPS Verification',
        description: 'Location-based time tracking',
        icon: MapPin,
        available: true,
        premium: true
      },
      {
        id: 'automated-reports',
        name: 'Automated Reports',
        description: 'Generate timesheets automatically',
        icon: CheckCircle,
        available: true,
        premium: false
      },
      {
        id: 'productivity-analytics',
        name: 'Productivity Analytics',
        description: 'Detailed productivity insights',
        icon: BarChart3,
        available: true,
        premium: true
      }
    ],
    navigation: [
      {
        id: 'timer',
        label: 'Timer',
        href: '/timer',
        icon: Timer
      },
      {
        id: 'timesheet',
        label: 'Timesheet',
        href: '/timesheet',
        icon: Calendar
      },
      {
        id: 'projects',
        label: 'Projects',
        href: '/projects',
        icon: Target
      },
      {
        id: 'reports',
        label: 'Reports',
        href: '/reports',
        icon: BarChart3
      }
    ],
    pricing: {
      free: true,
      monthlyPrice: 9,
      yearlyPrice: 90,
      features: ['Unlimited time tracking', 'Basic reports', 'Mobile app'],
      limits: {
        projects: 5,
        team_members: 10,
        storage: '1GB'
      }
    },
    onboarding: {
      steps: [
        {
          id: 'timer-setup',
          title: 'Setup Timer',
          description: 'Configure your time tracking preferences',
          component: 'TimerSetup',
          required: true
        },
        {
          id: 'projects',
          title: 'Add Projects',
          description: 'Create projects to track time against',
          component: 'ProjectSetup',
          required: false
        }
      ],
      completionRoute: '/timer'
    }
  },

  'guard-management': {
    id: 'guard-management',
    name: 'Guard Management',
    description: 'Professional security guard management system',
    icon: Shield,
    color: {
      primary: '#7c3aed', // purple-600
      secondary: '#8b5cf6', // purple-500
      accent: '#6d28d9', // purple-700
      gradient: 'from-purple-50 to-indigo-100'
    },
    features: [
      {
        id: 'guard-onboarding',
        name: 'QR Code Onboarding',
        description: 'Streamlined guard invitation system',
        icon: UserPlus,
        available: true,
        premium: false
      },
      {
        id: 'site-management',
        name: 'Site Management',
        description: 'Manage security sites and assignments',
        icon: Building,
        available: true,
        premium: false
      },
      {
        id: 'real-time-monitoring',
        name: 'Real-time Monitoring',
        description: 'Live guard tracking and monitoring',
        icon: Monitor,
        available: true,
        premium: true
      },
      {
        id: 'incident-management',
        name: 'Incident Management',
        description: 'Track and manage security incidents',
        icon: AlertTriangle,
        available: true,
        premium: true
      }
    ],
    navigation: [
      {
        id: 'dashboard',
        label: 'Dashboard',
        href: '/dashboard',
        icon: Shield
      },
      {
        id: 'guards',
        label: 'Guards',
        href: '/guards',
        icon: Users
      },
      {
        id: 'invitations',
        label: 'Invitations',
        href: '/invitations',
        icon: UserPlus
      },
      {
        id: 'sites',
        label: 'Sites',
        href: '/sites',
        icon: Building
      },
      {
        id: 'operations',
        label: 'Operations',
        href: '/operations',
        icon: Activity
      },
      {
        id: 'monitoring',
        label: 'Monitoring',
        href: '/monitoring',
        icon: Monitor
      },
      {
        id: 'incidents',
        label: 'Incidents',
        href: '/incidents',
        icon: AlertTriangle
      }
    ],
    pricing: {
      free: false,
      monthlyPrice: 49,
      yearlyPrice: 490,
      features: ['Unlimited guards', 'Real-time tracking', 'Incident management', 'QR onboarding'],
      limits: {
        guards: 'unlimited',
        sites: 'unlimited',
        storage: '50GB'
      }
    },
    onboarding: {
      steps: [
        {
          id: 'security-setup',
          title: 'Security Setup',
          description: 'Configure security preferences',
          component: 'SecuritySetup',
          required: true
        },
        {
          id: 'sites',
          title: 'Add Sites',
          description: 'Add your security sites',
          component: 'SiteSetup',
          required: false
        },
        {
          id: 'guards',
          title: 'Invite Guards',
          description: 'Send QR invitations to your guards',
          component: 'GuardInvitation',
          required: false
        }
      ],
      completionRoute: '/dashboard'
    }
  }
}

// Product Access Control
export function hasProductAccess(userProducts: string[], productId: ProductId): boolean {
  return userProducts.includes(productId)
}

export function getAvailableProducts(userProducts: string[]): Product[] {
  return Object.values(PRODUCTS).filter(product => 
    hasProductAccess(userProducts, product.id)
  )
}

export function getProductNavigation(userProducts: string[]): NavigationItem[] {
  const availableProducts = getAvailableProducts(userProducts)
  
  // Merge navigation from all available products
  const navigation: NavigationItem[] = []
  
  availableProducts.forEach(product => {
    const productNav = product.navigation.map(item => ({
      ...item,
      href: `/${product.id}${item.href}`, // Prefix with product ID
      productId: product.id
    }))
    navigation.push(...productNav)
  })
  
  return navigation
}

export function getPrimaryProduct(userProducts: string[]): Product | null {
  // Priority order: workforce-management > guard-management > time-tracker
  const priority: ProductId[] = ['workforce-management', 'guard-management', 'time-tracker']
  
  for (const productId of priority) {
    if (hasProductAccess(userProducts, productId)) {
      return PRODUCTS[productId]
    }
  }
  
  return null
}

export function getProductTheme(userProducts: string[]) {
  const primaryProduct = getPrimaryProduct(userProducts)
  return primaryProduct?.color || PRODUCTS['workforce-management'].color
}

// QR Code Generation for Product Invitations
export function generateProductInvitationQR(
  invitationCode: string,
  products: ProductId[],
  metadata: Record<string, any> = {}
): string {
  const qrData = {
    type: 'PRODUCT_INVITATION',
    code: invitationCode,
    products,
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
    ...metadata
  }
  
  return `WORKFORCE_INVITE:${JSON.stringify(qrData)}`
}