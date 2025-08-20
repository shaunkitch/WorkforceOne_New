'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Shield, Users, MapPin, AlertTriangle, Target, Home, Settings, ShieldCheck, Building, Activity, Monitor, UserPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

const navItems = [
  {
    title: 'Dashboard',
    href: '/',
    icon: Home
  },
  {
    title: 'Guards',
    href: '/guards',
    icon: Users
  },
  {
    title: 'Invitations',
    href: '/invitations',
    icon: UserPlus
  },
  {
    title: 'Sites',
    href: '/sites',
    icon: Building
  },
  {
    title: 'Operations',
    href: '/operations',
    icon: Activity
  },
  {
    title: 'Monitoring',
    href: '/monitoring',
    icon: Monitor
  },
  {
    title: 'Security',
    href: '/security',
    icon: Shield
  },
  {
    title: 'Incidents',
    href: '/incidents',
    icon: AlertTriangle
  },
  {
    title: 'Settings',
    href: '/settings',
    icon: Settings
  }
]

export default function Navbar() {
  const pathname = usePathname()

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <div className="h-10 w-10 bg-purple-600 rounded-lg flex items-center justify-center">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <h1 className="text-2xl font-bold text-gray-900">WorkforceOne Guard</h1>
                <p className="text-sm text-gray-600">Security Management System</p>
              </div>
            </Link>
          </div>

          <nav className="hidden md:flex space-x-8">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors",
                    isActive
                      ? "bg-purple-100 text-purple-700"
                      : "text-gray-600 hover:text-purple-600 hover:bg-purple-50"
                  )}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {item.title}
                </Link>
              )
            })}
          </nav>

          <Badge className="bg-purple-600 text-lg px-4 py-2">
            <ShieldCheck className="h-4 w-4 mr-2" />
            Guard
          </Badge>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden pb-4">
          <div className="grid grid-cols-3 gap-2">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex flex-col items-center px-2 py-3 rounded-md text-xs font-medium transition-colors",
                    isActive
                      ? "bg-purple-100 text-purple-700"
                      : "text-gray-600 hover:text-purple-600 hover:bg-purple-50"
                  )}
                >
                  <Icon className="h-5 w-5 mb-1" />
                  {item.title}
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </header>
  )
}