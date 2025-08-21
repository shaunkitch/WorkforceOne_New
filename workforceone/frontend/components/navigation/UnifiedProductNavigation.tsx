'use client'

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
  
  const products: ProductSection[] = [
    {
      id: 'guard',
      title: '🛡️ Guard Management',
      icon: Shield,
      color: 'purple',
      description: 'Security workforce management',
      items: [
        { name: 'Guard Dashboard', href: '/dashboard/guard', icon: Home },
        { name: 'All Guards', href: '/dashboard/guards', icon: Users, badge: 'Real Data', badgeColor: 'green' },
        { name: 'Onboard Guard', href: '/dashboard/guards/onboard', icon: UserPlus },
        { name: 'QR Invitations', href: '/dashboard/invitations', icon: QrCode, badge: 'Working', badgeColor: 'blue' },
        { name: 'Live Map', href: '/dashboard/security/map', icon: MapPin, badge: 'Live', badgeColor: 'red' },
        { name: 'Patrol Routes', href: '/dashboard/security/routes', icon: Navigation },
        { name: 'Incidents', href: '/dashboard/incidents', icon: AlertTriangle },
        { name: 'Report Incident', href: '/dashboard/incidents/create', icon: FileText },
        { name: 'Sites', href: '/dashboard/sites', icon: Building },
        { name: 'Checkpoints', href: '/dashboard/checkpoints', icon: QrCode },
        { name: 'Operations Center', href: '/dashboard/operations', icon: Radio },
        { name: 'Live Monitoring', href: '/dashboard/monitoring', icon: Eye }
      ]
    },
    {
      id: 'remote',
      title: '🌍 Remote Workforce',
      icon: Globe,
      color: 'blue',
      description: 'Remote team management',
      items: [
        { name: 'Remote Dashboard', href: '/dashboard/remote', icon: Home },
        { name: 'Teams', href: '/dashboard/teams', icon: Users },
        { name: 'Projects', href: '/dashboard/projects', icon: Briefcase },
        { name: 'Tasks', href: '/dashboard/tasks', icon: CheckSquare },
        { name: 'Daily Calls', href: '/dashboard/daily-calls', icon: Video },
        { name: 'Forms', href: '/dashboard/forms', icon: FileText, badge: 'AI', badgeColor: 'purple' },
        { name: 'Form Builder', href: '/dashboard/forms/builder/new', icon: Settings },
        { name: 'Submissions', href: '/dashboard/forms/submissions', icon: FileText },
        { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
        { name: 'Reports', href: '/dashboard/reports', icon: TrendingUp },
        { name: 'Attendance', href: '/dashboard/attendance', icon: Calendar },
        { name: 'Leave Requests', href: '/dashboard/leave', icon: Clock }
      ]
    },
    {
      id: 'time',
      title: '⏰ Time Tracking',
      icon: Timer,
      color: 'green',
      description: 'Time & productivity tracking',
      items: [
        { name: 'Time Dashboard', href: '/dashboard/time', icon: Home },
        { name: 'Time Tracker', href: '/dashboard/time-tracker', icon: Timer },
        { name: 'Timesheets', href: '/dashboard/time-tracker', icon: FileText },
        { name: 'Attendance', href: '/dashboard/attendance', icon: Calendar },
        { name: 'Leave Management', href: '/dashboard/leave', icon: Clock },
        { name: 'Payroll', href: '/dashboard/payroll', icon: DollarSign },
        { name: 'Productivity', href: '/dashboard/analytics/predictive', icon: TrendingUp },
        { name: 'Reports', href: '/dashboard/reports', icon: BarChart3 },
        { name: 'Settings', href: '/dashboard/settings', icon: Settings }
      ]
    }
  ]

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
              <p className="text-xs text-gray-600">Unified Management Platform</p>
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
        
        {/* System Links */}
        <div className="mt-8 pt-4 border-t border-gray-200">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            System
          </h3>
          <div className="space-y-0.5">
            <Link
              href="/dashboard/settings"
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-gray-50 text-gray-600 hover:text-gray-900"
            >
              <Settings className="h-4 w-4" />
              <span className="text-sm">Settings</span>
            </Link>
            <Link
              href="/dashboard/billing"
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-gray-50 text-gray-600 hover:text-gray-900"
            >
              <DollarSign className="h-4 w-4" />
              <span className="text-sm">Billing</span>
            </Link>
            <Link
              href="/dashboard/dev"
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-gray-50 text-gray-600 hover:text-gray-900"
            >
              <Settings className="h-4 w-4" />
              <span className="text-sm">Developer</span>
              <Badge className="bg-gray-100 text-gray-600 text-xs">Dev</Badge>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
}