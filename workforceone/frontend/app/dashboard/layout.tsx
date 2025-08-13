// ===================================
// app/dashboard/layout.tsx - Modern Dashboard Layout
// ===================================
'use client'

import { useState, useEffect, Fragment } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useFeatureFlags } from '@/components/feature-flags-provider'
import { Dialog, Transition, Menu as HeadlessMenu } from '@headlessui/react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Home, Clock, Calendar, Users, Briefcase, CheckSquare,
  FileText, Settings, LogOut, Menu, X, ChevronDown,
  ClipboardList, MapPin, Building, Bell, Search,
  User, UserCheck, Zap
} from 'lucide-react'
import NotificationSystem from '@/components/notifications/NotificationSystem'

// Navigation arrays with modern icons and descriptions
const allNavigation = [
  { 
    name: 'Dashboard', 
    href: '/dashboard', 
    icon: Home, 
    feature: 'dashboard',
    description: 'Overview and quick stats'
  },
  { 
    name: 'Time Tracking', 
    href: '/dashboard/time', 
    icon: Clock, 
    feature: 'time_tracking',
    description: 'Track work hours and productivity'
  },
  { 
    name: 'Attendance', 
    href: '/dashboard/attendance', 
    icon: Calendar, 
    feature: 'attendance',
    description: 'Check-in and attendance records'
  },
  { 
    name: 'Attendance Management', 
    href: '/dashboard/attendance/manage', 
    icon: UserCheck, 
    feature: 'attendance',
    requiresRole: ['admin', 'manager'],
    description: 'Monitor team attendance and send reminders'
  },
  { 
    name: 'Team Map', 
    href: '/dashboard/maps', 
    icon: MapPin, 
    feature: 'maps',
    description: 'Real-time team locations'
  },
  { 
    name: 'Outlets', 
    href: '/dashboard/outlets', 
    icon: Building, 
    feature: 'outlets',
    description: 'Manage office locations'
  },
  { 
    name: 'Teams', 
    href: '/dashboard/teams', 
    icon: Users, 
    feature: 'teams',
    description: 'Team management and structure'
  },
  { 
    name: 'Projects', 
    href: '/dashboard/projects', 
    icon: Briefcase, 
    feature: 'projects',
    description: 'Project tracking and management'
  },
  { 
    name: 'Tasks', 
    href: '/dashboard/tasks', 
    icon: CheckSquare, 
    feature: 'tasks',
    description: 'Task assignments and progress'
  },
  { 
    name: 'Forms', 
    href: '/dashboard/forms', 
    icon: ClipboardList, 
    feature: 'forms',
    description: 'Dynamic form builder and responses'
  },
  { 
    name: 'Leave Requests', 
    href: '/dashboard/leave', 
    icon: FileText, 
    feature: 'leave',
    description: 'Time off requests and approvals'
  },
]

// Advanced features navigation
const advancedNavigation = [
  {
    name: 'Automation',
    href: '/dashboard/automation',
    icon: ({ className }: { className?: string }) => (
      <svg className={className} fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2L2 7v10c0 5.55 3.84 10 9 10s9-4.45 9-10V7l-10-5z"/>
        <path d="M8 11h8l-4 4-4-4z"/>
      </svg>
    ),
    feature: 'automation',
    requiresRole: ['admin', 'manager'],
    description: 'Workflow automation and triggers'
  },
  {
    name: 'Analytics',
    href: '/dashboard/analytics',
    icon: ({ className }: { className?: string }) => (
      <svg className={className} fill="currentColor" viewBox="0 0 24 24">
        <path d="M3 3v18h18v-2H5V3H3zm16 5h-2v8h2v-8zm-4-3h-2v11h2V5zm-4 6h-2v5h2v-5z"/>
      </svg>
    ),
    feature: 'analytics',
    requiresRole: ['admin', 'manager'],
    description: 'Advanced reporting and insights'
  },
  {
    name: 'Integrations',
    href: '/dashboard/integrations',
    icon: Zap,
    feature: 'integrations',
    requiresRole: ['admin', 'manager'],
    description: 'Slack and Teams integrations'
  },
  {
    name: 'Payroll Export',
    href: '/dashboard/payroll',
    icon: ({ className }: { className?: string }) => (
      <svg className={className} fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
      </svg>
    ),
    feature: 'payroll',
    requiresRole: ['admin'],
    description: 'Payroll generation and export'
  },
]


