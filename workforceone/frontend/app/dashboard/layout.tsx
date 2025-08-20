// ===================================
// app/dashboard/layout.tsx - Modern Dashboard Layout
// ===================================
'use client'

import { useState, useEffect, Fragment, useCallback, useMemo, memo } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useProductAccess } from '@/hooks/useProductAccess'
import { Dialog, Transition, Menu as HeadlessMenu } from '@headlessui/react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Home, Clock, Calendar, Users, Briefcase, CheckSquare,
  FileText, Settings, LogOut, Menu, X, ChevronDown,
  ClipboardList, MapPin, Building, Bell, Search,
  User, UserCheck, Zap, Route, ChevronRight,
  BarChart3, Cog, UserPlus, FolderOpen, Phone, Shield,
  AlertTriangle, Monitor
} from 'lucide-react'
import NotificationSystem from '@/components/notifications/NotificationSystem'
import { ThemeProvider } from '@/components/theme-provider'

// Product-specific navigation groups
const PRODUCT_NAVIGATION = {
  remote: [
    {
      name: 'Remote Dashboard',
      items: [
        { 
          name: 'Overview', 
          href: '/dashboard/remote', 
          icon: Home, 
          description: 'Remote workforce overview'
        }
      ]
    },
    {
      name: 'Team Management',
      icon: Users,
      items: [
        { 
          name: 'Teams', 
          href: '/dashboard/teams', 
          icon: Users, 
          description: 'Team management and structure'
        },
        { 
          name: 'Tasks', 
          href: '/dashboard/tasks', 
          icon: CheckSquare, 
          description: 'Task assignments and progress'
        },
        { 
          name: 'Projects', 
          href: '/dashboard/projects', 
          icon: Briefcase, 
          description: 'Project tracking and management'
        }
      ]
    },
    {
      name: 'Operations',
      icon: Route,
      items: [
        { 
          name: 'Routes', 
          href: '/dashboard/routes', 
          icon: Route, 
          description: 'Route optimization and planning'
        },
        { 
          name: 'Forms', 
          href: '/dashboard/forms', 
          icon: ClipboardList, 
          description: 'Dynamic form builder and responses'
        },
        { 
          name: 'Outlets', 
          href: '/dashboard/outlets', 
          icon: Building, 
          description: 'Manage office locations'
        }
      ]
    }
  ],
  time: [
    {
      name: 'Time Dashboard',
      items: [
        { 
          name: 'Overview', 
          href: '/dashboard/time', 
          icon: Home, 
          description: 'Time tracking overview'
        }
      ]
    },
    {
      name: 'Time Tracking',
      icon: Clock,
      items: [
        { 
          name: 'Time Tracker', 
          href: '/dashboard/time-tracker', 
          icon: Clock, 
          description: 'Clock in and track time'
        },
        { 
          name: 'Attendance', 
          href: '/dashboard/attendance', 
          icon: Calendar, 
          description: 'Check-in and attendance records'
        },
        { 
          name: 'Shifts', 
          href: '/dashboard/shifts', 
          icon: Calendar, 
          description: 'Shift management'
        }
      ]
    },
    {
      name: 'Leave Management',
      icon: FileText,
      items: [
        { 
          name: 'Leave Requests', 
          href: '/dashboard/leave', 
          icon: FileText, 
          description: 'Time off requests and approvals'
        },
        { 
          name: 'Payroll', 
          href: '/dashboard/payroll', 
          icon: BarChart3, 
          description: 'Time and payroll reports'
        }
      ]
    }
  ],
  guard: [
    {
      name: 'Security Dashboard',
      items: [
        { 
          name: 'Overview', 
          href: '/dashboard/guard', 
          icon: Home, 
          description: 'Security overview'
        }
      ]
    },
    {
      name: 'Patrol Operations',
      icon: Shield,
      items: [
        { 
          name: 'Patrols', 
          href: '/dashboard/patrols', 
          icon: Shield, 
          description: 'Active patrols and routes'
        },
        { 
          name: 'Patrol Routes', 
          href: '/dashboard/security/routes', 
          icon: Route, 
          description: 'Manage patrol routes & checkpoints'
        },
        { 
          name: 'Checkpoints', 
          href: '/dashboard/checkpoints', 
          icon: Monitor, 
          description: 'QR code checkpoints'
        }
      ]
    },
    {
      name: 'Incident Management',
      icon: AlertTriangle,
      items: [
        { 
          name: 'Incidents', 
          href: '/dashboard/incidents', 
          icon: AlertTriangle, 
          description: 'Incident reports'
        },
        { 
          name: 'Live Monitor', 
          href: '/dashboard/monitoring', 
          icon: Monitor, 
          description: 'Real-time security monitoring'
        },
        { 
          name: 'Security Map', 
          href: '/dashboard/security/map', 
          icon: MapPin, 
          description: 'Real-time operations map'
        }
      ]
    },
    {
      name: 'Guard Management',
      icon: Users,
      items: [
        { 
          name: 'Guards', 
          href: '/dashboard/guards', 
          icon: Users, 
          description: 'Guard scheduling and management'
        }
      ]
    }
  ]
}

// Generate navigation groups based on user's product access
function getNavigationForProducts(products: any[]) {
  const navigationGroups = [];
  
  // Always add main dashboard
  navigationGroups.push({
    name: 'Dashboard',
    items: [
      { 
        name: 'Overview', 
        href: '/dashboard', 
        icon: Home, 
        description: 'Main dashboard overview'
      }
    ]
  });

  // Add navigation for each product the user has access to
  products.forEach(product => {
    const productNav = PRODUCT_NAVIGATION[product.code as keyof typeof PRODUCT_NAVIGATION];
    if (productNav) {
      navigationGroups.push(...productNav);
    }
  });

  return navigationGroups;
}

