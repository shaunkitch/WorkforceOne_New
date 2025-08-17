'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  Shield, Users, Building2, CreditCard, BarChart3, 
  Settings, LogOut, Menu, X, AlertTriangle, Bell,
  Search, Globe, Database, Zap, TrendingUp
} from 'lucide-react'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem('global_admin_token')
    if (!token) {
      router.push('/login')
    } else {
      setIsAuthenticated(true)
    }
    setLoading(false)
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem('global_admin_token')
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-admin-600"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  const navigation = [
    { name: 'Overview', href: '/dashboard', icon: BarChart3 },
    { name: 'Organizations', href: '/dashboard/organizations', icon: Building2 },
    { name: 'Users', href: '/dashboard/users', icon: Users },
    { name: 'Subscriptions', href: '/dashboard/subscriptions', icon: CreditCard },
    { name: 'Health Monitor', href: '/dashboard/health', icon: TrendingUp },
    { name: 'AI Incidents', href: '/dashboard/incidents', icon: AlertTriangle },
    { name: 'Analytics', href: '/dashboard/analytics', icon: BarChart3 },
    { name: 'System', href: '/dashboard/system', icon: Database },
  ]

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div 
            className="fixed inset-0 bg-gray-600 bg-opacity-75"
            onClick={() => setSidebarOpen(false)}
          />
        </div>
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 flex flex-col ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-admin-600 rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">WorkforceOne</h1>
              <p className="text-xs text-gray-500">Global Admin</p>
            </div>
          </div>
          <button 
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden"
          >
            <X className="w-6 h-6 text-gray-400" />
          </button>
        </div>

        <nav className="flex-1 mt-6 px-3 overflow-y-auto">
          <div className="space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className="group flex items-center px-3 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-admin-50 hover:text-admin-700 transition-colors"
                >
                  <Icon className="flex-shrink-0 w-5 h-5 mr-3 text-gray-400 group-hover:text-admin-600" />
                  {item.name}
                </Link>
              )
            })}
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="px-3 py-2">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Quick Actions
              </p>
            </div>
            <div className="space-y-1">
              <Link
                href="/dashboard/organizations/create"
                className="group flex items-center px-3 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-50"
              >
                <Building2 className="w-5 h-5 mr-3 text-gray-400" />
                New Organization
              </Link>
              <Link
                href="/dashboard/system/maintenance"
                className="group flex items-center px-3 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-gray-50"
              >
                <Settings className="w-5 h-5 mr-3 text-gray-400" />
                System Settings
              </Link>
            </div>
          </div>
        </nav>

        <div className="p-3 border-t border-gray-200 mt-auto">
          <button
            onClick={handleLogout}
            className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-red-50 hover:text-red-700 transition-colors"
          >
            <LogOut className="w-5 h-5 mr-3" />
            Sign Out
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top header */}
        <header className="bg-white shadow-sm border-b border-gray-200 z-10">
          <div className="flex items-center justify-between h-16 px-6">
            <div className="flex items-center">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden mr-4"
              >
                <Menu className="w-6 h-6 text-gray-400" />
              </button>
              
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search organizations, users..."
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-admin-500 focus:border-admin-500 w-80"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span>System Healthy</span>
              </div>
              
              <button className="relative p-2 text-gray-400 hover:text-gray-600">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>

              <div className="flex items-center space-x-2 px-3 py-1 bg-admin-100 text-admin-800 rounded-lg">
                <Shield className="w-4 h-4" />
                <span className="text-sm font-medium">Global Admin</span>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}