'use client'

import Link from 'next/link'
import { 
  Shield, Users, FileText, Clock, MapPin, QrCode, 
  Settings, BarChart3, Navigation, AlertTriangle,
  Package, Timer, Briefcase, Home
} from 'lucide-react'

// Quick Navigation Index for all working dashboard features
// This file provides easy access to all production-ready components

export const DashboardIndex = {
  // ✅ PRODUCTION READY - Real Data Integration
  production: [
    {
      title: 'Guard Management',
      path: '/dashboard/guard',
      icon: Shield,
      description: 'Real-time guard management with database integration',
      status: 'production'
    },
    {
      title: 'Security Dashboard',
      path: '/dashboard/security',
      icon: AlertTriangle,
      description: 'Live security operations and monitoring',
      status: 'production'
    },
    {
      title: 'Security Map',
      path: '/dashboard/security/map',
      icon: MapPin,
      description: 'Real-time guard location tracking',
      status: 'production'
    },
    {
      title: 'QR Invitations',
      path: '/dashboard/settings/invitations',
      icon: QrCode,
      description: 'QR code generation for guard invitations',
      status: 'production'
    }
  ],

  // 🔧 FUNCTIONAL - Working but may need enhancement
  functional: [
    {
      title: 'Forms System',
      path: '/dashboard/forms',
      icon: FileText,
      description: 'Dynamic form builder and submissions'
    },
    {
      title: 'Teams',
      path: '/dashboard/teams',
      icon: Users,
      description: 'Team management and assignments'
    },
    {
      title: 'Projects',
      path: '/dashboard/projects',
      icon: Briefcase,
      description: 'Project tracking and management'
    },
    {
      title: 'Time Tracker',
      path: '/dashboard/time-tracker',
      icon: Timer,
      description: 'Time tracking and timesheets'
    },
    {
      title: 'Attendance',
      path: '/dashboard/attendance',
      icon: Clock,
      description: 'Attendance tracking and management'
    },
    {
      title: 'Routes',
      path: '/dashboard/routes',
      icon: Navigation,
      description: 'Route planning and optimization'
    }
  ],

  // 📊 Analytics & Reports
  analytics: [
    {
      title: 'Analytics',
      path: '/dashboard/analytics',
      icon: BarChart3,
      description: 'Business analytics and insights'
    },
    {
      title: 'Reports',
      path: '/dashboard/reports',
      icon: FileText,
      description: 'Report generation and viewing'
    }
  ],

  // ⚙️ Configuration
  settings: [
    {
      title: 'Settings',
      path: '/dashboard/settings',
      icon: Settings,
      description: 'System configuration'
    },
    {
      title: 'Feature Flags',
      path: '/dashboard/settings/features',
      icon: Package,
      description: 'Enable/disable features'
    }
  ]
}

// Component paths for direct import
export const ComponentPaths = {
  // QR & Invitations
  ProductInvitationQR: '@/components/mobile/ProductInvitationQR',
  
  // Security Components
  QRCodeGenerator: '@/components/security/QRCodeGenerator',
  SecurityMap: '@/components/security/SecurityMap',
  RouteManagementMap: '@/components/security/RouteManagementMap',
  
  // Navigation
  ProductNavigation: '@/components/navigation/ProductNavigation',
  ProductSwitcher: '@/components/navigation/ProductSwitcher',
  
  // Guards
  RequireProduct: '@/components/guards/RequireProduct',
  
  // Billing
  SubscriptionManager: '@/components/billing/SubscriptionManager',
  UsageTracker: '@/components/billing/UsageTracker'
}

// Quick navigation component for development
export function DashboardQuickNav() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
      <div>
        <h3 className="font-bold text-green-600 mb-2">✅ Production Ready</h3>
        {DashboardIndex.production.map(item => (
          <Link 
            key={item.path} 
            href={item.path}
            className="block p-2 hover:bg-gray-100 rounded"
          >
            <div className="flex items-center gap-2">
              <item.icon className="h-4 w-4" />
              <span>{item.title}</span>
            </div>
          </Link>
        ))}
      </div>
      
      <div>
        <h3 className="font-bold text-blue-600 mb-2">🔧 Functional</h3>
        {DashboardIndex.functional.map(item => (
          <Link 
            key={item.path} 
            href={item.path}
            className="block p-2 hover:bg-gray-100 rounded"
          >
            <div className="flex items-center gap-2">
              <item.icon className="h-4 w-4" />
              <span>{item.title}</span>
            </div>
          </Link>
        ))}
      </div>
      
      <div>
        <h3 className="font-bold text-gray-600 mb-2">⚙️ Settings</h3>
        {DashboardIndex.settings.map(item => (
          <Link 
            key={item.path} 
            href={item.path}
            className="block p-2 hover:bg-gray-100 rounded"
          >
            <div className="flex items-center gap-2">
              <item.icon className="h-4 w-4" />
              <span>{item.title}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}