// Shared navigation items (always available)
const SHARED_ROUTES = [
  { 
    name: 'Settings', 
    href: '/dashboard/settings', 
    icon: Settings,
    description: 'Account and organization settings'
  }
]


// Product-Based Sidebar Navigation Component
function ProductBasedSidebarNav({ 
  products,
  pathname, 
  mobile = false
}: { 
  products: any[],
  pathname: string,
  mobile?: boolean
}) {
  // Generate navigation based on products
  const navigationGroups = getNavigationForProducts(products);
  
  const [expandedGroups, setExpandedGroups] = useState<string[]>([
    'Dashboard', 'Team Management', 'Time Tracking', 'Patrol Operations', 'Incident Management'
  ])

  const toggleGroup = (groupName: string) => {
    setExpandedGroups(prev => 
      prev.includes(groupName) 
        ? prev.filter(g => g !== groupName)
        : [...prev, groupName]
    )
  }

  return (
    <nav className="space-y-2 px-3">
      {navigationGroups.map((group) => {
        const isExpanded = expandedGroups.includes(group.name)
        const hasIcon = group.icon

        return (
          <div key={group.name} className="space-y-1">
            {/* Group Header */}
            <button
              onClick={() => toggleGroup(group.name)}
              className={`
                w-full flex items-center justify-between px-3 py-2 text-sm font-semibold text-left rounded-lg
                transition-colors hover:bg-gray-100/50
                ${mobile ? 'text-base py-2.5' : 'text-xs'}
              `}
            >
              <div className="flex items-center">
                {hasIcon && (
                  <group.icon className={`flex-shrink-0 mr-2 text-gray-500 ${mobile ? 'h-5 w-5' : 'h-4 w-4'}`} />
                )}
                <span className="text-gray-700 uppercase tracking-wider">
                  {group.name}
                </span>
              </div>
              <ChevronRight 
                className={`h-4 w-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} 
              />
            </button>

            {/* Group Items */}
            {isExpanded && (
              <div className="space-y-0.5 ml-2">
                {group.items.map((item) => {
                  const isActive = pathname === item.href
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`
                        group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200
                        ${isActive 
                          ? 'bg-blue-600 text-white shadow-sm' 
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/50'
                        }
                        ${mobile ? 'text-base py-2.5' : ''}
                      `}
                    >
                      <item.icon 
                        className={`
                          flex-shrink-0 h-4 w-4 mr-3 transition-colors
                          ${isActive ? 'text-white' : 'text-gray-500 group-hover:text-gray-700'}
                          ${mobile ? 'h-5 w-5' : ''}
                        `} 
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium">{item.name}</div>
                        {!mobile && (
                          <div className={`text-xs mt-0.5 truncate ${
                            isActive 
                              ? 'text-white opacity-80' 
                              : 'text-gray-500 group-hover:text-gray-600'
                          }`}>
                            {item.description}
                          </div>
                        )}
                      </div>
                      {isActive && (
                        <div className="w-1.5 h-1.5 bg-white rounded-full ml-2" />
                      )}
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
      
      {/* Shared Routes */}
      <div className="pt-4 border-t border-gray-200">
        <div className="space-y-0.5">
          {SHARED_ROUTES.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`
                  group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200
                  ${isActive 
                    ? 'bg-gray-200 text-gray-900 shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/50'
                  }
                  ${mobile ? 'text-base py-2.5' : ''}
                `}
              >
                <item.icon 
                  className={`
                    flex-shrink-0 h-4 w-4 mr-3 transition-colors
                    ${isActive ? 'text-gray-900' : 'text-gray-500 group-hover:text-gray-700'}
                    ${mobile ? 'h-5 w-5' : ''}
                  `} 
                />
                <div className="flex-1 min-w-0">
                  <div className="font-medium">{item.name}</div>
                  {!mobile && (
                    <div className={`text-xs mt-0.5 truncate ${
                      isActive 
                        ? 'text-gray-700 opacity-80' 
                        : 'text-gray-500 group-hover:text-gray-600'
                    }`}>
                      {item.description}
                    </div>
                  )}
                </div>
              </Link>
            )
          })}
        </div>
      </div>
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
        <div className="h-8 w-8 bg-brand-primary rounded-lg flex items-center justify-center hover:shadow-lg transition-all">
          <Users className="h-5 w-5 text-white" />
        </div>
      )}
      <span className="ml-3 text-xl font-bold text-brand-primary">
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
          <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
            <User className="h-4 w-4 text-brand-primary" />
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
  const { products, loading: productLoading } = useProductAccess()
  const supabase = createClient()

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
    <ThemeProvider organizationId={userProfile?.organization_id}>
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
                    {productLoading ? (
                      <div className="space-y-2 px-3">
                        {Array.from({ length: 6 }).map((_, i) => (
                          <div key={i} className="animate-pulse bg-gray-200 h-10 w-full rounded" />
                        ))}
                      </div>
                    ) : (
                      <ProductBasedSidebarNav 
                        products={products}
                        pathname={pathname} 
                        mobile={true}
                      />
                    )}
                    <div className="mt-auto pt-6 border-t border-gray-200">
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
            {productLoading ? (
              <div className="space-y-2 px-3">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="animate-pulse bg-gray-200 h-10 w-full rounded" />
                ))}
              </div>
            ) : (
              <ProductBasedSidebarNav 
                products={products}
                pathname={pathname} 
                mobile={false}
              />
            )}
            <div className="mt-auto space-y-4">
              <div className="border-t border-gray-200 pt-4">
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
    </ThemeProvider>
  )
}