// Modern Sidebar Navigation Component
function SidebarNav({ navigation, pathname, mobile = false }: { 
  navigation: typeof allNavigation, 
  pathname: string,
  mobile?: boolean 
}) {
  return (
    <nav className="space-y-1 px-3">
      {navigation.map((item) => {
        const isActive = pathname === item.href
        return (
          <Link
            key={item.name}
            href={item.href}
            className={`
              group flex items-center px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200
              ${isActive 
                ? 'bg-blue-600 text-white shadow-sm' 
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/50'
              }
              ${mobile ? 'text-base py-3' : ''}
            `}
          >
            <item.icon 
              className={`
                flex-shrink-0 h-5 w-5 mr-3 transition-colors
                ${isActive ? 'text-white' : 'text-gray-600 group-hover:text-gray-900'}
                ${mobile ? 'h-6 w-6' : ''}
              `} 
            />
            <div className="flex-1 min-w-0">
              <div className="font-medium">{item.name}</div>
              {!mobile && (
                <div className={`text-xs mt-0.5 truncate ${
                  isActive 
                    ? 'text-blue-100' 
                    : 'text-gray-600 group-hover:text-gray-700'
                }`}>
                  {item.description}
                </div>
              )}
            </div>
            {isActive && (
              <div className="w-2 h-2 bg-white rounded-full ml-2" />
            )}
          </Link>
        )
      })}
    </nav>
  )
}

// Logo Brand Component
function LogoBrand({ organization, className = "" }: { organization: any, className?: string }) {
  return (
    <Link href="/dashboard" className={`flex items-center group ${className}`}>
      {organization?.logo_url ? (
        <div className="h-8 w-8 rounded-lg flex items-center justify-center overflow-hidden bg-white border border-gray-200 hover:shadow-lg transition-all">
          <img 
            src={organization.logo_url} 
            alt="Company Logo" 
            className="h-full w-full object-contain"
          />
        </div>
      ) : (
        <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center hover:shadow-lg transition-all">
          <Users className="h-5 w-5 text-white" />
        </div>
      )}
      <span className="ml-3 text-xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
        {organization?.name || 'WorkforceOne'}
      </span>
    </Link>
  )
}

