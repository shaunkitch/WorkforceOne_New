'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { hasProductAccess } from '@/lib/supabase'
import { 
  ArrowLeft, Shield, MapPin, Users, 
  Eye, CheckCircle, AlertCircle, Plus 
} from 'lucide-react'

export default function SitesPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const router = useRouter()

  useEffect(() => {
    checkAccess()
  }, [])

  const checkAccess = async () => {
    try {
      const hasAccess = await hasProductAccess('guard-management')
      if (!hasAccess) {
        setError("You don't have access to Guard Management")
        setLoading(false)
        return
      }
      setLoading(false)
    } catch (err) {
      setError('Failed to verify access')
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={() => router.push('/dashboard')}>Return to Dashboard</Button>
        </div>
      </div>
    )
  }

  const sites = [
    {
      id: 1,
      name: 'Downtown Office Complex',
      address: '123 Main St, Downtown',
      status: 'Active',
      guards: 4,
      coverage: 100,
      lastCheck: '2 hours ago',
      priority: 'High'
    },
    {
      id: 2,
      name: 'Warehouse District',
      address: '456 Industrial Ave',
      status: 'Active',
      guards: 2,
      coverage: 85,
      lastCheck: '30 minutes ago',
      priority: 'Medium'
    },
    {
      id: 3,
      name: 'Retail Plaza',
      address: '789 Shopping Center Dr',
      status: 'Maintenance',
      guards: 1,
      coverage: 50,
      lastCheck: '4 hours ago',
      priority: 'Low'
    },
    {
      id: 4,
      name: 'Corporate Headquarters',
      address: '321 Business Blvd',
      status: 'Active',
      guards: 6,
      coverage: 100,
      lastCheck: '15 minutes ago',
      priority: 'High'
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center space-x-4">
              <Button 
                variant="outline" 
                onClick={() => router.push('/guard-management/dashboard')}
                className="flex items-center"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div className="flex items-center space-x-3">
                <Shield className="h-8 w-8 text-purple-600" />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Security Sites</h1>
                  <p className="text-gray-600">Manage your security locations</p>
                </div>
              </div>
            </div>
            <Button className="bg-purple-600 hover:bg-purple-700">
              <Plus className="h-4 w-4 mr-2" />
              Add Site
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <MapPin className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-muted-foreground">Total Sites</p>
                  <p className="text-2xl font-bold">8</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-muted-foreground">Active Sites</p>
                  <p className="text-2xl font-bold">7</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-muted-foreground">Total Guards</p>
                  <p className="text-2xl font-bold">24</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Eye className="h-6 w-6 text-orange-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-muted-foreground">Coverage</p>
                  <p className="text-2xl font-bold">96%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sites Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {sites.map((site) => (
            <Card key={site.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{site.name}</CardTitle>
                  <Badge 
                    className={
                      site.status === 'Active' ? 'bg-green-100 text-green-800' :
                      site.status === 'Maintenance' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }
                  >
                    {site.status}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{site.address}</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-xl font-bold text-blue-600">{site.guards}</div>
                      <div className="text-xs text-muted-foreground">Guards</div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className="text-xl font-bold text-green-600">{site.coverage}%</div>
                      <div className="text-xs text-muted-foreground">Coverage</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Priority</span>
                    <Badge 
                      variant="outline"
                      className={
                        site.priority === 'High' ? 'border-red-200 text-red-700' :
                        site.priority === 'Medium' ? 'border-yellow-200 text-yellow-700' :
                        'border-green-200 text-green-700'
                      }
                    >
                      {site.priority}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Last Check</span>
                    <span className="font-medium">{site.lastCheck}</span>
                  </div>
                  
                  {site.status === 'Maintenance' && (
                    <div className="flex items-center space-x-2 p-3 bg-yellow-50 rounded-lg">
                      <AlertCircle className="h-4 w-4 text-yellow-600" />
                      <span className="text-sm text-yellow-800">
                        Site under maintenance - reduced coverage
                      </span>
                    </div>
                  )}
                  
                  <div className="flex space-x-2 pt-4">
                    <Button variant="outline" size="sm" className="flex-1">
                      <Eye className="h-4 w-4 mr-2" />
                      View
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1">
                      <MapPin className="h-4 w-4 mr-2" />
                      Map
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1">
                      <Users className="h-4 w-4 mr-2" />
                      Guards
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}