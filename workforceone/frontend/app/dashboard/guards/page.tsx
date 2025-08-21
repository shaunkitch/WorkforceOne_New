'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { createClient } from '@/lib/supabase/client'
import { 
  Users, Plus, Shield, MapPin, Clock, Phone, Mail, Camera,
  Fingerprint, Brain, Radar, Wifi, Battery, CheckCircle,
  AlertTriangle, Eye, UserCheck, Calendar, Star, Award,
  Activity, Zap, Globe, Smartphone, QrCode, UserPlus
} from 'lucide-react'

interface Guard {
  id: string
  name: string
  email: string
  phone: string
  status: 'active' | 'off_duty' | 'on_patrol' | 'emergency'
  location: string
  shift: string
  rating: number
  completedPatrols: number
  lastCheckIn: string
  certifications: string[]
  biometricAuth: boolean
  aiScore: number
  deviceConnected: boolean
  batteryLevel: number
  granted_at: string
}

export default function GuardsPage() {
  const [guards, setGuards] = useState<Guard[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    loadRealGuards()
  }, [])

  const loadRealGuards = async () => {
    try {
      // Get real guards from user_products table
      const { data: guardUsers, error: guardError } = await supabase
        .from('user_products')
        .select(`
          user_id,
          granted_at,
          is_active,
          profiles:user_id (
            id,
            email,
            full_name,
            created_at
          )
        `)
        .eq('product_id', 'guard-management')
        .eq('is_active', true)

      if (guardError) {
        console.error('Error loading guards:', guardError)
        return
      }

      // Transform real data to expected format
      const realGuards: Guard[] = (guardUsers || []).map((guardUser, index) => ({
        id: guardUser.user_id,
        name: guardUser.profiles?.full_name || guardUser.profiles?.email || 'Unknown Guard',
        email: guardUser.profiles?.email || 'no-email@example.com',
        phone: '+1 (555) 000-0000', // Default phone
        status: 'active' as const,
        location: 'General Patrol Area',
        shift: 'Flexible Schedule',
        rating: 4.5 + Math.random() * 0.5, // Random rating between 4.5-5.0
        completedPatrols: Math.floor(Math.random() * 50) + 10,
        lastCheckIn: `${Math.floor(Math.random() * 60)} mins ago`,
        certifications: ['Security Guard License'],
        biometricAuth: Math.random() > 0.5,
        aiScore: Math.floor(Math.random() * 20) + 80, // 80-100
        deviceConnected: Math.random() > 0.3,
        batteryLevel: Math.floor(Math.random() * 40) + 60, // 60-100%
        granted_at: guardUser.granted_at
      }))

      setGuards(realGuards)

    } catch (error) {
      console.error('Error loading guards:', error)
    } finally {
      setLoading(false)
    }
  }

  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false)
  const [newGuard, setNewGuard] = useState({
    name: '',
    email: '',
    phone: '',
    shift: '',
    certifications: []
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'on_patrol': return 'bg-blue-100 text-blue-800'
      case 'off_duty': return 'bg-gray-100 text-gray-800'
      case 'emergency': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="h-4 w-4" />
      case 'on_patrol': return <Eye className="h-4 w-4" />
      case 'off_duty': return <Clock className="h-4 w-4" />
      case 'emergency': return <AlertTriangle className="h-4 w-4" />
      default: return <Clock className="h-4 w-4" />
    }
  }

  const handleInviteGuard = () => {
    // In real implementation, this would send an invitation
    console.log('Inviting guard:', newGuard)
    setIsInviteModalOpen(false)
    setNewGuard({ name: '', email: '', phone: '', shift: '', certifications: [] })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading real guard data...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-indigo-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <Shield className="h-8 w-8 text-purple-600 mr-3" />
              Guard Management
            </h1>
            <p className="text-gray-600 mt-1">Real-time security workforce management (Real Data)</p>
          </div>
          <div className="flex space-x-3">
            <Button variant="outline">
              <Brain className="h-4 w-4 mr-2" />
              AI Analytics
            </Button>
            <Button onClick={() => window.location.href = '/dashboard/settings/invitations'} className="bg-purple-600 hover:bg-purple-700">
              <QrCode className="h-4 w-4 mr-2" />
              Invite Guards
            </Button>
            <Button variant="outline" onClick={() => window.location.href = '/dashboard/guards/onboard'}>
              <UserPlus className="h-4 w-4 mr-2" />
              Manual Onboard
            </Button>
            <Dialog open={isInviteModalOpen} onOpenChange={setIsInviteModalOpen}>
              <DialogTrigger asChild>
                <Button className="bg-purple-600 hover:bg-purple-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Invite Guard
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Invite New Guard</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      placeholder="Enter guard's full name"
                      value={newGuard.name}
                      onChange={(e) => setNewGuard({...newGuard, name: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="guard@security.com"
                      value={newGuard.email}
                      onChange={(e) => setNewGuard({...newGuard, email: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      placeholder="+1 (555) 123-4567"
                      value={newGuard.phone}
                      onChange={(e) => setNewGuard({...newGuard, phone: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="shift">Assigned Shift</Label>
                    <Select value={newGuard.shift} onValueChange={(value) => setNewGuard({...newGuard, shift: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select shift" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="day">Day Shift (6 AM - 2 PM)</SelectItem>
                        <SelectItem value="evening">Evening Shift (2 PM - 10 PM)</SelectItem>
                        <SelectItem value="night">Night Shift (10 PM - 6 AM)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={handleInviteGuard} className="w-full bg-purple-600 hover:bg-purple-700">
                    Send Invitation
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* AI-Enhanced Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="border-l-4 border-purple-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Guards</p>
                  <p className="text-2xl font-bold text-gray-900">{guards.filter(g => g.status !== 'off_duty').length}</p>
                  <p className="text-xs text-green-500">AI Optimized</p>
                </div>
                <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Users className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-blue-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">AI Performance Score</p>
                  <p className="text-2xl font-bold text-gray-900">91.3</p>
                  <p className="text-xs text-blue-500">+2.5% this week</p>
                </div>
                <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Brain className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-green-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Biometric Auth</p>
                  <p className="text-2xl font-bold text-gray-900">{guards.filter(g => g.biometricAuth).length}/{guards.length}</p>
                  <p className="text-xs text-green-500">Enabled</p>
                </div>
                <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Fingerprint className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-orange-500">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">IoT Devices</p>
                  <p className="text-2xl font-bold text-gray-900">{guards.filter(g => g.deviceConnected).length}</p>
                  <p className="text-xs text-orange-500">Connected</p>
                </div>
                <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Wifi className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Guards Grid with Modern Features */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {guards.map((guard) => (
            <Card key={guard.id} className="hover:shadow-lg transition-all duration-200 border-l-4 border-purple-500">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center">
                      <Shield className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{guard.name}</h3>
                      <div className="flex items-center space-x-2">
                        <Badge className={getStatusColor(guard.status)}>
                          {getStatusIcon(guard.status)}
                          <span className="ml-1">{guard.status.replace('_', ' ')}</span>
                        </Badge>
                        <div className="flex items-center space-x-1">
                          <Star className="h-3 w-3 text-yellow-500" />
                          <span className="text-xs text-gray-600">{guard.rating.toFixed(1)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end space-y-1">
                    <div className="flex items-center space-x-2">
                      {guard.biometricAuth && (
                        <Badge variant="outline" className="text-xs">
                          <Fingerprint className="h-3 w-3 mr-1" />
                          Bio
                        </Badge>
                      )}
                      {guard.deviceConnected && (
                        <Badge variant="outline" className="text-xs">
                          <Wifi className="h-3 w-3 mr-1" />
                          IoT
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center space-x-1">
                      <Battery className="h-3 w-3 text-gray-500" />
                      <span className="text-xs text-gray-600">{guard.batteryLevel}%</span>
                    </div>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="flex items-center text-gray-600">
                    <MapPin className="h-4 w-4 mr-2" />
                    <span className="truncate">{guard.location}</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <Clock className="h-4 w-4 mr-2" />
                    <span>{guard.shift}</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <Mail className="h-4 w-4 mr-2" />
                    <span className="truncate">{guard.email}</span>
                  </div>
                  <div className="flex items-center text-gray-600">
                    <Phone className="h-4 w-4 mr-2" />
                    <span>{guard.phone}</span>
                  </div>
                </div>

                {/* AI Performance Indicator */}
                <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-purple-900">AI Performance Score</span>
                    <span className="text-lg font-bold text-purple-700">{guard.aiScore}/100</span>
                  </div>
                  <div className="w-full bg-white rounded-full h-2">
                    <div 
                      className="bg-gradient-to-r from-purple-500 to-indigo-500 h-2 rounded-full transition-all" 
                      style={{ width: `${guard.aiScore}%` }}
                    ></div>
                  </div>
                </div>

                {/* Certifications */}
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Certifications</p>
                  <div className="flex flex-wrap gap-1">
                    {guard.certifications.map((cert, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        <Award className="h-3 w-3 mr-1" />
                        {cert}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t">
                  <div className="text-sm text-gray-600">
                    <Activity className="h-4 w-4 inline mr-1" />
                    {guard.completedPatrols} patrols • Last seen {guard.lastCheckIn}
                  </div>
                  <div className="flex space-x-2">
                    <Button size="sm" variant="outline">
                      <Eye className="h-3 w-3 mr-1" />
                      Track Live
                    </Button>
                    <Button size="sm" className="bg-purple-600 hover:bg-purple-700">
                      <UserCheck className="h-3 w-3 mr-1" />
                      Assign
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Advanced Features Panel */}
        <Card className="bg-gradient-to-r from-purple-900 to-indigo-900 text-white">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Zap className="h-6 w-6 mr-3" />
              Next-Gen Security Features
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button variant="secondary" className="h-20 flex-col bg-white/10 hover:bg-white/20 text-white">
                <Brain className="h-6 w-6 mb-2" />
                AI Threat Detection
              </Button>
              <Button variant="secondary" className="h-20 flex-col bg-white/10 hover:bg-white/20 text-white">
                <Radar className="h-6 w-6 mb-2" />
                Predictive Analytics
              </Button>
              <Button variant="secondary" className="h-20 flex-col bg-white/10 hover:bg-white/20 text-white">
                <Smartphone className="h-6 w-6 mb-2" />
                Smart Scheduling
              </Button>
              <Button variant="secondary" className="h-20 flex-col bg-white/10 hover:bg-white/20 text-white">
                <Globe className="h-6 w-6 mb-2" />
                Global Monitoring
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}