// User Profile Component
function UserProfile({ profile }: { profile: any }) {
  const router = useRouter()
  const supabase = createClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <HeadlessMenu as="div" className="relative">
      <HeadlessMenu.Button className="flex items-center w-full px-3 py-2 text-sm text-left rounded-xl hover:bg-gray-100/50 transition-colors group">
        <div className="flex items-center w-full">
          <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
            <User className="h-4 w-4 text-blue-600" />
          </div>
          <div className="ml-3 flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {profile?.full_name || 'User'}
            </p>
            <p className="text-xs text-gray-600 truncate">
              {profile?.role || 'Member'}
            </p>
          </div>
          <ChevronDown className="h-4 w-4 text-gray-600 group-hover:text-gray-900" />
        </div>
      </HeadlessMenu.Button>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <HeadlessMenu.Items className="absolute bottom-full left-0 right-0 mb-2 bg-white border border-gray-200 rounded-xl shadow-lg py-2 z-10">
          <HeadlessMenu.Item>
            {({ active }) => (
              <Link
                href="/dashboard/settings"
                className={`
                  flex items-center px-3 py-2 text-sm transition-colors
                  ${active ? 'bg-gray-100 text-gray-900' : 'text-gray-900'}
                `}
              >
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Link>
            )}
          </HeadlessMenu.Item>
          <HeadlessMenu.Item>
            {({ active }) => (
              <button
                onClick={handleSignOut}
                className={`
                  flex items-center w-full px-3 py-2 text-sm transition-colors
                  ${active ? 'bg-gray-100 text-gray-900' : 'text-gray-900'}
                `}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign out
              </button>
            )}
          </HeadlessMenu.Item>
        </HeadlessMenu.Items>
      </Transition>
    </HeadlessMenu>
  )
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [organization, setOrganization] = useState<any>(null)
  const pathname = usePathname()
  const featureFlags = useFeatureFlags()
  const supabase = createClient()

  // Filter navigation based on feature flags and user role (wait for loading to complete)
  const enabledNavigation = featureFlags?.isLoading ? 
    [] : // Show empty navigation while loading
    allNavigation.filter(item => {
      // Check feature flag
      const hasFeature = featureFlags.featureFlags[item.feature] !== false
      
      // Check role requirement if specified
      if (item.requiresRole && userProfile) {
        const hasRole = item.requiresRole.includes(userProfile.role)
        return hasFeature && hasRole
      }
      
      return hasFeature
    })

  // Filter advanced navigation
  const enabledAdvancedNavigation = featureFlags?.isLoading ? 
    [] : 
    advancedNavigation.filter(item => {
      // Check role requirement for advanced features
      if (item.requiresRole && userProfile) {
        return item.requiresRole.includes(userProfile.role)
      }
      return false
    })

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single()
          
          setUserProfile(profile)

          // Fetch organization data for logo
          if (profile?.organization_id) {
            const { data: orgData } = await supabase
              .from('organizations')
              .select('*')
              .eq('id', profile.organization_id)
              .single()
            
            setOrganization(orgData)
          }
        }
      } catch (error) {
        console.error('Error fetching profile:', error)
      } finally {
        // Loading complete
      }
    }

    fetchProfile()
  }, [supabase])

  return (
    <div className="flex h-full bg-background">
      {/* Mobile sidebar */}
      <Transition.Root show={sidebarOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50 lg:hidden" onClose={setSidebarOpen}>
          <Transition.Child
            as={Fragment}
            enter="transition-opacity ease-linear duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity ease-linear duration-300"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-background/80 backdrop-blur-sm" />
          </Transition.Child>

          <div className="fixed inset-0 flex">
            <Transition.Child
              as={Fragment}
              enter="transition ease-in-out duration-300 transform"
              enterFrom="-translate-x-full"
              enterTo="translate-x-0"
              leave="transition ease-in-out duration-300 transform"
              leaveFrom="translate-x-0"
              leaveTo="-translate-x-full"
            >
              <Dialog.Panel className="relative mr-16 flex w-full max-w-xs flex-1">
                <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white border-r border-gray-200 px-6 pb-4">
                  <div className="flex h-16 shrink-0 items-center justify-between">
                    <LogoBrand organization={organization} />
                    <button
                      type="button"
                      className="-m-2.5 p-2.5 text-gray-600 hover:text-gray-900"
                      onClick={() => setSidebarOpen(false)}
                    >
                      <X className="h-6 w-6" />
                    </button>
                  </div>
                  <nav className="flex flex-1 flex-col">
                    <SidebarNav navigation={enabledNavigation} pathname={pathname} mobile />
                    {enabledAdvancedNavigation.length > 0 && (
                      <div className="mt-6 space-y-1">
                        <div className="px-3 py-2">
                          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            Advanced Features
                          </h3>
                        </div>
                        <SidebarNav navigation={enabledAdvancedNavigation} pathname={pathname} mobile />
                      </div>
                    )}
                    <div className="mt-auto pt-6 border-t border-border">
                      {userProfile && <UserProfile profile={userProfile} />}
                    </div>
                  </nav>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition.Root>

      {/* Static sidebar for desktop */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white/95 backdrop-blur-sm border-r border-gray-200 px-6 pb-4">
          <div className="flex h-16 shrink-0 items-center">
            <LogoBrand organization={organization} />
          </div>
          <nav className="flex flex-1 flex-col gap-y-7">
            <SidebarNav navigation={enabledNavigation} pathname={pathname} />
            {enabledAdvancedNavigation.length > 0 && (
              <div className="space-y-1">
                <div className="px-3 py-2">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Advanced Features
                  </h3>
                </div>
                <SidebarNav navigation={enabledAdvancedNavigation} pathname={pathname} />
              </div>
            )}
            <div className="mt-auto space-y-4">
              <div className="border-t border-border pt-4">
                {userProfile && <UserProfile profile={userProfile} />}
              </div>
            </div>
          </nav>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-72 flex flex-1 flex-col">
        {/* Top bar */}
        <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white/80 backdrop-blur-sm px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
          <button
            type="button"
            className="-m-2.5 p-2.5 text-gray-600 lg:hidden hover:text-gray-900"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>

          {/* Separator */}
          <div className="h-6 w-px bg-gray-300 lg:hidden" />

          <div className="flex flex-1 items-center justify-between">
            {/* Search */}
            <div className="flex flex-1 justify-center lg:justify-start">
              <div className="w-full max-w-lg">
                <label htmlFor="search" className="sr-only">Search</label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Search className="h-5 w-5 text-gray-500" />
                  </div>
                  <input
                    id="search"
                    name="search"
                    className="block w-full rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-3 text-sm placeholder:text-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    placeholder="Search..."
                    type="search"
                  />
                </div>
              </div>
            </div>

            {/* Right side */}
            <div className="flex items-center gap-x-4 lg:gap-x-6">
              <NotificationSystem />
              
              <Button variant="ghost" size="sm" asChild className="lg:hidden">
                <Link href="/dashboard/settings">
                  <Settings className="h-5 w-5" />
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto">
          <div className="px-4 py-8 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>

    </div>
  )
}