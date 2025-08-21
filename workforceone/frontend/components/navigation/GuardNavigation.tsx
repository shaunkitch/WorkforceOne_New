'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  Shield, Users, AlertTriangle, MapPin, QrCode, 
  Eye, Radio, Bell, Camera, FileText, Settings,
  Home, UserPlus, Navigation, Building
} from 'lucide-react'
import { cn } from '@/lib/utils'

export function GuardNavigation() {
  const pathname = usePathname()
  
  const guardMenuItems = [
    {
      title: 'Dashboard',
      items: [
        { 
          name: 'Guard Overview', 
          href: '/dashboard/guard', 
          icon: Home,
          description: 'Main guard dashboard'
        },
        { 
          name: 'Operations Center', 
          href: '/dashboard/operations', 
          icon: Radio,
          description: 'Command center'
        },
        { 
          name: 'Live Monitoring', 
          href: '/dashboard/monitoring', 
          icon: Eye,
          description: 'Real-time surveillance'
        }
      ]
    },
    {
      title: 'Guard Management',
      items: [
        { 
          name: 'All Guards', 
          href: '/dashboard/guards', 
          icon: Users,
          description: 'View all guards'
        },
        { 
          name: 'Onboard Guard', 
          href: '/dashboard/guards/onboard', 
          icon: UserPlus,
          description: 'Add new guard'
        },
        { 
          name: 'QR Invitations', 
          href: '/dashboard/invitations', 
          icon: QrCode,
          description: 'Invite via QR code'
        }
      ]
    },
    {
      title: 'Security Operations',
      items: [
        { 
          name: 'Security Dashboard', 
          href: '/dashboard/security', 
          icon: Shield,
          description: 'Security overview'
        },
        { 
          name: 'Live Map', 
          href: '/dashboard/security/map', 
          icon: MapPin,
          description: 'Guard locations'
        },
        { 
          name: 'Patrol Routes', 
          href: '/dashboard/security/routes', 
          icon: Navigation,
          description: 'Route management'
        }
      ]
    },
    {
      title: 'Incidents & Sites',
      items: [
        { 
          name: 'Incidents', 
          href: '/dashboard/incidents', 
          icon: AlertTriangle,
          description: 'View incidents'
        },
        { 
          name: 'Report Incident', 
          href: '/dashboard/incidents/create', 
          icon: FileText,
          description: 'Create new incident'
        },
        { 
          name: 'Sites', 
          href: '/dashboard/sites', 
          icon: Building,
          description: 'Manage sites'
        },
        { 
          name: 'Checkpoints', 
          href: '/dashboard/checkpoints', 
          icon: QrCode,
          description: 'QR checkpoints'
        }
      ]
    }
  ]

  return (
    <nav className="w-64 bg-white border-r border-gray-200 h-full overflow-y-auto">
      <div className="p-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Shield className="h-5 w-5 mr-2 text-purple-600" />
          Guard System
        </h2>
        
        {guardMenuItems.map((section) => (
          <div key={section.title} className="mb-6">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              {section.title}
            </h3>
            <div className="space-y-1">
              {section.items.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href
                
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
                      "hover:bg-gray-100",
                      isActive && "bg-purple-50 text-purple-600"
                    )}
                  >
                    <Icon className={cn(
                      "h-4 w-4",
                      isActive ? "text-purple-600" : "text-gray-500"
                    )} />
                    <div className="flex-1">
                      <div className={cn(
                        "text-sm font-medium",
                        isActive ? "text-purple-600" : "text-gray-700"
                      )}>
                        {item.name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {item.description}
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </nav>
  )
}

// Quick access card for dashboard
export function GuardQuickAccess() {
  const quickLinks = [
    { name: 'Guards List', href: '/dashboard/guards', icon: Users },
    { name: 'Live Map', href: '/dashboard/security/map', icon: MapPin },
    { name: 'Incidents', href: '/dashboard/incidents', icon: AlertTriangle },
    { name: 'QR Invites', href: '/dashboard/invitations', icon: QrCode }
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {quickLinks.map((link) => {
        const Icon = link.icon
        return (
          <Link
            key={link.href}
            href={link.href}
            className="p-4 bg-white rounded-lg border border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-all"
          >
            <Icon className="h-6 w-6 text-purple-600 mb-2" />
            <div className="text-sm font-medium text-gray-900">{link.name}</div>
          </Link>
        )
      })}
    </div>
  )
}