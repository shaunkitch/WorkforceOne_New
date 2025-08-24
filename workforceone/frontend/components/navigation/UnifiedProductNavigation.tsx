'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  Shield, Users, AlertTriangle, MapPin, QrCode, Eye, Radio, 
  FileText, Settings, Home, UserPlus, Navigation, 
  Building, Clock, Timer, Calendar, TrendingUp, DollarSign,
  Briefcase, CheckSquare, BarChart3, Globe,
  Video, Package
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { getCurrentUserProfile, hasWebPortalAccess, hasProductAccess, getIncidentsAccess, getGuardsAccess, UserProfile } from '@/lib/rbac'

interface MenuItem {
  name: string
  href: string
  icon: any
  badge?: string
  badgeColor?: string
}

interface ProductSection {
  id: string
  title: string
  icon: any
  color: string
  description: string
  items: MenuItem[]
}

export function UnifiedProductNavigation() {
  const pathname = usePathname()
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadUserProfile = async () => {
      try {
        const profile = await getCurrentUserProfile()
        setUserProfile(profile)
      } catch (error) {
        console.error('Error loading user profile for navigation:', error)
      } finally {
        setLoading(false)
      }
    }

    loadUserProfile()
  }, [])

  // If loading or no profile, show minimal navigation
  if (loading || !userProfile) {
    return (
      <nav className="w-72 bg-white border-r border-gray-200 h-screen overflow-y-auto">
        <div className="p-4">
          <div className="flex items-center gap-2 p-3 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200">
            <Package className="h-6 w-6 text-purple-600" />
            <div>
              <h1 className="text-lg font-bold text-gray-900">WorkforceOne</h1>
              <p className="text-xs text-gray-600">Loading...</p>
            </div>
          </div>
        </div>
      </nav>
    )
  }

  // Filter navigation based on role and permissions
  const getFilteredProducts = (): ProductSection[] => {
    const products: ProductSection[] = []

    // Guard Management - Only if user has access to guard-management product
    if (hasProductAccess(userProfile, 'guard-management')) {
      const guardItems: MenuItem[] = [
        { name: 'Guard Dashboard', href: '/dashboard/guard', icon: Home }
      ]

      // Add management items based on guards access level
      const guardsAccess = getGuardsAccess(userProfile)
      if (guardsAccess === 'manage') {
        guardItems.push(
          { name: 'All Guards', href: '/dashboard/guards', icon: Users, badge: 'Real Data', badgeColor: 'green' },
          { name: 'Onboard Guard', href: '/dashboard/guards/onboard', icon: UserPlus },
          { name: 'QR Invitations', href: '/dashboard/invitations', icon: QrCode, badge: 'Working', badgeColor: 'blue' }
        )
      } else if (guardsAccess === 'view') {
        guardItems.push(
          { name: 'View Guards', href: '/dashboard/guards', icon: Users }
        )
      }

      // Add incident access based on level
      const incidentsAccess = getIncidentsAccess(userProfile)
      if (incidentsAccess !== 'none') {
        guardItems.push(
          { name: 'Incidents', href: '/dashboard/incidents', icon: AlertTriangle }
        )
        if (incidentsAccess === 'all' && hasWebPortalAccess(userProfile, 'userManagement')) {
          guardItems.push(
            { name: 'Report Incident', href: '/dashboard/incidents/create', icon: FileText }
          )
        }
      }

      // Add other guard management items for managers and above
      if (userProfile.permissions.canViewAllData) {
        guardItems.push(
          { name: 'Live Map', href: '/dashboard/security/map', icon: MapPin, badge: 'Live', badgeColor: 'red' },
          { name: 'Patrol Routes', href: '/dashboard/security/routes', icon: Navigation },
          { name: 'Sites', href: '/dashboard/sites', icon: Building },
          { name: 'Checkpoints', href: '/dashboard/checkpoints', icon: QrCode }
        )
      }

      // Operations center for supervisors and above
      if (userProfile.role !== 'guard' && userProfile.role !== 'employee') {
        guardItems.push(
          { name: 'Operations Center', href: '/dashboard/operations', icon: Radio },
          { name: 'Live Monitoring', href: '/dashboard/monitoring', icon: Eye }
        )
      }

      products.push({
        id: 'guard',
        title: '🛡️ Guard Management',
        icon: Shield,
        color: 'purple',
        description: 'Security workforce management',
        items: guardItems
      })
    }

    // Remote Workforce - Only if user has access to workforce-management product
    if (hasProductAccess(userProfile, 'workforce-management')) {
      const remoteItems: MenuItem[] = [
        { name: 'Remote Dashboard', href: '/dashboard/remote', icon: Home }
      ]

      // Add management items based on permissions
      if (hasWebPortalAccess(userProfile, 'userManagement')) {
        remoteItems.push(
          { name: 'Teams', href: '/dashboard/teams', icon: Users },
          { name: 'Projects', href: '/dashboard/projects', icon: Briefcase },
          { name: 'Tasks', href: '/dashboard/tasks', icon: CheckSquare }
        )
      }

      // Add communication tools for supervisors and above
      if (userProfile.role !== 'employee') {
        remoteItems.push(
          { name: 'Daily Calls', href: '/dashboard/daily-calls', icon: Video }
        )
      }

      // Forms access
      remoteItems.push(
        { name: 'Forms', href: '/dashboard/forms', icon: FileText, badge: 'AI', badgeColor: 'purple' },
        { name: 'Submissions', href: '/dashboard/forms/submissions', icon: FileText }
      )

      if (hasWebPortalAccess(userProfile, 'settings')) {
        remoteItems.push(
          { name: 'Form Builder', href: '/dashboard/forms/builder/new', icon: Settings }
        )
      }

      // Analytics and reports for managers and above
      if (hasWebPortalAccess(userProfile, 'analytics')) {
        remoteItems.push(
          { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 }
        )
      }

      if (hasWebPortalAccess(userProfile, 'reports')) {
        remoteItems.push(
          { name: 'Reports', href: '/dashboard/reports', icon: TrendingUp }
        )
      }

      // Attendance and leave
      remoteItems.push(
        { name: 'Attendance', href: '/dashboard/attendance', icon: Calendar },
        { name: 'Leave Requests', href: '/dashboard/leave', icon: Clock }
      )

      products.push({
        id: 'remote',
        title: '🌍 Remote Workforce',
        icon: Globe,
        color: 'blue',
        description: 'Remote team management',
        items: remoteItems
      })
    }

    // Time Tracking - Only if user has access to time-tracker product
    if (hasProductAccess(userProfile, 'time-tracker')) {
      const timeItems: MenuItem[] = [
        { name: 'Time Dashboard', href: '/dashboard/time', icon: Home },
        { name: 'Time Tracker', href: '/dashboard/time-tracker', icon: Timer }
      ]

      // Basic time tracking items for all users with time-tracker access
      timeItems.push(
        { name: 'Timesheets', href: '/dashboard/time/timesheets', icon: FileText },
        { name: 'Attendance', href: '/dashboard/attendance', icon: Calendar },
        { name: 'Leave Management', href: '/dashboard/leave', icon: Clock }
      )

      // Management features for supervisors and above
      if (userProfile.role !== 'employee' && userProfile.role !== 'guard') {
        timeItems.push(
          { name: 'Payroll', href: '/dashboard/payroll', icon: DollarSign }
        )
      }

      // Advanced analytics for managers and above
      if (hasWebPortalAccess(userProfile, 'analytics')) {
        timeItems.push(
          { name: 'Productivity', href: '/dashboard/analytics/predictive', icon: TrendingUp }
        )
      }

      if (hasWebPortalAccess(userProfile, 'reports')) {
        timeItems.push(
          { name: 'Reports', href: '/dashboard/reports', icon: BarChart3 }
        )
      }

      if (hasWebPortalAccess(userProfile, 'settings')) {
        timeItems.push(
          { name: 'Settings', href: '/dashboard/settings', icon: Settings }
        )
      }

      products.push({
        id: 'time',
        title: '⏰ Time Tracking',
        icon: Timer,
        color: 'green',
        description: 'Time & productivity tracking',
        items: timeItems
      })
    }

    return products
  }

  const products = getFilteredProducts()

  // Get filtered system links based on role
  const getSystemLinks = () => {
    const links = []

    if (hasWebPortalAccess(userProfile, 'settings')) {
      links.push({
        name: 'Settings',
        href: '/dashboard/settings',
        icon: Settings
      })
    }

    if (hasWebPortalAccess(userProfile, 'billing')) {
      links.push({
        name: 'Billing',
        href: '/dashboard/billing',
        icon: DollarSign
      })
    }

    // Developer tools for super admins only
    if (userProfile.role === 'super_admin') {
      links.push({
        name: 'Developer',
        href: '/dashboard/dev',
        icon: Settings,
        badge: 'Dev'
      })
    }

    return links
  }

  const systemLinks = getSystemLinks()

  const getColorClasses = (color: string, isActive: boolean) => {
    const colors: Record<string, any> = {
      purple: {
        bg: isActive ? 'bg-purple-50' : 'hover:bg-purple-50',
        text: isActive ? 'text-purple-600' : 'text-gray-700 hover:text-purple-600',
        icon: isActive ? 'text-purple-600' : 'text-gray-500',
        border: 'border-purple-200'
      },
      blue: {
        bg: isActive ? 'bg-blue-50' : 'hover:bg-blue-50',
        text: isActive ? 'text-blue-600' : 'text-gray-700 hover:text-blue-600',
        icon: isActive ? 'text-blue-600' : 'text-gray-500',
        border: 'border-blue-200'
      },
      green: {
        bg: isActive ? 'bg-green-50' : 'hover:bg-green-50',
        text: isActive ? 'text-green-600' : 'text-gray-700 hover:text-green-600',
        icon: isActive ? 'text-green-600' : 'text-gray-500',
        border: 'border-green-200'
      }
    }
    return colors[color] || colors.purple
  }

  const getBadgeColor = (color?: string) => {
    const colors = {
      green: 'bg-green-100 text-green-800',
      blue: 'bg-blue-100 text-blue-800',
      red: 'bg-red-100 text-red-800',
      purple: 'bg-purple-100 text-purple-800'
    }
    return colors[color as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  return (
    <nav className="w-72 bg-white border-r border-gray-200 h-screen overflow-y-auto">
      <div className="p-4">
        <Link href="/dashboard" className="block mb-6">
          <div className="flex items-center gap-2 p-3 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200">
            <Package className="h-6 w-6 text-purple-600" />
            <div>
              <h1 className="text-lg font-bold text-gray-900">WorkforceOne</h1>
              <p className="text-xs text-gray-600">
                {userProfile.role.replace('_', ' ').toUpperCase()} Portal
              </p>
            </div>
          </div>
        </Link>
        
        {products.map((product) => {
          const ProductIcon = product.icon
          const isProductActive = pathname.startsWith(`/dashboard/${product.id}`) || 
                                 product.items.some(item => pathname === item.href)
          
          return (
            <div key={product.id} className="mb-8">
              <div className={cn(
                "flex items-center gap-2 mb-3 p-2 rounded-lg",
                getColorClasses(product.color, isProductActive).bg
              )}>
                <ProductIcon className={cn(
                  "h-5 w-5",
                  getColorClasses(product.color, isProductActive).icon
                )} />
                <div className="flex-1">
                  <h2 className={cn(
                    "text-sm font-semibold",
                    getColorClasses(product.color, isProductActive).text
                  )}>
                    {product.title}
                  </h2>
                  <p className="text-xs text-gray-500">{product.description}</p>
                </div>
              </div>
              
              <div className="ml-2 space-y-0.5">
                {product.items.map((item) => {
                  const ItemIcon = item.icon
                  const isActive = pathname === item.href
                  const colorClasses = getColorClasses(product.color, isActive)
                  
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all",
                        colorClasses.bg,
                        "group"
                      )}
                    >
                      <ItemIcon className={cn(
                        "h-4 w-4 transition-colors",
                        colorClasses.icon,
                        "group-hover:" + colorClasses.icon
                      )} />
                      <span className={cn(
                        "text-sm flex-1 transition-colors",
                        colorClasses.text
                      )}>
                        {item.name}
                      </span>
                      {item.badge && (
                        <Badge className={cn(
                          "text-xs px-1.5 py-0",
                          getBadgeColor(item.badgeColor)
                        )}>
                          {item.badge}
                        </Badge>
                      )}
                    </Link>
                  )
                })}
              </div>
            </div>
          )
        })}
        
        {/* System Links - Only show if user has appropriate permissions */}
        {systemLinks.length > 0 && (
          <div className="mt-8 pt-4 border-t border-gray-200">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              System
            </h3>
            <div className="space-y-0.5">
              {systemLinks.map((link) => {
                const LinkIcon = link.icon
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-gray-50 text-gray-600 hover:text-gray-900"
                  >
                    <LinkIcon className="h-4 w-4" />
                    <span className="text-sm flex-1">{link.name}</span>
                    {link.badge && (
                      <Badge className="bg-gray-100 text-gray-600 text-xs">{link.badge}</Badge>
                    )}
                  </Link>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}