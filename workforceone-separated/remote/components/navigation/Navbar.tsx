'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Users, CheckSquare, Navigation, Building, Home, Settings } from 'lucide-react'
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
    title: 'Teams',
    href: '/teams',
    icon: Users
  },
  {
    title: 'Tasks',
    href: '/tasks',
    icon: CheckSquare
  },
  {
    title: 'Routes',
    href: '/routes',
    icon: Navigation
  },
  {
    title: 'Locations',
    href: '/locations',
    icon: Building
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
              <div className="h-10 w-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div className="ml-4">
                <h1 className="text-2xl font-bold text-gray-900">WorkforceOne Remote</h1>
                <p className="text-sm text-gray-600">Remote Workforce Management</p>
              </div>
            </Link>
          </div>

          <nav className="hidden md:flex space-x-8">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors",
                    isActive
                      ? "bg-blue-100 text-blue-700"
                      : "text-gray-600 hover:text-blue-600 hover:bg-blue-50"
                  )}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {item.title}
                </Link>
              )
            })}
          </nav>

          <Badge className="bg-blue-600 text-lg px-4 py-2">
            <Users className="h-4 w-4 mr-2" />
            Remote
          </Badge>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden pb-4">
          <div className="grid grid-cols-3 gap-2">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex flex-col items-center px-2 py-3 rounded-md text-xs font-medium transition-colors",
                    isActive
                      ? "bg-blue-100 text-blue-700"
                      : "text-gray-600 hover:text-blue-600 hover:bg-blue-50"
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