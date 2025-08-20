'use client';

import { useProductAccess } from '@/hooks/useProductAccess';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ProductSwitcher } from '@/components/navigation/ProductSwitcher';
import { RequireProduct } from '@/components/guards/RequireProduct';
import { 
  Users, Clock, Shield, Plus, 
  CheckSquare, FolderOpen, FileText, 
  Calendar, BarChart, Route, 
  AlertTriangle, Monitor, TrendingUp,
  Activity, Bell, Settings
} from 'lucide-react';

// Dashboard widgets for each product
function RemoteDashboard() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Remote Workforce</h1>
          <p className="text-gray-600">Manage your distributed team</p>
        </div>
        <Badge className="bg-blue-100 text-blue-800">
          <Users className="h-3 w-3 mr-1" />
          Remote
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Active Teams
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-gray-600">
              +2 from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Open Tasks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">84</div>
            <p className="text-xs text-gray-600">
              23 due this week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Projects
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">7</div>
            <p className="text-xs text-gray-600">
              3 on track
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Forms Completed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">156</div>
            <p className="text-xs text-green-600">
              +12% this week
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Tasks</CardTitle>
            <CardDescription>Latest task activity</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <CheckSquare className="h-4 w-4 text-blue-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Complete client presentation</p>
                  <p className="text-xs text-gray-600">Due tomorrow</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <CheckSquare className="h-4 w-4 text-green-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Review quarterly reports</p>
                  <p className="text-xs text-gray-600">Completed</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Team Performance</CardTitle>
            <CardDescription>Team productivity metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Task completion rate</span>
                <span className="text-sm font-medium">87%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">On-time delivery</span>
                <span className="text-sm font-medium">92%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function TimeDashboard() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Time Tracking</h1>
          <p className="text-gray-600">Monitor attendance and time</p>
        </div>
        <Badge className="bg-green-100 text-green-800">
          <Clock className="h-3 w-3 mr-1" />
          Time
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Present Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">23/25</div>
            <p className="text-xs text-gray-600">
              92% attendance rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Hours This Week
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">892</div>
            <p className="text-xs text-gray-600">
              180 hours remaining
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Leave Requests
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">5</div>
            <p className="text-xs text-gray-600">
              2 pending approval
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Overtime Hours
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24</div>
            <p className="text-xs text-red-600">
              +8 from last week
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Today's Activity</CardTitle>
            <CardDescription>Current status overview</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Activity className="h-4 w-4 text-green-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Team clocked in</p>
                  <p className="text-xs text-gray-600">23 of 25 members</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="h-4 w-4 text-blue-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Average clock-in time</p>
                  <p className="text-xs text-gray-600">8:15 AM</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Weekly Trends</CardTitle>
            <CardDescription>Attendance patterns</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Monday</span>
                <span className="text-sm font-medium">96%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Tuesday</span>
                <span className="text-sm font-medium">94%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Wednesday</span>
                <span className="text-sm font-medium">92%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function GuardDashboard() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Security Operations</h1>
          <p className="text-gray-600">Monitor security activities</p>
        </div>
        <Badge className="bg-orange-100 text-orange-800">
          <Shield className="h-3 w-3 mr-1" />
          Guard
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Active Patrols
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-gray-600">
              12 routes covered
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Checkpoints Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">156</div>
            <p className="text-xs text-green-600">
              +5% from yesterday
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Open Incidents
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-red-600">
              2 high priority
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Guards On Duty
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12/15</div>
            <p className="text-xs text-gray-600">
              80% coverage
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Incidents</CardTitle>
            <CardDescription>Latest security events</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Unauthorized access attempt</p>
                  <p className="text-xs text-gray-600">Building A - 2 hours ago</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Monitor className="h-4 w-4 text-yellow-600" />
                <div className="flex-1">
                  <p className="text-sm font-medium">Camera malfunction</p>
                  <p className="text-xs text-gray-600">Parking lot - 4 hours ago</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Patrol Status</CardTitle>
            <CardDescription>Current patrol overview</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Routes completed</span>
                <span className="text-sm font-medium">8/12</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Response time avg</span>
                <span className="text-sm font-medium">4.2 min</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Coverage efficiency</span>
                <span className="text-sm font-medium">94%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function CombinedDashboard() {
  const { products } = useProductAccess();
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">WorkforceOne Suite</h1>
          <p className="text-gray-600">Unified workspace overview</p>
        </div>
        <div className="flex items-center gap-2">
          {products.map(product => (
            <Badge 
              key={product.id} 
              style={{ 
                backgroundColor: product.color_theme + '20',
                color: product.color_theme,
                borderColor: product.color_theme + '50'
              }}
            >
              {product.display_name}
            </Badge>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {products.map(product => (
          <Card key={product.id}>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div 
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: product.color_theme + '20' }}
                >
                  {product.code === 'remote' && <Users className="h-4 w-4" style={{ color: product.color_theme }} />}
                  {product.code === 'time' && <Clock className="h-4 w-4" style={{ color: product.color_theme }} />}
                  {product.code === 'guard' && <Shield className="h-4 w-4" style={{ color: product.color_theme }} />}
                </div>
                <div>
                  <CardTitle className="text-lg">{product.display_name}</CardTitle>
                  <CardDescription>{product.description}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {product.code === 'remote' && (
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span>Active Teams</span>
                    <span className="font-medium">12</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Open Tasks</span>
                    <span className="font-medium">84</span>
                  </div>
                  <Button size="sm" className="w-full" style={{ backgroundColor: product.color_theme }}>
                    View Remote Dashboard
                  </Button>
                </div>
              )}
              {product.code === 'time' && (
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span>Present Today</span>
                    <span className="font-medium">23/25</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Hours This Week</span>
                    <span className="font-medium">892</span>
                  </div>
                  <Button size="sm" className="w-full" style={{ backgroundColor: product.color_theme }}>
                    View Time Dashboard
                  </Button>
                </div>
              )}
              {product.code === 'guard' && (
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span>Active Patrols</span>
                    <span className="font-medium">8</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Open Incidents</span>
                    <span className="font-medium">3</span>
                  </div>
                  <Button size="sm" className="w-full" style={{ backgroundColor: product.color_theme }}>
                    View Security Dashboard
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks across all products</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button variant="outline" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Team Member
            </Button>
            <Button variant="outline" className="flex items-center gap-2">
              <CheckSquare className="h-4 w-4" />
              Create Task
            </Button>
            <Button variant="outline" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Clock In/Out
            </Button>
            <Button variant="outline" className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Report Incident
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function ProductDashboard() {
  const { products, loading, hasAnyAccess } = useProductAccess();
  const searchParams = useSearchParams();
  const currentProduct = searchParams.get('product');

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!hasAnyAccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] p-8">
        <Shield className="h-16 w-16 text-gray-400 mb-4" />
        <h2 className="text-2xl font-bold text-gray-600 mb-2">
          No Products Available
        </h2>
        <p className="text-gray-500 text-center mb-6 max-w-md">
          You don't have access to any WorkforceOne products yet. 
          Contact your administrator or view available plans.
        </p>
        <div className="flex gap-3">
          <Button>
            View Plans
          </Button>
          <Button variant="outline">
            Contact Support
          </Button>
        </div>
      </div>
    );
  }

  // Show product-specific dashboard if specified in URL
  if (currentProduct) {
    if (currentProduct === 'remote' && products.some(p => p.code === 'remote')) {
      return (
        <RequireProduct product="remote">
          <RemoteDashboard />
        </RequireProduct>
      );
    }
    if (currentProduct === 'time' && products.some(p => p.code === 'time')) {
      return (
        <RequireProduct product="time">
          <TimeDashboard />
        </RequireProduct>
      );
    }
    if (currentProduct === 'guard' && products.some(p => p.code === 'guard')) {
      return (
        <RequireProduct product="guard">
          <GuardDashboard />
        </RequireProduct>
      );
    }
  }

  // Show combined dashboard for multiple products
  if (products.length > 1) {
    return <CombinedDashboard />;
  }

  // Show single product dashboard
  const singleProduct = products[0];
  if (singleProduct.code === 'remote') {
    return <RemoteDashboard />;
  }
  if (singleProduct.code === 'time') {
    return <TimeDashboard />;
  }
  if (singleProduct.code === 'guard') {
    return <GuardDashboard />;
  }

  return <CombinedDashboard />;
}