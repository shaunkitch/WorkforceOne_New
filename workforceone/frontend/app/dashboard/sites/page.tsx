'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Building, MapPin, Users, Clock, Shield, AlertTriangle,
  Plus, Search, Filter, Calendar, CheckCircle, 
  PhoneCall, DollarSign, Star, Activity
} from 'lucide-react'

interface Site {
  id: string
  name: string
  client: string
  address: string
  type: 'office' | 'retail' | 'warehouse' | 'residential' | 'hospital' | 'school'
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
  requiresCertifications: string[]
  contractValue: number
  guardsRequired: {
    day: number
    evening: number
    night: number
  }
  currentCoverage: {
    day: number
    evening: number
    night: number
  }
  emergencyContacts: Array<{
    name: string
    role: string
    phone: string
  }>
  specialInstructions: string
  status: 'active' | 'pending' | 'suspended'
  contractStart: string
  contractEnd: string
}

export default function SitesPage() {
  const [sites] = useState<Site[]>([
    {
      id: 'SITE-001',
      name: 'Downtown Financial Plaza',
      client: 'Metropolitan Bank Corp',
      address: '123 Financial District, Downtown',
      type: 'office',
      riskLevel: 'high',
      requiresCertifications: ['Security License', 'Armed Security', 'Executive Protection'],
      contractValue: 45000,
      guardsRequired: { day: 3, evening: 2, night: 2 },
      currentCoverage: { day: 3, evening: 2, night: 1 },
      emergencyContacts: [
        { name: 'Sarah Johnson', role: 'Facility Manager', phone: '+1 (555) 123-4567' },
        { name: 'Mike Chen', role: 'Security Director', phone: '+1 (555) 987-6543' }
      ],
      specialInstructions: 'VIP executive floors require armed security. Daily cash transport coordination.',
      status: 'active',
      contractStart: '2024-01-15',
      contractEnd: '2025-01-15'
    },
    {
      id: 'SITE-002',
      name: 'Westside Shopping Center',
      client: 'Retail Properties LLC',
      address: '456 Commerce Ave, West District',
      type: 'retail',
      riskLevel: 'medium',
      requiresCertifications: ['Security License', 'Crowd Control', 'Customer Service'],
      contractValue: 28000,
      guardsRequired: { day: 2, evening: 3, night: 1 },
      currentCoverage: { day: 2, evening: 3, night: 1 },
      emergencyContacts: [
        { name: 'Jennifer Lopez', role: 'Mall Manager', phone: '+1 (555) 456-7890' }
      ],
      specialInstructions: 'Weekend events require additional personnel. Lost child protocols active.',
      status: 'active',
      contractStart: '2024-03-01',
      contractEnd: '2025-03-01'
    },
    {
      id: 'SITE-003',
      name: 'Industrial Storage Facility',
      client: 'Logistics Solutions Inc',
      address: '789 Warehouse Blvd, Industrial Zone',
      type: 'warehouse',
      riskLevel: 'medium',
      requiresCertifications: ['Security License', 'Patrol Operations'],
      contractValue: 32000,
      guardsRequired: { day: 1, evening: 1, night: 2 },
      currentCoverage: { day: 1, evening: 0, night: 2 },
      emergencyContacts: [
        { name: 'Robert Davis', role: 'Operations Manager', phone: '+1 (555) 321-0987' }
      ],
      specialInstructions: 'Perimeter patrol every 2 hours. Truck access monitoring required.',
      status: 'active',
      contractStart: '2024-02-10',
      contractEnd: '2025-02-10'
    },
    {
      id: 'SITE-004',
      name: 'City General Hospital',
      client: 'City Health Services',
      address: '321 Medical Center Dr, Central',
      type: 'hospital',
      riskLevel: 'critical',
      requiresCertifications: ['Security License', 'De-escalation Training', 'Emergency Response'],
      contractValue: 65000,
      guardsRequired: { day: 4, evening: 4, night: 3 },
      currentCoverage: { day: 4, evening: 3, night: 3 },
      emergencyContacts: [
        { name: 'Dr. Maria Rodriguez', role: 'Chief of Security', phone: '+1 (555) 111-2222' },
        { name: 'Tom Wilson', role: 'Facilities Director', phone: '+1 (555) 333-4444' }
      ],
      specialInstructions: '24/7 ER coverage required. Code protocols for medical emergencies.',
      status: 'active',
      contractStart: '2024-01-01',
      contractEnd: '2025-12-31'
    }
  ])

  const [searchTerm, setSearchTerm] = useState('')
  const [selectedType, setSelectedType] = useState('all')
  const [selectedRisk, setSelectedRisk] = useState('all')

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'bg-green-100 text-green-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'high': return 'bg-orange-100 text-orange-800'
      case 'critical': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'suspended': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'office': return <Building className="h-4 w-4" />
      case 'retail': return <Star className="h-4 w-4" />
      case 'warehouse': return <Activity className="h-4 w-4" />
      case 'hospital': return <Shield className="h-4 w-4" />
      case 'school': return <Users className="h-4 w-4" />
      default: return <Building className="h-4 w-4" />
    }
  }

  const getCoverageStatus = (required: number, current: number) => {
    if (current >= required) return { status: 'full', color: 'text-green-600' }
    if (current > 0) return { status: 'partial', color: 'text-yellow-600' }
    return { status: 'empty', color: 'text-red-600' }
  }

  const filteredSites = sites.filter(site => {
    const matchesSearch = site.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         site.client.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = selectedType === 'all' || site.type === selectedType
    const matchesRisk = selectedRisk === 'all' || site.riskLevel === selectedRisk
    
    return matchesSearch && matchesType && matchesRisk
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-50">
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <Building className="h-8 w-8 text-purple-600 mr-3" />
              Site Management
            </h1>
            <p className="text-gray-600 mt-1">Manage client sites and security assignments</p>
          </div>
          <Button className="bg-purple-600 hover:bg-purple-700">
            <Plus className="h-4 w-4 mr-2" />
            Add New Site
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-64">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search sites or clients..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="office">Office Buildings</SelectItem>
                  <SelectItem value="retail">Retail Centers</SelectItem>
                  <SelectItem value="warehouse">Warehouses</SelectItem>
                  <SelectItem value="hospital">Hospitals</SelectItem>
                  <SelectItem value="school">Schools</SelectItem>
                </SelectContent>
              </Select>

              <Select value={selectedRisk} onValueChange={setSelectedRisk}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter by risk" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Risk Levels</SelectItem>
                  <SelectItem value="low">Low Risk</SelectItem>
                  <SelectItem value="medium">Medium Risk</SelectItem>
                  <SelectItem value="high">High Risk</SelectItem>
                  <SelectItem value="critical">Critical Risk</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Sites</p>
                  <p className="text-2xl font-bold text-gray-900">{sites.filter(s => s.status === 'active').length}</p>
                </div>
                <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Guards Required</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {sites.reduce((sum, site) => sum + site.guardsRequired.day + site.guardsRequired.evening + site.guardsRequired.night, 0)}
                  </p>
                </div>
                <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Users className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Coverage Gaps</p>
                  <p className="text-2xl font-bold text-red-600">
                    {sites.reduce((gaps, site) => {
                      const dayGap = Math.max(0, site.guardsRequired.day - site.currentCoverage.day)
                      const eveningGap = Math.max(0, site.guardsRequired.evening - site.currentCoverage.evening)
                      const nightGap = Math.max(0, site.guardsRequired.night - site.currentCoverage.night)
                      return gaps + dayGap + eveningGap + nightGap
                    }, 0)}
                  </p>
                </div>
                <div className="h-12 w-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Monthly Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">
                    ${(sites.reduce((sum, site) => sum + site.contractValue, 0) / 1000).toFixed(0)}k
                  </p>
                </div>
                <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sites List */}
        <div className="space-y-4">
          {filteredSites.map((site) => (
            <Card key={site.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <div className="h-10 w-10 bg-purple-100 rounded-lg flex items-center justify-center">
                        {getTypeIcon(site.type)}
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{site.name}</h3>
                        <p className="text-sm text-gray-600">{site.client}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 mr-1" />
                        {site.address}
                      </div>
                      <Badge className={getRiskColor(site.riskLevel)}>
                        {site.riskLevel.toUpperCase()} RISK
                      </Badge>
                      <Badge className={getStatusColor(site.status)}>
                        {site.status.toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-lg font-bold text-gray-900">${site.contractValue.toLocaleString()}/mo</div>
                    <div className="text-sm text-gray-600">Contract Value</div>
                  </div>
                </div>

                {/* Coverage Status */}
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <h4 className="font-medium text-gray-900 mb-3">Security Coverage</h4>
                  <div className="grid grid-cols-3 gap-4">
                    {['day', 'evening', 'night'].map((shift) => {
                      const required = site.guardsRequired[shift as keyof typeof site.guardsRequired]
                      const current = site.currentCoverage[shift as keyof typeof site.currentCoverage]
                      const coverage = getCoverageStatus(required, current)
                      
                      return (
                        <div key={shift} className="text-center">
                          <div className="text-sm font-medium text-gray-600 capitalize mb-1">
                            {shift} Shift
                          </div>
                          <div className={`text-lg font-bold ${coverage.color}`}>
                            {current}/{required}
                          </div>
                          <div className="text-xs text-gray-500">
                            {coverage.status === 'full' ? 'Full Coverage' :
                             coverage.status === 'partial' ? 'Understaffed' : 'No Coverage'}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Requirements */}
                <div className="mb-4">
                  <h4 className="font-medium text-gray-900 mb-2">Required Certifications</h4>
                  <div className="flex flex-wrap gap-1">
                    {site.requiresCertifications.map((cert, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {cert}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Special Instructions */}
                {site.specialInstructions && (
                  <div className="mb-4">
                    <h4 className="font-medium text-gray-900 mb-1">Special Instructions</h4>
                    <p className="text-sm text-gray-600">{site.specialInstructions}</p>
                  </div>
                )}

                {/* Emergency Contacts */}
                <div className="mb-4">
                  <h4 className="font-medium text-gray-900 mb-2">Emergency Contacts</h4>
                  <div className="space-y-1">
                    {site.emergencyContacts.map((contact, idx) => (
                      <div key={idx} className="flex items-center justify-between text-sm">
                        <span className="text-gray-900">{contact.name} - {contact.role}</span>
                        <a href={`tel:${contact.phone}`} className="text-purple-600 hover:underline flex items-center">
                          <PhoneCall className="h-3 w-3 mr-1" />
                          {contact.phone}
                        </a>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex space-x-2 pt-4 border-t">
                  <Button size="sm" variant="outline">
                    <Users className="h-3 w-3 mr-1" />
                    Assign Guards
                  </Button>
                  <Button size="sm" variant="outline">
                    <Calendar className="h-3 w-3 mr-1" />
                    Schedule
                  </Button>
                  <Button size="sm" variant="outline">
                    <MapPin className="h-3 w-3 mr-1" />
                    View Location
                  </Button>
                  <Button size="sm" className="bg-purple-600 hover:bg-purple-700">
                    Manage Site
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}